import SEO from '@/components/SEO';

export default function Privacy() {
  return (
    <>
      <SEO 
        title="개인정보처리방침 | 나는 사람이다."
        description="'나는 사람이다' 블로그의 개인정보처리방침, 쿠키 이용 및 구글 애드센스 광고 서비스 관련 안내입니다."
        url="https://seodaeya.github.io/privacy"
      />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', color: 'var(--text-main, #e2e8f0)', lineHeight: '1.75' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color, #334155)', paddingBottom: '0.5rem' }}>개인정보처리방침</h1>
        
        <p style={{ marginBottom: '1rem' }}>
          '나는 사람이다' 블로그(https://seodaeya.github.io, 이하 '본 블로그')는 방문자의 개인정보를 중요시하며, 관련 법령을 준수합니다. 본 개인정보처리방침은 방문자가 서비스를 이용할 때 수집되는 정보와 그 이용 목적을 안내합니다.
        </p>

        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginTop: '2rem', marginBottom: '0.75rem' }}>1. 수집하는 개인정보 항목 및 방법</h2>
        <p style={{ marginBottom: '1rem' }}>
          본 블로그는 회원가입 없이 이용할 수 있는 정적 웹사이트로, 별도의 이름이나 주민등록번호 등의 직접적인 개인식별 정보를 수집하지 않습니다. 다만, 서비스 이용 과정에서 쿠키(Cookie), 접속 IP, 방문 일시, 웹브라우저 종류 등의 자동화된 로그 데이터가 수집될 수 있습니다.
        </p>

        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginTop: '2rem', marginBottom: '0.75rem' }}>2. 쿠키(Cookie)의 사용 및 구글 애드센스(Google AdSense) 안내</h2>
        <p style={{ marginBottom: '1rem' }}>
          본 블로그는 방문자에게 맞춤형 콘텐츠 및 광고를 제공하기 위해 '쿠키(Cookie)'를 사용합니다. 쿠키는 웹사이트가 방문자의 브라우저로 전송하는 소량의 텍스트 파일입니다.
        </p>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
          <li>Google을 포함한 타사 판매자는 쿠키를 사용하여 방문자의 이전 방문 기록을 바탕으로 광고를 게재합니다.</li>
          <li>Google의 광고 쿠키를 사용하면 Google 및 파트너가 본 사이트 또는 인터넷의 다른 사이트 방문을 기반으로 맞춤형 광고를 제공할 수 있습니다.</li>
          <li>방문자는 <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>Google 광고 설정</a>을 방문하여 맞춤설정 광고를 수신 거부할 수 있습니다.</li>
        </ul>

        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginTop: '2rem', marginBottom: '0.75rem' }}>3. 댓글 서비스 (Giscus / GitHub)</h2>
        <p style={{ marginBottom: '1rem' }}>
          본 블로그의 댓글 기능은 GitHub 계정 기반의 오픈소스 서비스인 Giscus를 사용합니다. 댓글 작성 시 사용하는 정보는 GitHub API를 통해 처리되며, 본 블로그의 서버에 사용자 비밀번호나 개인정보를 보관하지 않습니다.
        </p>

        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginTop: '2rem', marginBottom: '0.75rem' }}>4. 개인정보 보호책임자 및 문의처</h2>
        <p style={{ marginBottom: '1rem' }}>
          개인정보 관련 문의사항이나 의견은 아래의 연락처 및 GitHub 이슈를 통해 문의해 주시기 바랍니다.
        </p>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
          <li>블로그명: 나는 사람이다. (seodaeya.github.io)</li>
          <li>GitHub: <a href="https://github.com/seodaeya" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>https://github.com/seodaeya</a></li>
        </ul>

        <p style={{ marginTop: '2.5rem', fontSize: '0.9rem', opacity: 0.7 }}>
          공고 일자: 2026년 8월 3일 | 시행 일자: 2026년 8월 3일
        </p>
      </div>
    </>
  );
}
