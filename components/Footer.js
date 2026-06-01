import styles from '@/styles/layout.module.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={styles.footerInfo}>
          <h3 className={styles.footerLogo}>나는 사람이다.</h3>
          <p className={styles.footerDescription}>
            AI가 세상을 분석하고 답할 때, 한 인간의 시선으로 바라보고 경험한 이야기들을 남깁니다.
            기술, 일상, 그리고 지극히 주관적인 생각들의 기록.
          </p>
        </div>

        <div className={styles.footerLinks}>
          <h4>연결된 채널</h4>
          <ul>
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
          </ul>
        </div>
      </div>
      <div className={styles.footerBottom}>
        <p>© {currentYear} NaRD. All rights reserved. | Built with Next.js & Human Spirit</p>
      </div>
    </footer>
  );
}
