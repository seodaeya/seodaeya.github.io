---
category: "Dev & Software"
title: "Giscus 댓글 오류 해결: discussion 생성 실패 탈출기"
date: "2026-07-07"
image: "/images/giscus_guide_thumbnail.jpg"
tags: ["Giscus", "GitHub Discussions", "Next.js", "Blog", "Troubleshooting"]
excerpt: "GitHub Pages 블로그에서 Giscus 댓글 위젯 연동 시 발생하는 저장소 권한 및 Discussions 카테고리 매핑 오류의 원인과 완전한 해결책을 정리합니다."
---
## 💬 Giscus 댓글 기능과 마주한 연동 오류

깃블로그(GitHub Pages)에 댓글 기능을 추가하기 위해 가장 많이 사용하는 도구 중 하나가 바로 <strong>Giscus</strong>입니다. Giscus는 GitHub Discussions를 기반으로 작동하여 정적 블로그에서도 데이터베이스 없이 깔끔하게 댓글을 관리할 수 있는 강력한 오픈소스 도구입니다.

이 글은 필자가 직접 운영하는 Next.js 정적 블로그(seodaeya.github.io)에 Giscus를 붙이면서 실제로 겪은 오류와 해결 과정을 그대로 기록한 것입니다. 공식 문서대로 설정했는데도 화면에 아래 오류가 표시되며 댓글창이 뜨지 않았습니다.

> ❌ <strong>giscus is not installed on this repository</strong>
> ❌ <strong>Unable to create discussion</strong>

본 포스트에서는 이 오류가 발생하는 핵심 원인과 함께, 현재 이 블로그에서 정상 동작 중인 실제 설정 코드(<strong>components/Comments.js</strong>)를 기준으로 단계별 해결 가이드를 정리합니다.

---

## 🔍 오류가 발생하는 3가지 핵심 원인

### 1. GitHub 저장소의 Discussions 기능 미활성화
Giscus는 댓글을 GitHub 저장소의 <strong>Discussions</strong>에 게시글 형태로 저장합니다. 따라서 연동하고자 하는 저장소의 Discussions 기능이 비활성화되어 있으면 Giscus가 댓글 데이터를 생성하거나 조회할 수 없습니다. 필자도 처음에는 코드만 붙이면 끝인 줄 알았는데, 저장소 설정에서 Discussions 체크박스가 꺼져 있어 첫 번째 오류를 만났습니다.

### 2. 저장소 고유 ID (<strong>data-repo-id</strong>)의 불일치
개발 중인 코드나 블로그 템플릿에 다른 사람의 설정이나 예시 코드가 그대로 남아 있는 경우, 실제 배포된 저장소의 ID와 코드 상의 <strong>data-repo-id</strong>가 달라 정상적으로 연동되지 않습니다. 저장소 이름(<strong>seodaeya/seodaeya.github.io</strong>)은 맞는데 ID가 예전 fork 출처 그대로인 경우가 대표적입니다.

### 3. 토론 카테고리 ID (<strong>data-category-id</strong>)의 불일치
저장소 ID가 달라지면 해당 저장소 내에 존재하는 토론 카테고리의 고유 ID(<strong>data-category-id</strong>) 역시 바뀝니다. 맞지 않는 카테고리 ID를 코드로 전달하면 <strong>"Unable to create discussion"</strong>이라는 오류창이 발생합니다. 필자의 경우 카테고리 이름은 <strong>General</strong>로 맞게 적었는데 ID가 다른 저장소 것이어서 이 오류를 겪었습니다.

---

## 🛠️ 해결 프로세스: 단계별 조치 가이드

### 단계 1: GitHub 저장소에서 Discussions 활성화하기
1. 댓글을 연동할 GitHub 저장소(예: <strong>seodaeya/seodaeya.github.io</strong>) 페이지로 이동합니다.
2. 상단 메뉴에서 <strong>Settings (설정)</strong> 탭을 클릭합니다.
3. <strong>General</strong> 화면에서 스크롤을 내려 <strong>Features</strong> 섹션을 찾습니다.
4. <strong>Discussions</strong> 항목의 체크박스를 찾아 <strong>체크(활성화)</strong>해 줍니다.

### 단계 2: giscus GitHub App 권한 관리
1. <a href="https://github.com/apps/giscus" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; font-weight: 600;">giscus GitHub App 설정 페이지 (↗)</a>로 이동합니다.
2. <strong>Configure</strong> 버튼을 클릭하여 본인의 계정을 선택합니다.
3. <strong>Repository access</strong> 설정에서 <strong>Only select repositories</strong>를 선택하고, 연동할 블로그 저장소를 추가한 뒤 <strong>Save</strong>를 누릅니다.
4. 저장소 <strong>Settings \➔ Discussions</strong>에서 댓글용 카테고리(예: <strong>General</strong>)가 존재하고 잠겨 있지 않은지 확인합니다.

### 단계 3: 정확한 Repo ID 및 Category ID 발급받기
1. <a href="https://giscus.app/ko" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; font-weight: 600;">giscus.app 설정 도우미 (↗)</a> 사이트에 접속합니다.
2. <strong>저장소</strong> 섹션에 본인의 저장소 경로(예: <strong>seodaeya/seodaeya.github.io</strong>)를 입력합니다.
3. 입력 후 저장소가 올바르게 설치되었다는 메시지가 뜨면, 하단의 <strong>토론 카테고리</strong>에서 사용하고자 하는 카테고리(예: <strong>General</strong>)를 선택합니다.
4. 아래 <strong>giscus 추가</strong> 섹션에 생성된 스크립트 코드에서 <strong>data-repo-id</strong>와 <strong>data-category-id</strong>를 각각 복사합니다.
5. <strong>매핑(mapping) 방식</strong>도 이때 함께 정합니다. 글 주소(pathname)별로 토론을 따로 만들지, 전체에서 하나로 합칠지 결정하는 것으로, 아래 표를 참고하세요.

| 매핑 방식 | 토론 생성 기준 | 추천 상황 |
| :--- | :--- | :--- |
| <strong>pathname</strong> | 글 URL 경로별 1개 | <strong>일반 블로그 (글마다 댓글 분리, 권장)</strong> |
| <strong>url</strong> | 전체 URL별 1개 | 쿼리스트링까지 구분하고 싶을 때 |
| <strong>title</strong> | 글 제목별 1개 | 제목이 절대 안 바뀐다는 보장이 있을 때 |
| <strong>og:title</strong> | OG 메타 제목별 1개 | 소셜 공유 제목 기준으로 묶고 싶을 때 |

> 💡 <strong>필자의 선택</strong><br />
> 이 블로그는 글마다 독립된 댓글 스레드가 필요하므로 <strong>pathname</strong>을 사용합니다. 제목을 나중에 고쳐도 댓글이 유지되는 것이 가장 큰 이유입니다.

### 단계 4: 코드 수정 및 재배포
1. 블로그 소스 코드의 Giscus 설정 파일(예: <strong>components/Comments.js</strong>)을 엽니다.
2. 방금 복사한 올바른 ID 값들을 복사하여 붙여넣고 저장합니다.
3. 코드 변경 사항을 커밋하고 푸시하여 재배포합니다.
4. 배포 완료 후 브라우저 캐시를 지운 뒤(<strong>Cmd + Shift + R</strong> 또는 <strong>Ctrl + F5</strong>) 확인합니다.

---

## 🧩 실전 적용: 이 블로그의 Comments.js 완전 해부

이론이 아니라 실제로 동작 중인 코드를 보는 것이 가장 빠릅니다. 아래는 이 블로그에서 지금도 댓글을 렌더링하는 <strong>components/Comments.js</strong>의 핵심 부분입니다.

```js
const script = document.createElement('script');
script.src = 'https://giscus.app/client.js';
script.async = true;
script.crossOrigin = 'anonymous';

// Giscus 설정 파라미터 (저장소와 토론을 연동)
script.setAttribute('data-repo', 'seodaeya/seodaeya.github.io');
script.setAttribute('data-repo-id', 'R_kgDOI6eCxw');
script.setAttribute('data-category', 'General');
script.setAttribute('data-category-id', 'DIC_kwDOI6eCx84DAshV');

script.setAttribute('data-mapping', 'pathname');
script.setAttribute('data-strict', '0');
script.setAttribute('data-reactions-enabled', '1');
script.setAttribute('data-emit-metadata', '0');
script.setAttribute('data-input-position', 'bottom');
script.setAttribute('data-theme', giscusTheme);
script.setAttribute('data-lang', 'ko');
script.setAttribute('data-loading', 'lazy');
```

위 코드에서 초보자가 놓치기 쉬운 포인트 4가지를 짚어 보겠습니다.

* <strong>data-strict = 0:</strong> 매핑 토론이 없을 때 엄격 모드(1)면 오류를 띄우지만, 0이면 새 토론을 자동 생성합니다. 첫 댓글을 허용하려면 반드시 <strong>0</strong>이어야 합니다. 이 값이 1이면 <strong>Unable to create discussion</strong>과 유사한 증상이 납니다.
* <strong>data-theme 동적 주입:</strong> 이 블로그는 다크·라이트 테마를 지원하므로, <strong>document.documentElement.classList</strong>를 읽어 테마에 맞는 Giscus 테마를 주입합니다. 고정값(<strong>dark</strong>)을 박아두면 라이트 모드에서 댓글창이 검게 남아 어색해집니다.
* <strong>data-lang = ko:</strong> 댓글 입력창 placeholder와 버튼이 한국어로 표시됩니다. 한국어 블로그라면 체감 완성도가 확 올라갑니다.
* <strong>data-loading = lazy:</strong> 댓글이 화면에 보일 때 로딩하므로 초기 페이지 속도에 영향을 주지 않습니다.

---

## ⚠️ 그래도 안 된다면: 추가 함정 4가지

위 4단계를 다 했는데도 댓글창이 안 뜨면 아래를 순서대로 점검하세요. 필자가 커뮤니티 답변을 뒤지며 모은, 문서에 잘 안 나오는 함정들입니다.

| 증상 | 원인 | 해결 |
| :--- | :--- | :--- |
| <strong>프라이빗 저장소인데 댓글 불가</strong> | Giscus는 공개 저장소의 Discussions만 지원 | <strong>저장소를 Public으로 전환</strong> (프라이빗은 지원 불가) |
| <strong>카테고리가 있는데 생성 실패</strong> | 해당 카테고리가 읽기 전용(Announcement 잠금 등) | <strong>General 같은 쓰기 가능 카테고리</strong>로 변경 |
| <strong>광고 차단기 켜면 댓글창 공백</strong> | uBlock 등이 <strong>giscus.app</strong> 스크립트 차단 | <strong>차단 예외 등록 후 새로고침</strong>으로 교차 확인 |
| <strong>배포 후에도 옛날 ID로 동작</strong> | 정적 호스팅 캐시·Service Worker 잔재 | <strong> 강력 새로고침 + 재배포 확인</strong> 후 <strong>5\~10분 대기</strong> |

---

## ❓ 자주 묻는 질문

<strong>Q1. data-repo-id는 어디서 확인하나요?</strong><br />
A. <strong>giscus.app</strong>에 저장소 경로를 입력하면 자동으로 채워집니다. 직접 API로 조회할 수도 있지만, 설정 도우미가 발급해 주는 값을 그대로 쓰는 것이 가장 정확합니다.

<strong>Q2. 댓글 데이터를 백업할 수 있나요?</strong><br />
A. 댓글은 GitHub Discussions에 그대로 쌓이므로, 저장소를 fork·clone하면 토론 내역까지 함께 이전됩니다. 별도 DB 백업이 필요 없는 것이 Giscus의 가장 큰 장점입니다.

<strong>Q3. 익명 댓글을 허용할 수 있나요?</strong><br />
A. 구조상 불가능합니다. Giscus는 GitHub 계정 로그인이 필수이며, 이는 스팸 방지에 큰 도움이 됩니다. 대신 진입 장벽이 있으므로 댓글 참여율은 낮아질 수 있습니다.

<strong>Q4. utterances와 무엇이 다른가요?</strong><br />
A. utterances는 Issues 기반, Giscus는 Discussions 기반입니다. Giscus가 반응(이모지), 다국어, 테마, lazy 로딩 등 기능이 풍부하고 유지보수도 활발하여 신규 블로그에는 Giscus를 권장합니다.

---

## 💡 요약 및 마무리

Giscus 연동 시 발생하는 오류는 대부분 <strong>저장소 설정의 Discussions 활성화 누락</strong>과 <strong>코드 상의 고유 키 값 오기입</strong>으로 인해 발생합니다. 위의 가이드에 따라 하나씩 확인해 보신다면 누구나 쉽게 깃블로그에 댓글 기능을 정상 탑재하실 수 있습니다.

필자의 경우 3가지 원인을 순서대로 점검하는 데 <strong>30분 남짓</strong>이 걸렸고, 그중 가장 오래 헤맨 것은 카테고리 ID 불일치였습니다. 이름(<strong>General</strong>)만 보고 맞다고 착각했기 때문입니다. <strong>이름이 아니라 ID를 대조</strong>한다는 한 문장만 기억하셔도 이 글의 목적은 달성된 셈입니다.

블로그 방문자들과 활발하게 소통해 보세요!

---

### 🔗 연관 아티클 & 공식 링크 바로가기
* <strong>Giscus 공식 설정 도우미:</strong> <a href="https://giscus.app/ko" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; font-weight: 600;">giscus.app에서 Repo ID 발급받기 (공식 ↗)</a>
* <strong>관련 글:</strong> <a href="/posts/20260822-1-github-pages-url-slug-seo-redirection" style="color: #38bdf8; font-weight: 600;">GitHub Pages 블로그 URL 슬러그 개편과 SEO 리디렉션 완벽 가이드 (↗)</a>
