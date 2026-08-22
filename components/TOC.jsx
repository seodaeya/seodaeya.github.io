import { useEffect, useState, useCallback, useRef } from 'react';
import styles from '@/styles/toc.module.css';

export default function TOC({ contentSelector, id }) {
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState('');
  const isClickScrolling = useRef(false);
  const clickTimeoutRef = useRef(null);

  useEffect(() => {
    // Reset state when navigating to a different page
    setHeadings([]);
    setActiveId('');

    // Small delay to ensure DOM is fully rendered after hydration
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

      // High-precision scroll position tracker with Top & Bottom boundary awareness
      const updateActiveHeading = () => {
        if (isClickScrolling.current) return;

        // 1. Edge Case: Bottom of the page reached (content too short to reach the 130px line)
        const scrollBottom = window.innerHeight + window.scrollY;
        const documentHeight = document.documentElement.scrollHeight;
        if (scrollBottom >= documentHeight - 70) {
          setActiveId(headingElements[headingElements.length - 1].id);
          return;
        }

        // 2. Edge Case: Top of the page
        if (window.scrollY < 80) {
          setActiveId(headingElements[0].id);
          return;
        }

        // 3. Normal Reading Flow: Last heading passing the header offset
        const headerOffset = 130; // 70px fixed header + 60px viewport reading line
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

      // Initial active check
      updateActiveHeading();

      // Optimized scroll listener with requestAnimationFrame
      let ticking = false;
      const onScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            updateActiveHeading();
            ticking = false;
          });
          ticking = true;
        }
      };

      window.addEventListener('scroll', onScroll, { passive: true });

      return () => {
        window.removeEventListener('scroll', onScroll);
        if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      };
    }, 100);

    return () => clearTimeout(timer);
  }, [contentSelector, id]);

  const handleClick = useCallback((e, headingId) => {
    e.preventDefault();
    e.stopPropagation();

    // Lock scroll listener during smooth scrolling to prevent premature active jumping
    isClickScrolling.current = true;
    setActiveId(headingId);

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
  );
}
