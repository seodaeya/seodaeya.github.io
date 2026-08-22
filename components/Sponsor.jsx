import { useState } from 'react';
import styles from '@/styles/sponsor.module.css';

const KAKAOPAY_DIRECT_URL = "https://qr.kakaopay.com/281006011116104911007615";

export default function Sponsor({ title = "따뜻한 커피 한 잔으로 응원하기", desc }) {
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(KAKAOPAY_DIRECT_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section className={styles.sponsorCard} aria-label="블로그 후원하기">
      <div className={styles.sponsorHeader}>
        <span className={styles.sponsorIcon}>☕</span>
        <h3 className={styles.sponsorTitle}>{title}</h3>
      </div>
      <p className={styles.sponsorDesc}>
        {desc || "이 글이 도움이 되셨나요? 커피 한 잔의 따뜻한 응원은 실수하고 배우며, 사람의 온기를 담은 기록을 꾸준히 이어가는 데 큰 힘이 됩니다."}
      </p>

      <div className={styles.sponsorActions}>
        {/* KakaoPay Toggle Button */}
        <button 
          type="button"
          className={`${styles.kakaoPayButton} ${isQrOpen ? styles.kakaoPayButtonActive : ''}`}
          onClick={() => setIsQrOpen(!isQrOpen)}
          aria-expanded={isQrOpen}
          aria-label="카카오페이 QR 코드 펼치기"
        >
          <svg 
            className={styles.kakaoIcon} 
            viewBox="0 0 24 24" 
            fill="#191919"
          >
            <path d="M12 3c-5.523 0-10 3.582-10 8 0 2.85 1.875 5.347 4.717 6.726l-1.196 4.385c-.105.385.312.695.65.475l5.244-3.486c.193.013.388.02.585.02 5.523 0 10-3.582 10-8s-4.477-8-10-8z"/>
          </svg>
          {isQrOpen ? '카카오페이 QR 닫기' : '카카오페이 후원'}
        </button>

        {/* GitHub Sponsors Button */}
        <a 
          href="https://github.com/sponsors/seodaeya" 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.githubSponsorButton}
          aria-label="GitHub Sponsors로 후원하기"
        >
          <svg 
            className={styles.githubIcon} 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          <span className={styles.sponsorHeart}>💖</span>
          GitHub Sponsors
        </a>

        {/* Coupang Partners Sponsor Link */}
        <a 
          href="https://link.coupang.com/a/gpEnV0YNfE" 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.coupangSponsorButton}
          aria-label="쿠팡 쇼핑으로 후원하기"
        >
          <span>🛍️</span>
          쿠팡 쇼핑 후원
        </a>
      </div>

      {/* In-Place QR & Mobile Link Unfold */}
      {isQrOpen && (
        <div className={styles.inlineQrWrapper}>
          <div className={styles.qrBox}>
            <h4 className={styles.qrTitle}>💛 카카오페이 간편 송금</h4>
            <p className={styles.qrSubtitle}>
              <strong>스마트폰</strong>에서는 아래 바로가기 버튼을 누르면 카카오페이로 즉시 연결됩니다.
            </p>

            {/* Mobile Direct Deep-link Button */}
            <a 
              href={KAKAOPAY_DIRECT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.directMobileButton}
            >
              <span>📲</span> 모바일 카카오페이 송금 바로가기
            </a>

            <div style={{ margin: '8px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              - 또는 PC에서 QR 스캔 -
            </div>

            {/* QR Code for PC/Desktop */}
            <div className={styles.qrImageFrame}>
              <img 
                src="/kakaopay-qr.png" 
                alt="카카오페이 송금 QR 코드" 
                className={styles.qrImage}
              />
            </div>

            <p className={styles.qrGuideText}>
              소중한 응원은 더 깊이 있는 지식 공유와<br />
              따뜻한 일상 아카이빙을 위해 감사히 사용하겠습니다.
            </p>

            <button 
              type="button" 
              className={styles.qrCloseTextBtn}
              onClick={() => setIsQrOpen(false)}
            >
              QR 접기 ✕
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
