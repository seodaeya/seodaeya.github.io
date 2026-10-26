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
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
