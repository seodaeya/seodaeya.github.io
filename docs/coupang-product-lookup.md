# 쿠팡 상품 자동 조회 배포

`/cart/`는 GitHub Pages 정적 사이트입니다. 따라서 브라우저에서 쿠팡 상품 페이지를 직접 읽거나 쿠팡 파트너스 API 키를 안전하게 보관할 수 없습니다. `workers/cart-product-lookup`은 키를 Worker의 비밀 변수에만 두고, 링크에서 상품 번호를 확인한 뒤 쿠팡 파트너스 상품 검색 API로 상품명, 가격, 이미지 정보를 반환합니다.

## 1. Worker 배포

Cloudflare 계정으로 로그인한 터미널에서 아래 명령을 실행합니다.

```bash
npx wrangler login
npx wrangler secret put COUPANG_PARTNERS_ACCESS_KEY --config workers/cart-product-lookup/wrangler.toml
npx wrangler secret put COUPANG_PARTNERS_SECRET_KEY --config workers/cart-product-lookup/wrangler.toml
npx wrangler deploy --config workers/cart-product-lookup/wrangler.toml
```

비밀 값에는 쿠팡 파트너스에서 발급한 Access Key와 Secret Key를 각각 입력합니다. `.dev.vars` 파일이나 Git 저장소에는 실제 키를 넣지 않습니다.

## 2. GitHub Pages에 Worker 주소 연결

Worker 배포 후 출력되는 주소에 `/coupang/product`를 붙입니다. 예를 들어 Worker 주소가 `https://cart-coupang-product-lookup.example.workers.dev`라면 아래 값입니다.

```text
https://cart-coupang-product-lookup.example.workers.dev/coupang/product
```

GitHub 저장소의 **Settings → Secrets and variables → Actions → Variables**에 `COUPANG_LOOKUP_ENDPOINT` 변수를 이 값으로 만듭니다. 배포 워크플로는 이 값을 빌드 시 공개 설정으로 주입합니다. URL은 공개되어도 괜찮지만, 쿠팡 파트너스 키는 절대로 GitHub 변수나 프런트엔드에 넣지 않습니다.

## 동작과 제약

- 단축 `link.coupang.com` 링크와 일반 `coupang.com/vp/products/...` 링크를 받습니다.
- 단축 링크는 Worker에서 한 번만 리디렉션을 확인하고, 추적 파라미터 대신 상품 번호를 API 검색에 사용합니다.
- Worker는 30분 동안 상품 번호별 결과를 캐시해 파트너스 API 호출량을 줄입니다.
- 쿠팡 파트너스 API가 해당 상품 번호를 검색 결과로 반환하지 않거나 판매가 종료되면, 장바구니에는 정보 미확인 상태로 담기며 사용자가 직접 수정할 수 있습니다. 쿠팡 상품 페이지를 우회 스크래핑하지 않습니다.
