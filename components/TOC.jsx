import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from '@/styles/toc.module.css';

export default function TOC({ contentSelector, id }) {
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isClickScrolling = useRef(false);
  const clickTimeoutRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    setHeadings([]);
    setActiveId('');

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
      if (headingList.length > 0) {
        setActiveId(headingList[0].id);
      }

      const updateActiveHeading = () => {
        if (isClickScrolling.current) return;

        const headerOffset = 150;
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

      updateActiveHeading();

      const onScroll = () => {
        updateActiveHeading();
      };

      window.addEventListener('scroll', onScroll, { passive: true });

      return () => {
        window.removeEventListener('scroll', onScroll);
        if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      };
    }, 150);

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

  const currentIdx = headings.findIndex(h => h.id === activeId);
  const displayIdx = currentIdx >= 0 ? currentIdx + 1 : 1;
  const progressText = `${displayIdx}/${headings.length}`;

  // Portal directly to document.body so CSS containment or parent overflow can NEVER trap the fixed button/drawer
  const mobilePortalUI = mounted && createPortal(
    <>
      {/* Mobile Floating TOC Banner Button (항상 브라우저 화면 뷰포트에 100% 고정되어 글을 읽는 내내 따라다님) */}
      <button 
        type="button" 
        className={styles.mobileFloatingPill}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="모바일 아티클 목차 열기"
        aria-expanded={isMobileOpen}
      >
        <span className={styles.pillIcon}>📑</span>
        <span className={styles.pillText}>목차</span>
        <span className={styles.pillProgressBadge}>{progressText}</span>
      </button>

      {/* Mobile Floating TOC Drawer Modal */}
      {isMobileOpen && (
        <div className={styles.mobileTocOverlay} onClick={() => setIsMobileOpen(false)}>
          <div className={styles.mobileTocDrawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHandleBar} />
            <div className={styles.mobileTocHeader}>
              <div className={styles.mobileTocHeaderTitle}>
                <span>📌</span> <strong>아티클 목차 ({headings.length}개 챕터)</strong>
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
                {headings.map((h, index) => (
                  <li 
                    key={h.id} 
                    className={`${styles.tocItem} ${h.level === 'h3' ? styles.tocSubItem : ''} ${activeId === h.id ? styles.active : ''}`}
                  >
                    <a 
                      href={`#${h.id}`} 
                      onClick={(e) => handleClick(e, h.id)}
                    >
                      <span className={styles.headingNum}>{index + 1}.</span> {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>,
    document.body
  );

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

      {/* Render Mobile Floating Pill and Drawer into document.body */}
      {mobilePortalUI}
    </>
  );
}
