const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { createPlainExcerpt } = require('../../lib/content');

const siteUrl = 'https://seodaeya.github.io';
const publicDir = path.join(__dirname, '../../public');
const postsDir = path.join(__dirname, '../posts');
const videosDir = path.join(__dirname, '../videos');

const getFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(file => file.endsWith('.md')).map(filename => {
    const filePath = path.join(dir, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);
    
    const isVideo = dir.includes('videos');
    const route = isVideo ? `videos/${filename.replace('.md', '')}` : `posts/${filename.replace('.md', '')}`;

    return {
      title: data.title || filename.replace('.md', ''),
      description: createPlainExcerpt(content, 150),
      link: `${siteUrl}/${route}/`,
      date: data.date ? new Date(data.date).toUTCString() : new Date().toUTCString(),
      rawDate: data.date || ''
    };
  });
};

const generateRSS = () => {
  const posts = getFiles(postsDir);
  const videos = getFiles(videosDir);
  
  // 전체 아이템 통합 후 날짜 내림차순 정렬
  const allItems = [...posts, ...videos].sort((a, b) => {
    const timeDiff = new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime();
    if (timeDiff !== 0) return timeDiff;
    return (b.link || '').localeCompare(a.link || '');
  });
  
  let xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>나는 사람이다. (NaRD Blog)</title>
  <link>${siteUrl}</link>
  <description>AI 시대에 남기는 지극히 인간적인 기록들</description>
  <language>ko</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
`;

  allItems.forEach(item => {
    xml += `  <item>
    <title><![CDATA[${item.title}]]></title>
    <link>${item.link}</link>
    <guid>${item.link}</guid>
    <pubDate>${item.date}</pubDate>
    <description><![CDATA[${item.description}]]></description>
  </item>\n`;
  });

  xml += `</channel>
</rss>`;

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(path.join(publicDir, 'rss.xml'), xml, 'utf8');
  console.log('rss.xml 생성 완료!');
};

generateRSS();
