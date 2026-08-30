const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const matter = require('gray-matter');

const postsDir = path.join(process.cwd(), 'files/posts');
const outputFile = path.join(process.cwd(), 'files/trending-posts.json');

// 한국 시간 기준 현재 포맷팅 (YYYY년 M월 D일 HH:mm KST)
function getKstDisplayDate() {
  const now = new Date();
  const kstOffset = 9 * 60; // KST is UTC+9
  const localOffset = now.getTimezoneOffset();
  const kstTime = new Date(now.getTime() + (kstOffset + localOffset) * 60000);

  const year = kstTime.getFullYear();
  const month = kstTime.getMonth() + 1;
  const day = kstTime.getDate();
  const hours = String(kstTime.getHours()).padStart(2, '0');
  const minutes = String(kstTime.getMinutes()).padStart(2, '0');

  return `${year}년 ${month}월 ${day}일 ${hours}:${minutes} KST`;
}

// 이전 랭킹 히스토리 읽기 (순위 변동 계산용)
let previousRankingMap = {};
if (fs.existsSync(outputFile)) {
  try {
    const prevData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
    const prevList = prevData.posts || prevData.allPosts || (Array.isArray(prevData) ? prevData : []);
    prevList.forEach((item, idx) => {
      previousRankingMap[item.url] = idx + 1;
    });
  } catch (e) {
    previousRankingMap = {};
  }
}

// 1. GA4 실시간 / 누적 페이지뷰 조회
async function fetchRealGA4Rankings() {
  const propertyId = process.env.GA_PROPERTY_ID;
  const serviceAccountKey = process.env.GA_SERVICE_ACCOUNT_KEY;

  if (!propertyId || !serviceAccountKey) {
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
      limit: 100,
    });

    if (!response.rows || response.rows.length === 0) {
      console.log('ℹ️ GA4 returned 0 rows for /posts/ in last 30 days. Using fallback.');
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
    return gaPosts;
  } catch (e) {
    console.error('⚠️ Error fetching GA4 data:', e.message);
    return null;
  }
}

// 2. 전체 블로그 아티클 파일 목록 읽기 및 지능형 순위 계산
function getAllPostsWithScores() {
  if (!fs.existsSync(postsDir)) return [];
  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
  const todayStr = new Date().toISOString().split('T')[0];

  return files.map(filename => {
    const slug = filename.replace('.md', '');
    const fullPath = path.join(postsDir, filename);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    const postDate = data.date ? new Date(data.date).getTime() : 0;
    const daysOld = Math.max(0, Math.floor((Date.now() - postDate) / (1000 * 60 * 60 * 24)));
    
    // 신선도 점수 (최신 글일수록 가중치) + 태그 수 + 글 길이 가중치
    const freshnessScore = Math.max(10, 100 - daysOld * 1.5);
    const contentWeight = Math.min(30, Math.floor(content.length / 500));
    
    // 일일 변동 해시 (매일 자정마다 자연스러운 순위 변동 부여)
    const hash = crypto.createHash('md5').update(`${todayStr}-${slug}`).digest('hex');
    const variance = parseInt(hash.substring(0, 4), 16) % 25;

    const baseScore = freshnessScore + contentWeight + variance;

    return {
      slug,
      title: data.title || slug,
      category: data.category || 'Tech & Dev',
      date: data.date || '',
      image: data.image || '',
      tags: data.tags || [],
      excerpt: data.excerpt || content.slice(0, 120).replace(/[#*`]/g, '').trim(),
      baseScore
    };
  }).sort((a, b) => b.baseScore - a.baseScore);
}

async function main() {
  const realGA = await fetchRealGA4Rankings();
  const allCandidatePosts = getAllPostsWithScores();
  const isRealGA = Boolean(realGA && realGA.length > 0);

  // GA4 실측 조회수가 있는 글을 최우선으로 매핑
  const gaViewsMap = {};
  if (realGA) {
    realGA.forEach(item => {
      gaViewsMap[item.slug] = item.views;
    });
  }

  // 전체 아티클에 대해 GA4 조회수 + 지능형 가중치 통합 스코어 산출
  const scoredPosts = allCandidatePosts.map(post => {
    const views = gaViewsMap[post.slug] || 0;
    // GA4 실측 조회수가 있으면 조회수 1회당 100점 부여 + 기본 가중치
    const totalScore = (views * 100) + post.baseScore;
    return {
      ...post,
      views: views > 0 ? views : null,
      totalScore
    };
  }).sort((a, b) => b.totalScore - a.totalScore);

  // 1위부터 끝까지 순위 및 변동폭(▲, ▼, NEW, -) 계산
  const allRankedList = scoredPosts.map((item, currentIdx) => {
    const currentRank = currentIdx + 1;
    const postUrl = `/posts/${item.slug}`;
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
    }

    const badge = item.tags && item.tags.length > 0 
      ? `${item.tags[0]} · ${item.category.split(' ')[0]}`
      : item.category;

    return {
      rank: currentRank,
      change,
      changeText,
      badge,
      category: item.category,
      title: item.title,
      desc: item.excerpt,
      image: item.image,
      url: postUrl,
      date: item.date,
      views: item.views
    };
  });

  const outputData = {
    updatedAt: getKstDisplayDate(),
    isRealGA,
    posts: allRankedList.slice(0, 5), // 홈 전광판용 상위 5개
    allPosts: allRankedList // 전체 랭킹 페이지용 전체 목록
  };

  fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2), 'utf8');
  console.log(`✅ trending-posts.json generated successfully (${allRankedList.length} articles ranked, Real GA: ${isRealGA})!`);
}

main().catch(err => {
  console.error('❌ Failed to generate trending posts:', err);
  process.exit(1);
});
