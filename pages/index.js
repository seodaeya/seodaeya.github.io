import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { useState } from 'react';
import SEO from '@/components/SEO';
import contentUtils from '@/lib/content';
import styles from '@/styles/home.module.css';

const { createPlainExcerpt, createRichExcerpt } = contentUtils;

export async function getStaticProps() {
  const postsDir = path.join(process.cwd(), 'files/posts');
  const videosDir = path.join(process.cwd(), 'files/videos');
  
  // Read all blog posts
  let posts = [];
  if (fs.existsSync(postsDir)) {
    const filenames = fs.readdirSync(postsDir);
    posts = filenames.filter(fn => fn.endsWith('.md')).map(filename => {
      const filePath = path.join(postsDir, filename);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContents);
      
      return {
        title: data.title || filename.replace('.md', ''),
        category: data.category || 'Tech',
        date: data.date || '',
        file: `posts/${filename}`,
        excerpt: createPlainExcerpt(content, 120) || '글 내용을 확인해보세요.',
        excerptHtml: createRichExcerpt(content, 120) || '글 내용을 확인해보세요.',
      };
    });
  }

  // Read all video posts
  let videos = [];
  if (fs.existsSync(videosDir)) {
    const filenames = fs.readdirSync(videosDir);
    videos = filenames.filter(fn => fn.endsWith('.md')).map(filename => {
      const filePath = path.join(videosDir, filename);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContents);
      
      return {
        title: data.title || filename.replace('.md', ''),
        category: data.category || 'Vlog',
        date: data.date || '',
        file: `videos/${filename}`,
        videoId: data.videoId || null,
        excerpt: createPlainExcerpt(content, 80) || '유튜브 영상을 감상해 보세요.',
        excerptHtml: createRichExcerpt(content, 80) || '유튜브 영상을 감상해 보세요.',
      };
    });
  }

  const sortDate = (a, b) => {
    const timeDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (timeDiff !== 0) return timeDiff;
    return (b.file || b.id || '').localeCompare(a.file || a.id || '');
  };

  posts.sort(sortDate);
  videos.sort(sortDate);

  // Read trending / curated flagship posts with metadata
  const trendingPath = path.join(process.cwd(), 'files/trending-posts.json');
  let trendingData = { updatedAt: '매일 00:00 KST 기준', posts: [] };
  if (fs.existsSync(trendingPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(trendingPath, 'utf8'));
      if (Array.isArray(parsed)) {
        trendingData = { updatedAt: '매일 00:00 KST 기준', posts: parsed };
      } else {
        trendingData = parsed;
      }
    } catch (e) {
      trendingData = { updatedAt: '매일 00:00 KST 기준', posts: [] };
    }
  }

  return {
    props: {
      allPosts: posts,
      allVideos: videos,
      trendingData,
    },
  };
}

export default function Home({ allPosts = [], allVideos = [], trendingData = { updatedAt: '', posts: [] } }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [visiblePostCount, setVisiblePostCount] = useState(6);
  const [visibleVideoCount, setVisibleVideoCount] = useState(6);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isInfoTooltipOpen, setIsInfoTooltipOpen] = useState(false);
  const trendingPosts = trendingData?.posts || [];
  const trendingUpdatedAt = trendingData?.updatedAt || '매일 00:00 KST 기준';
  const featuredVideo = allVideos.length > 0 ? allVideos[0] : null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}. ${month}. ${day}`;
    } catch (e) {
      return dateStr;
    }
  };

  const cleanQuery = searchQuery.trim().toLowerCase();

  // 검색어가 있을 때는 전체 검색 결과, 없을 때는 단계별 더보기 지원
  const displayedPosts = cleanQuery
    ? allPosts.filter(post => 
        post.title.toLowerCase().includes(cleanQuery) || 
        post.excerpt.toLowerCase().includes(cleanQuery) ||
        post.category.toLowerCase().includes(cleanQuery)
      )
    : allPosts.slice(0, visiblePostCount);

  const displayedVideos = cleanQuery
    ? allVideos.filter(video => 
        video.title.toLowerCase().includes(cleanQuery) || 
        video.excerpt.toLowerCase().includes(cleanQuery) ||
        video.category.toLowerCase().includes(cleanQuery)
      )
    : allVideos.slice(0, visibleVideoCount);

  return (
    <>
      <SEO 
        title="여전히, 나는 사람이다. | 기술과 일상의 기록"
        description="인공지능 트렌드부터 손끝의 일상까지, 직접 겪고 기록하는 이야기. IT 기기 리뷰, 개발 경험, 일상의 팁을 나눕니다."
        url="https://seodaeya.github.io"
      />

      <div className={styles.homeContainer}>
        {/* 1. Hero Section */}
        <section className={styles.heroSection}>
          <div className={styles.heroSubtitleContainer}>
            <span className={styles.heroSubtitleText}>Human Warmth & AI Co-Learning</span>
          </div>
          <h1 className={styles.heroTitle}>여전히, 나는 사람이다.</h1>
          <p className={styles.heroTagline}>
            완벽하지 않기에 배우고, 실수하기에 도전합니다.<br />
            AI라는 스마트한 도구 위에서 피어나는 가장 인간다운 생각과 일상의 기록.
          </p>
          <div className={styles.heroActions}>
            <Link href="/about" className={styles.primaryButton}>
              블로그 이야기 읽기 ✨
            </Link>
            <a href="#feed" className={styles.secondaryButton}>
              최근 콘텐츠 둘러보기 ↓
            </a>
          </div>
        </section>

        {/* 2. Interactive Search Bar */}
        <section className={styles.searchSection}>
          <div className={styles.searchInputWrapper}>
            <input 
              type="text" 
              placeholder="검색어를 입력해 주세요 (예: 맥 미니, AI, 크레스티드 게코, DIY)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery ? (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  padding: '4px'
                }}
                aria-label="검색어 지우기"
              >
                ✕
              </button>
            ) : (
              <svg 
                className={styles.searchIcon} 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                fill="none" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            )}
          </div>
        </section>

        {/* 2.5. Bulletproof Live Leaderboard (헤더 + 1위 카드 + 2~5위 서랍) */}
        {!cleanQuery && trendingPosts && trendingPosts.length > 0 && (() => {
          const rank1 = trendingPosts[0];
          const remainingRanks = trendingPosts.slice(1);

          const getChangeClass = (change) => {
            if (change === 'up') return styles.changeUp;
            if (change === 'down') return styles.changeDown;
            if (change === 'new') return styles.changeNew;
            return styles.changeSame;
          };

          return (
            <section 
              className={`${styles.leaderboardSection} ${isLeaderboardOpen ? styles.leaderboardSectionExpanded : ''}`} 
              aria-label="실시간 인기 아티클 랭킹"
            >
              {/* Header Row: LIVE Badge with Info Tooltip (Left) + Toggle Button (Right) */}
              <div className={styles.leaderboardHeaderRow}>
                <div className={styles.leaderboardLiveBadge}>
                  <span className={styles.liveDot} />

                  {/* i Tooltip Trigger */}
                  <div className={styles.infoTooltipWrapper}>
                    <button
                      type="button"
                      className={styles.infoTooltipBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsInfoTooltipOpen(!isInfoTooltipOpen);
                      }}
                      aria-label="실시간 랭킹 집계 기준 안내 툴팁"
                      title="집계 기준 시점 안내"
                    >
                      i
                    </button>

                    {/* Tooltip Popover Box */}
                    {isInfoTooltipOpen && (
                      <div className={styles.infoTooltipBox} role="tooltip">
                        <div className={styles.infoTooltipHeader}>
                          <span>ℹ️</span> <strong>인기 랭킹 집계 기준</strong>
                        </div>
                        <p className={styles.infoTooltipText}>
                          매일 한국 시간 00:00(자정)에 블로그 아티클의 최신 발행일, 아키텍처 중요도 및 독자 관심도 가중치를 자동 계산하여 순위가 역동적으로 갱신됩니다.
                        </p>
                        <div className={styles.infoTooltipFooter}>
                          <span>📅 기준 시점:</span> <strong>{trendingUpdatedAt}</strong>
                        </div>
                      </div>
                    )}
                  </div>

                  <span>🏆 실시간 인기 아티클</span>
                </div>

                <button 
                  type="button" 
                  className={styles.expandToggleBtn}
                  onClick={() => setIsLeaderboardOpen(!isLeaderboardOpen)}
                  aria-label="인기 아티클 1~5위 전체보기 토글"
                >
                  <span>{isLeaderboardOpen ? '접기 ▲' : '1~5위 순위보기 ▼'}</span>
                </button>
              </div>

              {/* 1st Place Hero Card */}
              <Link href={rank1.url} className={styles.leaderboardRank1Card}>
                <div className={styles.rankBadgeGroup}>
                  <span className={styles.rank1Badge}>🥇 1위</span>
                  <span className={`${styles.changePill} ${getChangeClass(rank1.change)}`}>
                    {rank1.changeText || '-'}
                  </span>
                  {rank1.badge && (
                    <span className={styles.leaderboardTag}>{rank1.badge}</span>
                  )}
                </div>
                <h3 className={styles.leaderboardTitleText}>{rank1.title}</h3>
              </Link>

              {/* 2위 ~ 5위 확장 서랍 (PC 호버 또는 토글 클릭 시 노출) */}
              <div className={`${styles.leaderboardExpandable} ${isLeaderboardOpen ? styles.leaderboardExpandableActive : ''}`}>
                {remainingRanks.map((post, idx) => {
                  const currentRank = idx + 2;
                  const rankBadgeClass = currentRank === 2 ? styles.rank2Badge : currentRank === 3 ? styles.rank3Badge : styles.rankNormalBadge;
                  const rankLabel = currentRank === 2 ? '🥈 2위' : currentRank === 3 ? '🥉 3위' : `${currentRank}위`;

                  return (
                    <Link key={idx} href={post.url} className={styles.leaderboardItem}>
                      <div className={styles.rankBadgeGroup}>
                        <span className={rankBadgeClass}>{rankLabel}</span>
                        <span className={`${styles.changePill} ${getChangeClass(post.change)}`}>
                          {post.changeText || '-'}
                        </span>
                        {post.badge && (
                          <span className={styles.leaderboardTag}>{post.badge}</span>
                        )}
                      </div>
                      <h4 className={styles.leaderboardItemTitleText}>{post.title}</h4>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* 3. Featured YouTube Content Showcase (검색어가 없을 때만 노출) */}
        {featuredVideo && !cleanQuery && (
          <section className="glass-card">
            <div className={styles.featuredShowcase}>
              <div className="video-wrapper">
                <iframe
                  src={`https://www.youtube.com/embed/${featuredVideo.videoId}`}
                  title={featuredVideo.title}
                  allowFullScreen
                ></iframe>
              </div>
              <div className={styles.showcaseContent}>
                <span className={styles.badgeYouTube}>
                  <svg className={styles.badgeIcon} viewBox="0 0 24 24">
                    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  Featured Video
                </span>
                <h2 className={styles.showcaseTitle}>
                  <Link href={`/${featuredVideo.file.replace('.md', '')}`}>
                    {featuredVideo.title}
                  </Link>
                </h2>
                <p
                  className={styles.showcaseDesc}
                  dangerouslySetInnerHTML={{ __html: featuredVideo.excerptHtml }}
                />
                <div style={{ marginTop: '8px' }}>
                  <span className="category-badge">{featuredVideo.category}</span>
                  <span style={{ marginLeft: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {formatDate(featuredVideo.date)}
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 4. Dual Column Feeds */}
        {displayedPosts.length === 0 && displayedVideos.length === 0 ? (
          <div className={styles.noResultsGlobal}>
            <span style={{ fontSize: '2rem', marginBottom: '16px', display: 'block' }}>🔍</span>
            입력하신 검색어 <strong>&quot;{searchQuery}&quot;</strong>에 맞는 콘텐츠가 없습니다.
          </div>
        ) : (
          <section 
            id="feed" 
            className={`${styles.feedSection} ${(cleanQuery && (displayedPosts.length === 0 || displayedVideos.length === 0)) ? styles.singleColumnFeed : ''}`}
          >
            {/* Left Column: Blog Posts */}
            {(!cleanQuery || displayedPosts.length > 0) && (
              <div>
                <div className={styles.columnHeader}>
                  <h2 className={styles.columnTitle}>
                    <span className={styles.columnIcon}>📝</span> {cleanQuery ? `검색된 블로그 글 (${displayedPosts.length})` : '최근 블로그 글'}
                  </h2>
                  <Link href="/categories" className={styles.viewAllLink}>
                    카테고리 전체보기 →
                  </Link>
                </div>
                <div className={styles.feedList}>
                  {displayedPosts.map((post) => (
                    <Link 
                      key={post.file} 
                      href={`/${post.file.replace('.md', '')}`} 
                      className={styles.miniCard}
                    >
                      <div className={styles.miniCardHeader}>
                        <span className="category-badge">{post.category}</span>
                        <span className={styles.cardMeta}>{formatDate(post.date)}</span>
                      </div>
                      <h3 className={styles.cardTitle}>{post.title}</h3>
                      <p
                        className={styles.cardExcerpt}
                        dangerouslySetInnerHTML={{ __html: post.excerptHtml }}
                      />
                    </Link>
                  ))}
                </div>
                {!cleanQuery && visiblePostCount < allPosts.length && (
                  <button
                    type="button"
                    className={styles.loadMoreBtn}
                    onClick={() => setVisiblePostCount(prev => prev + 6)}
                  >
                    <span>↓</span> 블로그 글 더보기 ({displayedPosts.length}/{allPosts.length})
                  </button>
                )}
              </div>
            )}

            {/* Right Column: YouTube Videos */}
            {(!cleanQuery || displayedVideos.length > 0) && (
              <div>
                <div className={styles.columnHeader}>
                  <h2 className={styles.columnTitle}>
                    <span className={styles.columnIcon}>📺</span> {cleanQuery ? `검색된 영상 콘텐츠 (${displayedVideos.length})` : '최근 영상 콘텐츠'}
                  </h2>
                  <a 
                    href="https://www.youtube.com/@Na.R.D." 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={styles.viewAllLink}
                  >
                    채널 바로가기 →
                  </a>
                </div>
                <div className={styles.feedList}>
                  {displayedVideos.map((video) => (
                    <Link 
                      key={video.file} 
                      href={`/${video.file.replace('.md', '')}`} 
                      className={`${styles.miniCard} ${styles.videoMiniCard}`}
                    >
                      <div className={styles.videoCardGrid}>
                        <div className={styles.videoThumbnailWrapper}>
                          {video.videoId ? (
                            <>
                              <img 
                                src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`} 
                                alt={video.title}
                                className={styles.videoThumbnail}
                                loading="lazy"
                              />
                              <div className={styles.playOverlay}>
                                <svg className={styles.playIcon} viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </>
                          ) : (
                            <div style={{ width: '100%', height: '100%', background: 'var(--bg-tertiary)' }} />
                          )}
                        </div>
                        <div className={styles.videoCardInfo}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="category-badge" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                              {video.category}
                            </span>
                            <span className={styles.cardMeta}>{formatDate(video.date)}</span>
                          </div>
                          <h3 className={styles.cardTitle} style={{ fontSize: '1rem' }}>{video.title}</h3>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                {!cleanQuery && visibleVideoCount < allVideos.length && (
                  <button
                    type="button"
                    className={styles.loadMoreBtn}
                    onClick={() => setVisibleVideoCount(prev => prev + 6)}
                  >
                    <span>↓</span> 영상 콘텐츠 더보기 ({displayedVideos.length}/{allVideos.length})
                  </button>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
}
