import SEO from '@/components/SEO';
import Link from 'next/link';

export default function Custom404() {
  return (
    <>
      <SEO 
        title="404 - 페이지를 찾을 수 없습니다"
        description="요청하신 페이지를 찾을 수 없거나 삭제되었습니다. 올바른 주소인지 확인해 주시기 바랍니다."
        url="https://seodaeya.github.io/404"
      />
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '40px 20px',
      }}>
        <div className="glass-card" style={{
          maxWidth: '500px',
          width: '100%',
          padding: '40px 30px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}>
          <h1 style={{
            fontSize: '5rem',
            margin: '0',
            fontWeight: '900',
            background: 'var(--accent-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: '1',
          }}>
            404
          </h1>
          <h2 style={{
            fontSize: '1.5rem',
            margin: '0',
            color: 'var(--text-primary)',
          }}>
            페이지를 찾을 수 없습니다
          </h2>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.95rem',
            lineHeight: '1.6',
            margin: '0 0 10px 0',
          }}>
            찾으려는 페이지의 주소가 잘못 입력되었거나,<br />
            변경 혹은 삭제되어 존재하지 않습니다.
          </p>
          <Link 
            href="/" 
            style={{
              display: 'inline-block',
              padding: '12px 30px',
              borderRadius: '30px',
              background: 'var(--accent-gradient)',
              color: '#ffffff',
              fontWeight: '600',
              fontSize: '0.95rem',
              boxShadow: '0 4px 15px rgba(138, 43, 226, 0.25)',
              transition: 'all 0.3s ease',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(138, 43, 226, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(138, 43, 226, 0.25)';
            }}
          >
            홈으로 이동하기
          </Link>
        </div>
      </div>
    </>
  );
}
