import SEO from '@/components/SEO';

const h2Style = { fontSize: '1.3rem', fontWeight: '700', marginTop: '2rem', marginBottom: '0.75rem' };
const pStyle = { marginBottom: '1rem' };
const linkStyle = { color: 'var(--accent-light)', textDecoration: 'underline', textUnderlineOffset: '3px' };

export default function Terms() {
  return (
    <>
      <SEO
        title="이용약관 및 면책 | 여전히, 나는 사람이다."
        description="'여전히, 나는 사람이다.' 블로그의 이용약관과 면책 고지입니다. 콘텐츠의 성격, 전문 조언이 아님, 저작권과 인용 범위, 쿠팡 파트너스·애드센스 대가성 고지, 외부 링크 책임, 정정 정책과 약관 변경 절차를 담았습니다."
        url="https://seodaeya.github.io/terms/"
      />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', color: 'var(--text-primary)', lineHeight: '1.75' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-glass)', paddingBottom: '0.5rem' }}>이용약관 및 면책</h1>

        <p style={pStyle}>
          본 문서는 '여전히, 나는 사람이다.'(https://seodaeya.github.io, 이하 '본 블로그')의 이용 조건과
          콘텐츠 이용 범위, 책임의 한계를 안내합니다. 본 블로그를 이용하면 아래 내용에 동의한 것으로 봅니다.
        </p>

        <h2 style={h2Style}>1. 콘텐츠의 성격</h2>
        <p style={pStyle}>
          본 블로그의 모든 글과 영상은 운영자 개인의 경험과 학습 기록입니다. 작성 시점의 정보를 기준으로 하며,
          이후 환경 변화로 내용이 달라질 수 있습니다. 각 글의 작성일과 수정일을 함께 표시합니다.
        </p>

        <h2 style={h2Style}>2. 전문 조언이 아닙니다</h2>
        <p style={pStyle}>
          본 블로그에는 개발, 하드웨어 수리, 가계 관리, 건강·육아 등 다양한 주제의 글이 포함됩니다.
          이는 <strong>정보 제공 목적의 기록</strong>이며, 법률·의료·투자·세무 등 전문적인 판단을 대체하지 않습니다.
          기기의 분해·수리, 금융 상품 선택 등 결과가 중요한 결정은 반드시 해당 분야 전문가와 상담하시기 바랍니다.
          본 블로그의 정보를 적용해 발생한 손해에 대해 운영자는 책임을 지지 않습니다.
        </p>

        <h2 style={h2Style}>3. 저작권과 인용</h2>
        <p style={pStyle}>
          본 블로그의 글, 사진, 도표, 코드는 별도 표기가 없는 한 운영자가 직접 작성·촬영한 것입니다.
          출처와 원문 링크를 명시한 인용은 허용됩니다. 전문 재게시, 번역 게시, 상업적 이용은
          <a href="/contact/" style={linkStyle}> 이메일</a>로 사전 문의해 주세요.
        </p>

        <h2 style={h2Style}>4. 제휴 및 광고 (대가성 고지)</h2>
        <p style={pStyle}>
          본 블로그는 Google AdSense를 통해 광고를 게재하며, 쿠팡 파트너스 등 제휴 프로그램에 참여할 수 있습니다.
          제휴 링크를 통해 구매가 이루어지면 운영자에게 일정액의 수수료가 지급될 수 있으며,
          이는 <strong>독자의 추가 비용 없이</strong> 지급됩니다.
        </p>
        <p style={pStyle}>
          제휴 여부는 글에서 고지하며, 광고·제휴는 글의 결론과 평가에 영향을 주지 않습니다.
          제품 리뷰에서 단점이 있다고 판단되면 그대로 서술합니다.
        </p>

        <h2 style={h2Style}>5. 외부 링크</h2>
        <p style={pStyle}>
          본 블로그는 공식 문서, 오픈소스 저장소, 영상 등 외부 사이트를 링크합니다.
          외부 사이트의 내용과 정책은 운영자의 통제 범위 밖이며, 해당 사이트의 이용약관이 적용됩니다.
        </p>

        <h2 style={h2Style}>6. 정정 정책</h2>
        <p style={pStyle}>
          오류를 발견하시면 <a href="/contact/" style={linkStyle}>연락처</a>로 알려주세요. 사실관계 오류가 확인되면
          본문을 수정하고 글 하단의 수정일을 갱신합니다. 단순한 의견 차이는 정정 대상이 아닙니다.
        </p>

        <h2 style={h2Style}>7. 약관의 변경</h2>
        <p style={pStyle}>
          본 약관은 필요에 따라 개정될 수 있으며, 개정 시 이 페이지에 반영합니다.
          중요한 변경이 있는 경우 글 목록 상단에 공지합니다.
        </p>

        <p style={{ ...pStyle, marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-secondary, #94a3b8)' }}>
          최종 개정일: 2026년 10월 29일 · 문의: <a href="mailto:seodaeya@gmail.com" style={linkStyle}>seodaeya@gmail.com</a>
        </p>
      </div>
    </>
  );
}
