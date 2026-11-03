import { useCallback, useEffect, useMemo, useState } from 'react';
import SEO from '@/components/SEO';
import TimeTrainClock from '@/components/TimeTrainClock';
import {
  LEVELS,
  createProblem,
  formatAnswer,
  formatClock,
  formatDuration,
} from '@/lib/time-train';
import styles from '@/styles/timeTrain.module.css';

const BEST_KEY = 'time-train-best-streak';
const MAX_TRIES = 2;

export default function TimeTrain() {
  const [level, setLevel] = useState(1);
  const [problem, setProblem] = useState(null);
  const [picked, setPicked] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | correct | revealed
  const [hintOpen, setHintOpen] = useState(false);
  const [hintOffset, setHintOffset] = useState(0);
  const [solved, setSolved] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);

  useEffect(() => {
    setProblem(createProblem(1));
    try {
      const saved = Number(window.localStorage.getItem(BEST_KEY));
      if (Number.isFinite(saved) && saved > 0) setBest(saved);
    } catch (error) {
      // 저장소를 쓸 수 없는 환경(사생활 보호 모드 등)은 무시
    }
  }, []);

  const startProblem = useCallback((nextLevel) => {
    setProblem(createProblem(nextLevel));
    setPicked([]);
    setStatus('idle');
    setHintOffset(0);
    setHintOpen(false);
  }, []);

  const handleLevel = (nextLevel) => {
    if (nextLevel === level) return;
    setLevel(nextLevel);
    setStreak(0);
    startProblem(nextLevel);
  };

  const handlePick = (choice) => {
    if (!problem || status !== 'idle' || picked.includes(choice)) return;

    if (choice === problem.answer) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setSolved((value) => value + 1);
      setStatus('correct');
      if (nextStreak > best) {
        setBest(nextStreak);
        try {
          window.localStorage.setItem(BEST_KEY, String(nextStreak));
        } catch (error) {
          // 저장 실패는 무시
        }
      }
      return;
    }

    const nextPicked = [...picked, choice];
    setPicked(nextPicked);
    setStreak(0);
    if (nextPicked.length >= MAX_TRIES) {
      setStatus('revealed');
      setHintOpen(true);
      setHintOffset(0);
    }
  };

  const handleHint = () => {
    if (!problem) return;
    setHintOpen((open) => {
      if (!open) setHintOffset(0);
      return !open;
    });
  };

  const targetLabel = useMemo(() => {
    if (!problem) return '';
    return problem.kind === 'duration'
      ? `${formatClock(problem.start)} → ${formatClock(problem.end)}`
      : `${formatClock(problem.start)} → ${formatClock(problem.start + problem.duration)}`;
  }, [problem]);

  const choiceLabel = (choice) => (problem.kind === 'duration'
    ? formatDuration(choice)
    : formatClock(choice));

  const answered = status !== 'idle';

  return (
    <>
      <SEO
        title="시계 여행 | 여전히, 나는 사람이다."
        description="분침을 손가락으로 움직이며 걸린 시간을 익히는 어린이 시간 학습 놀이터. 시계를 직접 돌려 도착 시간까지 몇 분인지 확인해 보세요."
        url="https://seodaeya.github.io/time-train/"
        noindex={true}
      />

      <div className={styles.wrap}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>🧪 실험 서비스 · 시간 학습</p>
          <h1 className={styles.title}>시계 여행</h1>
          <p className={styles.subtitle}>
            분침을 손으로 움직이며 <strong>걸린 시간</strong>을 알아봐요.
            힌트를 열면 시계가 나타나요.
          </p>
        </header>

        <div className={styles.levelRow} role="tablist" aria-label="난이도 선택">
          {LEVELS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={level === item.id}
              className={`${styles.levelChip} ${level === item.id ? styles.levelChipActive : ''}`}
              onClick={() => handleLevel(item.id)}
            >
              <span className={styles.levelEmoji}>{item.emoji}</span>
              <span className={styles.levelName}>{item.name}</span>
              <span className={styles.levelDesc}>{item.desc}</span>
            </button>
          ))}
        </div>

        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>맞힌 문제</span>
            <span className={styles.statValue}>{solved}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>연속</span>
            <span className={styles.statValue}>{streak}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>최고 연속</span>
            <span className={styles.statValue}>{best}</span>
          </div>
          <button
            type="button"
            className={styles.resetBtn}
            onClick={() => {
              setSolved(0);
              setStreak(0);
              setLevel(1);
              startProblem(1);
            }}
          >
            처음부터
          </button>
        </div>

        {!problem ? (
          <div className={styles.loadingCard}>시계를 준비하고 있어요…</div>
        ) : (
          <>
            <section className={styles.problemCard} aria-live="polite">
              <div className={styles.problemHead}>
                <p className={styles.problemEyebrow}>
                  {problem.kind === 'duration' ? '🚌 걸린 시간' : '⏰ 몇 시가 될까요'}
                </p>
                <button
                  type="button"
                  className={`${styles.hintBtn} ${hintOpen ? styles.hintBtnOpen : ''}`}
                  onClick={handleHint}
                  aria-expanded={hintOpen}
                  aria-controls="time-train-hint"
                >
                  <span aria-hidden="true">💡</span> {hintOpen ? '힌트 닫기' : '힌트'}
                </button>
              </div>
              <h2 className={styles.problemText}>{problem.prompt}</h2>

              <div className={styles.problemClock}>
                <TimeTrainClock
                  baseMinutes={problem.start}
                  offset={0}
                  size={188}
                  label={`${formatClock(problem.start)} 시계`}
                />
                <div className={styles.problemClockMeta}>
                  <span className={styles.metaLabel}>시작</span>
                  <span className={styles.metaValue}>{formatClock(problem.start)}</span>
                  {problem.kind === 'duration' && (
                    <>
                      <span className={styles.metaLabel}>도착</span>
                      <span className={styles.metaValue}>{formatClock(problem.end)}</span>
                    </>
                  )}
                </div>
              </div>
            </section>

            {hintOpen && (
              <div className={styles.hintPanel} id="time-train-hint">
                <p className={styles.hintTitle}>분침을 끌어서 목표까지 움직여 보세요</p>
                <p className={styles.hintTarget}>
                  {targetLabel}
                </p>

                <TimeTrainClock
                  baseMinutes={problem.start}
                  offset={hintOffset}
                  targetOffset={problem.duration}
                  interactive
                  size={252}
                  label="힌트 시계"
                  onOffsetChange={setHintOffset}
                />

                <p className={styles.hintHelp}>
                  점선 눈금이 도착 시간이에요. 가운데 <strong>+분</strong>을 보며 맞춰 보세요.
                  {hintOffset === problem.duration ? ' 목표에 도착했어요!' : ''}
                </p>
              </div>
            )}

            <div className={styles.choiceGrid} role="group" aria-label="정답 선택">
              {problem.choices.map((choice) => {
                const isCorrect = answered && choice === problem.answer;
                const isWrongPick = picked.includes(choice);
                const isRevealed = status === 'revealed' && choice === problem.answer;
                return (
                  <button
                    key={choice}
                    type="button"
                    className={`${styles.choiceBtn} ${isCorrect || isRevealed ? styles.choiceCorrect : ''} ${isWrongPick ? styles.choiceWrong : ''}`}
                    onClick={() => handlePick(choice)}
                    disabled={answered || isWrongPick}
                  >
                    {choiceLabel(choice)}
                  </button>
                );
              })}
            </div>

            {status !== 'idle' && (
              <div className={`${styles.feedback} ${status === 'correct' ? styles.feedbackOk : styles.feedbackNo}`}>
                <p className={styles.feedbackTitle}>
                  {status === 'correct' ? '🎉 정답이에요!' : '🙂 정답을 같이 볼까요?'}
                </p>
                <p className={styles.feedbackBody}>
                  정답은 <strong>{formatAnswer(problem)}</strong>. {problem.explain}
                </p>
                <button type="button" className={styles.nextBtn} onClick={() => startProblem(level)}>
                  다음 문제 →
                </button>
              </div>
            )}

            {picked.length > 0 && status === 'idle' && (
              <p className={styles.retryNote}>
                아직이에요. 힌트를 열어 분침을 움직여 보세요. ({picked.length}/{MAX_TRIES})
              </p>
            )}

          </>
        )}

        <p className={styles.footNote}>
          초등 2학년 ‘시간과 시각’ 단원의 걸린 시간 개념을 다룹니다. 점수는 이 브라우저에만 저장돼요.
        </p>
      </div>
    </>
  );
}
