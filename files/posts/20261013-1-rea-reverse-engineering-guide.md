---
category: "AI & Intelligence"
title: "코딩 에이전트로 리버스엔지니어링: REA 설치부터 실전까지"
date: "2026-10-13"
image: "/images/rea-reverse-engineering-guide_thumbnail.jpg"
tags: ["REA", "ReverseEngineering", "CodingAgent", "MCP", "OpenCode"]
excerpt: "코딩 에이전트에게 분석 도구를 쥐여주는 REA. 설치법부터 공룡 게임 속도 규칙과 계산기 % 버튼 해부 예제까지 정리합니다."
---

## 🔍 1. REA란: 에이전트에게 분석 도구를 쥐여주기

<strong>REA(Reverse Engineer Anything)</strong>는 코딩 에이전트가 프로그램을 조사하고 동작을 설명할 수 있도록 분석 도구를 제공하는 오픈소스 프로젝트입니다(MIT 라이선스). 한 줄로 말하면 <strong>에이전트용 리버스엔지니어링 도구 상자</strong>입니다.

구조는 단순합니다. <strong>REA가 제공하는 것</strong>과 <strong>에이전트가 하는 것</strong>이 명확히 나뉩니다.

| 구분 | 내용 |
| :--- | :--- |
| <strong>REA가 제공</strong> | 명령어(어셈블리), 디컴파일된 코드, 함수 호출 관계 |
| <strong>에이전트가 수행</strong> | 어떤 분기가 적용되는지, 무엇을 계산하는지, 어떻게 다시 만드는지 설명 |

즉 REA는 눈(분석 도구)이고, 에이전트는 머리(해석)입니다. 패키지 실체는 <strong>rea-agents</strong>(npm 기준 6.x대)이며, 터미널 CLI와 MCP 서버 두 얼굴을 가졌습니다. MCP 서버라는 점이 중요한데, 이 블로그에서 다룬 OpenCode처럼 <strong>MCP를 지원하는 에이전트라면 그대로 붙일 수 있다</strong>는 뜻이기 때문입니다.

---

## ⚙️ 2. 설치: 프롬프트 한 줄과 승인 한 번

공식 설치법은 에이전트에게 아래 취지의 프롬프트를 붙여넣는 것입니다.

```text
npx rea-agents@latest setup을 사용해 REA를 설치하고
이 코딩 에이전트에 연결해 줘.
먼저 설정 변경 계획을 보여 주고 내 승인을 받은 뒤 실행해 줘.
마지막으로 설치를 확인해 줘.
```

터미널에서 직접 실행할 수도 있습니다.

```bash
npx rea-agents@latest setup
```

흐름의 핵심은 <strong>설정 변경 계획을 먼저 보여주고 승인받은 뒤 실행</strong>한다는 점입니다. 에이전트가 에이전트 환경을 손대는 작업이므로, 이 블로그에서 강조한 <strong>permission.bash = ask</strong> 원칙과 정확히 같은 방향입니다. 설치 후에는 에이전트를 다시 시작해야 연결이 반영됩니다.

---

## 🦕 3. 예제 해부 1: 공룡 게임은 왜 점점 빨라질까

공식 사이트의 첫 예제는 크롬 공룡 게임의 가속 규칙 복원입니다. 목표는 <strong>"얼마나 빨리 시작하고, 얼마나 증가하고, 어디서 멈추는가"</strong>를 알아내 조정 가능한 속도로 다시 만드는 것입니다.

REA가 게임 스크립트에서 읽어낸 핵심은 아래 한 줄이었습니다.

```js
if (this.currentSpeed < this.config.MAX_SPEED) {
  this.currentSpeed += this.config.ACCELERATION;
}
```

복원된 규칙은 <strong>속도 6에서 시작해 업데이트마다 0.001씩 더하고, 상한 13에서 멈춘다</strong>는 것입니다. 에이전트는 이 규칙을 읽어 속도 슬라이더가 달린 작은 버전을 새로 만들고, 사용자는 원래 가속을 체험한 뒤 자기 페이스를 고릅니다.

이 예제가 보여주는 REA의 역할 분담은 아래 3단계입니다.

1. <strong>REA:</strong> 실행 중인 게임의 스크립트와 설정을 읽어 에이전트에 반환합니다.
2. <strong>에이전트:</strong> 규칙을 다시 쓰고 속도 조절 컨트롤을 추가합니다.
3. <strong>사용자:</strong> 속도를 바꿔가며 직접 플레이합니다.

---

## 🧮 4. 예제 해부 2: 계산기 200 + 10%는 왜 220일까

두 번째 예제는 Windows 계산기의 <strong>% 버튼</strong>입니다. <strong>200 + 10%를 누르면 왜 220이 나오는가</strong>를 설치된 앱을 직접 검사해 복원합니다.

REA가 % 핸들러에서 읽어낸 규칙은 연산자별로 갈립니다.

```js
if (operation == multiply || operation == divide) {
  percent = current / 100;
} else {
  percent = current * previous / 100;
}
```

풀어서 쓰면 아래와 같습니다.

* <strong>덧셈·뺄셈 뒤의 %:</strong> 첫 번째 숫자의 백분율을 가져옵니다. <strong>10% of 200 = 20 ➔ 200 + 20 = 220</strong>
* <strong>곱셈·나눗셈 뒤의 %:</strong> 10%를 0.1로 바꿉니다. <strong>200 × 0.1 = 20</strong>

에이전트는 두 경로를 모두 확인한 뒤, 같은 규칙으로 동작하는 작은 계산기를 다시 만듭니다. 어셈블리를 직접 읽는 대신 <strong>일상적인 말로 질문하면 된다</strong>는 것이 REA 방식의 요지입니다.

---

## 🗂️ 5. 분석 분야 3종: 어디에 쓸 수 있나

공식은 분석 대상을 아래 3가지로 나눠 가이드를 제공합니다.

| 분야 | 대상 | 하는 일 |
| :--- | :--- | :--- |
| <strong>기계 코드 프로그램</strong> | 실행 파일·라이브러리 | 함수·문자열·참조·호출 관계 검사 |
| <strong>JavaScript·Electron</strong> | 앱 폴더·ASAR 아카이브 | 모듈·경로·기본 종속성 매핑 |
| <strong>브라우저·런타임 활동</strong> | 선택한 브라우저·프로세스 | 활동 캡처 후 여러 실행 결과 비교 |

시작용으로는 작은 앱 하나를 정해 추적하고, 입력 하나를 바꿔보는 <strong>첫 조사(first investigation) 가이드</strong>가 준비되어 있습니다. 거창한 대상부터 잡지 말고 계산기·메모장급 작은 프로그램으로 REA-에이전트 호흡을 먼저 익히는 것이 순서입니다.

---

## 🔌 6. OpenCode와 붙이기: MCP 한 줄이면 된다

이 블로그 독자에게 가장 실용적인 포인트입니다. REA의 실체가 <strong>MCP 서버</strong>이므로, MCP를 지원하는 코딩 에이전트라면 설정에 서버를 등록하는 것만으로 연결됩니다. 이 블로그에서 Tavily 검색을 붙일 때 쓴 것과 같은 방식입니다.

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "rea": {
      "type": "local",
      "command": ["npx", "-y", "rea-agents@latest"],
      "enabled": true
    }
  }
}
```

위 설정은 개념 예시이며, 정확한 실행 인자와 환경변수는 <strong>공식 시작 가이드(get-started)</strong>에서 사용 중인 버전에 맞춰 확인하세요. 연결 후에는 프롬프트에 REA 사용을 명시하면 됩니다.

```text
REA를 사용해 이 계산기 앱의 % 버튼 규칙을 복원해 줘.
먼저 분석 계획을 보여 주고 승인 후에 실행해 줘.
```

---

## ⚖️ 7. 합법·윤리 범위: 어디까지가 허용선인가

리버스엔지니어링 도구 글이므로 선을 분명히 합니다.

* <strong>해도 되는 것:</strong> 본인 소유 소프트웨어의 학습·호환성·보안 점검 목적 분석, 오픈소스 예제(공룡 게임·계산기) 복원 실습.
* <strong>하면 안 되는 것:</strong> 타인 저작물의 무단 복제·재배포, 라이선스·DRM 우회, 악성코드 제작·유포에 악용하기.
* <strong>애매하면:</strong> 해당 소프트웨어의 이용약관과 각국 법령을 먼저 확인하고, 의심스러우면 공식 커뮤니티(Discord)·FAQ에 묻는 것이 안전합니다.

도구는 중립적이지만 책임은 사용자에게 있습니다. 이 블로그의 AI 활용 원칙(<strong>AI는 빨리 만들고 사람은 끝까지 책임진다</strong>)이 여기에도 그대로 적용됩니다.

---

## ❓ 자주 묻는 질문

<strong>Q1. 코딩 지식이 없어도 쓸 수 있나요?</strong><br />
A. 일상적인 말로 질문하면 에이전트가 분석과 설명을 맡으므로, 코드를 직접 읽을 줄 몰라도 시작할 수 있습니다. 다만 결과를 검증하려면 기본 개념(함수·호출·분기)을 알아두는 것이 좋습니다.

<strong>Q2. Windows 전용인가요?</strong><br />
A. 아닙니다. 계산기 예제가 Windows 앱일 뿐, 기계 코드·JavaScript·브라우저 분석은 플랫폼을 가리지 않습니다. Node.js가 있으면 설치가 시작됩니다.

<strong>Q3. 기존 디컴파일러와 무엇이 다른가요?</strong><br />
A. 기존 도구가 코드를 보여주는 데서 끝난다면, REA는 <strong>에이전트가 코드를 해석·설명·재구성까지 이어가게</strong> 만드는 것이 차이입니다.

---

## 🎯 8. 총평: 분석의 눈을 에이전트에게

REA의 가치는 기술 자체보다 <strong>작업 분담의 명확함</strong>에 있습니다. 도구는 읽고, 에이전트는 해석하고, 사람은 승인하고 검증합니다. 공룡 게임 속도 규칙 한 줄을 복원하는 데 어셈블리를 배울 필요가 없어졌다는 점이 이 도구의 전부이자 핵심입니다.

관심이 생겼다면 작은 앱 하나로 첫 조사를 돌려보세요. 30분이면 REA-에이전트 호흡이 손에 익습니다.

---

### 🔗 연관 아티클 & 공식 링크 바로가기
* <strong>REA 공식 사이트:</strong> <a href="https://rea.tools/ko/" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; font-weight: 600;">코딩 에이전트와 함께 리버스 엔지니어링 (공식 ↗)</a>
* <strong>REA 소스코드:</strong> <a href="https://github.com/morluto/rea" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; font-weight: 600;">GitHub morluto/rea, MIT 라이선스 (↗)</a>
* <strong>관련 글:</strong> <a href="/posts/20261004-1-opencode-muse-spark-free-setup-guide" style="color: #38bdf8; font-weight: 600;">OpenCode 무료 활용법: Muse Spark 설치부터 실전까지 (↗)</a>
