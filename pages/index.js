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
        excerpt: createPlainExcerpt(content, 100) || '글 내용을 확인해보세요.',
        excerptHtml: createRichExcerpt(content, 100) || '글 내용을 확인해보세요.',
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
        excerpt: createPlainExcerpt(content, 60) || '유튜브 영상을 감상해 보세요.',
        excerptHtml: createRichExcerpt(content, 60) || '유튜브 영상을 감상해 보세요.',
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

  return {
    props: {
      latestPosts: posts.slice(0, 5),
      latestVideos: videos.slice(0, 5),
    },
  };
}

export default function Home({ latestPosts, latestVideos }) {
  const [searchQuery, setSearchQuery] = useState('');
  const featuredVideo = latestVideos.length > 0 ? latestVideos[0] : null;

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

  // 실시간 클라이언트 사이드 검색 필터링
  const filteredPosts = latestPosts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVideos = latestVideos.filter(video => 
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    video.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <SEO 
        title="나는 사람이다. | 기술과 일상의 기록"
        description="AI 시대에 남기는 지극히 인간적인 기록들을 모아둔 1인 블로그입니다. 웹 개발, IT 기기 리뷰, 일상적인 경험과 팁 등 유익한 이야기를 나눕니다."
        url="https://seodaeya.github.io"
      />

      <div className={styles.homeContainer}>
        {/* 1. Hero Section */}
        <section className={styles.heroSection}>
          <div className={styles.heroSubtitleContainer}>
            <span className={styles.heroSubtitleText}>Human-Centric Blog & YouTube</span>
          </div>
          <h1 className={styles.heroTitle}>나는 사람이다.</h1>
          <p className={styles.heroTagline}>
            AI가 모든 정보를 요약하고 판단하는 시대, 기계적인 알고리즘을 거슬러 
            인간의 오감으로 느끼고 경험한 지극히 개인적인 기록들을 모아둡니다.
          </p>
          <div className={styles.heroActions}>
            <a 
              href="https://www.youtube.com/@Na.R.D." 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.primaryButton}
            >
              유튜브 채널 구독하기
            </a>
            <a href="#feed" className={styles.secondaryButton}>
              최근 콘텐츠 보기
            </a>
          </div>
        </section>

        {/* 2. Interactive Search Bar */}
        <section className={styles.searchSection}>
          <div className={styles.searchInputWrapper}>
            <input 
              type="text" 
              placeholder="검색어를 입력해 주세요 (예: 크레스티드 게코, AI, PostgreSQL)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {/* Search Glass Icon */}
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
          </div>
        </section>

        {/* 3. Featured YouTube Content Showcase */}
        {featuredVideo && searchQuery === '' && (
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
        {filteredPosts.length === 0 && filteredVideos.length === 0 ? (
          <div className={styles.noResultsGlobal}>
            <span style={{ fontSize: '2rem', marginBottom: '16px', display: 'block' }}>🔍</span>
            입력하신 검색어 <strong>&quot;{searchQuery}&quot;</strong>에 맞는 콘텐츠가 없습니다.
          </div>
        ) : (
          <section 
            id="feed" 
            className={`${styles.feedSection} ${(searchQuery && (filteredPosts.length === 0 || filteredVideos.length === 0)) ? styles.singleColumnFeed : ''}`}
          >
            {/* Left Column: Blog Posts */}
            {(!searchQuery || filteredPosts.length > 0) && (
              <div>
                <div className={styles.columnHeader}>
                  <h2 className={styles.columnTitle}>
                    <span className={styles.columnIcon}>📝</span> 블로그 글 {searchQuery && `(${filteredPosts.length})`}
                  </h2>
                  <Link href="/categories" className={styles.viewAllLink}>
                    카테고리 전체보기 →
                  </Link>
                </div>
                <div className={styles.feedList}>
                  {filteredPosts.map((post) => (
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
              </div>
            )}

            {/* Right Column: YouTube Videos */}
            {(!searchQuery || filteredVideos.length > 0) && (
              <div>
                <div className={styles.columnHeader}>
                  <h2 className={styles.columnTitle}>
                    <span className={styles.columnIcon}>📺</span> 유튜브 영상 콘텐츠 {searchQuery && `(${filteredVideos.length})`}
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
                  {filteredVideos.map((video) => (
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
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
}
