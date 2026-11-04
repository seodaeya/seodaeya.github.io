import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '@/styles/coupangSideBanner.module.css';
import { isNoAdsPath } from '@/lib/adPolicy';
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
 * [동작 원리]
 * 1. 가로: 본문 여백이 152px 이상일 때만 130px 원본 크기로 노출한다.
 *    CSS transform 으로 축소하지 않으므로 위젯에 선언한 width 와 실제 표시 크기가 일치한다.
 *    (쿠팡 파트너스 태그 가이드: "Parent Container의 크기는 위젯에 맞춰야")
 * 2. 세로: 헤더·푸터 사이에 배너 전체가 들어갈 때만 노출한다.
 *    공간이 부족하면 광고를 잘라 보여주지 않고 통째로 페이드아웃한다.
 *    requestAnimationFrame 으로 위치를 동기화해 스크롤·리사이즈 시 끊김을 없앤다.
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
const HEADER_H = 70; // 고정 헤더 기본 높이
const GAP_BELOW = 8; // 위젯과 고지 문구 사이
const DISCLOSURE_RESERVE = 92; // 130px 폭·12px 고지 문구가 차지하는 높이(약 5줄)

const MIN_GUTTER = WIDTH + GAP + EDGE; // 152px (이 미만은 숨김)

export default function CoupangSideBanner() {
  const router = useRouter();
  const asideRef = useRef(null);
  const slotRef = useRef(null);
  const rafRef = useRef(null);
  const baseSlotHeightRef = useRef(MAX_HEIGHT);
  const builtHeightRef = useRef(0);

  const [visible, setVisible] = useState(false);
  const [baseHeight, setBaseHeight] = useState(MAX_HEIGHT);

  // 콘텐츠가 없는 404 에는 광고를 노출하지 않는다(AdSense 정책).
  // 정책·문의·유틸리티 페이지에는 제휴 배너도 노출하지 않는다(AdSense 비콘텐츠 페이지 정책과 동일 기준).
  const hiddenHere = isNoAdsPath(router.pathname);

  /**
   * requestAnimationFrame 기반 60/120fps 실시간 경계 & 크기 동기화.
   * 디바운스 없이 브라우저 프레임 단위로 실행되므로 창 크기 조절 시 하단 배너처럼 물 흐르듯 작동한다.
   */
  const syncBounds = useCallback(() => {
    const aside = asideRef.current;
    if (!aside || typeof window === 'undefined') return;

    const main = document.querySelector('main');
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');
    if (!main) return;

    const mainLeft = main.getBoundingClientRect().left;

    // 1. 좌우 여백 확인 (152px 미만이면 즉각 페이드아웃)
    if (mainLeft < MIN_GUTTER) {
      aside.style.opacity = '0';
      aside.style.pointerEvents = 'none';
      return;
    }

    // 2. x좌표: 축소 없이 130px 원본 크기를 본문 왼쪽 여백에 붙인다.
    const left = Math.max(EDGE, Math.round(mainLeft - WIDTH - GAP));

    // 3. 세로 안전 경계 계산
    const headerBottom = header
      ? Math.max(0, header.getBoundingClientRect().bottom)
      : HEADER_H;
    const footerTop = footer
      ? footer.getBoundingClientRect().top
      : window.innerHeight;

    const safeTop = headerBottom + SAFE_GAP;
    const safeBottom = Math.min(window.innerHeight - SAFE_GAP, footerTop - SAFE_GAP);
    const corridorHeight = safeBottom - safeTop;

    const requiredHeight =
      (baseSlotHeightRef.current || MAX_HEIGHT) + GAP_BELOW + DISCLOSURE_RESERVE;

    // 4. 배너 전체가 들어갈 공간이 없으면 광고를 자르지 않고 통째로 숨긴다.
    //    (컨테이너 높이를 줄여 iframe 을 clip 하면 태그 가이드의 "컨테이너 크기 = 위젯 크기"를 위반한다)
    if (corridorHeight < requiredHeight) {
      aside.style.opacity = '0';
      aside.style.pointerEvents = 'none';
      return;
    }

    const top = safeTop + (corridorHeight - requiredHeight) / 2;

    // 5. GPU 합성 translate3d 로 60/120fps 즉시 반영 (리플로우 0)
    aside.style.transform = `translate3d(${Math.round(left * 10) / 10}px, ${
      Math.round(top * 10) / 10
    }px, 0)`;
    aside.style.opacity = '1';
    aside.style.pointerEvents = 'auto';
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

    const available =
      window.innerHeight -
      HEADER_H -
      SAFE_GAP * 2 -
      (DISCLOSURE_RESERVE + GAP_BELOW);
    if (available < MIN_HEIGHT) {
      setVisible(false);
      return;
    }

    const targetHeight = Math.min(MAX_HEIGHT, Math.floor(available));
    const prevHeight = baseSlotHeightRef.current || MAX_HEIGHT;
    const nextHeight =
      targetHeight < prevHeight || targetHeight - prevHeight >= HEIGHT_STEP
        ? targetHeight
        : prevHeight;

    baseSlotHeightRef.current = nextHeight;
    setVisible(true);
    setBaseHeight(nextHeight);

    scheduleSync();
  }, [hiddenHere, scheduleSync]);

  useEffect(() => {
    evaluateWidgetSize();

    let debounceTimer = null;

    // 리사이즈 시:
    // 1) 위치는 rAF로 매 프레임 즉시 동기화 (뚝뚝 끊김 0)
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
      <p className={styles.disclosure}>
        {COUPANG_DISCLOSURE}
      </p>
    </aside>
  );
}
