import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import styles from '@/styles/layout.module.css';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Header() {
  const router = useRouter();
  const [theme, setTheme] = useState('dark');
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const mobileNavRef = useRef(null);

  // 테마 동기화 및 외부 클릭 감지
  useEffect(() => {
    const isLight = document.documentElement.classList.contains('light');
    setTheme(isLight ? 'light' : 'dark');

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsServicesOpen(false);
      }
      if (mobileNavRef.current && !mobileNavRef.current.contains(event.target)) {
        // 모바일 메뉴 외부 클릭 시 닫기
        const isHamburger = event.target.closest(`.${styles.hamburgerBtn}`);
        if (!isHamburger) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    const handleRouteChange = () => {
      setIsMobileMenuOpen(false);
      setIsServicesOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    router.events?.on('routeChangeStart', handleRouteChange);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      router.events?.off('routeChangeStart', handleRouteChange);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, [router]);

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
    }, 200);
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
        {/* Logo */}
        <div className={styles.logoArea}>
          <Link href="/" className={styles.logoLink} onClick={() => setIsMobileMenuOpen(false)}>
            <span className={styles.logoText}>여전히, 나는 사람이다.</span>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className={styles.desktopNav}>
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

          {/* 실험 서비스 드롭다운 */}
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
        </nav>

        {/* Right Action Icons & Controls */}
        <div className={styles.headerRightArea}>
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

                    {/* RSS Feed Button (Desktop) */}
          <a 
            href="/rss.xml" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.desktopRssBtn}
            aria-label="RSS Feed 구독"
            title="RSS 피드 구독"
          >
            <svg 
              className={styles.rssIcon}
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <circle cx="6.18" cy="17.82" r="2.18"/>
              <path d="M4 4.44v2.83c7.03 0 12.73 5.7 12.73 12.73h2.83c0-8.59-6.97-15.56-15.56-15.56zm0 5.66v2.83c3.9 0 7.07 3.17 7.07 7.07h2.83c0-5.47-4.43-9.9-9.9-9.9z"/>
            </svg>
            <span className={styles.socialText}>RSS</span>
          </a>

          {/* YouTube Button (Desktop) */}
          <a 
            href="https://www.youtube.com/@Na.R.D." 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.desktopYoutubeBtn}
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

          {/* Mobile Hamburger Button */}
          <button 
            type="button"
            className={`${styles.hamburgerBtn} ${isMobileMenuOpen ? styles.hamburgerBtnActive : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="모바일 메뉴 열기/닫기"
            aria-expanded={isMobileMenuOpen}
          >
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Overlay Menu */}
      {isMobileMenuOpen && (
        <div className={styles.mobileNavOverlay} ref={mobileNavRef}>
          <nav className={styles.mobileNavContainer}>
            <Link 
              href="/" 
              className={`${styles.mobileNavLink} ${router.pathname === '/' ? styles.activeMobileNavLink : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span>🏠</span> 홈
            </Link>

            <Link 
              href="/categories" 
              className={`${styles.mobileNavLink} ${router.pathname === '/categories' || router.pathname.startsWith('/categories') ? styles.activeMobileNavLink : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span>📂</span> 카테고리
            </Link>

            {/* Mobile Lab Services Group */}
            <div className={styles.mobileServiceGroup}>
              <div className={styles.mobileServiceGroupHeader}>
                <span>🧪</span> 실험 서비스
              </div>
              <div className={styles.mobileServiceList}>
                <Link 
                  href="/cart" 
                  className={`${styles.mobileServiceItem} ${isCartActive ? styles.activeMobileNavLink : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className={styles.mobileServiceTitle}>
                    <span>🛒</span> 모두모아 장바구니
                  </div>
                  <div className={styles.mobileServiceDesc}>
                    여러 쇼핑몰 링크를 한곳에 모아 관리하는 위시리스트
                  </div>
                </Link>
              </div>
            </div>

            <Link 
              href="/about" 
              className={`${styles.mobileNavLink} ${router.pathname === '/about' || router.pathname.startsWith('/about') ? styles.activeMobileNavLink : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span>👤</span> 소개 (About)
            </Link>

            {/* Mobile YouTube Link */}
            <a 
              href="https://www.youtube.com/@Na.R.D." 
              target="_blank" 
              rel="noopener noreferrer" 
              className={styles.mobileYoutubeLink}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <svg className={styles.youtubeIcon} viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              YouTube 채널 바로가기
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
