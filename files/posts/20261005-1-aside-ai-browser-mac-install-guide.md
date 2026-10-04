---
category: "AI & Intelligence"
title: "AI 브라우저 Aside 설치법: Mac 다운로드부터 실전까지"
date: "2026-10-05"
image: "/images/aside-ai-browser-mac-install-guide_thumbnail.jpg"
tags: ["Aside", "AIBrowser", "Mac", "BrowserAgent", "SetupGuide"]
excerpt: "Mac에서 AI 브라우저 Aside를 다운로드해 설치하고, 키체인 승인·자격증명 보관·AI 구독 선택까지 온보딩 전 과정을 직접 캡처와 함께 정리합니다."
---

## 🌐 1. Aside란: 웹사이트에 대신 로그인하는 AI 브라우저

<strong>Aside</strong>는 macOS와 Windows에서 동작하는 AI 브라우저입니다. 제작사는 Y Combinator 출신의 Aside Computer Inc.이며, 핵심은 <strong>브라우저 에이전트(Browser Agent)</strong>입니다. 사용자가 시키는 대로 웹사이트를 직접 열고, 로그인하고, 자료를 찾고, 스프레드시트를 정리하는 방식입니다.

기존 브라우저에 AI 확장을 끼우는 방식과 무엇이 다른지 아래 표로 정리했습니다.

| 항목 | 기존 브라우저 + AI 확장 | <strong>Aside</strong> |
| :--- | :--- | :--- |
| <strong>동작 방식</strong> | 읽고 요약하는 보조 | <strong>로그인·클릭·입력까지 대신 수행</strong> |
| <strong>자격증명</strong> | 사이트마다 직접 로그인 | <strong>Vault에 보관 후 에이전트가 대행</strong> |
| <strong>모델</strong> | 확장 제공사 종속 | <strong>내장 플랜 또는 기존 구독 재활용</strong> |
| <strong>자동화</strong> | 수동 반복 | <strong>루틴 예약·원격 조종(Pro) 지원</strong> |

이 글은 필자가 Mac에 Aside를 직접 설치하면서 거친 온보딩 전 과정을 시간 순으로 기록한 것입니다. 모든 화면은 실제 설치 캡처입니다.

---

## 💾 2. Mac 설치 3단계: dmg부터 실행까지

공식 다운로드 페이지(<strong>aside.com/download</strong>)에 접속하면 운영체제에 맞는 설치 파일이 자동으로 내려받기 시작합니다. Mac용은 <strong>Aside.dmg</strong>입니다. 내려받기가 시작되지 않으면 페이지의 수동 다운로드 링크를 누르면 됩니다.

1. <strong>다운로드 폴더에서 Aside.dmg를 엽니다.</strong>
2. <strong>Aside 아이콘을 Applications 폴더로 드래그합니다.</strong>
3. <strong>Applications에서 Aside를 실행합니다.</strong>

여기까지는 일반 Mac 앱과 동일합니다. 진짜 온보딩은 실행 직후부터 시작됩니다.

---

## 🔑 3. 키체인 승인: Arc 저장소 접근 요청의 정체

실행 후 처음 마주한 화면은 시스템 권한 요청이었습니다.

<div style="margin: 28px 0; text-align: center;">
  <img src="/images/aside_mac_setup_01_keychain.jpg" alt="Aside 설치 중 Arc Safe Storage 키체인 접근 승인 요청 화면" style="max-width: 580px; width: 100%; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);" />
  <p style="margin-top: 10px; font-size: 13px; color: var(--text-secondary, #a1a1aa);">▲ Aside가 Arc 브라우저 저장소의 키체인 접근 승인을 요청하는 화면</p>
</div>

> <strong>Aside wants to use your confidential information stored in "Arc Safe Storage" in your keychain.</strong>

당황할 수 있지만 정상 동작입니다. Aside와 Arc가 모두 Chromium 기반이라, 기존 브라우저에 저장된 <strong>비밀번호·쿠키·로그인 세션</strong>을 가져오려면 macOS 키체인 승인이 필요합니다.

| 선택지 | 의미 | 권장 |
| :--- | :--- | :--- |
| <strong>Allow</strong> | 이번 한 번만 허용 | <strong>권장 (최소 권한)</strong> |
| <strong>Always Allow</strong> | 이후에도 묻지 않고 허용 | 비권장 |
| <strong>Deny</strong> | 가져오기 건너뛰기 | 새 출발 시 선택 |

> 💡 <strong>보안 체크</strong><br />
> 설치 파일이 공식 경로에서 받은 dmg인지 먼저 확인하세요. 입력하는 것은 시스템 비밀번호가 아니라 <strong>로그인 키체인 비밀번호</strong>(보통 동일)입니다. Arc 데이터를 안 쓴다면 Deny 후 수동 로그인도 괜찮습니다.

---

## 🗝️ 4. 자격증명 보관: Aside Vault vs 비밀번호 매니저

다음 화면은 로그인 정보를 어떻게 맡길지 묻습니다.

<div style="margin: 28px 0; text-align: center;">
  <img src="/images/aside_mac_setup_02_vault.jpg" alt="Aside Vault 가져오기와 비밀번호 매니저 연결 중 선택하는 온보딩 화면" style="max-width: 640px; width: 100%; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);" />
  <p style="margin-top: 10px; font-size: 13px; color: var(--text-secondary, #a1a1aa);">▲ 자격증명 보관 방식 선택: Aside Vault 가져오기 vs 외부 비밀번호 매니저 연결</p>
</div>

* <strong>Import credentials to Aside Vault:</strong> 자격증명을 E2E 암호화 Vault에 넣는 방식입니다. 가장 매끄럽게 동작하며, 화면의 Stripe 데모처럼 에이전트가 사이트에 직접 로그인해 대시보드를 읽어 오는 것이 이 모드 기준입니다.
* <strong>Connect my password manager:</strong> 기존 1Password·Bitwarden 등을 연결하는 방식입니다. 다만 화면에도 적혀 있듯 일부 로그인이 막힐 수 있습니다.

핵심 설계는 <strong>"자격증명은 로컬에만 두고 AI 모델에게는 숨긴다"</strong>는 것입니다. 에이전트가 대신 로그인하되, 평문 비밀번호가 모델에 노출되지 않는 구조라는 주장이며, 보안 섹션(7절)에서 검증 관점을 다룹니다.

---

## 🧠 5. AI 구독 선택: 내장 플랜 vs 기존 구독 재활용

온보딩 3단계는 에이전트를 굴릴 두뇌 선택입니다.

<div style="margin: 28px 0; text-align: center;">
  <img src="/images/aside_mac_setup_03_subscription.jpg" alt="Aside 내장 플랜과 ChatGPT·Claude 기존 구독 재활용 중 선택하는 화면" style="max-width: 580px; width: 100%; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);" />
  <p style="margin-top: 10px; font-size: 13px; color: var(--text-secondary, #a1a1aa);">▲ AI 구독 선택: 내장 플랜(권장) 또는 ChatGPT·Claude 기존 구독 재활용</p>
</div>

* <strong>Aside (Recommended):</strong> 내장 플랜으로 Claude와 GPT 프론티어 모델을 함께 씁니다.
* <strong>ChatGPT:</strong> 결제 중인 Plus·Pro 구독을 재활용합니다.
* <strong>Claude:</strong> 결제 중인 Pro·Max 구독을 재활용합니다.

이미 ChatGPT Plus나 Claude Pro를 낸다면 <strong>기존 구독 재활용이 가장 경제적</strong>입니다. 에이전트용으로 이중 과금하지 않는 구조이기 때문입니다. 둘 다 없다면 내장 플랜으로 시작하면 됩니다.

---

## 💳 6. 요금제: Free로 시작해 모자랄 때 올리기

구독을 정하면 요금제 화면이 나옵니다.

<div style="margin: 28px 0; text-align: center;">
  <img src="/images/aside_mac_setup_04_pricing.jpg" alt="Aside Free 0달러와 Pro 20달러 요금제 비교 화면" style="max-width: 640px; width: 100%; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);" />
  <p style="margin-top: 10px; font-size: 13px; color: var(--text-secondary, #a1a1aa);">▲ Free(0달러 영구)와 Pro(월 20달러) 요금제 비교</p>
</div>

| 항목 | <strong>Free (0달러)</strong> | <strong>Pro (월 20달러)</strong> |
| :--- | :--- | :--- |
| <strong>크레딧</strong> | 월 500 | <strong>3배 사용량</strong> |
| <strong>루틴</strong> | 최대 3개 | <strong>무제한</strong> |
| <strong>리서치</strong> | 기본 | <strong>Ultrabrowse 딥리서치</strong> |
| <strong>부가 기능</strong> | 비밀번호 매니저·메모리 포함 | <strong>Channels 원격 조종</strong> (Cloud handoff 준비 중) |
| <strong>기존 구독 재활용</strong> | 가능 | 가능 |

문구 그대로 <strong>"Start free. Upgrade anytime"</strong>입니다. 월 500 크레딧이면 일상 작업·글감 리서치 수준은 충분하므로, 필자도 Free로 시작했습니다. Pro 차별점(Ultrabrowse·무제한 루틴)이 필요해지는 시점은 실제 써봐야 압니다.

---

## 🛡️ 7. 권한 3단계와 Final Confirm: 에이전트 안전장치

에이전트에게 일을 시키기 전에 권한 설정을 확인하세요. 입력창 주변의 권한 메뉴는 아래 3단계입니다.

| 권한 | 동작 | 권장 상황 |
| :--- | :--- | :--- |
| <strong>Read only</strong> | 읽기·검색·요약만, 쓰기 동작 없음 | <strong>정보 조사 (가장 안전)</strong> |
| <strong>Guard</strong> | 쓰기 동작 전 확인 | <strong>기본값, 일상 작업</strong> |
| <strong>Full access</strong> | 확인 없이 끝까지 실행 | 신뢰 구간·반복 루틴만 |

여기에 <strong>Final confirm</strong> 토글을 켜면 최종 실행 전 한 번 더 확정 프롬프트가 뜹니다. <strong>Guard + Final confirm 켬</strong>으로 시작해 에이전트 행동반경을 익히고, 믿을 만한 반복 작업에만 Full access를 주는 순서가 안전합니다. 결제·삭제 같은 비가역 동작이 있다면 이중 안전장치는 필수입니다.

---

## 🔬 8. 실측: AI 브라우저 평가 기사 3건 비교표 만들기

이제 에이전트에게 첫 일을 시켜 봅니다. 권한은 Guard, 질문은 아래 한 줄입니다.

```text
AI 브라우저 2026년 평가 기사 3건을 찾아 비교표로 정리해줘
```

<div style="margin: 28px 0; text-align: center;">
  <img src="/images/aside_mac_setup_05_first_chat.jpg" alt="Aside 채팅에서 할 수 있는 일을 한국어로 답변받는 첫 질의 화면" style="max-width: 640px; width: 100%; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);" />
  <p style="margin-top: 10px; font-size: 13px; color: var(--text-secondary, #a1a1aa);">▲ 첫 질의: 한국어 질문에 한국어로 기능 목록을 답변 (북마크 Chrome 가져오기 완료 상태)</p>
</div>

에이전트는 <strong>21초</strong> 만에 작업을 마쳤습니다. 사용 모델은 <strong>GPT-6 Luna Low</strong> 등급으로, Free 플랜 크레딧 부담이 적은 설정입니다.

<div style="margin: 28px 0; text-align: center;">
  <img src="/images/aside_mac_setup_06_research.jpg" alt="AI 브라우저 평가 기사 3건 비교표를 21초 만에 생성한 에이전트 실행 결과" style="max-width: 680px; width: 100%; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);" />
  <p style="margin-top: 10px; font-size: 13px; color: var(--text-secondary, #a1a1aa);">▲ 에이전트 실행 결과: 21초 만에 기사 3건 비교표와 종합 판단 생성</p>
</div>

결과물을 표로 옮기면 아래와 같습니다.

| 기사 | 평가 방식·범위 |
| :--- | :--- |
| <strong>AIMultiple: AI Web Browsers</strong> | 브라우저 10종에 동일한 웹페이지 요약, 여러 사이트 조사, 양식 자동화, 탭 간 작업을 시킴 |
| <strong>PCMag: The Best AI Web Browsers for 2026</strong> | 여러 AI 브라우저와 AI 기능을 넣은 기존 브라우저를 편집부가 테스트·리뷰하고 용도별 추천 |
| <strong>TechRepublic: 5 Best AI Browsers for 2026 Compared</strong> | 5개 제품을 기능·용도별로 비교하고 에이전트형 브라우저의 보안 위험도 다룸 |

종합 판단도 함께 내놓았습니다. 여러 사이트를 조사하고 작업을 맡기려면 Comet 같은 에이전트 기능을 살펴볼 만하지만, <strong>실제 수행은 오류나 보안 위험이 남아 있고, Google·Microsoft 앱 연동과 개인정보 보호 중 무엇을 우선하느냐에 따라 선택이 달라진다</strong>는 것입니다. 출처 3건을 명시하고 종합까지 닫는 구성이라, 첫 실측 치고 완성도가 높았습니다.

---

## ✅ 9. 보안 평가와 총평

온보딩 전 과정을 거치며 확인한 보안 설계는 아래 3층입니다.

1. <strong>자격증명 분리:</strong> 비밀번호 평문은 로컬 Vault에만 두고 모델에 노출하지 않는 구조입니다.
2. <strong>행동 권한 차등:</strong> Read only ➔ Guard ➔ Full access 3단계와 Final confirm 이중 잠금입니다.
3. <strong>민감 작업 고지:</strong> 외부 발신·게시는 먼저 묻겠다고 채팅에서 직접 밝힙니다.

다만 "E2E 암호화"와 "AI에게 숨긴다"는 주장의 실제 구현은 외부에서 검증할 수 없으므로, <strong>금융·결제 계정은 Vault에 넣지 않고 읽기 전용 조사부터 시작</strong>하는 것을 권장합니다. 필자도 이 원칙으로 쓰고 있습니다.

설치 10분, 온보딩 5분, 첫 실측 21초. AI 브라우저가 궁금했다면 Free 500 크레딧으로 직접 확인해 보세요. 브라우저가 대신 로그인하고 대신 조사하는 감각이 어떤 것인지, 이 글의 캡처만으로는 다 전달되지 않습니다.

---

### 🔗 연관 아티클 & 공식 링크 바로가기
* <strong>Aside 공식 다운로드:</strong> <a href="https://aside.com/download?os=mac" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; font-weight: 600;">Mac용 Aside 다운로드 (공식 ↗)</a>
* <strong>Aside 브라우저 에이전트:</strong> <a href="https://aside.com/features/browser-agent" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; font-weight: 600;">Browser Agent 기능 소개 (공식 ↗)</a>
* <strong>관련 글:</strong> <a href="/posts/20261004-1-opencode-muse-spark-free-setup-guide" style="color: #38bdf8; font-weight: 600;">OpenCode 무료 활용법: Muse Spark 설치부터 실전까지 (↗)</a>
