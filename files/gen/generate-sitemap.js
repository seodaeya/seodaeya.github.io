const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const matter = require('gray-matter');

const siteUrl = 'https://seodaeya.github.io';
const publicDir = path.join(process.cwd(), 'public');
const postsDir = path.join(process.cwd(), 'files/posts');
const videosDir = path.join(process.cwd(), 'files/videos');

const normalizeDateStr = (rawDate, filename = '') => {
  if (rawDate) {
    try {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    } catch (e) {}
  }
  const match = filename.match(/^(\d{4})(\d{2})(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  return '2026-01-01';
};

const getGitLastMod = (relFilePath, fallbackDate) => {
  try {
    const out = execSync(`git log -1 --format="%cs" -- "${relFilePath}"`, {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(out)) {
      return out;
    }
  } catch (e) {}
  return fallbackDate;
};

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
      const frontmatterDate = normalizeDateStr(data.updated || data.lastmod || data.date, file);
      const relFilePath = path.join(relDir, file);
      const gitDate = getGitLastMod(relFilePath, frontmatterDate);
      const lastmod = gitDate > frontmatterDate ? gitDate : frontmatterDate;
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

  const corePages = [
    { loc: `${siteUrl}/`, lastmod: latestContentDate, changefreq: 'daily', priority: '1.0' },
    { loc: `${siteUrl}/categories/`, lastmod: latestContentDate, changefreq: 'weekly', priority: '0.8' },
    { loc: `${siteUrl}/ranking/`, lastmod: latestContentDate, changefreq: 'daily', priority: '0.8' },
    { loc: `${siteUrl}/cart/`, lastmod: getGitLastMod('pages/cart/index.jsx', '2026-09-18'), changefreq: 'weekly', priority: '0.8' },
    { loc: `${siteUrl}/word-train/`, lastmod: getGitLastMod('pages/word-train.jsx', '2026-10-09'), changefreq: 'monthly', priority: '0.7' },
    { loc: `${siteUrl}/about/`, lastmod: getGitLastMod('pages/about.jsx', '2026-10-05'), changefreq: 'monthly', priority: '0.8' },
    { loc: `${siteUrl}/privacy/`, lastmod: getGitLastMod('pages/privacy.jsx', '2026-09-01'), changefreq: 'monthly', priority: '0.5' },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Core Pages -->
`;

  corePages.forEach((page) => {
    xml += `  <url>
    <loc>${page.loc}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  });

  // Blog posts
  posts.forEach(({ id, lastmod }) => {
    xml += `  <url>
    <loc>${siteUrl}/posts/${id}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
  });

  // Videos
  videos.forEach(({ id, lastmod }) => {
    xml += `  <url>
    <loc>${siteUrl}/videos/${id}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
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
