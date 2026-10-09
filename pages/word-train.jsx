import { useState, useEffect, useRef, useCallback } from 'react';
import SEO from '@/components/SEO';
import { LEVELS, GOAL_OPTIONS, DEFAULT_TIME, TIME_MIN, TIME_MAX, pickLocalWord, fetchAIWords, decomposeHangul, getStrokeCount } from '@/lib/word-train-words';
import styles from '@/styles/game.module.css';

const MAX_HEARTS = 3;
const BEST_KEY = 'word-train-best';
const HEART_WORD_RATE = 0.2;
const FALL_COUNT = { toddler: 1, kid: 1, teen: 1, adult: 1 };

function bestKey(lang, level, mode) {
  return `${BEST_KEY}-${lang}-${level}-${mode}`;
}

export default function WordTrain() {
  const [screen, setScreen] = useState('menu'); // menu | playing | over
  const [lang, setLang] = useState('ko');
  const [level, setLevel] = useState('kid');
  const [playMode, setPlayMode] = useState('word'); // word | letter
  const [useAI, setUseAI] = useState(true);
  const [timeLimit, setTimeLimit] = useState(DEFAULT_TIME.kid);
  const [goalCount, setGoalCount] = useState(10); // 0 = 무제한
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [score, setScore] = useState(100); // 100점 만점 정답률
  const [solved, setSolved] = useState(0);
  const [word, setWord] = useState(null); // 단어 모드 진행 단어 {w,h,heart,ai}
  const [used, setUsed] = useState([]);
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeTotal, setTimeTotal] = useState(1);
  const [feedback, setFeedback] = useState(null); // {ok, text}
  const [items, setItems] = useState([]); // 타자 모드 낙하 단어들
  const [stats, setStats] = useState({ keys: 0, miss: 0, combo: 0, maxCombo: 0 });
  const [flash, setFlash] = useState(null);
  const [best, setBest] = useState(0);
  const [shared, setShared] = useState(false);
  const [aiBadge, setAiBadge] = useState(false);
  const timerRef = useRef(null);
  const timeLeftRef = useRef(0);
  const inputRef = useRef(null);

  const usedRef = useRef(new Set());
  const queueRef = useRef([]); // 출제 대기열 (AI 묶음 + 로컬)
  const stateRef = useRef({ screen: 'menu', word: null, hearts: MAX_HEARTS });
  const itemsRef = useRef([]);
  const scoreRef = useRef(100);
  const correctRef = useRef(0);
  const attemptRef = useRef(0);
  const solvedRef = useRef(0);
  const goalRef = useRef(10);
  const startAtRef = useRef(0);
  const endAtRef = useRef(0);
  const uidRef = useRef(0);
  const fillingRef = useRef(false);
  const spawningRef = useRef(false);
  const wordTypingStartRef = useRef(0);
  const activeTypingMsRef = useRef(0);
  const statsRef = useRef({ keys: 0, miss: 0, combo: 0, maxCombo: 0 });

  const updateStats = (updater) => {
    setStats(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      statsRef.current = next;
      return next;
    });
  };

  const setItemsBoth = (arr) => {
    itemsRef.current = arr;
    setItems(arr);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // 100점 만점 정답률 갱신: 맞힌 문제 ÷ 푼 문제 × 100
  const updateScore = () => {
    const v = attemptRef.current > 0
      ? Math.round((correctRef.current / attemptRef.current) * 100)
      : 100;
    scoreRef.current = v;
    setScore(v);
  };

  // 출제 대기열 보충: 로컬 즉시 투입 + AI 묶음 백그라운드 추가
  const ensureQueue = useCallback(async () => {
    const st = stateRef.current;
    if (st.screen !== 'playing') return;
    const usedNow = usedRef.current;
    const queued = new Set(queueRef.current.map(e => e.w));
    while (queueRef.current.length < 2) {
      const pool = new Set([...usedNow, ...queued]);
      const e = pickLocalWord(st.lang, st.level, pool);
      if (!e) break;
      queueRef.current.push(e);
      queued.add(e.w);
      usedNow.add(e.w);
    }
    setUsed(Array.from(usedNow));
    if (queueRef.current.length < 6 && st.useAI && !fillingRef.current) {
      fillingRef.current = true;
      try {
        const batch = await fetchAIWords(st.lang, st.level, usedNow, 6);
        if (stateRef.current.screen === 'playing') {
          for (const e of batch) {
            if (queueRef.current.length >= 8) break;
            if (usedNow.has(e.w)) continue;
            queueRef.current.push(e);
            usedNow.add(e.w);
          }
          setUsed(Array.from(usedNow));
        }
      } finally {
        fillingRef.current = false;
      }
    }
  }, []);

  const takeNext = useCallback(async () => {
    await ensureQueue();
    return queueRef.current.shift() || null;
  }, [ensureQueue]);

  // 단어 모드: 다음 문제 출제
  const nextWord = useCallback(async () => {
    const st = stateRef.current;
    setFeedback(null);
    setInput('');
    setAiBadge(false);
    const entry = await takeNext();
    if (!entry || st.screen !== 'playing' || st.mode !== 'word') return;
    const withHeart = { ...entry, heart: Math.random() < HEART_WORD_RATE };
    setWord(withHeart);
    stateRef.current.word = withHeart;
    if (withHeart.ai) setAiBadge(true);
    const total = st.timeLimit || 10;
    setTimeTotal(total);
    timeLeftRef.current = total;
    setTimeLeft(total);
    if (inputRef.current) inputRef.current.focus({ preventScroll: true });
  }, [takeNext]);

  const gameOver = useCallback((finalScore, langNow, levelNow) => {
    stopTimer();
    if (!endAtRef.current) endAtRef.current = Date.now();
    stateRef.current.screen = 'over';
    setScreen('over');
    setItemsBoth([]);
    try {
      const mode = stateRef.current.mode || 'word';
      const k = bestKey(langNow, levelNow, mode);
      const isLetter = mode === 'letter';

      const s = statsRef.current;
      const cleanK = Math.max(0, s.keys - s.miss);
      const totalTypingMs = Math.max(500, activeTypingMsRef.current);
      const finalSpeed = cleanK > 0 ? Math.round(cleanK / (totalTypingMs / 60000)) : 0;
      const targetRecord = isLetter ? finalSpeed : finalScore;

      const prev = parseInt(localStorage.getItem(k) || '0', 10);
      if (targetRecord > prev) {
        localStorage.setItem(k, String(targetRecord));
        setBest(targetRecord);
      } else {
        setBest(prev);
      }
    } catch (e) {}
  }, []);

  const miss = useCallback((showAnswer, countAttempt = true) => {
    const h = stateRef.current.hearts - 1;
    stateRef.current.hearts = h;
    setHearts(h);
    if (countAttempt) {
      attemptRef.current += 1;
      updateScore();
    }
    setFeedback({ ok: false, text: showAnswer ? `정답: ${stateRef.current.word.w}` : '시간 초과!' });
    stopTimer();
    const st = stateRef.current;
    setTimeout(() => {
      if (h <= 0) {
        gameOver(scoreRef.current, st.lang, st.level);
      } else {
        nextWord();
      }
    }, 1400);
  }, [gameOver, nextWord]);

  // 타이머 (단어 모드)
  useEffect(() => {
    if (screen !== 'playing' || playMode !== 'word' || !word) return;
    stopTimer();
    timerRef.current = setInterval(() => {
      const v = +(timeLeftRef.current - 0.1).toFixed(1);
      timeLeftRef.current = v;
      setTimeLeft(Math.max(0, v));
      if (v <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        miss(true);
      }
    }, 100);
    return stopTimer;
  }, [screen, word, miss, playMode]);

  // 타자 모드: 단어 스폰 (대기열에서 꺼내 낙하장에 투입)
  // 기본 규칙: 평소에는 화면에 1개 문제만 노출.
  // 예외 규칙: 하트를 회복할 수 있는 찬스(♥ 하트 단어)가 발생했을 때만 최대 2개 동시 노출 허용.
  const spawnLetterItems = useCallback(async () => {
    const st = stateRef.current;
    if (st.screen !== 'playing' || st.mode !== 'letter') return;
    if (spawningRef.current) return;

    // 이미 2개 이상이면 추가 스폰 금지
    if (itemsRef.current.length >= 2) return;

    // 이미 1개가 있는데 그 1개가 이미 하트 단어라면 추가 스폰 금지
    if (itemsRef.current.length === 1 && itemsRef.current.some(x => x.heart)) return;

    // 이미 1개가 있을 때, 2번째 단어는 오직 하트를 주는 경우(♥)에만 추가 노출 허용
    const canSpawnHeartBonus = itemsRef.current.length === 1 && st.hearts < MAX_HEARTS && Math.random() < HEART_WORD_RATE;

    // 단어가 0개이거나, 하트를 주는 보너스인 경우에만 스폰 진행
    if (itemsRef.current.length >= 1 && !canSpawnHeartBonus) return;

    spawningRef.current = true;
    try {
      const entry = await takeNext();
      if (!entry || stateRef.current.screen !== 'playing') return;
      if (itemsRef.current.some(x => x.w === entry.w)) return;

      uidRef.current += 1;
      const total = st.timeLimit || 8;

      // 화면에 이미 단어가 있는 상태에서 추가되는 2번째 단어는 반드시 heart: true!
      // 화면에 단어가 없는 상태(0개)라면 하트가 깎였을 때만 일정 확률로 heart: true
      const isHeart = itemsRef.current.length === 1
        ? true
        : (st.hearts < MAX_HEARTS && Math.random() < HEART_WORD_RATE);

      const item = {
        ...entry,
        uid: uidRef.current,
        heart: isHeart,
        total,
        left: total,
      };

      setItemsBoth([...itemsRef.current, item]);
    } finally {
      spawningRef.current = false;
    }
  }, [takeNext]);

  // 타자 모드: 단어 적중 처리
  const clearItem = useCallback((item) => {
    correctRef.current += 1;
    attemptRef.current += 1;
    updateScore();
    solvedRef.current += 1;
    setSolved(solvedRef.current);
    let nh = stateRef.current.hearts;
    if (item.heart && nh < MAX_HEARTS) {
      nh = nh + 1;
      stateRef.current.hearts = nh;
      setHearts(nh);
    }
    updateStats(s => {
      const combo = s.combo + 1;
      return { ...s, combo, maxCombo: Math.max(s.maxCombo, combo) };
    });
    setFlash(`정답!${item.heart ? ' ♥ +1' : ''}`);

    // 해당 단어 타이핑에 소요된 활성 시간 누적 (대기 시간 제외)
    const duration = wordTypingStartRef.current
      ? Math.min((item.total || 8) * 1000, Math.max(200, Date.now() - wordTypingStartRef.current))
      : 600;
    activeTypingMsRef.current += duration;
    wordTypingStartRef.current = 0;

    if (goalRef.current > 0 && solvedRef.current >= goalRef.current) {
      stateRef.current.screen = 'over'; // 추가 입력 및 11개 초과 완료 완벽 차단!
      endAtRef.current = Date.now();
      setItemsBoth([]);
      setInput('');
      stopTimer();
      setTimeout(() => gameOver(scoreRef.current, stateRef.current.lang, stateRef.current.level), 900);
      return;
    }
    const remaining = itemsRef.current.filter(x => x.uid !== item.uid);
    setItemsBoth(remaining);
    setInput('');
    if (inputRef.current) inputRef.current.focus({ preventScroll: true });
    if (remaining.length === 0) {
      spawnLetterItems();
    }
  }, [spawnLetterItems, gameOver]);

  // 타자 모드: 낙하 틱 (100ms마다 남은 시간 감소, 다 떨어지면 -하트)
  useEffect(() => {
    if (screen !== 'playing' || playMode !== 'letter') return;
    stopTimer();
    timerRef.current = setInterval(() => {
      const st = stateRef.current;
      if (st.screen !== 'playing' || st.mode !== 'letter') return;
      const cur = itemsRef.current.map(it => ({ ...it, left: +(it.left - 0.1).toFixed(1) }));
      const expired = cur.filter(it => it.left <= 0);
      const alive = cur.filter(it => it.left > 0);
      if (expired.length > 0) {
        const h = st.hearts - expired.length;
        st.hearts = h;
        setHearts(h);
        attemptRef.current += expired.length;
        updateScore();
        updateStats(s => ({ ...s, combo: 0 }));
        setFlash(`놓침! ${expired.map(e => e.w).join(', ')} -♥`);
        setItemsBoth(alive);
        if (h <= 0) {
          endAtRef.current = Date.now();
          clearInterval(timerRef.current);
          timerRef.current = null;
          gameOver(scoreRef.current, st.lang, st.level);
          return;
        }
      } else {
        setItemsBoth(alive);
      }
      // 화면에 단어가 아예 없거나, 1개 단어만 있을 때 하트 보너스 찬스인 경우에만 스폰
      if (alive.length === 0 || (alive.length === 1 && !alive.some(x => x.heart) && st.hearts < MAX_HEARTS)) {
        spawnLetterItems();
      }
    }, 100);
    return stopTimer;
  }, [screen, playMode, spawnLetterItems, gameOver]);

  const startGame = (langNow, levelNow) => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    usedRef.current = new Set();
    queueRef.current = [];
    stateRef.current = { screen: 'playing', word: null, hearts: MAX_HEARTS, mode: playMode, lang: langNow, level: levelNow, useAI, timeLimit };
    setHearts(MAX_HEARTS);
    setScore(100);
    scoreRef.current = 100;
    correctRef.current = 0;
    attemptRef.current = 0;
    setSolved(0);
    solvedRef.current = 0;
    goalRef.current = goalCount;
    setShared(false);
    setFlash(null);
    startAtRef.current = Date.now();
    endAtRef.current = 0;
    wordTypingStartRef.current = 0;
    activeTypingMsRef.current = 0;
    statsRef.current = { keys: 0, miss: 0, combo: 0, maxCombo: 0 };
    try {
      setBest(parseInt(localStorage.getItem(bestKey(langNow, levelNow, playMode)) || '0', 10));
    } catch (e) {
      setBest(0);
    }
    setScreen('playing');
    if (playMode === 'letter') {
      setWord(null);
      setFeedback(null);
      setItemsBoth([]);
      updateStats({ keys: 0, miss: 0, combo: 0, maxCombo: 0 });
      setInput('');
      setTimeout(() => spawnLetterItems(), 50);
      if (inputRef.current) inputRef.current.focus({ preventScroll: true });
      return;
    }
    nextWord();
  };

  const completeWord = () => {
    correctRef.current += 1;
    attemptRef.current += 1;
    updateScore();
    solvedRef.current += 1;
    setSolved(solvedRef.current);
    let nh = stateRef.current.hearts;
    if (word.heart && nh < MAX_HEARTS) {
      nh = nh + 1;
      stateRef.current.hearts = nh;
      setHearts(nh);
    }
    setFeedback({ ok: true, text: `정답!${word.heart ? ' ♥ +1' : ''}` });
    stopTimer();
    if (goalRef.current > 0 && solvedRef.current >= goalRef.current) {
      endAtRef.current = Date.now();
      setTimeout(() => gameOver(scoreRef.current, lang, level), 900);
    } else {
      setTimeout(() => nextWord(), 900);
    }
  };

  // 타자 모드: 입력값이 떨어지는 단어와 정확히 일치하면 즉시 적중
  const tryLetterMatch = (raw) => {
    const val = lang === 'ko' ? raw.trim() : raw.trim().toLowerCase();
    if (!val) return false;
    const hit = itemsRef.current.find(it => {
      const target = lang === 'ko' ? it.w : it.w.toLowerCase();
      return target === val;
    });
    if (hit) {
      clearItem(hit);
      return true;
    }
    return false;
  };

  // 타자 모드: 2벌식 자모/스트로크 기반 타수 및 정타/오타 정밀 집계
  const onType = (v) => {
    const prev = input;
    setInput(v);
    if (playMode !== 'letter' || stateRef.current.screen !== 'playing') return;

    // 공백만 입력되었거나 빈 문자열인 경우 무시 (공백/엔터로 인한 허위 오타 방지)
    const trimmedV = v.trim();
    const trimmedPrev = prev.trim();
    if (!trimmedV) return;

    const prevDec = lang === 'ko' ? decomposeHangul(trimmedPrev) : trimmedPrev.toLowerCase();
    const curDec = lang === 'ko' ? decomposeHangul(trimmedV) : trimmedV.toLowerCase();

    // 단어 첫 타건 시점 기록
    if (!wordTypingStartRef.current && curDec.length > 0) {
      wordTypingStartRef.current = Date.now();
    }

    // 글자/자모가 추가된 경우에만 타건 수 계산
    if (curDec.length > prevDec.length) {
      const addedCount = curDec.length - prevDec.length;
      // 떨어지고 있는 단어 중 어느 하나의 자모 접두사(prefix)와 일치하는지 확인
      const isMatching = itemsRef.current.length > 0 && itemsRef.current.some(it => {
        const targetDec = lang === 'ko' ? decomposeHangul(it.w) : it.w.trim().toLowerCase();
        return targetDec.startsWith(curDec) || targetDec === curDec;
      });

      updateStats(s => ({
        ...s,
        keys: s.keys + addedCount,
        miss: s.miss + (isMatching ? 0 : addedCount),
      }));
    }

    tryLetterMatch(trimmedV);
  };

  const submit = (e) => {
    if (e) e.preventDefault();
    if (screen !== 'playing') return;
    if (playMode === 'letter') {
      // IME 조합 등으로 onChange 매칭이 안 된 경우 대비
      if (!tryLetterMatch(input.trim())) setInput('');
      return;
    }
    if (!word || feedback) return;
    const answer = lang === 'ko' ? input.trim() : input.trim().toLowerCase();
    if (!answer) return;
    if (answer === word.w) {
      completeWord();
    } else {
      attemptRef.current += 1;
      updateScore();
      miss(false, false);
      setFeedback({ ok: false, text: `땡! 정답: ${word.w}` });
    }
  };

  const heartsRow = '❤'.repeat(Math.max(0, hearts)) + '🖤'.repeat(Math.max(0, MAX_HEARTS - hearts));
  const progress = timeTotal > 0 ? Math.max(0, (timeLeft / timeTotal) * 100) : 0;
  // 타자 모드: 순수 입력 시간(Active Typing Time) 기준 분당 타수(CPM) 계산
  // 단어가 떨어지기를 기다리는 대기 시간(idle time)을 제외하여 실제 손가락 타자 속도를 정밀하게 반영
  const currentWordTypingMs = (screen === 'playing' && wordTypingStartRef.current)
    ? Math.max(0, Date.now() - wordTypingStartRef.current)
    : 0;
  const totalTypingMs = Math.max(500, activeTypingMsRef.current + currentWordTypingMs);
  const typingMinutes = totalTypingMs / 60000;
  const cleanKeys = Math.max(0, stats.keys - stats.miss);
  // 최소 0.9초(0.015분) 하한으로 극초반 폭등 방지, 이후는 실제 손가락 입력 속도 산출
  const typeSpeed = cleanKeys > 0 ? Math.round(cleanKeys / Math.max(0.015, typingMinutes)) : 0;
  const accuracy = stats.keys > 0 ? Math.max(0, Math.min(100, Math.round((cleanKeys / stats.keys) * 100))) : 100;

  const shareScore = async () => {
    const modeLabel = playMode === 'letter' ? '타자 게임' : '단어 맞추기';
    const extra = playMode === 'letter' ? `·${typeSpeed}타·정확도 ${accuracy}%` : '';
    const text = `🚂 단어기차에서 ${score}점! (${lang === 'ko' ? '한글' : '영어'}·${LEVELS[level].label}·${modeLabel}${extra}) 나랑 대결하자 https://seodaeya.github.io/word-train/`;
    try {
      if (navigator.share) {
        await navigator.share({ title: '단어기차 점수 공유', text, url: 'https://seodaeya.github.io/word-train/' });
        setShared(true);
        return;
      }
      throw new Error('no-share');
    } catch (e) {
      try {
        await navigator.clipboard.writeText(text);
        setShared(true);
      } catch (err) {}
    }
  };

  const changeTime = (d) => {
    setTimeLimit(t => Math.min(TIME_MAX, Math.max(TIME_MIN, t + d)));
  };

  return (
    <>
      <SEO
        title="단어기차 | 여전히, 나는 사람이다."
        description="기차 여행 테마 단어 맞추기 게임. 유아부터 성인까지 한글·영어 단어를 맞추고 점수를 공유하세요."
        url="https://seodaeya.github.io/word-train/"
      />
      <div className={styles.gameWrap}>
        <div className={styles.sky}>
          <div className={styles.trainTrack}>
            <span className={styles.train} style={{ left: `${100 - progress}%` }}>🚂</span>
          </div>
        </div>

        {screen === 'menu' && (
          <div className={`glass-card ${styles.panel}`}>
            <span className="category-badge">WORD TRAIN GAME</span>
            <h1 className={styles.title}>🚂 단어기차</h1>
            <p className={styles.desc}>
              기차가 다음 역으로 떠나기 전에 문제를 풀어요.
              <strong>단어 맞추기</strong>는 힌트 보고 통째로 입력,
              <strong>타자 게임</strong>은 떨어지는 단어를 빨리 쳐서 잡아요(타수·정확도·콤보 기록).
              점수는 <strong>100점 만점 정답률</strong>, 틀리면 맞힌 비율만큼 내려가요.
              가끔 오는 <strong>♥ 단어</strong>를 맞히면 하트를 되찾아요(최대 3개).
            </p>

            <div className={styles.optRow}>
              <span className={styles.optLabel}>방식</span>
              <button type="button" onClick={() => setPlayMode('word')} className={playMode === 'word' ? styles.optActive : styles.optBtn}>단어 맞추기</button>
              <button type="button" onClick={() => setPlayMode('letter')} className={playMode === 'letter' ? styles.optActive : styles.optBtn}>타자 게임</button>
            </div>

            <div className={styles.optRow}>
              <span className={styles.optLabel}>언어</span>
              <button type="button" onClick={() => setLang('ko')} className={lang === 'ko' ? styles.optActive : styles.optBtn}>한글</button>
              <button type="button" onClick={() => setLang('en')} className={lang === 'en' ? styles.optActive : styles.optBtn}>영어</button>
            </div>

            <div className={styles.optRow}>
              <span className={styles.optLabel}>단계</span>
              {Object.entries(LEVELS).map(([key, lv]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setLevel(key); setTimeLimit(DEFAULT_TIME[key]); }}
                  className={level === key ? styles.optActive : styles.optBtn}
                >
                  {lv.label}
                </button>
              ))}
            </div>

            <div className={styles.optRow}>
              <span className={styles.optLabel}>문제 수</span>
              {GOAL_OPTIONS.map(g => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGoalCount(g.value)}
                  className={goalCount === g.value ? styles.optActive : styles.optBtn}
                >
                  {g.label}
                </button>
              ))}
            </div>

            <div className={styles.optRow}>
              <span className={styles.optLabel}>제한시간</span>
              <button type="button" onClick={() => changeTime(-1)} className={styles.optBtn} aria-label="시간 줄이기">−</button>
              <strong style={{ minWidth: '52px', color: 'var(--text-primary)' }}>{timeLimit}초</strong>
              <button type="button" onClick={() => changeTime(1)} className={styles.optBtn} aria-label="시간 늘리기">＋</button>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>(1~10초)</span>
            </div>

            <label className={styles.aiToggle}>
              <input type="checkbox" checked={useAI} onChange={e => setUseAI(e.target.checked)} />
              무료 AI로 새 단어 받아오기 (실패 시 내장 단어 사용)
            </label>

            <button type="button" onClick={() => startGame(lang, level)} className={styles.startBtn}>
              출발하기 🚂
            </button>
          </div>
        )}

        {(screen === 'playing' && (playMode === 'letter' || word)) && (
          <div
            className={`glass-card ${styles.panel}`}
            onClick={() => { if (inputRef.current && document.activeElement !== inputRef.current) inputRef.current.focus({ preventScroll: true }); }}
          >
            <div style={{ marginBottom: '10px', textAlign: 'center' }}>
              <span className="category-badge">
                🚂 {lang === 'ko' ? '한글' : '영어'} · {LEVELS[level].label} · {playMode === 'letter' ? '타자 게임' : '단어 맞추기'} · {goalCount === 0 ? '무제한' : `${goalCount}문제`}
              </span>
            </div>

            <div className={styles.statusRow}>
              <span className={styles.hearts}>{heartsRow}</span>
              {playMode === 'letter' && stats.combo > 1 && (
                <span className={styles.comboBadge}>🔥 {stats.combo}콤보</span>
              )}
              <span className={styles.score}>🏆 {score}점</span>
            </div>

            {playMode === 'letter' ? (
              <>
                <div className={styles.fallZone}>
                  {items.length === 0 && (
                    <div className={styles.meta}>단어를 불러오는 중...</div>
                  )}
                  {items.map(it => {
                    const pct = Math.max(0, (it.left / it.total) * 100);
                    return (
                      <div key={it.uid} className={styles.fallItem}>
                        <div className={styles.fallTop}>
                          <span className={styles.trainMini} style={{ left: `${100 - pct}%` }}>🚂</span>
                        </div>
                        <div className={styles.fallWord}>
                          {it.heart && <span className={styles.heartMini}>♥ </span>}{it.w}
                        </div>
                        <div className={styles.hintMini}>{it.h}</div>
                        <div className={styles.fallBar}>
                          <div className={styles.fallFill} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {flash && <div className={styles.flashMsg}>{flash}</div>}

                <form onSubmit={submit} className={styles.form}>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => onType(e.target.value)}
                    placeholder="떨어지는 단어를 그대로 입력 (엔터 불필요)"
                    className={styles.input}
                    autoComplete="off"
                    autoFocus
                    maxLength={20}
                  />
                </form>

                <div className={styles.meta}>
                  ⌨️ {typeSpeed}타 · 🎯 {accuracy}% · 푼 문제 {solved}개{goalCount > 0 ? `/${goalCount}개` : ''}
                </div>
              </>
            ) : (
              <>
                <div className={styles.timerBar}>
                  <div className={styles.timerFill} style={{ width: `${progress}%` }} />
                </div>

                <div className={styles.wordCard}>
                  {word.heart && <div className={styles.heartBadge}>♥ 하트 단어!</div>}
                  <div className={styles.hint}>{word.h}</div>
                  <div className={styles.wordLen}>{lang === 'ko' ? `${word.w.length}글자` : `${word.w.length} letters`}</div>
                  {aiBadge && <div className={styles.aiBadge}>✨ AI 출제</div>}
                </div>

                {feedback ? (
                  <div className={feedback.ok ? styles.feedbackOk : styles.feedbackNo}>{feedback.text}</div>
                ) : (
                  <form onSubmit={submit} className={styles.form}>
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      placeholder={lang === 'ko' ? '정답을 입력하세요' : 'Type the word'}
                      className={styles.input}
                      autoComplete="off"
                      autoFocus
                      maxLength={20}
                    />
                    <button type="submit" className={styles.submitBtn}>맞히기</button>
                  </form>
                )}

                <div className={styles.meta}>푼 문제 {solved}개{goalCount > 0 ? `/${goalCount}개` : ''} · {timeLeft.toFixed(0)}초 남음</div>
              </>
            )}
          </div>
        )}

        {screen === 'over' && (
          <div className={`glass-card ${styles.panel}`}>
            <div style={{ marginBottom: '12px', textAlign: 'center' }}>
              <span className="category-badge" style={{ fontSize: '0.9rem', padding: '6px 16px' }}>
                🚂 {lang === 'ko' ? '한글' : '영어'} · {LEVELS[level].label} · {playMode === 'letter' ? '타자 게임' : '단어 맞추기'} · {goalCount === 0 ? '무제한' : `${goalCount}문제`}
              </span>
            </div>
            <h2 className={styles.title}>{goalCount > 0 && hearts > 0 ? '🏁 완주!' : '🚉 종착역 도착!'}</h2>
            <div className={styles.finalScore}>{score}점</div>
            <p className={styles.desc}>
              푼 문제 {solved}개 · 최고 기록 {best}{playMode === 'letter' ? '타' : '점'}
              {playMode === 'letter' && (
                <> · ⌨️ {typeSpeed}타 · 🎯 {accuracy}% · 최대 {stats.maxCombo}콤보</>
              )}
              {((playMode === 'letter' ? typeSpeed : score) >= best && (playMode === 'letter' ? typeSpeed : score) > 0) ? ' 🎉 신기록!' : ''}
            </p>
            <div className={styles.btnRow}>
              <button type="button" onClick={shareScore} className={styles.shareBtn}>
                {shared ? '✅ 공유됨!' : '📣 점수 공유하기'}
              </button>
              <button type="button" onClick={() => startGame(lang, level)} className={styles.startBtn}>
                다시 타기 🚂
              </button>
              <button type="button" onClick={() => setScreen('menu')} className={styles.optBtn}>
                처음으로
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
