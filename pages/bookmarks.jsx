import { useState, useEffect } from 'react';
import Link from 'next/link';
import SEO from '@/components/SEO';
import { BOOKMARK_KEY } from '@/components/BookmarkButton';

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState(null);

  const load = () => {
    try {
      const raw = localStorage.getItem(BOOKMARK_KEY);
      const list = raw ? JSON.parse(raw) : [];
      setBookmarks(Array.isArray(list) ? list : []);
    } catch (e) {
      setBookmarks([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = (id) => {
    try {
      const raw = localStorage.getItem(BOOKMARK_KEY);
      const list = raw ? JSON.parse(raw) : [];
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify(list.filter(b => b.id !== id)));
      load();
    } catch (e) {}
  };

  return (
    <>
      <SEO
        title="북마크 | 여전히, 나는 사람이다."
        description="나중에 읽기 위해 저장한 글 목록입니다. 이 브라우저에만 보관됩니다."
        url="https://seodaeya.github.io/bookmarks/"
      />
      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '2.5rem 1rem', color: 'var(--text-primary)', lineHeight: '1.85' }}>
        <header style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1.5rem' }}>
          <span className="category-badge" style={{ marginBottom: '12px' }}>READ LATER</span>
          <h1 style={{ fontSize: '2rem', fontWeight: '900', margin: '8px 0 8px 0' }}>
            🔖 북마크
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            저장한 글은 이 브라우저에만 보관되며, 서버로 전송되지 않습니다.
          </p>
        </header>

        {bookmarks === null ? (
          <p style={{ color: 'var(--text-secondary)' }}>불러오는 중...</p>
        ) : bookmarks.length === 0 ? (
          <div className="glass-card" style={{ padding: '32px 24px', textAlign: 'center' }}>
            <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
              아직 저장된 글이 없습니다. 글 상단의 북마크 버튼으로 저장해 보세요.
            </p>
            <Link href="/" style={{ color: 'var(--accent-light)', fontWeight: 700 }}>
              홈에서 글 찾아보기 →
            </Link>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '12px' }}>
            {bookmarks.map(b => (
              <li
                key={b.id}
                className="glass-card"
                style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}
              >
                <Link href={`/posts/${b.id}`} style={{ color: 'var(--text-primary)', fontWeight: 700, textDecoration: 'none' }}>
                  {b.title || b.id}
                </Link>
                <button
                  type="button"
                  onClick={() => remove(b.id)}
                  aria-label="북마크 삭제"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-glass)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
