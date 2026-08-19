const decodeHtmlEntities = (value) => {
  if (!value) return '';
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
};

const getCleanText = (content) => {
  if (!content) return '';
  
  // 1. Remove code blocks
  let text = content.replace(/```[\s\S]*?```/g, ' ');
  text = text.replace(/~~~[\s\S]*?~~~/g, ' ');
  
  // 2. Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, ' ');
  
  // 3. Remove tooltip descriptions inside <span class="tooltip-text">...</span>
  text = text.replace(/<span class="tooltip-text">[\s\S]*?<\/span>/gi, ' ');
  
  // 4. Remove all HTML tags (<a>, <span>, <div>, <strong>, <em>, <p>, etc.)
  text = text.replace(/<[^>]+>/g, ' ');
  
  // 5. Remove markdown images and links: ![alt](url) -> alt, [text](url) -> text
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // 6. Remove markdown headers, blockquotes, horizontal rules, asterisks, tildes, backticks
  text = text.replace(/^#+\s+/gm, ' ');
  text = text.replace(/^>\s+/gm, ' ');
  text = text.replace(/[-*_~`|]/g, ' ');
  
  // 7. Decode HTML entities and normalize whitespace
  text = decodeHtmlEntities(text);
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
};

const createPlainExcerpt = (content, maxLength = 120) => {
  const clean = getCleanText(content);
  if (!clean) return '';
  if (clean.length <= maxLength) return clean;
  return clean.slice(0, maxLength).trimEnd() + '...';
};

const createRichExcerpt = (content, maxLength = 120) => {
  return createPlainExcerpt(content, maxLength);
};

module.exports = {
  createPlainExcerpt,
  createRichExcerpt,
};
