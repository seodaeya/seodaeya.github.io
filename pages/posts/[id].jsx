import fs from 'fs';
import path from 'path';
import Head from 'next/head';
import Link from 'next/link';
import matter from 'gray-matter';
import { marked } from 'marked';
import SEO from '@/components/SEO';
import Comments from '@/components/Comments';
import Sponsor from '@/components/Sponsor';
import Breadcrumbs from '@/components/Breadcrumbs';
import TOC from '@/components/TOC';
import contentUtils from '@/lib/content';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import styles from '@/styles/post.module.css';


const { createPlainExcerpt } = contentUtils;

export async function getStaticPaths() {
  const postsDir = path.join(process.cwd(), '/files/posts');
  const filenames = fs.readdirSync(postsDir).filter(fn => fn.endsWith('.md'));
  
  const paths = [];
  filenames.forEach((filename) => {
    const id = filename.replace('.md', '');
    paths.push({ params: { id } });

    // Legacy short prefix path support (e.g. 20260819-1 -> 20260819-1-ai-alter-framework)
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

  // Check if params.id is a legacy short ID (e.g. 20260819-1)
  if (!fs.existsSync(path.join(postsDir, targetFilename))) {
    const allFiles = fs.readdirSync(postsDir).filter(fn => fn.endsWith('.md'));
    const matched = allFiles.find(fn => fn.startsWith(`${params.id}-`));
    if (matched) {
      isRedirect = true;
      redirectTo = `/posts/${matched.replace('.md', '')}`;
      targetFilename = matched;
    }
  }

  const filePath = path.join(postsDir, targetFilename);
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

  // 자동 읽기 시간 계산
    // Calculate accurate human reading time on clean text (excluding SVG/HTML/code blocks)
  const cleanBodyText = content.replace(/<svg[\s\S]*?<\/svg>/gi, ' ').replace(/```[\s\S]*?```/g, ' ').replace(/<[^>]+>/g, ' ').trim();
  const readingTime = Math.max(1, Math.ceil(cleanBodyText.length / 450));

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

  const currentIndex = allContent.findIndex(item => item.id === params.id && item.type === 'posts');
  
  const prevPost = currentIndex !== -1 && currentIndex < allContent.length - 1 ? allContent[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? allContent[currentIndex - 1] : null;
  
  const relatedPosts = allContent
    .filter(item => item.category === data.category && !(item.id === params.id && item.type === 'posts'))
    .slice(0, 3);

  return {
    props: {
      isRedirect: false,
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
      excerpt: data.excerpt || createPlainExcerpt(content, 150) || '글 내용을 확인해보세요.',
      readingTime,
      prevPost,
      nextPost,
      relatedPosts,
    },
  };
}

export default function Post({ isRedirect, redirectTo, targetTitle, id, frontmatter, content, excerpt, readingTime, prevPost, nextPost, relatedPosts }) {
  const [readingProgress, setReadingProgress] = useState(0);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    // 1. Reading Progress Tracker
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight > 0) {
        setReadingProgress((totalScroll / windowHeight) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // 2. Auto-inject 1-Click Copy Buttons into code blocks
    const preBlocks = document.querySelectorAll('#post-content pre');
    preBlocks.forEach((pre) => {
      if (
        pre.closest('.mermaid') || 
        pre.querySelector('.language-mermaid') || 
        pre.parentElement.classList.contains(styles.codeBlockWrapper)
      ) {
        return;
      }
      const wrapper = document.createElement('div');
      wrapper.className = styles.codeBlockWrapper;
      
      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = styles.copyCodeBtn;
      copyBtn.innerHTML = '<span>📋</span> 복사';
      copyBtn.setAttribute('aria-label', '코드 복사');
      
      copyBtn.onclick = async () => {
        try {
          const codeText = pre.querySelector('code')?.innerText || pre.innerText;
          await navigator.clipboard.writeText(codeText);
          copyBtn.innerHTML = '<span>✅</span> 복사됨';
          copyBtn.classList.add(styles.copyCodeBtnCopied);
          setTimeout(() => {
            copyBtn.innerHTML = '<span>📋</span> 복사';
            copyBtn.classList.remove(styles.copyCodeBtnCopied);
          }, 2000);
        } catch (err) {
          copyBtn.innerHTML = '<span>❌</span> 실패';
        }
      };
      
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);
      wrapper.appendChild(copyBtn);
    });
    // Auto-render Mermaid diagrams if present
    const mermaidBlocks = document.querySelectorAll('pre code.language-mermaid, pre code.lang-mermaid');
    if (mermaidBlocks.length > 0) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
      script.async = true;
      script.onload = () => {
        window.mermaid?.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: {
            background: '#ffffff',
            primaryColor: '#fef3c7',
            primaryTextColor: '#1e293b',
            primaryBorderColor: '#f59e0b',
            lineColor: '#64748b',
            secondaryColor: '#fce7e7',
            tertiaryColor: '#d1fae5',
            edgeLabelBackground: '#ffffff',
            clusterBkg: '#f8fafc',
            clusterBorder: '#cbd5e1',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '13px'
          },
          flowchart: {
            curve: 'basis',
            padding: 16,
            nodeSpacing: 40,
            rankSpacing: 40,
            htmlLabels: true
          }
        });
        mermaidBlocks.forEach((block) => {
          const pre = block.parentElement;
          const codeText = block.textContent;
          const div = document.createElement('div');
          div.className = 'mermaid';
          div.style.textAlign = 'center';
          div.style.margin = '20px 0';
          div.innerHTML = codeText;
          pre.parentNode.replaceChild(div, pre);
        });
        window.mermaid?.run();
      };
      document.head.appendChild(script);
    }
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [id, content]);
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

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

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
        url={`https://seodaeya.github.io/posts/${id}/`}
        type="article"
        date={frontmatter.date}
      />

      {/* Reading Progress Bar (Fixed Top) */}
      <div 
        className={styles.readingProgressBar} 
        style={{ width: `${readingProgress}%` }} 
        role="progressbar"
        aria-valuenow={Math.round(readingProgress)}
        aria-valuemin="0"
        aria-valuemax="100"
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

          {/* AI Key Summary Box (Global LLM & Search Crawler Optimization) */}
          <section className={styles.aiSummaryBox} aria-label="AI Key Summary & Global Takeaways">
            <div className={styles.aiSummaryTitle}>
              <span className={styles.aiIcon}>🤖</span> 
              <strong>AI Key Summary & Global Takeaways</strong>
            </div>
            <p className={styles.aiSummaryText}>
              이 포스트의 핵심 내용 요약 및 글로벌 검색/AI 엔진(Perplexity, ChatGPT, Claude) 색인을 위한 핵심 테이크어웨이입니다.
            </p>
            <ul className={styles.aiSummaryList}>
              <li><strong>🇰🇷 주제:</strong> {frontmatter.title} ({frontmatter.category || '일반'})</li>
              <li><strong>🇰🇷 핵심 요약:</strong> {excerpt}</li>
              <li><strong>🌐 Global Takeaway:</strong> In-depth first-principles analysis, technical architecture, and actionable guide authored by NaRD on <em>{frontmatter.title}</em> for global creators and developers.</li>
            </ul>
          </section>

          {/* Post Content */}
          <div
            id="post-content"
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: content }}
          />

          {/* Social Share & Link Copy Bar */}
          <section className={styles.shareSection} aria-label="글 공유하기">
            <div className={styles.shareLabel}>
              <span>📢</span> <strong>이 글 공유하기</strong>
            </div>
            <div className={styles.shareButtons}>
              <button 
                type="button" 
                className={styles.shareBtn} 
                onClick={handleCopyUrl}
                aria-label="URL 링크 복사"
              >
                <span>{copiedUrl ? '✅' : '🔗'}</span> {copiedUrl ? '링크가 복사되었습니다!' : '링크 복사'}
              </button>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(frontmatter.title || '')}&url=${encodeURIComponent(`https://seodaeya.github.io/posts/${id}/`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.shareBtn}
                aria-label="X(트위터)로 공유"
              >
                <span>🐦</span> X(트위터)
              </a>
              <a
                href={`https://service.threads.net/share?text=${encodeURIComponent(`${frontmatter.title || ''} https://seodaeya.github.io/posts/${id}/`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.shareBtn}
                aria-label="Threads로 공유"
              >
                <span>🧵</span> Threads
              </a>
            </div>
          </section>



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

          {/* Sponsor KakaoPay Support Box */}
          <Sponsor />

          {/* Giscus Comments widget */}
          <Comments key={id} />
        </article>

        {/* Floating Table of Contents */}
        <TOC contentSelector="#post-content" id={id} />
      </div>
    </>
  );
}
