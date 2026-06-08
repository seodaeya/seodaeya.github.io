import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import SEO from '@/components/SEO';
import styles from '@/styles/categories.module.css';

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

      <div className={styles.categoriesPage}>
        {/* Category Header */}
        <section className={styles.hero}>
          <h1 className={styles.title}>카테고리 분류</h1>
          <p className={styles.description}>
            블로그 기술 아티클과 유튜브 채널의 지극히 인간적인 기록들을 카테고리별로 모아두었습니다. 관심 있는 분야를 탐색해 보세요.
          </p>
          
          {/* Quick tags navigation bar */}
          <div className={styles.quickNav}>
            {Object.keys(categories).map(category => (
              <a 
                key={category} 
                href={`#category-${category}`}
                className="category-badge"
              >
                {category} ({categories[category].length})
              </a>
            ))}
          </div>
        </section>

        {/* Categories Sections */}
        <div className={styles.sectionList}>
          {Object.keys(categories).map(category => (
            <section 
              key={category} 
              id={`category-${category}`}
              className={styles.categorySection}
            >
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{category}</h2>
                <span className={styles.sectionCount}>
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
                      className={`glass-card ${styles.contentCard}`}
                    >
                      <div>
                        <div className={styles.typeRow}>
                          <span 
                            className={`${styles.typeBadge} ${videoType ? styles.videoBadge : styles.blogBadge}`}
                          >
                            {videoType ? 'YOUTUBE 📺' : 'BLOG 📝'}
                          </span>
                        </div>
                        <h3 className={styles.cardTitle}>
                          {post.title}
                        </h3>
                      </div>
                      <div className={styles.cardLink}>
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
