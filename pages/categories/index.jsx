import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import SEO from '@/components/SEO';
import styles from '@/styles/home.module.css'; // Reusing some grid/flex layouts

export async function getStaticProps() {
  const categoriesFile = path.join(process.cwd(), 'files/categories.json');
  
  let categories = {};
  if (fs.existsSync(categoriesFile)) {
    categories = JSON.parse(fs.readFileSync(categoriesFile, 'utf-8'));
  }

  return {
    props: {
      categories
    }
  };
}

export default function Categories({ categories }) {
  // Check if post is video or blog post
  const isVideo = (filePath) => {
    return filePath.includes('videos/') || filePath.includes('videos\\');
  };

  return (
    <>
      <SEO 
        title="카테고리별 콘텐츠"
        description="전체 카테고리별 블로그 포스트 및 유튜브 영상을 한눈에 분류하여 확인하실 수 있습니다."
        url="https://seodaeya.github.io/categories"
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        {/* Category Header */}
        <section style={{ textAlign: 'center', padding: '40px 0 20px 0' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '16px' }}>카테고리 분류</h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem', lineHeight: 1.6 }}>
            블로그 기술 아티클과 유튜브 채널의 지극히 인간적인 기록들을 카테고리별로 모아두었습니다. 관심 있는 분야를 탐색해 보세요.
          </p>
          
          {/* Quick tags navigation bar */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '32px' }}>
            {Object.keys(categories).map(category => (
              <a 
                key={category} 
                href={`#category-${category}`}
                className="category-badge"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                {category} ({categories[category].length})
              </a>
            ))}
          </div>
        </section>

        {/* Categories Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '64px' }}>
          {Object.keys(categories).map(category => (
            <section 
              key={category} 
              id={`category-${category}`}
              style={{ scrollMarginTop: '100px' }}
            >
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'baseline', 
                  gap: '16px', 
                  borderBottom: '1px solid var(--border-glass)', 
                  paddingBottom: '12px', 
                  marginBottom: '24px' 
                }}
              >
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>{category}</h2>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  총 {categories[category].length}개의 콘텐츠
                </span>
              </div>

              {/* Grid of contents */}
              <div className="grid-container">
                {categories[category].map(post => {
                  const videoType = isVideo(post.file);
                  const targetUrl = `/${post.file.replace('.md', '')}`;
                  
                  return (
                    <Link 
                      key={post.file} 
                      href={targetUrl}
                      className="glass-card"
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between',
                        gap: '20px',
                        textDecoration: 'none'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span 
                            style={{ 
                              padding: '2px 8px', 
                              borderRadius: '4px', 
                              fontSize: '0.7rem', 
                              fontWeight: 700,
                              background: videoType ? 'rgba(255, 0, 0, 0.1)' : 'rgba(138, 43, 226, 0.1)',
                              border: videoType ? '1px solid rgba(255, 0, 0, 0.2)' : '1px solid rgba(138, 43, 226, 0.2)',
                              color: videoType ? 'var(--youtube-red)' : 'var(--accent-light)'
                            }}
                          >
                            {videoType ? 'YOUTUBE 📺' : 'BLOG 📝'}
                          </span>
                        </div>
                        <h3 
                          style={{ 
                            fontSize: '1.15rem', 
                            fontWeight: 600, 
                            lineHeight: 1.4, 
                            margin: 0,
                            color: 'var(--text-primary)',
                            transition: 'color 0.2s ease'
                          }}
                        >
                          {post.title}
                        </h3>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--accent-secondary)', fontWeight: 500 }}>
                        자세히 보기 →
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
