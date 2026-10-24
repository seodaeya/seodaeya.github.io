import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '@/styles/coupangSideBanner.module.css';
import {
  COUPANG_DISCLOSURE,
  createCoupangWidget,
  loadCoupangScript,
} from '@/lib/coupangWidget';

/**
 * 좌측 여백 전용 쿠팡 파트너스 세로 배너 (130×600).
 *
 * 본문(`<main>`)은 `max-width: 1200px` 로 가운데 정렬되므로, 화면이 충분히 넓으면
 * 양옆에 빈 여백이 생긴다. 이 컴포넌트는 그 여백에 배너가 들어갈 때만 DOM 을 노출한다.
 *
 * [부드러운 반응형 동작 원리]
 * 1. 가로 (여백 반응형):
 *    - 여백에 맞춰 85%~100% (110px~130px) 범위로 완만하게 축소.
 *    - 200ms 디바운스 없이 requestAnimationFrame(60~120fps)으로 실시간 동기화하여
 *      창 크기 조절 시 하단 배너처럼 1픽셀 단위로 끊김 없이 부드럽게 반응.
 *    - 고지 문구 폰트 크기(fontSize)를 스케일에 맞춰 역보정하여 뭉개짐 방지.
 * 2. 세로 (푸터 충돌 방지):
 *    - 푸터 접근 시 너비는 그대로 유지하고 슬롯 높이(slot.style.height)만 축소.
 *    - 헤더/푸터와 항상 최소 24px의 안전 공백 유지.
 */
const WIDGET_ID = 350765;
const TEMPLATE = 'carousel';
const TRACKING_CODE = 'AF4228631';

const WIDTH = 130;
const MAX_HEIGHT = 600;
const MIN_HEIGHT = 280; // 2행 + 로고 (실측: 152px = 1행까지 렌더 가능)
const HEIGHT_STEP = 40;

const GAP = 14; // 배너와 본문 사이 간격
const EDGE = 8; // 화면 좌우 가장자리 최소 여백
const SAFE_GAP = 24; // 헤더 하단·푸터 상단·뷰포트 상하단과의 최소 안전 공백
const APPROACH_PAD = 24; // 푸터 접근 시 높이 조절/이동이 시작되는 완충 구간
const HEADER_H = 70; // 고정 헤더 기본 높이
const GAP_BELOW = 8; // 위젯과 고지 문구 사이
const DISCLOSURE_RESERVE = 76; // 130px 폭에서 고지 문구가 차지하는 높이(약 4줄)
const MIN_SLOT_VISIBLE = 120; // 슬롯 가용 높이가 이 미만으로 줄어들면 투명도 페이드아웃

// 가로 축소 기준: 85% ~ 100% (110px ~ 130px)
const MIN_SCALE = 0.85;
const MIN_SCALE_WIDTH = Math.round(WIDTH * MIN_SCALE); // 110px
const MIN_GUTTER = MIN_SCALE_WIDTH + GAP + EDGE; // 132px (이 미만은 숨김)

export default function CoupangSideBanner() {
  const router = useRouter();
  const asideRef = useRef(null);
  const slotRef = useRef(null);
  const disclosureRef = useRef(null);
  const rafRef = useRef(null);
  const baseSlotHeightRef = useRef(MAX_HEIGHT);
  const builtHeightRef = useRef(0);

  const [visible, setVisible] = useState(false);
  const [baseHeight, setBaseHeight] = useState(MAX_HEIGHT);

  // 콘텐츠가 없는 404 에는 광고를 노출하지 않는다(AdSense 정책).
  const hiddenHere = router.pathname === '/404';

  /**
   * requestAnimationFrame 기반 60/120fps 실시간 경계 & 크기 동기화.
   * 디바운스 없이 브라우저 프레임 단위로 실행되므로 창 크기 조절 시 하단 배너처럼 물 흐르듯 작동한다.
   */
  const syncBounds = useCallback(() => {
    const aside = asideRef.current;
    const slot = slotRef.current;
    const disclosure = disclosureRef.current;
    if (!aside || !slot || typeof window === 'undefined') return;

    const main = document.querySelector('main');
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');
    if (!main) return;

    const mainLeft = main.getBoundingClientRect().left;

    // 1. 좌우 여백 확인 (132px 미만이면 즉각 페이드아웃)
    if (mainLeft < MIN_GUTTER) {
      aside.style.opacity = '0';
      aside.style.pointerEvents = 'none';
      return;
    }

    // 2. 가로 스케일(0.85 ~ 1.0) 및 x좌표(left) 실시간 계산
    const availableGutter = mainLeft - GAP - EDGE;
    const s = Math.min(1, Math.max(MIN_SCALE, availableGutter / WIDTH));
    const visualWidth = WIDTH * s;
    const left = Math.max(EDGE, Math.round(mainLeft - visualWidth - GAP));

    // 3. 세로 안전 경계 계산
    const headerBottom = header
      ? Math.max(0, header.getBoundingClientRect().bottom)
      : HEADER_H;
    const footerTop = footer
      ? footer.getBoundingClientRect().top
      : window.innerHeight;

    const safeTop = headerBottom + SAFE_GAP;
    const viewportSafeBottom = window.innerHeight - SAFE_GAP;
    const safeBottom = Math.min(viewportSafeBottom, footerTop - SAFE_GAP);
    const corridorHeight = safeBottom - safeTop;

    const baseSlotHeight = baseSlotHeightRef.current || MAX_HEIGHT;
    const disclosureHeight = DISCLOSURE_RESERVE;
    const naturalVisualHeight = (baseSlotHeight + GAP_BELOW + disclosureHeight) * s;

    if (corridorHeight <= 0) {
      aside.style.opacity = '0';
      aside.style.pointerEvents = 'none';
      return;
    }

    // 4. 푸터 접근 시 부드러운 상단 글라이드
    const baseCorridor = Math.max(naturalVisualHeight, viewportSafeBottom - safeTop);
    const restTop = safeTop + (baseCorridor - naturalVisualHeight) / 2;
    const restBottom = restTop + naturalVisualHeight;
    const topSlack = Math.max(0, restTop - safeTop);

    let top = restTop;
    const triggerBottom = restBottom + APPROACH_PAD;
    if (safeBottom < triggerBottom) {
      const encroachment = triggerBottom - safeBottom;
      const shiftUp = Math.min(topSlack, encroachment * 0.5);
      top = Math.max(safeTop, restTop - shiftUp);
    }

    // 5. 푸터 충돌 시 세로 높이만 실시간 클리핑 (너비는 s 그대로 유지)
    const maxAllowedSlotHeight = (safeBottom - top) / s - GAP_BELOW - disclosureHeight;
    const currentSlotHeight = Math.min(
      baseSlotHeight,
      Math.max(0, Math.round(maxAllowedSlotHeight))
    );

    slot.style.height = `${currentSlotHeight}px`;

    // 6. 슬롯 가용 공간이 극도로 좁아질 때 투명도 페이드아웃
    let opacity = 1;
    if (currentSlotHeight < MIN_SLOT_VISIBLE) {
      opacity = Math.max(0, (currentSlotHeight - 60) / (MIN_SLOT_VISIBLE - 60));
    }

    // 7. GPU 합성 단일 translate3d + scale 로 60/120fps 즉시 반영 (리플로우 0)
    aside.style.transform = `translate3d(${Math.round(left * 10) / 10}px, ${
      Math.round(top * 10) / 10
    }px, 0) scale(${Math.round(s * 1000) / 1000})`;
    aside.style.opacity = String(Math.round(opacity * 100) / 100);
    aside.style.pointerEvents = opacity < 0.2 ? 'none' : 'auto';

    // 8. 고지 문구 폰트 크기 실시간 역보정 (스케일되어도 항상 선명한 0.62rem 유지)
    if (disclosure) {
      disclosure.style.fontSize = `${(0.62 / s).toFixed(3)}rem`;
    }
  }, []);

  const scheduleSync = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (rafRef.current) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      syncBounds();
    });
  }, [syncBounds]);

  // 창 크기 기반 초기/장기 슬롯 높이 결정 (광고 재요청 최소화용 디바운스 적용)
  const evaluateWidgetSize = useCallback(() => {
    if (typeof window === 'undefined' || hiddenHere) {
      setVisible(false);
      return;
    }

    const main = document.querySelector('main');
    if (!main) {
      setVisible(false);
      return;
    }

    const mainLeft = main.getBoundingClientRect().left;
    if (mainLeft < MIN_GUTTER) {
      setVisible(false);
      return;
    }

    const availableGutter = mainLeft - GAP - EDGE;
    const s = Math.min(1, Math.max(MIN_SCALE, availableGutter / WIDTH));

    const available =
      window.innerHeight -
      HEADER_H -
      SAFE_GAP * 2 -
      (DISCLOSURE_RESERVE + GAP_BELOW) * s;
    if (available / s < MIN_HEIGHT) {
      setVisible(false);
      return;
    }

    const targetHeight = Math.min(MAX_HEIGHT, Math.floor(available / s));

    setVisible(true);
    setBaseHeight((prev) => {
      const height =
        targetHeight < prev || targetHeight - prev >= HEIGHT_STEP
          ? targetHeight
          : prev;
      baseSlotHeightRef.current = height;
      return height;
    });

    scheduleSync();
  }, [hiddenHere, scheduleSync]);

  useEffect(() => {
    evaluateWidgetSize();

    let debounceTimer = null;

    // 리사이즈 시:
    // 1) visual transform(위치·스케일·슬롯높이)은 rAF로 매 프레임 즉시 동기화 (뚝뚝 끊김 0)
    // 2) 쿠팡 광고 재요청(iframe 재생성)만 250ms 디바운스로 필요할 때만 처리
    const onResize = () => {
      scheduleSync();
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(evaluateWidgetSize, 250);
    };

    const onRouteDone = () => {
      evaluateWidgetSize();
      scheduleSync();
    };

    window.addEventListener('scroll', scheduleSync, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    router.events.on('routeChangeComplete', onRouteDone);

    const main = document.querySelector('main');
    const footer = document.querySelector('footer');
    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null;
    if (resizeObserver) {
      if (main) resizeObserver.observe(main);
      if (footer) resizeObserver.observe(footer);
    }

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      window.removeEventListener('scroll', scheduleSync);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      router.events.off('routeChangeComplete', onRouteDone);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [evaluateWidgetSize, router.events, scheduleSync]);

  // DOM 렌더 직후 초기 위치 동기화
  useEffect(() => {
    if (visible) scheduleSync();
  }, [visible, baseHeight, scheduleSync]);

  // 보일 때만 스크립트를 로드하고, 높이가 행 단위(40px)로 바뀔 때만 위젯을 재생성한다.
  useEffect(() => {
    if (!visible || !baseHeight) return undefined;

    // 이미 같은 높이로 생성되어 있으면 재요청 생략
    if (builtHeightRef.current === baseHeight) {
      scheduleSync();
      return undefined;
    }

    let cancelled = false;

    loadCoupangScript()
      .then(() => {
        if (cancelled || !slotRef.current) return;
        const ok = createCoupangWidget({
          container: slotRef.current,
          id: WIDGET_ID,
          template: TEMPLATE,
          trackingCode: TRACKING_CODE,
          width: WIDTH,
          height: baseHeight,
        });
        if (ok) builtHeightRef.current = baseHeight;
        scheduleSync();
      })
      .catch(() => {
        // 광고 차단 확장 등 — 빈 공간만 남기고 조용히 종료
      });

    return () => {
      cancelled = true;
      if (slotRef.current) slotRef.current.innerHTML = '';
      builtHeightRef.current = 0;
    };
  }, [visible, baseHeight, scheduleSync]);

  if (!visible) return null;

  return (
    <aside
      ref={asideRef}
      className={styles.banner}
      aria-label="쿠팡 파트너스 추천 상품 세로 배너"
      data-coupang-side="true"
    >
      <div
        ref={slotRef}
        className={styles.slot}
        style={{ height: `${baseHeight}px` }}
      />
      <p ref={disclosureRef} className={styles.disclosure}>
        {COUPANG_DISCLOSURE}
      </p>
    </aside>
  );
}
