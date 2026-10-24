/**
 * 쿠팡 파트너스 위젯 공용 로더.
 *
 * 위젯 스크립트는 `g.js` → `partners.coupangcdn.com/widget/g/main-*.js` 로 302 리다이렉트되며,
 * `document.write` 를 쓰지 않고 DOM API 로 `<ins>` + `<iframe>` 을 삽입한다.
 * `container` 를 지정하지 않으면 **페이지의 마지막 `<script>` 앞**에 삽입되어 React 트리 밖으로
 * 튀어나가므로, 항상 container 를 넘긴다.
 *
 * 스크립트는 여러 컴포넌트(하단 캐러셀·좌측 배너)가 공유하므로 모듈 스코프에서 1회만 로드한다.
 */

export const COUPANG_SCRIPT_SRC = 'https://ads-partners.coupang.com/g.js';

export const COUPANG_DISCLOSURE =
  '이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.';

let scriptPromise = null;

export function loadCoupangScript() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.PartnersCoupang) return Promise.resolve(window.PartnersCoupang);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const fail = () => reject(new Error('coupang widget script failed'));
    const succeed = () => (window.PartnersCoupang ? resolve(window.PartnersCoupang) : fail());

    const existing = document.querySelector(`script[src="${COUPANG_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', succeed);
      existing.addEventListener('error', fail);
      if (window.PartnersCoupang) succeed();
      return;
    }

    const script = document.createElement('script');
    script.src = COUPANG_SCRIPT_SRC;
    script.async = true;
    script.onload = succeed;
    script.onerror = fail;
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * 컨테이너 안에 위젯 인스턴스를 하나 생성한다. 기존 내용은 먼저 비운다.
 * @returns {boolean} 생성 성공 여부
 */
export function createCoupangWidget({
  container,
  id,
  template = 'carousel',
  trackingCode,
  width,
  height = 140,
}) {
  if (typeof window === 'undefined' || !window.PartnersCoupang || !container) return false;

  container.innerHTML = '';

  try {
    // eslint-disable-next-line no-new
    new window.PartnersCoupang.G({
      id,
      template,
      trackingCode,
      width: String(Math.round(width)),
      height: String(Math.round(height)),
      tsource: '',
      container,
    });
    return true;
  } catch (error) {
    return false;
  }
}
