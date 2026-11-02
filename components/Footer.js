import Link from 'next/link';
import styles from '@/styles/layout.module.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={styles.footerInfo}>
          <p className={styles.footerLogo}>여전히, 나는 사람이다.</p>
          <p className={styles.footerDescription}>
            AI가 세상을 분석하고 답할 때, 한 사람의 시선으로 바라보고 경험한 이야기들을 남깁니다.
            기술, 일상, 그리고 지극히 주관적인 생각들의 기록.
          </p>
        </div>

        <div className={styles.footerLinks}>
          <p className={styles.footerLinksHeading}>사이트 안내</p>
          <ul>
            <li>
              <Link href="/about/" prefetch={false}>블로그 소개</Link>
            </li>
            <li>
              <Link href="/editorial/" prefetch={false}>편집 원칙</Link>
            </li>
            <li>
              <Link href="/contact/" prefetch={false}>연락처</Link>
            </li>
            <li>
              <Link href="/privacy/" prefetch={false}>개인정보처리방침</Link>
            </li>
            <li>
              <Link href="/terms/" prefetch={false}>이용약관 및 면책</Link>
            </li>
            <li>
              <a 
                href="https://www.youtube.com/@Na.R.D." 
                target="_blank" 
                rel="noopener noreferrer"
              >
                유튜브 채널 (@Na.R.D.)
              </a>
            </li>
            <li>
              <a 
                href="https://github.com/seodaeya" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            </li>
            <li>
              <a href="mailto:seodaeya@gmail.com" className={styles.footerEmailLink}>
                ✉️ 문의: seodaeya@gmail.com
              </a>
            </li>
            <li>
              <a href="/rss.xml" target="_blank" rel="noopener noreferrer" className={styles.footerRssLink}>
                📡 RSS 피드 구독
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className={styles.footerBottom}>
        <p suppressHydrationWarning>© {currentYear} NaRD. All rights reserved. | Built with Next.js & Human Spirit</p>
      </div>
    </footer>
  );
}
