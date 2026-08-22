import SEO from '@/components/SEO';

export default function Privacy() {
  return (
    <>
      <SEO 
        title="개인정보처리방침 | 여전히, 나는 사람이다."
        description="'여전히, 나는 사람이다.' 블로그의 개인정보처리방침, 제3자 서비스(구글 애드센스, MS Clarity) 쿠키 이용 안내입니다."
        url="https://seodaeya.github.io/privacy"
      />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', color: 'var(--text-main, #e2e8f0)', lineHeight: '1.75' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color, #334155)', paddingBottom: '0.5rem' }}>개인정보처리방침</h1>
        
        <p style={{ marginBottom: '1rem' }}>
          '여전히, 나는 사람이다.' 블로그(https://seodaeya.github.io, 이하 '본 블로그')는 별도의 회원가입 없이 이용할 수 있는 정적 웹사이트로, <strong>블로그 운영자가 방문자의 성명, 연락처 등의 개인정보를 직접 수집하거나 보유하지 않습니다.</strong>
        </p>

        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginTop: '2rem', marginBottom: '0.75rem' }}>1. 제3자 서비스의 쿠키(Cookie) 및 서드파티 자동 수집 안내</h2>
        <p style={{ marginBottom: '1rem' }}>
          본 블로그는 사이트 기능 제공, 방문 분석 및 광고 서빙을 위해 구글(Google) 및 마이크로소프트(Microsoft) 등 제3자 서비스 엔진을 연동하고 있습니다. 이 과정에서 브라우저의 '쿠키(Cookie)' 기술을 통해 비식별 정보가 자동으로 처리될 수 있습니다.
        </p>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
          <li><strong>Google AdSense (애드센스):</strong> Google을 포함한 타사 판매자는 쿠키를 사용하여 방문자의 이전 방문 기록을 바탕으로 맞춤형 광고를 게재합니다. 방문자는 <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>Google 광고 설정</a>에서 맞춤설정 광고 수신을 거부할 수 있습니다.</li>
          <li><strong>Microsoft Clarity / Google Analytics:</strong> 웹사이트 이용 패턴 분석 및 사용자 경험 개선을 위해 익명의 사용 행태 로그를 자동 수집합니다.</li>
          <li><strong>Giscus (댓글 기능):</strong> GitHub API 기반으로 운영되며, 댓글 작성 시 사용자의 GitHub 로그인 세션이 이용됩니다. 본 블로그는 별도의 댓글 데이터베이스를 운영하지 않습니다.</li>
        </ul>

        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginTop: '2rem', marginBottom: '0.75rem' }}>2. 쿠키 설치 및 거부 방법</h2>
        <p style={{ marginBottom: '1rem' }}>
          방문자는 웹브라우저 옵션 설정을 통해 쿠키 허용 수준을 직접 제어하거나 거부할 수 있습니다. (Chrome 기준: 설정 &gt; 개인정보 보호 및 보안 &gt; 서드파티 쿠키 차단 설정)
        </p>

        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginTop: '2rem', marginBottom: '0.75rem' }}>3. 문의처</h2>
        <p style={{ marginBottom: '1rem' }}>
          본 블로그 운영 방식이나 개인정보 관련 문의사항은 아래 GitHub 저장소를 통해 문의하실 수 있습니다.
        </p>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
          <li>GitHub: <a href="https://github.com/seodaeya" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>https://github.com/seodaeya</a></li>
        </ul>

        <p style={{ marginTop: '2.5rem', fontSize: '0.9rem', opacity: 0.7 }}>
          공고 일자: 2026년 8월 3일 | 시행 일자: 2026년 8월 3일
        </p>
      </div>
    </>
  );
}
