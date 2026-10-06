import Link from 'next/link';

// 시리즈 연재 네비게이션: 같은 series frontmatter를 가진 글들을 날짜순으로 묶어 보여준다.
// props: { title: 시리즈명, posts: [{id, title}], currentId }
export default function SeriesNav({ title, posts, currentId }) {
  if (!posts || posts.length < 2) return null;
  const currentIndex = posts.findIndex(p => p.id === currentId);

  return (
    <section
      aria-label={`시리즈 이어보기: ${title}`}
      style={{
        margin: '40px 0',
        padding: '24px 26px',
        borderRadius: '16px',
        border: '1px solid var(--border-glass)',
        background: 'var(--bg-secondary)',
      }}
    >
      <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '14px', color: 'var(--text-primary)' }}>
        📚 시리즈로 이어보기: {title}
      </div>
      <ol style={{ margin: 0, paddingLeft: '1.3rem', display: 'grid', gap: '10px' }}>
        {posts.map((post, i) => {
          const isCurrent = post.id === currentId;
          return (
            <li key={post.id} style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              {isCurrent ? (
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  Part {i + 1}. {post.title} <span style={{ fontSize: '0.8rem', color: 'var(--accent-light)' }}>(읽는 중)</span>
                </span>
              ) : (
                <Link
                  href={`/posts/${post.id}`}
                  style={{ color: 'var(--accent-light)', fontWeight: 600, textDecoration: 'none' }}
                >
                  Part {i + 1}. {post.title}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
      <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
        {currentIndex > 0 && (
          <Link
            href={`/posts/${posts[currentIndex - 1].id}`}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            ← 이전 편
          </Link>
        )}
        {currentIndex !== -1 && currentIndex < posts.length - 1 && (
          <Link
            href={`/posts/${posts[currentIndex + 1].id}`}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              background: 'var(--accent-gradient)',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            다음 편 →
          </Link>
        )}
      </div>
    </section>
  );
}
