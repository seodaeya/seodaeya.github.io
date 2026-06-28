import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import matter from 'gray-matter';
import { marked } from 'marked';
import SEO from '@/components/SEO';
import Comments from '@/components/Comments';
import Breadcrumbs from '@/components/Breadcrumbs';
import TOC from '@/components/TOC';
import contentUtils from '@/lib/content';
import styles from '@/styles/post.module.css';

const { createPlainExcerpt } = contentUtils;

export async function getStaticPaths() {
  const postsDir = path.join(process.cwd(), '/files/posts');
  const filenames = fs.readdirSync(postsDir);
  const paths = filenames.map((filename) => ({
    params: { id: filename.replace('.md', '') },
  }));

  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const postsDir = path.join(process.cwd(), '/files/posts');
  const videosDir = path.join(process.cwd(), '/files/videos');
  const filePath = path.join(postsDir, `${params.id}.md`);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  // 자동 읽기 시간 계산
  const readingTime = Math.max(1, Math.ceil(content.length / 500));

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

  const currentIndex = allContent.findIndex(item => item.id === params.id && item.type === 'posts');
  
  const prevPost = currentIndex !== -1 && currentIndex < allContent.length - 1 ? allContent[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? allContent[currentIndex - 1] : null;
  
  const relatedPosts = allContent
    .filter(item => item.category === data.category && !(item.id === params.id && item.type === 'posts'))
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
      excerpt: createPlainExcerpt(content, 150) || '글 내용을 확인해보세요.',
      readingTime,
      prevPost,
      nextPost,
      relatedPosts,
    },
  };
}

export default function Post({ id, frontmatter, content, excerpt, readingTime, prevPost, nextPost, relatedPosts }) {

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
        url={`https://seodaeya.github.io/posts/${id}`}
        type="article"
        date={frontmatter.date}
      />

      <div className={styles.postWrapper}>
        <article className={styles.articleBody}>
          {/* Breadcrumbs Navigation */}
          <Breadcrumbs category={frontmatter.category} title={frontmatter.title} />

          {/* Back Link */}
          <div className={styles.backLinkArea}>
            <Link href="/" className={styles.backLink}>
              ← 홈으로 돌아가기
            </Link>
          </div>

          {/* Post Header */}
          <header className={styles.postHeader}>
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
              <span className={styles.metaSeparator}>|</span>
              <span className={styles.metaItem}>⏱️ 읽는 시간: 약 {readingTime}분</span>
            </div>
          </header>

          {/* AI Key Summary Box (LLM Crawler Optimization) */}
          <section className={styles.aiSummaryBox} aria-label="AI 핵심 요약">
            <div className={styles.aiSummaryTitle}>
              <span className={styles.aiIcon}>🤖</span> 
              <strong>AI Key Summary</strong>
            </div>
            <p className={styles.aiSummaryText}>
              이 포스트의 핵심 내용 요약입니다. 독자 및 AI 크롤러의 빠른 이해를 돕기 위해 구성되었습니다.
            </p>
            <ul className={styles.aiSummaryList}>
              <li><strong>주제:</strong> {frontmatter.title} ({frontmatter.category || '일반'})</li>
              <li><strong>주요 내용:</strong> {excerpt}</li>
              <li><strong>작성 목적:</strong> AI 시대에 남기는 기록이자 유익한 기술/일상 가이드라인 제공</li>
            </ul>
          </section>

          {/* Post Content */}
          <div
            id="post-content"
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: content }}
          />

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

          {/* Giscus Comments widget */}
          <Comments />
        </article>

        {/* Floating Table of Contents */}
        <TOC contentSelector="#post-content" id={id} />
      </div>
    </>
  );
}
