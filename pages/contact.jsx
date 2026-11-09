import SEO from '@/components/SEO';

const h2Style = { fontSize: '1.3rem', fontWeight: '700', marginTop: '2rem', marginBottom: '0.75rem' };
const pStyle = { marginBottom: '1rem' };
const linkStyle = { color: 'var(--accent-light)', textDecoration: 'underline', textUnderlineOffset: '3px' };

export default function Contact() {
  return (
    <>
      <SEO
        title="연락처 및 문의 | 여전히, 나는 사람이다."
        description="'여전히, 나는 사람이다.' 블로그 운영자 NaRD에게 연락하는 방법을 정리했습니다. 콘텐츠 오류 정정, 인용·재게시 허락, 제휴·광고, 개인정보 문의 유형별 절차와 답변 소요 시간, GitHub·YouTube 채널을 안내합니다."
        url="/contact/"
      />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', color: 'var(--text-primary)', lineHeight: '1.75' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-glass)', paddingBottom: '0.5rem' }}>연락처 및 문의</h1>

        <p style={pStyle}>
          이 블로그는 한 사람이 직접 쓰고 운영합니다. 글의 내용, 오류 정정, 인용 허락, 협업 제안 등
          어떤 이야기든 아래 채널로 보내주시면 확인하고 답변드립니다.
        </p>

        <h2 style={h2Style}>1. 이메일 (가장 빠른 방법)</h2>
        <p style={pStyle}>
          <strong>seodaeya@gmail.com</strong>
        </p>
        <p style={pStyle}>
          제목 앞에 용도를 적어주시면 분류가 빨라집니다. 예: <code>[정정]</code>, <code>[인용]</code>,
          <code>[협업]</code>, <code>[개인정보]</code>.
        </p>

        <h2 style={h2Style}>2. 문의 유형별 안내</h2>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
          <li style={{ marginBottom: '0.5rem' }}>
            <strong>콘텐츠 오류 정정</strong> — 사실관계 오류, 오래된 정보, 깨진 링크를 알려주시면
            확인 후 본문을 수정하고 글 하단에 수정 일자를 남깁니다.
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <strong>인용 및 재게시</strong> — 출처와 원문 링크를 명시하는 경우 인용은 자유롭게 가능합니다.
            전문 재게시나 번역 게시는 사전에 이메일로 문의해 주세요.
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <strong>제휴·광고 문의</strong> — 제휴 여부와 무관하게 글의 결론은 바꾸지 않습니다.
            대가성 협찬은 해당 글에 명시합니다.
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <strong>개인정보 관련 요청</strong> — 쿠키·분석 도구와 관련한 문의는
            <a href="/privacy/" style={linkStyle}> 개인정보처리방침</a>을 먼저 확인해 주세요.
          </li>
        </ul>

        <h2 style={h2Style}>3. 답변 시간</h2>
        <p style={pStyle}>
          영업일 기준 <strong>2~3일 이내</strong>에 회신드립니다. 모든 메일에 답변드리지 못할 수 있으나,
          정정 요청과 개인정보 관련 문의는 우선적으로 확인합니다.
        </p>

        <h2 style={h2Style}>4. 다른 채널</h2>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
          <li style={{ marginBottom: '0.5rem' }}>
            GitHub — <a href="https://github.com/seodaeya" target="_blank" rel="noopener noreferrer" style={linkStyle}>github.com/seodaeya</a>
            {' '}(블로그 소스와 이슈)
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            YouTube — <a href="https://www.youtube.com/@Na.R.D." target="_blank" rel="noopener noreferrer" style={linkStyle}>@Na.R.D.</a>
            {' '}(영상으로 남긴 기록)
          </li>
        </ul>

        <h2 style={h2Style}>5. 운영자</h2>
        <p style={pStyle}>
          <strong>NaRD</strong> — 세 아이의 아빠이자 개발자·메이커. 기술과 일상을 직접 부딪히며 기록합니다.
          자세한 소개는 <a href="/about/" style={linkStyle}>블로그 소개</a>에서 확인하실 수 있습니다.
        </p>
      </div>
    </>
  );
}
