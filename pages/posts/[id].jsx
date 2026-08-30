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
        // Wrap table in an isolated viewport container that preserves horizontal scroll position across vertical scrolling
        const origTable = renderer.table.bind(renderer);
        renderer.table = function(header, body) {
          const tableHtml = origTable(header, body);
          return '<div class="table-responsive-wrapper">' + tableHtml + '</div>';
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
  const [copiedInsta, setCopiedInsta] = useState(false);

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

    // 1.5. Wrap any remaining tables into isolated scroll containers
    const rawTables = document.querySelectorAll('#post-content table');
    rawTables.forEach((table) => {
      if (!table.parentElement.classList.contains('table-responsive-wrapper') && !table.parentElement.classList.contains(styles.tableResponsiveWrapper)) {
        const wrapper = document.createElement('div');
        wrapper.className = styles.tableResponsiveWrapper || 'table-responsive-wrapper';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      }
    });

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

  const handleKakaoShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = frontmatter.title || '아티클';
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: excerpt,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User cancelled or fallback
      }
    }
    // Web fallback for Kakao
    window.open(`https://sharer.kakao.com/talk/friends/picker/link?url=${encodeURIComponent(shareUrl)}`, '_blank', 'width=450,height=600');
  };

  const handleInstagramShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = frontmatter.title || '아티클';
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User cancelled or fallback
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedInsta(true);
      setTimeout(() => setCopiedInsta(false), 3000);
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
              이 아티클의 핵심 내용 요약 및 글로벌 검색/AI 엔진(Perplexity, ChatGPT, Claude) 색인을 위한 핵심 테이크어웨이입니다.
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

          {/* Social Share Bar: 100% Official Brand Vector SVGs */}
          <section className={styles.shareSection} aria-label="이 아티클 공유하기">
            <div className={styles.shareLabel}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-light)' }}>
                <circle cx="18" cy="5" r="3"/>
                <circle cx="6" cy="12" r="3"/>
                <circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              <strong>이 아티클 공유하기</strong>
            </div>
            <div className={styles.shareButtons}>
              {/* 1. 카카오톡 (공식 심볼) */}
              <button 
                type="button" 
                className={`${styles.shareBtn} ${styles.shareBtnKakao}`} 
                onClick={handleKakaoShare}
                aria-label="카카오톡으로 공유하기"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.557 1.708 4.8 4.27 6.054l-1.085 3.984c-.1.365.31.67.625.46L11.5 17.5c.165.01.332.015.5.015 4.97 0 9-3.185 9-7.115S16.97 3 12 3z"/>
                </svg>
                <span>카카오톡</span>
              </button>

              {/* 2. 링크 복사 */}
              <button 
                type="button" 
                className={`${styles.shareBtn} ${styles.shareBtnCopy}`} 
                onClick={handleCopyUrl}
                aria-label="URL 링크 복사"
              >
                {copiedUrl ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                )}
                <span>{copiedUrl ? '링크 복사 완료!' : '링크 복사'}</span>
              </button>

              {/* 3. 인스타그램 (메타 공식 글리프) */}
              <button 
                type="button" 
                className={`${styles.shareBtn} ${styles.shareBtnInstagram}`} 
                onClick={handleInstagramShare}
                aria-label="인스타그램으로 공유하기"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span>{copiedInsta ? '스토리 링크 복사됨!' : '인스타그램'}</span>
              </button>

              {/* 4. X / 트위터 (X 공식 벡터 심볼) */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(frontmatter.title || '')}&url=${encodeURIComponent(`https://seodaeya.github.io/posts/${id}/`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.shareBtn} ${styles.shareBtnX}`}
                aria-label="X(구 트위터)로 공유하기"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span>X(트위터)</span>
              </a>

              {/* 5. Threads (메타 공식 @ 심볼) */}
              <a
                href={`https://service.threads.net/share?text=${encodeURIComponent(`${frontmatter.title || ''} https://seodaeya.github.io/posts/${id}/`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.shareBtn} ${styles.shareBtnThreads}`}
                aria-label="Threads(스레드)로 공유하기"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z"/>
                </svg>
                <span>Threads</span>
              </a>
            </div>
          </section>



          {/* Prev/Next Navigation Section */}
          <div className={styles.prevNextSection}>
            {prevPost ? (
              <Link href={`/${prevPost.type}/${prevPost.id}`} className={styles.navCard}>
                <span className={styles.navLabel}>← 이전 아티클</span>
                <span className={styles.navTitle}>{prevPost.title}</span>
              </Link>
            ) : (
              <div />
            )}
            {nextPost ? (
              <Link href={`/${nextPost.type}/${nextPost.id}`} className={`${styles.navCard} ${styles.navCardNext}`}>
                <span className={styles.navLabel}>다음 아티클 →</span>
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
