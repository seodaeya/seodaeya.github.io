import SEO from '@/components/SEO';
import Link from 'next/link';

export default function About() {
  return (
    <>
      <SEO 
        title="블로그 소개 | 나는 사람이다."
        description="'나는 사람이다' 블로그의 소개 및 기술, 라이프스타일, AI 탐구에 대한 이야기입니다."
        url="https://seodaeya.github.io/about"
      />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', color: 'var(--text-main, #e2e8f0)', lineHeight: '1.75' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color, #334155)', paddingBottom: '0.5rem' }}>블로그 소개</h1>
        
        <p style={{ fontSize: '1.1rem', fontWeight: '600', color: '#38bdf8', marginBottom: '1.5rem' }}>
          인공지능 트렌드부터 손끝의 일상까지, 직접 겪고 기록하는 이야기.
        </p>

        <p style={{ marginBottom: '1.2rem' }}>
          안녕하세요! <strong>'나는 사람이다'</strong>는 빠른 기술의 변화 속에서도 인간 고유의 시선과 경험을 바탕으로 깊이 있는 지식을 기록하는 1인 테크 & 라이프스타일 블로그입니다.
        </p>

        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginTop: '2rem', marginBottom: '0.75rem' }}>주요 다루는 주제</h2>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem' }}>
          <li><strong>AI & Tech 리서치:</strong> OpenAI GPT-5.6, Google Gemini 3.6, Claude, Agentic Planning 등 첨단 AI 트렌드 및 개발 도구 분석</li>
          <li><strong>개발 & 시스템 테크:</strong> 정적 웹사이트 구축, Giscus 연동, 스크립트 자동화 및 에러 해결 가이드</li>
          <li><strong>셀프 DIY & 가전 리뉴얼:</strong> 싼타페 차량 DIY, SK매직 얼음정수기 토출부 세척 등 생활 속 정교한 가전 케어</li>
          <li><strong>라이프 & 문화:</strong> 칵테일 레시피, 반려 파충류(크레스티드 게코) 케어, 스포츠 스토리</li>
        </ul>

        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginTop: '2rem', marginBottom: '0.75rem' }}>운영 정책</h2>
        <p style={{ marginBottom: '1.5rem' }}>
          모든 글은 출처가 명확하며, 직접 실습하거나 경험한 구체적인 사실에 기반하여 작성합니다. 
          자세한 개인정보 보호 방침은 <Link href="/privacy/" style={{ color: '#38bdf8' }}>개인정보처리방침 페이지</Link>에서 확인하실 수 있습니다.
        </p>
      </div>
    </>
  );
}
