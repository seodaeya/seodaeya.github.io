import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        {/* Google AdSense Account Verification Meta (Script is conditionally loaded in SEO.js only on indexable pages) */}
        <meta name="google-adsense-account" content="ca-pub-9646087317436086" />

        {/* Static Hosting Security Meta Directives */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />

        {/*
          웹폰트 로딩.
          <link rel="stylesheet">를 기본값으로 두면 cross-origin 폰트 CSS(fonts.googleapis.com)와
          80KB .woff2 파일(fonts.gstatic.com)이 초기 렌더 차단 경로에 포함되어 모바일 FCP/LCP를 지연시킵니다.
          media="print"로 비차단 로드한 뒤 첫 페인트 직후 media="all"로 전환하여 렌더링 차단을 제거합니다.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          id="google-fonts-css"
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800;900&display=swap"
          media="print"
        />
        <noscript>
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800;900&display=swap"
          />
        </noscript>

      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
