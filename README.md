# 여전히, 나는 사람이다. (NaRD Tech & Life Archive)

[![Next.js](https://img.shields.io/badge/Next.js-15.2.9-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.6-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Deploy](https://img.shields.io/badge/Deploy-GitHub%20Pages-222222?style=flat-square&logo=githubpages)](https://seodaeya.github.io)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

> **"완벽한 알고리즘의 세상 속에서, 서툴지만 뜨겁게 살아가는 인간의 기록"**  
> 인공지능 트렌드부터 개발 트러블슈팅, 최신 하드웨어 리뷰, 일상의 지혜까지 직접 겪고 분석한 이야기를 기록하는 기술 아카이브 블로그입니다.

---

## 🌟 프로젝트 개요

본 프로젝트는 **Next.js 15 (Pages Router, SSG `output: export`)**를 기반으로 구축된 100% 서버리스 정적 웹사이트입니다.  
별도의 데이터베이스나 백엔드 서버 없이 **GitHub Actions 크론 스케줄러**, **Google Analytics 4 (GA4) API**, **Cloudflare Workers**를 유기적으로 결합하여 동적 웹 애플리케이션 수준의 기능을 구현했습니다.

* **라이브 블로그**: [https://seodaeya.github.io](https://seodaeya.github.io)
* **공식 유튜브 채널**: [@Na.R.D.](https://www.youtube.com/@Na.R.D.)

---

## 🚀 주요 기능 및 기술적 특징

### 1. 🏆 서버리스 일간·월간 랭킹 시스템 (`/ranking`)
* **데이터베이스 없는 자동화 순위 집계**: 매일 자정(한국 시간 00:00 KST / UTC 15:00) GitHub Actions 크론 워크플로우가 실행되어 GA4 API를 호출, 실시간 누적 페이지뷰를 수집합니다.
* **월간 앵커 기준 랭킹 비교**: 매월 1일 자정의 순위를 기준점(`monthlyBaselineMap`)으로 고정하여, 일간 순위 변동(`▲ 상승`, `▼ 하락`, `- 유지`, `NEW 신규 진입`)을 명확하게 시각화합니다.
* **로컬/CI 안전 폴백(Fallback)**: 로컬 개발 환경이나 GA API 일시 장애 시에도 기존 월간 기준표(`files/monthly-baseline-ranking.json`) 데이터를 자동 보존하여 무중단 빌드를 보장합니다.

### 2. 🛒 모두모아 장바구니 (`/cart`, CartInAll)
* **1초 스마트 북마클릿**: 쇼핑몰(쿠팡, 네이버, 알리익스프레스, 아마존 등) 페이지에서 북마클릿 클릭 한 번으로 상품명, 가격, 썸네일, 링크를 100% 자동 수집합니다.
* **Cloudflare Workers 서버리스 백엔드 (`workers/cart-product-lookup`)**: 쿠팡 파트너스 API의 복잡한 HMAC-SHA256 암호화 서명을 엣지 환경에서 안전하게 처리하며, 단축 URL 리다이렉트를 실시간 추적합니다.
* **보안 및 클라이언트 저장소**: `javascript:` 등 악성 스키마를 사전 차단하는 URL Sanitizer가 적용되어 있으며, LocalStorage를 통해 로그인 없이 영구 저장됩니다.

### 3. 📝 심층 아티클 엔지니어링 뷰어 (`/posts/[id]`)
* **인터랙티브 다이어그램 (Mermaid SVG)**: 아키텍처 및 순서도를 Mermaid 코드로 작성하면 클라이언트에서 선명한 벡터 SVG로 자동 렌더링합니다. (다크모드 고대비 스타일 및 스크롤 롤백 방지 `React.memo` 최적화 적용)
* **3D 온톨로지 지식 그래프 (`OntologyGraph3D`)**: Three.js를 활용하여 기술 개념 및 키워드 간의 연결 고리를 인터랙티브 3D 노드 그래프로 시각화합니다.
* **반응형 목차(TOC) & 스크롤스파이**: 본문 제목(`H2`, `H3`)을 자동 추출하여 현재 읽고 있는 섹션을 하이라이트하며, 모바일 하단 플로팅 드로어로 제공됩니다.
* **독서 진행률 프로그레스 바**: 스크롤 위치에 따라 최상단 얇은 게이지 바가 실시간으로 독서 완료율을 표시합니다.
* **원클릭 코드 복사 & 반응형 테이블**: 모든 코드 블록에 복사 버튼이 자동 주입되며, 모바일에서 긴 테이블이 레이아웃을 깨뜨리지 않도록 가로 스크롤 컨테이너로 감쌉니다.
* **Giscus 댓글 연동**: GitHub Discussions API 기반의 무서버 댓글 시스템으로, 블로그 테마(다크/라이트)에 맞춰 자동 전환됩니다.

### 4. 🔍 검색엔진(SEO) & 생성형 AI(GEO/AEO) 최적화
* **JSON-LD 구조화 데이터**: `BlogPosting`, `VideoObject`, `WebSite`, `Person` 스키마를 완벽 제공하여 검색엔진 리치 스니펫을 지원합니다.
* **AI Key Summary & Global Takeaways**: 포스트 상단에 핵심 요약 박스를 배치하여 Perplexity, ChatGPT, Claude 등 최신 AI 검색 크롤러의 핵심 인용 확률을 극대화했습니다.
* **IndexNow 실시간 핑**: 새 글 배포 시 Bing, Naver, Yandex 검색엔진에 즉시 URL을 핑하여 수 분 내 조기 색인을 유도합니다.
* **엄격한 SEO 제목 최적화**: 구글 SERP 잘림 및 진단 툴 에러를 방지하기 위해 프론트매터 제목을 44자 이내(사이트 접미사 결합 시 60자 이내)로 자동 관리하는 규칙 및 빌드 타임 검증기를 탑재했습니다.
* **공식 광고 및 크롤러 인증**: 구글 애드센스 공인 판매자 파일(`public/ads.txt`), `Mediapartners-Google` 허용 `robots.txt`, `_document.js` 메타 태그 최상단 고정이 완료되어 있습니다.

---

## 📁 디렉토리 구조

```plaintext
seodaeya.github.io
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions CI/CD & 매일 자정 크론 자동 배포
├── components/                   # 재사용 React 컴포넌트
│   ├── Breadcrumbs.jsx           # 상단 경로 빵부스러기 네비게이션
│   ├── Comments.js               # Giscus 댓글 시스템 연동
│   ├── Footer.js                 # 사이트 하단 정보 및 RSS/채널 링크
│   ├── Header.js                 # 글래스모피즘 상단 네비게이션 & 테마 토글
│   ├── Layout.js                 # 페이지 공통 셸 레이아웃
│   ├── OntologyGraph3D.jsx       # Three.js 기반 3D 지식 그래프
│   ├── SEO.js                    # 메타 태그, Dublin Core, OpenGraph, JSON-LD 주입
│   ├── Sponsor.jsx               # 후원 및 채널 안내 컴포넌트
│   ├── TOC.jsx                   # 반응형 목차 및 스크롤스파이
│   └── graph/                    # 지식 그래프 및 다이어그램 서브 컴포넌트
├── files/                        # 콘텐츠 마크다운 및 동적 데이터
│   ├── gen/                      # 빌드 타임 메타데이터 생성 스크립트
│   │   ├── generate-categories.js    # 카테고리 트리 생성
│   │   ├── generate-latest-posts.js  # 최신글 및 빌드 타임 자동 안전망 검사기
│   │   ├── generate-rss.js           # RSS 2.0 XML 피드 생성
│   │   ├── generate-sitemap.js       # sitemap.xml 생성 (핵심 페이지 및 포스트)
│   │   ├── generate-trending-posts.js# GA4 연동 및 일간·월간 앵커 순위표 계산기
│   │   └── submit-indexnow.js        # IndexNow 검색엔진 실시간 핑
│   ├── posts/                    # 기술 블로그 아티클 마크다운 (*.md)
│   ├── videos/                   # 유튜브 영상 아카이브 마크다운 (*.md)
│   ├── categories.json           # 빌드 산출물: 카테고리 데이터
│   ├── latest-posts.json         # 빌드 산출물: 최신 글 목록
│   ├── monthly-baseline-ranking.json # 매월 1일 고정 랭킹 기준표
│   └── trending-posts.json       # 빌드 산출물: 랭킹 집계 데이터
├── pages/                        # Next.js 라우트 페이지
│   ├── _app.js                   # 전역 설정, GA4 SPA 라우팅 추적, View Transitions
│   ├── _document.js              # HTML 골격, 보안 메타 태그, 애드센스 코드 고정
│   ├── index.js                  # 메인 홈 (히어로 쇼룸, 실시간 순위, 최근 피드)
│   ├── 404.jsx                   # 맞춤형 글래스모피즘 404 안내 페이지
│   ├── about.jsx                 # 브랜드 철학 및 운영자 소개 페이지
│   ├── privacy.jsx               # 개인정보처리방침 (쿠키, 애드센스 고지)
│   ├── cart/                     # 모두모아 장바구니 (CartInAll) 서비스
│   ├── categories/               # 카테고리별 글 & 영상 모아보기
│   ├── ranking/                  # 전체 실시간 랭킹 종합 순위표 페이지
│   ├── posts/                    # 블로그 아티클 상세 뷰어 ([id].jsx)
│   └── videos/                   # 비디오 상세 뷰어 ([id].jsx)
├── public/                       # 정적 웹 에셋
│   ├── images/                   # 포스트 맞춤형 고해상도 썸네일
│   ├── ads.txt                   # 구글 애드센스 공인 판매자 식별 파일
│   ├── robots.txt                # 검색 봇 및 애드센스 크롤러 지시 파일
│   ├── sitemap.xml               # 자동 생성된 사이트맵
│   └── rss.xml                   # 자동 생성된 RSS 피드
├── styles/                       # CSS 모듈 및 전역 스타일
│   ├── globals.css               # HSL 색상 변수, 다크/라이트 테마, 유틸리티
│   ├── layout.module.css         # 헤더, 푸터, 네비게이션 스타일
│   ├── home.module.css           # 메인 페이지 및 카드 스타일
│   ├── post.module.css           # 포스트 본문, Mermaid, AI 요약 박스 스타일
│   ├── cart.module.css           # 장바구니 인터페이스 스타일
│   └── ranking.module.css        # 랭킹 순위표 및 배지 스타일
├── workers/                      # Cloudflare Workers 백엔드
│   └── cart-product-lookup/      # 쿠팡 파트너스 HMAC 서명 및 상품 조회 마이크로서비스
├── AGENTS.md                     # AI 에이전트 마크다운 포맷팅 및 SEO 영구 규칙서
├── package.json                  # 프로젝트 의존성 및 빌드 스크립트
└── next.config.ts                # Next.js 정적 내보내기 설정 (output: 'export')
```

---

## 🛠 기술 스택

| 분류 | 기술 / 라이브러리 | 적용 목적 |
| :--- | :--- | :--- |
| **Framework** | **Next.js 15 (Pages Router)** | SSG 정적 사이트 생성 (`output: 'export'`), Trailing Slash 최적화 |
| **Core UI** | **React 19, TypeScript** | 컴포넌트 기반 아키텍처 및 정적 타입 안정성 |
| **Styling** | **Tailwind CSS v4, LightningCSS, CSS Modules** | 네온 그라디언트 & 프리미엄 글래스모피즘 테마 |
| **Visualization** | **Mermaid v11, Three.js** | 인터랙티브 아키텍처 다이어그램 및 3D 지식 그래프 |
| **Markdown** | **Gray-Matter, Marked** | YAML 프론트매터 파싱 및 커스텀 렌더러 파이프라인 |
| **Serverless** | **Cloudflare Workers (Wrangler)** | 쇼핑몰 API 암호화 서명 및 서버리스 마이크로서비스 |
| **Analytics & SEO** | **GA4 API, IndexNow, Giscus** | 실시간 트래픽 분석, 즉시 색인 핑, GitHub 토론 기반 댓글 |
| **CI/CD** | **GitHub Actions** | 매일 자정 자동 통계 갱신 및 GitHub Pages 무중단 배포 |

---

## 🛡️ 빌드 타임 자동 안전망 (Fail-Safe Pipeline)

블로그 배포 파이프라인(`npm run build`)은 빌드 실행 전 `files/gen/` 스크립트를 통해 자동으로 다음 안전망을 구동합니다:

1. **한글 마크다운 볼드 파싱 안전망**: 한글 조사 및 따옴표 결합 시 `marked`에서 깨지는 `**텍스트**`를 탐지하여 표준 `<strong>` 태그로 자동 변환합니다.
2. **물결표(`~`) 취소선 오인 방지**: 본문 내 숫자 범위(`15\~20개`, `$2\~$3`)에 쓰인 물결표가 취소선(`<del>`)으로 변환되지 않도록 `\~`로 자동 탈출합니다. (코드 블록 내부 제외)
3. **LaTeX 수식 안전 변환**: 표준 `marked`에서 지원하지 않는 `$$...$$` 블록 수식을 일반 텍스트 및 유니코드 기호(`×`, `÷`, `➔`) 기반의 블록쿼트로 안전하게 변환합니다.
4. **SEO/GEO 제목 길이 자동 감시**: 검색엔진 결과에서 제목이 잘리지 않도록 44자 초과(사이트 접미사 결합 시 60자 초과) 글을 빌드 시 즉각 감지하여 경고를 출력합니다.

---

## 💻 로컬 개발 및 빌드 방법

### 1. 사전 요구 사항
* Node.js 20 이상 (Node.js 22 LTS 권장)
* npm 10 이상

### 2. 의존성 설치
```bash
npm install
```

### 3. 로컬 개발 서버 실행
```bash
npm run dev
```
브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속하여 변경 사항을 실시간으로 확인합니다.

### 4. 단위 테스트 실행
```bash
npm run test
```
Cloudflare Worker 헬퍼 함수 및 파트너스 서명 로직을 테스트합니다.

### 5. 정적 사이트 빌드
```bash
npm run build
```
모든 메타데이터 생성 스크립트(`latest-posts`, `trending-posts`, `categories`, `sitemap`, `rss`)가 차례로 실행된 후 Next.js 정적 산출물이 `out/` 폴더에 생성됩니다.

---

## 🤖 AI 에이전트 작업 수칙 (`AGENTS.md`)

이 저장소에 새 글을 작성하거나 코드를 수정하는 모든 AI 에이전트는 [AGENTS.md](AGENTS.md)의 5대 핵심 규약을 준수해야 합니다:
* **Rule 1**: 한국어 마크다운 볼딩 시 `**` 사용 금지, 반드시 `<strong>` 태그 사용.
* **Rule 2**: 마크다운 본문의 물결표는 반드시 `\~`로 이스케이프.
* **Rule 3**: 빌드 타임 자동화 Fail-Safe 유지보수.
* **Rule 4**: Raw LaTeX 수식 문법 사용 금지, 유니코드 수학 기호 사용.
* **Rule 5**: SEO/GEO 글 제목 길이 최대 44자 제한 (권장: 32\~42자).

---

## 📄 라이선스

이 프로젝트의 소스코드는 [MIT License](LICENSE)에 따라 자유롭게 사용 및 수정할 수 있습니다. (단, 블로그 내 작성된 오리지널 아티클 텍스트 및 이미지 저작권은 NaRD에게 있습니다.)
