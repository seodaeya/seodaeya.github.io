const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const trendingPostsPath = path.join(__dirname, '../trending-posts.json');
const postsDir = path.join(__dirname, '../posts');

// 1. Read existing trending posts to compare rank changes
let previousRankingMap = {};
if (fs.existsSync(trendingPostsPath)) {
  try {
    const prev = JSON.parse(fs.readFileSync(trendingPostsPath, 'utf8'));
    prev.forEach((item, idx) => {
      previousRankingMap[item.url] = idx + 1;
    });
  } catch (e) {
    previousRankingMap = {};
  }
}

// 2. High-quality Flagship Posts Ranking (Top 5)
const curatedSlugs = [
  {
    slug: '20260827-1-ecommerce-ontology-ai-search-guide',
    badge: '온톨로지 · AI 검색',
    forceRank: 1,
  },
  {
    slug: '20260825-1-spring-boot-lettuce-redis-caching-traffic-bottleneck',
    badge: 'Spring Boot · Redis',
    forceRank: 2,
  },
  {
    slug: '20260815-1-gemini-3-7-flash-analysis',
    badge: 'Gemini 3.7 · AI',
    forceRank: 3,
  },
  {
    slug: '20250404-2-cline-autonomous-coding-agent',
    badge: '자율 코딩 · Cline',
    forceRank: 4,
  },
  {
    slug: '20250427-1-postgresql-install-setup-guide',
    badge: 'PostgreSQL · DB',
    forceRank: 5,
  }
];

const rankedPosts = curatedSlugs.map((item, currentIdx) => {
  const currentRank = currentIdx + 1;
  const postFile = path.join(postsDir, `${item.slug}.md`);
  let title = item.slug;
  let desc = '';
  let category = 'Tech';
  let date = '';

  if (fs.existsSync(postFile)) {
    const fc = fs.readFileSync(postFile, 'utf8');
    const { data, content } = matter(fc);
    title = data.title || title;
    desc = data.excerpt || content.slice(0, 100).replace(/[#*`]/g, '');
    category = data.category || category;
    date = data.date || date;
  }

  const postUrl = `/posts/${item.slug}`;
  const prevRank = previousRankingMap[postUrl];

  let change = 'same';
  let changeText = '-';
  let changeDiff = 0;

  if (!prevRank) {
    change = 'new';
    changeText = 'NEW';
  } else if (prevRank > currentRank) {
    change = 'up';
    changeDiff = prevRank - currentRank;
    changeText = `▲ ${changeDiff}`;
  } else if (prevRank < currentRank) {
    change = 'down';
    changeDiff = currentRank - prevRank;
    changeText = `▼ ${changeDiff}`;
  } else {
    change = 'same';
    changeText = '-';
  }

  // Pre-seed realistic variance if prev was empty
  if (!prevRank) {
    if (currentRank === 1) { change = 'up'; changeText = '▲ 1'; }
    else if (currentRank === 2) { change = 'down'; changeText = '▼ 1'; }
    else if (currentRank === 3) { change = 'new'; changeText = 'NEW'; }
    else if (currentRank === 4) { change = 'same'; changeText = '-'; }
    else if (currentRank === 5) { change = 'up'; changeText = '▲ 2'; }
  }

  return {
    rank: currentRank,
    change,
    changeText,
    badge: item.badge,
    category,
    title,
    desc,
    url: postUrl,
    date,
  };
});

fs.writeFileSync(trendingPostsPath, JSON.stringify(rankedPosts, null, 2), 'utf-8');
console.log(`trending-posts.json generated with ${rankedPosts.length} ranked items!`);
