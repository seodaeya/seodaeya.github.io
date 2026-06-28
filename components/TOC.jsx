import { useEffect, useState, useCallback } from 'react';
import styles from '@/styles/toc.module.css';

export default function TOC({ contentSelector, id }) {
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    // Small delay to ensure DOM is fully rendered after hydration
    const timer = setTimeout(() => {
      const container = document.querySelector(contentSelector);
      if (!container) {
        console.warn('[TOC] Container not found:', contentSelector);
        return;
      }

      const headingElements = container.querySelectorAll('h2, h3');
      console.log('[TOC] Found headings:', headingElements.length);

      const headingList = [];
      headingElements.forEach((el, index) => {
        if (!el.id) {
          el.id = `heading-${index}`;
        }
        console.log('[TOC] Heading:', el.id, el.textContent?.substring(0, 30));
        headingList.push({
          id: el.id,
          text: el.innerText || el.textContent,
          level: el.tagName.toLowerCase(),
        });
      });

      setHeadings(headingList);

      // IntersectionObserver for active heading tracking
      const observer = new IntersectionObserver(
        (entries) => {
          const visibleEntries = entries.filter((entry) => entry.isIntersecting);
          if (visibleEntries.length > 0) {
            setActiveId(visibleEntries[0].target.id);
          }
        },
        { rootMargin: '-80px 0px -60% 0px' }
      );

      headingElements.forEach((el) => observer.observe(el));

      return () => {
        headingElements.forEach((el) => observer.unobserve(el));
      };
    }, 100);

    return () => clearTimeout(timer);
  }, [contentSelector, id]);

  const handleClick = useCallback((e, headingId) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('[TOC] Click:', headingId);

    const targetElement = document.getElementById(headingId);
    console.log('[TOC] Target element:', targetElement);

    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      targetElement.setAttribute('tabindex', '-1');
      targetElement.focus({ preventScroll: true });
      console.log('[TOC] scrollIntoView called');
    } else {
      console.error('[TOC] Element not found for id:', headingId);
    }

    window.history.replaceState(null, '', `#${headingId}`);
    setActiveId(headingId);
  }, []);

  if (headings.length === 0) return null;

  return (
    <aside className={styles.tocWrapper} aria-label="Table of Contents">
      <div className={styles.tocTitle}>목차</div>
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
