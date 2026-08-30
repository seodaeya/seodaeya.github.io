import { useEffect, useState, useCallback, useRef } from 'react';
import styles from '@/styles/toc.module.css';

export default function TOC({ contentSelector, id }) {
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isFloatingVisible, setIsFloatingVisible] = useState(false);
  const isClickScrolling = useRef(false);
  const clickTimeoutRef = useRef(null);
  const scrollPauseTimerRef = useRef(null);

  useEffect(() => {
    setHeadings([]);
    setActiveId('');
    setIsFloatingVisible(false);

    const timer = setTimeout(() => {
      const container = document.querySelector(contentSelector);
      if (!container) return;

      const headingElements = Array.from(container.querySelectorAll('h2, h3'));
      if (headingElements.length === 0) return;

      const headingList = headingElements.map((el, index) => {
        if (!el.id) {
          el.id = `heading-${index}`;
        }
        return {
          id: el.id,
          text: el.innerText || el.textContent,
          level: el.tagName.toLowerCase(),
        };
      });

      setHeadings(headingList);

      const updateTocState = () => {
        if (isClickScrolling.current) return;

        const scrollY = window.scrollY;
        const postContent = document.querySelector(contentSelector);
        
        // Check if user is inside the article content area (hide at top and hide when reaching comments/footer)
        if (postContent) {
          const rect = postContent.getBoundingClientRect();
          const isInsideArticle = scrollY > 250 && rect.bottom > 180;
          
          if (!isInsideArticle) {
            setIsFloatingVisible(false);
          } else {
            // User is actively reading article: show floating indicator when scroll pauses
            setIsFloatingVisible(true);
          }
        }

        // Active heading tracking
        const headerOffset = 130;
        let currentActive = headingElements[0].id;

        for (let i = 0; i < headingElements.length; i++) {
          const el = headingElements[i];
          const rect = el.getBoundingClientRect();
          if (rect.top <= headerOffset) {
            currentActive = el.id;
          } else {
            break;
          }
        }

        setActiveId(currentActive);
      };

      updateTocState();

      // Scroll listener with pause-reveal intelligence
      const onScroll = () => {
        // While actively scrolling, keep tab subtle / fade slightly
        if (scrollPauseTimerRef.current) clearTimeout(scrollPauseTimerRef.current);
        
        updateTocState();

        // Reveal fully when user pauses for 350ms
        scrollPauseTimerRef.current = setTimeout(() => {
          updateTocState();
        }, 350);
      };

      window.addEventListener('scroll', onScroll, { passive: true });

      return () => {
        window.removeEventListener('scroll', onScroll);
        if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
        if (scrollPauseTimerRef.current) clearTimeout(scrollPauseTimerRef.current);
      };
    }, 100);

    return () => clearTimeout(timer);
  }, [contentSelector, id]);

  const handleClick = useCallback((e, headingId) => {
    e.preventDefault();
    e.stopPropagation();

    isClickScrolling.current = true;
    setActiveId(headingId);
    setIsMobileOpen(false);

    const targetElement = document.getElementById(headingId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      targetElement.setAttribute('tabindex', '-1');
      targetElement.focus({ preventScroll: true });
    }

    window.history.replaceState(null, '', `#${headingId}`);

    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => {
      isClickScrolling.current = false;
    }, 800);
  }, []);

  if (headings.length === 0) return null;

  return (
    <>
      {/* Desktop Sticky Sidebar TOC */}
      <aside className={styles.tocWrapper} aria-label="Table of Contents">
        <div className={styles.tocTitle}>
          <span>📌</span> 목차
        </div>
        <nav className={styles.tocNav}>
          <ul className={styles.tocList}>
            {headings.map((h) => (
              <li 
                key={h.id} 
                className={`${styles.tocItem} ${h.level === 'h3' ? styles.tocSubItem : ''} ${activeId === h.id ? styles.active : ''}`}
              >
                <a 
                  href={`#${h.id}`} 
                  onClick={(e) => handleClick(e, h.id)}
                >
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Mobile Smart Floating Side Tab (우측 가장자리 슬림 탭: 본문 및 댓글 간섭 0%) */}
      <button 
        type="button" 
        className={`${styles.mobileSideTab} ${isFloatingVisible ? styles.mobileSideTabVisible : ''}`}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="모바일 스마트 목차 열기/닫기"
        aria-expanded={isMobileOpen}
      >
        <span className={styles.mobileSideIcon}>📑</span>
        <span className={styles.mobileSideText}>목차</span>
      </button>

      {/* Mobile Floating TOC Drawer Modal */}
      {isMobileOpen && (
        <div className={styles.mobileTocOverlay} onClick={() => setIsMobileOpen(false)}>
          <div className={styles.mobileTocDrawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.mobileTocHeader}>
              <div className={styles.tocTitle} style={{ margin: 0 }}>
                <span>📌</span> <strong>아티클 목차</strong>
              </div>
              <button 
                type="button" 
                className={styles.mobileTocCloseBtn}
                onClick={() => setIsMobileOpen(false)}
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            <nav className={styles.mobileTocNav}>
              <ul className={styles.tocList}>
                {headings.map((h) => (
                  <li 
                    key={h.id} 
                    className={`${styles.tocItem} ${h.level === 'h3' ? styles.tocSubItem : ''} ${activeId === h.id ? styles.active : ''}`}
                  >
                    <a 
                      href={`#${h.id}`} 
                      onClick={(e) => handleClick(e, h.id)}
                    >
                      {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
