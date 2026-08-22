import { useState } from 'react';
import styles from '@/styles/sponsor.module.css';

export default function Sponsor({ title = "따뜻한 커피 한 잔으로 응원하기", desc }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <section className={styles.sponsorCard} aria-label="블로그 후원하기">
        <div className={styles.sponsorHeader}>
          <span className={styles.sponsorIcon}>☕</span>
          <h3 className={styles.sponsorTitle}>{title}</h3>
        </div>
        <p className={styles.sponsorDesc}>
          {desc || "이 글이 도움이 되셨나요? 커피 한 잔의 따뜻한 응원은 실수하고 배우며, 사람의 온기를 담은 기록을 꾸준히 이어가는 데 큰 힘이 됩니다."}
        </p>

        <div className={styles.sponsorActions}>
          <button 
            type="button"
            className={styles.kakaoPayButton}
            onClick={() => setIsOpen(true)}
            aria-label="카카오페이로 후원하기"
          >
            <svg 
              className={styles.kakaoIcon} 
              viewBox="0 0 24 24" 
              fill="#191919"
            >
              <path d="M12 3c-5.523 0-10 3.582-10 8 0 2.85 1.875 5.347 4.717 6.726l-1.196 4.385c-.105.385.312.695.65.475l5.244-3.486c.193.013.388.02.585.02 5.523 0 10-3.582 10-8s-4.477-8-10-8z"/>
            </svg>
            카카오페이로 커피 한 잔 후원하기
          </button>
        </div>
      </section>

      {/* QR Modal Pop-up */}
      {isOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button 
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
              aria-label="닫기"
            >
              ✕
            </button>
            <h4 className={styles.modalTitle}>💛 카카오페이 송금 후원</h4>
            <p className={styles.modalSubtitle}>
              카카오톡 또는 기본 카메라 앱으로<br />
              아래 QR 코드를 스캔하시면 간편하게 송금하실 수 있습니다.
            </p>

            <div className={styles.qrContainer}>
              <img 
                src="/kakaopay-qr.png" 
                alt="카카오페이 송금 QR 코드" 
                className={styles.qrImage}
              />
            </div>

            <p className={styles.qrGuide}>
              소중한 응원은 더 깊이 있는 지식 공유와<br />
              따뜻한 일상 아카이빙을 위해 감사히 사용하겠습니다.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
