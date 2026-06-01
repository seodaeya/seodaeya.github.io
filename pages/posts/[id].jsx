import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import matter from 'gray-matter';
import { marked } from 'marked';
import SEO from '@/components/SEO';
import styles from '@/styles/post.module.css';

export async function getStaticPaths() {
  const postsDir = path.join(process.cwd(), '/files/posts');
  const filenames = fs.readdirSync(postsDir);
  const paths = filenames.map((filename) => ({
    params: { id: filename.replace('.md', '') },
  }));

  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const filePath = path.join(process.cwd(), '/files/posts', `${params.id}.md`);
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
      excerpt: cleanExcerpt ? `${cleanExcerpt}...` : '글 내용을 확인해보세요.',
    },
  };
}

export default function Post({ id, frontmatter, content, excerpt }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
    } catch (e) {
      return dateStr;
    }
  };

  // Extract first few points for AI 요약 box (automatically generated or custom text)
  // Let's create a visual highlight container
  return (
    <>
      <SEO
        title={frontmatter.title}
        description={excerpt}
        url={`https://seodaeya.github.io/posts/${id}`}
        type="article"
        date={frontmatter.date}
      />

      <article className={styles.postContainer}>
        {/* Back Link */}
        <div className={styles.backLinkArea}>
          <Link href="/" className={styles.backLink}>
            ← 홈으로 돌아가기
          </Link>
        </div>

        {/* Post Header */}
        <header className={styles.postHeader}>
          {frontmatter.category && (
            <span className="category-badge" style={{ marginBottom: '16px' }}>
              {frontmatter.category}
            </span>
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
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </article>
    </>
  );
}
