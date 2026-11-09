const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { createPlainExcerpt } = require('../../lib/content');

const { siteUrl } = require('../site-config.json');
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

    // noindex pages stay readable but are excluded from the RSS feed
    if (data.noindex === true) return null;

    return {
      title: data.title || filename.replace('.md', ''),
      description: createPlainExcerpt(content, 150),
      link: `${siteUrl}/${route}/`,
      date: data.date ? new Date(data.date).toUTCString() : new Date().toUTCString(),
      rawDate: data.date || ''
    };
  }).filter(Boolean);
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
  <title>여전히, 나는 사람이다. (NaRD Blog)</title>
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

  // GEO (Generative Engine Optimization): AI 검색 엔진(ChatGPT, Perplexity, Claude 등)용 llms.txt 자동 생성
  const llmsLines = [
    '# 여전히, 나는 사람이다. (NaRD Blog)',
    '',
    '> 인공지능(AI) 트렌드와 소프트웨어 아키텍처 분석부터 손끝의 일상까지, 직접 겪고 기록하는 테크 블로그입니다. 실무 백엔드 개발 트러블슈팅, 최신 LLM·코딩 에이전트 가이드, IT 기기 리뷰와 생활 밀착형 DIY 노하우를 다룹니다.',
    '',
    `- 공식 URL: ${siteUrl}/`,
    `- 사이트맵: ${siteUrl}/sitemap.xml`,
    `- RSS 피드: ${siteUrl}/rss.xml`,
    `- 운영자 소개: ${siteUrl}/about/`,
    '',
    '## 핵심 페이지 (Core Pages)',
    `- [홈](${siteUrl}/): 최신 기술 아티클 및 블로그 메인`,
    `- [카테고리](${siteUrl}/categories/): 주제별 기술 아티클 분류`,
    `- [인기글 순위](${siteUrl}/ranking/): 월간 인기 아티클 리더보드`,
    `- [소개](${siteUrl}/about/): 블로그 철학 및 운영자(NaRD) 프로필`,
    `- [문의](${siteUrl}/contact/): 콘텐츠 오류 정정 및 인용·제휴 안내`,
    '',
    '## 기술 아티클 목록 (Indexable Articles)',
    ...allItems.map((item) => `- [${item.title}](${item.link}): ${item.description}`),
    '',
  ];
  fs.writeFileSync(path.join(publicDir, 'llms.txt'), llmsLines.join('\n'), 'utf8');
  console.log('llms.txt 생성 완료!');
};

generateRSS();
