import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getRelatedToPost, BOOKMARK_UPDATED_EVENT } from '@/lib/readingHistory';

export const BOOKMARK_KEY = 'nard-bookmarks';

export function readBookmarks() {
  try {
    const raw = localStorage.getItem(BOOKMARK_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

// 글 상세 상단의 북마크 토글 버튼 + 북마크 저장 시 즉시 연관 글 추천 배너 노출
export default function BookmarkButton({ id, title }) {
  const [saved, setSaved] = useState(false);
  const [showInstantRec, setShowInstantRec] = useState(false);
  const [relatedPost, setRelatedPost] = useState(null);

  useEffect(() => {
    const isSaved = readBookmarks().some((b) => b.id === id);
    setSaved(isSaved);
    setShowInstantRec(false);
    const matches = getRelatedToPost(id, 1);
    setRelatedPost(matches[0] || null);
  }, [id]);

  const toggle = () => {
    const list = readBookmarks();
    if (list.some((b) => b.id === id)) {
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify(list.filter((b) => b.id !== id)));
      setSaved(false);
      setShowInstantRec(false);
    } else {
      list.unshift({ id, title, savedAt: new Date().toISOString() });
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify(list.slice(0, 100)));
      setSaved(true);
      const matches = getRelatedToPost(id, 1);
      setRelatedPost(matches[0] || null);
      setShowInstantRec(true);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(BOOKMARK_UPDATED_EVENT));
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={saved}
        aria-label={saved ? '북마크 해제' : '북마크 저장'}
        title={saved ? '북마크 해제' : '관심 글로 북마크하고 연관 추천 받기'}
        style={{
          padding: '7px 14px',
          borderRadius: '20px',
          border: '1px solid var(--border-glass)',
          background: saved ? 'var(--accent-gradient)' : 'transparent',
          color: saved ? '#fff' : 'var(--text-secondary)',
          fontSize: '0.85rem',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        {saved ? '🔖 북마크됨' : '🔖 북마크'}
      </button>

      {saved && showInstantRec && relatedPost && (
        <div className="bookmark-instant-rec">
          <div className="bookmark-instant-rec-header">
            <span className="bookmark-instant-rec-badge">
              ✨ 북마크 완료 · 연관 글 추천 ({relatedPost.reason})
            </span>
            <button
              type="button"
              onClick={() => setShowInstantRec(false)}
              className="bookmark-instant-rec-close"
              aria-label="추천 배너 닫기"
            >
              ✕
            </button>
          </div>
          <div className="bookmark-instant-rec-body">
            <Link href={relatedPost.url} className="bookmark-instant-rec-link">
              {relatedPost.title} →
            </Link>
            <Link href="/bookmarks/" className="bookmark-instant-rec-sublink">
              내 북마크 맞춤 추천 전체보기
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
