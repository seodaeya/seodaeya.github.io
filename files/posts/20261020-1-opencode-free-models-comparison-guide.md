---
category: "AI & Intelligence"
title: "OpenCode 무료 모델 9종 장단점: 용도별 선택 가이드"
date: "2026-10-20"
image: "/images/opencode_free_models_comparison_thumbnail.jpg"
tags: ["OpenCode", "FreeAI", "DeepSeek", "GLM", "MiniMax", "Nemotron", "CodingAgent", "LLM"]
excerpt: "OpenCode에서 무료로 쓸 수 있는 9개 모델을 컨텍스트·출력 한도, 코딩 성능, 멀티모달 지원, 데이터 정책 기준으로 비교합니다. 2026년 10월 OpenCode Data 실사용량과 상황별 선택법까지 한 번에 정리했습니다."
---

## 🚀 1. 무료 모델 9종, 지금 다시 정리하는 이유

OpenCode의 무료 모델 라인업은 고정되어 있지 않습니다. 어떤 모델은 조용히 사라지고, 어떤 모델은 이름만 남은 채 유료로 전환됩니다. 실제로 2026년 10월 초까지 무료로 제공되던 Muse Spark 1.3 Contributor Free는 현재 사용할 수 없고, UI에는 유료 모델만 남아 있습니다. 무료 모델을 고를 때는 <strong>“지금 이 모델이 정말 무료인가”</strong>와 <strong>“내 작업에 맞는가”</strong>를 함께 확인해야 합니다.

2026년 10월 20일 기준, OpenCode Console에서 무료로 제공되는 모델 중 코딩 에이전트의 메인·서브로 바로 쓸 수 있는 9종은 다음과 같습니다.

- Beam Free
- DeepSeek V4.1 Flash Free
- GLM-5.3-Flash Free
- LongCat 2.5 Preview Free
- MiMo-V2.6-Flash Free
- MiniMax M3.1 Flash Free
- Nemotron 3 Ultra Free
- Nemotron 3.5 Lightning Free
- Nemotron 3.5 Super VL Free

OpenCode 문서에는 Big Pickle, LL Alpha Free, Exo Free, MiMo-V2.5 Free, Jev 1.13 Free처럼 추가 무료 모델도 있습니다. 이 글은 그중에서도 코딩 작업에 바로 투입할 수 있는 9종만 다룹니다.

모두 <strong>입력·출력·캐시 토큰 요금이 0원</strong>입니다. 하지만 무료라는 말이 모든 조건에서 같다는 뜻은 아닙니다. 모델마다 문맥 길이와 출력 한도가 다르고, 잘하는 작업이 다르며, 프롬프트 데이터를 어떻게 처리하는지도 다릅니다. 특히 무료 프로모션은 <strong>한시적</strong>이고, 요청량이나 속도에 제한이 붙을 수 있습니다.

이 글은 다음 기준으로 작성했습니다.

- <strong>문맥·출력 수치</strong>: OpenCode 모델 카탈로그 기준. 원 제공사 스펙과 다를 수 있습니다.
- <strong>성능 수치</strong>: 각 제공사 모델 카드와 공개 벤치마크. 측정 조건이 모델마다 다릅니다.
- <strong>실사용량</strong>: OpenCode Data의 최근 7일 토큰 사용량. 무료와 유료 변형이 합산된 값입니다.
- <strong>데이터 정책</strong>: OpenCode 공식 문서의 무료 모델 고지 기준.

> 📌 <strong>먼저 기억할 것</strong><br />
> 무료 모델은 “토큰 비용이 0원”일 뿐, “무제한”이나 “무조건 안전”이 아닙니다. 민감한 코드일수록 모델의 데이터 정책을 먼저 확인하세요.

---

## 📊 2. 한눈에 보는 9종 비교

| 모델 | 문맥/출력 | 강점 | 약점 | 용도 |
| :--- | :--- | :--- | :--- | :--- |
| <strong>DeepSeek V4.1 Flash Free</strong> | 200K / 32K<br />(원본 1M / 384K) | 코딩·추론 최상위, 텍스트+이미지 | 지식 컷오프 2025-05, 32K 출력, 느릴 수 있음 | 복잡한 디버깅, 리팩터링, 알고리즘 |
| <strong>GLM-5.3-Flash Free</strong> | 200K / 32K<br />(원본 1M) | 균형 최고, 멀티모달(영상·PDF) | 최상난도 추론은 DeepSeek에 밀림 | 일상 코딩 기본, 프론트/UI, 문서 |
| <strong>MiMo-V2.6-Flash Free</strong> | 200K / 32K<br />(원본 1M) | 옴니모달, 에이전트 강함 | 데이터 학습 이용 가능, 추론 강도 조절 불가 | 멀티모달 에이전트, GUI 자동화 |
| <strong>MiniMax M3.1 Flash Free</strong> | 1M / 512K | 초장문, 512K 출력, 멀티모달 | 코딩 일관성 중간, 신모델 | 대형 저장소 분석, 장문 생성 |
| <strong>LongCat 2.5 Preview Free</strong> | 1M / 131K | 1M 문맥·툴콜, 텍스트+이미지 | 공식 코딩 벤치 제한적, 프리뷰, API 전용 | 장기 에이전트, 대형 코드베이스 탐색 |
| <strong>Beam Free</strong> | 1M / 131K | 토큰 효율, 1M, 텍스트 전용 | 비전 불가, DeepSWE 43.0, 30일 보관 | 장문 텍스트/코드 분석 |
| <strong>Nemotron 3 Ultra Free</strong> | 1M / 128K | GPQA 86.7, 추론·오케스트레이션 | 코딩 지수 낮음, 느림, 데이터 로깅 | 계획·리서치·멀티에이전트 설계 |
| <strong>Nemotron 3.5 Lightning Free</strong> | 262K / 262K<br />(원본 최대 1M) | 300+ tps, SWE 51.6, 텍스트 전용 | 복잡한 추론 약함, 데이터 로깅 | 단순 수정, 서브에이전트, 대량 작업 |
| <strong>Nemotron 3.5 Super VL Free</strong> | 1M / 131K | UI·문서·영상, 600+ tps | 코딩 메인으로는 약함, 데이터 로깅 | 스크린샷·PDF·영상 분석 |

모델 ID는 `/models`에서 확인할 수 있습니다. 설정 파일에는 `opencode/<모델 ID>` 형식으로 넣으며, 예를 들어 GLM은 `opencode/glm-5.3-flash-free`, DeepSeek은 `opencode/deepseek-v4.1-flash-free`입니다.

> ⚠️ <strong>수치 해석 주의</strong><br />
> DeepSeek·GLM·MiMo는 원 제공사 기준 1M 문맥을 지원하지만, OpenCode 무료 엔드포인트에서는 200K로 표시됩니다. 반대로 LongCat·Beam·MiniMax·Nemotron Ultra·Super VL은 OpenCode에서도 1M급 문맥을 제공합니다. 실제 요청 전에는 `/models`의 표시를 한 번 더 확인하세요.

---

## 🔍 3. 코딩 성능: DeepSeek vs GLM vs MiMo

코딩 에이전트의 메인 모델로 쓸 수 있는 후보는 크게 세 개입니다. <strong>DeepSeek V4.1 Flash</strong>, <strong>GLM-5.3-Flash</strong>, <strong>MiMo-V2.6-Flash</strong>입니다.

| 벤치마크 | DeepSeek V4.1 Flash | GLM-5.3-Flash | MiMo-V2.6-Flash |
| :--- | :--- | :--- | :--- |
| DeepSWE v1.1 | <strong>74.2</strong> | 63.4 | 67.9 |
| Terminal-Bench 2.1 | <strong>90.6</strong> | 84.3 | 87.6 |
| GPQA Diamond | <strong>90.9</strong> | 공개 수치 없음 | 공개 수치 없음 |
| OSWorld-Verified | 공개 수치 없음 | 공개 수치 없음 | 80.8 |
| 특징 | 코드 추론·알고리즘 최상위 | 균형·멀티모달·프론트엔드 | 옴니모달·에이전트 자동화 |

> 위 수치는 각 제공사 모델 카드와 공개 벤치마크를 정리한 값입니다. 측정 조건과 하네스가 다르므로 절대적인 순위로 단정하지 마세요.

### 1) DeepSeek V4.1 Flash Free — 가장 똑똑하지만, 최신 지식은 약점

DeepSeek V4.1 Flash는 552B MoE에 입력 8B, 출력 16B를 활성화하는 모델로, 코딩과 추론 벤치마크에서 무료 모델 중 가장 앞선 수치를 보여줍니다. DeepSWE 74.2, Terminal-Bench 2.1 90.6, GPQA 90.9, Codeforces 3471은 단순한 마케팅 숫자가 아니라 <strong>실제 어려운 문제를 끝까지 풀어내는 힘</strong>을 보여주는 지표입니다.

다만 OpenCode 무료 환경에서는 문맥 200K, 출력 32K로 제한됩니다. 원본 모델의 1M 문맥과 384K 출력을 모두 쓰는 것은 아닙니다. 또 지식 컷오프가 2025년 5월이라 2026년 최신 라이브러리나 API 변경 사항은 직접 문서를 확인해야 합니다. 사고 과정이 길어져 단순 작업에서는 오히려 느릴 수 있습니다.

- <strong>이럴 때</strong>: 원인을 찾기 어려운 버그, 대규모 리팩터링, 알고리즘 문제, 테스트 케이스 설계.
- <strong>피할 때</strong>: 빠른 오타 수정, 단순 보일러플레이트, 최신 API 사용법을 바로 알아야 하는 작업.

### 2) GLM-5.3-Flash Free — 가장 무난한 기본값

GLM-5.3-Flash는 320B MoE에 18B를 활성화하는 모델로, Z.ai가 발표한 Artificial Analysis Intelligence Index 57과 Terminal-Bench 2.1 84.3을 기록했습니다. Z.ai의 자체 평가에서는 Claude Opus 4.8에 근접하는 코딩 성능을 보여줍니다. 텍스트뿐 아니라 이미지, 영상, PDF를 입력으로 받을 수 있어 <strong>프론트엔드·UI·문서 작업</strong>에서 활용도가 높습니다.

OpenCode에서는 200K/32K로 표시되지만, 일상적인 코드 수정과 파일 단위 작업에는 충분합니다. DeepSeek만큼 어려운 추론 문제를 잘 풀지는 못하지만, 속도와 품질의 균형이 좋아 <strong>기본 모델로 두고 쓰기 가장 편한 선택</strong>입니다.

- <strong>이럴 때</strong>: 일상 코딩, React/Next.js 프론트엔드, UI 스크린샷 분석, PDF 문서 요약.
- <strong>피할 때</strong>: 최상위 난도의 알고리즘 문제, 아주 긴 단일 출력이 필요한 작업.

### 3) MiMo-V2.6-Flash Free — 멀티모달 에이전트에 강함

MiMo-V2.6-Flash는 309B MoE에 15B를 활성화하는 모델로, DeepSWE 67.9, Terminal-Bench 2.1 87.6, OSWorld-Verified 80.8을 기록했습니다. 텍스트·이미지·오디오·영상을 모두 입력으로 받을 수 있어 <strong>브라우저·GUI 자동화나 멀티모달 에이전트</strong>에 적합합니다.

주의할 점은 두 가지입니다. 첫째, 추론 강도를 세밀하게 조절하는 옵션이 없습니다. 둘째, 무료 기간에 수집된 데이터가 모델 개선에 사용될 수 있습니다. 회사 코드나 고객 정보가 포함된 작업에는 그대로 쓰지 않는 편이 안전합니다.

- <strong>이럴 때</strong>: 이미지·오디오·영상이 섞인 자동화, GUI 조작, 개인 프로젝트.
- <strong>피할 때</strong>: 민감한 소스코드, 보안 취약점 점검, 데이터 학습이 금지된 프로젝트.

---

## 🧠 4. 1M 장문 사용량: LongCat vs Beam vs MiniMax

문맥 길이만 보면 <strong>LongCat 2.5 Preview</strong>, <strong>Beam Free</strong>, <strong>MiniMax M3.1 Flash</strong>가 눈에 띕니다. 셋 다 1M 문맥을 제공하지만, 성격은 완전히 다릅니다.

### 1) LongCat 2.5 Preview Free — 장기 에이전트형

LongCat 2.5 Preview는 1.6T MoE에 약 48B를 활성화하는 Meituan의 프리뷰 모델입니다. 1M 문맥과 네이티브 이미지 이해를 지원하며, 터미널·브라우저·GUI·스프레드시트 같은 장기 작업을 겨냥합니다.

공식 코딩 벤치마크가 제한적이라는 점은 분명한 약점입니다. 공개된 실사용 후기에서는 문맥 유지, 툴 호출, 블로커 우회 능력이 좋다는 평가가 나오지만, 이는 벤치마크가 아닌 개인 경험입니다. 프리뷰 모델이고 API 전용이며 오픈 웨이트도 아닙니다. <strong>대형 코드베이스를 탐색하는 용도로는 매력적이지만, 핵심 프로덕션 작업에는 결과 검증이 필수</strong>입니다.

### 2) Beam Free — 토큰 효율형 텍스트 specialist

Beam은 Reflection의 501B MoE 모델로, 23B를 활성화합니다. 1M 문맥을 지원하고 텍스트만 입력받습니다. SWE-bench Pro 65.9를 기록했지만 DeepSWE 43.0, SciCode 48.3으로 코딩 최상위권은 아닙니다. 대신 <strong>토큰 효율이 좋아 긴 코드·로그·문서를 다룰 때 비용 대비 처리량이 좋습니다</strong>.

텍스트 전용이라는 점이 가장 큰 제약입니다. 스크린샷이나 PDF를 함께 넣어야 하는 작업에는 맞지 않습니다. 또한 OpenCode 문서 기준으로 프롬프트가 학습에 사용되지는 않지만 <strong>30일간 보관</strong>되며, 일부 국가에서는 사용할 수 없습니다.

### 3) MiniMax M3.1 Flash Free — 초대형 출력형

MiniMax M3.1 Flash는 1M 문맥과 <strong>512K 출력</strong>을 제공합니다. 무료 모델 중 출력 한도가 가장 크기 때문에, 아주 긴 코드나 문서를 한 번에 생성해야 할 때 유용합니다. 텍스트·이미지·영상 입력과 5단계 추론 강도 조절도 지원합니다.

반면 코딩 일관성은 GLM이나 DeepSeek보다 낮은 편입니다. 독립 평가에서 KingBench 66.25, Artificial Analysis Intelligence Index 42\~43(측정 버전에 따라 차이)을 기록했습니다. 512K 출력은 매력적이지만 생성 시간이 길고, 중간에 방향을 잃을 가능성도 있습니다. <strong>“긴 출력이 필요한 작업”에 한정해 쓰는 것이 좋습니다.</strong>

> 💡 <strong>1M 문맥의 함정</strong><br />
> 문맥이 길다고 해서 모든 내용을 정확히 기억하는 것은 아닙니다. 중간 정보를 놓치는 현상은 여전히 발생합니다. 큰 저장소를 넣을 때는 핵심 파일과 질문을 먼저 요약해 함께 넣는 편이 안정적입니다.

---

## ⚡ 5. 속도·특화: Nemotron 3종은 코딩 메인이 아니다

Nemotron 3 계열은 이름만 보면 모두 고성능 코딩 모델처럼 보이지만, 실제 성격은 다릅니다. 이 셋은 <strong>코딩 메인 모델이 아니라 특정 작업을 위한 보조 모델</strong>로 보는 것이 맞습니다.

### 1) Nemotron 3 Ultra Free — 계획·리서치·오케스트레이션

Nemotron 3 Ultra는 550B MoE에 55B를 활성화하는 대형 추론 모델입니다. GPQA Diamond 86.7, HLE 28.4로 과학·추론 문제에 강하지만, Artificial Analysis Intelligence Index 22.9, Coding Index 49.3, Terminal-Bench 2.1 53.9로 코딩 에이전트 성능은 낮은 편입니다. 느리고 토큰도 많이 씁니다.

- <strong>이럴 때</strong>: 작업 분해, 아키텍처 설계, 리서치 요약, 여러 에이전트를 조율하는 오케스트레이터.
- <strong>피할 때</strong>: 빠른 코드 수정, 대량 파일 편집, 터미널 자동화.

### 2) Nemotron 3.5 Lightning Free — 고속 서브에이전트

Nemotron 3.5 Lightning은 30B MoE에 3B를 활성화하는 초경량 모델입니다. 300+ tokens/sec의 빠른 출력과 SWE-bench Verified 51.6을 기록했습니다. 복잡한 아키텍처를 설계하기에는 부족하지만, <strong>단순 수정·파일 탐색·테스트 보조·보일러플레이트 생성</strong>에는 충분합니다.

OpenCode에서는 262K 문맥과 262K 출력으로 표시됩니다. 원 제공사 기준으로는 최대 1M 문맥을 지원합니다. 메인 모델이 느리게 느껴질 때 서브에이전트로 붙이거나, 반복 작업을 대량으로 돌릴 때 활용도가 높습니다.

### 3) Nemotron 3.5 Super VL Free — 비전 specialist

Nemotron 3.5 Super VL은 120B MoE에 12B를 활성화하는 비전-언어 모델입니다. 1M 문맥, 600+ tokens/sec, UI·문서·영상 이해를 지원합니다. 스크린샷을 읽고 코드로 옮기거나, PDF·차트·영상 내용을 분석하는 작업에 적합합니다.

코딩 메인 모델로 쓰기에는 부족합니다. 텍스트만 출력하며, 코딩 벤치마크도 다른 모델만큼 검증되어 있지 않습니다. <strong>“눈이 필요한 작업”을 맡기는 specialist</strong>로 쓰는 것이 정확합니다.

> 🔐 <strong>NVIDIA 무료 엔드포인트 주의</strong><br />
> Nemotron 3종은 NVIDIA의 무료 trial 엔드포인트를 사용합니다. 개인정보나 기밀 데이터를 제출하면 안 되며, 사용 로그가 보안 및 제품 개선 목적으로 기록됩니다.

---

## 📈 6. 실제 사용량은 어땠나

OpenCode Data가 2026년 10월 20일 12:56 UTC에 갱신한 최근 7일 토큰 사용량은 다음과 같습니다. 무료와 유료 변형이 합산된 값입니다.

| 모델 | 최근 7일 토큰 | 전체 순위 |
| :--- | ---: | ---: |
| DeepSeek V4.1 Flash | 90T | 1위 |
| MiniMax M3.1 Flash | 22T | 2위 |
| MiMo-V2.6-Flash | 10T | 4위 |
| GLM-5.3-Flash | 6.2T | 5위 |
| Beam | 3.9T | 6위 |
| Nemotron 3 Ultra | 2.5T | 7위 |
| LongCat 2.5 Preview | 2.3T | 8위 |
| Nemotron 3.5 Super VL | 1.6T | 10위 |
| Nemotron 3.5 Lightning | 538B | 13위 |

DeepSeek V4.1 Flash가 90T로 압도적 1위입니다. 2위 MiniMax M3.1 Flash(22T)와 3위 Muse Spark 1.3 Contributor(21T)를 합쳐도 DeepSeek의 절반 수준입니다. MiMo-V2.6-Flash는 10T로 4위, GLM-5.3-Flash는 6.2T로 5위에 올랐습니다. 특히 GLM은 전주 대비 <strong>+159%</strong>로 가장 빠르게 성장했고, Beam과 Super VL은 이번 주 새로 순위에 진입했습니다.

이 순위는 “가장 좋은 모델” 순위가 아닙니다. <strong>얼마나 많은 사람이, 어떤 작업에, 언제부터 썼는지</strong>가 섞인 결과입니다. 모델 선택에는 성능, 문맥, 데이터 정책, 속도를 함께 봐야 합니다.

---

## 🔐 7. 데이터 정책: 무료의 진짜 비용

무료 모델을 고를 때 가장 놓치기 쉬운 것이 데이터 정책입니다. 토큰 요금이 0원이어도, 프롬프트가 학습에 사용되거나 로그로 남으면 비용은 다른 곳에서 발생합니다.

| 모델 | 데이터 정책 |
| :--- | :--- |
| <strong>GLM-5.3-Flash Free</strong> | zero-retention, 학습 미사용 (OpenCode 문서 기준) |
| <strong>DeepSeek V4.1 Flash Free</strong> | zero-retention, 학습 미사용 (OpenCode 문서 기준) |
| <strong>LongCat 2.5 Preview Free</strong> | zero-retention, 학습 미사용 (OpenCode 문서 기준) |
| <strong>MiniMax M3.1 Flash Free</strong> | zero-retention, 학습 미사용 (OpenCode 문서 기준) |
| <strong>Beam Free</strong> | 학습 미사용, 30일 보관, 일부 국가 사용 불가 |
| <strong>MiMo-V2.6-Flash Free</strong> | 무료 기간 데이터가 모델 개선에 사용될 수 있음 |
| <strong>Nemotron 3 Ultra Free</strong> | NVIDIA trial, 로그 기록, 개인·기밀 데이터 제출 금지 |
| <strong>Nemotron 3.5 Lightning Free</strong> | NVIDIA trial, 로그 기록, 개인·기밀 데이터 제출 금지 |
| <strong>Nemotron 3.5 Super VL Free</strong> | NVIDIA trial, 로그 기록, 개인·기밀 데이터 제출 금지 |

정리하면 다음과 같습니다.

- <strong>회사 코드·고객 정보·API 키</strong>가 포함된 작업은 GLM, DeepSeek, LongCat, MiniMax를 우선 사용합니다.
- <strong>개인 토이 프로젝트·학습용</strong>이라면 MiMo나 Nemotron을 써도 되지만, 민감 정보는 넣지 않습니다.
- Beam은 학습에는 쓰지 않지만 30일 보관하고 일부 국가에서 차단됩니다. 글로벌 협업 프로젝트라면 지역 제한을 확인하세요.
- MiniMax는 OpenCode 문서 기준 zero-retention이지만, 프리뷰 성격의 모델이므로 정책 변경 여부는 주기적으로 확인하는 편이 안전합니다.

---

## 🛠️ 8. 상황별 선택 가이드

<div class="diagram-container" style="margin: 36px 0; display: flex; justify-content: center; width: 100%;">
<svg viewBox="0 0 900 390" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 900px; height: auto; font-family: -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif;">
  <defs>
    <filter id="free-shadow" x="-5%" y="-5%" width="110%" height="115%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.25" />
    </filter>
  </defs>
  <rect x="10" y="10" width="880" height="370" rx="16" fill="#0f172a" stroke="#334155" stroke-width="1.5" />
  <text x="34" y="48" font-size="16" font-weight="700" fill="#f8fafc">상황별 무료 모델 선택 플로우</text>
  <line x1="30" y1="64" x2="870" y2="64" stroke="#334155" stroke-width="1" />

  <g transform="translate(34, 82)" filter="url(#free-shadow)">
    <rect width="832" height="42" rx="10" fill="#172033" stroke="#38bdf8" stroke-width="1.2" />
    <text x="18" y="27" font-size="13" font-weight="700" fill="#7dd3fc">어려운 코딩·추론</text>
    <text x="250" y="27" font-size="13" fill="#e2e8f0">DeepSeek V4.1 Flash Free</text>
    <text x="650" y="27" font-size="12" fill="#94a3b8">high / max effort</text>
  </g>

  <g transform="translate(34, 134)" filter="url(#free-shadow)">
    <rect width="832" height="42" rx="10" fill="#172033" stroke="#34d399" stroke-width="1.2" />
    <text x="18" y="27" font-size="13" font-weight="700" fill="#6ee7b7">일상 코딩·프론트·문서</text>
    <text x="250" y="27" font-size="13" fill="#e2e8f0">GLM-5.3-Flash Free</text>
    <text x="650" y="27" font-size="12" fill="#94a3b8">기본 모델 추천</text>
  </g>

  <g transform="translate(34, 186)" filter="url(#free-shadow)">
    <rect width="832" height="42" rx="10" fill="#172033" stroke="#a78bfa" stroke-width="1.2" />
    <text x="18" y="27" font-size="13" font-weight="700" fill="#c4b5fd">1M 장문·대형 저장소</text>
    <text x="250" y="27" font-size="13" fill="#e2e8f0">LongCat 2.5 / Beam / MiniMax M3.1</text>
    <text x="650" y="27" font-size="12" fill="#94a3b8">용도별 선택</text>
  </g>

  <g transform="translate(34, 238)" filter="url(#free-shadow)">
    <rect width="832" height="42" rx="10" fill="#172033" stroke="#fbbf24" stroke-width="1.2" />
    <text x="18" y="27" font-size="13" font-weight="700" fill="#fde68a">속도·단순 반복</text>
    <text x="250" y="27" font-size="13" fill="#e2e8f0">Nemotron 3.5 Lightning Free</text>
    <text x="650" y="27" font-size="12" fill="#94a3b8">서브에이전트</text>
  </g>

  <g transform="translate(34, 290)" filter="url(#free-shadow)">
    <rect width="832" height="42" rx="10" fill="#172033" stroke="#fb923c" stroke-width="1.2" />
    <text x="18" y="27" font-size="13" font-weight="700" fill="#fdba74">이미지·PDF·영상</text>
    <text x="250" y="27" font-size="13" fill="#e2e8f0">GLM-5.3-Flash / Super VL / MiMo</text>
    <text x="650" y="27" font-size="12" fill="#94a3b8">비전 specialist</text>
  </g>
  <text x="34" y="360" font-size="12" fill="#94a3b8">민감한 코드는 GLM · DeepSeek · LongCat · MiniMax 우선 / MiMo · Nemotron은 데이터 정책 확인</text>
</svg>
</div>

### 추천 조합

1. <strong>일상 코딩</strong>: GLM-5.3-Flash Free를 기본으로 두고, 막히는 문제만 DeepSeek V4.1 Flash Free로 전환합니다.
2. <strong>대형 저장소</strong>: LongCat 2.5 Preview Free로 구조를 파악하고, 실제 수정은 GLM-5.3-Flash Free로 합니다.
3. <strong>프론트엔드/UI</strong>: GLM-5.3-Flash Free에 스크린샷을 넣고, 복잡한 화면 분석은 Nemotron 3.5 Super VL Free를 보조로 씁니다.
4. <strong>대량 반복 작업</strong>: Nemotron 3.5 Lightning Free를 서브에이전트로 붙여 파일 탐색·테스트 보조를 맡깁니다.
5. <strong>설계/리서치</strong>: Nemotron 3 Ultra Free로 계획을 세우고, 구현은 DeepSeek나 GLM에 맡깁니다.
6. <strong>민감한 코드</strong>: GLM, DeepSeek, LongCat, MiniMax를 사용합니다.

---

## ⚙️ 9. OpenCode에서 바로 바꾸는 방법

모델은 TUI에서 `/models`를 실행한 뒤 `free`로 필터링해 선택할 수 있습니다. 설정 파일에 고정하려면 `opencode.jsonc`의 `model` 값을 바꿉니다.

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "model": "opencode/glm-5.3-flash-free"
}
```

단발 실행은 `--model` 옵션으로 지정할 수 있습니다.

```bash
opencode run --model "opencode/deepseek-v4.1-flash-free" "이 테스트 실패 원인을 분석해줘"
```

무료 모델은 토큰 요금이 0원이지만, 추론 강도를 높이면 느려지고 요청 소모가 커질 수 있습니다. 단순 작업은 `low`, 어려운 문제는 `high`나 `max`를 쓰는 식으로 조절하는 편이 좋습니다.

> ⚠️ <strong>무료 모델은 사라질 수 있습니다</strong><br />
> 오늘 보이는 모델이 다음 주에도 무료라는 보장은 없습니다. `opencode.jsonc`에 고정해 두었다면, 갑자기 `Model unavailable`이 나올 수 있으니 `/models`에서 대체 모델을 확인하세요.

---

## 📌 10. 요약

1. <strong>일상 코딩 기본값은 GLM-5.3-Flash Free</strong>입니다. 균형, 멀티모달, 속도가 모두 좋습니다.
2. <strong>어려운 문제는 DeepSeek V4.1 Flash Free</strong>가 가장 강합니다. 단, 지식 컷오프와 32K 출력 제한을 감안하세요.
3. <strong>1M 장문은 LongCat 2.5 Preview, Beam, MiniMax M3.1</strong>로 나뉩니다. LongCat은 장기 에이전트, Beam은 텍스트 효율, MiniMax는 초대형 출력에 적합합니다.
4. <strong>속도와 반복 작업은 Nemotron 3.5 Lightning Free</strong>, <strong>비전은 GLM과 Super VL</strong>이 실용적입니다.
5. <strong>민감한 코드는 GLM·DeepSeek·LongCat·MiniMax</strong>를 사용하세요. MiMo와 Nemotron은 데이터 학습·로깅 정책을 반드시 확인해야 합니다.

무료 모델은 “가장 좋은 하나”를 찾는 것보다 <strong>작업별로 역할을 나누는 것</strong>이 중요합니다. 메인 모델, 어려운 문제용 모델, 장문용 모델, 서브에이전트를 나눠 두면 무료 라인업이 바뀌어도 훨씬 안정적으로 대응할 수 있습니다.

---

### 🔎 참고 자료

- [OpenCode Console 모델 목록과 무료 모델 고지](https://opencode.ai/v2/docs/console/models/)
- [OpenCode Data — 최근 7일 모델 사용량](https://opencode.ai/data/)
- [models.dev — 모델별 컨텍스트·가격 메타데이터](https://models.dev/)
- [DeepSeek V4.1 Flash 모델 카드](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash)
- [GLM-5.3-Flash 공식 발표](https://z.ai/blog/glm-5.3-flash)
- [MiniMax M3.1 Flash 제품 페이지](https://agent.minimax.io/tools/m3-1-flash-preview)
- [Reflection Beam 공식 소개](https://reflection.ai/blog/introducing-beam)
- [NVIDIA Nemotron 3.5 Super VL 공식 블로그](https://developer.nvidia.com/blog/nvidia-nemotron-3-5-super-vl-powers-specialized-agents-with-multimodal-reasoning/)

---

### 📚 관련 글 함께 보기

- [<strong>OpenCode Muse Spark 1.3 무료 종료: 과금 함정과 대안</strong>](/posts/20261017-1-opencode-muse-spark-free-model-configuration-guide/): 무료 모델이 사라졌을 때 확인해야 할 과금 함정과 대체 모델 정리
- [<strong>OpenCode 무료 활용법: Muse Spark 설치부터 실전까지</strong>](/posts/20261004-1-opencode-muse-spark-free-setup-guide/): OpenCode 설치, Zen 연결, 초기 설정 가이드
- [<strong>AI 모델 버전별 진화 핵심 분석: 아키텍처부터 추론·에이전트까지</strong>](/posts/20261016-1-ai-model-version-evolution-architecture-guide/): MoE, 추론, 장문 컨텍스트, 멀티모달의 기술적 배경
