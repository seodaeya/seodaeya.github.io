// 단어기차 게임용 단어장 (오프라인 기본 제공 + AI 추가분 폴백)
// 형식: { w: 정답 단어, h: 힌트 }
export const LEVELS = {
  toddler: { label: '유아' },
  kid: { label: '어린이' },
  teen: { label: '청소년' },
  adult: { label: '성인' },
};

// 단계별 기본 제한시간(초). 유아 10 / 어린이 7 / 청소년 4 / 성인 5
export const DEFAULT_TIME = { toddler: 10, kid: 7, teen: 4, adult: 5 };
export const TIME_MIN = 1;
export const TIME_MAX = 10;

export const GOAL_OPTIONS = [
  { value: 5, label: '5문제' },
  { value: 10, label: '10문제' },
  { value: 20, label: '20문제' },
  { value: 0, label: '무제한' },
];

export const WORDS = {
  ko: {
    toddler: [
      { w: '해', h: '낮에 뜨거워요' },
      { w: '달', h: '밤에 둥글게 떠요' },
      { w: '별', h: '밤하늘에 반짝여요' },
      { w: '꽃', h: '향기가 나요' },
      { w: '새', h: '날개를 펄럭여요' },
      { w: '물', h: '마시는 것' },
      { w: '불', h: '뜨거워요' },
      { w: '눈', h: '겨울에 내려요' },
      { w: '비', h: '하늘에서 떨어져요' },
      { w: '잎', h: '나뭇잎' },
      { w: '사과', h: '빨간 과일' },
      { w: '우유', h: '하얀 음료' },
      { w: '빵', h: '아침에 먹는 것' },
      { w: '토끼', h: '깡충 뛰어요' },
      { w: '기차', h: '칙칙폭폭 달려요' },
      { w: '버스', h: '붕붕 달리는 차' },
      { w: '엄마', h: '나를 낳아준 분' },
      { w: '아빠', h: '힘이 센 분' },
    ],
    kid: [
      { w: '도서관', h: '책을 빌리는 곳' },
      { w: '운동회', h: '학교에서 달리기 하는 날' },
      { w: '공룡', h: '옛날에 살던 큰 파충류' },
      { w: '우주선', h: '우주에 가는 탈것' },
      { w: '로봇', h: '사람이 만든 기계 인간' },
      { w: '마법사', h: '지팡이로 마법을 써요' },
      { w: '보물섬', h: '보물이 숨겨진 섬' },
      { w: '캠핑', h: '텐트 치고 자는 여행' },
      { w: '자전거', h: '두 바퀴 페달 탈것' },
      { w: '수영장', h: '수영하는 큰 욕조' },
      { w: '박물관', h: '옛 물건을 전시하는 곳' },
      { w: '동물원', h: '동물을 구경하는 곳' },
      { w: '놀이공원', h: '롤러코스터가 있는 곳' },
      { w: '과학자', h: '연구하는 사람' },
      { w: '발명품', h: '새로 만든 물건' },
      { w: '지도', h: '길을 알려주는 그림' },
      { w: '나침반', h: '방향을 알려주는 도구' },
      { w: '천체망원경', h: '별을 보는 긴 통' },
    ],
    teen: [
      { w: '광합성', h: '식물이 빛으로 양분 만들기' },
      { w: '중력', h: '물체를 끌어당기는 힘' },
      { w: '민주주의', h: '국민이 주인인 정치' },
      { w: '환경오염', h: '공기·물이 더러워짐' },
      { w: '인공지능', h: '사람처럼 배우는 기계' },
      { w: '백신', h: '병을 예방하는 주사' },
      { w: '선거', h: '대표를 뽑는 투표' },
      { w: '무역', h: '나라끼리 사고팔기' },
      { w: '기후변화', h: '지구가 더워지는 현상' },
      { w: '유전자', h: '부모에게 물려받은 정보' },
      { w: '소설', h: '꾸며낸 긴 이야기' },
      { w: '역사', h: '옛날 일의 기록' },
      { w: '철학', h: '삶을 묻는 학문' },
      { w: '경제', h: '돈과 살림살이 학문' },
      { w: '화학', h: '물질을 다루는 과학' },
      { w: '물리학', h: '힘과 운동의 과학' },
      { w: '천문학', h: '별을 연구하는 학문' },
      { w: '고고학', h: '유물로 옛날을 연구' },
    ],
    adult: [
      { w: '역지사지', h: '처지를 바꿔 생각함' },
      { w: '우유부단', h: '결정을 못 내림' },
      { w: '설상가상', h: '눈 위에 서리, 엎친 데 덮침' },
      { w: '감탄고토', h: '달면 삼키고 쓰면 뱉음' },
      { w: '노마드', h: '정착 없이 이동하는 삶' },
      { w: '미니멀리즘', h: '최소한으로 사는 방식' },
      { w: '디지털디톡스', h: '기기에서 벗어나 쉬기' },
      { w: '워라밸', h: '일과 삶의 균형' },
      { w: '자아성찰', h: '자신을 돌아봄' },
      { w: '메타인지', h: '자기 생각을 아는 능력' },
      { w: '확증편향', h: '믿고 싶은 것만 믿음' },
      { w: '매몰비용', h: '이미 쓴 돌이킬 수 없는 비용' },
      { w: '기회비용', h: '포기한 것의 가치' },
      { w: '인플레이션', h: '물가가 오름' },
      { w: '디플레이션', h: '물가가 내림' },
      { w: 'ESG경영', h: '환경·사회·지배구조 경영' },
      { w: '탄소중립', h: '탄소 배출 제로 목표' },
      { w: '지속가능성', h: '다음 세대까지 이어감' },
    ],
  },
  en: {
    toddler: [
      { w: 'cat', h: '야옹 우는 동물' },
      { w: 'dog', h: '멍멍 짖는 동물' },
      { w: 'sun', h: '낮에 뜨거워요' },
      { w: 'bus', h: '붕붕 달리는 차' },
      { w: 'egg', h: '닭이 낳아요' },
      { w: 'ant', h: '작게 기어다녀요' },
      { w: 'bee', h: '윙윙 날아요' },
      { w: 'cow', h: '음메 울어요' },
      { w: 'pig', h: '꿀꿀 울어요' },
      { w: 'hen', h: '암탉' },
      { w: 'fox', h: '여우' },
      { w: 'owl', h: '밤에 보는 새' },
      { w: 'bat', h: '밤에 나는 것' },
      { w: 'rat', h: '생쥐' },
      { w: 'cup', h: '물 마시는 컵' },
      { w: 'hat', h: '모자' },
      { w: 'box', h: '상자' },
      { w: 'car', h: '자동차' },
    ],
    kid: [
      { w: 'library', h: '책을 빌리는 곳' },
      { w: 'robot', h: '기계 인간' },
      { w: 'castle', h: '왕이 사는 성' },
      { w: 'pirate', h: '해적' },
      { w: 'rocket', h: '우주에 가는 것' },
      { w: 'planet', h: '지구 같은 별' },
      { w: 'garden', h: '꽃을 키우는 뜰' },
      { w: 'bridge', h: '강을 건너는 다리' },
      { w: 'island', h: '바다 가운데 땅' },
      { w: 'forest', h: '나무가 많은 곳' },
      { w: 'music', h: '노래와 악기' },
      { w: 'dance', h: '몸을 움직여 춤' },
      { w: 'sport', h: '운동 경기' },
      { w: 'game', h: '놀이' },
      { w: 'friend', h: '친구' },
      { w: 'family', h: '가족' },
      { w: 'school', h: '학교' },
      { w: 'teacher', h: '선생님' },
    ],
    teen: [
      { w: 'gravity', h: '끌어당기는 힘' },
      { w: 'oxygen', h: '숨쉴 때 필요한 기체' },
      { w: 'planet', h: '태양 주위를 도는 천체' },
      { w: 'energy', h: '힘을 내게 하는 것' },
      { w: 'climate', h: '기후' },
      { w: 'culture', h: '문화' },
      { w: 'history', h: '역사' },
      { w: 'science', h: '과학' },
      { w: 'computer', h: '컴퓨터' },
      { w: 'internet', h: '인터넷' },
      { w: 'future', h: '미래' },
      { w: 'dream', h: '꿈' },
      { w: 'courage', h: '용기' },
      { w: 'freedom', h: '자유' },
      { w: 'justice', h: '정의' },
      { w: 'honest', h: '정직한' },
      { w: 'brave', h: '용감한' },
      { w: 'curious', h: '호기심 많은' },
    ],
    adult: [
      { w: 'sustainability', h: '다음 세대까지 이어감' },
      { w: 'metacognition', h: '자기 생각을 아는 능력' },
      { w: 'philosophy', h: '삶을 묻는 학문' },
      { w: 'economics', h: '돈과 살림 학문' },
      { w: 'inflation', h: '물가가 오름' },
      { w: 'democracy', h: '국민이 주인인 정치' },
      { w: 'innovation', h: '혁신' },
      { w: 'resilience', h: '회복하는 힘' },
      { w: 'empathy', h: '공감 능력' },
      { w: 'serendipity', h: '뜻밖의 행운 발견' },
      { w: 'nostalgia', h: '그리움' },
      { w: 'ephemeral', h: '덧없는, 잠깐인' },
      { w: 'eloquent', h: '말을 잘하는' },
      { w: 'diligent', h: '부지런한' },
      { w: 'humble', h: '겸손한' },
      { w: 'curiosity', h: '호기심' },
      { w: 'gratitude', h: '감사하는 마음' },
      { w: 'mindfulness', h: '마음챙김' },
    ],
  },
};

// 로컬 단어장에서 무작위 1개 (used 집합 제외)
export function pickLocalWord(lang, level, used) {
  const pool = (WORDS[lang]?.[level] || []).filter(e => !used.has(e.w));
  const list = pool.length > 0 ? pool : (WORDS[lang]?.[level] || []);
  if (list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}

// 무료 AI(Pollinations)로 단어 1개 생성. 실패 시 null 반환 -> 로컬 폴백
export async function fetchAIWord(lang, levelKey, used, timeoutMs = 7000) {
  const batch = await fetchAIWords(lang, levelKey, used, 1, timeoutMs);
  return batch.length > 0 ? batch[0] : null;
}

// 무료 AI(Pollinations)로 단어 묶음 생성. 파싱된 배열 반환 (실패 시 빈 배열)
export async function fetchAIWords(lang, levelKey, used, count = 6, timeoutMs = 12000) {
  const levelKo = (LEVELS[levelKey] || {}).label || '';
  const prompt = lang === 'ko'
    ? `너는 어린이 단어 게임 출제자다. ${levelKo} 수준에 맞는 한국어 단어 ${count}개를 아래 형식으로만 출력하라. 한 줄에 하나씩 "단어|힌트" 형식, 힌트는 10자 이내. 설명·번호·따옴표 금지.`
    : `You are a word game setter. Output exactly ${count} lines, each in the format "word|hint (in Korean, max 10 chars)", suitable for ${levelKo} level English learners. No numbering, no quotes, no explanation.`;
  const out = [];
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return out;
    const lines = (await res.text()).split('\n');
    for (const line of lines) {
      if (out.length >= count) break;
      const m = line.trim().match(/^(.+?)\|(.+)$/);
      if (!m) continue;
      const w = m[1].trim().replace(/["'“”‘’\d.\-\s]/g, '');
      const h = m[2].trim().slice(0, 24);
      if (used.has(w) || out.some(e => e.w === w) || h.length === 0) continue;
      if (lang === 'ko') {
        if (!/^[가-힣]{1,7}$/.test(w)) continue;
      } else {
        if (!/^[a-zA-Z]{3,14}$/.test(w)) continue;
      }
      out.push({ w: lang === 'en' ? w.toLowerCase() : w, h, ai: true });
    }
  } catch (e) {}
  return out;
}

// 2벌식 기준 한글 자모 및 타건수(스트로크) 분해
const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

const JUNG_DECOMP = {
  'ㅘ': ['ㅗ', 'ㅏ'],
  'ㅙ': ['ㅗ', 'ㅐ'],
  'ㅚ': ['ㅗ', 'ㅣ'],
  'ㅝ': ['ㅜ', 'ㅓ'],
  'ㅞ': ['ㅜ', 'ㅔ'],
  'ㅟ': ['ㅜ', 'ㅣ'],
  'ㅢ': ['ㅡ', 'ㅣ'],
};

const JONG_DECOMP = {
  'ㄳ': ['ㄱ', 'ㅅ'],
  'ㄵ': ['ㄴ', 'ㅈ'],
  'ㄶ': ['ㄴ', 'ㅎ'],
  'ㄺ': ['ㄹ', 'ㄱ'],
  'ㄻ': ['ㄹ', 'ㅁ'],
  'ㄼ': ['ㄹ', 'ㅂ'],
  'ㄽ': ['ㄹ', 'ㅅ'],
  'ㄾ': ['ㄹ', 'ㅌ'],
  'ㄿ': ['ㄹ', 'ㅍ'],
  'ㅀ': ['ㄹ', 'ㅎ'],
  'ㅄ': ['ㅂ', 'ㅅ'],
};

export function decomposeHangul(str) {
  if (!str) return '';
  const res = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const syl = code - 0xac00;
      const choIdx = Math.floor(syl / (21 * 28));
      const jungIdx = Math.floor((syl % (21 * 28)) / 28);
      const jongIdx = syl % 28;

      res.push(CHO[choIdx]);

      const jung = JUNG[jungIdx];
      if (JUNG_DECOMP[jung]) {
        res.push(...JUNG_DECOMP[jung]);
      } else {
        res.push(jung);
      }

      if (jongIdx > 0) {
        const jong = JONG[jongIdx];
        if (JONG_DECOMP[jong]) {
          res.push(...JONG_DECOMP[jong]);
        } else {
          res.push(jong);
        }
      }
    } else {
      const ch = str[i];
      if (JUNG_DECOMP[ch]) {
        res.push(...JUNG_DECOMP[ch]);
      } else if (JONG_DECOMP[ch]) {
        res.push(...JONG_DECOMP[ch]);
      } else {
        res.push(ch);
      }
    }
  }
  return res.join('');
}

export function getStrokeCount(text, lang = 'ko') {
  if (!text) return 0;
  if (lang === 'ko') {
    return decomposeHangul(text).length;
  }
  return text.length;
}
