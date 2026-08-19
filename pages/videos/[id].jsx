import fs from 'fs';
import path from 'path';
import Head from 'next/head';
import Link from 'next/link';
import matter from 'gray-matter';
import { marked } from 'marked';
import SEO from '@/components/SEO';
import Comments from '@/components/Comments';
import Breadcrumbs from '@/components/Breadcrumbs';
import TOC from '@/components/TOC';
import contentUtils from '@/lib/content';
import styles from '@/styles/video.module.css';

const { createPlainExcerpt } = contentUtils;

export async function getStaticPaths() {
  const videosDir = path.join(process.cwd(), '/files/videos');
  const filenames = fs.readdirSync(videosDir).filter(fn => fn.endsWith('.md'));
  
  const paths = [];
  filenames.forEach((filename) => {
    const id = filename.replace('.md', '');
    paths.push({ params: { id } });

    // Legacy short prefix path support (e.g. 20260624-1 -> 20260624-1-santafe-tm-afterblow-step1)
    const match = id.match(/^(\d{8}-\d+)/);
    if (match && match[1] !== id) {
      paths.push({ params: { id: match[1] } });
    }
  });

  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const postsDir = path.join(process.cwd(), '/files/posts');
  const videosDir = path.join(process.cwd(), '/files/videos');
  
  let targetFilename = `${params.id}.md`;
  let isRedirect = false;
  let redirectTo = null;

  // Check if params.id is a legacy short ID (e.g. 20260624-1)
  if (!fs.existsSync(path.join(videosDir, targetFilename))) {
    const allFiles = fs.readdirSync(videosDir).filter(fn => fn.endsWith('.md'));
    const matched = allFiles.find(fn => fn.startsWith(`${params.id}-`));
    if (matched) {
      isRedirect = true;
      redirectTo = `/videos/${matched.replace('.md', '')}`;
      targetFilename = matched;
    }
  }

  const filePath = path.join(videosDir, targetFilename);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  if (isRedirect) {
    return {
      props: {
        isRedirect: true,
        redirectTo,
        targetTitle: data.title || '',
      },
    };
  }

  // Helper to read posts list for related/prev/next links
  const readDir = (dir, type) => {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter(fn => fn.endsWith('.md')).map(filename => {
      const fc = fs.readFileSync(path.join(dir, filename), 'utf-8');
      const { data: d, content: c } = matter(fc);
      return {
        id: filename.replace('.md', ''),
        type,
        title: d.title || '',
        category: d.category || '',
        date: d.date || '',
        image: d.image || '',
        excerpt: createPlainExcerpt(c, 100),
      };
    });
  };

  const allContent = [
    ...readDir(postsDir, 'posts'),
    ...readDir(videosDir, 'videos')
  ].sort((a, b) => {
    const timeDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (timeDiff !== 0) return timeDiff;
    return (b.id || '').localeCompare(a.id || '');
  });

  const currentIndex = allContent.findIndex(item => item.id === params.id && item.type === 'videos');
  
  const prevVideo = currentIndex !== -1 && currentIndex < allContent.length - 1 ? allContent[currentIndex + 1] : null;
  const nextVideo = currentIndex > 0 ? allContent[currentIndex - 1] : null;
  
  const relatedVideos = allContent
    .filter(item => item.category === data.category && !(item.id === params.id && item.type === 'videos'))
    .slice(0, 3);

  return {
    props: {
      isRedirect: false,
      id: params.id,
      frontmatter: data,
      content: marked(content),
      excerpt: createPlainExcerpt(content, 120) || '영상 정보를 확인해보세요.',
      prevVideo,
      nextVideo,
      relatedVideos,
    },
  };
}

export default function Video({ isRedirect, redirectTo, targetTitle, id, frontmatter, content, excerpt, prevVideo, nextVideo, relatedVideos }) {
  if (isRedirect) {
    return (
      <>
        <SEO
          title={targetTitle || "페이지 이동 중"}
          url={`https://seodaeya.github.io${redirectTo}`}
        />
        <Head>
          <meta httpEquiv="refresh" content={`0;url=${redirectTo}`} />
          <link rel="canonical" href={`https://seodaeya.github.io${redirectTo}`} />
        </Head>
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '40px 20px',
        }}>
          <div className="glass-card" style={{ padding: '40px 30px', maxWidth: '500px' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>페이지 이동 중...</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              새로운 최적화 주소로 자동 이동합니다. 잠시만 기다려 주세요.
            </p>
            <Link
              href={redirectTo}
              style={{
                display: 'inline-block',
                padding: '10px 24px',
                borderRadius: '20px',
                background: 'var(--accent-gradient)',
                color: '#fff',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              지금 바로 이동하기 →
            </Link>
          </div>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.location.replace("${redirectTo}");`,
          }}
        />
      </>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <>
      <SEO
        title={frontmatter.title}
        description={excerpt}
        image={frontmatter.image || (frontmatter.videoId ? `https://img.youtube.com/vi/${frontmatter.videoId}/maxresdefault.jpg` : undefined)}
        url={`https://seodaeya.github.io/videos/${id}`}
        type="video.other"
        date={frontmatter.date}
      />

      <div className={styles.videoWrapper}>
        <article className={styles.articleBody}>
          {/* Breadcrumbs Navigation */}
          <Breadcrumbs category={frontmatter.category} title={frontmatter.title} />

          {/* Back Link */}
          <div className={styles.backLinkArea}>
            <Link href="/" className={styles.backLink}>
              ← 홈으로 돌아가기
            </Link>
          </div>

          {/* Video Header */}
          <header className={styles.videoHeader}>
            {frontmatter.category && (
              <Link
                href={`/categories#category-${frontmatter.category.toUpperCase()}`}
                className="category-badge"
                style={{ marginBottom: '16px' }}
              >
                {frontmatter.category}
              </Link>
            )}
            <h1 className={styles.title}>{frontmatter.title}</h1>
            <div className={styles.metaInfo}>
              <span className={styles.metaItem}>
                작성일: <time>{formatDate(frontmatter.date)}</time>
              </span>
              <span className={styles.metaSeparator}>|</span>
              <span className={styles.metaItem}>작성자: NaRD</span>
            </div>
          </header>

          {/* Embedded YouTube Video Container */}
          {frontmatter.videoId && (
            <div className={styles.videoContainer}>
              <iframe
                className={styles.videoIframe}
                src={`https://www.youtube-nocookie.com/embed/${frontmatter.videoId}`}
                title={frontmatter.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          )}

          {/* Video Content */}
          <div
            id="video-content"
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: content }}
          />

          {/* Prev/Next Navigation Section */}
          <div className={styles.prevNextSection}>
            {prevVideo ? (
              <Link href={`/${prevVideo.type}/${prevVideo.id}`} className={styles.navCard}>
                <span className={styles.navLabel}>← 이전 영상</span>
                <span className={styles.navTitle}>{prevVideo.title}</span>
              </Link>
            ) : (
              <div />
            )}
            {nextVideo ? (
              <Link href={`/${nextVideo.type}/${nextVideo.id}`} className={`${styles.navCard} ${styles.navCardNext}`}>
                <span className={styles.navLabel}>다음 영상 →</span>
                <span className={styles.navTitle}>{nextVideo.title}</span>
              </Link>
            ) : (
              <div />
            )}
          </div>

          {/* Related Videos Section */}
          {relatedVideos && relatedVideos.length > 0 && (
            <section className={styles.relatedVideosSection}>
              <h3 className={styles.sectionTitle}>
                <span>💡</span> 카테고리 관련 영상 추천
              </h3>
              <div className={styles.relatedVideosGrid}>
                {relatedVideos.map((video) => (
                  <Link 
                    key={video.id} 
                    href={`/${video.type}/${video.id}`} 
                    className={styles.relatedCard}
                  >
                    {(video.image || video.videoId) && (
                      <div className={styles.relatedCardImageWrapper}>
                        <img 
                          src={video.image || `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`} 
                          alt={video.title} 
                          className={styles.relatedCardImage}
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className={styles.relatedCardMeta}>
                      <span className="category-badge" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>{video.category}</span>
                      <span>{formatDate(video.date)}</span>
                    </div>
                    <h4 className={styles.relatedCardTitle}>{video.title}</h4>
                    <p className={styles.relatedCardExcerpt}>{video.excerpt}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Giscus Comments widget */}
          <Comments key={id} />
        </article>

        {/* Floating Table of Contents */}
        <TOC contentSelector="#video-content" id={id} />
      </div>
    </>
  );
}
