import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import matter from 'gray-matter';
import { marked } from 'marked';
import SEO from '@/components/SEO';
import styles from '@/styles/video.module.css';

export async function getStaticPaths() {
  // 경로 오타 수정: vdieosDir -> videosDir
  const videosDir = path.join(process.cwd(), '/files/videos');
  const filenames = fs.readdirSync(videosDir);
  const paths = filenames.map((filename) => ({
    params: { id: filename.replace('.md', '') },
  }));

  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const filePath = path.join(process.cwd(), '/files/videos', `${params.id}.md`);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  const cleanExcerpt = content
    .replace(/[#*`_\[\]]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
    .substring(0, 150);

  return {
    props: {
      id: params.id,
      frontmatter: data,
      content: marked(content),
      excerpt: cleanExcerpt ? `${cleanExcerpt}...` : '유튜브 영상을 시청해보세요.',
    },
  };
}

export default function Video({ id, frontmatter, content, excerpt }) {
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
        url={`https://seodaeya.github.io/videos/${id}`}
        type="video"
        videoId={frontmatter.videoId}
        date={frontmatter.date}
      />

      <div className={styles.videoContainer}>
        {/* Back Link */}
        <div className={styles.backLinkArea}>
          <Link href="/" className={styles.backLink}>
            ← 홈으로 돌아가기
          </Link>
        </div>

        {/* Video Frame Area */}
        {frontmatter?.videoId && (
          <div className={styles.playerSection}>
            <div className="video-wrapper">
              <iframe
                src={`https://www.youtube.com/embed/${frontmatter.videoId}?autoplay=1`}
                title={frontmatter.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}

        {/* Video Information Info */}
        <div className="glass-card" style={{ marginTop: '32px' }}>
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
              <span>업로드: <time>{formatDate(frontmatter.date)}</time></span>
              <span className={styles.metaSeparator}>|</span>
              <span>제작자: NaRD</span>
            </div>
          </header>

          {/* Markdown Content */}
          <div 
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: content }}
          />

          {/* Action to YouTube Channel */}
          {frontmatter?.videoId && (
            <div className={styles.actionArea}>
              <a 
                href={`https://www.youtube.com/watch?v=${frontmatter.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.youtubeButton}
              >
                <svg className={styles.youtubeIcon} viewBox="0 0 24 24">
                  <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                YouTube에서 직접 보기
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
