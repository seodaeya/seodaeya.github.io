import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import SEO from '@/components/SEO';
import TimeTrainClock from '@/components/TimeTrainClock';
import {
  LEVELS,
  NOTATIONS,
  createProblem,
  explain12To24,
  formatAnswerByNotation,
  formatChoiceByNotation,
  formatClockByNotation,
  formatDigital,
  formatExplainByNotation,
  formatPromptByNotation,
} from '@/lib/time-train';
import styles from '@/styles/timeTrain.module.css';

const BEST_KEY = 'time-train-best-streak';
const NOTATION_KEY = 'time-train-notation';
const MAX_TRIES = 2;

export default function TimeTrain() {
  const [level, setLevel] = useState(1);
  const [notation, setNotation] = useState('both'); // 'both' | '12h' | '24h'
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
      const savedNotation = window.localStorage.getItem(NOTATION_KEY);
      if (savedNotation && ['both', '12h', '24h'].includes(savedNotation)) {
        setNotation(savedNotation);
      }
    } catch (error) {
      // 저장소를 쓸 수 없는 환경(사생활 보호 모드 등)은 무시
    }
  }, []);

  const handleNotation = (nextNotation) => {
    setNotation(nextNotation);
    try {
      window.localStorage.setItem(NOTATION_KEY, nextNotation);
    } catch (error) {
      // 저장 실패는 무시
    }
  };

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

  const start24 = problem ? (typeof problem.start24 === 'number' ? problem.start24 : problem.start) : 0;
  const end24 = problem ? (typeof problem.end24 === 'number' ? problem.end24 : problem.end) : 0;

  const targetLabel = useMemo(() => {
    if (!problem) return '';
    return `${formatClockByNotation(start24, notation)} → ${formatClockByNotation(end24, notation)}`;
  }, [problem, start24, end24, notation]);

  const choiceLabel = (choice) => formatChoiceByNotation(problem, choice, notation);

  const answered = status !== 'idle';

  return (
    <>
      <SEO
        title="시계 여행 | 여전히, 나는 사람이다."
        description="분침을 손가락으로 움직이며 걸린 시간과 12시간제·24시간제 표기법을 익히는 어린이 시간 학습 놀이터. 아날로그·디지털 시계를 함께 비교해 보세요."
        url="/time-train/"
        noindex={true}
      />

      <div className={styles.wrap}>
        <div className={styles.topBackRow}>
          <Link href="/edu/" className={styles.eduHubLink}>
            <span>🎒</span> 생활 속 배움 놀이터 전체 보기 →
          </Link>
        </div>

        <header className={styles.hero}>
          <p className={styles.eyebrow}>🎒 생활 속 배움 · 시간과 시각 학습</p>
          <h1 className={styles.title}>시계 여행</h1>
          <p className={styles.subtitle}>
            분침을 손으로 움직이며 <strong>걸린 시간</strong>과 <strong>12시·24시 표기 방식</strong>을 함께 익혀요.
          </p>
        </header>

        {/* 12시간제 ↔ 24시간제 표기 방식 선택 바 */}
        <section className={styles.notationBox} aria-label="시각 표기 방식 선택">
          <div className={styles.notationHeader}>
            <span className={styles.notationLabel}>🕒 시각 표기 방식</span>
            <span className={styles.notationHint}>오전·오후 12시간제와 24시간제를 비교해 보세요</span>
          </div>
          <div className={styles.notationRow} role="group" aria-label="12시간제 24시간제 표기 전환">
            {NOTATIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={notation === item.id}
                className={`${styles.notationChip} ${notation === item.id ? styles.notationChipActive : ''}`}
                onClick={() => handleNotation(item.id)}
              >
                <span className={styles.notationBadge}>{item.badge}</span>
                <span className={styles.notationName}>{item.name}</span>
                <span className={styles.notationDesc}>{item.desc}</span>
              </button>
            ))}
          </div>
        </section>

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
                <div className={styles.problemHeadTags}>
                  <p className={styles.problemEyebrow}>
                    {problem.kind === 'duration' ? '🚌 걸린 시간' : '⏰ 몇 시가 될까요'}
                  </p>
                  {problem.activity && (
                    <span className={styles.activityTag}>{problem.activity}</span>
                  )}
                </div>
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
              <h2 className={styles.problemText}>
                {formatPromptByNotation(problem, notation)}
              </h2>

              <div className={styles.problemClock}>
                <TimeTrainClock
                  baseMinutes={problem.start}
                  offset={0}
                  size={188}
                  label={`${formatClockByNotation(start24, notation)} 시계`}
                />
                <div className={styles.digitalBoardWrap}>
                  <div className={styles.digitalBoard}>
                    <div className={styles.digitalSection}>
                      <span className={styles.digitalTag}>시작 시각</span>
                      <div className={styles.digitalCompareRow}>
                        <div className={`${styles.digitalCell} ${notation !== '24h' ? styles.digitalCellHighlight : ''}`}>
                          <span className={styles.digitalCellMode}>12시간제</span>
                          <strong className={styles.digitalCellTime}>{formatDigital(start24, '12h')}</strong>
                        </div>
                        <span className={styles.digitalEqual} aria-hidden="true">=</span>
                        <div className={`${styles.digitalCell} ${notation !== '12h' ? styles.digitalCellHighlight : ''}`}>
                          <span className={styles.digitalCellMode}>24시간제</span>
                          <strong className={styles.digitalCellTime}>{formatDigital(start24, '24h')}</strong>
                        </div>
                      </div>
                    </div>

                    {problem.kind === 'duration' && (
                      <div className={styles.digitalSection}>
                        <span className={styles.digitalTag}>도착 시각</span>
                        <div className={styles.digitalCompareRow}>
                          <div className={`${styles.digitalCell} ${notation !== '24h' ? styles.digitalCellHighlight : ''}`}>
                            <span className={styles.digitalCellMode}>12시간제</span>
                            <strong className={styles.digitalCellTime}>{formatDigital(end24, '12h')}</strong>
                          </div>
                          <span className={styles.digitalEqual} aria-hidden="true">=</span>
                          <div className={`${styles.digitalCell} ${notation !== '12h' ? styles.digitalCellHighlight : ''}`}>
                            <span className={styles.digitalCellMode}>24시간제</span>
                            <strong className={styles.digitalCellTime}>{formatDigital(end24, '24h')}</strong>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className={styles.conversionRuleNote}>
                    💡 {explain12To24(start24)}
                  </p>
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

                <div className={styles.hintDigitalLive}>
                  <span>현재 시계: <strong>{formatDigital(start24 + hintOffset, '12h')}</strong></span>
                  <span className={styles.hintDigitalDivider}>·</span>
                  <span>24시 표기: <strong>{formatDigital(start24 + hintOffset, '24h')}</strong></span>
                </div>

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
                  정답은 <strong>{formatAnswerByNotation(problem, notation)}</strong>. {formatExplainByNotation(problem, notation)}
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
          유치원·초등 1~3학년 ‘시간과 시각’ 단원의 걸린 시간 및 12시간제(오전·오후)·24시간제 표기법을 다룹니다. 점수는 이 브라우저에만 저장돼요.
        </p>
      </div>
    </>
  );
}
