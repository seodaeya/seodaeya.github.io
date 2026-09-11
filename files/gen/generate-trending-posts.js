const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const postsDir = path.join(process.cwd(), 'files/posts');
const outputFile = path.join(process.cwd(), 'files/trending-posts.json');
const baselineFile = path.join(process.cwd(), 'files/monthly-baseline-ranking.json');

// 한국 시간 기준 날짜 및 월간 메타데이터 계산 (KST, UTC+9)
function getKstInfo() {
  const now = new Date();
  const kstOffset = 9 * 60; // KST is UTC+9
  const localOffset = now.getTimezoneOffset();
  const kstTime = new Date(now.getTime() + (kstOffset + localOffset) * 60000);

  const year = kstTime.getFullYear();
  const monthNum = kstTime.getMonth() + 1;
  const month = String(monthNum).padStart(2, '0');
  const day = kstTime.getDate();
  const hours = String(kstTime.getHours()).padStart(2, '0');
  const minutes = String(kstTime.getMinutes()).padStart(2, '0');

  const monthKey = `${year}-${month}`;
  const baselineDateStr = `${year}년 ${monthNum}월 1일 기준`;
  const updatedAtStr = `${year}년 ${monthNum}월 ${day}일 ${hours}:${minutes} KST`;

  return {
    year,
    monthNum,
    month: monthKey,
    day,
    baselineDateStr,
    updatedAtStr,
    kstTime
  };
}

// 1. GA4 실시간 / 누적 페이지뷰 조회 (GitHub Actions 환경 등)
async function fetchRealGA4RankingsWithRetry(maxRetries = 3) {
  const propertyId = process.env.GA_PROPERTY_ID;
  const serviceAccountKey = process.env.GA_SERVICE_ACCOUNT_KEY;

  if (!propertyId || !serviceAccountKey) {
    console.log('ℹ️ [GA4] GA_SERVICE_ACCOUNT_KEY or GA_PROPERTY_ID not provided. Using preserved monthly baseline / fallback data.');
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

  console.error('❌ [GA4 API] All retry attempts exhausted. Falling back to preserved data.');
  return null;
}

// 2. 전체 블로그 아티클 파일 목록 읽기 (결정론적 신선도 및 본문 점수)
function getAllPostsWithScores() {
  if (!fs.existsSync(postsDir)) return [];
  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));

  return files.map(filename => {
    const slug = filename.replace('.md', '');
    const fullPath = path.join(postsDir, filename);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    const postDate = data.date ? new Date(data.date).getTime() : 0;
    const daysOld = Math.max(0, Math.floor((Date.now() - postDate) / (1000 * 60 * 60 * 24)));
    
    // 신선도 점수 (최신 글일수록 가중치) + 글 분량 가중치 (인위적 난수 해시 배제)
    const freshnessScore = Math.max(1, 100 - daysOld * 1.2);
    const contentWeight = Math.min(20, Math.floor(content.length / 500));
    const baseScore = freshnessScore + contentWeight;

    return {
      slug,
      title: data.title || slug,
      category: data.category || 'Tech & Dev',
      date: data.date || '',
      postDate,
      daysOld,
      image: data.image || '',
      tags: data.tags || [],
      excerpt: data.excerpt || content.slice(0, 120).replace(/[#*`]/g, '').trim(),
      baseScore
    };
  });
}

// 3. 기존 보존된 조회수 맵 읽기 (로컬 빌드 시 GA 실측 조회수 유실 방지)
function getPreservedViewsMap() {
  const viewsMap = {};
  
  // 1순위: 월간 기준 파일에 저장된 조회수
  if (fs.existsSync(baselineFile)) {
    try {
      const baselineData = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
      if (Array.isArray(baselineData.posts)) {
        baselineData.posts.forEach(p => {
          if (p.views && p.url) {
            const slug = p.url.replace('/posts/', '');
            viewsMap[slug] = p.views;
          }
        });
      }
    } catch (e) {}
  }

  // 2순위: 기존 trending-posts.json 파일에 저장된 조회수 보완
  if (fs.existsSync(outputFile)) {
    try {
      const prevTrending = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
      const list = prevTrending.allPosts || prevTrending.posts || [];
      list.forEach(p => {
        if (p.views && p.url) {
          const slug = p.url.replace('/posts/', '');
          if (!viewsMap[slug]) {
            viewsMap[slug] = p.views;
          }
        }
      });
    } catch (e) {}
  }

  return viewsMap;
}

async function main() {
  const kstInfo = getKstInfo();
  const realGA = await fetchRealGA4RankingsWithRetry();
  const allCandidatePosts = getAllPostsWithScores();
  const isRealGA = Boolean(realGA && realGA.length > 0);

  // GA4 실측 조회수가 있으면 최우선 적용, 없으면 기존 보존된 실측 조회수 유지
  const gaViewsMap = {};
  if (realGA) {
    realGA.forEach(item => {
      gaViewsMap[item.slug] = item.views;
    });
  } else {
    const preserved = getPreservedViewsMap();
    Object.assign(gaViewsMap, preserved);
  }

  // 전체 아티클 정렬: 조회수 절대 우선(100,000점) + 발행일 최신순(postDate) + baseScore
  const scoredPosts = allCandidatePosts.map(post => {
    const views = gaViewsMap[post.slug] || 0;
    // 결정론적 스코어: 조회수가 1회라도 있으면 100,000점 단위로 최우선 정렬
    const totalScore = (views * 100000) + post.baseScore;
    return {
      ...post,
      views: views > 0 ? views : null,
      totalScore
    };
  }).sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    // 동점 시 최신 발행일 우선
    return b.postDate - a.postDate;
  });

  // 4. 월간 기준 순위표(Monthly Baseline) 로드 및 자동 갱신 로직
  // 매월 1일이거나 기준 파일이 없거나, 기준 파일의 월이 현재 월과 다를 경우 새로운 월간 기준 생성
  let monthlyBaselineMap = {};
  let baselineDateStr = kstInfo.baselineDateStr;
  let isNewBaselineCreated = false;

  if (fs.existsSync(baselineFile)) {
    try {
      const existingBaseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
      // 동일한 월의 기준표가 유효한 경우 기존 기준 맵 사용 (매월 1일 당일이 아닌 경우)
      if (existingBaseline.month === kstInfo.month && kstInfo.day !== 1) {
        monthlyBaselineMap = existingBaseline.rankings || {};
        if (existingBaseline.baselineDate) {
          baselineDateStr = existingBaseline.baselineDate.includes('기준') 
            ? existingBaseline.baselineDate 
            : `${existingBaseline.baselineDate} 기준`;
        }
      } else {
        // 매월 1일이 되었거나 월이 바뀐 경우: 새로운 월간 기준 생성
        isNewBaselineCreated = true;
      }
    } catch (e) {
      isNewBaselineCreated = true;
    }
  } else {
    isNewBaselineCreated = true;
  }

  // 새로운 월간 기준 생성 및 파일 기록
  if (isNewBaselineCreated) {
    const newBaselineMap = {};
    const baselinePosts = scoredPosts.map((item, idx) => {
      const rank = idx + 1;
      const url = `/posts/${item.slug}`;
      newBaselineMap[url] = rank;
      return {
        rank,
        title: item.title,
        url,
        category: item.category,
        views: item.views
      };
    });

    const newBaselineData = {
      month: kstInfo.month,
      baselineDate: `${kstInfo.year}년 ${kstInfo.monthNum}월 1일`,
      description: `${kstInfo.year}년 ${kstInfo.monthNum}월 월간 기준 순위표 (매월 1일 기준)`,
      createdAt: new Date().toISOString(),
      rankings: newBaselineMap,
      posts: baselinePosts
    };

    fs.writeFileSync(baselineFile, JSON.stringify(newBaselineData, null, 2), 'utf8');
    monthlyBaselineMap = newBaselineMap;
    baselineDateStr = `${kstInfo.year}년 ${kstInfo.monthNum}월 1일 기준`;
    console.log(`📌 [Monthly Baseline] Established new baseline ranking for ${kstInfo.month} (Total: ${baselinePosts.length} posts).`);
  }

  // 5. 월간 기준 순위 대비 일일 변동폭(▲, ▼, -, NEW) 계산
  const allRankedList = scoredPosts.map((item, currentIdx) => {
    const currentRank = currentIdx + 1;
    const postUrl = `/posts/${item.slug}`;
    const prevRank = monthlyBaselineMap[postUrl];
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
      // 월초 기준표에 없던 신규 글: 최근 30일(또는 신규 발행) 글은 'NEW'로 표시
      if (item.daysOld <= 30) {
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
  console.log(`🏆 [Monthly Leaderboard] ${kstInfo.month} Rankings (${baselineDateStr}, Real GA: ${isRealGA || Boolean(allRankedList[0]?.views)})`);
  console.log(`======================================================================`);
  allRankedList.slice(0, 10).forEach((item) => {
    const rankStr = `#${String(item.rank).padStart(2, '0')}`;
    const changeStr = item.changeText.padEnd(5, ' ');
    const viewsStr = item.views ? `${item.views} views`.padEnd(10, ' ') : '집계 중   ';
    const titleSnippet = item.title.length > 40 ? item.title.slice(0, 38) + '...' : item.title;
    console.log(`${rankStr} [${changeStr}]  ${viewsStr}  ${titleSnippet}`);
  });
  if (allRankedList.length > 10) {
    console.log(`... and ${allRankedList.length - 10} more articles ranked in full monthly leaderboard.`);
  }
  console.log(`======================================================================\n`);

  const outputData = {
    updatedAt: kstInfo.updatedAtStr,
    baselineDate: baselineDateStr,
    isRealGA: isRealGA || Boolean(allRankedList[0]?.views),
    posts: allRankedList.slice(0, 5), // 홈 전광판용 상위 5개
    allPosts: allRankedList // 전체 랭킹 페이지용 전체 목록
  };

  fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2), 'utf8');
}

main().catch(err => {
  console.error('❌ Failed to generate trending posts:', err);
  process.exit(1);
});
