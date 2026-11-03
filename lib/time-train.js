/**
 * 시계 여행 — 걸린 시간(경과 시간) 학습용 문제 생성기.
 *
 * 초등 2학년 "시간과 시각" 단원(걸린 시간 알아보기)을 모바일에서
 * 손으로 움직이며 익히는 것이 목표입니다. 모든 계산은 하루 1,440분
 * 기준의 정수 연산으로만 처리해 부동소수 오차가 없습니다.
 */

export const MAX_OFFSET = 180; // 분침을 최대 3시간까지 움직일 수 있음

export const LEVELS = [
  {
    id: 1,
    name: '분 단위',
    emoji: '🕐',
    desc: '10분씩 움직여요',
  },
  {
    id: 2,
    name: '한 시간 넘기',
    emoji: '🕓',
    desc: '1시간이 넘어가요',
  },
  {
    id: 3,
    name: '걸린 시간',
    emoji: '🚌',
    desc: '두 시각 사이의 시간',
  },
];

const MINUTE_STEPS = [0, 10, 20, 30, 40, 50];

/** 하루 기준 분(0~1439)을 12시간제 "3시 20분" 형태로 바꿉니다. */
export function formatClock(totalMinutes) {
  const dayMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const hour24 = Math.floor(dayMinutes / 60);
  const hour = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const minute = dayMinutes % 60;
  return `${hour}시 ${String(minute).padStart(2, '0')}분`;
}

/** 분 수를 "1시간 20분" 형태로 바꿉니다. */
export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}분`;
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return minute === 0 ? `${hour}시간` : `${hour}시간 ${minute}분`;
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function shuffle(list) {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

/**
 * 정답 근처의 그럴듯한 오답을 만듭니다.
 * @param {number} answer 정답(분)
 * @param {'time'|'duration'} kind
 */
function buildChoices(answer, kind) {
  const offsets = kind === 'time'
    ? [-60, -30, -20, -10, 10, 20, 30, 60]
    : [-40, -30, -20, -10, 10, 20, 30, 40];

  const pool = [];
  for (const delta of offsets) {
    const candidate = kind === 'time'
      ? ((answer + delta) % 1440 + 1440) % 1440
      : answer + delta;
    if (candidate <= 0) continue;
    if (kind === 'duration' && candidate >= 180) continue;
    if (candidate === answer) continue;
    if (!pool.includes(candidate)) pool.push(candidate);
  }

  const choices = shuffle(pool).slice(0, 3);
  return shuffle([answer, ...choices]);
}

/**
 * 레벨별 문제를 하나 만듭니다.
 * @param {number} level 1 | 2 | 3
 */
export function createProblem(level = 1) {
  const startHour = 1 + Math.floor(Math.random() * 11);
  const startMinute = pick(MINUTE_STEPS);
  const start = startHour * 60 + startMinute;

  if (level === 3) {
    const duration = pick([20, 30, 40, 50, 60, 70, 80, 90]);
    const end = start + duration;
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      level,
      kind: 'duration',
      start,
      end,
      duration,
      answer: duration,
      choices: buildChoices(duration, 'duration'),
      prompt: `${formatClock(start)}에 출발해서 ${formatClock(end)}에 도착했어요. 걸린 시간은 얼마일까요?`,
      explain: `긴바늘이 ${duration}분만큼 움직였어요. ${formatClock(start)}에서 ${formatDuration(duration)} 뒤가 ${formatClock(end)}예요.`,
    };
  }

  const add = level === 1
    ? pick([10, 20, 30, 40, 50])
    : pick([60, 70, 80, 90, 100, 110, 120, 130, 140, 150]);
  const end = start + add;

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    level,
    kind: 'time',
    start,
    end,
    duration: add,
    answer: end % 1440,
    choices: buildChoices(end % 1440, 'time'),
    prompt: `지금은 ${formatClock(start)}이에요. ${formatDuration(add)} 뒤는 몇 시일까요?`,
    explain: `${formatClock(start)}에서 ${formatDuration(add)}을 더하면 ${formatClock(end)}이에요.`,
  };
}

/** 문제의 정답을 사람이 읽는 문장으로 돌려줍니다. */
export function formatAnswer(problem) {
  return problem.kind === 'duration'
    ? formatDuration(problem.answer)
    : formatClock(problem.answer);
}
