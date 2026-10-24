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
 * 양옆에 빈 여백이 생긴다. 이 컴포넌트는 **그 여백에 130px 배너가 실제로 들어갈 때만**
 * DOM 을 렌더한다. (여백이 없으면 아예 렌더하지 않으므로 레이아웃·CLS 영향 0)
 *
 * 높이는 화면 높이에 맞춰 조절한다.
 * 130px 폭에서는 위젯이 자동으로 세로형(`coupang="vertical"`)으로 전환되고,
 * 주어진 높이에 맞춰 상품 행 수를 스스로 배치한다(행이 잘리지 않음, 실측).
 * 600px 가 최대치이며, 화면이 낮으면 행 수가 줄어든다.
 *
 * 배너는 `position: fixed` 라 스크롤해도 따라온다.
 * 폭이 고정(130)이고 높이는 행 단위로만 바뀌므로, 높이가 40px 이상 달라질 때만
 * 위젯을 재생성한다(광고 요청 최소화).
 *
 * 마운트 위치는 `components/Layout.js`. 이 컴포넌트 하나만 두면 모든 페이지에
 * 중복 없이 적용되고, Layout 밖(overflow: clip 바깥)에 렌더해 잘림을 피한다.
 */
const WIDGET_ID = 350765;
const TEMPLATE = 'carousel';
const TRACKING_CODE = 'AF4228631';

const WIDTH = 130;
const MAX_HEIGHT = 600;
const MIN_HEIGHT = 300; // 2행 + 로고 (실측: 152px = 1행까지 렌더 가능)
const HEIGHT_STEP = 40;

const GAP = 20; // 배너와 본문 사이 간격
const EDGE = 12; // 화면 좌우 가장자리 최소 여백
const SAFE_GAP = 24; // 헤더 하단·푸터 상단·뷰포트 상하단과의 최소 안전 공백
const APPROACH_PAD = 24; // 푸터/헤더 접근 시 축소 효과가 미리 시작되는 완충 구간
const HEADER_H = 70; // 고정 헤더 기본 높이
const GAP_BELOW = 8; // 위젯과 고지 문구 사이
const DISCLOSURE_RESERVE = 76; // 130px 폭에서 고지 문구가 차지하는 높이(약 4줄)

const MIN_GUTTER = WIDTH + GAP + EDGE; // 162px 이상일 때만 노출 (≈ 뷰포트 1524px)

export default function CoupangSideBanner() {
  const router = useRouter();
  const asideRef = useRef(null);
  const slotRef = useRef(null);
  const rafRef = useRef(null);
  const [layout, setLayout] = useState(null); // { left, height } | null

  // 콘텐츠가 없는 404 에는 광고를 노출하지 않는다(AdSense 정책).
  const hiddenHere = router.pathname === '/404';

  // 스크롤·리사이즈 시 헤더 하단과 푸터 상단 사이의 안전 영역을 계산해
  // 배너 위치와 축소 비율(scale)을 GPU transform 으로 즉시 반영한다(위젯 재생성 없음).
  const syncVerticalBounds = useCallback(() => {
    const aside = asideRef.current;
    if (!aside || typeof window === 'undefined') return;

    const header = document.querySelector('header');
    const footer = document.querySelector('footer');

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

    //transform 적용 전 레이아웃 고유 높이(위젯 슬롯 + 간격 + 고지 문구)
    const naturalHeight =
      aside.offsetHeight ||
      (slotRef.current ? slotRef.current.offsetHeight + GAP_BELOW + DISCLOSURE_RESERVE : 0);

    if (!naturalHeight || corridorHeight <= 0) {
      aside.style.opacity = '0';
      aside.style.pointerEvents = 'none';
      return;
    }

    // 푸터가 화면 밖일 때의 기본 안착 위치(헤더 아래 ~ 뷰포트 하단 안전 영역의 중앙)
    const baseCorridor = Math.max(naturalHeight, viewportSafeBottom - safeTop);
    const restTop = safeTop + (baseCorridor - naturalHeight) / 2;
    const restBottom = restTop + naturalHeight;
    const topSlack = Math.max(0, restTop - safeTop);

    let top = restTop;
    let scale = 1;

    // 푸터(또는 좁아진 뷰포트 하단)가 배너 하단 완충 구간(APPROACH_PAD) 안으로 접근하면
    // 1) 상단 여유(topSlack) 범위 내에서 헤더 쪽 안전선(safeTop)까지 부드럽게 올라가고,
    // 2) 동시에 배너 전체 크기를 축소(scale)해 헤더·푸터 어느 쪽도 침범하지 않게 한다.
    const triggerBottom = restBottom + APPROACH_PAD;
    if (safeBottom < triggerBottom) {
      const encroachment = triggerBottom - safeBottom;
      const shiftUp = Math.min(topSlack, encroachment * 0.45);
      top = Math.max(safeTop, restTop - shiftUp);

      const maxVisualHeight = Math.max(
        0,
        safeBottom - top - Math.max(0, APPROACH_PAD - encroachment * 0.5)
      );
      scale = Math.min(1, maxVisualHeight / naturalHeight);
    }

    // 뷰포트 자체가 낮아 기본 상태에서도 여백이 부족한 경우 안전선 내로 한 번 더 클램프
    if (top + naturalHeight * scale > safeBottom) {
      top = safeTop;
      scale = Math.min(1, corridorHeight / naturalHeight);
    }

    const clampedScale = Math.max(0.1, Math.min(1, scale));
    // 안전 공간이 극단적으로 좁아지면(scale < 0.52) 투명도를 함께 낮춰 찌그러져 보이지 않게 처리
    const opacity =
      scale < 0.52
        ? Math.max(0, Math.min(1, (scale - 0.36) / (0.52 - 0.36)))
        : 1;

    aside.style.transform = `translate3d(0, ${Math.round(top * 10) / 10}px, 0) scale(${
      Math.round(clampedScale * 1000) / 1000
    })`;
    aside.style.opacity = String(Math.round(opacity * 100) / 100);
    aside.style.pointerEvents = opacity < 0.2 ? 'none' : 'auto';
  }, []);

  const scheduleSyncBounds = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (rafRef.current) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      syncVerticalBounds();
    });
  }, [syncVerticalBounds]);

  const measure = useCallback(() => {
    if (typeof window === 'undefined' || hiddenHere) {
      setLayout(null);
      return;
    }

    const main = document.querySelector('main');
    if (!main) {
      setLayout(null);
      return;
    }

    // 좌우 여백이 배너 폭 + 간격 + 최소 여백을 수용하는지
    const mainLeft = main.getBoundingClientRect().left;
    if (mainLeft < MIN_GUTTER) {
      setLayout(null);
      return;
    }

    // 세로: 헤더·상하 안전 여백·고지 문구를 뺀 만큼 (최대 600)
    const available =
      window.innerHeight -
      HEADER_H -
      SAFE_GAP * 2 -
      DISCLOSURE_RESERVE -
      GAP_BELOW;
    if (available < MIN_HEIGHT) {
      setLayout(null);
      return;
    }

    // 본문 바로 왼쪽에 붙인다(스카이스크래퍼 관례). 화면 끝을 넘지 않게 클램프.
    const left = Math.max(EDGE, Math.round(mainLeft - WIDTH - GAP));
    const target = Math.min(MAX_HEIGHT, Math.floor(available));

    setLayout((prev) => {
      if (!prev) return { left, height: target };

      // 창이 줄어들어 기존 높이가 가용 영역을 초과하면 즉시 줄이고,
      // 창이 커질 때만 40px 단위 히스테리시스를 두어 불필요한 광고 재요청을 방지한다.
      const height =
        target < prev.height || target - prev.height >= HEIGHT_STEP
          ? target
          : prev.height;

      if (left === prev.left && height === prev.height) return prev;
      return { left, height };
    });
  }, [hiddenHere]);

  useEffect(() => {
    measure();

    let timer = null;
    const schedule = () => {
      scheduleSyncBounds();
      if (timer) clearTimeout(timer);
      timer = setTimeout(measure, 200);
    };

    const handleRouteDone = () => {
      measure();
      scheduleSyncBounds();
    };

    window.addEventListener('scroll', scheduleSyncBounds, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', schedule);
    router.events.on('routeChangeComplete', handleRouteDone);

    // 스크롤바 등장/폰트 로드/댓글 확장처럼 창 크기와 무관한 폭·문서 높이 변화까지 감지한다.
    const main = document.querySelector('main');
    const footer = document.querySelector('footer');
    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    if (resizeObserver) {
      if (main) resizeObserver.observe(main);
      if (footer) resizeObserver.observe(footer);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      window.removeEventListener('scroll', scheduleSyncBounds);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('orientationchange', schedule);
      router.events.off('routeChangeComplete', handleRouteDone);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [measure, router.events, scheduleSyncBounds]);

  const visible = layout !== null;
  const height = layout ? layout.height : 0;

  // 레이아웃(노출 여부·높이·좌표) 변경 직후 즉시 수직 경계 및 축소 비율을 동기화한다.
  useEffect(() => {
    if (!visible) return;
    syncVerticalBounds();
  }, [visible, layout, syncVerticalBounds]);

  // 보일 때만 스크립트를 내려받는다. 높이가 행 단위로 바뀔 때만 재생성한다.
  useEffect(() => {
    if (!visible || !height) return undefined;

    let cancelled = false;

    loadCoupangScript()
      .then(() => {
        if (cancelled || !slotRef.current) return;
        createCoupangWidget({
          container: slotRef.current,
          id: WIDGET_ID,
          template: TEMPLATE,
          trackingCode: TRACKING_CODE,
          width: WIDTH,
          height,
        });
        scheduleSyncBounds();
      })
      .catch(() => {
        // 광고 차단 확장 등 — 빈 공간만 남기고 조용히 종료한다.
      });

    return () => {
      cancelled = true;
      if (slotRef.current) slotRef.current.innerHTML = '';
    };
  }, [visible, height, scheduleSyncBounds]);

  if (!visible) return null;

  return (
    <aside
      ref={asideRef}
      className={styles.banner}
      style={{ left: `${layout.left}px` }}
      aria-label="쿠팡 파트너스 추천 상품 세로 배너"
      data-coupang-side="true"
    >
      <div
        ref={slotRef}
        className={styles.slot}
        style={{ height: `${layout.height}px` }}
      />
      <p className={styles.disclosure}>{COUPANG_DISCLOSURE}</p>
    </aside>
  );
}
