---
category: "AI & Intelligence"
title: "가족 일정 관리 서비스와 구글 캘린더 API 연동 완벽 가이드"
date: "2026-10-25"
image: "/images/family_planner_google_calendar_api_thumbnail.jpg"
tags: ["FamilyPlanner", "GoogleCalendarAPI", "Gemini", "OAuth2", "LocalFirst", "NextJS", "GoogleCloud"]
excerpt: "제미나이로 정리한 가정 통신문을 일정과 준비물로 나누고 양방향으로 연결하는 로컬 우선 가족 일정 관리 서비스 구축기와, Google Cloud 콘솔에서 구글 캘린더 API를 활성화하고 연동하는 전 과정을 상세히 정리합니다."
---

## 👨‍👧‍👦 1. 왜 '가족 일정 관리' 서비스를 직접 만들었나

세 아이를 키우다 보면 학교·유치원 가정통신문, 학급 알림장, 현장체험학습 안내문이 매주 쏟아집니다. 달력에 일정을 적어두더라도 정작 당일 아침이 되면 <strong>"오늘 반 티 입는 날이었나?"</strong>, <strong>"도시락이랑 돗자리는 어느 일정 준비물이었지?"</strong> 하며 허둥대기 일쑤입니다.

기존 캘린더 앱과 할 일(To-Do) 앱을 따로 쓰면서 느낀 한계는 명확했습니다.

1. <strong>일정과 준비물의 단절</strong>: 캘린더에는 '가을 숲 현장체험학습' 일정만 적혀 있고, 할 일 앱에는 '운동화', '단체 티', '도시락', '식수'가 맥락 없이 나열됩니다. 일정 카드 안에서 준비물을 바로 체크하거나, 준비물에서 어떤 일정 때문인지 역추적하기가 번거로웠습니다.
2. <strong>가족 프라이버시와 서버 비용</strong>: 아이들의 학교·학급 일정과 준비물 데이터를 외부 서드파티 DB 서버에 저장하고 싶지 않았고, 누구나 로그인이나 설치 없이도 브라우저에서 즉시 쓸 수 있어야 했습니다.

그래서 <strong>모든 데이터는 사용자의 브라우저(`localStorage`)에만 저장하면서, AI로 안내문을 구조화하고 일정과 준비물을 양방향으로 연결한 뒤 내 구글 캘린더로 바로 보낼 수 있는 '가족 일정 관리' 서비스([/planner/](/planner/))</strong>를 구축했습니다.

> 🔗 <strong>서비스 바로가기</strong>: 상단 메뉴의 <strong>[실험 서비스 ➔ 📅 가족 일정 관리](/planner/)</strong>에서 회원가입이나 설치 없이 무료로 사용할 수 있습니다.

---

## 🔗 2. '가족 일정 관리' 핵심 기능: AI 구조화와 양방향 연결 UX

<strong>가족 일정 관리([/planner/](/planner/))</strong>는 <strong>"안내문 붙여넣기 ➔ 일정·준비물 자동 분리 ➔ 양방향 연결·해제 ➔ 구글 캘린더 동기화 및 백업"</strong>의 흐름으로 동작합니다.

### 1) 제미나이(Gemini) 정리 내용 붙여넣기 (`[가져오기]` 탭)

가정통신문이나 알림장 글을 <strong>[가져오기]</strong> 탭에 내장된 프롬프트와 함께 제미나이(Gemini)에 전달하면, 일정과 준비물·할 일·장보기 목록이 구조화된 JSON(또는 텍스트)으로 정리됩니다. 이를 복사해 붙여넣으면 일정(`events`)과 항목(`items`)을 자동으로 분리하고 관련 일정에 즉시 연결해 줍니다.

### 2) 일정 ↔ 준비물·할 일 양방향(Bi-directional) 연결 및 해제

실제 사용하면서 가장 편리하도록 개선한 핵심 기능은 <strong>일정 화면과 할 일·준비물 화면 양쪽 어디서든 즉시 연결하고 끊을 수 있는 양방향 인터페이스</strong>입니다.

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin: 24px 0; align-items: start;">
  <div style="text-align: center;">
    <img
      src="/images/family_planner_event_linked_items.png"
      alt="일정 상세 화면에서 연결된 준비물·할 일 관리 및 빠른 추가"
      width="323"
      height="1024"
      style="max-width: 280px; width: 100%; height: auto; border-radius: 14px; border: 1px solid var(--border-glass); box-shadow: 0 8px 28px rgba(0,0,0,0.32);"
      loading="lazy"
    />
    <p style="margin-top: 8px; font-size: 0.8rem; color: var(--text-secondary);">▲ ① 일정 화면: 연결된 준비물 확인·해제 및 인라인 즉시 추가</p>
  </div>
  <div style="text-align: center;">
    <img
      src="/images/family_planner_item_linked_event.png"
      alt="할 일·준비물 상세 화면에서 연결된 일정 확인 및 이동"
      width="477"
      height="1024"
      style="max-width: 280px; width: 100%; height: auto; border-radius: 14px; border: 1px solid var(--border-glass); box-shadow: 0 8px 28px rgba(0,0,0,0.32);"
      loading="lazy"
    />
    <p style="margin-top: 8px; font-size: 0.8rem; color: var(--text-secondary);">▲ ② 항목 수정 화면: 연결된 일정 배지, ✕ 해제, 연결된 일정 보기</p>
  </div>
  <div style="text-align: center;">
    <img
      src="/images/family_planner_supply_list_badges.png"
      alt="준비물 목록 화면에서 각 항목에 표시된 연결 일정 배지"
      width="477"
      height="1024"
      style="max-width: 280px; width: 100%; height: auto; border-radius: 14px; border: 1px solid var(--border-glass); box-shadow: 0 8px 28px rgba(0,0,0,0.32);"
      loading="lazy"
    />
    <p style="margin-top: 8px; font-size: 0.8rem; color: var(--text-secondary);">▲ ③ 준비물 목록 화면: 항목별 일정 배지 클릭 이동 및 즉시 연결</p>
  </div>
</div>

- <strong>일정 화면에서 (Event ➔ Items)</strong>:
  - 일정을 추가·수정하는 폼과 각 일정 카드 내부의 <strong>`🔗 연결된 준비물 · 할 일`</strong> 영역에서 연결된 항목을 바로 체크하거나 <strong>`연결 해제`</strong> 버튼으로 즉시 끊을 수 있습니다.
  - <strong>`+ 기존 항목 연결`</strong> 드롭다운으로 미연결 항목(또는 다른 일정에 묶인 항목)을 가져와 연결할 수 있고, 하단의 <strong>인라인 빠른 추가 바</strong>에서 분류(`준비물` / `할 일` / `장보기`)와 마감일을 지정해 새 항목을 그 자리에서 바로 만들어 묶을 수 있습니다.
- <strong>할 일·준비물 화면에서 (Item ➔ Event)</strong>:
  - 각 항목에 표시되는 <strong>`🔗 일정 제목`</strong> 배지를 누르면 해당 일정으로 즉시 이동(<strong>`연결된 일정 보기 >`</strong>)하며, 배지 우측의 <strong>`✕`</strong> 버튼 하나로 수정 창을 열지 않고도 연결을 바로 해제할 수 있습니다.
  - 연결되지 않은 독립 항목은 목록 행의 <strong>`+ 일정 연결`</strong> 셀렉트 박스에서 원클릭으로 원하는 일정에 연결됩니다.

---

## ☁️ 3. Google Calendar API 활성화 과정 (Google Cloud Console)

정리한 가족 일정을 스마트폰 기본 캘린더나 가족 구글 캘린더에서 알림과 함께 받아보려면 <strong>Google Calendar API</strong>를 활성화해야 합니다. 제미나이 정리 문서([구글 캘린더 API 사용 설정 방법](https://share.gemini.google/PXvaIljL2HhB))와 실제 Google Cloud 콘솔 설정 화면을 기준으로 전체 활성화 절차를 정리합니다.

### 단계 1: Google Cloud 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속하여 구글 계정으로 로그인합니다.
2. 좌측 상단의 프로젝트 선택 드롭다운을 클릭한 뒤 우측 상단의 <strong>[새 프로젝트(New Project)]</strong>를 클릭합니다.
3. 프로젝트 이름(예: `family-planner`)을 입력하고 <strong>[만들기]</strong>를 클릭한 후 생성된 프로젝트를 선택합니다. (무료 쿼터 내에서 동작하므로 결제 계정을 연결할 필요가 없습니다.)

### 단계 2: 라이브러리에서 Google Calendar API 활성화 (`Enable`)

1. 좌측 탐색 메뉴(☰)에서 <strong>[APIs & Services(API 및 서비스)] ➔ [Library(라이브러리)]</strong>로 이동합니다.
2. 검색창에 `Google Calendar API`를 입력하고 검색 결과를 클릭합니다.
3. 아래와 같이 제품 상세(Product details) 화면이 나타나면 파란색 <strong>`Enable`</strong> 버튼을 클릭합니다.

<div style="margin: 24px 0; text-align: center;">
  <img
    src="/images/google_calendar_api_enable.png"
    alt="Google Cloud Console에서 Google Calendar API Enable 버튼 클릭 화면"
    width="1024"
    height="483"
    style="max-width: 680px; width: 100%; height: auto; border-radius: 12px; border: 1px solid var(--border-glass); box-shadow: 0 8px 30px rgba(0,0,0,0.35);"
    loading="lazy"
  />
  <p style="margin-top: 10px; font-size: 0.82rem; color: var(--text-secondary);">▲ Google Cloud Console 라이브러리에서 Google Calendar API를 선택하고 Enable을 클릭하는 화면</p>
</div>

활성화가 완료되면 <strong>[API/Service Details]</strong> 화면으로 전환되며, 서비스 이름(`calendar-json.googleapis.com`), 유형(`Public API`), 그리고 상태가 <strong>`Status: Enabled`</strong>로 활성화된 것을 확인할 수 있습니다.

<div style="margin: 24px 0; text-align: center;">
  <img
    src="/images/google_calendar_api_enabled_status.png"
    alt="Google Calendar API가 Enabled 상태로 활성화된 상세 화면"
    width="1024"
    height="284"
    style="max-width: 740px; width: 100%; height: auto; border-radius: 12px; border: 1px solid var(--border-glass); box-shadow: 0 8px 30px rgba(0,0,0,0.35);"
    loading="lazy"
  />
  <p style="margin-top: 10px; font-size: 0.82rem; color: var(--text-secondary);">▲ Google Calendar API(`calendar-json.googleapis.com`)가 정상 활성화된 상태(Status: Enabled)</p>
</div>

### 단계 3: 서비스 형태에 맞는 인증 정보(Credentials) 선택

API를 활성화했다면 좌측 메뉴의 <strong>[OAuth consent screen(OAuth 동의 화면)]</strong>과 <strong>[Credentials(사용자 인증 정보)]</strong>에서 서비스 구조에 맞는 인증 방식을 선택합니다.

| 인증 방식 | 주요 용도 | 설정 및 발급 방법 |
| :--- | :--- | :--- |
| <strong>OAuth 클라이언트 ID</strong><br />(웹 `/planner/` 채택 방식) | 정적 웹·모바일 앱에서 <strong>사용자가 본인 구글 계정으로 로그인</strong>해 자기 캘린더에 일정을 보낼 때 | 1. <strong>OAuth 동의 화면</strong>: `External` 선택, 최소 권한 스코프(`calendar.app.created`) 추가, 가족 계정을 테스트 사용자로 등록<br />2. <strong>OAuth 클라이언트 ID</strong>: `웹 애플리케이션` 선택 후 승인된 JavaScript 출처(`https://seodaeya.github.io`, `http://localhost:4173`) 등록 |
| <strong>서비스 계정 (Service Account)</strong><br />(홈 허브 `우리집 AI` 채택 방식) | 로그인 창 없이 <strong>홈 서버나 백엔드 데몬</strong>이 특정 공유 캘린더에 자동 접근해 일정을 양방향 관리할 때 | 1. 서비스 계정 생성 후 <strong>Keys 탭 ➔ Add Key ➔ JSON</strong> 다운로드<br />2. 구글 캘린더 웹의 <strong>[설정 및 공유]</strong>에서 서비스 계정 이메일(`...@...iam.gserviceaccount.com`)에 <strong>일정 변경 권한</strong> 부여 |
| <strong>API 키 (API Key)</strong> | 전체 공개(Public) 설정된 캘린더의 일정을 <strong>단순 조회(읽기 전용)</strong>만 할 때 | 1. API 키 문자열 발급<br />2. 키 제한 설정에서 지정된 웹사이트/IP 및 `Google Calendar API`만 호출하도록 제한 |

---

## 🛠️ 4. 가족 일정 관리(`/planner/`)의 구글 캘린더 연동 아키텍처

블로그의 <strong>가족 일정 관리([/planner/](/planner/))</strong>는 별도의 백엔드 서버가 없는 정적(Static) 웹 서비스입니다. 서버나 데이터베이스 없이도 안전하게 구글 캘린더와 연동하기 위해 <strong>① 브라우저 직결 OAuth 2.0 자동 동기화</strong>와 <strong>② 로그인 없는 수동 링크·ICS 내보내기</strong>를 모두 지원하도록 설계했습니다.

### 1) 최소 권한 스코프(`calendar.app.created`)로 기존 개인 캘린더 보호

일반적인 캘린더 연동 앱은 사용자의 모든 기존 달력을 읽고 쓸 수 있는 광범위한 권한(`.../auth/calendar`)을 요구합니다. 반면 <strong>가족 일정 관리</strong>는 오직 하나의 최소 권한만 요청합니다.

```javascript
// lib/planner-google.js — 최소 권한 스코프 및 전용 보조 캘린더 설정
export const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/calendar.app.created';
export const GOOGLE_CALENDAR_SUMMARY = '우리집 AI';
export const GOOGLE_TIMEZONE = 'Asia/Seoul';
```

- `calendar.app.created` 스코프는 <strong>이 앱이 직접 생성한 보조 캘린더(`우리집 AI`)만</strong> 읽고 관리할 수 있습니다.
- 사용자의 기존 개인·업무 캘린더에는 접근조차 할 수 없으므로 권한 오남용이나 기존 일정 훼손 걱정이 없습니다.
- 처음 연결할 때 `ensurePlannerCalendar()`가 `우리집 AI` 보조 캘린더를 자동으로 생성하고, 그 `calendarId`를 로컬 메타데이터에 기억해 다음 동기화부터 재사용합니다.

### 2) 무서버 인메모리(In-Memory) 토큰 관리

Google Identity Services(`https://accounts.google.com/gsi/client`)의 Token Model을 사용하여 브라우저가 구글 API와 직접 통신합니다.

- 발급받은 `access_token`은 `localStorage`나 쿠키에 저장하지 않고 <strong>현재 탭의 메모리(`let token = null`)에만 보관</strong>합니다.
- 탭을 새로고침하거나 1시간 유효기간이 지나면 다시 토큰을 요청하며, <strong>[연결 해제]</strong>를 누르면 `oauth.revoke()`를 호출해 토큰을 즉시 폐기합니다. 이때도 구글 캘린더에 이미 올라간 일정은 삭제되지 않고 안전하게 유지됩니다.

### 3) 연결된 준비물·할 일 본문 자동 포함 및 중복 생성 방지 (`iCalUID`)

일정을 구글 캘린더로 보낼 때 단순히 제목과 시간만 보내는 것이 아니라, <strong>그 일정에 연결된 `준비물` · `할 일` · `장보기` 목록을 카테고리별로 묶어 구글 캘린더 일정 설명(`description`)에 자동으로 넣어줍니다.</strong>

```javascript
// lib/planner-model.js — 일정 메모와 연결된 준비물·할 일을 캘린더 본문으로 조합
export function buildEventDescription(event, items = []) {
  if (!event) return '';
  const blocks = [];
  if (event.memo) blocks.push(String(event.memo).trim());

  const groups = [
    ['supply', '준비물'],
    ['todo', '할 일'],
    ['shopping', '장보기'],
  ];
  const lines = [];
  for (const [type, label] of groups) {
    const rows = (items || []).filter((item) => item && item.listType === type);
    if (!rows.length) continue;
    lines.push(`[${label}]`);
    for (const item of rows) {
      const qty = item.qty ? ` (${item.qty})` : '';
      const done = item.done ? ' ✓' : '';
      const due = item.dueAt ? ` · ${item.dueAt}까지` : '';
      lines.push(`- ${item.title}${qty}${done}${due}`);
    }
  }
  if (lines.length) blocks.push(['연결된 준비물·할 일', ...lines].join('\n'));
  return blocks.join('\n\n').slice(0, 8000);
}
```

또한 각 일정은 고유한 `googleEventId`와 `googleSyncedAt` 타임스탬프를 유지합니다.

- <strong>`전송됨(synced)`</strong>: 마지막 전송 이후 수정 사항이 없는 상태입니다.
- <strong>`변경됨(changed)`</strong>: 일정을 수정했거나 연결된 준비물이 바뀐 상태로, <strong>`구글 반영`</strong>(또는 `전체 동기화`)을 누르면 새 일정을 중복 생성하는 대신 기존 구글 일정을 `PATCH`로 깔끔하게 덮어씁니다. (만약 구글 웹에서 해당 일정을 수동 삭제해 `404`가 반환되면 자동으로 다시 `POST` 생성하여 복구합니다.)
- API 전송(`iCalUID`)과 `.ics` 파일 내보내기(`UID`) 모두 `planner-${event.id}@seodaeya.github.io`라는 동일한 식별자를 사용하므로, 두 방식을 혼용해도 일정이 이중으로 생기지 않습니다.

### 4) 50% 쿼터 안전 브레이크 (`GOOGLE_DAILY_LIMIT`)

정적 사이트에서 실수로 무한 루프나 과도한 API 호출이 발생하는 것을 막기 위해, 브라우저별로 Google 공식 무료 한도의 <strong>50%(일일 500,000회, 분당 300회)</strong>에 도달하면 자동으로 요청을 멈추는 안전장치를 내장했습니다. <strong>[구글]</strong> 탭의 프로그레스 바에서 오늘 사용한 API 호출 횟수와 비율을 실시간으로 확인할 수 있습니다.

### 5) 환경변수 및 GitHub Actions 배포 설정

발급받은 OAuth 웹 클라이언트 ID(공개 식별자)는 아래 두 곳에 등록해 활성화합니다.

- <strong>로컬 개발 환경</strong>: 프로젝트 루트의 `.env.local` 파일에 추가
  ```bash
  NEXT_PUBLIC_GOOGLE_CLIENT_ID=발급받은값.apps.googleusercontent.com
  ```
- <strong>GitHub Pages 배포 환경</strong>: GitHub 저장소의 <strong>[Settings ➔ Secrets and variables ➔ Actions ➔ Variables]</strong>에 `GOOGLE_CLIENT_ID` 변수를 등록하면 배포 워크플로가 빌드 시점에 `NEXT_PUBLIC_GOOGLE_CLIENT_ID`로 자동 주입합니다.

> 💡 <strong>참고 (홈 허브 `우리집 AI`의 서비스 계정 + macOS 키체인 방식)</strong><br />
> 집 안의 맥(Mac)에서 24시간 돌아가는 가족 허브 서버(`family-hub-with-ai`)에서는 브라우저 로그인 팝업 대신 <strong>서비스 계정(Service Account)</strong> 방식을 사용합니다. 이때는 발급받은 JSON 키를 디스크나 `.env`에 두지 않고 macOS 시스템 키체인(`/usr/bin/security` — `family-hub-google`)에 암호화 등록(`npm run google:setup`)한 뒤, Node.js 내장 `crypto`로 RS256 JWT를 직접 서명하고 `syncToken` 증분 Pull과 `If-Match`(`ETag`) 충돌 제어로 양방향 동기화를 수행합니다.

---

## ✅ 5. 요약 및 활용 팁

1. <strong>안내문 정리부터 준비물 연결까지 한곳에서</strong>: [<strong>📅 가족 일정 관리 (/planner/)</strong>](/planner/)에서 제미나이로 정리한 가정통신문을 붙여넣고, 일정 화면과 할 일·준비물 화면 양쪽에서 자유롭게 연결·해제하며 빠짐없이 챙길 수 있습니다.
2. <strong>구글 캘린더에 준비물까지 함께 전송</strong>: 일정에 연결해 둔 준비물·할 일 목록이 구글 캘린더 일정 설명란에 자동으로 포함되어, 스마트폰 기본 달력 알림만 열어도 챙겨야 할 준비물을 즉시 확인할 수 있습니다.
3. <strong>3단계 연동 옵션 지원</strong>:
   - <strong>구글 OAuth 연결 (`[구글]` 탭)</strong>: `우리집 AI` 전용 보조 캘린더에 원클릭 생성·수정 동기화
   - <strong>일정별 `구글` 링크</strong>: 로그인 없이 구글 캘린더 등록 창(`action=TEMPLATE`) 즉시 열기
   - <strong>`ICS 내보내기` & `JSON 백업` (`[백업]` 탭)</strong>: 전체 일정을 `.ics` 표준 캘린더 파일이나 JSON 파일로 언제든 백업 및 복원
