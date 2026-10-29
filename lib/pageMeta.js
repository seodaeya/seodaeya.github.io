import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import contentUtils from '@/lib/content';
import gitLastModUtils from '@/lib/gitLastMod';

const { createPlainExcerpt } = contentUtils;
const { resolveContentLastMod } = gitLastModUtils;

function readContentDirectory(dir, type) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((fn) => fn.endsWith('.md'))
    .map((filename) => {
      const fc = fs.readFileSync(path.join(dir, filename), 'utf-8');
      const { data: d, content: c } = matter(fc);
      if (d.noindex === true) return null;
      return {
        id: filename.replace('.md', ''),
        type,
        title: d.title || '',
        category: d.category || '',
        date: d.date || '',
        image: d.image || '',
        videoId: d.videoId || null,
        excerpt: createPlainExcerpt(c, 100),
      };
    })
    .filter(Boolean);
}

function getAllSortedIndexableContent(postsDir, videosDir) {
  return [
    ...readContentDirectory(postsDir, 'posts'),
    ...readContentDirectory(videosDir, 'videos'),
  ].sort((a, b) => {
    const timeDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (timeDiff !== 0) return timeDiff;
    return (b.id || '').localeCompare(a.id || '');
  });
}

export function getPostStaticProps(id) {
  const postsDir = path.join(process.cwd(), 'files/posts');
  const videosDir = path.join(process.cwd(), 'files/videos');
  const targetFilename = `${id}.md`;
  const filePath = path.join(postsDir, targetFilename);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  const cleanBodyText = content
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .trim();
  const readingTime = Math.max(1, Math.ceil(cleanBodyText.length / 450));

  const allContent = getAllSortedIndexableContent(postsDir, videosDir);
  const currentIndex = allContent.findIndex(
    (item) => item.id === id && item.type === 'posts'
  );

  const prevPost =
    currentIndex !== -1 && currentIndex < allContent.length - 1
      ? allContent[currentIndex + 1]
      : null;
  const nextPost = currentIndex > 0 ? allContent[currentIndex - 1] : null;

  let seriesNav = null;
  if (data.series) {
    const seriesPosts = fs
      .readdirSync(postsDir)
      .filter((fn) => fn.endsWith('.md'))
      .map((filename) => {
        const fc = fs.readFileSync(path.join(postsDir, filename), 'utf-8');
        const { data: d } = matter(fc);
        return {
          id: filename.replace('.md', ''),
          title: d.title || '',
          date: d.date || '',
          series: d.series || '',
          noindex: d.noindex === true,
        };
      })
      .filter((item) => item.series === data.series && !item.noindex)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (seriesPosts.length > 1) {
      seriesNav = {
        title: data.seriesTitle || data.series,
        posts: seriesPosts.map(({ id: postId, title }) => ({ id: postId, title })),
      };
    }
  }

  let views = null;
  try {
    const want = `/posts/${id}`;
    const candidates = [
      path.join(process.cwd(), 'files/trending-posts.json'),
      path.join(process.cwd(), 'files/monthly-baseline-ranking.json'),
    ];
    for (const p of candidates) {
      if (!fs.existsSync(p)) continue;
      const parsed = JSON.parse(fs.readFileSync(p, 'utf8'));
      const hit = (parsed.posts || []).find((x) => x.url === want);
      if (hit && typeof hit.views === 'number') {
        views = hit.views;
        break;
      }
    }
  } catch (e) {}

  const relatedPosts = allContent
    .filter(
      (item) =>
        item.category === data.category &&
        !(item.id === id && item.type === 'posts')
    )
    .slice(0, 3);

  const excerpt = (() => {
    const base = (data.excerpt || '').trim();
    if (base.length >= 125 && base.length <= 158) return base;
    const bodyPlain = (createPlainExcerpt(content, 300) || '')
      .replace(/\.\.\.$/, '')
      .trim();
    let combined = base ? `${base} ${bodyPlain}` : bodyPlain;
    combined = combined.replace(/\s+/g, ' ').trim();
    if (combined.length > 155) {
      combined = `${combined.slice(0, 152).trim()}...`;
    }
    return combined || '글 내용을 확인해보세요.';
  })();

  return {
    props: {
      id,
      frontmatter: data,
      excerpt,
      readingTime,
      prevPost,
      nextPost,
      relatedPosts,
      seriesNav,
      views,
      canonicalId: id,
      dateModified: resolveContentLastMod('files/posts', targetFilename, data),
    },
  };
}

export function getVideoStaticProps(id) {
  const postsDir = path.join(process.cwd(), 'files/posts');
  const videosDir = path.join(process.cwd(), 'files/videos');
  const targetFilename = `${id}.md`;
  const filePath = path.join(videosDir, targetFilename);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  const allContent = getAllSortedIndexableContent(postsDir, videosDir);
  const currentIndex = allContent.findIndex(
    (item) => item.id === id && item.type === 'videos'
  );

  const prevVideo =
    currentIndex !== -1 && currentIndex < allContent.length - 1
      ? allContent[currentIndex + 1]
      : null;
  const nextVideo = currentIndex > 0 ? allContent[currentIndex - 1] : null;

  const relatedVideos = allContent
    .filter(
      (item) =>
        item.category === data.category &&
        !(item.id === id && item.type === 'videos')
    )
    .slice(0, 3);

  return {
    props: {
      id,
      frontmatter: data,
      excerpt: createPlainExcerpt(content, 120) || '영상 정보를 확인해보세요.',
      prevVideo,
      nextVideo,
      relatedVideos,
      dateModified: resolveContentLastMod('files/videos', targetFilename, data),
    },
  };
}
