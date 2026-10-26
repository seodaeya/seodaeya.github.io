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
          globals.css의 `@import`는 메인 CSS를 다 받은 뒤에야 폰트 CSS를 발견하는 직렬 체인이 되어
          FCP·LCP를 크게 지연시킵니다(실측: 폰트 CSS 요청이 메인 CSS 종료 시점에야 시작).
          여기서 <link>로 선언하면 HTML 파싱 즉시 메인 CSS·JS와 병렬로 내려받습니다.
          preconnect는 폰트 파일 실제 호스트(fonts.gstatic.com)의 DNS+TLS 핸드셰이크를 미리 끝냅니다.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800;900&display=swap"
        />

      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
