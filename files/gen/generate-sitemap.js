const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { getGitLastMod, resolveContentLastMod } = require('../../lib/gitLastMod');

const siteUrl = 'https://seodaeya.github.io';
const publicDir = path.join(process.cwd(), 'public');
const postsDir = path.join(process.cwd(), 'files/posts');
const videosDir = path.join(process.cwd(), 'files/videos');

const getContentEntries = (dir) => {
  if (!fs.existsSync(dir)) return [];
  const entries = [];
  const relDir = path.relative(process.cwd(), dir);
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.md')) continue;
    try {
      const fullPath = path.join(dir, file);
      const { data } = matter(fs.readFileSync(fullPath, 'utf8'));
      // noindex: true frontmatter pages are strictly excluded from sitemap.xml
      if (data.noindex === true) continue;
      const lastmod = resolveContentLastMod(relDir, file, data);
      entries.push({
        id: file.replace('.md', ''),
        lastmod,
      });
    } catch (e) {}
  }
  return entries.sort((a, b) => b.lastmod.localeCompare(a.lastmod) || b.id.localeCompare(a.id));
};

const generateSitemap = () => {
  const posts = getContentEntries(postsDir);
  const videos = getContentEntries(videosDir);

  const allDates = [...posts, ...videos].map((item) => item.lastmod).sort();
  const latestContentDate = allDates.length > 0 ? allDates[allDates.length - 1] : new Date().toISOString().split('T')[0];

  // Note: Interactive web utility/game pages (/cart/, /word-train/, /planner/, /bookmarks/) are noindex and excluded from sitemap.xml
  const corePages = [
    { loc: `${siteUrl}/`, lastmod: latestContentDate },
    { loc: `${siteUrl}/categories/`, lastmod: latestContentDate },
    { loc: `${siteUrl}/ranking/`, lastmod: latestContentDate },
    { loc: `${siteUrl}/about/`, lastmod: getGitLastMod('pages/about.jsx', '2026-10-05') },
    { loc: `${siteUrl}/privacy/`, lastmod: getGitLastMod('pages/privacy.jsx', '2026-09-01') },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Core Pages -->
`;

  corePages.forEach((page) => {
    xml += `  <url>
    <loc>${page.loc}</loc>
    <lastmod>${page.lastmod}</lastmod>
  </url>
`;
  });

  // Blog posts
  posts.forEach(({ id, lastmod }) => {
    xml += `  <url>
    <loc>${siteUrl}/posts/${id}/</loc>
    <lastmod>${lastmod}</lastmod>
  </url>
`;
  });

  // Videos
  videos.forEach(({ id, lastmod }) => {
    xml += `  <url>
    <loc>${siteUrl}/videos/${id}/</loc>
    <lastmod>${lastmod}</lastmod>
  </url>
`;
  });

  xml += `</urlset>`;

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml, 'utf8');
  console.log(`public/sitemap.xml 생성 완료! (총 ${corePages.length + posts.length + videos.length}개 URL, 최신 컨텐츠 기준일: ${latestContentDate})`);
};

generateSitemap();
