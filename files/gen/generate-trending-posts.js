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
    const prevList = prevData.allPosts || prevData.posts || (Array.isArray(prevData) ? prevData : []);
    prevList.forEach((item, idx) => {
      previousRankingMap[item.url] = idx + 1;
    });
  } catch (e) {
    previousRankingMap = {};
  }
}

// 1. GA4 실시간 / 누적 페이지뷰 조회 (Exponential Backoff 재시도 포함)
async function fetchRealGA4RankingsWithRetry(maxRetries = 3) {
  const propertyId = process.env.GA_PROPERTY_ID;
  const serviceAccountKey = process.env.GA_SERVICE_ACCOUNT_KEY;

  if (!propertyId || !serviceAccountKey) {
    console.log('ℹ️ [GA4] GA_SERVICE_ACCOUNT_KEY or GA_PROPERTY_ID not provided. Using intelligent hybrid fallback.');
    return null;
  }

  let credentials;
  try {
    credentials = JSON.parse(serviceAccountKey);
  } catch (err) {
    console.error('❌ [GA4] Failed to parse GA_SERVICE_ACCOUNT_KEY JSON:', err.message);
    return null;
  }

  const { BetaAnalyticsDataClient } = require('@google-analytics/data');
  const analyticsDataClient = new BetaAnalyticsDataClient({ credentials });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`
======================================================================`);
      console.log(`📊 [GA4 API] Fetching real-time pageviews (Attempt ${attempt}/${maxRetries}) for Property ID: ${propertyId}...`);
      console.log(`======================================================================`);

      const [response] = await analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '365daysAgo', endDate: 'today' }],
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
        console.log('ℹ️ [GA4] Returned 0 rows for /posts/ in last 365 days. Using fallback.');
        return null;
      }

      const gaPosts = [];
      console.log(`----------------------------------------------------------------------`);
      console.log(`[#]   Views       Slug / Path`);
      console.log(`----------------------------------------------------------------------`);

      response.rows.forEach((row) => {
        const pagePath = row.dimensionValues[0].value;
        const views = parseInt(row.metricValues[0].value, 10);
        const match = pagePath.match(/\/posts\/([^\/\?#]+)/);
        if (match && match[1]) {
          const slug = match[1];
          if (!gaPosts.find(p => p.slug === slug)) {
            gaPosts.push({ slug, views });
            const numStr = String(gaPosts.length).padStart(2, '0');
            const viewsStr = `${views} views`.padEnd(11, ' ');
            console.log(`[${numStr}]  ${viewsStr}  ${slug}`);
          }
        }
      });

      console.log(`======================================================================`);
      console.log(`✅ [GA4 API] Successfully fetched and aggregated ${gaPosts.length} article pageviews!
`);
      return gaPosts;
    } catch (e) {
      console.error(`⚠️ [GA4 API] Attempt ${attempt} failed:`, e.message);
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Waiting ${delay}ms before next retry...`);
        await new Promise(res => setTimeout(res, delay));
      }
    }
  }

  console.error('❌ [GA4 API] All retry attempts exhausted. Falling back to curated data.');
  return null;
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
    
    // 신선도 점수 (최신 글일수록 가중치) + 글 분량 가중치
    const freshnessScore = Math.max(10, 100 - daysOld * 1.5);
    const contentWeight = Math.min(30, Math.floor(content.length / 500));
    
    // 일일 미세 변동 해시 (실측 조회수를 뒤집지 않는 1~5점 수준의 미세 타이브레이커)
    const hash = crypto.createHash('md5').update(`${todayStr}-${slug}`).digest('hex');
    const tieBreaker = (parseInt(hash.substring(0, 4), 16) % 5);

    const baseScore = freshnessScore + contentWeight + tieBreaker;

    return {
      slug,
      title: data.title || slug,
      category: data.category || 'Tech & Dev',
      date: data.date || '',
      daysOld,
      image: data.image || '',
      tags: data.tags || [],
      excerpt: data.excerpt || content.slice(0, 120).replace(/[#*`]/g, '').trim(),
      baseScore
    };
  }).sort((a, b) => b.baseScore - a.baseScore);
}

async function main() {
  const realGA = await fetchRealGA4RankingsWithRetry();
  const allCandidatePosts = getAllPostsWithScores();
  const isRealGA = Boolean(realGA && realGA.length > 0);

  // GA4 실측 조회수가 있는 글을 최우선으로 매핑
  const gaViewsMap = {};
  if (realGA) {
    realGA.forEach(item => {
      gaViewsMap[item.slug] = item.views;
    });
  }

  // 전체 아티클에 대해 GA4 실측 조회수(1회당 1000점) + 신선도/기본 스코어 산출
  const scoredPosts = allCandidatePosts.map(post => {
    const views = gaViewsMap[post.slug] || 0;
    const totalScore = (views * 1000) + post.baseScore;
    return {
      ...post,
      views: views > 0 ? views : null,
      totalScore
    };
  }).sort((a, b) => b.totalScore - a.totalScore);

  // 1위부터 끝까지 순위 및 변동폭(▲, ▼, NEW, -) 계산
  const hasPreviousHistory = Object.keys(previousRankingMap).length > 0;

  const allRankedList = scoredPosts.map((item, currentIdx) => {
    const currentRank = currentIdx + 1;
    const postUrl = `/posts/${item.slug}`;
    const prevRank = previousRankingMap[postUrl];
    let change = 'same';
    let changeText = '-';

    if (prevRank) {
      if (prevRank > currentRank) {
        change = 'up';
        changeText = `▲ ${prevRank - currentRank}`;
      } else if (prevRank < currentRank) {
        change = 'down';
        changeText = `▼ ${currentRank - prevRank}`;
      } else {
        change = 'same';
        changeText = '-';
      }
    } else {
      // 이전 기록에 없는 경우: 최근 14일 이내 신규 발행 글만 'NEW'로 표시하고, 나머지는 '-'로 표시하여 신뢰도 유지
      if (item.daysOld <= 14) {
        change = 'new';
        changeText = 'NEW';
      } else {
        change = 'same';
        changeText = '-';
      }
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

  // 최종 랭킹 결과 콘솔 로깅
  console.log(`======================================================================`);
  console.log(`🏆 [Leaderboard] Final Generated Rankings (Total: ${allRankedList.length} articles, Real GA: ${isRealGA})`);
  console.log(`======================================================================`);
  allRankedList.slice(0, 10).forEach((item) => {
    const rankStr = `#${String(item.rank).padStart(2, '0')}`;
    const changeStr = item.changeText.padEnd(5, ' ');
    const viewsStr = item.views ? `${item.views} views`.padEnd(10, ' ') : '집계 중   ';
    const titleSnippet = item.title.length > 40 ? item.title.slice(0, 38) + '...' : item.title;
    console.log(`${rankStr} [${changeStr}]  ${viewsStr}  ${titleSnippet}`);
  });
  if (allRankedList.length > 10) {
    console.log(`... and ${allRankedList.length - 10} more articles ranked in full leaderboard.`);
  }
  console.log(`======================================================================
`);

  const outputData = {
    updatedAt: getKstDisplayDate(),
    isRealGA,
    posts: allRankedList.slice(0, 5), // 홈 전광판용 상위 5개
    allPosts: allRankedList // 전체 랭킹 페이지용 전체 목록
  };

  fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2), 'utf8');
}

main().catch(err => {
  console.error('❌ Failed to generate trending posts:', err);
  process.exit(1);
});
