import { useCallback, useEffect, useRef } from 'react';
import styles from '@/styles/coupangCarousel.module.css';
import {
  COUPANG_DISCLOSURE,
  createCoupangWidget,
  loadCoupangScript,
} from '@/lib/coupangWidget';

/**
 * 쿠팡 파트너스 캐러셀 위젯.
 *
 * 폭은 위젯이 iframe 에 그대로 반영하고 내부 상품 카드가 리플로우되므로,
 * 뷰포트별로 인스턴스를 여러 개 만들지 않고 **컨테이너 실측 폭 하나**로만 생성한다.
 * (사이즈별 다중 인스턴스는 광고 요청·노출이 중복 집계되고 대역폭만 두 배가 된다.)
 */
const DEFAULTS = {
  widgetId: 350851,
  template: 'carousel',
  trackingCode: 'AF4228631',
  height: 140,
  minWidth: 240,
  maxWidth: 800,
  rebuildThreshold: 40,
};

export default function CoupangCarousel({
  widgetId = DEFAULTS.widgetId,
  template = DEFAULTS.template,
  trackingCode = DEFAULTS.trackingCode,
  height = DEFAULTS.height,
  minWidth = DEFAULTS.minWidth,
  maxWidth = DEFAULTS.maxWidth,
  rebuildThreshold = DEFAULTS.rebuildThreshold,
  showDisclosure = true,
  className = '',
  ariaLabel = '쿠팡 파트너스 추천 상품',
}) {
  // 애드센스 심사 기간 임시 비활성화 플래그 (심사 완료 후 false 로 변경)
  const ADSENSE_REVIEW_MODE = true;
  if (ADSENSE_REVIEW_MODE) {
    return null;
  }

  const wrapRef = useRef(null);
  const slotRef = useRef(null);
  const usedWidthRef = useRef(0);

  const build = useCallback(
    (width, slot) => {
      if (!slot || !window.PartnersCoupang) return;

      const clamped = Math.max(minWidth, Math.min(maxWidth, Math.floor(width)));
      if (
        usedWidthRef.current !== 0 &&
        Math.abs(clamped - usedWidthRef.current) < rebuildThreshold
      ) {
        return;
      }

      const ok = createCoupangWidget({
        container: slot,
        id: widgetId,
        template,
        trackingCode,
        width: clamped,
        height,
      });

      usedWidthRef.current = ok ? clamped : 0;
    },
    [height, maxWidth, minWidth, rebuildThreshold, template, trackingCode, widgetId]
  );

  useEffect(() => {
    const wrap = wrapRef.current;
    const slot = slotRef.current;
    if (!wrap || !slot) return undefined;

    let cancelled = false;
    let resizeTimer = null;

    const init = async () => {
      try {
        await loadCoupangScript();
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
      aria-label={ariaLabel}
    >
      {/* 차단·무응답일 때도 높이를 유지한다. 언마운트하면 아래 콘텐츠가 위로 튀며 CLS 가 발생한다. */}
      <div ref={slotRef} className={styles.slot} />
      {showDisclosure && <p className={styles.disclosure}>{COUPANG_DISCLOSURE}</p>}
    </aside>
  );
}
