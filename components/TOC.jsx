import { useEffect, useState, useCallback, useRef } from 'react';
import styles from '@/styles/toc.module.css';

export default function TOC({ contentSelector, id }) {
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isFooterReached, setIsFooterReached] = useState(false);
  const isClickScrolling = useRef(false);
  const clickTimeoutRef = useRef(null);
  const scrollTimerRef = useRef(null);

  useEffect(() => {
    setHeadings([]);
    setActiveId('');
    setIsFooterReached(false);

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

      const updateScrollTracking = () => {
        if (isClickScrolling.current) return;

        const postContent = document.querySelector(contentSelector);
        if (postContent) {
          const rect = postContent.getBoundingClientRect();
          // Hide only when user has completely scrolled past the article into the comment/footer area
          if (rect.bottom < 100) {
            setIsFooterReached(true);
          } else {
            setIsFooterReached(false);
          }
        }

        // Active heading tracking
        const headerOffset = 140;
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

      updateScrollTracking();

      const onScroll = () => {
        setIsScrolling(true);
        updateScrollTracking();

        if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = setTimeout(() => {
          setIsScrolling(false);
        }, 400);
      };

      window.addEventListener('scroll', onScroll, { passive: true });

      return () => {
        window.removeEventListener('scroll', onScroll);
        if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
        if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
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

      {/* Mobile Sleek Floating TOC Pill (우측 하단 플로팅 배너: 따라다니며 스크롤 시 반투명, 댓글 도달 시 자동 숨김) */}
      <button 
        type="button" 
        className={`${styles.mobileFloatingPill} ${isScrolling ? styles.mobileFloatingPillScrolling : ''} ${isFooterReached ? styles.mobileFloatingPillHidden : ''}`}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="모바일 아티클 목차 열기"
        aria-expanded={isMobileOpen}
      >
        <span className={styles.pillIcon}>📑</span>
        <span className={styles.pillText}>목차</span>
        <span className={styles.pillProgressBadge}>
          {headings.findIndex(h => h.id === activeId) + 1}/{headings.length}
        </span>
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
