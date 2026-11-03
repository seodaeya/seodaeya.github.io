import { useCallback, useRef } from 'react';
import { MAX_OFFSET } from '@/lib/time-train';
import styles from '@/styles/timeTrain.module.css';

const VIEW = 200;
const CENTER = 100;
const FACE_RADIUS = 88;

/** 12시 방향을 0도로 두고 시계 방향으로 도는 좌표를 구합니다. */
function polar(angleDeg, radius) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  };
}

const TICKS = Array.from({ length: 60 }, (_, index) => index);
const NUMBERS = Array.from({ length: 12 }, (_, index) => index + 1);

/**
 * 손으로 분침을 움직이는 학습용 아날로그 시계.
 *
 * - `baseMinutes` 에서 `offset` 분만큼 앞으로 간 시각을 그립니다.
 * - `targetOffset` 이 있으면 목표 지점에 점선 눈금을 표시합니다.
 * - 드래그/키보드로만 offset 을 바꾸며, 시계 방향(앞으로)으로만 최대 180분까지 이동합니다.
 */
export default function TimeTrainClock({
  baseMinutes = 0,
  offset = 0,
  targetOffset = null,
  interactive = false,
  size = 240,
  label = '시계',
  onOffsetChange,
}) {
  const sliderRef = useRef(null);
  const draggingRef = useRef(false);
  const offsetRef = useRef(offset);
  offsetRef.current = offset;

  const displayMinutes = ((baseMinutes + offset) % 1440 + 1440) % 1440;
  const minuteAngle = (displayMinutes % 60) * 6;
  const hourAngle = ((displayMinutes / 60) % 12) * 30;

  const targetAngle = targetOffset === null
    ? null
    : ((((baseMinutes + targetOffset) % 1440) + 1440) % 1440) % 60 * 6;

  const arrived = targetOffset !== null && Math.abs(offset - targetOffset) <= 1;

  const minuteTip = polar(minuteAngle, 80);
  const hourTip = polar(hourAngle, 52);
  const targetInner = targetAngle === null ? null : polar(targetAngle, 70);
  const targetOuter = targetAngle === null ? null : polar(targetAngle, 92);

  const offsetFromPointer = useCallback((clientX, clientY) => {
    const node = sliderRef.current;
    if (!node) return offsetRef.current;
    const rect = node.getBoundingClientRect();
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);

    // 화면 좌표를 12시 기준 시계 방향 각도로 변환
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    deg = ((deg % 360) + 360) % 360;

    const angleMinute = Math.round(deg / 6) % 60;
    const baseMinute = ((baseMinutes % 60) + 60) % 60;
    const mod = ((angleMinute - baseMinute) % 60 + 60) % 60;

    // 같은 바늘 위치는 0/60/120/180분 모두 가능하므로, 현재 값과 가장 가까운 쪽을 고른다.
    const candidates = [mod, mod + 60, mod + 120, mod + 180];
    const current = offsetRef.current;
    const next = candidates.reduce(
      (best, candidate) => (Math.abs(candidate - current) < Math.abs(best - current) ? candidate : best),
      candidates[0],
    );

    return Math.max(0, Math.min(MAX_OFFSET, next));
  }, [baseMinutes]);

  const update = useCallback((next) => {
    if (typeof onOffsetChange === 'function' && next !== offsetRef.current) {
      onOffsetChange(next);
    }
  }, [onOffsetChange]);

  const handlePointerDown = (event) => {
    if (!interactive) return;
    event.preventDefault();
    draggingRef.current = true;
    if (event.currentTarget.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    update(offsetFromPointer(event.clientX, event.clientY));
  };

  const handlePointerMove = (event) => {
    if (!interactive || !draggingRef.current) return;
    event.preventDefault();
    update(offsetFromPointer(event.clientX, event.clientY));
  };

  const endDrag = (event) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (event.currentTarget.releasePointerCapture) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch (error) {
        // 캡처가 이미 해제된 경우 무시
      }
    }
  };

  const handleKeyDown = (event) => {
    if (!interactive) return;
    let next = offsetRef.current;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next += 1;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next -= 1;
        break;
      case 'PageUp':
        next += 10;
        break;
      case 'PageDown':
        next -= 10;
        break;
      case 'Home':
        next = 0;
        break;
      default:
        return;
    }
    event.preventDefault();
    update(Math.max(0, Math.min(MAX_OFFSET, next)));
  };

  return (
    <div className={styles.clockBox} style={{ width: size }}>
      <div
        ref={sliderRef}
        className={`${styles.clockFace} ${interactive ? styles.clockFaceInteractive : ''}`}
        role={interactive ? 'slider' : 'img'}
        tabIndex={interactive ? 0 : -1}
        aria-label={interactive ? `${label} 분침 움직이기` : label}
        aria-valuemin={interactive ? 0 : undefined}
        aria-valuemax={interactive ? MAX_OFFSET : undefined}
        aria-valuenow={interactive ? offset : undefined}
        aria-valuetext={interactive ? `시작에서 ${offset}분 지남` : undefined}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={handleKeyDown}
      >
        <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className={styles.clockSvg} aria-hidden="true">
          <defs>
            <radialGradient id="clockFaceGradient" cx="50%" cy="38%" r="70%">
              <stop offset="0%" stopColor="var(--clock-face-inner)" />
              <stop offset="100%" stopColor="var(--clock-face-outer)" />
            </radialGradient>
          </defs>

          <circle cx={CENTER} cy={CENTER} r={FACE_RADIUS + 6} className={styles.clockRim} />
          <circle cx={CENTER} cy={CENTER} r={FACE_RADIUS} fill="url(#clockFaceGradient)" />

          {TICKS.map((tick) => {
            const isHour = tick % 5 === 0;
            const inner = polar(tick * 6, isHour ? 78 : 82);
            const outer = polar(tick * 6, 86);
            return (
              <line
                key={tick}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                className={isHour ? styles.tickHour : styles.tickMinute}
              />
            );
          })}

          {NUMBERS.map((number) => {
            const point = polar(number * 30, 68);
            return (
              <text
                key={number}
                x={point.x}
                y={point.y}
                className={styles.clockNumber}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {number}
              </text>
            );
          })}

          {targetInner && targetOuter && (
            <line
              x1={targetInner.x}
              y1={targetInner.y}
              x2={targetOuter.x}
              y2={targetOuter.y}
              className={styles.targetTick}
            />
          )}

          <line
            x1={CENTER}
            y1={CENTER}
            x2={hourTip.x}
            y2={hourTip.y}
            className={styles.hourHand}
          />
          <line
            x1={CENTER}
            y1={CENTER}
            x2={minuteTip.x}
            y2={minuteTip.y}
            className={styles.minuteHand}
          />
          <circle cx={minuteTip.x} cy={minuteTip.y} r="4.6" className={styles.minuteTip} />
          <circle cx={CENTER} cy={CENTER} r="5" className={styles.clockPin} />
        </svg>

        {interactive && (
          <div
            className={`${styles.clockReadout} ${arrived ? styles.clockReadoutArrived : ''}`}
            aria-hidden="true"
          >
            <span className={styles.readoutValue}>
              {arrived && <span className={styles.readoutArrived}>도착! </span>}
              +{offset}분
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
