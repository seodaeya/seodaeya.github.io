const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');
const { enrichLocalImageDimensions } = require('../../lib/enrichContentImages');

const postsMdDir = path.join(process.cwd(), 'files/posts');
const videosMdDir = path.join(process.cwd(), 'files/videos');
const postsPagesDir = path.join(process.cwd(), 'pages/posts');
const videosPagesDir = path.join(process.cwd(), 'pages/videos');

function renderPostMarkdown(markdownBody) {
  const renderer = new marked.Renderer();
  let headingIndex = 0;
  renderer.heading = function ({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    const id = 'heading-' + headingIndex++;
    return '<h' + depth + ' id="' + id + '">' + text + '</h' + depth + '>';
  };

  const origTable = renderer.table.bind(renderer);
  renderer.table = function (header, body) {
    const tableHtml = origTable(header, body);
    return '<div class="table-responsive-wrapper">' + tableHtml + '</div>';
  };

  const origBlockquote = renderer.blockquote.bind(renderer);
  renderer.blockquote = function ({ tokens }) {
    const html = origBlockquote({ tokens });
    return html.replace(/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(<br\s*\/?>)?/gi, '');
  };

  return enrichLocalImageDimensions(marked(markdownBody, { renderer }));
}

function renderVideoMarkdown(markdownBody) {
  return enrichLocalImageDimensions(marked(markdownBody));
}

function writeIfChanged(filePath, content) {
  if (fs.existsSync(filePath)) {
    const existing = fs.readFileSync(filePath, 'utf8');
    if (existing === content) return false;
  }
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

function syncDirectory({ mdDir, pagesDir, type }) {
  if (!fs.existsSync(pagesDir)) {
    fs.mkdirSync(pagesDir, { recursive: true });
  }

  const mdFiles = fs.readdirSync(mdDir).filter((fn) => fn.endsWith('.md'));
  const expectedPageFiles = new Set();
  let updatedCount = 0;

  for (const filename of mdFiles) {
    const slug = filename.replace(/\.md$/, '');
    const pageFilename = `${slug}.jsx`;
    expectedPageFiles.add(pageFilename);

    const rawMd = fs.readFileSync(path.join(mdDir, filename), 'utf8');
    const { content } = matter(rawMd);

    const html =
      type === 'posts' ? renderPostMarkdown(content) : renderVideoMarkdown(content);

    const pageSource =
      type === 'posts'
        ? `import PostPageLayout from '@/components/PostPageLayout';
import { getPostStaticProps } from '@/lib/pageMeta';

const POST_ID = ${JSON.stringify(slug)};
const ARTICLE_HTML = ${JSON.stringify(html)};

export async function getStaticProps() {
  return getPostStaticProps(POST_ID);
}

export default function PostPage(props) {
  return <PostPageLayout {...props} contentHtml={ARTICLE_HTML} />;
}
`
        : `import VideoPageLayout from '@/components/VideoPageLayout';
import { getVideoStaticProps } from '@/lib/pageMeta';

const VIDEO_ID = ${JSON.stringify(slug)};
const VIDEO_HTML = ${JSON.stringify(html)};

export async function getStaticProps() {
  return getVideoStaticProps(VIDEO_ID);
}

export default function VideoPage(props) {
  return <VideoPageLayout {...props} contentHtml={VIDEO_HTML} />;
}
`;

    if (writeIfChanged(path.join(pagesDir, pageFilename), pageSource)) {
      updatedCount++;
    }
  }

  // Remove obsolete or dynamic template files (e.g. [id].jsx)
  for (const existing of fs.readdirSync(pagesDir)) {
    if (!existing.endsWith('.jsx') && !existing.endsWith('.js')) continue;
    if (!expectedPageFiles.has(existing)) {
      fs.unlinkSync(path.join(pagesDir, existing));
    }
  }

  return { total: mdFiles.length, updatedCount };
}

function main() {
  const postsResult = syncDirectory({
    mdDir: postsMdDir,
    pagesDir: postsPagesDir,
    type: 'posts',
  });
  const videosResult = syncDirectory({
    mdDir: videosMdDir,
    pagesDir: videosPagesDir,
    type: 'videos',
  });

  console.log(
    `개별 페이지 파일 동기화 완료! (posts: ${postsResult.total}개 중 ${postsResult.updatedCount}개 갱신, videos: ${videosResult.total}개 중 ${videosResult.updatedCount}개 갱신)`
  );
}

main();
