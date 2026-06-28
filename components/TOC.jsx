import { useEffect, useState } from 'react';
import styles from '@/styles/toc.module.css';

export default function TOC({ contentSelector }) {
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const container = document.querySelector(contentSelector);
    if (!container) return;

    // Find all h2 and h3 elements
    const headingElements = container.querySelectorAll('h2, h3');
    const headingList = [];

    headingElements.forEach((el, index) => {
      // If it doesn't have an ID, assign a unique one
      if (!el.id) {
        el.id = `heading-${index}`;
      }
      headingList.push({
        id: el.id,
        text: el.innerText || el.textContent,
        level: el.tagName.toLowerCase(), // 'h2' or 'h3'
      });
    });

    setHeadings(headingList);

    // Track active heading on scroll using IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        // Find visible entries
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          // Active heading is the first visible heading
          setActiveId(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px',
      }
    );

    headingElements.forEach((el) => observer.observe(el));

    return () => {
      headingElements.forEach((el) => observer.unobserve(el));
    };
  }, [contentSelector]);

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
                onClick={(e) => {
                  e.preventDefault();
                  const targetElement = document.getElementById(h.id);
                  if (targetElement) {
                    // Offset scroll slightly to account for fixed header
                    const yOffset = -90;
                    const y = targetElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                  }
                  window.history.pushState(null, '', `#${h.id}`);
                  setActiveId(h.id);
                }}
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
