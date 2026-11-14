---
category: "Dev & Software"
title: "Cloudflare Speed 추천 설정, 정적 블로그에서 실제로 달라진 것"
date: "2026-11-14"
excerpt: "Cloudflare의 Speed 추천 설정을 적용한 뒤, 정적 블로그에서 실제로 달라진 항목과 그대로인 항목을 헤더로 확인했습니다. PageSpeed가 80점대와 100점을 오가는 이유, 캐시가 점수에 미치는 영향, RUM·0-RTT의 숨은 비용까지 정리합니다."
image: "/images/cloudflare_speed_recommended_settings_thumbnail.jpg"
tags: ["Cloudflare", "WebPerformance", "Cache", "PageSpeed", "StaticSite", "SEO"]
---

> <strong>이 글의 위치</strong>: [Cloudflare 캐시·SSL 실전 가이드](/posts/20261111-1-cloudflare-web-performance-cache-ssl-guide/)를 적용한 뒤, 체감 속도가 기대만큼 오르지 않아 Speed의 <strong>추천 사이트 설정</strong>을 한 번에 켠 기록입니다. 그 뒤 PageSpeed는 첫 측정 80점대, 두 번째 측정 100점이 나왔습니다. 설정 목록을 그대로 믿지 않고, 실제 응답 헤더와 브라우저 요청으로 무엇이 달라졌는지, 100점이 설정 덕인지 측정 변동인지 확인했습니다. 렌더링 차단과 LCP 개선은 [웹폰트 @import와 LCP 글](/posts/20261026-1-webfont-import-lcp-render-blocking/)에서 먼저 다뤘습니다.
>
> <strong>대상 독자</strong>: GitHub Pages·Vercel 같은 정적 호스팅에 Cloudflare 무료 플랜을 붙인 개인 블로그 운영자.

> <strong>3줄 요약</strong>
>
> 1. 추천 설정의 상당수는 이미 켜져 있던 항목의 재확인입니다. 이번에 실제로 추가·변경된 것은 <strong>0-RTT, Opportunistic Encryption, Cache Level Aggressive, WebSockets, RUM</strong> 5개이고, 이 중 체감 효과가 있을 만한 것은 0-RTT 정도입니다. Speed Brain은 이번 추가분이 아니라 Free 플랜 기본 활성화 항목입니다.
> 2. 이 중 <strong>RUM은 스크립트와 요청을 추가</strong>하고, <strong>0-RTT는 재전송 위험</strong>이 있습니다. 나머지는 정적 블로그에서 효과가 작거나 거의 없습니다.
> 3. PageSpeed 실험실 점수는 같은 사이트에서도 80점대와 100점을 오갑니다. 정적 자산이 엣지 캐시에 데워졌는지, 측정 시점의 네트워크가 어땠는지에 따라 달라지므로 한 번의 점수로 판단하면 안 됩니다.

> 켜고 끄는 결론만 먼저 보려면 [5. 켜둘 것과 끌 것](#heading-14)로 바로 이동하세요.

## ⚡ 1. 80점대였던 점수가 두 번째 측정에서 100점이 나왔다

<strong>Cloudflare 추천 설정은 "바닥"을 채워주는 체크리스트이지, 점수를 올리는 만능 버튼이 아닙니다. 같은 사이트의 PageSpeed 점수는 측정마다 80점대와 100점을 오갈 수 있어, 한 번의 점수로 설정 효과를 판단하면 안 됩니다.</strong>

기존 글에서는 프록시, Full (strict), `/_next/static/*` 1년 캐시, HTTP/3, Zstd 압축까지 적용했습니다. 그런데 첫 PageSpeed 측정은 80점대였고, 추천 설정을 켠 뒤 두 번째 측정에서는 100점이 나왔습니다. 같은 사이트인데 점수가 이렇게 달라지면, 무엇이 실제로 개선인지 헷갈립니다.

결론부터 정리하면 다음과 같습니다.

- 추천 설정은 <strong>"새로운 가속 기능"이라기보다 현재 플랜에서 켤 수 있는 권장 항목의 묶음</strong>입니다.
- 목록의 상당수는 이미 켜져 있었거나, 이 블로그의 정적 구조에서는 효과가 거의 없는 항목입니다.
- 실제로 달라진 것은 몇 개뿐이고, 그중에는 <strong>성능에 비용을 더하는 항목(RUM)</strong>도 있습니다.
- 점수 변화의 상당 부분은 <strong>측정 시점의 캐시 상태와 네트워크 변동</strong>일 수 있습니다. 100점은 "이 사이트가 항상 100점"이라는 뜻이 아닙니다.

| 구분 | 항목 | 실제 효과 |
|---|---|---|
| 이미 켜져 있던 것 | TLS 1.3, HTTP/2, HTTP/3, Full (strict), Always Use HTTPS, Automatic HTTPS Rewrites, Zstd | 유지. 새로 얻은 이득은 작음 |
| 이번에 추가된 것 | 0-RTT, Opportunistic Encryption, Cache Level Aggressive, WebSockets, RUM | 항목별 차이가 큼 |
| 플랜상 켤 수 없는 것 | H2 Prioritization, Polish, WebP, Prefetch URLs | 무료 플랜에서는 OFF가 정상 |
| 그대로 둔 것 | HSTS, Minify, Rocket Loader | 의도적으로 OFF |
| 목록에 없지만 켜진 것 | Speed Brain | Free 플랜 기본 활성화 |

두 번째 측정이 100점이었다는 것은, 그 실행에서 <strong>FCP 0.9초·LCP 0.9초·TBT 10ms·CLS 0.003</strong>이 나왔다는 뜻입니다. (단일 실행 값이며, 모바일/데스크톱 구분과 측정 시각은 따로 기록하지 않았습니다. 재현 기준이 아니라 참고용 수치로 봐주세요.) 이 정도면 정적 페이지가 매우 빠르게 로드된 것이고, 점수도 그에 맞게 나온 것입니다. 문제는 같은 URL도 실행할 때마다 이 값이 조금씩 달라진다는 점입니다.

> <strong>측정 팁</strong>: PageSpeed는 같은 URL도 실행할 때마다 점수가 달라집니다. 3\~5회 실행해 중앙값을 보고, 가능하면 필드 데이터(CrUX)와 함께 판단하세요.

## 🔍 2. 기존 구성과 무엇이 달라졌나

기존 글에서 권장하거나 적용했다고 기록한 구성을 기준으로 비교했습니다. Cloudflare 대시보드의 표시값과 실제 응답 헤더를 함께 봤기 때문에, "설정 화면에는 ON인데 실제로는 효과가 없는" 항목도 구분할 수 있습니다.

### 2-1. SSL·프로토콜

| 항목 | 기존 글의 구성 | 현재 | 실제 효과 | 판정 |
|---|---|---|---|---|
| SSL/TLS 모드 | Full (strict) | Full (strict) | 원본 인증서 검증 유지 | 그대로 |
| TLS 1.3 | 사용 | 사용 | 최신 TLS 협상 | 그대로 |
| HTTP/2 | 사용 | 사용 | 멀티플렉싱 | 그대로 |
| HTTP/3 (QUIC) | 사용 | 사용 | `alt-svc: h3` 확인 | 그대로 |
| 0-RTT | 언급만 하고 신중히 권장 | <strong>ON</strong> | 재방문자의 연결 재개 | <strong>추가</strong> |
| Always Use HTTPS | 사용 | 사용 | HTTP → HTTPS 리디렉션 | 그대로 |
| Automatic HTTPS Rewrites | 사용 | 사용 | 혼합 콘텐츠 완화 | 그대로 |
| Opportunistic Encryption | 언급 없음 | <strong>ON</strong> | HTTP URI를 TLS로 업그레이드 | <strong>추가</strong> |
| HSTS | 조건부 권장 | OFF | Strict-Transport-Security 없음 | 그대로 |

### 2-2. 캐시·콘텐츠

| 항목 | 기존 글의 구성 | 현재 | 실제 효과 | 판정 |
|---|---|---|---|---|
| `_next/static/*` | 1년 캐시 | 1년 캐시 | 해시 파일명에 안전 | 그대로 |
| HTML | 캐시 안 함 | `DYNAMIC` | 배포 즉시 엣지 반영 | 그대로 |
| 이미지 | 4시간 | 4시간 | 교체 주기와 균형 | 그대로 |
| Cache Level | Standard | <strong>Aggressive</strong> | 쿼리스트링이 붙은 정적 자산도 캐시 | <strong>추가</strong> |
| Early Hints | 조건부 권장 | ON | `Link` 헤더가 없어 효과 제한 | 표시만 ON |
| Brotli | 사용 | ON | 실제 협상은 Zstd가 우선 | 그대로 |
| Minify | OFF | OFF | Auto Minify deprecated | 그대로 |
| Polish·WebP | Pro 플랜 | OFF | 무료 플랜에서는 불가 | 해당 없음 |
| Prefetch URLs | Enterprise | OFF | 무료 플랜에서는 불가 | 해당 없음 |

### 2-3. 보안·기타

| 항목 | 기존 글의 구성 | 현재 | 실제 효과 | 판정 |
|---|---|---|---|---|
| Rocket Loader | OFF | OFF | Next.js 하이드레이션 보호 | 그대로 |
| WebSockets | 언급 없음 | <strong>ON</strong> | 정적 블로그에는 WebSocket 없음 | <strong>추가</strong> |
| RUM (Web Analytics) | GA4가 있으면 OFF 권장 | <strong>ON</strong> | `beacon.min.js`와 `/cdn-cgi/rum` 추가 | <strong>변경·비용</strong> |
| H2 Prioritization | Pro 플랜 | OFF | 무료 플랜에서는 불가 | 해당 없음 |
| Page Rules | 사용 안 함 | 없음 | Cache Rules로 대체 | 그대로 |
| Speed Brain | 언급 없음 | <strong>ON</strong> | 다음 페이지 prefetch | <strong>기본 활성화</strong> |

### 2-4. "추가"와 "변경"을 구분해야 하는 이유

설정 목록만 보면 전부 추가처럼 보이지만, 실제로는 세 종류가 섞여 있습니다.

1. <strong>순수 추가</strong>: 0-RTT, Opportunistic Encryption, WebSockets. 기존 동작을 깨지는 않지만, 기대만큼 빠르지도 않습니다.
2. <strong>동작 변경</strong>: Cache Level Aggressive, RUM. 캐시 범위와 주입 스크립트가 달라집니다.
3. <strong>표시만 ON</strong>: Early Hints, Brotli. 설정은 켜져 있지만 이 사이트의 실제 응답에서는 효과가 제한적입니다.

특히 <strong>RUM은 "성능 기능"이 아니라 측정 기능</strong>입니다. Web Analytics 자동 설정이 켜지면 브라우저에 `beacon.min.js`가 주입되고, `/cdn-cgi/rum` 요청이 추가됩니다. 이미 GA4로 충분하다면 성능에는 마이너스입니다.

## 🧪 3. 헤더로 확인한 실제 상태

대시보드 표시는 "의도"이고, 실제 응답은 다를 수 있습니다. 아래는 라이브 사이트에서 직접 확인한 값입니다.

```bash
# HTML
curl -sI https://nardlog.com/ \
  | grep -iE '^(cache-control|cf-cache-status|alt-svc|speculation-rules|strict-transport-security):'
```

```text
cache-control: max-age=600
cf-cache-status: DYNAMIC
alt-svc: h3=":443"; ma=86400
speculation-rules: "/cdn-cgi/speculation"
```

| 확인 항목 | 결과 | 의미 |
|---|---|---|
| HTML 캐시 | `cf-cache-status: DYNAMIC` | Cache Level Aggressive에서도 HTML은 캐시하지 않음 |
| HTML 브라우저 캐시 | `max-age=600` | 재방문자는 최대 10분간 이전 HTML |
| HTTP/3 | `alt-svc: h3` | QUIC 협상 가능 |
| Speed Brain | `speculation-rules` | 다음 페이지 prefetch 규칙 제공 |
| HSTS | 헤더 없음 | HSTS는 아직 OFF |
| Early Hints | `Link` 헤더 없음 | 103 Early Hints의 전제가 없음 |

정적 자산과 이미지도 확인했습니다.

```bash
u=$(curl -s https://nardlog.com/ | grep -o '/_next/static/[^"]*\.js' | head -1)
curl -sI "https://nardlog.com$u" | grep -iE '^(cache-control|cf-cache-status|age):'
curl -sI "https://nardlog.com$u?v=1" | grep -iE '^(cache-control|cf-cache-status|age):'
```

```text
cache-control: max-age=31536000
cf-cache-status: HIT
cache-control: max-age=31536000
cf-cache-status: HIT
```

<strong>Cache Level Aggressive의 실제 범위</strong>도 이렇게 확인했습니다. 쿼리스트링이 붙은 정적 자산은 캐시되지만, HTML은 `?v=1`을 붙여도 `DYNAMIC`입니다. 즉 "HTML까지 캐시하는 Cache Everything"과는 다릅니다.

압축은 `Accept-Encoding`에 따라 달라집니다.

```bash
curl -sI -H 'Accept-Encoding: gzip, br, zstd' https://nardlog.com/ \
  | grep -iE '^(content-encoding|vary):'
```

```text
content-encoding: zstd
vary: Accept-Encoding
```

Brotli 토글이 켜져 있어도, Zstd를 지원하는 클라이언트에는 Zstd가 선택됩니다. "Brotli ON"을 "항상 Brotli"로 읽으면 안 됩니다.

RUM은 `curl`이 아니라 실제 브라우저에서 확인해야 보입니다. 헤드리스 Chrome으로 열었을 때 `beacon.min.js`와 `/cdn-cgi/rum` 요청이 발생했습니다. 반면 `curl` HTML에는 해당 스크립트가 없었습니다. 봇/도구 요청에는 주입되지 않을 수 있다는 뜻입니다.

## 🧠 4. 80점과 100점, 무엇이 다른가

### 4-1. 실험실 점수는 한 번의 표본이다

PageSpeed Insights의 성능 점수는 Lighthouse 실행 한 번의 결과입니다. 같은 URL이라도 측정 시점의 네트워크, Google 쪽 러너의 CPU, 엣지 캐시 상태에 따라 FCP·LCP가 조금씩 달라지고, 가중 평균인 점수는 80점대와 100점을 오갈 수 있습니다.

특히 이 사이트는 정적 페이지라서, 콘텐츠가 가볍고 LCP가 1초 안쪽으로 나오면 100점이 가능합니다. 반대로 첫 실행에서 정적 자산이 `MISS`였거나 네트워크가 느렸다면 80점대가 나올 수 있습니다. <strong>코드를 바꾸지 않아도 점수가 달라지는 구간</strong>입니다.

### 4-2. 캐시가 점수를 바꿀 수 있는 부분

PageSpeed의 브라우저는 실행마다 새 프로필을 쓰므로, 방문자 브라우저 캐시는 공유되지 않습니다. 하지만 <strong>Cloudflare 엣지 캐시는 공유</strong>됩니다.

- HTML: `DYNAMIC` → 매번 원본(GitHub Pages)까지 요청
- JS·CSS·이미지: 첫 요청 `MISS`, 이후 `HIT`
- 두 번째 측정에서는 정적 자산이 이미 엣지에 데워져 있었을 <strong>가능성</strong>이 있습니다. 다만 당시 `cf-cache-status`를 측정 전후로 기록하지 않았기 때문에, 캐시 효과인지 단순한 측정 변동인지는 구분할 수 없습니다.

이 차이를 확인하려면 측정 전후에 `cf-cache-status`를 보면 됩니다. HTML이 `DYNAMIC`이고 JS·이미지가 `HIT`라면 정상적인 상태입니다. "캐시가 되어서 100점이 나왔다"고 단정할 수는 없고, 캐시 효과와 측정 변동이 섞여 있다고 보는 편이 정확합니다.

### 4-3. TTFB는 Cloudflare만으로 해결되지 않는다

HTML은 `DYNAMIC`이라 엣지가 캐시하지 않고 원본까지 가져옵니다. Cloudflare는 TLS 종료와 엣지까지의 구간을 줄여주지만, 원본 응답 자체의 지연까지 없애지는 못합니다.

이 글을 작성할 때 측정한 HTML TTFB는 약 0.23초였습니다. 100점이 나온 실행에서도 TTFB가 극적으로 달라졌다기보다는, FCP·LCP·TBT가 모두 좋은 구간에 들어왔다고 보는 편이 자연스럽습니다. TTFB가 1초 이상이라면 캐시 TTL보다 원본 응답과 HTML 생성 방식부터 봐야 합니다.

### 4-4. 진짜 병목은 JS 실행과 LCP인 경우가 많다

캐시 헤더는 다운로드 횟수를 줄이지만, <strong>이미 내려받은 JavaScript의 실행 시간</strong>을 줄이지는 않습니다. Next.js 청크가 많거나, 폰트·이미지가 LCP를 막거나, 서드파티 스크립트가 메인 스레드를 점유하면 TTL을 아무리 늘려도 점수는 잘 오르지 않습니다.

반대로 이 사이트처럼 TBT 10ms, LCP 0.9초가 나오는 날에는 캐시 설정이 이미 충분히 받쳐주고 있다는 뜻입니다. 렌더링 차단과 LCP를 먼저 해결한 과정은 [웹폰트 @import와 LCP 글](/posts/20261026-1-webfont-import-lcp-render-blocking/)에 정리했습니다.

### 4-5. RUM 비콘은 작지만 공짜는 아니다

`beacon.min.js`는 작은 스크립트지만, 초기 HTML 파싱 직후 서드파티 도메인으로 연결이 하나 늘어납니다. 네트워크가 느린 모바일에서는 이 한 번의 연결이 체감에 영향을 줄 수 있습니다. 측정 데이터가 필요 없다면 끄는 편이 낫습니다. 두 번째 측정(100점) 때도 RUM은 ON 상태였으므로, 이 요청이 있어도 100점은 가능했다는 뜻입니다. 즉 비콘은 "점수를 크게 깎는 요인"이라기보다 "굳이 감수할 이유가 없는 추가 비용"에 가깝습니다.

### 4-6. 캐시 적중률은 "두 번째 방문"부터다

첫 요청은 항상 `MISS`입니다. `cf-cache-status`와 `age`를 보면 캐시가 실제로 쓰이는지 확인할 수 있습니다.

- `MISS` → `HIT`로 바뀌지 않으면 캐시 키나 TTL을 의심합니다.
- `DYNAMIC`은 오류가 아니라 "캐시 대상이 아님"입니다.
- `EXPIRED`는 TTL 만료 후 재검증입니다.

## 💸 5. 켜둘 것과 끌 것

| 항목 | 판단 | 이유 |
|---|---|---|
| Full (strict) | 유지 | 원본 구간까지 암호화·검증 |
| `_next/static/*` 1년 | 유지 | 해시 파일명이라 안전 |
| HTML 캐시 안 함 | 유지 | 배포 즉시 반영, 개인화 여지 |
| HTTP/3·TLS 1.3 | 유지 | 이미 켜져 있고 비용 없음 |
| Zstd/Brotli | 유지 | 협상에 맡기면 됨 |
| Rocket Loader OFF | 유지 | Next.js 하이드레이션과 충돌 |
| Minify OFF | 유지 | Auto Minify는 deprecated |
| HSTS | 보류 | 모든 서브도메인이 HTTPS가 될 때까지 OFF |
| Cache Level Aggressive | 유지 | 정적 자산 쿼리스트링 캐시. HTML에는 영향 없음 |
| 0-RTT | 유지 검토 | 정적 GET에는 이점, 재전송 위험은 감수 |
| Opportunistic Encryption | 유지 | 비용이 없고 Always HTTPS가 켜져 있어 효과는 작지만 해로울 것도 없음 |
| WebSockets | OFF | 이 블로그는 WebSocket을 쓰지 않으므로 켤 이유가 없음 |
| RUM | <strong>OFF 권장</strong> | GA4가 있으면 중복 측정·추가 요청 |
| Early Hints | 유지 | `Link` 헤더가 없으면 효과 제한 |
| H2 Prioritization·Polish·WebP·Prefetch | 해당 없음 | 무료 플랜에서 켤 수 없음 |

<strong>추천 설정은 "바닥"이지 "만능 버튼"이 아닙니다.</strong> 이 목록을 켰다고 해서 LCP가 2초대로 내려가거나 TBT가 사라지지는 않습니다. 그건 JavaScript 번들, 이미지, 폰트, 서드파티 스크립트의 문제입니다.

## 📏 6. 다음에 측정할 것

1. <strong>같은 조건으로 3\~5회 반복</strong>: PageSpeed를 한 번 돌리고 결론 내리지 않습니다. 모바일·데스크톱을 각각 3\~5회 실행해 <strong>중앙값</strong>을 봅니다. 최고점보다 중앙값이 사이트의 실제 위치에 가깝습니다.
2. <strong>웜 캐시 vs 콜드 캐시</strong>: 측정 직전에 HTML과 정적 자산의 캐시 상태를 기록합니다. 같은 URL을 두 번 요청해 MISS가 HIT로 바뀌는지, 그 상태가 점수와 함께 움직이는지 비교합니다.
3. <strong>필드 데이터</strong>: Search Console의 Core Web Vitals와 CrUX를 며칠 뒤에 확인합니다. 실험실 점수보다 실제 사용자 체감에 가깝고, 100점이 일회성인지 판별하는 기준이 됩니다.
4. <strong>다음 페이지 이동</strong>: Chromium 121 이상에서 Speed Brain이 동작하는지 `Speculation-Rules` 헤더와 Network 패널로 확인합니다.
5. <strong>TTFB</strong>: `curl -w`로 HTML과 정적 자산의 TTFB를 분리해 측정합니다. 점수가 흔들릴 때 원본 응답이 원인인지 구분할 수 있습니다.
6. <strong>한 번에 하나씩</strong>: RUM을 끄거나 0-RTT를 켜는 식으로 한 항목만 바꾸고 전후를 비교합니다. 여러 개를 동시에 바꾸면 80점과 100점의 차이를 설명할 수 없습니다.

```bash
fmt='dns=%{time_namelookup} connect=%{time_connect}'
fmt="$fmt tls=%{time_appconnect}"
fmt="$fmt ttfb=%{time_starttransfer} total=%{time_total}\n"
for i in 1 2 3; do
  curl -o /dev/null -s -w "$fmt" https://nardlog.com/
done
```

## 🧭 7. 정리

Cloudflare의 추천 설정은 <strong>이미 잘 되어 있는 구성을 빠뜨리지 않게 해주는 체크리스트</strong>에 가깝습니다. 이번에 새로 켜진 항목 중 체감 속도를 바꿀 만한 것은 0-RTT 정도이고, 기본 활성화 상태인 Speed Brain과 함께 둘 다 <strong>첫 페이지가 아니라 재방문·다음 페이지</strong>에서 효과가 납니다.

두 번째 측정에서 나온 100점은 <strong>그 실행이 빠르게 끝났다는 증거</strong>이지, 추천 설정이 80점을 100점으로 끌어올렸다는 증거는 아닙니다. 정적 자산이 엣지에서 `HIT`였고, TBT 10ms·LCP 0.9초가 나온 좋은 표본이었습니다. 같은 조건에서 다시 돌리면 90점대가 나올 수도 있습니다.

반대로 RUM은 측정 기능이지만 요청을 추가하고, Early Hints는 `Link` 헤더가 없으면 효과가 없습니다. "ON"이라는 표시만 보고 기대하면 실망하기 쉽습니다.

정적 블로그에서 속도를 올리는 순서는 여전히 다음과 같습니다.

1. JavaScript와 폰트·이미지의 <strong>전송량과 실행 시간</strong>을 줄인다.
2. 해시가 붙은 정적 자산만 길게 캐시한다.
3. HTML은 캐시하지 않고 배포 즉시 반영한다.
4. 불필요한 서드파티와 RUM 비콘을 정리한다.
5. 그 다음에 HTTP/3, 0-RTT, Speed Brain 같은 <strong>재방문 최적화</strong>를 얹는다.

설정을 켜는 일보다, 무엇이 실제로 달라졌는지 헤더로 확인하는 일이 더 중요합니다. 점수는 한 번의 실행이 아니라 <strong>반복 측정의 중앙값과 필드 데이터</strong>로 판단해야 합니다.

---

> <strong>참고 자료</strong>
>
> - [Cloudflare Speed Recommendations](https://developers.cloudflare.com/speed/optimization/recommendations/)
> - [Speed Brain](https://developers.cloudflare.com/speed/optimization/content/speed-brain/)
> - [0-RTT Connection Resumption](https://developers.cloudflare.com/speed/optimization/protocol/0-rtt-connection-resumption/)
> - [Opportunistic Encryption](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/opportunistic-encryption/)
> - [Cache Level (Cache Everything)](https://developers.cloudflare.com/cache/how-to/cache-rules/examples/cache-everything/)
> - [Early Hints](https://developers.cloudflare.com/cache/advanced-configuration/early-hints/)
> - [Web Analytics FAQ](https://developers.cloudflare.com/web-analytics/faq/)
> - [Edge and Browser Cache TTL](https://developers.cloudflare.com/cache/how-to/edge-browser-cache-ttl/)
