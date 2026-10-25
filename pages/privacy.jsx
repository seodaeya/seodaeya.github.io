import SEO from '@/components/SEO';

export default function Privacy() {
  return (
    <>
      <SEO 
        title="개인정보처리방침 | 여전히, 나는 사람이다."
        description="'여전히, 나는 사람이다.' 블로그의 개인정보처리방침, 제3자 서비스(구글 애드센스, MS Clarity) 쿠키 및 구글 캘린더 연동 안내입니다."
        url="https://seodaeya.github.io/privacy/"
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

        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginTop: '2rem', marginBottom: '0.75rem' }}>2. 구글 캘린더 연동(선택 기능)</h2>
        <p style={{ marginBottom: '1rem' }}>
          본 블로그의 가족 일정 관리 서비스(<a href="https://seodaeya.github.io/planner/" style={{ color: '#38bdf8' }}>/planner/</a>)는
          이용자가 원할 때만 구글 계정을 연결해 일정을 구글 캘린더로 보낼 수 있습니다. 이 기능을 사용하지 않으면
          구글 로그인이나 캘린더 API 호출이 전혀 발생하지 않습니다.
        </p>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
          <li><strong>사용하는 권한:</strong> <code>https://www.googleapis.com/auth/calendar.app.created</code> 하나뿐입니다. 이 권한으로 앱이 직접 만든 보조 캘린더(<strong>우리집 AI</strong>)와 그 안의 일정만 만들고 수정할 수 있으며, 이용자의 기존 캘린더나 다른 앱의 일정은 읽을 수 없습니다.</li>
          <li><strong>전송되는 정보:</strong> 이용자가 전송 버튼을 누른 일정의 제목, 날짜·시간, 장소, 메모, 연결된 준비물·할 일 목록입니다. 플래너 데이터 전체를 자동으로 올리지 않습니다.</li>
          <li><strong>저장 위치:</strong> 일정과 준비물은 계속 이용자의 브라우저 <code>localStorage</code>에만 저장됩니다. 구글 연결 정보(캘린더 ID)와 일정별 구글 일정 ID도 브라우저에만 저장됩니다. 운영자의 서버나 데이터베이스는 없습니다.</li>
          <li><strong>접근 토큰:</strong> 구글 OAuth 접근 토큰은 현재 탭의 메모리에만 보관하며 <code>localStorage</code>, 쿠키, 서버에 저장하지 않습니다. 새로고침하거나 토큰이 만료되면 다시 로그인합니다.</li>
          <li><strong>제3자 제공·판매·광고:</strong> 구글 API에서 받은 정보를 판매하거나 광고 목적으로 사용하지 않으며, 서비스 제공에 필요한 범위를 넘겨 제3자에게 제공하지 않습니다. 본 서비스는 Google API Services User Data Policy의 Limited Use 요구사항을 준수합니다.</li>
          <li><strong>보관·삭제:</strong> 구글 캘린더에 보낸 일정은 이용자가 구글 캘린더에서 직접 삭제할 때까지 유지됩니다. 플래너의 &lsquo;모든 데이터 삭제&rsquo;는 브라우저 데이터만 지우며 구글 캘린더의 일정은 삭제하지 않습니다.</li>
          <li><strong>권한 철회:</strong> <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>Google 계정 → 보안 → 타사 앱 및 서비스</a>에서 본 앱의 접근 권한을 언제든지 철회할 수 있습니다. 앱 전용 캘린더는 구글 캘린더 설정에서 직접 삭제할 수 있습니다.</li>
        </ul>
        <p style={{ marginBottom: '1rem', fontSize: '0.92rem', opacity: 0.85 }}>
          본 서비스의 구글 API 사용은 <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>Google API Services User Data Policy</a>를 따르며, Limited Use 요구사항을 포함합니다.
        </p>

        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginTop: '2rem', marginBottom: '0.75rem' }}>3. 쿠키 설치 및 거부 방법</h2>
        <p style={{ marginBottom: '1rem' }}>
          방문자는 웹브라우저 옵션 설정을 통해 쿠키 허용 수준을 직접 제어하거나 거부할 수 있습니다. (Chrome 기준: 설정 &gt; 개인정보 보호 및 보안 &gt; 서드파티 쿠키 차단 설정)
        </p>

        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginTop: '2rem', marginBottom: '0.75rem' }}>4. 문의처</h2>
        <p style={{ marginBottom: '1rem' }}>
          본 블로그 운영 방식이나 개인정보 관련 문의사항은 아래 GitHub 저장소를 통해 문의하실 수 있습니다.
        </p>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
          <li>이메일: <a href="mailto:seodaeya@gmail.com" style={{ color: '#38bdf8' }}>seodaeya@gmail.com</a></li>
          <li>GitHub: <a href="https://github.com/seodaeya" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>https://github.com/seodaeya</a></li>
        </ul>

        <p style={{ marginTop: '2.5rem', fontSize: '0.9rem', opacity: 0.7 }}>
          공고 일자: 2026년 8월 3일 | 최종 개정일: 2026년 10월 25일 | 시행 일자: 2026년 10월 25일
        </p>
      </div>
    </>
  );
}
