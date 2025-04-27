# Seodaeya's Blog

이 프로젝트는 [Next.js](https://nextjs.org)를 기반으로 한 개인 블로그입니다. 최신 글, 카테고리별 글, 동영상 등을 관리하고 표시할 수 있는 기능을 제공합니다.

## 주요 기능

- **최신 글 표시**: 최신 글 10개를 홈 화면에서 카드 형태로 표시.
- **카테고리별 글 관리**: 카테고리별로 글을 분류하고, 각 카테고리의 글 목록을 확인 가능.
- **동영상 관리**: YouTube 동영상을 포함한 콘텐츠를 표시.
- **Markdown 지원**: Markdown 파일을 기반으로 글과 동영상을 관리.
- **반응형 디자인**: 다양한 디바이스에서 최적화된 UI 제공.

## 디렉토리 구조

```plaintext
c:\Projects\others\seodaeya.github.io\
├── files\                  # Markdown 파일 및 JSON 데이터 저장
│   ├── posts\              # 블로그 글 Markdown 파일
│   ├── videos\             # 동영상 관련 Markdown 파일
│   ├── gen\                # 데이터 생성 스크립트
│   │   ├── generate-categories.js
│   │   ├── generate-latest-posts.js
│   ├── categories.json     # 카테고리별 글 데이터
│   ├── latest-posts.json   # 최신 글 데이터
├── pages\                  # Next.js 페이지
│   ├── index.js            # 홈 페이지
│   ├── categories\         # 카테고리별 글 목록 페이지
│   ├── posts\              # 개별 글 페이지
│   ├── videos\             # 동영상 페이지
├── components\             # 공통 컴포넌트
│   ├── Layout.js           # 레이아웃 컴포넌트
│   ├── Sidebar.js          # 사이드바 컴포넌트
├── styles\                 # CSS 스타일
│   ├── home.css            # 홈 페이지 스타일
│   ├── layout.css          # 레이아웃 스타일
│   ├── sidebar.css         # 사이드바 스타일
│   ├── post.css            # 글 페이지 스타일
├── public\                 # 정적 파일
├── README.md               # 프로젝트 설명 파일
```

## 실행 방법

### 개발 서버 실행

아래 명령어를 실행하여 개발 서버를 시작합니다:

```bash
npm run dev
# 또는
yarn dev
```

[http://localhost:3000](http://localhost:3000)에서 결과를 확인할 수 있습니다.

### 데이터 생성

Markdown 파일을 기반으로 `categories.json` 및 `latest-posts.json` 파일을 생성하려면 아래 스크립트를 실행하세요:

```bash
# 카테고리 데이터 생성
node files/gen/generate-categories.js

# 최신 글 데이터 생성
node files/gen/generate-latest-posts.js
```

## 주요 페이지

- **홈 페이지**: 최신 글 10개를 카드 형태로 표시.
- **카테고리 페이지**: 카테고리별로 글을 분류하여 표시.
- **글 페이지**: Markdown 파일을 기반으로 개별 글 표시.
- **동영상 페이지**: YouTube 동영상을 포함한 콘텐츠 표시.

## 사용된 기술

- **Next.js**: React 기반의 프레임워크로, 서버 사이드 렌더링(SSR) 및 정적 사이트 생성(SSG) 지원.
- **gray-matter**: Markdown 파일의 Frontmatter를 파싱하기 위한 라이브러리.
- **marked**: Markdown을 HTML로 변환하기 위한 라이브러리.
- **CSS**: 최신 블로그 스타일을 적용한 사용자 정의 CSS.

## 배포

이 프로젝트는 [Vercel](https://vercel.com)을 통해 배포할 수 있습니다. 배포 방법은 아래 문서를 참고하세요:

- [Next.js 배포 문서](https://nextjs.org/docs/app/building-your-application/deploying)

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.