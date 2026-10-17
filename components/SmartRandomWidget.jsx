import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  getAllContentPool,
  pickSmartRandomPost,
  pickBookmarkMatchedPost,
  useReadPostsSet,
  useBookmarksList,
} from '@/lib/readingHistory';
import styles from '@/styles/layout.module.css';

export default function SmartRandomWidget({
  variant = 'card',
  currentKey = '',
  onNavigate,
}) {
  const router = useRouter();
  const readSet = useReadPostsSet();
  const bookmarks = useBookmarksList();
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinMode, setSpinMode] = useState('random'); // 'random' | 'bookmark'
  const [pickedPost, setPickedPost] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    setTotalCount(getAllContentPool().length);
  }, []);

  // 라우트 변경 시 하단 프리뷰 카드 및 안내창 초기화
  useEffect(() => {
    setPickedPost(null);
    setIsHelpOpen(false);
  }, [router.asPath]);

  const readCount = Math.min(readSet.size, totalCount || readSet.size);
  const unreadCount = Math.max(0, totalCount - readCount);
  const bookmarkCount = bookmarks.length;
  const activeCurrentKey = currentKey || router.asPath;

  // 1. 상단 헤더 및 모바일 메뉴용: 클릭 시 안 읽은 글로 즉시 이동
  const handleQuickJump = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    const target = pickSmartRandomPost(activeCurrentKey);

    setTimeout(() => {
      setIsSpinning(false);
      if (onNavigate) onNavigate();
      if (target?.url) {
        router.push(target.url);
      }
    }, 240);
  };

  // 2. 본문 하단 카드용: 모드별('random' 또는 'bookmark')로 추천 글을 뽑아 미리보기 제공
  const handleDrawCard = (mode = 'random') => {
    if (isSpinning) return;
    setSpinMode(mode);
    setIsSpinning(true);
    const exclude = pickedPost?.key ? [pickedPost.key] : [];

    setTimeout(() => {
      const target =
        mode === 'bookmark'
          ? pickBookmarkMatchedPost(activeCurrentKey, exclude)
          : pickSmartRandomPost(activeCurrentKey, exclude);
      setPickedPost(target);
      setIsSpinning(false);
    }, 220);
  };

  if (variant === 'header') {
    return (
      <div className={styles.randomHeaderWrapper}>
        <button
          type="button"
          onClick={handleQuickJump}
          disabled={isSpinning}
          className={styles.randomHeaderBtn}
          aria-label="안 읽은 글 랜덤 뽑기 (클릭 시 이동)"
          aria-describedby="random-header-tooltip"
        >
          <span
            className={`${styles.randomDiceIcon} ${
              isSpinning ? styles.randomDiceSpin : ''
            }`}
            aria-hidden="true"
          >
            🎲
          </span>
          <span className={styles.randomHeaderText}>랜덤 글 뽑기</span>
        </button>

        {/* 마우스 호버/포커스 시 즉시 나타나는 기능 설명 툴팁 카드 */}
        <div
          id="random-header-tooltip"
          role="tooltip"
          className={styles.randomHeaderTooltip}
        >
          <div className={styles.randomTooltipTitle}>
            <span>🎲</span>
            <strong>스마트 랜덤 글 뽑기란?</strong>
          </div>
          <p className={styles.randomTooltipDesc}>
            클릭하면 <strong>아직 읽지 않은 글·영상</strong> 중 하나를 골라 바로 이동합니다. 북마크해 둔 관심 카테고리가 있다면 해당 분야 글을 우선 추천합니다.
          </p>
          {totalCount > 0 && (
            <div className={styles.randomTooltipFooter}>
              <span className={styles.randomTooltipDot} />
              <span>
                열람: <strong>{readCount}/{totalCount}편</strong> · 북마크: <strong>{bookmarkCount}편</strong>
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'mobile-menu') {
    return (
      <div className={styles.mobileRandomGroup}>
        <button
          type="button"
          onClick={handleQuickJump}
          disabled={isSpinning}
          className={styles.mobileRandomBtn}
        >
          <div className={styles.mobileRandomTopRow}>
            <span
              className={`${styles.randomDiceIcon} ${
                isSpinning ? styles.randomDiceSpin : ''
              }`}
              aria-hidden="true"
            >
              🎲
            </span>
            <span>안 읽은 글 랜덤 뽑기</span>
            {totalCount > 0 && (
              <span className={styles.mobileRandomCount}>
                {readCount}/{totalCount} 읽음
              </span>
            )}
          </div>
          <span className={styles.mobileRandomSubDesc}>
            아직 안 본 글과 북마크 관심 분야를 우선 추천해 바로 이동합니다
          </span>
        </button>
      </div>
    );
  }

  // variant === 'card' (포스트/영상 하단 및 북마크 페이지 연동 위젯)
  return (
    <section
      className="smart-random-card"
      aria-label="스마트 랜덤 및 북마크 기반 콘텐츠 추천"
    >
      <div className="smart-random-header">
        <div className="smart-random-info">
          <div className="smart-random-badge-row">
            <span className="smart-random-kicker">🎲 스마트 탐색 & 🔖 북마크 맞춤 추천</span>
            {totalCount > 0 && (
              <span className="smart-random-stat">
                열람 {readCount}/{totalCount}편 (미열람 {unreadCount}편)
              </span>
            )}
            <span className="smart-random-stat">
              🔖 북마크 {bookmarkCount}편
            </span>
            <button
              type="button"
              className="smart-random-help-toggle"
              onClick={() => setIsHelpOpen(!isHelpOpen)}
              aria-expanded={isHelpOpen}
            >
              {isHelpOpen ? '기능 안내 닫기 ▲' : '어떤 기능인가요? ⓘ'}
            </button>
          </div>
          <h3 className="smart-random-title">
            다음에 읽을 글을 어떻게 골라드릴까요?
          </h3>
          <p className="smart-random-desc">
            <strong>안 읽은 글 무작위 뽑기</strong>로 새로운 주제를 발견하거나, <strong>내 북마크 맞춤 추천</strong>으로 관심 태그와 연결된 글을 뽑아보세요.
          </p>
        </div>

        <div className="smart-random-btn-group">
          <button
            type="button"
            onClick={() => handleDrawCard('random')}
            disabled={isSpinning}
            className="smart-random-action-btn"
          >
            <span
              className={`${styles.randomDiceIcon} ${
                isSpinning && spinMode === 'random' ? styles.randomDiceSpin : ''
              }`}
              aria-hidden="true"
            >
              🎲
            </span>
            <span>
              {pickedPost && spinMode === 'random' ? '랜덤 다시 뽑기' : '안 읽은 글 뽑기'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleDrawCard('bookmark')}
            disabled={isSpinning}
            className="smart-random-bookmark-btn"
          >
            <span
              className={`${styles.randomDiceIcon} ${
                isSpinning && spinMode === 'bookmark' ? styles.randomDiceSpin : ''
              }`}
              aria-hidden="true"
            >
              🔖
            </span>
            <span>
              {pickedPost && spinMode === 'bookmark'
                ? '북마크 추천 다시 뽑기'
                : `북마크 맞춤 추천${bookmarkCount > 0 ? ` (${bookmarkCount})` : ''}`}
            </span>
          </button>
        </div>
      </div>

      {/* 기능 상세 설명 접기/펼치기 박스 */}
      {isHelpOpen && (
        <div className="smart-random-help-box">
          <div className="smart-random-help-title">
            💡 2가지 추천 모드는 이렇게 동작합니다
          </div>
          <ul className="smart-random-help-list">
            <li>
              <strong>🎲 안 읽은 글 뽑기:</strong> 5초 이상 체류하거나 30% 이상 스크롤해 읽은 글(`✓ 읽음`)은 제외하고, 아직 보지 않은 글 중에서 무작위로 새로운 글을 뽑아줍니다.
            </li>
            <li>
              <strong>🔖 북마크 맞춤 추천:</strong> 내가 `🔖 북마크`에 저장한 글들의 <strong>#태그·키워드·카테고리 유사도</strong>를 분석해 가장 관련성이 높은 글을 추천하며, 어떤 북마크 글과 연결되었는지 함께 알려줍니다.
            </li>
            <li>
              <strong>🔒 개인정보·속도 영향 제로:</strong> 모든 북마크와 열람 기록은 서버 전송 없이 내 브라우저에만 초경량(약 4KB 이하)으로 안전하게 보관됩니다.
            </li>
          </ul>
        </div>
      )}

      {pickedPost && (
        <Link href={pickedPost.url} className="smart-random-preview">
          <div className="smart-random-preview-body">
            <div className="smart-random-preview-meta">
              <span className="smart-random-reason-pill">{pickedPost.reason}</span>
              <span className="category-badge" style={{ padding: '2px 8px', fontSize: '0.68rem' }}>
                {pickedPost.type === 'videos' ? '🎬 ' : '📝 '}
                {pickedPost.category}
              </span>
              {Array.isArray(pickedPost.matchedTags) &&
                pickedPost.matchedTags.map((tag) => (
                  <span key={tag} className="smart-random-tag-pill">
                    #{tag}
                  </span>
                ))}
            </div>
            <h4 className="smart-random-preview-title">{pickedPost.title}</h4>
          </div>
          <span className="smart-random-preview-cta">읽으러 가기 →</span>
        </Link>
      )}
    </section>
  );
}
