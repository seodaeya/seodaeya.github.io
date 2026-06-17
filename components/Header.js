import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import styles from '@/styles/layout.module.css';

export default function Header() {
  const router = useRouter();
  const [theme, setTheme] = useState('dark');

  // 첫 마운트 시 실제 HTML에 적용된 테마 클래스를 읽어와 동기화
  useEffect(() => {
    const isLight = document.documentElement.classList.contains('light');
    setTheme(isLight ? 'light' : 'dark');
  }, []);

  const toggleTheme = () => {
    const isLight = document.documentElement.classList.toggle('light');
    const nextTheme = isLight ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);

    // Giscus 댓글 위젯 테마 동기화 (Giscus 프레임이 떠있는 경우 테마 강제 변경 메시지 전달)
    const iframe = document.querySelector('iframe.giscus-frame');
    if (iframe) {
      iframe.contentWindow.postMessage(
        { giscus: { setConfig: { theme: nextTheme } } },
        'https://giscus.app'
      );
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        <div className={styles.logoArea}>
          <Link href="/" className={styles.logoLink}>
            <span className={styles.logoText}>나는 사람이다.</span>
          </Link>
        </div>

        <nav className={styles.navLinks}>
          <Link 
            href="/" 
            className={`${styles.navLink} ${router.pathname === '/' ? styles.activeNavLink : ''}`}
          >
            홈
          </Link>
          <Link 
            href="/categories" 
            className={`${styles.navLink} ${router.pathname === '/categories' || router.pathname.startsWith('/categories') ? styles.activeNavLink : ''}`}
          >
            카테고리
          </Link>
          
          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme} 
            className={styles.themeToggleBtn}
            aria-label="Toggle Theme"
            title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
          >
            {theme === 'dark' ? (
              // Moon Icon
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className={styles.themeToggleIcon}
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            ) : (
              // Sun Icon
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className={styles.themeToggleIcon}
              >
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            )}
          </button>
        </nav>

        <div className={styles.socialArea}>
          <a 
            href="https://www.youtube.com/@Na.R.D." 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.socialIconLink}
            aria-label="YouTube Channel"
          >
            <svg 
              className={styles.youtubeIcon}
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <span className={styles.socialText}>YouTube</span>
          </a>
        </div>
      </div>
    </header>
  );
}
