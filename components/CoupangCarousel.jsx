import { useCallback, useEffect, useRef } from 'react';
import styles from '@/styles/coupangCarousel.module.css';

/**
 * 쿠팡 파트너스 캐러셀 위젯.
 *
 * 공식 코드는 `new PartnersCoupang.G({ id, template, width, height, trackingCode })` 형태이며,
 * `container` 옵션으로 삽입 위치를 지정할 수 있다. (지정하지 않으면 페이지의 마지막 <script> 앞에
 * 삽입되어 React 트리 밖으로 튀어나가므로 반드시 container 를 넘긴다.)
 *
 * 폭은 위젯이 iframe 에 그대로 반영하고 내부 상품 카드가 리플로우되므로,
 * 뷰포트별로 인스턴스를 여러 개 만들지 않고 **컨테이너 실측 폭 하나**로만 생성한다.
 * (사이즈별 다중 인스턴스는 광고 요청·노출이 중복 집계되고 대역폭만 두 배가 된다.)
 */
const SCRIPT_SRC = 'https://ads-partners.coupang.com/g.js';
const WIDGET_ID = 350851;
const TRACKING_CODE = 'AF4228631';
const WIDGET_HEIGHT = 140;
const MAX_WIDTH = 800;
const MIN_WIDTH = 240;
const REBUILD_THRESHOLD = 40;
const DISCLOSURE = '이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.';

let scriptPromise = null;

function loadWidgetScript() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.PartnersCoupang) return Promise.resolve(window.PartnersCoupang);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const fail = () => reject(new Error('coupang widget script failed'));
    const succeed = () => (window.PartnersCoupang ? resolve(window.PartnersCoupang) : fail());

    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', succeed);
      existing.addEventListener('error', fail);
      if (window.PartnersCoupang) succeed();
      return;
    }

    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = succeed;
    script.onerror = fail;
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export default function CoupangCarousel({ className = '' }) {
  const wrapRef = useRef(null);
  const slotRef = useRef(null);
  const usedWidthRef = useRef(0);

  const build = useCallback((width, slot) => {
    if (!slot || !window.PartnersCoupang) return;
    const clamped = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Math.floor(width)));
    if (usedWidthRef.current !== 0 && Math.abs(clamped - usedWidthRef.current) < REBUILD_THRESHOLD) return;

    slot.innerHTML = '';
    usedWidthRef.current = clamped;

    try {
      new window.PartnersCoupang.G({
        id: WIDGET_ID,
        template: 'carousel',
        trackingCode: TRACKING_CODE,
        width: String(clamped),
        height: String(WIDGET_HEIGHT),
        tsource: '',
        container: slot,
      });
    } catch (error) {
      usedWidthRef.current = 0;
    }
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    const slot = slotRef.current;
    if (!wrap || !slot) return undefined;

    let cancelled = false;
    let resizeTimer = null;

    const init = async () => {
      try {
        await loadWidgetScript();
        if (cancelled) return;
        build(slot.clientWidth || wrap.clientWidth, slot);
      } catch (error) {
        // 스크립트 차단(광고 차단 확장 등) — 영역은 그대로 두어 레이아웃 이동을 만들지 않는다.
      }
    };

    let started = false;

    // IntersectionObserver 가 지연·미전달되는 환경(백그라운드 탭 복귀, 일부 인앱 브라우저)을 대비한
    // 스크롤 폴백. 둘 중 먼저 조건을 만족하는 쪽이 한 번만 실행된다.
    const start = () => {
      if (started) return;
      started = true;
      if (observer) observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('touchmove', onScroll);
      init();
    };

    const onScroll = () => {
      const rect = wrap.getBoundingClientRect();
      if (rect.top < window.innerHeight + 400 && rect.bottom > -400) start();
    };

    // 뷰포트에 가까워질 때만 스크립트를 내려받는다(초기 로딩·LCP 영향 차단).
    const observer =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(
            (entries) => {
              if (entries.some((entry) => entry.isIntersecting)) start();
            },
            { rootMargin: '300px 0px', threshold: 0 }
          );

    if (observer) observer.observe(wrap);
    else init();

    if (observer) {
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('touchmove', onScroll, { passive: true });
    }

    // 브레이크포인트·레이아웃 변화로 컨테이너 폭이 실제로 바뀔 때만 재생성한다.
    // (window resize 만 감시하면 폰트 로드·사이드바 변화 등으로 폭이 달라질 때 iframe 이 잘린다)
    const scheduleRebuild = () => {
      if (usedWidthRef.current === 0) return;
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!cancelled) build(slot.clientWidth, slot);
      }, 250);
    };

    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(scheduleRebuild);
    if (resizeObserver) resizeObserver.observe(slot);
    else window.addEventListener('resize', scheduleRebuild);

    return () => {
      cancelled = true;
      if (observer) observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('touchmove', onScroll);
      if (resizeObserver) resizeObserver.disconnect();
      else window.removeEventListener('resize', scheduleRebuild);
      if (resizeTimer) clearTimeout(resizeTimer);
      if (slot) slot.innerHTML = '';
      usedWidthRef.current = 0;
    };
  }, [build]);

  return (
    <aside
      ref={wrapRef}
      className={`${styles.wrap} ${className}`.trim()}
      aria-label="쿠팡 파트너스 추천 상품"
    >
      {/* 차단·무응답일 때도 높이를 유지한다. 언마운트하면 아래 콘텐츠가 위로 튀며 CLS 가 발생한다. */}
      <div ref={slotRef} className={styles.slot} />
      <p className={styles.disclosure}>{DISCLOSURE}</p>
    </aside>
  );
}
