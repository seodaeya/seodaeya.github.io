const fs = require('fs');
const path = require('path');

const siteUrl = 'https://seodaeya.github.io';
const publicDir = path.join(__dirname, '../../public');
const postsDir = path.join(__dirname, '../posts');
const videosDir = path.join(__dirname, '../videos');

const getFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(file => file.endsWith('.md'));
};

const generateSitemap = () => {
  const posts = getFiles(postsDir);
  const videos = getFiles(videosDir);
  
  const currentDate = new Date().toISOString().split('T')[0];
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Core Pages -->
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${siteUrl}/categories/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;

  // Blog posts
  posts.forEach(file => {
    const id = file.replace('.md', '');
    xml += `  <url>
    <loc>${siteUrl}/posts/${id}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
  });

  // Videos
  videos.forEach(file => {
    const id = file.replace('.md', '');
    xml += `  <url>
    <loc>${siteUrl}/videos/${id}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
  });

  xml += `</urlset>`;
  
  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml, 'utf8');
  console.log('sitemap.xml 생성 완료!');
};

generateSitemap();
