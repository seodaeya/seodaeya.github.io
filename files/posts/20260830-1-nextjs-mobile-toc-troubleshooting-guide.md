---
category: "Dev & Software"
title: "Next.js 블로그 반응형 목차(TOC) 개발과 4단계 실전 트러블슈팅 가이드"
date: "2026-08-30"
excerpt: "Next.js 환경에서 데스크톱 사이드바와 모바일 플로팅 바텀시트 목차(TOC)를 구축하며 겪은 CSS 부모 트랩, Hydration 유령 노드(20/20 버그), 2초 스마트 자동 숨김 UX 최적화 과정을 상세히 기록합니다."
image: "/images/nextjs_mobile_toc_troubleshooting_thumbnail.jpg"
tags: ["Next.js", "React", "TOC", "Frontend", "Troubleshooting", "CSS", "createPortal", "requestAnimationFrame"]
---

## 📑 1. 모던 블로그에서 반응형 목차(TOC)가 필수적인 이유

긴 기술 <strong>아티클 (Article)</strong>을 읽을 때 독자가 가장 답답함을 느끼는 순간은 <strong>"내가 지금 전체 내용 중 어디를 읽고 있는지, 다음 주제는 무엇인지"</strong>를 놓쳤을 때입니다.

웹사이트의 <strong>목차(Table of Contents, TOC)</strong>는 독자에게 글의 전체 지도를 제공하는 핵심 내비게이션 도구입니다:

* <strong>PC 데스크톱 환경</strong>: 우측 여백에 본문과 나란히 고정되어 현재 스크롤 위치의 소제목을 하이라이트 표시하는 <strong>'스티키 사이드바(Sticky Sidebar)'</strong>가 가장 이상적입니다.
* <strong>모바일 환경</strong>: 좁은 스마트폰 화면에서 사이드바를 둘 수 없으므로, <strong>'우측 하단 플로팅 캡슐 배너 + 클릭 시 화면 아래에서 올라오는 바텀시트(Drawer Modal)'</strong> 형태가 글로벌 표준 UX입니다.

겉보기에는 단순해 보이는 UI이지만, Next.js 정적 사이트 생성(SSG) 환경에서 이를 완벽하게 동작하게 만들기까지는 <strong>4가지 치명적인 기술적 복병</strong>이 숨어 있었습니다. 본 글에서는 이 문제들을 해결해 나간 전 과정을 공유합니다.

---

## 🏗️ 2. 반응형 목차 아키텍처 및 요구사항 정의

구현하고자 한 반응형 목차의 핵심 요구사항은 다음과 같습니다:

```text
[ 반응형 목차(TOC) 핵심 스펙 ]

1. 본문 자동 파싱 : 마크다운에서 렌더링된 H2, H3 태그를 수집하여 목차 트리 자동 생성
2. PC 데스크톱 (1080px 이상) : 우측 sticky 사이드바에 상시 노출 및 현재 읽는 챕터 하이라이트
3. 모바일 (1080px 이하) :
   • 우측 하단에 엄지손가락 높이로 [📑 목차 1/N] 플로팅 캡슐 상시 유지
   • 터치 시 화면 전체 덮는 암전 오버레이와 함께 하단에서 바텀시트 서랍 드로어 등장
   • 원하는 소제목 터치 시 해당 위치로 부드러운 스크롤(Smooth Scroll) 이동 후 서랍 자동 닫힘
4. 성능 & UX 최적화 :
   • 60Hz/120Hz 고주사율 스크롤 쓰로틀링 (requestAnimationFrame)
   • 글을 빠르게 읽는 동안 시야를 가리지 않는 '2초 스마트 자동 숨김' 모드
```

---

## ⚠️ 3. [트러블슈팅 1] 모바일 플로팅 버튼이 댓글창 밑에 갇히는 현상 (CSS 부모 트랩)

### 1) 증상 (Symptom)
* 모바일 화면에서 목차 버튼이 브라우저 화면(Viewport) 우측 하단에 항상 떠서 따라다녀야 하는데, 글을 읽는 내내 보이지 않다가 <strong>글 맨 끝 댓글창(Giscus) 영역까지 다 내려가서야 댓글창 위에 덩그러니 놓여 있는 현상</strong>이 발생했습니다.

### 2) 근본 원인 (Root Cause)
* CSS 표준 명세에 따르면, `position: fixed` 요소는 기본적으로 브라우저 창(Viewport)을 기준으로 위치가 결정됩니다.
* 하지만 <strong>부모 컨테이너(예: `.layout`, `.postWrapper`)에 `overflow-x: clip`, `transform`, `filter`, `perspective`, 또는 `contain` 속성이 지정되어 있으면, `position: fixed`의 기준점이 브라우저 창이 아니라 '해당 부모 컨테이너'로 격리(Containment)</strong>됩니다.
* 그 결과, 버튼이 화면에 고정되지 못하고 부모 태그의 높이 끝자락에 갇혀버렸던 것입니다.

```text
[ CSS 부모 트랩 원리 (12세 청소년 비유) ]

"새(목차 버튼)에게 '하늘 높이 날아다녀라(position: fixed)'라고 명령했는데, 
알고 보니 새장이 닫힌 유리 상자(부모 컨테이너의 overflow: clip) 안에 갇혀 있던 것입니다. 
새는 날고 싶어도 유리 상자 바닥을 벗어날 수 없었습니다."
```

### 3) 해결책: React `createPortal` 최상위 마운트
React의 `createPortal`을 사용하여 모바일 플로팅 버튼과 바텀시트 모달을 부모 DOM 트리에서 완전히 탈출시켜 `document.body` 최상단에 직접 렌더링했습니다:

```jsx
import { createPortal } from 'react-dom';

// 부모 컨테이너의 CSS 제약을 100% 탈출하여 document.body에 직접 장착
const mobilePortalUI = mounted && createPortal(
  <>
    <button 
      type="button" 
      className={styles.mobileFloatingPill}
      onClick={() => setIsMobileOpen(true)}
    >
      <span className={styles.pillIcon}>📑</span>
      <span className={styles.pillText}>목차</span>
      <span className={styles.pillProgressBadge}>{progressText}</span>
    </button>

    {isMobileOpen && (
      <div className={styles.mobileTocOverlay}>
        <div className={styles.mobileTocDrawer}>
          {/* 바텀시트 목차 목록 */}
        </div>
      </div>
    )}
  </>,
  document.body
);
```

---

## ⚠️ 4. [트러블슈팅 2] 첫 화면부터 20/20으로 점프하는 버그 (Hydration 유령 노드)

### 1) 증상 (Symptom)
* 글 맨 위에서 읽기 시작하는데도 목차 뱃지에 `1/20`이 아니라 <strong>처음부터 마지막 번호인 `20/20`이 노출</strong>되었습니다.
* 1번 목차를 클릭해서 이동해도, 스크롤이 조금만 움직이면 다시 `20/20`으로 덮어씌워졌습니다.

### 2) 근본 원인 (Root Cause)
* Next.js는 마크다운 HTML을 `dangerouslySetInnerHTML`을 통해 본문에 주입합니다.
* 초기 구현에서는 컴포넌트가 마운트될 때 `container.querySelectorAll('h2, h3')`로 DOM 요소들을 찾아 `headingElements` 배열에 저장해 두었습니다.
* 하지만 <strong>React가 클라이언트 사이드 Hydration(동기화)을 수행하면서 본문의 DOM 노드들을 새 인스턴스로 교체</strong>했습니다!
* 기존 배열에 저장되어 있던 노드들은 메모리에서만 붕 떠 있는 <strong>'유령 노드(Detached Node)'</strong>가 되었고, `detachedNode.getBoundingClientRect()`를 호출하면 무조건 `{ top: 0, bottom: 0 }`을 반환했습니다.
* 스크롤 판정 로직인 `el.getBoundingClientRect().top <= 120`에서 모든 유령 노드가 `0 <= 120 (True)`로 평가되어, <strong>루프가 1번부터 20번까지 브레이크 없이 전부 통과하여 마지막 20번 목차로 덮어씌워졌던 것</strong>입니다.

```text
[ 유령 노드 버그 원리 (12세 청소년 비유) ]

"교실에 20명의 학생(목차)이 앉아있는데, 선생님이 '어제 찍은 옛날 단체 사진(이전 참조 배열)'만 보면서 
학생 자리를 체크하고 있었습니다. 사진 속 학생들은 모두 0번 자리에 있는 것으로 계산되어, 
선생님이 맨 마지막 20번 학생만 계속 부르고 있었던 것입니다."
```

### 3) 해결책: 실시간 `document.getElementById` 동적 조회
이전 참조 배열 대신, 매 스크롤마다 현재 화면에 실제로 살아있는 DOM 노드를 ID로 직접 조회하도록 수정했습니다:

```javascript
const activationOffset = 120;

const updateActiveHeading = () => {
  let active = headingList[0].id;

  for (const heading of headingList) {
    // 실시간으로 살아있는 현재 화면의 DOM 노드를 직접 조회하여 유령 노드 방지
    const el = document.getElementById(heading.id);
    if (!el) continue;

    if (el.getBoundingClientRect().top <= activationOffset) {
      active = heading.id;
    } else {
      break; // 현재 뷰포트 기준선 아래에 있는 제목을 만나면 즉시 루프 중단
    }
  }

  setActiveId((current) => (current === active ? current : active));
};
```

---

## ⚡ 5. [트러블슈팅 3] 스크롤 부하 방지 (requestAnimationFrame 쓰로틀링)

스크롤 이벤트는 사용자가 화면을 조금만 움직여도 1초에 수백 번씩 호출됩니다. 매 이벤트마다 `getBoundingClientRect()`를 호출하면 브라우저가 화면 레이아웃을 다시 계산(Reflow)하느라 모바일 기기에서 심한 버벅임(Jank)이 발생합니다.

이를 해결하기 위해 <strong>브라우저의 화면 주사율(60Hz/120Hz)에 맞추어 1프레임당 최대 1번만 연산하도록 `window.requestAnimationFrame`으로 래핑</strong>했습니다:

```javascript
let animationFrameId = null;

const scheduleActiveHeadingUpdate = () => {
  if (animationFrameId === null) {
    animationFrameId = window.requestAnimationFrame(() => {
      animationFrameId = null;
      updateActiveHeading();
    });
  }
};

window.addEventListener('scroll', scheduleActiveHeadingUpdate, { passive: true });
```

---

## 📱 6. [트러블슈팅 4] 독서 몰입을 위한 '2초 스마트 자동 숨김' UX 구현

### 1) 문제점
* 모바일 화면은 가로 폭이 360\~400px 수준으로 매우 좁습니다.
* 목차 버튼이 화면 우측 하단에 계속 떠 있으면, <strong>본문의 핵심 텍스트나 코드 블록, 이미지 캡션을 가려 독서 몰입을 방해</strong>합니다.

### 2) 해결책: 스크롤 중 즉시 숨김 & 멈춘 후 2초 뒤 노출
독자가 글을 읽으며 스크롤을 내리는 동안에는 버튼을 숨겨 시야를 100% 확보해주고, 스크롤이 멈추고 2초가 지나면 부드럽게 다시 띄워주는 타이머 인터랙션을 적용했습니다:

```javascript
let scrollHideTimer = null;

const handleScroll = () => {
  scheduleActiveHeadingUpdate();

  // 1. 스크롤이 움직이는 즉시 우측으로 숨김
  setIsPillVisible(false);

  // 2. 기존 타이머를 취소하고, 스크롤이 멈춘 시점부터 2초 뒤에 다시 노출
  if (scrollHideTimer) clearTimeout(scrollHideTimer);
  scrollHideTimer = setTimeout(() => {
    setIsPillVisible(true);
  }, 2000);
};
```

```css
/* 부드러운 글래스 슬라이드 인/아웃 트랜지션 */
.mobileFloatingPill {
  opacity: 1;
  transform: translateX(0) scale(1);
  transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), 
              transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.mobileFloatingPillHidden {
  opacity: 0 !important;
  transform: translateX(36px) scale(0.85) !important;
  pointer-events: none !important;
}
```

---

## 🎯 7. 요약 및 프론트엔드 개발 체크리스트

| 점검 항목 | 문제 원인 | 적용한 해결책 |
| :--- | :--- | :--- |
| <strong>화면 고정 실패</strong> | 부모 레이아웃의 `overflow-x: clip` 트랩 | `createPortal(..., document.body)`로 최상위 탈출 |
| <strong>20/20 점프 현상</strong> | Hydration 후 이전 DOM 참조가 무효화(유령 노드) | 매 프레임 `document.getElementById` 실시간 조회 |
| <strong>스크롤 버벅임</strong> | 고빈도 스크롤 이벤트 내 레이아웃 리플로우 | `window.requestAnimationFrame` 쓰로틀링 |
| <strong>모바일 가독성 저하</strong> | 플로팅 버튼이 본문 텍스트/코드 블록 가림 | 스크롤 중 즉시 숨김 & 멈춘 후 2초 뒤 재등장 UX |

반응형 목차(TOC)는 작은 UI 컴포넌트처럼 보이지만, <strong>CSS 컨테인먼트, React 렌더링 라이프사이클(Hydration), 브라우저 렌더링 파이프라인(Reflow), 사용자 경험(UX)</strong>이 모두 집약된 고난도 엔지니어링 과제입니다. 

위의 패턴들을 적용하면 어떤 복잡한 레이아웃과 긴 본문에서도 100% 안정적으로 동작하는 프리미엄 목차 시스템을 구축할 수 있습니다.
