import SEO from '@/components/SEO';

const h2Style = { fontSize: '1.3rem', fontWeight: '700', marginTop: '2rem', marginBottom: '0.75rem' };
const pStyle = { marginBottom: '1rem' };
const linkStyle = { color: 'var(--accent-light)', textDecoration: 'underline', textUnderlineOffset: '3px' };

export default function Editorial() {
  return (
    <>
      <SEO
        title="편집 원칙 | 여전히, 나는 사람이다."
        description="'여전히, 나는 사람이다.' 블로그의 편집 원칙을 공개합니다. 무엇을 쓰고 어떻게 검증하는지, AI 도구의 사용 범위, 1차 자료와 출처 표기, 사실 오류 정정 절차, 그리고 광고·제휴와 콘텐츠 독립성 원칙까지 담았습니다."
        url="https://seodaeya.github.io/editorial/"
      />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', color: 'var(--text-primary)', lineHeight: '1.75' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-glass)', paddingBottom: '0.5rem' }}>편집 원칙</h1>

        <p style={pStyle}>
          이 블로그는 "직접 해보고, 숫자로 확인하고, 한계까지 적는다"는 원칙으로 운영됩니다.
          어떤 글이 어떻게 만들어지는지 독자가 판단할 수 있도록 작성 과정을 공개합니다.
        </p>

        <h2 style={h2Style}>1. 무엇을 쓰는가</h2>
        <p style={pStyle}>
          직접 설치·분해·측정·실패한 경험을 우선합니다. 보도자료나 남의 요약을 옮기는 글은 쓰지 않습니다.
          제품 리뷰는 최소 며칠 이상 실제로 사용한 뒤 작성하며, 사용 기간과 조건을 본문에 밝힙니다.
        </p>

        <h2 style={h2Style}>2. 어떻게 검증하는가</h2>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
          <li style={{ marginBottom: '0.5rem' }}>
            <strong>수치는 직접 측정합니다.</strong> 성능·속도·용량 같은 주장은 Lighthouse, PageSpeed Insights,
            브라우저 계측 등 재현 가능한 도구의 결과를 근거로 쓰고, 측정 조건(기기·네트워크·CPU 감속)을 함께 적습니다.
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <strong>1차 자료를 우선합니다.</strong> 공식 문서, 표준 명세, 릴리스 노트, 원 논문을 먼저 확인하고,
            블로그·커뮤니티 글은 보조 자료로만 사용합니다.
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <strong>확인하지 못한 것은 확인하지 못했다고 씁니다.</strong> 추정과 사실을 구분하고,
            추정인 경우 "추정"이라고 표시합니다.
          </li>
        </ul>

        <h2 style={h2Style}>3. AI 도구의 사용 범위</h2>
        <p style={pStyle}>
          자료 정리, 초안 구조화, 코드 오타 확인에는 AI 도구를 사용할 수 있습니다.
          그러나 <strong>측정값, 제품 사용 경험, 결론과 평가는 운영자가 직접 확인한 내용</strong>이며,
          AI가 만들어낸 사실이나 출처를 그대로 게재하지 않습니다.
          글의 최종 책임은 운영자에게 있습니다.
        </p>

        <h2 style={h2Style}>4. 출처와 링크</h2>
        <p style={pStyle}>
          글의 근거가 되는 공식 문서와 자료는 본문 또는 글 하단의 '참고 자료'에 링크합니다.
          링크가 깨졌거나 내용이 바뀐 경우 <a href="/contact/" style={linkStyle}>연락처</a>로 알려주시면 갱신합니다.
        </p>

        <h2 style={h2Style}>5. 정정과 업데이트</h2>
        <p style={pStyle}>
          사실관계 오류가 확인되면 본문을 수정하고, 글의 수정일을 갱신합니다.
          단순한 표현 변경이 아니라 <strong>내용이 달라진 경우</strong>에는 수정 사실을 본문에 남깁니다.
          오래된 글은 현재 환경과 다를 수 있으므로 작성일과 수정일을 함께 확인해 주세요.
        </p>

        <h2 style={h2Style}>6. 광고와 콘텐츠의 독립성</h2>
        <p style={pStyle}>
          광고(Google AdSense)와 제휴 링크는 운영 수익의 일부이지만, <strong>주제 선정과 평가에는 관여하지 않습니다.</strong>
          광고주가 특정 결론을 요구하는 경우 해당 제안을 받지 않습니다.
          대가를 받고 작성한 글은 글 상단에 명시합니다.
          자세한 내용은 <a href="/terms/" style={linkStyle}>이용약관 및 면책</a>을 참고해 주세요.
        </p>

        <h2 style={h2Style}>7. 운영자</h2>
        <p style={pStyle}>
          <strong>NaRD</strong> — 세 아이의 아빠이자 개발자·메이커.
          소개와 연락 방법은 <a href="/about/" style={linkStyle}>블로그 소개</a>,
          <a href="/contact/" style={linkStyle}>연락처</a>에서 확인하실 수 있습니다.
        </p>

        <p style={{ ...pStyle, marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-secondary, #94a3b8)' }}>
          시행일: 2026년 10월 29일
        </p>
      </div>
    </>
  );
}
