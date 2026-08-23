---
category: "Tech & Dev"
title: "정적 깃허브 블로그에서 쿠팡 봇 방어벽 뚫고 쇼핑몰 만능 장바구니 만들기: 서버리스 보안 아키텍처와 파트너스 API 연동기"
date: "2026-08-24"
image: "/images/github_pages_serverless_cart_thumbnail.jpg"
tags: ["GitHub Pages", "Next.js", "Serverless", "Cloudflare Workers", "Coupang Partners API", "Web Security", "Architecture"]
---

## 🛒 서론: 개발자의 번뜩이는 아이디어에서 시작된 '실험 서비스' 프로젝트

저는 일상 속 불편함을 코드로 해결하는 것을 즐기는 개발자입니다. 평소 온라인 쇼핑을 하다 보면 쿠팡, 네이버 스마트스토어, 알리익스프레스, 11번가, 아마존 등 각기 다른 플랫폼에 관심 상품이 뿔뿔이 흩어져 있어 **"이 장바구니들을 한곳에 싹 모아서 실시간 가격과 예산을 한눈에 비교할 수 있다면 얼마나 편할까?"**라는 아이디어가 예전부터 머릿속에 맴돌았습니다.

단순히 혼자 쓰는 도구에 그치지 않고, 제 블로그를 찾아주시는 **많은 분들께 실제로 유용하게 쓰일 수 있는 대외 웹 서비스를 직접 만들어 선물해 드리고 싶었습니다.** 그래서 블로그 상단에 **'실험 서비스 🧪'** 메뉴를 새롭게 열고, 링크 하나만 넣으면 여러 쇼핑몰의 상품을 1초 만에 깔끔하게 모아주는 <strong>'모두모아 장바구니'</strong>를 개발하게 되었습니다.

하지만 깃허브 블로그(GitHub Pages)라는 순수 정적 호스팅 환경에서 대외 서비스를 구현하다 보니, 두 가지 거대한 현실적 기술 장벽과 마주쳤습니다:

1. <strong>쿠팡의 철통 봇 방어벽(Akamai 403 Forbidden)</strong>: 브라우저나 일반 공개 스크래퍼가 쿠팡 상품 페이지를 조회하려 하면 아카마이 방화벽이 접근을 전면 차단하여 상품명과 가격이 0원으로 가려지는 현상.
2. <strong>퍼블릭 깃허브(Public Repo)의 보안 딜레마</strong>: 쿠팡 공식 파트너스 API를 쓰면 해결되지만, 공개 저장소에 API 키(Secret Key)를 단 1글자라도 올리는 순간 전 세계에 노출되어 계정 정지 및 심각한 보안 사고로 이어지는 문제.

서버 호스팅 비용 0원을 유지하면서, 소스코드에 키를 1글자도 노출하지 않고, **모든 방문자에게 100% 실시간 상품 조회를 제공**하기 위해 고안한 <strong>'서버리스 제로-시크릿(Zero-Secret) 아키텍처'</strong>의 구축 과정을 공유합니다.

---

## 🔍 1. 문제 분석: 왜 쿠팡은 일반 스크래핑이 불가능한가?

네이버 스마트스토어나 알리익스프레스, 아마존은 일반적인 OpenGraph 메타 태그(`og:title`, `og:image`, `og:price:amount`)를 제공하여 비교적 수월하게 데이터를 긁어올 수 있었습니다. 하지만 국내 최대 이커머스 플랫폼인 쿠팡은 고도화된 봇 탐지 시스템(Akamai Bot Manager)을 가동하고 있습니다.

```text
[ 일반 스크래퍼 요청 시 발생하는 실패 흐름 ]
방문자 입력: https://link.coupang.com/a/gsd4tnzhF6 (쿠팡 단축 링크)
           ⬇️ 1. HTTP 302 리다이렉트
https://www.coupang.com/vp/products/7168704316 (실제 상품 페이지)
           ⬇️ 2. 스크래퍼/프록시가 HTML 접근 시도
HTTP 403 Forbidden (AkamaiGHost 봇 방어벽 작동!)
           ⬇️
❌ 결과: 상품명('파워에이드 제로 20개')과 가격('14,530원')이 완전히 차단되어 '가격 미지정' 카드로 등록됨
```

여기에 더해 브라우저 보안 정책인 **동일 출처 정책(CORS)** 때문에, 정적 웹사이트 프론트엔드 자바스크립트가 쿠팡 웹페이지를 직접 읽어오는 것은 기술적으로 원천 차단되어 있었습니다.

---

## 🛡️ 2. 오픈소스 & 퍼블릭 깃허브의 보안 딜레마

쿠팡 파트너스 공식 Open API(`https://api-gateway.coupang.com/v2/providers/affiliate_open_api/...`)를 사용하면 봇 차단 없이 합법적이고 정확하게 상품명과 실시간 가격을 가져올 수 있습니다. 하지만 이 API는 `HMAC-SHA256` 암호화 서명 기반의 **Access Key**와 **Secret Key**를 요구합니다.

* <strong>깃허브 공개 저장소에 `.env`나 소스코드로 커밋하면?</strong> ➔ 깃허브 크롤러 봇에 의해 5초 만에 전 세계에 털립니다.
* <strong>Next.js `NEXT_PUBLIC_` 환경변수에 넣으면?</strong> ➔ 정적 빌드 결과물(JavaScript 번들)에 평문으로 박혀 F12 개발자 도구로 누구나 키를 복사해 갈 수 있습니다.

따라서 <strong>'깃허브 레포지토리에는 키가 0.0001%도 노출되지 않으면서, 대외 서비스 이용자 누구나 안전하게 쿠팡 API의 조회 혜택을 누리는 구조'</strong>를 설계해야 했습니다.

---

## 🚀 3. 해결책: Cloudflare Worker 기반 '제로-시크릿(Zero-Secret)' 아키텍처

이 문제를 해결하기 위해 **무료 서버리스 엣지 컴퓨팅(Cloudflare Workers)**을 전면에 배치하여 완벽한 보안 완충 지대(Security Shield)를 구축했습니다.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        [ 시스템 데이터 흐름도 ]                        │
└────────────────────────────────────────────────────────────────────────┘

[ 1. 사용자 브라우저 (GitHub Pages 대외 서비스) ]
  • 쿠팡 단축 링크 입력 (link.coupang.com/a/...)
  • 오직 공개된 중계 엔드포인트(COUPANG_LOOKUP_ENDPOINT)만 호출 (키 0개!)
           │
           ▼ (HTTPS 요청)
[ 2. Cloudflare Worker (비밀 보안 금고) ]
  • Wrangler Secret으로 암호화 보관된 쿠팡 API Key 호출
  • 허용된 도메인(seodaeya.github.io)인지 CORS Origin 엄격 검증
  • 단축 링크를 1회 역추적하여 순수 상품 번호(#7168704316) 추출
  • HMAC-SHA256 암호화 서명 생성 ➔ 쿠팡 공식 API 게이트웨이 호출
  • 30분 엣지 캐싱(Cache-Control)으로 쿼터 절약
           │
           ▼ (정식 인증 통신)
[ 3. 쿠팡 파트너스 공식 서버 ]
  • 100% 정식 승인 JSON 응답:
    { "title": "파워에이드 제로, 600ml, 20개", "price": 14530, "imageUrl": "..." }
           │
           ▼
[ 4. 장바구니 자동 등록 완료 ]
  • 방문자 입력 0회! 상품명, 14,530원 실제 가격, 고화질 사진이 0.1초 만에 쏙 등록 완료!
```

---

## 💻 4. 핵심 구현 디테일

### ① Cloudflare Worker: 엣지 서명 및 정제 (`src/index.mjs`)
Worker는 깃허브 소스코드에 키를 남기지 않고, 실행 시점에만 `env.COUPANG_PARTNERS_ACCESS_KEY`와 `env.COUPANG_PARTNERS_SECRET_KEY`를 메모리에 로드합니다.

```javascript
// Cloudflare Worker 암호화 서명 및 API 호출 로직 (개념 예시)
const datetime = createHmacTimestamp(); // yyMMdd'T'HHmmss'Z'
const method = 'GET';
const path = `/v2/providers/affiliate_open_api/apis/openapi/products/search`;
const message = `${datetime}${method}${path}?keyword=${productId}`;

// HMAC-SHA256 서명 생성
const signature = await generateHmacSha256(secretKey, message);
const authorization = `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${datetime}, signature=${signature}`;

const coupangRes = await fetch(`https://api-gateway.coupang.com${path}?keyword=${productId}&limit=1`, {
  headers: {
    'Authorization': authorization,
    'Content-Type': 'application/json'
  }
});
```

### ② 터미널에서 비밀 키 암호화 주입 (`wrangler secret`)
비밀 키는 파일이 아닌 Cloudflare의 암호화 볼트에 직접 주입합니다:

```bash
npx wrangler secret put COUPANG_PARTNERS_ACCESS_KEY --config workers/cart-product-lookup/wrangler.toml
npx wrangler secret put COUPANG_PARTNERS_SECRET_KEY --config workers/cart-product-lookup/wrangler.toml
npx wrangler deploy --config workers/cart-product-lookup/wrangler.toml
```

### ③ GitHub Actions CI/CD 파이프라인 자동 연결
배포된 Worker의 주소만 GitHub 저장소의 **Settings ➔ Actions ➔ Variables**에 `COUPANG_LOOKUP_ENDPOINT`로 등록해 주면, 빌드 시점에 프론트엔드로 안전하게 주입됩니다:

```yaml
# .github/workflows/deploy.yml
- name: Build Next.js Static Site
  run: npm run build
  env:
    NEXT_PUBLIC_COUPANG_LOOKUP_ENDPOINT: ${{ vars.COUPANG_LOOKUP_ENDPOINT }}
```

---

## 💡 5. 12세 청소년도 쉽게 이해하는 비유 (ELI12)

> <strong>"대문 앞 게시판(깃허브 공개 레포)에 집 열쇠를 걸어두면 지나가는 누구나 훔쳐갈 수 있습니다!"</strong>
>
> 1. 그래서 대문에는 열쇠를 두지 않고, 멀리 떨어진 <strong>안전한 은행 금고(Cloudflare Worker)</strong>에만 열쇠를 숨겨두었습니다.
> 2. 방문자가 쿠팡 물건을 담을 때 블로그는 은행 금고에 <strong>"파워에이드 가격 좀 대신 알아봐 줘!"</strong> 하고 편지만 보냅니다.
> 3. 은행 금고가 비밀 열쇠로 쿠팡 문을 열고 정확한 가격표(`14,530원`)를 확인한 뒤, 영수증만 우리 블로그 장바구니에 배달해 주는 원리입니다!

---

## ⚖️ 6. 쿠팡 파트너스 정책 준수 및 건전한 운영 원칙

대외 서비스를 기획하며 쿠팡 파트너스의 **'무효클릭 및 클릭 유도형 광고 활동 금지 운영정책'**도 꼼꼼히 점검했습니다:

* <strong>'후원/응원' 명목의 클릭 유도 금지</strong>: 후원 모금 카드나 위시리스트 배너에 "블로그 후원을 위해 쿠팡을 클릭해 주세요" 같은 문구를 넣는 것은 운영정책 4.1조 위반으로 계정 정지 사유가 됩니다.
* <strong>순수한 도구 본질에 집중</strong>: 불필요한 후원 버튼을 전면 제거하고, 방문자가 순수하게 자신의 쇼핑 예산을 관리하는 데 집중할 수 있는 깔끔한 유틸리티 서비스로 정돈했습니다.

---

## 🎯 결론 및 배운 점

1. <strong>아이디어를 대외 서비스로 실현하는 즐거움</strong>: 단순한 블로그 글을 넘어, 흩어져 있던 장바구니를 한곳에 모으는 유용한 웹 서비스를 직접 개발하여 많은 분들께 제공할 수 있게 되었습니다.
2. <strong>정적 사이트의 한계는 서버리스로 극복된다</strong>: 백엔드 서버 호스팅 비용을 1원도 들이지 않고도, 무료 Cloudflare Worker를 통해 고난도의 API 서명과 데이터 조회를 완벽하게 처리할 수 있었습니다.
3. <strong>오픈소스/퍼블릭 레포에서는 시크릿 격리가 생명이다</strong>: 코드가 전 세계에 공개되어 있어도 아키텍처 수준에서 시크릿을 격리하면 완벽한 엔터프라이즈급 보안을 달성할 수 있습니다.

이제 깃허브 블로그의 **'실험 서비스 🧪 > 모두모아 장바구니'**는 모든 방문자에게 어떤 쇼핑몰 링크든 0.1초 만에 깔끔하게 모아주는 든든한 일상의 스마트 도구로 안전하고 빠르게 작동하고 있습니다.
