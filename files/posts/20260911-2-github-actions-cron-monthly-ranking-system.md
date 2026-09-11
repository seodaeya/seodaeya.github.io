---
category: "Dev & Software"
title: "서버·DB 없이 매일 자정 순위가 갱신되는 비결: GitHub Actions 크론과 월간 앵커 순위표 구축기"
date: "2026-09-11"
image: "/images/github_actions_cron_monthly_ranking_guide_thumbnail.jpg"
tags: ["GitHub Actions", "Next.js", "Cron", "GA4", "Ranking", "Automation", "Troubleshooting"]
excerpt: "정적 GitHub Pages 블로그에서 서버비 0원으로 매일 자정 GA4 조회수를 집계하고, 월초 기준 닻(Anchor)을 내려 일일 순위 변동을 오차 없이 감지하는 자동화 아키텍처를 공개합니다."
---

## 🕒 서버도 DB도 없는 정적 블로그가 자정마다 순위표를 바꾼다고?

GitHub Pages나 Vercel을 이용해 정적 블로그(SSG, Static Site Generation)를 운영해 본 개발자라면 누구나 한 번쯤 마주치는 본질적인 벽이 있습니다. 

> <strong>"정적 사이트에는 백엔드 서버(Node.js, Spring)도 없고, 데이터베이스(MySQL, Redis)도 없는데... 방문자 순위표나 실시간 랭킹 같은 동적 기능은 포기해야 하는 걸까?"</strong>

하지만 이 블로그의 [실시간/월간 인기 아티클 순위 페이지](/ranking)를 열어보면 놀랍게도 <strong>실제 구글 애널리틱스(GA4) 독자 페이지뷰</strong>가 실시간으로 매겨져 있고, 순위 변동폭(▲ 2, ▼ 1, -, NEW)까지 정교하게 표시됩니다. 심지어 매일 밤 한국 시간 자정(00:00 KST)이 되면 아무도 손대지 않아도 블로그가 스스로 일어나 최신 조회수를 긁어오고 순위표를 새로 그립니다.

이 모든 작업은 <strong>월 서버 비용 0원, 외부 유료 DB 제로</strong> 환경에서 <strong>GitHub Actions의 스케줄러(Cron)</strong>와 <strong>Next.js 정적 빌드 파이프라인</strong>만으로 완벽하게 동작하고 있습니다.

하지만 이 시스템을 운영하던 중 매우 당혹스러운 문제가 발생했습니다.  
<strong>"어제도 1등이었고 오늘도 1등인데, 왜 화면에는 '▲ 4계단 상승'이라고 요동칠까?"</strong>

본 아티클에서는 정적 블로그에서 서버리스 순위표를 구현하는 전체 아키텍처부터, 트래픽이 적은 초기 블로그에서 순위표가 '조울증'에 걸렸던 기술적 원인, 그리고 이를 <strong>'월간 기준 닻(Monthly Baseline Anchor)'</strong>으로 말끔히 해결한 전 과정을 유쾌하고 상세하게 공유합니다.

---

## 🚨 1. 사건의 발단: 순위가 안 바뀌었는데 왜 매일 9계단씩 요동칠까?

블로그에 인기 아티클 순위표를 붙여두고 며칠간 모니터링하던 중 기이한 현상이 목격되었습니다.

실제 GA4 통계를 확인해 보면 온톨로지 글이 부동의 1위(26 views), mlx-serve 글이 2위(17 views)로 순위 역전이 전혀 일어나지 않았습니다. 그런데 화면에는 다음과 같은 어지러운 뱃지가 번쩍이고 있었습니다:
* 온톨로지: <strong>▲ 2계단 상승</strong>
* mlx-serve: <strong>▼ 1계단 하락</strong>
* Next.js TOC: <strong>▲ 4계단 상승</strong>
* OpenMTP 가이드: <strong>▲ 9계단 상승</strong>
* CPO 개인정보 가이드: <strong>▲ 9계단 상승</strong>

독자 입장에서는 <em>"어제 분명 1위였던 글인데 왜 오늘 2계단 올랐다고 하지?", "트래픽이 폭발했나?"</em> 하며 의아해할 수밖에 없는 상황이었습니다. 코드 디버깅 결과, 이 기현상의 배후에는 <strong>2가지 치명적인 설계 결함</strong>이 숨어 있었습니다.

---

## 🔍 2. 범인 검거: 순위표를 널뛰게 만든 2가지 기술적 결함

### 1) '지터(Jitter)'를 유발한 인위적 난수 해시 (타이브레이커의 배신)
조회수가 동일하거나 아직 조회수가 없는 글들을 정렬하기 위해, 초기 코드에는 다음과 같은 코드가 들어가 있었습니다:

```javascript
// ⚠️ 문제의 코드: 날짜와 슬러그를 조합한 MD5 해시로 0\~4점 부여
const todayStr = new Date().toISOString().split('T')[0];
const hash = crypto.createHash('md5').update(`${todayStr}-${slug}`).digest('hex');
const tieBreaker = (parseInt(hash.substring(0, 4), 16) % 5);

const baseScore = freshnessScore + contentWeight + tieBreaker;
```

* <strong>원인:</strong> 동점 처리를 한답시고 넣었던 `tieBreaker`가 매일 날짜(`todayStr`)가 바뀔 때마다 <strong>글마다 완전히 다른 랜덤 점수(0\~4점)</strong>를 부여했습니다.
* <strong>결과:</strong> 트래픽이 적은 초기 블로그에서는 1\~2점 차이로 순위가 5\~9계단씩 곤두박질치거나 치솟았습니다. 사용자가 보기엔 순위가 하루아침에 롤러코스터를 타는 것처럼 보였던 것입니다.

### 2) 로컬 빌드 vs GitHub Actions의 'GA4 데이터 증발' 불일치
두 번째 문제는 <strong>이전 순위(Previous Rank)를 비교하는 기준점</strong>이었습니다.

기존 코드는 단순히 직전 빌드에서 생성된 `files/trending-posts.json` 파일을 열어 어제 순위와 비교하도록 되어 있었습니다.
* 개발자가 로컬 Mac에서 새 포스트를 작성하고 `npm run build`를 실행하면, 로컬에는 GA4 서비스 계정 키(`GA_PROPERTY_ID`, `GA_SERVICE_ACCOUNT_KEY`)가 없습니다.
* 그 결과 GA4 API 호출이 실패(null)하고, 로컬의 계산 스코어로 `trending-posts.json`이 덮어씌워지면서 <strong>실측 조회수가 전부 `null`로 초기화</strong>되었습니다.
* 이 상태로 Git Push를 하면, GitHub Actions 러너가 이 가짜 순위표를 '이전 순위'로 인식하여 다음 자정 배포 때 실측 데이터와 대조하며 <strong>순위가 10계단 이상 뒤집히는 대참사</strong>가 벌어진 것입니다.

---

## ⚓ 3. 해결책: 닻을 내려라! '월간 기준 순위표(Monthly Baseline)' 아키텍처

트래픽이 일 수만 건에 달하는 대형 포털(네이버, 유튜브)이라면 분 단위, 일 단위 실시간 랭킹이 의미가 있습니다. 하지만 개인 기술 블로그나 전문 테크 매체는 <strong>누적 독자 반응이 서서히 축적되는 롱테일(Long-tail) 구조</strong>를 가집니다.

따라서 매일매일 어제와 비교할 것이 아니라, <strong>한 달 동안 흔들리지 않는 튼튼한 '닻(Anchor)'</strong>을 내리기로 결정했습니다.

```text
[매월 1일 자정]
  └── 당월 공식 기준표 확정 (files/monthly-baseline-ranking.json 스냅샷)
  └── 모든 아티클의 변동 뱃지를 클린하게 [-] (기준점)으로 리셋!

[매월 2일 \~ 말일 매일 자정]
  └── GA4 API로 당일 누적 실측 조회수 수집
  └── '어제'가 아니라 '이번 달 1일 기준 순위'와 당일 순위를 1:1 비교
  └── 1일에 5위였던 글이 오늘 3위가 되면? ➔ [▲ 2] (진짜 유의미한 순위 역전만 감지!)
  └── 1일 이후 새로 발행된 따끈따끈한 글은? ➔ [NEW]
```

### 1) 매월 1일: 공식 기준표 자동 수립
매월 1일 자정이 되면 스케줄러가 이를 감지(`day === 1`)하고, 그 시점의 최신 랭킹을 `files/monthly-baseline-ranking.json`에 영구 스냅샷으로 기록합니다:

```json
{
  "month": "2026-09",
  "baselineDate": "2026년 9월 1일",
  "rankings": {
    "/posts/20260827-1-ecommerce-ontology-ai-search-guide": 1,
    "/posts/20260904-1-mlx-serve-apple-silicon-local-llm-guide": 2,
    "/posts/20260830-1-nextjs-mobile-toc-troubleshooting-guide": 3
  }
}
```
1일 당일에는 기준 순위와 현재 순위가 100% 일치하므로, 사이트의 모든 화살표가 군더더기 없이 <strong>`-` (변동 없음)</strong> 상태로 출발합니다.

### 2) 2일\~말일: 결정론적 정렬과 델타(Delta) 감지
인위적인 난수 해시를 완전히 도려내고, 철저하게 <strong>결정론적(Deterministic) 3단계 가중치</strong>를 부여했습니다:

```javascript
// 1순위: GA4 실측 조회수가 단 1회라도 있다면 10만점 부여 (조회수 절대 우위)
// 2순위: 발행일 최신순 (postDate)
// 3순위: 글 본문 분량 (contentLength)
const scoredPosts = allCandidatePosts.map(post => {
  const views = gaViewsMap[post.slug] || 0;
  const totalScore = (views * 100000) + post.baseScore;
  return { ...post, views: views > 0 ? views : null, totalScore };
}).sort((a, b) => {
  if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
  return b.postDate - a.postDate;
});
```

그리고 순위 변동 계산은 오직 <strong>1일 기준 순위(`monthlyBaselineMap`)</strong>하고만 비교합니다:
* `prevRank > currentRank`: <strong>`▲ ${prevRank - currentRank}`</strong> (월초 대비 순위 상승)
* `prevRank < currentRank`: <strong>`▼ ${currentRank - prevRank}`</strong> (월초 대비 순위 하락)
* `prevRank === currentRank`: <strong>`-`</strong> (순위 유지)
* 기준표에 없던 새 글: <strong>`NEW`</strong> (신규 진입)

---

## 🤖 4. GitHub Actions 크론: 밤 12시마다 일어나는 무료 야간 알바생

그렇다면 이 자바스크립트 스크립트는 대체 누가, 언제 실행해 주는 걸까요?  
비밀은 바로 리포지토리의 [`.github/workflows/deploy.yml`](file:///.github/workflows/deploy.yml)에 선언된 <strong>GitHub Actions 스케줄러</strong>입니다.

```yaml
name: Build and Deploy to GitHub Pages

on:
  push:
    branches:
      - master
  schedule:
    # ⭐️ 매일 한국 시간 00:00(자정 / UTC 15:00)에 자동 실행
    - cron: '0 15 * * *'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      # ⭐️ 환경변수로 주입되는 구글 서비스 계정 키로 GA4 데이터 조회 및 정적 빌드
      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_GA_MEASUREMENT_ID: 'G-QEKBH49RMK'
          GA_SERVICE_ACCOUNT_KEY: ${{ secrets.GA_SERVICE_ACCOUNT_KEY }}
          GA_PROPERTY_ID: ${{ secrets.GA_PROPERTY_ID }}

      - name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v4
```

### 🕒 크론 시간대의 함정: UTC vs KST
GitHub Actions의 cron 표현식은 항상 <strong>세계 표준시(UTC)</strong> 기준입니다.  
한국 표준시(KST)는 UTC보다 9시간 빠릅니다(`UTC+9`).
* 한국 시간 자정: `24:00` (또는 `00:00`)
* 대응하는 UTC 시간: `24 - 9 = 15:00`
* 따라서 크론 표현식은 `0 0 * * *`가 아니라 <strong>`0 15 * * *`</strong>가 되어야 정확히 매일 밤 자정에 알바생이 출근합니다!

---

## 💡 5. 정적 사이트 개발자가 꼭 챙겨야 할 3가지 꿀팁

### 1) 로컬 개발 시 '캐시 승계(Preserved Views Fallback)' 패턴
로컬 PC에는 보안상 구글 서비스 계정 비공개키(JSON)를 두지 않는 경우가 많습니다. 이때 빌드 스크립트가 조회수를 0이나 null로 밀어버리지 않도록, <strong>기존 JSON에 이미 기록되어 있는 실측 조회수를 이어받는 방어 로직</strong>을 반드시 구축해야 합니다:

```javascript
function getPreservedViewsMap() {
  const viewsMap = {};
  if (fs.existsSync(baselineFile)) {
    const data = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
    data.posts?.forEach(p => {
      if (p.views && p.url) viewsMap[p.url.replace('/posts/', '')] = p.views;
    });
  }
  return viewsMap;
}
```

### 2) Next.js 정적 빌드 타임 주입 (SSG의 마법)
런타임에 클라이언트 브라우저에서 GA4 API를 직접 호출하면 API 할당량이 순식간에 거덜 나고 보안 키가 노출됩니다.  
Next.js의 `getStaticProps`를 활용하면, <strong>빌드 타임에 단 1번만 GA4를 호출하여 정적 JSON으로 구워버린 뒤 HTML에 통째로 박아 배포</strong>하므로 방문자가 10만 명이 몰려도 GA4 API 비용이나 지연 시간이 0이 됩니다.

### 3) 일간 순위표 vs 월간 순위표 선택 기준
* <strong>일간 순위표가 적합한 경우:</strong> 일일 순 방문자 수(UV)가 수천\~수만 단위 이상이어서 매일 의미 있는 순위 변동이 일어나는 대형 커뮤니티/미디어.
* <strong>월간 기준 앵커 순위표가 적합한 경우:</strong> 개인 기술 블로그, 1인 개발자 포트폴리오, B2B 기술 문서 등 고품질 롱폼 콘텐츠가 꾸준히 검색 유입되는 사이트.

---

## 🏁 마치며: 서버가 없어도 엔지니어링은 우아할 수 있다

AWS EC2를 띄우고, 데이터베이스를 붙이고, 백엔드 서버를 24시간 돌리는 것은 누구나 돈을 쓰면 할 수 있는 일입니다. 

하지만 <strong>GitHub의 무료 인프라(Actions + Pages)</strong>와 <strong>Next.js SSG의 장점</strong>을 극한으로 결합하고, 통계학적 지터 문제를 <strong>월간 앵커링(Monthly Anchoring)</strong>으로 우아하게 풀어내는 과정이야말로 개발자가 맛볼 수 있는 가장 순수한 엔지니어링의 재미가 아닐까 싶습니다.

지금 운영 중인 정적 블로그가 있다면, 잠자고 있는 GitHub Actions에 야간 알바를 맡겨보세요. 매일 아침 일어났을 때 밤사이 예쁘게 정리된 순위표를 마주하는 즐거움을 느끼실 수 있을 것입니다!
