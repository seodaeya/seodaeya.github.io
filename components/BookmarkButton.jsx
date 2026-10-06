import { useState, useEffect } from 'react';

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

// 글 상세 상단의 북마크 토글 버튼. props: { id, title }
export default function BookmarkButton({ id, title }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(readBookmarks().some(b => b.id === id));
  }, [id]);

  const toggle = () => {
    const list = readBookmarks();
    if (list.some(b => b.id === id)) {
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify(list.filter(b => b.id !== id)));
      setSaved(false);
    } else {
      list.unshift({ id, title, savedAt: new Date().toISOString() });
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify(list.slice(0, 100)));
      setSaved(true);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? '북마크 해제' : '북마크 저장'}
      title={saved ? '북마크 해제' : '나중에 읽기 저장'}
      style={{
        padding: '7px 14px',
        borderRadius: '20px',
        border: '1px solid var(--border-glass)',
        background: saved ? 'var(--accent-gradient)' : 'transparent',
        color: saved ? '#fff' : 'var(--text-secondary)',
        fontSize: '0.85rem',
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      {saved ? '🔖 저장됨' : '🔖 북마크'}
    </button>
  );
}
