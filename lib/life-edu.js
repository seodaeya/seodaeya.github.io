/**
 * 생활 속 배움 놀이터 (유치원 ~ 초등 1·3학년) 문제 생성 및 학습 엔진.
 *
 * 3대 생활 밀착형 주제:
 * 1. calendar (🗓️ 달력과 날짜·요일 박사): 어제·오늘·내일·모레, 일주일 뒤, 남은 날짜 세기
 * 2. money    (🪙 용돈과 가게 놀이): 동전·지폐 세기, 물건 값 합계, 거스름돈 계산
 * 3. unit     (📏 생활 속 단위·온도 읽기): 자(cm/m) 길이, 비커(mL/L) 들이, 온도계(°C)와 옷차림
 */

export const EDU_TOPICS = [
  {
    id: 'calendar',
    name: '달력과 날짜 박사',
    shortName: '달력·요일',
    emoji: '🗓️',
    ageBadge: '유치원 ~ 초등 2학년',
    summary: '어제·오늘·내일·모레와 요일 순서, 달력에서 일주일 뒤·남은 날을 찾아봐요.',
    levels: [
      { id: 1, name: '어제·오늘·내일', emoji: '🐣', desc: '하루·이틀 전후와 요일' },
      { id: 2, name: '며칠·일주일 뒤', emoji: '📅', desc: '달력에서 날짜 점프하기' },
      { id: 3, name: '약속까지 남은 날', emoji: '🎈', desc: '두 날짜 사이 계산하기' },
    ],
  },
  {
    id: 'money',
    name: '용돈과 가게 놀이',
    shortName: '용돈·가게',
    emoji: '🪙',
    ageBadge: '유치원 ~ 초등 2학년',
    summary: '100원·500원 동전과 지폐를 세어 보고, 물건 값 내기와 거스름돈을 계산해요.',
    levels: [
      { id: 1, name: '저금통 돈 세기', emoji: '🐷', desc: '동전·지폐 합계 구하기' },
      { id: 2, name: '물건 두 개 사기', emoji: '🛒', desc: '가게에서 낼 돈 더하기' },
      { id: 3, name: '거스름돈 박사', emoji: '🧾', desc: '내고 남은 거스름돈' },
    ],
  },
  {
    id: 'unit',
    name: '단위와 온도 박사',
    shortName: '단위·온도',
    emoji: '📏',
    ageBadge: '초등 1 ~ 3학년',
    summary: '자(cm·m)로 길이 재기, 비커(mL·L) 눈금 읽기, 온도계(°C)와 알맞은 옷차림을 배워요.',
    levels: [
      { id: 1, name: '길이 재기 (cm·m)', emoji: '📏', desc: '자 눈금과 1m = 100cm' },
      { id: 2, name: '들이 읽기 (mL·L)', emoji: '🥛', desc: '비커 눈금과 1L = 1000mL' },
      { id: 3, name: '온도계와 날씨 (°C)', emoji: '🌡️', desc: '기온 읽기와 옷차림' },
    ],
  },
];

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export const MONEY_UNITS = [
  { value: 5000, label: '5,000원', kind: 'bill', color: '#d97706' },
  { value: 1000, label: '1,000원', kind: 'bill', color: '#2563eb' },
  { value: 500, label: '500원', kind: 'coin', color: '#64748b' },
  { value: 100, label: '100원', kind: 'coin', color: '#94a3b8' },
];

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

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** 숫자를 "1,500원" 형태로 포맷합니다. */
export function formatWon(amount) {
  return `${Number(amount).toLocaleString('ko-KR')}원`;
}

/**
 * 달력(5월 31일, 1일이 금요일(index=5)인 표준 학습 달력)에서
 * 특정 일(1~31)의 요일 문자열('일'~'토')을 구합니다.
 */
export const CALENDAR_START_DOW = 5; // 5월 1일 = 금요일
export const CALENDAR_TOTAL_DAYS = 31;
export const CALENDAR_MONTH = 5;

export function getWeekdayOfDate(day, startDow = CALENDAR_START_DOW) {
  const idx = ((startDow + (day - 1)) % 7 + 7) % 7;
  return WEEKDAYS[idx];
}

export function formatCalendarDay(day) {
  return `${CALENDAR_MONTH}월 ${day}일 (${getWeekdayOfDate(day)}요일)`;
}

/**
 * 1. 달력과 날짜 박사 문제 생성기
 */
export function createCalendarProblem(level = 1) {
  if (level === 1) {
    const relations = [
      { word: '어제', delta: -1, desc: '오늘보다 하루 전(-1일)' },
      { word: '내일', delta: 1, desc: '오늘보다 하루 뒤(+1일)' },
      { word: '모레', delta: 2, desc: '내일의 다음 날, 즉 이틀 뒤(+2일)' },
      { word: '그저께', delta: -2, desc: '어제의 전날, 즉 이틀 전(-2일)' },
    ];
    const rel = pick(relations);
    const baseDay = 4 + Math.floor(Math.random() * 23); // 4일 ~ 26일
    const targetDay = baseDay + rel.delta;
    const answer = formatCalendarDay(targetDay);

    const distractorDays = [-3, -2, -1, 1, 2, 3]
      .map((d) => baseDay + d)
      .filter((d) => d >= 1 && d <= CALENDAR_TOTAL_DAYS && d !== targetDay);
    const choices = shuffle([
      answer,
      ...shuffle(distractorDays).slice(0, 3).map(formatCalendarDay),
    ]);

    return {
      id: makeId('cal-1'),
      topic: 'calendar',
      level: 1,
      baseDay,
      targetDay,
      delta: rel.delta,
      relationWord: rel.word,
      prompt: `오늘은 ${formatCalendarDay(baseDay)}이에요. 그렇다면 ‘${rel.word}’는 며칠 무슨 요일일까요?`,
      answer,
      choices,
      hintText: `‘${rel.word}’는 ${rel.desc}이에요. 아래 달력에서 ${baseDay}일에서 ${rel.delta > 0 ? `오른쪽으로 ${rel.delta}칸` : `왼쪽으로 ${Math.abs(rel.delta)}칸`} 이동해 보세요!`,
      explain: `오늘(${baseDay}일 ${getWeekdayOfDate(baseDay)}요일)의 ‘${rel.word}’는 ${rel.desc}이므로 ${answer}이에요.`,
    };
  }

  if (level === 2) {
    const jumps = [
      { label: '3일 뒤', delta: 3, event: '🌱 강낭콩 물 주기' },
      { label: '5일 뒤', delta: 5, event: '🎨 미술 발표회' },
      { label: '일주일(7일) 뒤', delta: 7, event: '📚 도서관 책 반납일' },
      { label: '일주일(7일) 전', delta: -7, event: '🎂 지난주 생일 파티' },
      { label: '2주(14일) 뒤', delta: 14, event: '🏕️ 가족 캠핑 가는 날' },
    ];
    const jump = pick(jumps);
    const minDay = jump.delta < 0 ? 1 - jump.delta : 1;
    const maxDay = jump.delta > 0 ? CALENDAR_TOTAL_DAYS - jump.delta : CALENDAR_TOTAL_DAYS;
    const baseDay = minDay + Math.floor(Math.random() * (maxDay - minDay + 1));
    const targetDay = baseDay + jump.delta;
    const answer = formatCalendarDay(targetDay);

    const candidateDays = [];
    for (const d of [-14, -7, -5, -3, -2, -1, 1, 2, 3, 5, 7, 8, 14]) {
      const cand = baseDay + d;
      if (cand >= 1 && cand <= CALENDAR_TOTAL_DAYS && cand !== targetDay) {
        candidateDays.push(cand);
      }
    }
    const choices = shuffle([
      answer,
      ...shuffle([...new Set(candidateDays)]).slice(0, 3).map(formatCalendarDay),
    ]);

    const weekRule = Math.abs(jump.delta) % 7 === 0
      ? `일주일은 7일이라 달력에서 한 줄 ${jump.delta > 0 ? '아래' : '위'}로 이동하면 요일은 그대로(${getWeekdayOfDate(baseDay)}요일)이고 날짜만 ${jump.delta > 0 ? `+${jump.delta}` : jump.delta}일이 돼요!`
      : `${baseDay}일에서 ${jump.delta > 0 ? `${jump.delta}일을 더하면` : `${Math.abs(jump.delta)}일을 빼면`} ${targetDay}일이 돼요.`;

    return {
      id: makeId('cal-2'),
      topic: 'calendar',
      level: 2,
      baseDay,
      targetDay,
      delta: jump.delta,
      eventTitle: jump.event,
      prompt: `오늘은 ${formatCalendarDay(baseDay)}이에요. ${jump.event}은 오늘부터 ‘${jump.label}’예요. 며칠 무슨 요일일까요?`,
      answer,
      choices,
      hintText: weekRule,
      explain: `${baseDay}일에서 ${jump.label}(${jump.delta > 0 ? `+${jump.delta}일` : `${jump.delta}일`})을 계산하면 ${answer}이에요. ${weekRule}`,
    };
  }

  // Level 3: 약속까지 남은 날 세기
  const events = [
    '🚌 봄 소풍(현장체험학습)',
    '🏃 운동회 날',
    '🎭 인형극 관람 날',
    '🧁 요리 실습 날',
  ];
  const eventTitle = pick(events);
  const baseDay = 2 + Math.floor(Math.random() * 16); // 2~17일
  const diff = 4 + Math.floor(Math.random() * 10); // 4~13일 뒤
  const targetDay = baseDay + diff;
  const answer = `${diff}일 뒤`;

  const distractorDiffs = [-3, -2, -1, 1, 2, 3]
    .map((d) => diff + d)
    .filter((d) => d > 0 && d !== diff);
  const choices = shuffle([
    answer,
    ...shuffle(distractorDiffs).slice(0, 3).map((d) => `${d}일 뒤`),
  ]);

  return {
    id: makeId('cal-3'),
    topic: 'calendar',
    level: 3,
    baseDay,
    targetDay,
    delta: diff,
    eventTitle,
    prompt: `오늘은 ${CALENDAR_MONTH}월 ${baseDay}일이고, 기다리던 ${eventTitle}은 ${CALENDAR_MONTH}월 ${targetDay}일이에요. 오늘부터 며칠 뒤일까요?`,
    answer,
    choices,
    hintText: `도착 날짜(${targetDay}일)에서 오늘 날짜(${baseDay}일)를 빼거나, 달력에서 ${baseDay}일 다음 칸부터 ${targetDay}일까지 몇 칸인지 세어 보세요!`,
    explain: `${targetDay}일 - ${baseDay}일 = ${diff}일이므로 오늘부터 ${diff}일 뒤예요.`,
  };
}

/**
 * 2. 용돈과 가게 놀이 문제 생성기
 */
const STORE_ITEMS = [
  { name: '지우개', emoji: '🧼', price: 400 },
  { name: '연필', emoji: '✏️', price: 500 },
  { name: '알림장 공책', emoji: '📒', price: 800 },
  { name: '바나나 우유', emoji: '🥛', price: 1100 },
  { name: '풀', emoji: '🧴', price: 700 },
  { name: '색종이 묶음', emoji: '折り', emojiIcon: '🎨', price: 900 },
  { name: '크레파스', emoji: '🖍️', price: 1600 },
  { name: '스케치북', emoji: '📓', price: 1400 },
  { name: '미니카 장난감', emoji: '🚗', price: 2300 },
];

export function createMoneyProblem(level = 1) {
  if (level === 1) {
    // 저금통 동전·지폐 세기
    const count1000 = Math.floor(Math.random() * 3); // 0~2장
    const count500 = Math.floor(Math.random() * 2); // 0~1개
    const count100 = 1 + Math.floor(Math.random() * 4); // 1~4개
    const total = count1000 * 1000 + count500 * 500 + count100 * 100;

    const walletItems = [];
    for (let i = 0; i < count1000; i += 1) walletItems.push({ value: 1000, label: '1,000원', kind: 'bill' });
    for (let i = 0; i < count500; i += 1) walletItems.push({ value: 500, label: '500원', kind: 'coin' });
    for (let i = 0; i < count100; i += 1) walletItems.push({ value: 100, label: '100원', kind: 'coin' });

    const parts = [];
    if (count1000 > 0) parts.push(`1,000원 지폐 ${count1000}장`);
    if (count500 > 0) parts.push(`500원 동전 ${count500}개`);
    if (count100 > 0) parts.push(`100원 동전 ${count100}개`);

    const answer = formatWon(total);
    const distractors = [-500, -200, -100, 100, 200, 400, 500]
      .map((d) => total + d)
      .filter((v) => v >= 100 && v !== total);

    const choices = shuffle([
      answer,
      ...shuffle(distractors).slice(0, 3).map(formatWon),
    ]);

    return {
      id: makeId('money-1'),
      topic: 'money',
      level: 1,
      walletItems,
      targetAmount: total,
      prompt: `저금통에 ${parts.join(', ')}가 들어 있어요. 모두 합치면 얼마일까요?`,
      answer,
      choices,
      hintText: `큰 단위(1,000원 → 500원 → 100원) 순서대로 더해 보세요: ${count1000 * 1000}원 + ${count500 * 500}원 + ${count100 * 100}원!`,
      explain: `${parts.join(' + ')}를 모두 더하면 ${answer}이에요.`,
    };
  }

  if (level === 2) {
    // 물건 두 개 사기
    const [itemA, itemB] = shuffle(STORE_ITEMS).slice(0, 2);
    const total = itemA.price + itemB.price;
    const answer = formatWon(total);

    const distractors = [-400, -200, -100, 100, 200, 300, 500]
      .map((d) => total + d)
      .filter((v) => v >= 200 && v !== total);
    const choices = shuffle([
      answer,
      ...shuffle(distractors).slice(0, 3).map(formatWon),
    ]);

    return {
      id: makeId('money-2'),
      topic: 'money',
      level: 2,
      storeItems: [
        { name: itemA.name, emoji: itemA.emojiIcon || itemA.emoji, price: itemA.price },
        { name: itemB.name, emoji: itemB.emojiIcon || itemB.emoji, price: itemB.price },
      ],
      targetAmount: total,
      prompt: `문구점에서 ${itemA.emojiIcon || itemA.emoji} ${itemA.name}(${formatWon(itemA.price)})과 ${itemB.emojiIcon || itemB.emoji} ${itemB.name}(${formatWon(itemB.price)})을 사려고 해요. 모두 얼마를 내야 할까요?`,
      answer,
      choices,
      hintText: `힌트 지갑에서 동전·지폐 버튼을 눌러 ${formatWon(itemA.price)}과 ${formatWon(itemB.price)}을 직접 모아 보세요!`,
      explain: `${formatWon(itemA.price)} + ${formatWon(itemB.price)} = ${answer}이에요.`,
    };
  }

  // Level 3: 거스름돈 계산 박사
  const item = pick(STORE_ITEMS);
  const paidOptions = item.price < 1000 ? [1000, 2000] : item.price < 2000 ? [2000, 5000] : [3000, 5000];
  const paid = pick(paidOptions);
  const change = paid - item.price;
  const answer = formatWon(change);

  const distractors = [-300, -200, -100, 100, 200, 300, 500]
    .map((d) => change + d)
    .filter((v) => v >= 100 && v < paid && v !== change);
  const choices = shuffle([
    answer,
    ...shuffle(distractors).slice(0, 3).map(formatWon),
  ]);

  return {
    id: makeId('money-3'),
    topic: 'money',
    level: 3,
    storeItems: [
      { name: item.name, emoji: item.emojiIcon || item.emoji, price: item.price },
    ],
    paidAmount: paid,
    targetAmount: change,
    prompt: `${item.emojiIcon || item.emoji} ${item.name}(${formatWon(item.price)})을 사고 ${formatWon(paid)}을 냈어요. 거스름돈으로 얼마를 돌려받아야 할까요?`,
    answer,
    choices,
    hintText: `낸 돈(${formatWon(paid)})에서 물건 값(${formatWon(item.price)})을 빼 보세요. (${formatWon(item.price)}에서 얼마를 더 채우면 ${formatWon(paid)}이 될까요?)`,
    explain: `낸 돈 ${formatWon(paid)} - 물건 값 ${formatWon(item.price)} = 거스름돈 ${answer}이에요.`,
  };
}

/**
 * 3. 생활 속 단위·온도 박사 문제 생성기
 */
const RULER_OBJECTS = [
  { name: '지우개', emoji: '🧼', cm: 5 },
  { name: '크레파스', emoji: '🖍️', cm: 9 },
  { name: '미니 수첩', emoji: '📒', cm: 12 },
  { name: '연필', emoji: '✏️', cm: 15 },
  { name: '어린이 칫솔', emoji: '🪥', cm: 17 },
  { name: '숟가락', emoji: '🥄', cm: 19 },
];

const WEATHER_SCENES = [
  {
    temp: -3,
    weather: '⛄ 매서운 한겨울 추위',
    clothes: '두꺼운 패딩 점퍼와 장갑·목도리',
    wrongClothes: ['반팔 티셔츠와 반바지', '시원한 민소매와 샌들', '얇은 여름 바람막이'],
  },
  {
    temp: 6,
    weather: '🧥 쌀쌀한 초겨울·늦가을 바람',
    clothes: '따뜻한 코트나 도톰한 점퍼',
    wrongClothes: ['수영복과 물안경', '반팔 티셔츠와 샌들', '얇은 반바지'],
  },
  {
    temp: 18,
    weather: '🌸 포근하고 선선한 봄·가을 날씨',
    clothes: '긴팔 티셔츠와 가벼운 가디건',
    wrongClothes: ['두꺼운 겨울 방한복과 털장갑', '한여름 민소매와 슬리퍼', '스키복과 귀마개'],
  },
  {
    temp: 31,
    weather: '☀️ 햇볕이 쨍쨍한 무더운 여름날',
    clothes: '시원한 반팔 티셔츠와 반바지·모자',
    wrongClothes: ['두꺼운 오리털 패딩과 목도리', '기모 코트와 털부츠', '두꺼운 스웨터와 가죽 자켓'],
  },
];

export function createUnitProblem(level = 1) {
  if (level === 1) {
    // 50% 확률: 자 눈금 읽기(startTick ~ endTick) vs 1m = 100cm 변환
    if (Math.random() < 0.55) {
      const obj = pick(RULER_OBJECTS);
      const startCm = pick([0, 0, 1, 2]); // 0cm 시작 또는 1~2cm 시작 눈금 읽기 연습
      const endCm = startCm + obj.cm;
      const answer = `${obj.cm}cm`;
      const distractors = [-3, -2, -1, 1, 2, 3]
        .map((d) => obj.cm + d)
        .filter((v) => v >= 2 && v <= 20 && v !== obj.cm);

      return {
        id: makeId('unit-1-ruler'),
        topic: 'unit',
        level: 1,
        visualType: 'ruler',
        objectName: `${obj.emoji} ${obj.name}`,
        startCm,
        endCm,
        lengthCm: obj.cm,
        prompt: startCm === 0
          ? `자의 눈금 0cm부터 재어 보니 ${obj.emoji} ${obj.name}의 끝이 ${endCm}cm에 닿았어요. 길이는 몇 cm일까요?`
          : `${obj.emoji} ${obj.name}을 자의 ${startCm}cm 눈금부터 놓았더니 끝이 ${endCm}cm에 닿았어요. 실제 길이는 몇 cm일까요?`,
        answer,
        choices: shuffle([
          answer,
          ...shuffle(distractors).slice(0, 3).map((v) => `${v}cm`),
        ]),
        hintText: startCm === 0
          ? `0cm부터 시작했으니 끝 눈금(${endCm}cm)을 그대로 읽으면 돼요!`
          : `${startCm}cm부터 시작했으니 끝 눈금(${endCm}cm)에서 시작 눈금(${startCm}cm)을 빼 보세요! (${endCm} - ${startCm})`,
        explain: `${endCm}cm - ${startCm}cm = ${obj.cm}cm이므로 ${obj.name}의 길이는 ${answer}예요.`,
      };
    }

    // 1m = 100cm 변환 문제
    const meters = pick([1, 2, 3]);
    const extraCm = pick([10, 20, 30, 40, 50, 60, 70, 80]);
    const totalCm = meters * 100 + extraCm;
    const answer = `${totalCm}cm`;
    const distractors = [
      meters * 10 + extraCm,
      totalCm + 10,
      totalCm - 10,
      (meters + 1) * 100 + extraCm,
    ].filter((v) => v !== totalCm);

    return {
      id: makeId('unit-1-meter'),
      topic: 'unit',
      level: 1,
      visualType: 'meter',
      meters,
      extraCm,
      totalCm,
      prompt: `키 재기 자에서 ${meters}m ${extraCm}cm는 모두 몇 cm와 같을까요? (힌트: 1m = 100cm)`,
      answer,
      choices: shuffle([
        answer,
        ...shuffle([...new Set(distractors)]).slice(0, 3).map((v) => `${v}cm`),
      ]),
      hintText: `1m는 100cm예요! 그러므로 ${meters}m는 ${meters * 100}cm이고, 여기에 ${extraCm}cm를 더하면 돼요.`,
      explain: `1m = 100cm이므로 ${meters}m ${extraCm}cm = ${meters * 100}cm + ${extraCm}cm = ${answer}예요.`,
    };
  }

  if (level === 2) {
    // 들이 (mL / L) 비커 문제
    const baseMl = pick([200, 300, 400, 500, 600]);
    const addMl = pick([200, 300, 400]);
    const totalMl = baseMl + addMl;
    const answer = totalMl >= 1000
      ? (totalMl === 1000 ? '1,000mL (1L)' : `${totalMl.toLocaleString('ko-KR')}mL`)
      : `${totalMl}mL`;

    const distractors = [-200, -100, 100, 200, 300]
      .map((d) => totalMl + d)
      .filter((v) => v >= 100 && v <= 1500 && v !== totalMl)
      .map((v) => (v === 1000 ? '1,000mL (1L)' : `${v.toLocaleString('ko-KR')}mL`));

    return {
      id: makeId('unit-2-beaker'),
      topic: 'unit',
      level: 2,
      visualType: 'beaker',
      baseMl,
      addMl,
      totalMl,
      prompt: `계량컵(비커)에 물이 ${baseMl}mL 들어 있어요. 여기에 ${addMl}mL를 더 부으면 물은 모두 얼마가 될까요?`,
      answer,
      choices: shuffle([answer, ...shuffle(distractors).slice(0, 3)]),
      hintText: `처음 있던 물 ${baseMl}mL에 더 부은 물 ${addMl}mL를 더해 보세요! (참고: 1,000mL는 1L와 같아요)`,
      explain: `${baseMl}mL + ${addMl}mL = ${answer}예요.${totalMl === 1000 ? ' 1,000mL는 꼭 1L(일 리터)가 된답니다!' : ''}`,
    };
  }

  // Level 3: 온도계(°C)와 옷차림
  const scene = pick(WEATHER_SCENES);
  const answer = `${scene.temp}°C · ${scene.clothes}`;
  const choices = shuffle([
    answer,
    ...scene.wrongClothes.map((wrong) => `${scene.temp}°C · ${wrong}`),
  ]);

  return {
    id: makeId('unit-3-temp'),
    topic: 'unit',
    level: 3,
    visualType: 'thermometer',
    temp: scene.temp,
    weather: scene.weather,
    prompt: `오늘 온도계의 빨간 기둥이 ‘${scene.temp}°C’(${scene.weather})를 가리키고 있어요. 외출할 때 가장 알맞은 옷차림은 무엇일까요?`,
    answer,
    choices,
    hintText: `기온이 0°C보다 낮거나 한 자리 숫자면 추운 날씨이고, 25°C가 넘으면 더운 여름 날씨예요!`,
    explain: `현재 기온은 ${scene.temp}°C(${scene.weather})이므로 ‘${scene.clothes}’ 차림이 가장 알맞아요.`,
  };
}

/**
 * 주제(topic)와 난이도(level)에 맞는 문제를 생성합니다.
 */
export function createEduProblem(topic = 'calendar', level = 1) {
  if (topic === 'money') return createMoneyProblem(level);
  if (topic === 'unit') return createUnitProblem(level);
  return createCalendarProblem(level);
}
