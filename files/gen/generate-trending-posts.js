const fs = require('fs');
const path = require('path');

const trendingPostsPath = path.join(__dirname, '../trending-posts.json');

// Default / Curated Flagship Top Picks
const defaultTrending = [
  {
    badge: '🔥 인기 아키텍처',
    title: '온톨로지(Ontology)란 무엇인가? 이커머스 검색과 AI 추천 혁신의 핵심',
    url: '/posts/20260827-1-ecommerce-ontology-ai-search-guide',
    desc: '지식 그래프와의 본질적 차이부터 시맨틱 추론, 4단계 구축 파이프라인 및 GraphRAG 하이브리드 아키텍처 완벽 가이드.',
    tag: 'Tech & Dev'
  },
  {
    badge: '⚡️ 실전 트러블슈팅',
    title: 'Spring Boot Lettuce Redis 캐싱 도입 후 DB 커넥션 풀 고갈과 504 타임아웃 해결기',
    url: '/posts/20260825-1-spring-boot-lettuce-redis-caching-traffic-bottleneck',
    desc: 'Redis 캐시 웜업, 스탬피드 방지, HikariCP 커넥션 풀 최적화로 동시 접속 대란을 극복한 3단계 실전 전략.',
    tag: 'Backend'
  },
  {
    badge: '🤖 AI 모델 분석',
    title: 'Google Gemini 3.7 Flash 모델 분석: 생각 시간(Thinking Budget) 제어와 하이브리드 추론',
    url: '/posts/20260815-1-gemini-3-7-flash-analysis',
    desc: '동적 추론 토큰 제어로 비용과 성능의 균형을 완성한 차세대 멀티모달 AI의 기술적 특징 분석.',
    tag: 'AI & ML'
  }
];

fs.writeFileSync(trendingPostsPath, JSON.stringify(defaultTrending, null, 2), 'utf-8');
console.log('trending-posts.json 생성 완료!');
