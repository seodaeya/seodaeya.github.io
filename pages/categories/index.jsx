import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import SEO from '@/components/SEO';
import { useReadPostsSet, isContentRead } from '@/lib/readingHistory';
import styles from '@/styles/categories.module.css';

// 카테고리별 해설 — 목록만 있는 허브 페이지가 되지 않도록 주제 범위와 읽는 순서를 안내한다.
const CATEGORY_INTROS = {
  'AI & Intelligence':
    '생성형 AI 모델의 버전 변화, 에이전트 아키텍처, 프롬프트 설계, 그리고 AI를 실제 업무에 붙이는 과정에서 겪은 문제를 다룹니다. 특정 모델을 띄우는 글이 아니라, 릴리스 노트와 공식 문서를 확인한 뒤 직접 설치·측정한 결과를 기록합니다. AI를 처음 쓰는 분은 모델 비교 글부터, 이미 쓰고 있는 분은 에이전트·컨텍스트 설계 글로 이어서 읽으시면 좋습니다.',
  'Dev & Software':
    '웹 성능, 정적 사이트 배포, 검색 최적화(SEO/GEO), 데이터베이스 병목처럼 실제 서비스를 운영하며 부딪힌 문제를 정리합니다. PageSpeed 수치나 빌드 로그처럼 재현 가능한 근거를 함께 남기고, 적용 전후를 비교할 수 있게 측정 조건을 명시합니다. 설정 한 줄이 왜 점수를 바꾸는지 궁금한 분께 적합합니다.',
  'Hardware & DIY':
    '키보드·주변기기 설정, 기기 분해와 수리, 운영체제 간 파일 전송처럼 손으로 직접 해봐야 알 수 있는 작업을 다룹니다. 제조사 문서에 없는 동작은 실패한 시도까지 함께 적습니다. 같은 기기를 쓰는 분이 시행착오를 줄일 수 있도록 단계와 주의사항을 순서대로 정리했습니다.',
  'Lifestyle & Tech':
    '기술이 일상과 만나는 지점 — 교육, 독서, 가계 관리처럼 숫자로만 설명되지 않는 주제를 다룹니다. 전문가의 1차 자료를 확인하고, 가족과 함께 살아보며 실제로 통했던 방법만 남깁니다. 기술 블로그지만 결국 사람이 중심이라는 관점의 글들입니다.',
};

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
  const readSet = useReadPostsSet();

  // Check if post is video or blog post
  const isVideo = (filePath) => {
    return filePath.includes('videos/') || filePath.includes('videos\\');
  };

  return (
    <>
      <SEO 
        title="카테고리별 아티클 & 영상"
        description="전체 카테고리별 기술 아티클 및 유튜브 영상을 한눈에 분류하여 확인하실 수 있습니다."
        url="https://seodaeya.github.io/categories/"
      />

      <div className={styles.categoriesPage}>
        {/* Category Header */}
        <section className={styles.hero}>
          <h1 className={styles.title}>카테고리 분류</h1>
          <p className={styles.description}>
            기술 아티클과 일상의 기록을 주제별로 모았습니다. 각 카테고리에는 어떤 글을 다루는지,
            어떤 순서로 읽으면 좋은지를 함께 적어두었습니다. 관심 있는 분야를 골라 탐색해 보세요.
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

              {CATEGORY_INTROS[category] && (
                <p className={styles.description} style={{ marginBottom: '1.25rem' }}>
                  {CATEGORY_INTROS[category]}
                </p>
              )}

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
                        <div className={styles.typeRow} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span 
                            className={`${styles.typeBadge} ${videoType ? styles.videoBadge : styles.blogBadge}`}
                          >
                            {videoType ? '🎬 영상' : '📝 아티클'}
                          </span>
                          {isContentRead(post.file, readSet) && (
                            <span className="read-badge">✓ 읽음</span>
                          )}
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
