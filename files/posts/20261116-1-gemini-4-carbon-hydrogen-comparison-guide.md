---
category: "AI & Intelligence"
title: "Gemini 4 Carbon·Hydrogen 비교: 가격·속도·실전 선택"
date: "2026-11-16"
excerpt: "2026년 11월 정식 출시된 Gemini 4 Carbon과 Hydrogen을 Argon까지 포함해 비교합니다. 공식 가격과 측정 속도(TPS), 벤치마크를 출처별로 구분하고 무료 티어·캐시 단가·Orchestrator 멀티 모델 활용법까지 실전 선택 기준으로 정리했습니다."
image: "/images/gemini_4_carbon_hydrogen_comparison_thumbnail.jpg"
tags: ["Gemini", "Gemini 4", "Carbon", "Hydrogen", "Argon", "Google AI", "LLM", "Orchestrator", "CodingAgent"]
---

> <strong>이 글의 위치</strong>: 지난 10월 공개된 프론티어 모델에 대한 [구글 Gemini 4 Argon 완전 분석: 100만 토큰과 가격](/posts/20261014-1-gemini-4-argon-analysis-guide/)의 후속편입니다. 2026년 11월 10일과 12일 연달아 정식 출시(GA)된 <strong>Gemini 4 Carbon</strong>과 <strong>Gemini 4 Hydrogen</strong>의 실제 스펙과 역할 분담을 정리합니다.

> <strong>3줄 요약</strong>
>
> 1. 구글은 Gemini 4 세대부터 Pro/Flash 대신 원소명(<strong>Argon · Carbon · Hydrogen</strong>) 체계를 도입해, 11월 중순 3종 라인업을 완성했습니다.
> 2. <strong>Carbon</strong>(11/10 GA)은 AA Intelligence Index 60(High)·출력 62 tok/s (High)의 심층 추론 모델이고, <strong>Hydrogen</strong>(11/12 출시)은 173 tok/s (Xhigh)·입력 \$1.50/출력 \$7.50의 고속 실행 모델입니다.
> 3. 실무에서는 단일 모델에 고정하기보다 Antigravity의 <strong>Orchestrator</strong>처럼 <strong>Carbon으로 설계·디버깅하고 Hydrogen으로 구현·테스트를 반복</strong>하는 멀티 모델 라우팅이 비용과 정확도 양면에서 유리합니다.

---

## 🧪 1. 왜 Pro·Flash 대신 원소 이름(Argon · Carbon · Hydrogen)일까?

Gemini 3.x 세대까지는 Pro · Flash라는 체급 명칭을 썼습니다. 하지만 에이전트 기반 코딩과 자율 실행 워크플로가 보편화되면서, 단순히 "크고 느린 모델 vs 작고 빠른 모델"의 이분법만으로는 역할을 설명하기 어려워졌습니다.

구글은 2026년 10월 [Gemini 4 Argon](/posts/20261014-1-gemini-4-argon-analysis-guide/)을 시작으로, 11월 10일 <strong>Gemini 4 Carbon</strong> 정식 출시(GA), 11월 12일 <strong>Gemini 4 Hydrogen</strong> 출시를 통해 원소 기반의 3단 라인업을 완성했습니다.

- <strong>Argon (아르곤 — 9월 30일 Fairwind, 10월 중순 확대)</strong>: 100만 토큰 컨텍스트와 안정적인 장시간 추론을 갖춘 <strong>표준 프론티어 엔진</strong>
- <strong>Carbon (카본 — 11월 10일 GA)</strong>: Argon보다 추론 깊이와 자가 검증 루프를 극한까지 끌어올린 <strong>최상위 아키텍트·보안 모델</strong>
- <strong>Hydrogen (하이드로겐 — 11월 12일 출시)</strong>: Gemini 4 패밀리의 지능을 가볍고 빠른 실행 루프로 옮긴 <strong>초고속 워크호스 모델</strong>

---

## 💎 2. Gemini 4 Carbon: 극한의 추론 깊이와 보안·아키텍처 특화

<strong>Gemini 4 Carbon</strong>은 2026년 10월 28일 사이버 방어 조직용 Fairwind 프로그램으로 먼저 공개된 뒤, <strong>11월 10일</strong> 개발자와 기업을 대상으로 정식 출시(GA)되었습니다.

### 1) 설계 목적과 강점
단순히 정답을 빨리 내놓는 것보다, <strong>문제를 끝까지 검증하고 아키텍처의 근본 원인(Root Cause)을 찾아내는 능력</strong>에 초점을 맞췄습니다.
- <strong>깊은 Thinking 루프</strong>: 턴당 훨씬 많은 내부 추론(Thinking) 토큰을 소모하며 다단계 검증을 수행합니다. 구글도 Carbon이 Argon보다 더 많은 토큰을 쓴다고 명시합니다.
- <strong>최고 수준의 벤치마크</strong>: Artificial Analysis Intelligence Index v5 기준 <strong>60점(High)</strong>으로 전체 4위권이며, CursorBench 4.0·Perplexity WANDR·Zapier AutomationBench에서 1위를 기록했습니다. 차선 외부 모델 대비 작업당 비용은 2배 이상 낮습니다. 보안 영역에서는 Fairwind 프로그램을 통해 SEC-bench Pro(취약점 탐지)·ExploitGym(공격)·CWE-bench v1(패치)에서 선두를 기록했습니다.
- <strong>트레이드오프</strong>: 내부 검증 단계가 길고 출력이 상세한 만큼 출력 속도는 <strong>62 tok/s (High)</strong>로 Hydrogen보다 느리고, 작업당 토큰 소비량도 많습니다.

### 2) 도입 가격 정책 (100만 토큰 컨텍스트 공통)
- <strong>얼리버드 프로모션 가격 (\~2026년 11월 30일까지)</strong>: 입력 <strong>\$2.00</strong> / 출력 <strong>\$10.00</strong> (1M 토큰 기준)
- <strong>정규 표준 가격 (2026년 12월 1일부터)</strong>: 입력 <strong>\$4.00</strong> / 출력 <strong>\$20.00</strong> (1M 토큰 기준)
- <strong>무료 티어 없음</strong>: Carbon은 Free tier에서 제공되지 않으며, 사고(Thinking)·도구 지시 토큰까지 모두 과금됩니다. 테스트는 Google AI Studio 유료 호출이나 <strong>배치 API</strong>(입력 \$1.00 / 출력 \$5.00, 1M 기준)로 진행하면 됩니다.
- <strong>캐시 입력</strong>: 100만 토큰당 \$0.10(11월 30일까지) → \$0.20(12월 1일부터). 암시적 캐싱만 지원합니다.

---

## ⚡ 3. Gemini 4 Hydrogen: Gemini 4 패밀리의 초고속 실행 엔진

<strong>Gemini 4 Hydrogen</strong>은 Carbon 정식 출시 이틀 뒤인 <strong>2026년 11월 12일</strong> 공개되었습니다. Gemini 3.8 Flash에서 넘어오는 팀을 위한 사실상의 후속 모델로, 같은 100만 토큰 컨텍스트와 100만 토큰 long decode를 유지하면서 실행 속도와 지능을 끌어올렸습니다.

### 1) 설계 목적과 강점
- <strong>압도적인 처리 속도</strong>: Artificial Analysis 측정 출력 속도는 <strong>173 tok/s (Xhigh)</strong>입니다. Carbon (62 tok/s, High)과 노력도가 달라 단순 배수 비교는 주의해야 하지만, 체감 차이는 분명합니다. 구글은 기본값인 high 설정에서 Gemini 3.8 Flash 대비 <strong>작업 완료가 2.5배 빠르다</strong>고 발표했습니다.
- <strong>4단계 추론 노력도 제어 (low · medium · high · xhigh)</strong>: 작업 난이도에 따라 Thinking 깊이를 조절할 수 있습니다. 기본 high에서 Intelligence Index 51, 최고 단계인 xhigh에서 <strong>54</strong>를 기록했습니다. Terminal-Bench 4.1은 <strong>57%(3.8 Flash 18.2%)</strong>로 3배 이상 올라섰고, 허위 주장 생성도 5배 이상 줄었습니다.
- <strong>대중적인 접근성</strong>: 100만 토큰 통합 컨텍스트(텍스트·이미지·오디오·비디오·PDF)를 유지하면서 <strong>Free tier가 제공</strong>됩니다. Carbon과 가장 큰 차이입니다.
- <strong>도메인 추론 벤치마크</strong>: 구글 발표 기준 HLE-Diamond 58.8%, <strong>Vals Tax Agent Bench 1위(52.3%)</strong>, Vals Legal Research Bench 공동 1위(55.8%), AutomationBench-AA 동급 선두입니다.
- <strong>검색·앱 전면 투입</strong>: Hydrogen은 Google Search에 전 세계적으로 투입된 "Search 최대 업그레이드"이기도 합니다. 같은 모델이 검색 답변과 API 실행을 함께 담당합니다.

### 2) 도입 가격 정책
- <strong>플랫(고정) 가격</strong>: 입력 <strong>\$1.50</strong> / 출력 <strong>\$7.50</strong> (1M 토큰 기준)
- <strong>배치</strong>: 입력 \$0.75 / 출력 \$3.75, <strong>캐시 입력</strong>: \$0.075 (모두 1M 토큰 기준)

---

## 📊 4. Argon vs Carbon vs Hydrogen 핵심 스펙 한눈에 비교

세 모델은 모두 <strong>100만 토큰 통합 컨텍스트 윈도우</strong>와 <strong>Long Decode(연속 출력)</strong> 기반을 공유하지만, 속도와 추론 깊이, 비용 구조가 명확하게 나뉩니다.

| 비교 항목 | Gemini 4 Argon | Gemini 4 Carbon | Gemini 4 Hydrogen |
| :--- | :--- | :--- | :--- |
| <strong>정식 출시 (GA)</strong> | 2026년 10월 중순 | <strong>2026년 11월 10일</strong> | <strong>2026년 11월 12일</strong> |
| <strong>핵심 포지션</strong> | 표준 프론티어 | <strong>최상위 심층 추론·설계·보안</strong> | <strong>초고속 고처리량 실행 워크호스</strong> |
| <strong>Thinking 깊이</strong> | 3단계 (최대 high) | 3단계 (최대 high) | 4단계 (최대 xhigh) |
| <strong>출력 속도 (TPS)</strong> | 65 tok/s | <strong>62 tok/s</strong> (High) | <strong>173 tok/s</strong> (Xhigh) |
| <strong>AA Index</strong> | 50 | <strong>60</strong> (High) | <strong>54</strong> (Xhigh) · 51 (High) |
| <strong>주요 벤치마크</strong> | 표준 코딩·지식 업무 | CursorBench 4.0 등 선두 | Terminal-Bench 4.1 57% |
| <strong>입력 / 출력 가격 (1M)</strong> | \$2/\$10 (12/1부터 \$4/\$20) | 프로모션 <strong>\$2/\$10</strong> (12/1부터 \$4/\$20) | 플랫 <strong>\$1.50/\$7.50</strong> |
| <strong>무료 티어</strong> | 없음 | 없음 | <strong>제공</strong> |
| <strong>추천 작업</strong> | 일반 개발·장문 문서 분석 | 설계·디버깅·보안 감사 | 반복 코딩·테스트·UI 수정 |

<strong>표 읽는 법</strong>: Intelligence Index와 TPS는 Artificial Analysis 측정값이며, 모델별로 측정에 사용한 노력도(High·Xhigh)가 다릅니다. 같은 노력도로 비교하면 Carbon 60(High) vs Hydrogen 51(High)처럼 격차가 달라집니다.

---

## 🔄 5. 실전 워크플로: "설계는 Carbon, 실행은 Hydrogen"

이번 11월 업데이트에서 가장 눈여겨볼 지점은 단일 모델의 우열이 아니라 <strong>멀티 모델 협업(Orchestration)</strong>입니다. Google Antigravity의 <strong>Orchestrator</strong>는 Carbon과 Hydrogen을 같은 세션 안에서 동적으로 전환합니다. 구글에 따르면 Terminal-Bench 4.0에서 Carbon에 근접한 성공률을 유지하면서 평균 <strong>쿼터 24% 절감, 19% 빠른 완료</strong>를 기록했습니다. Carbon이 코디네이터를 맡고 Hydrogen이 워커·검증자로 병렬 실행하는 /swarm 구조도 프리뷰 중입니다.

```mermaid
flowchart LR
    A["복합 요청"] --> B{"작업 성격"}
    B -->|"설계 · 디버깅"| C["Carbon<br/>깊은 추론"]
    B -->|"구현 · 테스트"| D["Hydrogen<br/>고속 실행"]
    C -->|"설계 지침"| D
    D --> F["빌드 · 검증 완료"]
```

### 실무자 모델 선택 체크리스트
1. <strong>초기 설계, 리팩토링 방향 잡기, 보안 취약점 감사</strong>: <strong>Gemini 4 Carbon</strong>
   - Thinking 비용이 들더라도 첫 단추를 잘못 꿰어 나중에 전체를 뜯어고치는 비용을 막아줍니다.
2. <strong>구현 단계, 컴포넌트 다수 생성, 단위 테스트 통과 루프, 블로그 원고 교정</strong>: <strong>Gemini 4 Hydrogen</strong>
   - 빠른 응답 속도와 저렴한 토큰 단가 덕분에 수정–실행–검증 사이클을 여러 번 돌려도 부담이 적습니다. 고난도 추론이 필요한 순간에만 xhigh 옵션을 켜면 됩니다.
3. <strong>긴 코딩 세션에서 매번 속도와 지능 사이를 저울질하기 번거로울 때</strong>: <strong>Gemini 4 Argon</strong>
   - AA Index 50으로 Hydrogen보다 낮지만, 구글은 여전히 대다수 소프트웨어 엔지니어링·지식 업무의 기본 모델로 Argon을 권장합니다. 장기 작업의 예측 가능성과 안정성이 강점입니다.

---

## 🧭 6. 정리

2026년 11월 <strong>Gemini 4 Carbon</strong>과 <strong>Gemini 4 Hydrogen</strong>의 합류로 구글의 모델 라인업은 <strong>"한 모델로 모든 것을 해결한다"에서 "깊은 생각(Carbon)과 빠른 손발(Hydrogen)을 분리해 조합한다"</strong>는 명확한 엔지니어링 철학을 보여주었습니다.

API 비용과 응답 대기 시간을 줄이면서도 최고 수준의 코드·분석 품질을 유지하려면, 작업 전체를 무거운 모델 하나로 밀어붙이기보다 <strong>설계·검증 단계에만 Carbon을 배치하고, 실제 구현과 반복 실행은 Hydrogen에게 넘기는 이원화 전략</strong>을 적용해 보시기 바랍니다. Hydrogen은 Free tier로 먼저 감을 잡고, Carbon은 보안 감사나 난해한 디버깅처럼 실패 비용이 큰 순간에만 투입하는 편이 현실적입니다.

---

> <strong>수치 기준</strong>: 2026년 11월 16일 확인. TPS·Intelligence Index는 Artificial Analysis 측정값으로, Carbon은 High, Hydrogen은 Xhigh 기준입니다. 벤치마크는 측정 주체·노력도·시점에 따라 달라지며, 가격은 2026년 11월 30일까지의 도입가입니다.

> <strong>참고 자료</strong>
>
> - [Google — Gemini 4 Carbon is now available](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-carbon-now-available/)
> - [Google — Introducing Gemini 4 Hydrogen](https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-hydrogen/)
> - [Google — Build with Gemini 4 Hydrogen](https://blog.google/innovation-and-ai/technology/developers-tools/build-with-gemini-4-hydrogen/)
> - [Google — Google Search gets a major upgrade with Gemini 4 Hydrogen](https://blog.google/products-and-platforms/products/search/gemini-4-hydrogen-search-upgrade/)
> - [Google AI — Gemini models](https://ai.google.dev/gemini-api/docs/models)
> - [Google AI — Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)
> - [Artificial Analysis — Gemini 4 Carbon](https://artificialanalysis.ai/models/gemini-4-carbon)
> - [Artificial Analysis — Gemini 4 Hydrogen](https://artificialanalysis.ai/models/gemini-4-hydrogen)
> - [OpenRouter — Gemini 4 Carbon](https://openrouter.ai/google/gemini-4-carbon)
> - [OpenRouter — Gemini 4 Hydrogen](https://openrouter.ai/google/gemini-4-hydrogen)
> - [이전 글: 구글 Gemini 4 Argon 완전 분석: 100만 토큰과 가격](/posts/20261014-1-gemini-4-argon-analysis-guide/)
