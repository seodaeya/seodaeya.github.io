import { useState, useEffect } from 'react';
import Link from 'next/link';
import SEO from '@/components/SEO';
import { BOOKMARK_KEY } from '@/components/BookmarkButton';
import SmartRandomWidget from '@/components/SmartRandomWidget';
import {
  useReadPostsSet,
  isContentRead,
  getBookmarkBasedRecommendations,
  BOOKMARK_UPDATED_EVENT,
} from '@/lib/readingHistory';

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState(null);
  const [recData, setRecData] = useState({
    recommendations: [],
    topTags: [],
    topCategories: [],
    bookmarkCount: 0,
  });
  const [pageOffset, setPageOffset] = useState(0);
  const readSet = useReadPostsSet();

  const load = () => {
    try {
      const raw = localStorage.getItem(BOOKMARK_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const validList = Array.isArray(list) ? list : [];
      setBookmarks(validList);
      setRecData(getBookmarkBasedRecommendations('', [], 9));
    } catch (e) {
      setBookmarks([]);
    }
  };

  useEffect(() => {
    load();
    window.addEventListener(BOOKMARK_UPDATED_EVENT, load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener(BOOKMARK_UPDATED_EVENT, load);
      window.removeEventListener('storage', load);
    };
  }, []);

  const remove = (id) => {
    try {
      const raw = localStorage.getItem(BOOKMARK_KEY);
      const list = raw ? JSON.parse(raw) : [];
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify(list.filter((b) => b.id !== id)));
      window.dispatchEvent(new Event(BOOKMARK_UPDATED_EVENT));
      load();
    } catch (e) {}
  };

  const totalRecs = recData.recommendations.length;
  const visibleRecs =
    totalRecs > 0
      ? [0, 1, 2]
          .slice(0, Math.min(3, totalRecs))
          .map((i) => recData.recommendations[(pageOffset + i) % totalRecs])
      : [];

  return (
    <>
      <SEO
        title="북마크 & 맞춤 추천 | 여전히, 나는 사람이다."
        description="나중에 읽기 위해 저장한 글 목록과 내 북마크 태그·취향 기반 맞춤 아티클 추천입니다."
        url="https://seodaeya.github.io/bookmarks/"
        noindex={true}
      />
      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '2.5rem 1rem', color: 'var(--text-primary)', lineHeight: '1.85' }}>
        <header style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1.5rem' }}>
          <span className="category-badge" style={{ marginBottom: '12px' }}>READ LATER & CURATION</span>
          <h1 style={{ fontSize: '2rem', fontWeight: '900', margin: '8px 0 8px 0' }}>
            🔖 내 북마크 & 취향 맞춤 추천
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            관심 있는 글을 북마크에 담아두면, 저장된 글의 <strong>#태그와 주제를 분석해 연관된 아티클을 자동으로 추천</strong>해 드립니다. (모든 데이터는 이 브라우저에만 보관됩니다.)
          </p>
        </header>

        {bookmarks === null ? (
          <p style={{ color: 'var(--text-secondary)' }}>불러오는 중...</p>
        ) : bookmarks.length === 0 ? (
          <div className="glass-card" style={{ padding: '32px 24px', textAlign: 'center' }}>
            <p style={{ marginBottom: '10px', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              아직 북마크에 담긴 글이 없습니다
            </p>
            <p style={{ marginBottom: '18px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              아티클 상단의 <strong>[🔖 북마크]</strong> 버튼을 누르면 그 자리에서 연관 글을 추천받고, 이곳에서 내 관심 태그 분석 리포트를 확인할 수 있습니다.
            </p>
            <Link href="/" style={{ color: 'var(--accent-light)', fontWeight: 700 }}>
              홈에서 관심 있는 글 찾아보기 →
            </Link>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                📌 저장한 글 ({bookmarks.length})
              </h2>
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '12px' }}>
              {bookmarks.map((b) => (
                <li
                  key={b.id}
                  className="glass-card"
                  style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', minWidth: 0 }}>
                    <Link href={`/posts/${b.id}`} style={{ color: 'var(--text-primary)', fontWeight: 700, textDecoration: 'none' }}>
                      {b.title || b.id}
                    </Link>
                    {isContentRead(`posts/${b.id}`, readSet) && (
                      <span className="read-badge">✓ 읽음</span>
                    )}
                  </div>
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

            {/* 북마크 기반 취향 분석 및 연관 글 전용 추천 섹션 */}
            {visibleRecs.length > 0 && (
              <section className="bookmark-curation-section" aria-label="내 북마크 기반 맞춤 추천">
                <div className="bookmark-curation-header">
                  <div>
                    <span className="smart-random-kicker">BOOKMARK DNA CURATION</span>
                    <h2 className="bookmark-curation-title">
                      🎯 북마크한 글과 연결된 맞춤 추천
                    </h2>
                    <p className="bookmark-curation-desc">
                      저장하신 {bookmarks.length}편의 북마크에서 공통 <strong>#태그와 키워드 유사도</strong>가 가장 높은 글들입니다.
                    </p>
                  </div>
                  {totalRecs > 3 && (
                    <button
                      type="button"
                      onClick={() => setPageOffset((prev) => (prev + 3) % totalRecs)}
                      className="bookmark-curation-shuffle-btn"
                    >
                      🔄 다른 연관 글 보기
                    </button>
                  )}
                </div>

                {/* 추출된 내 북마크 관심 태그 DNA */}
                {recData.topTags.length > 0 && (
                  <div className="bookmark-dna-bar">
                    <span className="bookmark-dna-label">내 관심 키워드:</span>
                    {recData.topTags.map(({ tag, count }) => (
                      <span key={tag} className="smart-random-tag-pill">
                        #{tag} {count > 1 ? `(${count})` : ''}
                      </span>
                    ))}
                  </div>
                )}

                <div className="bookmark-curation-grid">
                  {visibleRecs.map((item) => (
                    <Link key={item.key} href={item.url} className="bookmark-curation-card">
                      <div className="bookmark-curation-card-meta">
                        <span className="smart-random-reason-pill">{item.reason}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span className="category-badge" style={{ padding: '2px 8px', fontSize: '0.68rem' }}>
                            {item.type === 'videos' ? '🎬 ' : '📝 '}
                            {item.category}
                          </span>
                          {isContentRead(item.key, readSet) && (
                            <span className="read-badge">✓ 읽음</span>
                          )}
                        </div>
                      </div>
                      <h3 className="bookmark-curation-card-title">{item.title}</h3>
                      {Array.isArray(item.matchedTags) && item.matchedTags.length > 0 && (
                        <div className="bookmark-curation-card-tags">
                          {item.matchedTags.map((t) => (
                            <span key={t} className="smart-random-tag-pill">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <SmartRandomWidget variant="card" />
      </div>
    </>
  );
}
