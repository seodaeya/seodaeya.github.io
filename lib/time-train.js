/**
 * 시계 여행 — 걸린 시간(경과 시간) 학습용 문제 생성기.
 *
 * 초등 2학년 "시간과 시각" 단원(걸린 시간 알아보기)을 모바일에서
 * 손으로 움직이며 익히는 것이 목표입니다. 모든 계산은 하루 1,440분
 * 기준의 정수 연산으로만 처리해 부동소수 오차가 없습니다.
 */

export const MAX_OFFSET = 180; // 분침을 최대 3시간까지 움직일 수 있음

export const NOTATIONS = [
  {
    id: 'both',
    name: '12시·24시 함께',
    badge: '12h + 24h',
    desc: '오후 3시 = 15시 비교',
  },
  {
    id: '12h',
    name: '12시간제',
    badge: '오전·오후',
    desc: '오전/오후 1~12시',
  },
  {
    id: '24h',
    name: '24시간제',
    badge: '00~23시',
    desc: '13시·15시·20시 표기',
  },
];

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

/** 하루 기준 분(0~1439)을 오전/오후 포함 12시간제 "오후 3시 20분" 형태로 바꿉니다. */
export function formatClockWithPeriod(totalMinutes) {
  const dayMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const hour24 = Math.floor(dayMinutes / 60);
  const period = hour24 < 12 ? '오전' : '오후';
  const hour = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const minute = dayMinutes % 60;
  return `${period} ${hour}시 ${String(minute).padStart(2, '0')}분`;
}

/** 하루 기준 분(0~1439)을 24시간제 "15시 20분" 형태로 바꿉니다. */
export function formatClock24(totalMinutes) {
  const dayMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const hour24 = Math.floor(dayMinutes / 60);
  const minute = dayMinutes % 60;
  return `${String(hour24).padStart(2, '0')}시 ${String(minute).padStart(2, '0')}분`;
}

/** 디지털 시계 전광판용 문자열("15:20" 또는 "오후 03:20")을 반환합니다. */
export function formatDigital(totalMinutes, mode = '24h') {
  const dayMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const hour24 = Math.floor(dayMinutes / 60);
  const minute = String(dayMinutes % 60).padStart(2, '0');
  if (mode === '12h') {
    const period = hour24 < 12 ? '오전' : '오후';
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
    return `${period} ${String(hour12).padStart(2, '0')}:${minute}`;
  }
  return `${String(hour24).padStart(2, '0')}:${minute}`;
}

/**
 * 12시간 기준 분(60~719)과 오전/오후('am'|'pm')를 받아 하루 기준 분(0~1439)으로 변환합니다.
 */
export function to24HourMinutes(minutes, period = 'pm') {
  const norm = ((minutes % 720) + 720) % 720;
  return period === 'pm' ? norm + 720 : norm;
}

/**
 * 선택한 표기 방식('12h' | '24h' | 'both')에 맞춰 시각 문자열을 반환합니다.
 */
export function formatClockByNotation(totalMinutes, notation = '12h') {
  if (notation === '24h') return formatClock24(totalMinutes);
  if (notation === 'both') {
    return `${formatClockWithPeriod(totalMinutes)} (${formatDigital(totalMinutes, '24h')})`;
  }
  return formatClockWithPeriod(totalMinutes);
}

/**
 * 12시간제 시각을 24시간제로 바꾸는 원리 설명 문구를 반환합니다.
 */
export function explain12To24(totalMinutes) {
  const dayMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const hour24 = Math.floor(dayMinutes / 60);
  const minute = dayMinutes % 60;
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const minText = minute > 0 ? ` ${minute}분` : '';
  if (hour24 === 0) {
    return `밤 12시(자정)${minText}는 24시간 표기로 00시${minText}(또는 24시)라고 써요.`;
  }
  if (hour24 < 12) {
    return `오전 ${hour12}시${minText}는 아침·낮 시간이라 24시간 표기도 그대로 ${String(hour24).padStart(2, '0')}시${minText}예요.`;
  }
  if (hour24 === 12) {
    return `낮 12시(정오)${minText}는 24시간 표기로도 12시${minText}예요.`;
  }
  return `오후 ${hour12}시${minText}는 낮 12시가 지난 뒤라 ${hour12} + 12 = ${hour24}시${minText}가 돼요!`;
}

/**
 * 분침이 목표 지점에 정확히 도달했는지 판정합니다.
 * 1분 차이도 "도착"으로 보이면 학습이 어긋나므로 허용 오차를 두지 않습니다.
 */
export function isAtTarget(offset, targetOffset) {
  if (targetOffset === null || targetOffset === undefined) return false;
  return offset === targetOffset;
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

const ACTIVITIES_AM = [
  '🏫 아침 등교 준비',
  '📚 오전 독서 시간',
  '🎨 유치원·학교 미술 활동',
  '🤸 신나는 체육 시간',
];

const ACTIVITIES_PM = [
  '🛝 방과후 놀이터 놀이',
  '🎹 피아노·태권도 학원',
  '🍪 오후 간식과 휴식',
  '🚲 공원 자전거 타기',
  '🍽️ 가족 저녁 식사 시간',
];

/**
 * 레벨별 문제를 하나 만듭니다.
 * @param {number} level 1 | 2 | 3
 */
export function createProblem(level = 1) {
  const startHour = 1 + Math.floor(Math.random() * 11);
  const startMinute = pick(MINUTE_STEPS);
  const start = startHour * 60 + startMinute;
  // 8~11시는 오전(08~11시), 1~7시는 오후(13~19시)로 배치해 생활 속 시간대를 반영
  const period = startHour >= 8 ? 'am' : 'pm';
  const start24 = period === 'pm' ? start + 720 : start;
  const activity = pick(period === 'am' ? ACTIVITIES_AM : ACTIVITIES_PM);

  if (level === 3) {
    const duration = pick([20, 30, 40, 50, 60, 70, 80, 90]);
    const end = start + duration;
    const end24 = start24 + duration;
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      level,
      kind: 'duration',
      period,
      activity,
      start,
      end,
      start24,
      end24,
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
  const end24 = start24 + add;

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    level,
    kind: 'time',
    period,
    activity,
    start,
    end,
    start24,
    end24,
    duration: add,
    answer: end % 1440,
    choices: buildChoices(end % 1440, 'time'),
    prompt: `지금은 ${formatClock(start)}이에요. ${formatDuration(add)} 뒤는 몇 시일까요?`,
    explain: `${formatClock(start)}에서 ${formatDuration(add)}을 더하면 ${formatClock(end)}이에요.`,
  };
}

/** 문제의 시각 선택지(choice)를 문제의 오전/오후 맥락(end24)에 맞는 24시간 기준 분으로 변환합니다. */
export function choiceTo24(problem, choice) {
  if (!problem || problem.kind === 'duration') return choice;
  const baseEnd24 = typeof problem.end24 === 'number' ? problem.end24 : problem.end;
  let diff = (choice - problem.answer) % 720;
  if (diff > 360) diff -= 720;
  if (diff < -360) diff += 720;
  return ((baseEnd24 + diff) % 1440 + 1440) % 1440;
}

/** 표기 방식('12h' | '24h' | 'both')에 맞춰 문제 지문을 반환합니다. */
export function formatPromptByNotation(problem, notation = 'both') {
  if (!problem) return '';
  const s24 = typeof problem.start24 === 'number' ? problem.start24 : problem.start;
  const e24 = typeof problem.end24 === 'number' ? problem.end24 : problem.end;
  const startLabel = formatClockByNotation(s24, notation);
  const endLabel = formatClockByNotation(e24, notation);

  if (problem.kind === 'duration') {
    return `${startLabel}에 출발해서 ${endLabel}에 도착했어요. 걸린 시간은 얼마일까요?`;
  }
  return `지금은 ${startLabel}이에요. ${formatDuration(problem.duration)} 뒤는 몇 시일까요?`;
}

/** 표기 방식('12h' | '24h' | 'both')에 맞춰 선택지 문구를 반환합니다. */
export function formatChoiceByNotation(problem, choice, notation = 'both') {
  if (!problem) return '';
  if (problem.kind === 'duration') return formatDuration(choice);
  const c24 = choiceTo24(problem, choice);
  return formatClockByNotation(c24, notation);
}

/** 표기 방식('12h' | '24h' | 'both')에 맞춰 정답 문구를 반환합니다. */
export function formatAnswerByNotation(problem, notation = 'both') {
  if (!problem) return '';
  if (problem.kind === 'duration') return formatDuration(problem.answer);
  const e24 = typeof problem.end24 === 'number' ? problem.end24 : problem.answer;
  return formatClockByNotation(e24, notation);
}

/** 표기 방식('12h' | '24h' | 'both')에 맞춰 해설 문구를 반환합니다. */
export function formatExplainByNotation(problem, notation = 'both') {
  if (!problem) return '';
  const s24 = typeof problem.start24 === 'number' ? problem.start24 : problem.start;
  const e24 = typeof problem.end24 === 'number' ? problem.end24 : problem.end;
  const startLabel = formatClockByNotation(s24, notation);
  const endLabel = formatClockByNotation(e24, notation);
  if (problem.kind === 'duration') {
    return `긴바늘이 ${problem.duration}분만큼 움직였어요. ${startLabel}에서 ${formatDuration(problem.duration)} 뒤가 ${endLabel}이에요. (${explain12To24(e24)})`;
  }
  return `${startLabel}에서 ${formatDuration(problem.duration)}을 더하면 ${endLabel}이에요. (${explain12To24(e24)})`;
}

/** 문제의 정답을 사람이 읽는 문장으로 돌려줍니다. */
export function formatAnswer(problem) {
  return problem.kind === 'duration'
    ? formatDuration(problem.answer)
    : formatClock(problem.answer);
}
