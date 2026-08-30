import { useState, useMemo } from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import SEO from '@/components/SEO';
import styles from '@/styles/ranking.module.css';

export async function getStaticProps() {
  const trendingPath = path.join(process.cwd(), 'files/trending-posts.json');
  let trendingData = {
    updatedAt: '매일 00:00 KST 기준',
    isRealGA: false,
    posts: [],
    allPosts: []
  };

  if (fs.existsSync(trendingPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(trendingPath, 'utf8'));
      trendingData = parsed;
    } catch (e) {
      console.error('Error reading trending-posts.json:', e);
    }
  }

  const allRankings = trendingData.allPosts && trendingData.allPosts.length > 0 
    ? trendingData.allPosts 
    : (trendingData.posts || []);

  return {
    props: {
      updatedAt: trendingData.updatedAt || '매일 00:00 KST 기준',
      isRealGA: trendingData.isRealGA || false,
      allRankings,
    },
  };
}

export default function RankingPage({ updatedAt, isRealGA, allRankings = [] }) {
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [isShowAll, setIsShowAll] = useState(false);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = ['전체'];
    allRankings.forEach(item => {
      if (item.category && !cats.includes(item.category)) {
        cats.push(item.category);
      }
    });
    return cats;
  }, [allRankings]);

  // Filter rankings based on category tab & search query
  const filteredRankings = useMemo(() => {
    return allRankings.filter(item => {
      const matchesCategory = selectedCategory === '전체' || item.category === selectedCategory;
      const cleanQ = searchQuery.toLowerCase().trim();
      const matchesQuery = !cleanQ || 
        item.title.toLowerCase().includes(cleanQ) || 
        (item.badge && item.badge.toLowerCase().includes(cleanQ)) ||
        (item.desc && item.desc.toLowerCase().includes(cleanQ));
      return matchesCategory && matchesQuery;
    });
  }, [allRankings, selectedCategory, searchQuery]);

  const top3 = allRankings.slice(0, 3);
  
  // 기본은 10위까지 노출, 더보기 토글 시 전체 노출 (검색이나 카테고리 필터링 시에는 전체 일치 항목 노출)
  const isDefaultView = selectedCategory === '전체' && !searchQuery;
  const displayedList = isDefaultView && !isShowAll 
    ? filteredRankings.slice(0, 10) 
    : filteredRankings;

  const getChangeClass = (change) => {
    if (change === 'up') return styles.changeUp;
    if (change === 'down') return styles.changeDown;
    if (change === 'new') return styles.changeNew;
    return styles.changeSame;
  };

  const getAriaLabel = (item) => {
    if (item.change === 'up') return `${item.changeText.replace('▲', '').trim()}계단 상승`;
    if (item.change === 'down') return `${item.changeText.replace('▼', '').trim()}계단 하락`;
    if (item.change === 'new') return '신규 진입';
    return '순위 변동 없음';
  };

  return (
    <>
      <SEO 
        title="실시간 인기 아티클 랭킹 | 서대야 블로그"
        description="구글 애널리틱스(GA4) 실측 데이터와 독자 반응을 기반으로 집계된 기술 아티클 실시간 종합 인기 순위입니다."
        url="https://seodaeya.github.io/ranking"
      />

      <div className={styles.rankingPage}>
        {/* 1. Hero Header Banner */}
        <section className={styles.heroBanner}>
          <div className={styles.heroTopRow}>
            <div className={styles.liveStatusPill}>
              <span className={styles.liveDot} />
              <span>{isRealGA ? 'GA4 실측 라이브 연동' : 'LIVE 인기 순위'}</span>
            </div>
            <div className={styles.updateTimeBadge}>
              🕒 기준 시점: <strong>{updatedAt}</strong>
            </div>
          </div>
          <h1 className={styles.heroTitle}>🏆 실시간 인기 아티클 랭킹</h1>
          <p className={styles.heroSubtitle}>
            Google Analytics 4(GA4)의 실제 독자 페이지뷰와 최신 아티클 신선도 가중치를 결합하여 매일 집계되는 블로그 전체 기술 아티클 종합 순위표입니다.
          </p>
        </section>

        {/* 2. Top 3 Podium Cards (상위 1~3위 챔피언 카드) */}
        {selectedCategory === '전체' && !searchQuery && top3.length >= 3 && (
          <section className={styles.podiumSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span>👑</span> 명예의 전당 TOP 3
              </h2>
            </div>
            <div className={styles.podiumGrid}>
              {/* 1st Place Gold */}
              <Link href={top3[0].url} className={`${styles.podiumCard} ${styles.podiumCard1}`}>
                <div className={styles.podiumTopRow}>
                  <span className={`${styles.podiumRankBadge} ${styles.rank1Color}`}>
                    🥇 1위
                  </span>
                  <span 
                    className={`${styles.changePill} ${getChangeClass(top3[0].change)}`}
                    aria-label={getAriaLabel(top3[0])}
                  >
                    {top3[0].changeText || '-'}
                  </span>
                </div>
                <h3 className={styles.podiumTitle}>{top3[0].title}</h3>
                <p className={styles.podiumDesc}>{top3[0].desc}</p>
                <div className={styles.podiumFooter}>
                  <span className={styles.categoryTag}>{top3[0].badge}</span>
                  {top3[0].views ? (
                    <span className={styles.viewsBadge}>🔥 {top3[0].views} Views</span>
                  ) : (
                    <span className={styles.viewsPendingBadge}>집계 중</span>
                  )}
                </div>
              </Link>

              {/* 2nd Place Silver */}
              <Link href={top3[1].url} className={`${styles.podiumCard} ${styles.podiumCard2}`}>
                <div className={styles.podiumTopRow}>
                  <span className={`${styles.podiumRankBadge} ${styles.rank2Color}`}>
                    🥈 2위
                  </span>
                  <span 
                    className={`${styles.changePill} ${getChangeClass(top3[1].change)}`}
                    aria-label={getAriaLabel(top3[1])}
                  >
                    {top3[1].changeText || '-'}
                  </span>
                </div>
                <h3 className={styles.podiumTitle}>{top3[1].title}</h3>
                <p className={styles.podiumDesc}>{top3[1].desc}</p>
                <div className={styles.podiumFooter}>
                  <span className={styles.categoryTag}>{top3[1].badge}</span>
                  {top3[1].views ? (
                    <span className={styles.viewsBadge}>🔥 {top3[1].views} Views</span>
                  ) : (
                    <span className={styles.viewsPendingBadge}>집계 중</span>
                  )}
                </div>
              </Link>

              {/* 3rd Place Bronze */}
              <Link href={top3[2].url} className={`${styles.podiumCard} ${styles.podiumCard3}`}>
                <div className={styles.podiumTopRow}>
                  <span className={`${styles.podiumRankBadge} ${styles.rank3Color}`}>
                    🥉 3위
                  </span>
                  <span 
                    className={`${styles.changePill} ${getChangeClass(top3[2].change)}`}
                    aria-label={getAriaLabel(top3[2])}
                  >
                    {top3[2].changeText || '-'}
                  </span>
                </div>
                <h3 className={styles.podiumTitle}>{top3[2].title}</h3>
                <p className={styles.podiumDesc}>{top3[2].desc}</p>
                <div className={styles.podiumFooter}>
                  <span className={styles.categoryTag}>{top3[2].badge}</span>
                  {top3[2].views ? (
                    <span className={styles.viewsBadge}>🔥 {top3[2].views} Views</span>
                  ) : (
                    <span className={styles.viewsPendingBadge}>집계 중</span>
                  )}
                </div>
              </Link>
            </div>
          </section>
        )}

        {/* 3. Filter Bar & Full Rankings */}
        <section className={styles.filterSection}>
          <div className={styles.filterControlsRow}>
            <div className={styles.categoryTabs}>
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`${styles.categoryTabBtn} ${selectedCategory === cat ? styles.categoryTabBtnActive : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className={styles.searchBox}>
              <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                placeholder="순위 내 검색..." 
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Full Rankings List */}
          <div className={styles.rankingsList}>
            {displayedList.length > 0 ? (
              displayedList.map((item) => (
                <Link key={item.rank} href={item.url} className={styles.rankingRow}>
                  <div className={styles.rowLeft}>
                    <span className={styles.rankNumBadge}>
                      {item.rank === 1 ? '🥇 1' : item.rank === 2 ? '🥈 2' : item.rank === 3 ? '🥉 3' : `${item.rank}위`}
                    </span>
                    <span 
                      className={`${styles.changePill} ${getChangeClass(item.change)}`}
                      aria-label={getAriaLabel(item)}
                    >
                      {item.changeText || '-'}
                    </span>
                    <div className={styles.rowTitleGroup}>
                      <h4 className={styles.rowTitle}>{item.title}</h4>
                      <div className={styles.rowMeta}>
                        <span className={styles.categoryTag}>{item.badge}</span>
                        <span>{item.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.rowRight}>
                    {item.views ? (
                      <span className={styles.viewsBadge}>🔥 {item.views} Views</span>
                    ) : (
                      <span className={styles.viewsPendingBadge}>집계 중</span>
                    )}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </div>
                </Link>
              ))
            ) : (
              <div className={styles.noResults}>
                검색 조건에 일치하는 아티클이 없습니다.
              </div>
            )}
          </div>

          {/* Show More / Show Less Toggle Button for default top 10 view */}
          {isDefaultView && filteredRankings.length > 10 && (
            <div className={styles.showMoreContainer}>
              <button 
                type="button" 
                className={styles.showMoreRankingsBtn}
                onClick={() => setIsShowAll(!isShowAll)}
              >
                <span>{isShowAll ? '▲ 상위 10위만 보기' : `▼ 11위 ~ ${filteredRankings.length}위 전체 보기`}</span>
              </button>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
