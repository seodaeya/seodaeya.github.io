import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '@/styles/layout.module.css';

export default function Header() {
  const router = useRouter();

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
        </nav>

        <div className={styles.socialArea}>
          {/* YouTube Link */}
          <a 
            href="https://www.youtube.com/@Na.R.D." 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.socialIconLink}
            aria-label="YouTube 채널"
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
