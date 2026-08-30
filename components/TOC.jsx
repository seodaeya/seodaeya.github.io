import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from '@/styles/toc.module.css';

export default function TOC({ contentSelector, id }) {
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isPillVisible, setIsPillVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  const isClickScrolling = useRef(false);
  const clickTimeoutRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    setHeadings([]);
    setActiveId('');
    setIsPillVisible(true);

    const container = document.querySelector(contentSelector);
    if (!container) return undefined;

    const headingElements = Array.from(container.querySelectorAll('h2, h3'));
    if (headingElements.length === 0) return undefined;

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
    setActiveId(headingList[0].id);

    const activationOffset = 120;
    let animationFrameId = null;
    const updateActiveHeading = () => {
      animationFrameId = null;
      let active = headingList[0].id;

      for (const heading of headingList) {
        const el = document.getElementById(heading.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= activationOffset) {
          active = heading.id;
        } else {
          break;
        }
      }

      setActiveId((current) => (current === active ? current : active));
    };

    const scheduleActiveHeadingUpdate = () => {
      if (animationFrameId === null) {
        animationFrameId = window.requestAnimationFrame(updateActiveHeading);
      }
    };

    updateActiveHeading();

    // 스크롤 중에는 숨겼다가, 스크롤이 멈춘 후 2초 뒤에 다시 노출
    let scrollHideTimer = null;
    const handleScroll = () => {
      scheduleActiveHeadingUpdate();

      setIsPillVisible(false);
      if (scrollHideTimer) clearTimeout(scrollHideTimer);
      scrollHideTimer = setTimeout(() => {
        setIsPillVisible(true);
      }, 2000);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', scheduleActiveHeadingUpdate, { passive: true });
    window.addEventListener('load', scheduleActiveHeadingUpdate);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', scheduleActiveHeadingUpdate);
      window.removeEventListener('load', scheduleActiveHeadingUpdate);
      if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId);
      if (scrollHideTimer !== null) clearTimeout(scrollHideTimer);
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };
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

  const mobilePortalUI = mounted && createPortal(
    <>
      {/* Mobile Floating TOC Banner Button (스크롤 중 자동 숨김 -> 멈춘 후 2초 뒤 등장) */}
      <button 
        type="button" 
        className={`${styles.mobileFloatingPill} ${!isPillVisible && !isMobileOpen ? styles.mobileFloatingPillHidden : ''}`}
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
