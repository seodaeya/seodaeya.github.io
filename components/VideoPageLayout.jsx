import Link from 'next/link';
import SEO from '@/components/SEO';
import Comments from '@/components/Comments';
import Sponsor from '@/components/Sponsor';
import Breadcrumbs from '@/components/Breadcrumbs';
import TOC from '@/components/TOC';
import SmartRandomWidget from '@/components/SmartRandomWidget';
import BookmarkButton from '@/components/BookmarkButton';
import FontSizeControl from '@/components/FontSizeControl';
import { useTrackReading, useReadPostsSet, isContentRead } from '@/lib/readingHistory';
import styles from '@/styles/video.module.css';

export default function VideoPageLayout({
  id,
  frontmatter,
  contentHtml,
  excerpt,
  prevVideo,
  nextVideo,
  relatedVideos,
  dateModified,
}) {
  useTrackReading(`videos/${id}`);
  const readSet = useReadPostsSet();

  const formatDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return '';
    const match = dateStr.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (match) {
      const [, year, month, day] = match;
      return `${year}년 ${parseInt(month, 10)}월 ${parseInt(day, 10)}일`;
    }
    return dateStr;
  };

  return (
    <>
      <SEO
        title={frontmatter.title}
        description={excerpt}
        image={
          frontmatter.image ||
          (frontmatter.videoId
            ? `https://img.youtube.com/vi/${frontmatter.videoId}/maxresdefault.jpg`
            : undefined)
        }
        url={`https://seodaeya.github.io/videos/${id}/`}
        type="video.other"
        date={frontmatter.date}
        dateModified={dateModified}
        videoId={frontmatter.videoId}
        noindex={frontmatter.noindex === true}
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
                href={`/categories/#category-${frontmatter.category}`}
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
            {/* 독서 도구: 북마크 저장 + 글꼴 크기 조절 (로컬 저장, 로그인 불필요) */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '14px', flexWrap: 'wrap' }}>
              <BookmarkButton id={id} title={frontmatter.title} />
              <FontSizeControl />
            </div>
          </header>

          {/* Embedded YouTube Video Container */}
          {frontmatter.videoId && (
            <div className={styles.videoContainer}>
              <iframe
                className={styles.videoIframe}
                src={`https://www.youtube-nocookie.com/embed/${frontmatter.videoId}`}
                title={frontmatter.title}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          )}

          {/* Video Content */}
          <div
            id="video-content"
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />

          {/* Prev/Next Navigation Section */}
          <div className={styles.prevNextSection}>
            {prevVideo ? (
              <Link href={`/${prevVideo.type}/${prevVideo.id}/`} className={styles.navCard}>
                <span className={styles.navLabel}>← 이전 영상</span>
                <span className={styles.navTitle}>{prevVideo.title}</span>
              </Link>
            ) : (
              <div />
            )}
            {nextVideo ? (
              <Link href={`/${nextVideo.type}/${nextVideo.id}/`} className={`${styles.navCard} ${styles.navCardNext}`}>
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
                    href={`/${video.type}/${video.id}/`}
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
                      <div className={styles.relatedCardBadges}>
                        <span className="category-badge" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>{video.category}</span>
                        {isContentRead(`${video.type}/${video.id}`, readSet) && (
                          <span className="read-badge">✓ 읽음</span>
                        )}
                      </div>
                      <span className={styles.relatedCardDate}>{formatDate(video.date)}</span>
                    </div>
                    <h4 className={styles.relatedCardTitle}>{video.title}</h4>
                    <p className={styles.relatedCardExcerpt}>{video.excerpt}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Smart Random Recommendation Card */}
          <SmartRandomWidget variant="card" currentKey={`videos/${id}`} />

          {/* Sponsor KakaoPay Support Box */}
          <Sponsor />

          {/* Giscus Comments widget */}
          <Comments key={id} />
        </article>

        {/* Floating Table of Contents */}
        <TOC contentSelector="#video-content" id={id} />
      </div>
    </>
  );
}
