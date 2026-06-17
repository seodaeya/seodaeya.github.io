import '@/styles/globals.css';
import Layout from '@/components/Layout';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  // 로컬 스토리지와 OS 설정을 확인하여 첫 로드 시 화면 깜빡임을 방지하는 블로킹 스크립트
  const themeInitScript = `
    (function() {
      try {
        var theme = localStorage.getItem('theme');
        var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // 라이트 모드로 설정되었거나, 설정이 없고 OS 기본이 다크가 아닐 경우 light 클래스 추가
        if (theme === 'light' || (!theme && !prefersDark)) {
          document.documentElement.classList.add('light');
        } else {
          document.documentElement.classList.remove('light');
        }
      } catch (e) {}
    })();
  `;

  return (
    <>
      <Head>
        {/* Google AdSense Integration */}
        <script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9646087317436086"
          crossOrigin="anonymous"
        />
        {/* 테마 감지 인라인 스크립트 (FOUC 방지) */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </Head>
      <Layout>
        {/* 페이지 진입 시 부드러운 페이드인 애니메이션 적용 */}
        <div className="page-reveal" key={Component.name}>
          <Component {...pageProps} />
        </div>
      </Layout>
    </>
  );
}
