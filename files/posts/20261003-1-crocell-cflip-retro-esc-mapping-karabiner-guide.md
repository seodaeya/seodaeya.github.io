---
category: "Hardware & DIY"
title: "크로셀 C-Flip 접이식 키보드 Esc 매핑 해결기: ₩ 탈출부터 백틱(`)·물결 보존까지 (macOS)"
date: "2026-10-03"
excerpt: "휴대용 접이식 키보드 크로셀 C-Flip Retro를 Mac에서 쓸 때 누를 때마다 찍히는 원화(₩) 기호로 고통받으셨나요? Karabiner-Elements를 활용한 최신 macOS 권한 점검, Modify events 활성화, 그리고 백틱(`)과 물결(~)까지 완벽하게 살려내는 복합 매핑 실전 가이드를 정리합니다."
image: "/images/crocell_cflip_retro_esc_mapping_karabiner_thumbnail.jpg"
tags: ["Crocell", "CFlip", "KarabinerElements", "macOS", "KeyboardMapping", "EscKey", "Hardware", "Productivity"]
---

## ⌨️ 1. 휴대용 끝판왕의 유일한 치명타: 누를 때마다 찍히는 '₩'

카페나 출장지에서 가볍게 코딩과 문서 작업을 하기 위해 3단 접이식 블루투스 키보드인 <strong>크로셀 C-Flip Retro</strong>를 선택하는 맥(Mac) 사용자들이 많습니다. 레트로한 타자기 감성의 조약돌 키캡과 주머니에 들어가는 압도적인 휴대성까지, 외형만 보면 미니멀 워크스페이스의 완성작처럼 보입니다.

하지만 맥북과 블루투스로 페어링하고 에디터(VS Code, Vim, 터미널)나 웹 브라우저를 켜는 순간, 예상치 못한 <strong>'생산성의 재앙'</strong>이 시작됩니다.

| 항목 | 크로셀 C-Flip Retro 현상 | 정상적인 개발/작업 기대 동작 |
| :--- | :--- | :--- |
| <strong>상단 좌측 첫 번째 키 단독 입력</strong> | <strong>원화 기호(`₩`)</strong> 또는 백틱(`` ` ``) 출력 | <strong>Esc</strong> (창 닫기, 모달 탈출, Vim 명령 모드) |
| <strong>실제 Esc 입력 방법</strong> | 반드시 <strong>`Fn + Esc`</strong> 두 손 조합키 입력 필수 | 단독 1회 탭으로 직관적 Esc 입력 |
| <strong>하드웨어 펌웨어 지원</strong> | <strong>Fn Lock(고정) 영구 메모리 없음</strong> (전원 재연결 시 초기화) | 하드웨어 레벨 키 고정 전환 지원 |
| <strong>체감 피로도</strong> | 터미널 명령 취소, 검색창 닫기마다 작업 흐름 중단 | 1초 미만 즉각 반응 및 몰입 유지 |

> 💡 <strong>범용 적용 안내</strong><br />
> 본 포스트는 크로셀 C-Flip Retro 접이식 키보드를 실전 트러블슈팅 사례로 다루지만, 상단 1열에 독립된 Esc 키가 없고 백틱/물결 키와 합쳐져 있는 <strong>미니 60% 키보드, HHKB 계열, 포커 배열, 타사 접이식 블루투스 키보드(B.O.W 등)</strong>를 macOS에서 사용하는 유저에게도 100% 동일하게 적용되는 범용 가이드입니다.

미니 배열 특성상 상단 1열에 별도의 독립된 Esc 행이 존재하지 않고 물결/백틱(`\~ / \``)과 한 키로 병합되어 있는데, 하드웨어 펌웨어에 이를 Esc로 영구 고정해 주는 <strong>Fn Lock 메모리 토글</strong>이 탑재되어 있지 않기 때문입니다. 결국 macOS 소프트웨어 레벨에서 키 신호를 가로채어 재배치(Remapping)해야만 이 문제를 근본적으로 해결할 수 있습니다.

---

## 🔍 2. 1단계: EventViewer로 하드웨어 키코드 정체 파악하기

문제를 해결하기 위해 키 리매핑 도구의 표준인 <strong>Karabiner-Elements</strong>를 설치하고, 함께 제공되는 진단 도구인 <strong>Karabiner-EventViewer</strong>를 실행하여 물리 키를 눌렀을 때 맥으로 유입되는 원시 HID 신호를 측정합니다.

| 진단 항목 | 측정 결과 데이터 | 기술적 해석 및 시사점 |
| :--- | :--- | :--- |
| <strong>type</strong> | `down` / `up` | 물리 스위치 눌림 및 뗌 정상 감지 |
| <strong>name</strong> | <strong>`grave_accent_and_tilde`</strong> | 맥은 이 물리 키를 Esc가 아닌 <strong>백틱(`)/물결(\~) 키</strong>로 인식 |
| <strong>문자 출력 메커니즘</strong> | 한글 자판 상태에서 <strong>`₩`</strong> 출력 | <strong>키보드가 원화를 직접 보내는 것이 아님</strong><br />키보드는 `grave_accent_and_tilde` 스캔코드를 보낼 뿐이며, <strong>macOS 한글 두벌식 입력기(IME)가 이를 단독 입력 시 '₩'로 변환</strong>하는 것 |

분석 결과, 하드웨어는 좌측 상단 키를 누를 때마다 일관되게 <strong>`grave_accent_and_tilde`</strong>라는 스캔코드를 맥으로 송출하고 있었습니다. 즉, 맥 OS 차원에서 이 `grave_accent_and_tilde` 신호를 가로채어 조건에 따라 `escape`로 변환해 주는 파이프라인을 구축해야 합니다.

---

## 🛡️ 3. 2단계: macOS 필수 보안 권한 점검 (버전별 체크리스트)

과거 macOS와 달리 최신 macOS(Ventura, Sonoma, Sequoia)는 키로깅과 악성 하드웨어 스푸핑을 방지하기 위해 엄격한 <strong>샌드박스 격리 정책</strong>을 강제합니다. Karabiner 앱을 설치한 뒤 키 입력을 가로채지 못한다면 아래 권한 설정 항목을 순서대로 점검해야 합니다.

<div class="table-wrapper" style="margin: 24px 0;">

| 번호 | 보안 권한 항목 | Mac 시스템 설정 이동 경로 | 승인 대상 및 버전별 요구사항 |
| :---: | :--- | :--- | :--- |
| <strong>1</strong> | <strong>백그라운드 항목</strong> | 시스템 설정 &gt; 일반 &gt; 로그인 항목 및 확장 프로그램 | `Karabiner-Elements` 백그라운드 프로세스 2종 <strong>토글 켬 (필수)</strong> |
| <strong>2</strong> | <strong>손쉬운 사용</strong> | 시스템 설정 &gt; 개인정보 보호 및 보안 &gt; 손쉬운 사용 | `karabiner_grabber`, `karabiner_console_user_server` <strong>허용 (필수)</strong> |
| <strong>3</strong> | <strong>드라이버 확장 프로그램</strong> | 로그인 항목 및 확장 프로그램 &gt; 확장 프로그램 (Driver Extensions) | `.Karabiner-VirtualHIDDevice-Manager` <strong>승인 및 ANSI 키보드 지정 (필수)</strong> |
| <strong>4</strong> | <strong>입력 모니터링</strong> | 개인정보 보호 및 보안 &gt; 입력 모니터링 (Input Monitoring) | Karabiner 15.9.0 이하 버전 및 `Karabiner-EventViewer` 실행 시 필요<br />*(Karabiner 16.0.0+에서는 Accessibility 권한으로 대부분 커버됨)* |

</div>

> 📌 <strong>중요 확인사항 (키보드 규격 설정)</strong><br />
> <strong>드라이버 확장 프로그램(Driver Extension)</strong> 승인 직후, 맥 화면에 '키보드 설정 지원(Keyboard Setup Assistant)' 창이 나타납니다. 이때 C-Flip 키보드의 지시에 따라 시프트 옆 키를 누른 뒤 반드시 <strong>ANSI(미국 표준 101/104키)</strong>를 선택해야 키 배치가 꼬이지 않습니다.

---

## ⚙️ 4. 3단계: 가장 먼저 확인할 1순위 함정, 'Modify events' 토글

보안 권한을 모두 승인하고 매핑 규칙을 추가했는데도 여전히 `₩` 기호가 찍히는 경우가 발생합니다. 이 경우 가장 먼저 점검해야 할 항목은 Karabiner 내부 장치 목록에서 해당 키보드의 <strong>이벤트 수정 권한</strong> 활성화 여부입니다.

1. Karabiner-Elements 상단 메뉴에서 <strong>Settings</strong> 창을 엽니다.
2. 좌측 사이드바에서 <strong>Devices</strong> 메뉴로 이동합니다.
3. 연결된 키보드 목록 중 <strong>`C-Flip Retro (No manufacturer name)`</strong> 장치를 찾습니다.
4. 해당 장치명 바로 우측(또는 하단)에 위치한 <strong>`Modify events` 스위치를 클릭하여 활성화(파란색)</strong>로 전환합니다.

이 스위치가 꺼져 있으면 Karabiner는 해당 장치의 입력을 수정 대상에서 제외하므로, 키보드 신호가 여과 없이 맥 운영체제로 그대로 전달되어 계속 원화(`₩`)가 찍히게 됩니다.

---

## ⚠️ 5. 4단계: 단순 매핑의 한계 — "Esc를 얻고 백틱(`)을 잃다"

장치 인식을 끝내고 가장 직관적인 해결책인 <strong>Simple Modifications</strong>에서 아래와 같이 매핑을 적용해 봅니다.

```text
From key: grave_accent_and_tilde (`)  -->  To key: escape
```

이제 좌측 상단 키를 탭하면 그토록 원하던 <strong>Esc</strong>가 시원하게 동작합니다. 터미널 명령 취소도 잘 되고 브라우저 팝업도 단번에 닫힙니다.

### 💥 또 다른 문제의 발생: 개발자의 비극
하지만 기쁨도 잠시, 마크다운 문서를 작성하거나 자바스크립트/파이썬 코드를 작성하는 순간 거대한 벽에 부딪힙니다:
- 인라인 코드 및 멀티라인 코드 블록을 만들 때 필수적인 <strong>백틱(`` ` ``)</strong>을 입력할 방법이 사라집니다.
- 홈 디렉토리 경로(`\~/Documents`)나 범위를 나타내는 <strong>물결표(`\~`)</strong> 역시 완전히 봉쇄됩니다.
- 단순 1:1 리매핑은 키의 본래 기능을 영구적으로 덮어씌워 버리기 때문에, 코딩과 문서 작업을 병행하는 사용자에게는 반쪽짜리 해결책에 불과합니다.

---

## 🚀 6. 5단계: 최종 종착지 — Complex Modifications 복합 매핑 구축

단독으로 누를 때는 <strong>Esc</strong>로 동작하면서, 보조키(Shift, Option)를 함께 누르면 원래의 <strong>물결(`\~`)</strong>과 <strong>백틱(`` ` ``)</strong>이 온전히 살아나도록 <strong>복합 규칙(Complex Modifications)</strong>을 적용합니다.

### 💡 복합 조건 분기 원리: "어떻게 3가지 기능이 공존하는가?"
이 방식은 키 자체를 물리적으로 다른 키로 교체하는 것이 아니라, 키가 눌리는 <strong>'문맥(Context)과 조합 상태'</strong>를 감지하여 동적으로 분기합니다.

| 입력 문맥 및 조합 상태 | Karabiner 내부 처리 로직 | 최종 출력 동작 및 주요 활용도 |
| :--- | :--- | :--- |
| <strong>보조키 없이 단독 1회 탭</strong> | `to_if_alone` 트리거 발동 | <strong>Esc</strong> (창 닫기, 모달 탈출, Vim 명령 모드) |
| <strong>Shift 키 조합 입력</strong> | 기존 modifier 신호 패스스루 | <strong>`\~` (물결표)</strong> (홈 디렉토리 경로, 범위 표현) |
| <strong>Option 키 조합 입력</strong> | 기존 modifier 신호 패스스루 | <strong>`` ` `` (백틱)</strong> (인라인 코드, 마크다운 코드블록) |

<div class="diagram-container" style="margin: 36px 0; display: flex; justify-content: center; width: 100%;">
<svg viewBox="0 0 840 660" style="width: 100%; max-width: 840px; height: auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Pretendard, sans-serif;" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arrow-step" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
    </marker>
    <filter id="box-shadow" x="-5%" y="-5%" width="110%" height="115%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.12" />
    </filter>
  </defs>

  <!-- Container Box -->
  <rect x="15" y="15" width="810" height="630" rx="16" fill="var(--bg-secondary, #18181b)" stroke="var(--border-glass-active, #3f3f46)" stroke-width="1.5" />

  <!-- Diagram Title -->
  <g transform="translate(35, 48)">
    <text x="0" y="0" font-size="16" font-weight="700" fill="var(--text-primary, #f4f4f5)" letter-spacing="-0.3px">
      ⚡ 크로셀 C-Flip Retro 입력 인터셉트 &amp; 복합 조건 매핑 파이프라인
    </text>
    <line x1="-5" y1="16" x2="775" y2="16" stroke="var(--border-glass, #3f3f46)" stroke-width="1" />
  </g>

  <!-- Step 1 Node: Hardware Input -->
  <g transform="translate(195, 85)" filter="url(#box-shadow)">
    <rect width="450" height="64" rx="10" fill="var(--bg-card, #27272a)" stroke="var(--border-glass, #52525b)" stroke-width="1.2" />
    <text x="225" y="27" font-size="14" font-weight="700" fill="#38bdf8" text-anchor="middle">
      1. 물리 하드웨어 입력 (C-Flip Retro 키보드)
    </text>
    <text x="225" y="47" font-size="12" fill="var(--text-secondary, #a1a1aa)" text-anchor="middle">
      상단 좌측 첫 번째 키 타건 (HID 스캔코드: grave_accent_and_tilde)
    </text>
  </g>

  <!-- Orthogonal Arrow 1 -> 2 (Vertical Down 52px) -->
  <path d="M 420 149 L 420 197" fill="none" stroke="#38bdf8" stroke-width="2" marker-end="url(#arrow-step)" />

  <!-- Step 2 Node: macOS Security Layer -->
  <g transform="translate(195, 201)" filter="url(#box-shadow)">
    <rect width="450" height="64" rx="10" fill="var(--bg-card, #27272a)" stroke="var(--border-glass, #52525b)" stroke-width="1.2" />
    <text x="225" y="27" font-size="14" font-weight="700" fill="#38bdf8" text-anchor="middle">
      2. macOS 드라이버 및 가로채기 계층
    </text>
    <text x="225" y="47" font-size="12" fill="var(--text-secondary, #a1a1aa)" text-anchor="middle">
      .Karabiner-VirtualHIDDevice-Manager &amp; Accessibility 활성화
    </text>
  </g>

  <!-- Orthogonal Arrow 2 -> 3 (Vertical Down 52px) -->
  <path d="M 420 265 L 420 313" fill="none" stroke="#38bdf8" stroke-width="2" marker-end="url(#arrow-step)" />

  <!-- Step 3 Node: Karabiner Complex Rule Engine -->
  <g transform="translate(195, 317)" filter="url(#box-shadow)">
    <rect width="450" height="68" rx="10" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" stroke-width="1.5" />
    <text x="225" y="28" font-size="14" font-weight="700" fill="#38bdf8" text-anchor="middle">
      3. Karabiner 복합 규칙 엔진 (Complex Modifications)
    </text>
    <text x="225" y="49" font-size="12" font-weight="600" fill="var(--text-primary, #f4f4f5)" text-anchor="middle">
      입력 모디파이어(Shift, Option) 상태 실시간 감지 및 분기
    </text>
  </g>

  <!-- Orthogonal Arrow Branching (Step 3 -> 3 Output Nodes) -->
  <path d="M 320 385 L 320 423 L 170 423 L 170 457" fill="none" stroke="#38bdf8" stroke-width="2" marker-end="url(#arrow-step)" />
  <path d="M 420 385 L 420 457" fill="none" stroke="#38bdf8" stroke-width="2" marker-end="url(#arrow-step)" />
  <path d="M 520 385 L 520 423 L 670 423 L 670 457" fill="none" stroke="#38bdf8" stroke-width="2" marker-end="url(#arrow-step)" />

  <!-- Output Node Left: Esc -->
  <g transform="translate(60, 461)" filter="url(#box-shadow)">
    <rect width="220" height="96" rx="10" fill="var(--bg-card, #27272a)" stroke="#10b981" stroke-width="1.5" />
    <text x="110" y="26" font-size="13" font-weight="700" fill="#10b981" text-anchor="middle">
      [단독 탭 (Single Tap)]
    </text>
    <text x="110" y="54" font-size="20" font-weight="900" fill="#ffffff" text-anchor="middle">
      Esc
    </text>
    <text x="110" y="78" font-size="11" fill="var(--text-secondary, #a1a1aa)" text-anchor="middle">
      창 닫기 / 모달 / Vim 탈출
    </text>
  </g>

  <!-- Output Node Center: Tilde -->
  <g transform="translate(310, 461)" filter="url(#box-shadow)">
    <rect width="220" height="96" rx="10" fill="var(--bg-card, #27272a)" stroke="#f59e0b" stroke-width="1.5" />
    <text x="110" y="26" font-size="13" font-weight="700" fill="#f59e0b" text-anchor="middle">
      [Shift + 키 조합]
    </text>
    <text x="110" y="54" font-size="20" font-weight="900" fill="#ffffff" text-anchor="middle">
      ~ (Tilde)
    </text>
    <text x="110" y="78" font-size="11" fill="var(--text-secondary, #a1a1aa)" text-anchor="middle">
      홈 디렉토리 경로 / 물결 기호
    </text>
  </g>

  <!-- Output Node Right: Backtick -->
  <g transform="translate(560, 461)" filter="url(#box-shadow)">
    <rect width="220" height="96" rx="10" fill="var(--bg-card, #27272a)" stroke="#8b5cf6" stroke-width="1.5" />
    <text x="110" y="26" font-size="13" font-weight="700" fill="#8b5cf6" text-anchor="middle">
      [Option + 키 조합]
    </text>
    <text x="110" y="54" font-size="20" font-weight="900" fill="#ffffff" text-anchor="middle">
      ` (Backtick)
    </text>
    <text x="110" y="78" font-size="11" fill="var(--text-secondary, #a1a1aa)" text-anchor="middle">
      마크다운 코드블록 / 리터럴
    </text>
  </g>

  <!-- Bottom Result Banner -->
  <g transform="translate(195, 584)">
    <rect width="450" height="36" rx="18" fill="rgba(16, 185, 129, 0.12)" stroke="#10b981" stroke-width="1" />
    <text x="225" y="22" font-size="12" font-weight="700" fill="#10b981" text-anchor="middle">
      ✨ ₩ 오타 완전 방지 + 단독 Esc + 백틱/물결 조합의 완벽한 공존 달성
    </text>
  </g>
</svg>
</div>

### 방법 A: 공식 규칙 저장소에서 1초 만에 가져오기 (GUI 방식)

1. <strong>Complex Modifications 메뉴 진입</strong>:
   - Karabiner Settings 좌측 메뉴에서 <strong>Complex Modifications</strong>를 클릭합니다.
   - 하단의 <strong>`Add predefined rule`</strong> 버튼을 누릅니다.

2. <strong>온라인 규칙 저장소 열기</strong>:
   - 규칙 선택 팝업 상단에 있는 파란 구름 아이콘인 <strong>`Import more rules from the Internet (Open a web browser)`</strong> 버튼을 클릭합니다.
   - 브라우저에서 공식 복합 규칙 허브([ke-complex-modifications](https://ke-complex-modifications.pqrs.org/))가 열립니다.

3. <strong>검색 및 규칙 Import</strong>:
   - 웹사이트 검색창에 `escape grave` 또는 `tilde`를 입력합니다.
   - 검색 결과 중 아래 명칭의 공식 규칙을 찾습니다:
     > <strong>Change grave accent (backtick) to escape, option grave accent to grave accent</strong>
   - 우측 파란색 <strong>`Import`</strong> 버튼을 클릭하고 브라우저의 'Karabiner-Elements 열기' 확인창에서 <strong>[열기/허용]</strong>을 누릅니다.

4. <strong>규칙 활성화(Enable)</strong>:
   - Karabiner로 돌아오면 가져온 규칙 목록이 표시됩니다.
   - 해당 규칙 우측의 <strong>`Enable`</strong> 버튼을 누르면 활성 규칙 목록으로 등록됩니다.

5. <strong>[필수] Simple Modifications 기존 규칙 삭제 (충돌 방지)</strong>:
   - 4단계에서 임시로 등록해 두었던 `grave_accent_and_tilde -> escape` 단순 규칙이 남아있다면 <strong>`Remove`</strong> 버튼을 눌러 반드시 삭제합니다.
   - Karabiner의 입력 이벤트 체이닝(Input Event Modification Chaining) 처리 파이프라인에서 단순 규칙과 복합 규칙이 충돌하여 Option/Shift 조합키 분기가 오작동하는 것을 방지하기 위함입니다.

---

### 방법 B: 개발자를 위한 완성형 커스텀 JSON 직접 삽입 (CLI 방식)

외부 웹페이지 방문 없이 설정을 한 번에 파일로 적용하고 싶다면, `\~/.config/karabiner/karabiner.json` 파일의 `rules` 배열에 아래 스니펫을 직접 추가하면 즉시 반영됩니다.

```json
{
  "description": "C-Flip / 60%: grave to escape (alone), preserve option/shift modifiers",
  "manipulators": [
    {
      "type": "basic",
      "from": {
        "key_code": "grave_accent_and_tilde",
        "modifiers": {
          "optional": ["any"]
        }
      },
      "to_if_alone": [
        {
          "key_code": "escape"
        }
      ],
      "to": [
        {
          "key_code": "grave_accent_and_tilde"
        }
      ]
    }
  ]
}
```

이 규칙은 키를 <strong>단독으로 짧게 탭(`to_if_alone`)했을 때만 `escape`를 발생</strong>시키고, Shift나 Option 등 보조키를 누른 상태에서는 원래의 `grave_accent_and_tilde` 신호를 그대로 전달하므로 `Shift + 키 = \~`, `Option + 키 = \``가 완벽하게 보존됩니다.

---

## 🔒 7. 보안 주의사항 (Security Best Practices)

키보드 리매퍼는 시스템의 최하단에서 하드웨어 스캔코드를 가로채는 매우 높은 수준의 보안 권한을 요구합니다. 안전한 사용을 위해 아래 두 가지 원칙을 지켜야 합니다:

> ⚠️ <strong>보안 베스트 프랙티스 (Security Best Practices)</strong><br />
> 1. <strong>공식 배포처 검증</strong>: Karabiner-Elements는 반드시 개발사 공식 웹사이트([pqrs.org](https://pqrs.org/osx/karabiner/))나 공식 GitHub 저장소([pqrs-org/Karabiner-Elements](https://github.com/pqrs-org/Karabiner-Elements))에서만 다운로드해야 합니다.<br />
> 2. <strong>출처 불명의 외부 JSON 주의</strong>: 온라인 커뮤니티나 신뢰할 수 없는 웹페이지에서 배포하는 정체불명의 `karabiner.json` 설정 파일은 키 신호 가로채기나 악성 단축키 매핑 위험이 있으므로, 본 가이드에서 제공하는 공식 저장소 검증 규칙 또는 표준 스니펫만 사용하시기 바랍니다.

---

## 🎯 8. 최종 검증 및 실전 입력 가이드

설정이 완료된 후 메모장이나 터미널에서 C-Flip Retro 키보드로 3가지 동작을 즉시 테스트해 봅니다.

| 입력 방식 | 키 조합 | 최종 출력 결과 | 실제 활용 상황 |
| :--- | :--- | :--- | :--- |
| <strong>단독 타건</strong> | 상단 좌측 첫 번째 키 1회 탭 | <strong>Esc</strong> 동작 | Vim 명령 모드 복귀, 검색창 닫기, 터미널 실행 취소 |
| <strong>물결표 입력</strong> | <strong>`Shift`</strong> + 해당 키 | <strong>`\~`</strong> (물결 기호) | 텍스트 어조 표현, `cd \~/Projects` 홈 디렉토리 경로 탐색 |
| <strong>백틱 입력</strong> | <strong>`Option`</strong> + 해당 키 | <strong>`` ` ``</strong> (백틱 기호) | 인라인 코드 작성, 마크다운 ` ``` ` 코드 블록 생성 |

접이식 미니 키보드의 콤팩트한 휴대성을 그대로 누리면서도, 외출 시 겪어야 했던 `₩` 오타 스트레스와 백틱 누락 문제를 완벽하게 해소할 수 있습니다. 동일한 접이식 키보드뿐만 아니라 미니 60% 배열을 사용하는 맥 유저라면 이 설정 하나로 작업 생산성을 극대화해 보시기 바랍니다.
