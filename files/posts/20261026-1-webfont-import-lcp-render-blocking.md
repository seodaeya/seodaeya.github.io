---
category: "Dev & Software"
title: "PageSpeed 57점, LCP를 막던 웹폰트 @import"
date: "2026-10-26"
image: "/images/webfont_import_lcp_thumbnail.jpg"
tags: ["Performance", "CoreWebVitals", "LCP", "FCP", "RenderBlocking", "WebFont", "NextJS"]
excerpt: "PageSpeed Insights 모바일 57점, FCP 6.0초·LCP 9.4초를 기록한 블로그에서 CSS @import가 만든 직렬 폰트 로딩 체인과 매 페이지 내려받던 번역 위젯 110KB를 찾아 제거한 과정을 실측 타임라인으로 정리합니다."
---

## 📉 1. 점수보다 먼저 본 것

PageSpeed Insights에서 이 블로그의 모바일 성능은 <strong>57점</strong>이었습니다. 점수 하나만 보면 막막하지만, 세부 지표를 나눠 보면 이야기가 달라집니다.

<div style="margin: 28px 0; text-align: center;">
  <img 
    src="/images/pagespeed_57_mobile_report.png" 
    alt="PageSpeed Insights 모바일 성능 57점 진단 결과" 
    style="max-width: 680px; width: 100%; height: auto; border-radius: 12px; border: 1px solid var(--border-glass); box-shadow: 0 8px 30px rgba(0,0,0,0.35);" 
    loading="lazy"
  />
  <p style="margin-top: 10px; font-size: 0.84rem; color: var(--text-secondary);">▲ PageSpeed Insights 모바일 진단 결과: 성능 57점, FCP 6.0초, LCP 9.4초</p>
</div>

| 지표 | 측정값 | 판정 |
|---|---|---|
| First Contentful Paint (FCP) | 6.0초 | 나쁨 |
| Largest Contentful Paint (LCP) | 9.4초 | 나쁨 |
| Total Blocking Time (TBT) | 160밀리초 | 양호 |
| Cumulative Layout Shift (CLS) | 0 | 양호 |
| Speed Index | 6.6초 | 나쁨 |

여기서 <strong>TBT가 160밀리초, CLS가 0</strong>이라는 점이 결정적입니다. TBT는 자바스크립트가 메인 스레드를 얼마나 붙잡았는지를, CLS는 레이아웃이 얼마나 흔들렸는지를 나타냅니다. 둘 다 정상이라는 건 <strong>"자바스크립트 실행 문제도, 레이아웃 문제도 아니다"</strong>라는 뜻입니다.

남은 후보는 하나입니다. <strong>화면을 그릴 준비가 늦어지는 문제</strong>입니다.

## 🔍 2. "렌더링 차단"과 "요소 렌더링 지연"은 다르다

Lighthouse 리포트에서 가장 먼저 눈에 들어온 두 항목은 서로 다른 이야기를 하고 있었습니다.

먼저 <strong>렌더링 차단 요청</strong>은 "예상 절감 시간 900밀리초"로 표시됐습니다. 내역은 이랬습니다.

```
...css/e6b36ca726ab109c.css      7.0 KiB   380ms
...css/3e04ec8e6b7de332.css      4.9 KiB   570ms
...css2?family=... (Google Fonts) 1.6 KiB   750ms
```

여기서 이상한 점이 하나 보입니다. <strong>1.6KB짜리 구글 폰트 CSS가 570ms짜리 4.9KB 파일보다 더 오래 걸린 750ms</strong>로 잡혀 있습니다. 용량이 문제라면 설명이 안 되는 숫자입니다.

두 번째는 <strong>LCP 분석</strong>입니다. LCP 요소는 이미지가 아니라 <strong>홈 화면의 제목 텍스트(`h1`)</strong>였고, 하위 파트는 이렇게 쪼개져 있었습니다.

```
첫 바이트까지의 시간      10ms
요소 렌더링 지연       2,300ms
```

텍스트 하나를 그리는 데 리소스를 기다린 게 아니라, <strong>2,300밀리초 동안 "그릴 수 없는 상태"로 대기</strong>했다는 뜻입니다. 이 두 단서를 합치면 원인이 좁혀집니다. 폰트 CSS의 로드 순서와 렌더 차단이 LCP를 2.3초 밀어내고 있다는 결론입니다.

## 🧱 3. CSS @import가 만든 직렬 체인

원인은 `styles/globals.css` 첫 줄에 있었습니다.

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800;900&display=swap');
```

`@import`는 편리하지만, 브라우저 입장에서는 <strong>가장 늦게 발견되는 요청</strong>입니다. 외부 CSS를 만나면 파싱을 멈추고 그 파일을 다 받은 뒤에야 안쪽을 읽기 때문에, 체인이 이렇게 이어집니다.

```text
HTML
 └─ /_next/static/css/*.css   (메인 CSS 다운로드 + 파싱)
     └─ @import → fonts.googleapis.com/css2   ← 여기서야 발견
         └─ fonts.gstatic.com/*.woff2         ← 그 다음에야 시작
```

즉 <strong>폰트 CSS는 메인 CSS가 끝나기 전까지 요청조차 시작되지 않습니다.</strong> 실제 타임라인을 재보니 정확히 그랬습니다.

측정 결과 폰트 CSS 요청은 <strong>1,533밀리초</strong>에야 시작됐습니다. 메인 CSS 두 장이 끝난 시점과 정확히 일치합니다. 1.6KB가 750ms 걸린 이유도 여기 있습니다. <strong>파일이 무거워서가 아니라, 줄을 서서 기다렸기 때문</strong>입니다.

## 🛠 4. @import를 링크로 꺼내기

해결은 단순합니다. 폰트 CSS를 CSS 파일 <strong>안</strong>이 아니라 HTML <strong>문서</strong>에서 선언하면 됩니다. Next.js의 Pages Router라면 `pages/_document.js`가 그 자리입니다.

```jsx
<Head>
  <meta name="referrer" content="strict-origin-when-cross-origin" />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800;900&display=swap"
  />
</Head>
```

그리고 `globals.css`에서는 `@import` 한 줄을 지웁니다.

```css
/* 삭제: @import url('https://fonts.googleapis.com/css2?...'); */
```

`<link>`는 HTML 파서가 문서를 읽는 즉시 발견하므로, 메인 CSS·JS와 <strong>동시에</strong> 요청이 나갑니다. 여기에 preconnect 두 줄을 더하면 효과가 커집니다.

- `fonts.googleapis.com` — 폰트 CSS를 받는 호스트
- `fonts.gstatic.com` — 실제 `.woff2` 파일을 받는 호스트 (`crossOrigin` 필요)

폰트 파일은 CSS를 받아야 URL을 알 수 있으므로, 미리 연결(DNS + TLS)만 맺어두는 것입니다. 폰트 종류와 굵기는 그대로 두었기 때문에 <strong>화면에 보이는 모습은 전혀 달라지지 않습니다.</strong>

## 📦 5. 두 번째 범인: 아무도 안 쓰는데 매 페이지 110KB

폰트를 고치고 나니 서드파티 내역이 눈에 걸렸습니다. PageSpeed의 서드 파티 표에는 <strong>Google APIs 113KB</strong>가 찍혀 있었고, 그 안의 대부분이 `translate.googleapis.com`이었습니다.

원인은 헤더의 언어 전환 버튼이었습니다. 컴포넌트가 마운트되면 <strong>사용자가 번역을 쓰든 말든</strong> 구글 번역 위젯 스크립트를 내려받고 있었습니다.

```jsx
// 기존: 마운트 즉시 로드
useEffect(() => {
  const script = document.createElement('script');
  script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  script.async = true;
  document.body.appendChild(script);
}, []);
```

바꾼 방식은 <strong>사용자의 의사가 확인될 때 로드</strong>입니다. 다만 여기에 함정이 하나 있습니다. 이미 언어를 선택해 둔 사용자는 <strong>쿠키(`googtrans`)에 흔적이 남아 있고, 이 위젯이 로드되어야 자동 번역이 적용</strong>됩니다. 무조건 지연 로딩으로 바꾸면 그 사용자들에게는 "번역이 갑자기 안 되는" 회귀 버그가 됩니다.

그래서 조건을 나눴습니다.

```jsx
const loadTranslate = useCallback(() => {
  if (window.google && window.google.translate) return;      // 이미 준비됨
  if (document.getElementById('google-translate-script')) return; // 로딩 중

  const script = document.createElement('script');
  script.id = 'google-translate-script';
  script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  script.async = true;
  script.onerror = () => script.remove();   // 실패하면 다음 시도에서 재주입
  document.body.appendChild(script);
}, []);

useEffect(() => {
  // 언어를 이미 고른 사용자만 즉시 로드 (자동 번역 유지)
  const match = document.cookie.match(/googtrans=\/ko\/([a-zA-Z\-]+)/);
  if (match && match[1]) loadTranslate();
}, [loadTranslate]);

// 드롭다운을 처음 열 때 로드
const toggleOpen = () => {
  if (!isOpen) loadTranslate();
  setIsOpen(!isOpen);
};
```

검증은 이렇게 했습니다.

- <strong>쿠키 없음</strong>: 초기 로드 시 translate 요청 <strong>0건</strong>, 드롭다운을 열면 3건이 로드되고 첫 요청까지 53ms
- <strong>쿠키 있음</strong>(`googtrans=/ko/en`): 즉시 로드되어 `<html class="translated-ltr">`가 붙고 자동 번역이 정상 동작

## 📊 6. 측정 결과

개선 폭은 Puppeteer로 직접 재현해 측정했습니다. 조건은 모바일 뷰포트(412 × 823), <strong>CPU 4배 감속 + 1.6Mbps + 150ms RTT</strong>, 캐시 비활성화, 5회 실행의 중앙값입니다.

| 항목 | 수정 전 | 수정 후 |
|---|---|---|
| FCP | 1,964ms | 1,588ms |
| LCP | 1,964ms | 1,588ms |
| 폰트 CSS 요청 시작 시각 | 1,533ms | 197ms |
| 초기 로드 시 translate 요청 | 마운트 즉시 로드 (약 110KB) | 0건 (드롭다운을 열 때 3건) |
| CLS | 0.0032 | 0.0032 |

여기서 한 가지는 짚고 넘어가야 합니다. 위 표는 <strong>로컬 서버 측정</strong>이라 CDN 지연이 없어 절대값이 작습니다. 실제 4G 환경에서는 DNS·TLS 왕복이 더해지므로 <strong>직렬 체인 하나를 없앤 효과가 훨씬 크게</strong> 나타납니다. PageSpeed가 지목한 "렌더링 차단 900ms"와 "요소 렌더링 지연 2,300ms"가 바로 그 체인 위에 있었기 때문입니다.

중요한 건 CLS가 그대로라는 점입니다. 폰트를 여전히 렌더 차단 리소스로 두고 <strong>순서만 병렬로 바꿨기</strong> 때문에, 웹폰트가 늦게 도착해 글자가 바뀌는 현상(FOUT)은 생기지 않습니다.

## 🚫 7. 일부러 손대지 않은 것들

Lighthouse가 지적한 항목 중에는 <strong>고치지 않는 게 맞다고 판단한 것</strong>도 있습니다.

- <strong>효율적인 캐시 수명(10분)</strong>: GitHub Pages는 `Cache-Control` 헤더를 사용자가 바꿀 수 없습니다. 다만 Next.js 산출물은 파일명에 해시가 붙어 있어, 캐시가 길지 않아도 오래된 파일을 잘못 쓰는 문제는 없습니다.
- <strong>레거시 JavaScript 13KB</strong>: Next.js가 넣는 폴리필입니다. 줄이려면 브라우저 지원 범위를 좁혀야 하는데, 13KB를 아끼려고 구형 브라우저 방문자를 버리는 건 남는 장사가 아닙니다.
- <strong>AdSense·GTM</strong>: 이미 `async`로 로드되고 있고, 각각 수익과 분석에 직결됩니다. 손대지 않았습니다.

## ✅ 8. 정리: 오늘 바로 적용할 수 있는 체크리스트

1. <strong>CSS 안에서 `@import`로 웹폰트를 불러오지 않는다.</strong> HTML에서 `<link>`로 선언한다.
2. <strong>preconnect는 실제 파일 호스트까지</strong> 건다. 폰트 CSS는 `googleapis.com`, 폰트 파일은 `gstatic.com`이다.
3. <strong>"렌더링 차단"과 "요소 렌더링 지연"을 구분해서 읽는다.</strong> 후자가 크면 리소스 용량이 아니라 순서를 의심해야 한다.
4. <strong>사용자의 선택에 따라 동작하는 위젯은 그 선택이 확인될 때 로드한다.</strong> 단, 기존 사용자의 설정(쿠키 등)은 반드시 함께 살펴야 회귀를 막을 수 있다.
5. 서드파티는 <strong>용량보다 시점</strong>이 문제다. 110KB는 늦게 받으면 괜찮고, 먼저 받으면 첫 화면을 막는다.

성능 최적화는 "무엇을 줄일까"보다 <strong>"무엇이 무엇을 기다리고 있는가"</strong>를 찾는 일에 가깝습니다. 이번에는 1.6KB짜리 CSS 한 장이 9.4초짜리 LCP의 마지막 줄에 서 있었습니다.

## 참고 자료

- [Largest Contentful Paint (LCP)](https://web.dev/articles/lcp) — web.dev
- [Optimize Largest Contentful Paint](https://web.dev/articles/optimize-lcp) — web.dev
- [Eliminate render-blocking resources](https://developer.chrome.com/docs/lighthouse/performance/render-blocking-resources) — Chrome for Developers
- [@import CSS at-rule](https://developer.mozilla.org/en-US/docs/Web/CSS/@import) — MDN
- [Custom Document](https://nextjs.org/docs/pages/building-your-application/routing/custom-document) — Next.js
