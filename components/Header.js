import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import styles from '@/styles/layout.module.css';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Header() {
  const router = useRouter();
  const [theme, setTheme] = useState('dark');
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const dropdownRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  // 첫 마운트 시 실제 HTML에 적용된 테마 클래스를 읽어와 동기화
  useEffect(() => {
    const isLight = document.documentElement.classList.contains('light');
    setTheme(isLight ? 'light' : 'dark');

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsServicesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsServicesOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsServicesOpen(false);
    }, 200); // 200ms buffer prevents flickering when moving mouse down
  };

  const toggleTheme = () => {
    const isLight = document.documentElement.classList.toggle('light');
    const nextTheme = isLight ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);

    const iframe = document.querySelector('iframe.giscus-frame');
    if (iframe) {
      iframe.contentWindow.postMessage(
        { giscus: { setConfig: { theme: nextTheme } } },
        'https://giscus.app'
      );
    }
  };

  const isCartActive = router.pathname.startsWith('/cart');

  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        <div className={styles.logoArea}>
          <Link href="/" className={styles.logoLink}>
            <span className={styles.logoText}>여전히, 나는 사람이다.</span>
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

          {/* 실험 서비스 드롭다운 메뉴 (호버 브릿지 & 딜레이 닫기 적용) */}
          <div 
            className={styles.navDropdownWrapper}
            ref={dropdownRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button 
              type="button"
              className={`${styles.navDropdownTrigger} ${isCartActive ? styles.navDropdownTriggerActive : ''}`}
              onClick={() => setIsServicesOpen(!isServicesOpen)}
              aria-expanded={isServicesOpen}
            >
              실험 서비스 🧪
              <svg className={styles.dropdownArrow} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {isServicesOpen && (
              <div 
                className={styles.navDropdownMenu}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <Link 
                  href="/cart" 
                  className={styles.dropdownItem}
                  onClick={() => setIsServicesOpen(false)}
                >
                  <div className={styles.dropdownItemTitle}>
                    <span>🛒</span> 모두모아 장바구니
                  </div>
                  <div className={styles.dropdownItemDesc}>
                    여러 쇼핑몰 링크를 한곳에 모아 관리하는 위시리스트
                  </div>
                </Link>

                <div 
                  className={styles.dropdownItem}
                  style={{ opacity: 0.5, cursor: 'default' }}
                >
                  <div className={styles.dropdownItemTitle}>
                    <span>✨</span> 새 실험실 도구 준비 중...
                  </div>
                  <div className={styles.dropdownItemDesc}>
                    더 유용한 서비스가 곧 추가됩니다
                  </div>
                </div>
              </div>
            )}
          </div>

          <Link 
            href="/about" 
            className={`${styles.navLink} ${router.pathname === '/about' || router.pathname.startsWith('/about') ? styles.activeNavLink : ''}`}
          >
            소개
          </Link>
          
          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme} 
            className={styles.themeToggleBtn}
            aria-label="Toggle Theme"
            title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
          >
            {theme === 'dark' ? (
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

          {/* Global Language Switcher */}
          <LanguageSwitcher />
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
