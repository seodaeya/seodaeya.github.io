import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import matter from 'gray-matter';
import { marked } from 'marked';
import SEO from '@/components/SEO';
import Breadcrumbs from '@/components/Breadcrumbs';
import TOC from '@/components/TOC';
import contentUtils from '@/lib/content';
import styles from '@/styles/video.module.css';

const { createPlainExcerpt } = contentUtils;

export async function getStaticPaths() {
  const videosDir = path.join(process.cwd(), '/files/videos');
  const filenames = fs.readdirSync(videosDir);
  const paths = filenames.map((filename) => ({
    params: { id: filename.replace('.md', '') },
  }));

  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const postsDir = path.join(process.cwd(), '/files/posts');
  const videosDir = path.join(process.cwd(), '/files/videos');
  const filePath = path.join(videosDir, `${params.id}.md`);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

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
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const currentIndex = allContent.findIndex(item => item.id === params.id && item.type === 'videos');
  
  const prevPost = currentIndex !== -1 && currentIndex < allContent.length - 1 ? allContent[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? allContent[currentIndex - 1] : null;
  
  const relatedPosts = allContent
    .filter(item => item.category === data.category && !(item.id === params.id && item.type === 'videos'))
    .slice(0, 3);

  return {
    props: {
      id: params.id,
      frontmatter: data,
      content: (() => {
        const renderer = new marked.Renderer();
        let headingIndex = 0;
        renderer.heading = function({ tokens, depth }) {
          const text = this.parser.parseInline(tokens);
          const id = 'heading-' + (headingIndex++);
          return '<h' + depth + ' id="' + id + '">' + text + '</h' + depth + '>';
        };
        return marked(content, { renderer });
      })(),
      excerpt: createPlainExcerpt(content, 150) || '유튜브 영상을 시청해보세요.',
      prevPost,
      nextPost,
      relatedPosts,
    },
  };
}

export default function Video({ id, frontmatter, content, excerpt, prevPost, nextPost, relatedPosts }) {

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
        image={frontmatter.image}
        url={`https://seodaeya.github.io/videos/${id}`}
        type="video"
        videoId={frontmatter.videoId}
        date={frontmatter.date}
      />

      <div className={styles.postWrapper}>
        <div className={styles.articleBody}>
          {/* Breadcrumbs Navigation */}
          <Breadcrumbs category={frontmatter.category} title={frontmatter.title} />

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
                id="video-content"
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

            {/* Prev/Next Navigation Section */}
            <div className={styles.prevNextSection}>
              {prevPost ? (
                <Link href={`/${prevPost.type}/${prevPost.id}`} className={styles.navCard}>
                  <span className={styles.navLabel}>← 이전 글</span>
                  <span className={styles.navTitle}>{prevPost.title}</span>
                </Link>
              ) : (
                <div />
              )}
              {nextPost ? (
                <Link href={`/${nextPost.type}/${nextPost.id}`} className={`${styles.navCard} ${styles.navCardNext}`}>
                  <span className={styles.navLabel}>다음 글 →</span>
                  <span className={styles.navTitle}>{nextPost.title}</span>
                </Link>
              ) : (
                <div />
              )}
            </div>

            {/* Related Posts Section */}
            {relatedPosts && relatedPosts.length > 0 && (
              <section className={styles.relatedPostsSection}>
                <h3 className={styles.sectionTitle}>
                  <span>💡</span> 카테고리 관련 글 추천
                </h3>
                <div className={styles.relatedPostsGrid}>
                  {relatedPosts.map((post) => (
                    <Link 
                      key={post.id} 
                      href={`/${post.type}/${post.id}`} 
                      className={styles.relatedCard}
                    >
                      {post.image && (
                        <div className={styles.relatedCardImageWrapper}>
                          <img 
                            src={post.image} 
                            alt={post.title} 
                            className={styles.relatedCardImage}
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className={styles.relatedCardMeta}>
                        <span className="category-badge" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>{post.category}</span>
                        <span>{formatDate(post.date)}</span>
                      </div>
                      <h4 className={styles.relatedCardTitle}>{post.title}</h4>
                      <p className={styles.relatedCardExcerpt}>{post.excerpt}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Floating Table of Contents */}
        <TOC contentSelector="#video-content" id={id} />
      </div>
    </>
  );
}
