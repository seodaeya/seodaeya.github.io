const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const matter = require('gray-matter');

const trendingPostsPath = path.join(__dirname, '../trending-posts.json');
const postsDir = path.join(__dirname, '../posts');

// Helper to get Korean Date string with exact live time
const getKstDisplayDate = (dateObj = new Date()) => {
  const utc = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
  const kstTime = new Date(utc + (9 * 60 * 60000));
  const year = kstTime.getFullYear();
  const month = kstTime.getMonth() + 1;
  const day = kstTime.getDate();
  const hours = String(kstTime.getHours()).padStart(2, '0');
  const minutes = String(kstTime.getMinutes()).padStart(2, '0');
  return `${year}년 ${month}월 ${day}일 ${hours}:${minutes} KST`;
};

// 1. Read existing previous trending posts to compare rank changes
let previousRankingMap = {};
if (fs.existsSync(trendingPostsPath)) {
  try {
    const prevData = JSON.parse(fs.readFileSync(trendingPostsPath, 'utf8'));
    const prevList = Array.isArray(prevData) ? prevData : (prevData.posts || []);
    prevList.forEach((item, idx) => {
      if (item.url) previousRankingMap[item.url] = idx + 1;
    });
  } catch (e) {
    previousRankingMap = {};
  }
}

// 2. Query GA4 Data API if credentials exist
async function fetchRealGA4Rankings() {
  const serviceAccountKey = process.env.GA_SERVICE_ACCOUNT_KEY;
  const propertyId = process.env.GA_PROPERTY_ID;

  if (!serviceAccountKey || !propertyId) {
    console.log('ℹ️ GA_SERVICE_ACCOUNT_KEY or GA_PROPERTY_ID not provided. Using intelligent hybrid fallback.');
    return null;
  }

  try {
    const { BetaAnalyticsDataClient } = require('@google-analytics/data');
    let credentials;
    try {
      credentials = JSON.parse(serviceAccountKey);
    } catch (err) {
      console.error('❌ Failed to parse GA_SERVICE_ACCOUNT_KEY JSON:', err.message);
      return null;
    }

    const analyticsDataClient = new BetaAnalyticsDataClient({ credentials });
    console.log(`📊 Fetching real GA4 pageview statistics for Property ID: ${propertyId}...`);

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: {
            matchType: 'CONTAINS',
            value: '/posts/',
          },
        },
      },
      limit: 15,
    });

    if (!response.rows || response.rows.length === 0) {
      console.log('ℹ️ GA4 returned 0 rows for /posts/ in last 7 days. Using fallback.');
      return null;
    }

    const gaPosts = [];
    response.rows.forEach(row => {
      const pagePath = row.dimensionValues[0].value;
      const views = parseInt(row.metricValues[0].value, 10);
      const match = pagePath.match(/\/posts\/([^\/\?#]+)/);
      if (match && match[1]) {
        const slug = match[1];
        if (!gaPosts.find(p => p.slug === slug)) {
          gaPosts.push({ slug, views });
        }
      }
    });

    console.log(`✅ GA4 successfully returned ${gaPosts.length} post metrics!`);
    return gaPosts.slice(0, 5);
  } catch (e) {
    console.error('⚠️ GA4 Data API request error:', e.message);
    return null;
  }
}

// 3. Fallback deterministic ranking if GA4 is empty or pending
function getFallbackTop5() {
  const candidatePosts = [
    { slug: '20260827-1-ecommerce-ontology-ai-search-guide', badge: '온톨로지 · AI 검색', baseWeight: 96 },
    { slug: '20260825-1-spring-boot-lettuce-redis-caching-traffic-bottleneck', badge: 'Spring Boot · Redis', baseWeight: 94 },
    { slug: '20260815-1-gemini-3-7-flash-analysis', badge: 'Gemini 3.7 · AI', baseWeight: 90 },
    { slug: '20250404-2-cline-autonomous-coding-agent', badge: '자율 코딩 · Cline', baseWeight: 86 },
    { slug: '20250427-1-postgresql-install-setup-guide', badge: 'PostgreSQL · DB', baseWeight: 82 },
    { slug: '20250404-1-anthropic-claude-models-analysis', badge: 'Claude 3.5 · LLM', baseWeight: 80 },
    { slug: '20260822-1-github-pages-url-slug-seo-redirection', badge: 'SEO · Next.js', baseWeight: 78 }
  ];

  const todayStr = new Date().toISOString().split('T')[0];
  return candidatePosts.map(p => {
    const hash = crypto.createHash('md5').update(`${todayStr}-${p.slug}`).digest('hex');
    const variance = parseInt(hash.substring(0, 4), 16) % 18;
    return { ...p, score: p.baseWeight + variance };
  }).sort((a, b) => b.score - a.score).slice(0, 5);
}

async function main() {
  const realGA = await fetchRealGA4Rankings();
  const topList = realGA && realGA.length > 0 ? realGA : getFallbackTop5();

  const finalTop5 = topList.map((item, currentIdx) => {
    const currentRank = currentIdx + 1;
    const slug = item.slug;
    const postFile = path.join(postsDir, `${slug}.md`);
    let title = slug;
    let desc = '';
    let category = 'Tech';
    let date = '';
    let badge = item.badge || 'Tech & Dev';

    if (fs.existsSync(postFile)) {
      const fc = fs.readFileSync(postFile, 'utf8');
      const { data, content } = matter(fc);
      title = data.title || title;
      desc = data.excerpt || content.slice(0, 100).replace(/[#*`]/g, '');
      category = data.category || category;
      date = data.date || date;
      if (data.tags && data.tags.length > 0) {
        badge = `${data.tags[0]} · ${category.split(' ')[0]}`;
      }
    }

    const postUrl = `/posts/${slug}`;
    const prevRank = previousRankingMap[postUrl];
    let change = 'same';
    let changeText = '-';

    if (!prevRank) {
      change = 'new';
      changeText = 'NEW';
    } else if (prevRank > currentRank) {
      change = 'up';
      changeText = `▲ ${prevRank - currentRank}`;
    } else if (prevRank < currentRank) {
      change = 'down';
      changeText = `▼ ${currentRank - prevRank}`;
    } else {
      change = 'same';
      changeText = '-';
    }

    return {
      rank: currentRank,
      change,
      changeText,
      badge,
      category,
      title,
      desc,
      url: postUrl,
      date,
      views: item.views || null,
    };
  });

  const outputData = {
    updatedAt: getKstDisplayDate(),
    isRealGA: !!(realGA && realGA.length > 0),
    posts: finalTop5,
  };

  fs.writeFileSync(trendingPostsPath, JSON.stringify(outputData, null, 2), 'utf-8');
  console.log(`✅ trending-posts.json generated successfully (Real GA: ${outputData.isRealGA})!`);
}

main().catch(err => {
  console.error('Fatal error in generate-trending-posts:', err);
  process.exit(1);
});
