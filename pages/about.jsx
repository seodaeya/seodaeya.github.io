import SEO from '@/components/SEO';
import Link from 'next/link';

export default function About() {
  return (
    <>
      <SEO 
        title="블로그 소개 | 여전히, 나는 사람이다."
        description="완벽하지 않기에 배우고, 실수하기에 도전합니다. AI 시대 속에서도 사람의 온기와 배움의 여정을 기록하는 블로그 이야기."
        url="https://seodaeya.github.io/about/"
      />
      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '2.5rem 1rem', color: 'var(--text-primary)', lineHeight: '1.85' }}>
        
        {/* Header Title Area */}
        <header style={{ marginBottom: '2.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1.5rem' }}>
          <span className="category-badge" style={{ marginBottom: '12px' }}>BRAND PHILOSOPHY</span>
          <h1 style={{ 
            fontSize: '2.4rem', 
            fontWeight: '900', 
            margin: '8px 0 16px 0',
            letterSpacing: '-0.02em',
            background: 'var(--accent-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            여전히, 나는 사람이다.
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', margin: 0, fontWeight: '500' }}>
            완벽한 알고리즘의 세상 속에서, 서툴지만 뜨겁게 살아가는 인간의 기록
          </p>
        </header>

        {/* Emotionally Resonant Opening Statement Box */}
        <blockquote style={{
          background: 'var(--bg-secondary)',
          borderLeft: '4px solid var(--accent-light)',
          borderTop: '1px solid var(--border-glass)',
          borderRight: '1px solid var(--border-glass)',
          borderBottom: '1px solid var(--border-glass)',
          borderRadius: '0 16px 16px 0',
          padding: '24px 28px',
          margin: '0 0 2.5rem 0',
          fontSize: '1.05rem',
          fontStyle: 'normal',
          color: 'var(--text-primary)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)'
        }}>
          <p style={{ margin: '0 0 12px 0', fontWeight: '700', fontSize: '1.15rem', color: 'var(--accent-light)' }}>
            "사람이기에 완벽하지 않습니다. 하지만 그렇기에 우리는 배웁니다."
          </p>
          <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.75' }}>
            기계가 단 1초 만에 오류 없는 정답을 쏟아내는 시대입니다.<br />
            하지만 무엇을 질문할지 고민하고, 실수를 통해 넘어지며, 다시 털고 일어나는 가슴 벅찬 성장은<br />
            <strong>오직 살아 숨 쉬는 '사람'만이 누릴 수 있는 특권</strong>입니다.
          </p>
        </blockquote>

        {/* Section 1: Brand Meaning */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.45rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🌱</span> 왜 '여전히, 나는 사람이다.'인가요?
          </h2>
          <p style={{ marginBottom: '1rem' }}>
            이 블로그의 글과 코드는 인공지능(AI)이라는 강력한 도구를 적극적으로 활용하여 짓고 다듬어집니다. 
            그러나 AI를 움직이게 만드는 최초의 호기심, 시행착오를 겪으며 느끼는 당혹감, 그리고 마침내 문제를 해결했을 때 찾아오는 순수한 기쁨은 모두 <strong>한 인간의 심장에서 시작</strong>됩니다.
          </p>
          <p style={{ marginBottom: '1rem' }}>
            <strong>'여전히, 나는 사람이다.'</strong>라는 이름은 기술의 파도에 휩쓸려 나를 잃어버리는 것이 아니라, 
            인공지능을 가장 든든한 파트너로 삼아 <strong>인간 본연의 따뜻함과 주체적인 사유를 지켜나가겠다는 진솔한 다짐</strong>입니다.
          </p>
        </section>

        {/* Section 2: Together & Resilience */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.45rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🤝</span> '함께함'이 가진 세 가지 다중적 의미
          </h2>
          <p style={{ marginBottom: '1.2rem' }}>
            이 공간에서 이야기하는 '함께'라는 단어는 입체적이고 다정한 세 가지 연결을 의미합니다:
          </p>

          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginBottom: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '20px', borderRadius: '14px' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>👥</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', margin: '0 0 8px 0', color: 'var(--accent-light)' }}>독자 여러분과 함께</h3>
              <p style={{ fontSize: '0.9rem', margin: 0, color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                같은 고민을 하고 같은 질문을 품은 분들에게 작은 디딤돌이 되어주고, 지식을 나누며 함께 성장합니다.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '20px', borderRadius: '14px' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🤖</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', margin: '0 0 8px 0', color: 'var(--accent-light)' }}>AI 파트너와 함께</h3>
              <p style={{ fontSize: '0.9rem', margin: 0, color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                인공지능을 차가운 경쟁자가 아닌, 나의 한계를 넓혀주고 함께 탐구하는 든든한 페어 러닝 메이트로 대합니다.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '20px', borderRadius: '14px' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🦎</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', margin: '0 0 8px 0', color: 'var(--accent-light)' }}>소중한 일상과 함께</h3>
              <p style={{ fontSize: '0.9rem', margin: 0, color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                차량과 가전을 직접 고치고, 반려 도마뱀 '봄이'를 돌보며 손끝으로 만지는 지극히 현실적인 온기를 품습니다.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: The Promise */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.45rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🚀</span> 꾸준히 공유하고, 기록하며, 앞으로 나아갑니다
          </h2>
          <p style={{ marginBottom: '1rem' }}>
            저는 완성된 결과물만 뽐내는 완벽주의자가 아닙니다. 실패하고 헤맨 과정, 어설프게 시작했던 첫걸음, 그리고 조금씩 나아지는 모든 순간을 가감 없이 투명하게 아카이빙합니다.
          </p>
          <p style={{ marginBottom: '1rem' }}>
            내가 겪은 시행착오의 기록이 누군가의 소중한 몇 시간을 아껴줄 수 있다면, 그리고 <strong>"나도 할 수 있겠구나"</strong>라는 작은 용기가 될 수 있다면 그것으로 충분합니다.
          </p>
          <p style={{ margin: 0, fontWeight: '600', color: 'var(--accent-light)' }}>
            끊임없이 도전하고, 다정하게 함께하며, 지치지 않고 계속해서 배워 나가겠습니다.
          </p>
        </section>

        {/* Categories Overview */}
        <section style={{ marginBottom: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-glass)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-primary)' }}>
            이곳에서 함께 나눌 이야기들
          </h2>
          <ul style={{ paddingLeft: '1.2rem', margin: 0, color: 'var(--text-secondary)' }}>
            <li style={{ marginBottom: '8px' }}><strong>AI & Intelligence:</strong> 프레임워크 설계, LLM 분석, 1인 대학 구축법, 에이전틱 워크플로</li>
            <li style={{ marginBottom: '8px' }}><strong>Dev & Software:</strong> 정적 웹사이트(Next.js) 구축, SEO 최적화, 개발 에러 트러블슈팅</li>
            <li style={{ marginBottom: '8px' }}><strong>Hardware & DIY:</strong> 싼타페 차량 자가 정비, 정수기 셀프 분해 세척, 기기 수리</li>
            <li style={{ marginBottom: '8px' }}><strong>Lifestyle & Pet Care:</strong> 크레스티드 게코 케어, 홈텐딩 칵테일, 일상의 소소한 발견</li>
          </ul>
        </section>

        {/* Footer Contact / Policy Link */}
        <footer style={{ 
          background: 'var(--bg-secondary)', 
          padding: '20px 24px', 
          borderRadius: '14px', 
          border: '1px solid var(--border-glass)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            방문해 주신 모든 분들의 따뜻한 여정을 응원합니다.
          </span>
          <Link href="/privacy/" style={{ color: 'var(--accent-light)', fontSize: '0.9rem', fontWeight: '600', textDecoration: 'none' }}>
            개인정보처리방침 확인하기 →
          </Link>
        </footer>

      </div>
    </>
  );
}
