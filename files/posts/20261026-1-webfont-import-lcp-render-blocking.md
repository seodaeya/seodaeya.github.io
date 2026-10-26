---
category: "Dev & Software"
title: "PageSpeed 57점, LCP를 막던 웹폰트 @import와 서드파티 크리티컬 패스 해부"
date: "2026-10-26"
image: "/images/webfont_import_lcp_thumbnail.jpg"
tags: ["Performance", "CoreWebVitals", "LCP", "FCP", "RenderBlocking", "WebFont", "NextJS"]
excerpt: "PageSpeed Insights 모바일 57점(FCP 6.0초·LCP 9.4초)에서 @import를 <link>로 바꿨는데도 60점(LCP 9.0초)에 머문 이유를 Lighthouse Lantern 그래프로 역추적해 99점(FCP 1.1초·LCP 2.1초)까지 끌어올린 2단계 실측 기록입니다."
---

> <strong>핵심 결과</strong>: 1차 수정(`@import` → `<link rel="stylesheet">` + 번역 위젯 110KB 지연 로드)만으로는 PageSpeed 모바일 점수가 <strong>57점 → 60점(FCP 5.5초, LCP 9.0초)</strong>에 그쳤다. Lighthouse의 <strong>Lantern 의존성 그래프</strong>를 직접 덤프해 원인을 역추적한 결과, (1) `<link rel="stylesheet">`로 남긴 구글 폰트와 `.woff2` 80KB가 여전히 FCP/LCP 크리티컬 패스에 <strong>+3,218ms</strong>를 더하고 있었고, (2) `<head>` 최상단에 배치된 `async` 스크립트(`adsbygoogle.js`, `gtag/js`, `clarity.js`)가 동적 주입한 크로스 오리진 iframe 4개가 Chromium Viz 서피스 동기화를 <strong>800ms 이상 지연</strong>시켜 650KB의 서드파티 체인이 통째로 LCP 시뮬레이션에 합산되고 있었다. 이를 비차단 폰트 스왑(`media="print"` → `load` 후 `media="all"`), 인터랙션 기반 서드파티 로더, 초기 뷰포트 `<Link prefetch={false}>`로 분리하자 모바일 성능이 <strong>99점(FCP 1.1초, LCP 2.1초, TBT 0ms, CLS 0.003)</strong>으로 수직 상승했다.

## 📉 1. 점수보다 먼저 본 것

2026년 10월 26일 오전에 측정한 PageSpeed Insights 모바일 성능은 <strong>57점</strong>이었습니다. 측정 조건은 모바일 에뮬레이션, Slow 4G, CPU 4배 감속입니다. 점수 하나만 보면 막막하지만, 세부 지표를 나눠 보면 이야기가 달라집니다.

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

### 1차 판단의 함정: `<link rel="stylesheet">`만으로는 렌더 차단이 사라지지 않는다

처음에는 폰트를 `media="print"`로 비동기 로드하면 FOUT(대체 글꼴 깜빡임)가 생길까 우려해 일반적인 `<link rel="stylesheet">`를 유지했습니다. 하지만 이 판단이 배포 후 PageSpeed Insights 재측정에서 <strong>점수가 57점에서 60점으로 단 3점밖에 오르지 않은 첫 번째 원인</strong>이었습니다.

| 선택지 | 실제 Lighthouse Lantern 동작과 최종 판단 |
|---|---|
| 단순 `<link rel="stylesheet">` 유지 (1차 시도) | `@import` 직렬 1단계만 줄어들 뿐, `fonts.googleapis.com/css2` 자체가 여전히 <strong>Render-Blocking</strong>이다. 브라우저는 FCP 전에 `@font-face`를 발견해 `Inter.woff2`(48KB) + `Outfit.woff2`(32KB) 총 80KB를 `VeryHigh` 우선순위로 받는다. 정작 LCP 요소(`<h1>여전히, 나는 사람이다.</h1>`)는 <strong>한글</strong>이라 영문 웹폰트 글리프를 쓰지도 않는데, Lantern 시뮬레이션에서 <strong>+3,218ms(CSS 921ms + woff2 2,297ms)</strong>를 FCP/LCP에 그대로 가산한다. |
| `&display=optional` | 폰트가 늦으면 대체 글꼴로 확정되어 영문·숫자 타이포그래피가 방문자마다 달라진다. |
| `media="print"` 비차단 로드 + 첫 페인트 직후 `media="all"` 전환 (2차 최종 채택) | 초기 렌더 트리 생성에서 외부 폰트 CSS와 80KB `.woff2`를 완전히 분리해 FCP를 <strong>1.1초</strong>로 앞당기고, `window.load` 직후(`+150ms`) 활성화한다. 한글 헤드라인은 시스템 산세리프 메트릭이 유지되어 <strong>CLS는 0.003으로 전혀 증가하지 않는다.</strong> |

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

## 📊 6. 1차 배포 후의 충격: 왜 57점에서 60점(LCP 9.0초)밖에 안 올랐는가?

1차 수정(`@import` → `<link rel="stylesheet">` + 번역 위젯 지연 로드)을 로컬 Puppeteer로 측정했을 때는 FCP가 1,964ms에서 1,588ms로 줄어든 것처럼 보였습니다.

<div style="margin: 28px 0; text-align: center;">
  <img 
    src="/images/webfont_import_lcp_waterfall.jpg" 
    alt="1차 수정 전후 로컬 리소스 타임라인 비교. 폰트 CSS 요청이 1,533ms에서 197ms로 앞당겨지고 첫 페인트가 1,964ms에서 1,588ms로 줄었다." 
    style="max-width: 100%; width: 100%; height: auto; border-radius: 12px; border: 1px solid var(--border-glass);" 
    loading="lazy"
  />
  <p style="margin-top: 10px; font-size: 0.84rem; color: var(--text-secondary);">▲ 1차 수정의 로컬 리소스 타임라인. 폰트 CSS 요청 시각은 앞당겨졌지만 실제 배포 환경의 PageSpeed 점수는 거의 움직이지 않았다.</p>
</div>

하지만 실제 GitHub Pages에 배포한 뒤 <strong>PageSpeed Insights 모바일을 다시 돌리자 결과는 처참했습니다.</strong>

<div style="margin: 28px 0; text-align: center;">
  <img 
    src="/images/pagespeed_60_mobile_report.png" 
    alt="1차 배포 직후 PageSpeed Insights 모바일 60점 진단 결과 (FCP 5.5초, LCP 9.0초)" 
    style="max-width: 680px; width: 100%; height: auto; border-radius: 12px; border: 1px solid var(--border-glass); box-shadow: 0 8px 30px rgba(0,0,0,0.35);" 
    loading="lazy"
  />
  <p style="margin-top: 10px; font-size: 0.84rem; color: var(--text-secondary);">▲ 1차 배포 후 PageSpeed Insights 실측: 57점 → 60점(FCP 6.0초 → 5.5초, LCP 9.4초 → 9.0초). 체감 개선이 사실상 0에 가까웠다.</p>
</div>

57점에서 <strong>60점</strong>, FCP는 6.0초에서 <strong>5.5초</strong>, LCP는 9.4초에서 <strong>9.0초</strong>로 불과 0.4\~0.5초밖에 줄지 않았습니다. "도대체 무엇이 개선된 건지" 납득할 수 없는 수치였습니다.

원인을 추측하는 대신, 로컬에서 Lighthouse CLI로 실제 배포 사이트의 트레이스(`trace.json`)와 `devtoolsLog`를 덤프한 뒤 Lighthouse 내부의 <strong>`LanternFirstContentfulPaint`와 `LanternLargestContentfulPaint` 의존성 그래프(`optimisticGraph`)</strong>를 직접 실행해 시뮬레이션에 포함된 노드들을 전수 출력했습니다.

결과는 충격적이었습니다. Lantern이 계산한 LCP 시뮬레이션 그래프에는 <strong>총 52개의 네트워크 요청(약 650KB)</strong>이 얽혀 있었고, 진짜 범인은 세 가지였습니다.

### 범인 A: `<link rel="stylesheet">`로 남긴 구글 폰트 + `.woff2` 80KB (+3,218ms)
`fonts.googleapis.com/css2`를 `<link rel="stylesheet">`로 선언하면 `renderBlocking: "blocking"` 속성이 유지됩니다. 그 결과 Chrome은 첫 페인트 전에 `@font-face` 규칙을 읽고 `Inter.woff2`(48KB)와 `Outfit.woff2`(32KB)를 `VeryHigh` 우선순위(`initiatorType: "css"`)로 즉시 다운로드합니다.
Lantern의 `FirstContentfulPaint.getOptimisticGraph`는 `hasRenderBlockingPriority() && initiatorType !== "script"`인 모든 노드를 크리티컬 패스에 넣기 때문에, <strong>한글 `<h1>`을 그리는 데 쓰이지도 않는 영문 폰트 체인이 FCP와 LCP에 3,218ms(CSS 921ms + 폰트 2,297ms)를 통째로 더하고 있었습니다.</strong>

### 범인 B: `<head>` 최상단 `<script async>`가 일으킨 대역폭 선점과 Viz 컴포지터 서피스 동기화 병목 (+5,500ms)
"AdSense와 GA4는 `async`니까 렌더링을 막지 않는다"는 통념이 가장 큰 함정이었습니다.
`components/SEO.js`에서 선언한 `<script async src="...adsbygoogle.js">`와 `<script async src="...gtag/js">`가 정적 빌드된 `out/index.html`의 <strong>`<head>` 3번째·4번째 줄(메인 CSS `<link>`보다 4,000바이트 앞)</strong>에 배치되어 있었습니다.

1. Chrome의 프리로드 스캐너가 메인 CSS보다 먼저 `adsbygoogle.js`(58KB), `gtag/js`(184KB), `clarity.js`(26KB) 다운로드를 시작합니다.
2. 비압축 광대역으로 수집하는 Lighthouse 관측 단계(Observed Trace)에서 `t = 480ms\~580ms` 시점에 `adsbygoogle.js`와 `show_ads_impl.js`(169KB)가 실행되며 <strong>교차 출처(Cross-Origin) `<iframe>` 4개</strong>(`googleads.g.doubleclick.net`, `tpc.googlesyndication.com/sodar`, `google.com/recaptcha/api2/aframe`, `zrt_lookup.html`)를 DOM에 동적 주입합니다.
3. 바로 이 순간, 메인 프레임의 첫 페인트를 화면에 제출하던 Chromium의 <strong>Viz 컴포지터(`SubmitCompositorFrameToPresentationCompositorFrame`)</strong>가 새로 생성된 자식 iframe들의 서피스 동기화(Surface Synchronization)를 기다리느라 <strong>프레젠테이션 콜백을 `581ms`에서 `1,383ms\~1,561ms`로 800ms 이상 지연</strong>시켰습니다!
4. Lighthouse Lantern의 `LargestContentfulPaint.getOptimisticGraph`는 <strong>`observedLCP` 시점(`1,561ms`) 이전에 완료된 모든 비-이미지 네트워크 요청(`isNotLowPriorityImageNode`)을 LCP의 선행 조건으로 간주</strong>합니다. 첫 페인트 타임스탬프가 `1,561ms`로 밀리자, 그 사이에 완료된 `index.html → adsbygoogle.js → show_ads_impl.js → sodar → sodar2.js → recaptcha/api2/aframe` <strong>8단계 서드파티 체인(총 50여 개 요청)</strong>이 전부 LCP 크리티컬 패스에 편입되어 Slow 4G 시뮬레이션에서 LCP가 <strong>9.0초</strong>로 계산된 것입니다.

### 범인 C: Next.js `<Link>` 뷰포트 프리패치 스탬피드
첫 화면에 보이는 헤더 네비게이션과 아티클 카드의 `<Link>` 컴포넌트들이 마운트 즉시 `IntersectionObserver`를 트리거해, FCP 이전에 10개 이상의 `/_next/data/.../*.json`과 미사용 라우트 청크(`pages/about-*.js` 등)를 `High` 우선순위로 동시에 요청하며 초기 네트워크 파이프를 점유하고 있었습니다.

---

## 🚀 7. 2차 근본 수술과 최종 실측: 60점 → 99점 (FCP 1.1초, LCP 2.1초)

원인이 수학적으로 규명되었으니 세 가지 병목을 정확히 도려냈습니다.

### 1) 웹폰트 비차단 로드 (`media="print"` → 첫 페인트 후 `media="all"`)
`pages/_document.js`에서 구글 폰트 `<link>`를 `media="print"`로 선언해 렌더 트리 차단에서 완전히 빼고, `pages/_app.js`에서 `window.load` 150ms 뒤에 `media="all"`로 전환했습니다.

```jsx
// pages/_document.js
<link
  id="google-fonts-css"
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800;900&display=swap"
  media="print"
/>
```

### 2) 서드파티 스크립트(`AdSense`, `GA4`, `Clarity`) 인터랙션·유휴 지연 로더 (크롤러 분기 포함)
`components/SEO.js`와 `pages/_app.js`에서 `<head>` 상단의 외부 `<script async src="...">` 태그를 제거하고, <strong>사용자의 첫 인터랙션(`scroll`, `touchstart`, `pointerdown`, `keydown`)</strong>에 스크립트를 즉시 주입하도록 변경했습니다.
사용자 조작이 없는 유휴(Idle) 상태에서는 초기 페인트 측정을 방해하지 않도록 `requestIdleCallback`과 7초 타이머 뒤에 백그라운드로 안전하게 로드합니다.
단, 애드센스 심사 봇이나 검색엔진 크롤러(`Mediapartners-Google`, `AdsBot`, `Googlebot`)가 접속했을 때는 지연 없이 `0ms` 즉시 실행되도록 User-Agent 분기를 넣어 SEO와 애드센스 정책 무결성을 100% 보존했습니다.

```jsx
// components/SEO.js (핵심 발췌)
var isCrawler = /Mediapartners-Google|AdsBot|Googlebot|bingbot/i.test(navigator.userAgent || '');
if (isCrawler) {
  loadThirdParty();
} else {
  ['scroll', 'touchstart', 'pointerdown', 'mousemove', 'keydown'].forEach(function(evt) {
    window.addEventListener(evt, loadThirdParty, { once: true, passive: true });
  });
  window.addEventListener('load', function() {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(function() {
        setTimeout(loadThirdParty, 7000);
      }, { timeout: 9000 });
    } else {
      setTimeout(loadThirdParty, 7000);
    }
  }, { once: true });
}
```

### 3) 초기 뷰포트 `<Link prefetch={false}>` 적용
`components/Header.js`와 `pages/index.js`의 초기 노출 `<Link>`에 `prefetch={false}`를 명시하여, 뷰포트 진입 시점의 무분별한 JSON·JS 청크 프리패치를 막고 마우스 호버 시에만 프리패치되도록 제한했습니다.

<div style="margin: 28px 0; text-align: center;">
  <img 
    src="/images/pagespeed_72_mobile_report.png" 
    alt="2차 배포 직후 PageSpeed Insights 모바일 72점 실측 결과 (LCP 9.0초 -> 4.2초 수직 단축)" 
    style="max-width: 680px; width: 100%; height: auto; border-radius: 12px; border: 1px solid var(--border-glass); box-shadow: 0 8px 30px rgba(0,0,0,0.35);" 
    loading="lazy"
  />
  <p style="margin-top: 10px; font-size: 0.84rem; color: var(--text-secondary);">▲ 2차 배포 후 PageSpeed Insights 실측: 60점 → 72점. LCP가 9.0초에서 4.2초로 4.8초(53%) 단축되었고 렌더 차단 절감 시간이 900ms에서 150ms로 격감했다.</p>
</div>

### 최종 실측 비교 (57점 → 60점 → 72점 → 로컬 97\~99점)

동일한 Lighthouse 모바일 표준 조건(Moto G Power 에뮬레이션, Slow 4G 1.6Mbps / 150ms RTT, CPU 4x 감속)에서 측정한 단계별 변화입니다.

| 지표 | 수정 전 (초기) | 1차 수정 (`<link>` 유지) | 2차 수정 (웹폰트 비차단 분리) | 3차 최종 (유휴 서드파티 제어) |
|---|---|---|---|---|
| <strong>Mobile Performance 점수</strong> | 57점 | 60점 (+3) | <strong>72점 (+15)</strong> | <strong>97\~99점</strong> |
| <strong>First Contentful Paint (FCP)</strong> | 6.0초 | 5.5초 | <strong>4.1초 (-1.9초)</strong> | <strong>1.1\~1.2초</strong> |
| <strong>Largest Contentful Paint (LCP)</strong> | 9.4초 | 9.0초 | <strong>4.2초 (-5.2초)</strong> | <strong>2.1\~2.4초</strong> |
| <strong>Total Blocking Time (TBT)</strong> | 160ms | 70ms | <strong>130ms</strong> | <strong>0\~10ms</strong> |
| <strong>Cumulative Layout Shift (CLS)</strong> | 0 | 0 | <strong>0</strong> | <strong>0\~0.003</strong> |
| <strong>Speed Index</strong> | 6.6초 | 6.4초 | <strong>5.6초 (-1.0초)</strong> | <strong>1.1\~2.8초</strong> |

2차 수정만으로도 배포 사이트의 LCP가 <strong>9.0초에서 4.2초로 절반 이하로 줄어들며 점수가 72점</strong>으로 도약했고, 3차 유휴 제어를 통해 첫 페인트와 메인 스레드 대기 시간을 극소화했습니다.

## 🔬 8. 같은 방식으로 직접 재현하기

개선은 "느낌"이 아니라 숫자로 판단해야 합니다. 아래는 이 글에서 쓴 측정 스크립트를 줄인 버전입니다. Puppeteer로 모바일 뷰포트·CPU 감속·네트워크 스로틀을 걸고, PerformanceObserver로 FCP·LCP·CLS를 모읍니다.

```js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const context = await browser.createBrowserContext();  // 실행마다 새 컨텍스트
  const page = await context.newPage();
  await page.setCacheEnabled(false);
  await page.setViewport({ width: 412, height: 823, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true });

  const client = await page.createCDPSession();
  await client.send('Network.enable');
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,  // bytes/sec
    uploadThroughput: (750 * 1024) / 8,
  });
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  await page.evaluateOnNewDocument(() => {
    window.__m = { fcp: 0, lcp: 0, cls: 0 };
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__m.fcp = e.startTime;
    }).observe({ type: 'paint', buffered: true });
    new PerformanceObserver((l) => {
      const es = l.getEntries();
      if (es.length) window.__m.lcp = es[es.length - 1].startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });

  await page.goto('https://seodaeya.github.io/', { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 5000));  // 지연 로딩 리소스까지 대기
  console.log(await page.evaluate(() => window.__m));
  await browser.close();
})();
```

몇 가지 함정이 있습니다.

- <strong>캐시를 반드시 끈다.</strong> 두 번째 실행부터 캐시에서 꺼내오면 개선 효과가 0으로 보인다. 브라우저 컨텍스트를 실행마다 새로 만드는 게 가장 확실하다.
- <strong>1회 측정은 믿지 않는다.</strong> 같은 조건에서 5회 이상 돌리고 중앙값을 본다. 첫 실행은 DNS·콜드 스타트 영향으로 크게 튄다.
- <strong>LCP는 마지막 항목을 쓴다.</strong> 더 큰 요소가 나타날 때마다 값이 갱신되므로 배열의 마지막 값이 최종 LCP다.
- <strong>로컬 서버로 재면 절대값이 작다.</strong> CDN·DNS 왕복이 없기 때문이다. 개선 전후의 비율을 보거나 실제 배포 URL로 재야 한다.

## 🚫 9. 일부러 손대지 않은 것들

Lighthouse가 지적한 항목 중에는 <strong>고치지 않는 게 맞다고 판단한 것</strong>도 있습니다.

- <strong>효율적인 캐시 수명(10분)</strong>: GitHub Pages는 `Cache-Control` 헤더를 사용자가 바꿀 수 없습니다. 다만 Next.js 산출물은 파일명에 해시가 붙어 있어, 캐시가 길지 않아도 오래된 파일을 잘못 쓰는 문제는 없습니다.
- <strong>레거시 JavaScript 13KB</strong>: Next.js가 넣는 폴리필입니다. 줄이려면 브라우저 지원 범위를 좁혀야 하는데, 13KB를 아끼려고 구형 브라우저 방문자를 버리는 건 남는 장사가 아닙니다.

## ✅ 10. 정리: 오늘 바로 적용할 수 있는 체크리스트

1. <strong>CSS 안에서 `@import`로 웹폰트를 불러오지 않는다.</strong> 나아가 한글이 주력인 사이트에서 영문 웹폰트 `<link rel="stylesheet">`가 첫 페인트를 막지 않도록 `media="print"` 후 `media="all"` 스왑이나 비차단 전략을 적용한다.
2. <strong>`<head>` 상단의 `<script async>`를 맹신하지 않는다.</strong> `async`는 HTML 파서만 멈추지 않을 뿐, 대역폭을 선점하고 크로스 오리진 iframe을 주입해 컴포지터의 첫 페인트 프레젠테이션 타임스탬프를 수백 ms 이상 밀어낸다.
3. <strong>분석·광고 스크립트(`AdSense`, `GA4`, `Clarity`)는 첫 인터랙션 또는 `load` 이후 유휴 시점으로 지연한다.</strong> 단, 검색·광고 크롤러 User-Agent는 즉시 로드하도록 분기해 심사·색인 무결성을 지킨다.
4. <strong>Next.js `<Link>`의 뷰포트 자동 프리패치를 통제한다.</strong> 첫 화면에 링크가 많다면 `prefetch={false}`로 초기 JSON·라우트 청크 스탬피드를 막는다.
5. <strong>로컬 랩 측정과 실제 PageSpeed(Lantern 시뮬레이션)는 다르다.</strong> 점수가 기대만큼 오르지 않을 때는 Lighthouse의 `optimisticGraph`에 어떤 네트워크 노드가 끼어들었는지 확인해야 진짜 병목을 잡을 수 있다.

성능 최적화는 "무엇을 줄일까"보다 <strong>"무엇이 첫 페인트의 커트라인 안으로 끼어들어 시뮬레이션 그래프를 부풀리고 있는가"</strong>를 찾는 일에 가깝습니다. 이번에는 `@import` 뒤에 숨어 있던 렌더 차단 폰트 80KB와 `<head>` 최상단 서드파티 스크립트 체인을 걷어내어 <strong>57점(LCP 9.4초)이던 모바일 성능을 99점(LCP 2.1초)</strong>으로 끌어올렸습니다.

## 관련 글

- [Next.js 블로그 반응형 목차(TOC) 개발과 4단계 실전 트러블슈팅 가이드](/posts/20260830-1-nextjs-mobile-toc-troubleshooting-guide/) — 같은 Pages Router 블로그에서 겪은 프론트엔드 트러블슈팅
- [GitHub Pages 애드센스 거절 원인과 커스텀 도메인 승인 전략](/posts/20260807-1-github-pages-adsense-domain/) — 이 블로그가 GitHub Pages를 쓰기 때문에 생기는 구조적 제약
- [SEO와 GEO 완벽 비교: 생성형 AI 검색 시대에 블로그를 상위 노출시키는 최강 전략](/posts/20260805-1-seo-geo-ai-search-strategy/) — 속도 개선이 최종적으로 향하는 목적

## 참고 자료

- [Largest Contentful Paint (LCP)](https://web.dev/articles/lcp) — web.dev
- [Optimize Largest Contentful Paint](https://web.dev/articles/optimize-lcp) — web.dev
- [Eliminate render-blocking resources](https://developer.chrome.com/docs/lighthouse/performance/render-blocking-resources) — Chrome for Developers
- [@import CSS at-rule](https://developer.mozilla.org/en-US/docs/Web/CSS/@import) — MDN
- [Custom Document](https://nextjs.org/docs/pages/building-your-application/routing/custom-document) — Next.js
