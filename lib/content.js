const PLACEHOLDER_PREFIX = '%%SAFE_TAG_';
const PLACEHOLDER_SUFFIX = '%%';

const escapeHtml = (value) => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const decodeHtmlEntities = (value) => {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
};

const getExcerptSource = (content) => {
  const withoutCodeBlocks = content.replace(/```[\s\S]*?```/g, ' ');
  const lines = withoutCodeBlocks
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => {
      return (
        line &&
        !line.startsWith('#') &&
        !line.match(/^[-*_]{3,}$/) &&
        !line.match(/^<\/?(div|section|article|aside)\b/i)
      );
    });

  return lines.join(' ');
};

const stripMarkdownLinks = (value) => {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
};

const canonicalizeAllowedHtml = (value) => {
  const safeTags = [];
  const withPlaceholders = value.replace(/<\/?(strong|b|em|i|code)\b[^>]*>|<br\s*\/?>/gi, (tag) => {
    const normalized = tag
      .replace(/^<b\b[^>]*>$/i, '<strong>')
      .replace(/^<\/b>$/i, '</strong>')
      .replace(/^<i\b[^>]*>$/i, '<em>')
      .replace(/^<\/i>$/i, '</em>')
      .replace(/^<strong\b[^>]*>$/i, '<strong>')
      .replace(/^<em\b[^>]*>$/i, '<em>')
      .replace(/^<code\b[^>]*>$/i, '<code>')
      .replace(/^<br\s*\/?>$/i, '<br>');
    const token = `${PLACEHOLDER_PREFIX}${safeTags.length}${PLACEHOLDER_SUFFIX}`;
    safeTags.push(normalized);
    return token;
  });

  return { withPlaceholders, safeTags };
};

const restoreAllowedHtml = (value, safeTags) => {
  return value.replace(new RegExp(`${PLACEHOLDER_PREFIX}(\\d+)${PLACEHOLDER_SUFFIX}`, 'g'), (_, index) => {
    return safeTags[Number(index)] || '';
  });
};

const applyInlineMarkdown = (value) => {
  return value
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
};

const truncateRichHtml = (html, maxLength) => {
  let textLength = 0;
  const openTags = [];
  let output = '';
  const parts = html.match(/<[^>]+>|[^<]+/g) || [];

  for (const part of parts) {
    if (part.startsWith('<')) {
      output += part;
      const openMatch = part.match(/^<(strong|em|code)>$/);
      const closeMatch = part.match(/^<\/(strong|em|code)>$/);

      if (openMatch) {
        openTags.push(openMatch[1]);
      } else if (closeMatch) {
        const index = openTags.lastIndexOf(closeMatch[1]);
        if (index !== -1) openTags.splice(index, 1);
      }
      continue;
    }

    const remaining = maxLength - textLength;
    if (remaining <= 0) break;

    const text = decodeHtmlEntities(part);
    if (text.length <= remaining) {
      output += part;
      textLength += text.length;
      continue;
    }

    output += escapeHtml(text.slice(0, remaining).trimEnd());
    textLength = maxLength;
    break;
  }

  [...openTags].reverse().forEach((tag) => {
    output += `</${tag}>`;
  });

  return output.trim();
};

const createRichExcerpt = (content, maxLength = 100) => {
  const source = stripMarkdownLinks(getExcerptSource(content));
  if (!source) return '';

  const { withPlaceholders, safeTags } = canonicalizeAllowedHtml(source);
  const escaped = escapeHtml(withPlaceholders);
  const withMarkdown = applyInlineMarkdown(escaped);
  const sanitized = restoreAllowedHtml(withMarkdown, safeTags)
    .replace(/\s+/g, ' ')
    .trim();
  const truncated = truncateRichHtml(sanitized, maxLength);

  return truncated ? `${truncated}...` : '';
};

const createPlainExcerpt = (content, maxLength = 150) => {
  const richExcerpt = createRichExcerpt(content, maxLength).replace(/\.\.\.$/, '');
  const plain = decodeHtmlEntities(richExcerpt)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/[#*`_[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return plain ? `${plain}...` : '';
};

module.exports = {
  createPlainExcerpt,
  createRichExcerpt,
};
