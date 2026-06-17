# Seodaeya's Blog

이 프로젝트는 [Next.js](https://nextjs.org)를 기반으로 한 개인 블로그 및 유튜브 채널 연동 아카이브 웹사이트입니다. 최신 글, 카테고리별 글, 동영상 등을 관리하고 표시할 수 있는 기능을 제공하며, SEO 및 AI 검색 엔진 크롤러에 최적화되어 있습니다.

## 주요 기능

- **최신 글 및 동영상 홈 화면 표시**: 홈 화면에서 블로그 아티클과 유튜브 쇼츠/영상을 분리 및 연동하여 직관적으로 배치.
- **최신 디자인 트렌드 적용**: 글래스모피즘(Glassmorphism) 효과, 다크 슬레이트 & 네온 그라디언트 테마, 세련된 웹 폰트 적용.
- **카테고리별 글 관리**: 카테고리 태그 및 뱃지를 통해 글과 동영상을 분리 조회.
- **SEO & AI 최적화**:
  - `JSON-LD Structured Data` 지원 (`BlogPosting`, `VideoObject`, `Person`, `WebSite`)
  - AI 크롤러 허용 정책 및 사이트맵 자동 생성 기능 (`sitemap.xml`, `robots.txt`)
  - 각 포스트 상세 페이지 상단에 **AI Key Summary (요약 박스)** 제공.
- **Markdown 지원**: Markdown 파일을 기반으로 간편하게 포스팅 업로드 및 파싱.
- **반응형 디자인**: 모바일, 태블릿, PC 등 모든 디바이스에서 최적화된 유연한 UI 제공.

## 디렉토리 구조

```plaintext
seodaeya.github.io
├── files/                  # Markdown 파일 및 JSON 데이터 저장
│   ├── posts/              # 블로그 글 Markdown 파일
│   ├── videos/             # 동영상 관련 Markdown 파일
│   ├── gen/                # 데이터 생성 스크립트
│   │   ├── generate-categories.js
│   │   ├── generate-latest-posts.js
│   │   ├── generate-sitemap.js
│   ├── categories.json     # 카테고리별 글 데이터
│   ├── latest-posts.json   # 최신 글 데이터
├── pages/                  # Next.js 페이지
│   ├── _app.js             # 공통 앱 레이아웃 및 애드센스 탑재
│   ├── index.js            # 홈 페이지 (유튜브 쇼룸 및 최근 피드)
│   ├── categories/         # 카테고리별 글 목록 페이지
│   ├── posts/              # 개별 글 상세 페이지 (AI 요약 박스 탑재)
│   ├── videos/             # 동영상 상세 페이지 (임베드 비디오 플레이어 탑재)
├── components/             # 공통 컴포넌트
│   ├── Layout.js           # 레이아웃 셸 컴포넌트
│   ├── Header.js           # 글래스모피즘 상단 고정 네비게이션
│   ├── Footer.js           # 사이트 하단 정보 및 채널 연동 푸터
│   ├── SEO.js              # 동적 메타 태그 및 JSON-LD 스키마 주입기
├── styles/                 # CSS 스타일 (CSS Modules)
│   ├── globals.css         # 전역 HSL 색상 및 유틸리티 테마 스타일
│   ├── layout.module.css   # 헤더/푸터/레이아웃 모듈 CSS
│   ├── home.module.css     # 홈 및 카드 컴포넌트 모듈 CSS
│   ├── post.module.css     # 포스트 본문 및 테이블 모듈 CSS
│   ├── video.module.css    # 비디오 페이지 및 버튼 모듈 CSS
├── public/                 # 정적 에셋 파일 (favicon.ico, na_rd.jpeg, robots.txt, sitemap.xml)
├── README.md               # 프로젝트 설명 파일
```

## 실행 및 빌드 방법

### 개발 서버 실행

아래 명령어를 실행하여 로컬 개발 서버를 시작합니다:

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 개발 화면을 확인할 수 있습니다.

### 데이터 및 사이트맵 자동 생성 빌드

블로그 포스트나 비디오 마크다운 파일을 추가 및 수정한 뒤 사이트를 배포할 때는 아래 빌드 명령어를 실행합니다. 빌드 스크립트 실행 시 **카테고리, 최신 글 메타, 사이트맵이 자동으로 빌드 직전에 갱신**됩니다:

```bash
npm run build
```

정적 사이트 산출물은 `out/` 폴더에 생성됩니다.

---

## 🛠 향후 개선 과제 (TODO)

블로그의 확장성과 사용자 경험(UX)을 더욱 개선하기 위해 다음과 같은 기능을 향후 추가하는 것을 추천합니다.

### 1. 기능 개선 (Functional Improvements)
- [x] **실시간 검색 기능**: 메인 및 카테고리 페이지에 사용자가 키워드를 입력해 글과 영상을 실시간으로 필터링할 수 있는 클라이언트 사이드 검색바 추가.
- [ ] **댓글 기능 도입**: 블로그 포스팅 하단에 GitHub 계정과 연동할 수 있는 [Giscus](https://giscus.app/) 또는 [Utterances](https://utteranc.es/) 댓글 플러그인 탑재 (정적 사이트에서도 깔끔하게 구동 가능).
- [x] **자동 읽기 시간 계산 (Read Time)**: 마크다운 본문의 텍스트 길이를 세어 상단에 `소요 시간 약 3분` 등 읽는 데 걸리는 예상 시간을 자동으로 계산하여 출력.
- [x] **RSS 피드 생성 스크립트**: 사이트맵 생성 스크립트(`generate-sitemap.js`)와 동일한 방식으로 빌드 시 `feed.xml`을 자동 생성하여 외부 RSS 리더나 퍼블리싱 채널이 구독 가능하게 설정.

### 2. UI/UX 및 디자인 고도화
- [x] **다크/라이트 모드 토글**: 현재 프리미엄 다크 모드가 기본 적용되어 있으나, `next-themes` 라이브러리를 사용하여 사용자 기기 설정(System) 혹은 스위치를 통해 밝은 테마로 전환할 수 있는 기능 추가.
- [x] **페이지 전환 애니메이션**: Framer Motion 라이브러리를 탑재하여 헤더 메뉴 이동 시 부드러운 페이지 슬라이드나 페이드인(Fade-in) 전환 연출.
- [ ] **유튜브 API 연동**: 현재 마크다운의 비디오 ID 수동 작성 방식을 넘어, 빌드 시 유튜브 Data API를 호출하여 최신 업로드 영상 목록과 조회수, 제목 등을 직접 크롤링하여 동적으로 뿌려주는 스크립트 구축.

### 3. 성능 및 SEO 추가 최적화
- [ ] **이미지 최적화 (Next Image Loader)**: 현재 정적 내보내기(`output: export`) 환경에서는 Next.js 기본 Image 컴포넌트의 최적화 서버를 이용할 수 없습니다. Cloudinary 혹은 Akamai 같은 커스텀 이미지 로더를 설정하거나, 빌드 시 이미지를 포맷팅하여 성능 향상.
- [ ] **웹 성능 스코어 관리**: Lighthouse 점수 측정을 통해 접근성(Accessibility) 및 누적 레이아웃 이동(CLS) 스코어를 체크하고 CSS 최적화 유지.
