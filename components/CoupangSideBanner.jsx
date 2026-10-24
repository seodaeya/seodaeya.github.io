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

// 좌우 여백에 따른 가로 축소 기준:
// 사용자가 선택한 방식: 85%~100% 범위로만 완만하게 제한하여 텍스트/이미지 뭉개짐 방지
// 1) 152px 이상: 100% (130px)
// 2) 132px ~ 152px: 여백에 맞춰 너비를 85%~100% (110px~130px)로 완만하게 비례 축소
// 3) 132px 미만: 찌그러짐 방지를 위해 완전 숨김
const MIN_SCALE = 0.85; // 가로 축소 하한 (85%)
const MIN_SCALE_WIDTH = Math.round(WIDTH * MIN_SCALE); // 110px
const MIN_GUTTER = MIN_SCALE_WIDTH + GAP + EDGE; // 132px (이 미만은 숨김)
const FULL_GUTTER = WIDTH + GAP + EDGE; // 152px (이상이면 100% 너비)

export default function CoupangSideBanner() {
  const router = useRouter();
  const asideRef = useRef(null);
  const slotRef = useRef(null);
  const rafRef = useRef(null);
  const [layout, setLayout] = useState(null); // { left, height, scale } | null

  // 콘텐츠가 없는 404 에는 광고를 노출하지 않는다(AdSense 정책).
  const hiddenHere = router.pathname === '/404';

  // 스크롤·리사이즈 시 헤더 하단과 푸터 상단 사이의 안전 영역을 계산한다.
  // ★ 사용자 요구사항: 푸터를 만났을 때는 width를 줄이지 않고 slot의 height만 줄인다.
  // (가로 축소 비율 scale은 여백 크기로만 결정되며, 세로 스크롤 중에는 불변)
  const syncVerticalBounds = useCallback(() => {
    const aside = asideRef.current;
    const slot = slotRef.current;
    if (!aside || !slot || !layout || typeof window === 'undefined') return;

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

    const s = layout.scale || 1;
    const baseSlotHeight = layout.height;
    // 고지 문구 영역(고지 문구 높이 + 간격)
    const disclosureHeight = DISCLOSURE_RESERVE;
    const naturalVisualHeight = (baseSlotHeight + GAP_BELOW + disclosureHeight) * s;

    if (corridorHeight <= 0) {
      aside.style.opacity = '0';
      aside.style.pointerEvents = 'none';
      return;
    }

    // 푸터가 화면 밖일 때의 기본 안착 위치 (헤더 아래 ~ 뷰포트 하단 안전 영역의 중앙)
    const baseCorridor = Math.max(naturalVisualHeight, viewportSafeBottom - safeTop);
    const restTop = safeTop + (baseCorridor - naturalVisualHeight) / 2;
    const restBottom = restTop + naturalVisualHeight;
    const topSlack = Math.max(0, restTop - safeTop);

    let top = restTop;

    // 푸터가 배너 하단 완충 구간(APPROACH_PAD) 안으로 접근하면
    // 상단 여유(topSlack) 범위 내에서 헤더 안전선(safeTop)까지 부드럽게 글라이드
    const triggerBottom = restBottom + APPROACH_PAD;
    if (safeBottom < triggerBottom) {
      const encroachment = triggerBottom - safeBottom;
      const shiftUp = Math.min(topSlack, encroachment * 0.5);
      top = Math.max(safeTop, restTop - shiftUp);
    }

    // 푸터와 닿으려 할 때: 너비(scale)는 그대로 유지하고, 슬롯의 height만 줄인다!
    // visualBottom = top + (currentSlotHeight + GAP_BELOW + disclosureHeight) * s <= safeBottom
    const maxAllowedSlotHeight = (safeBottom - top) / s - GAP_BELOW - disclosureHeight;
    const currentSlotHeight = Math.min(
      baseSlotHeight,
      Math.max(0, Math.round(maxAllowedSlotHeight))
    );

    // 슬롯의 CSS 높이만 즉시 조절 (내부 iframe 재로딩 없음, overflow: hidden으로 하단 깔끔히 클리핑)
    slot.style.height = `${currentSlotHeight}px`;

    // 슬롯이 너무 얇아지면(120px 미만) 자연스럽게 페이드아웃
    let opacity = 1;
    if (currentSlotHeight < MIN_SLOT_VISIBLE) {
      opacity = Math.max(0, (currentSlotHeight - 60) / (MIN_SLOT_VISIBLE - 60));
    }

    aside.style.transform = `translate3d(0, ${Math.round(top * 10) / 10}px, 0) scale(${
      Math.round(s * 1000) / 1000
    })`;
    aside.style.opacity = String(Math.round(opacity * 100) / 100);
    aside.style.pointerEvents = opacity < 0.2 ? 'none' : 'auto';
  }, [layout]);

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

    // 좌우 여백 실측
    const mainLeft = main.getBoundingClientRect().left;
    if (mainLeft < MIN_GUTTER) {
      setLayout(null);
      return;
    }

    // ★ 사용자 요구사항: 좌우 여백이 좁아질 경우 너비를 85%~100% 범위로만 완만하게 축소
    const availableGutter = mainLeft - GAP - EDGE;
    const scale = Math.min(1, Math.max(MIN_SCALE, availableGutter / WIDTH));
    const visualWidth = Math.round(WIDTH * scale);

    // 본문 왼쪽에 GAP 간격으로 밀착 배치
    const left = Math.max(EDGE, Math.round(mainLeft - visualWidth - GAP));

    // 세로 가용 높이 계산 (스케일 반영)
    const available =
      window.innerHeight -
      HEADER_H -
      SAFE_GAP * 2 -
      (DISCLOSURE_RESERVE + GAP_BELOW) * scale;
    if (available / scale < MIN_HEIGHT) {
      setLayout(null);
      return;
    }

    const target = Math.min(MAX_HEIGHT, Math.floor(available / scale));

    setLayout((prev) => {
      if (!prev) return { left, height: target, scale };

      // 창이 줄어들어 기존 높이가 가용 영역을 초과하면 즉시 줄이고,
      // 창이 커질 때만 40px 단위 히스테리시스를 두어 불필요한 광고 재요청을 방지한다.
      const height =
        target < prev.height || target - prev.height >= HEIGHT_STEP
          ? target
          : prev.height;

      // scale이나 left가 1% 이상 달라지거나 height가 변경되면 갱신
      if (
        Math.abs(left - prev.left) < 1 &&
        height === prev.height &&
        Math.abs(scale - prev.scale) < 0.01
      ) {
        return prev;
      }
      return { left, height, scale };
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
      <p
        className={styles.disclosure}
        style={{
          fontSize: `${(0.62 / (layout.scale || 1)).toFixed(3)}rem`,
        }}
      >
        {COUPANG_DISCLOSURE}
      </p>
    </aside>
  );
}
