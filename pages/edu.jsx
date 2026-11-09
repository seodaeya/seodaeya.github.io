import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SEO from '@/components/SEO';
import {
  CALENDAR_MONTH,
  CALENDAR_START_DOW,
  CALENDAR_TOTAL_DAYS,
  EDU_TOPICS,
  WEEKDAYS,
  createEduProblem,
  formatWon,
  getWeekdayOfDate,
} from '@/lib/life-edu';
import styles from '@/styles/edu.module.css';

const STORAGE_PREFIX = 'life-edu-best-';
const MAX_TRIES = 2;

export default function EduHubPage() {
  const router = useRouter();
  const [topicId, setTopicId] = useState('calendar');
  const [level, setLevel] = useState(1);
  const [problem, setProblem] = useState(null);
  const [picked, setPicked] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | correct | revealed
  const [hintOpen, setHintOpen] = useState(false);
  const [solved, setSolved] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestMap, setBestMap] = useState({ calendar: 0, money: 0, unit: 0 });

  // 인터랙티브 보조 도구 상태 (달력 날짜 클릭 / 지갑 동전 모으기)
  const [selectedCalDay, setSelectedCalDay] = useState(null);
  const [trayAmount, setTrayAmount] = useState(0);

  const currentTopic = useMemo(
    () => EDU_TOPICS.find((t) => t.id === topicId) || EDU_TOPICS[0],
    [topicId]
  );

  const startNewProblem = useCallback((nextTopicId, nextLevel) => {
    setProblem(createEduProblem(nextTopicId, nextLevel));
    setPicked([]);
    setStatus('idle');
    setHintOpen(false);
    setSelectedCalDay(null);
    setTrayAmount(0);
  }, []);

  useEffect(() => {
    startNewProblem('calendar', 1);
    try {
      const loaded = { calendar: 0, money: 0, unit: 0 };
      for (const key of ['calendar', 'money', 'unit']) {
        const val = Number(window.localStorage.getItem(`${STORAGE_PREFIX}${key}`));
        if (Number.isFinite(val) && val > 0) loaded[key] = val;
      }
      setBestMap(loaded);
    } catch (error) {
      // 사생활 보호 모드 등 저장 불가 환경 무시
    }
  }, [startNewProblem]);

  // URL 쿼리(?tab=calendar|money|unit) 연동
  useEffect(() => {
    if (!router.isReady) return;
    const qTab = router.query.tab;
    if (typeof qTab === 'string' && ['calendar', 'money', 'unit'].includes(qTab) && qTab !== topicId) {
      setTopicId(qTab);
      setLevel(1);
      setStreak(0);
      startNewProblem(qTab, 1);
    }
  }, [router.isReady, router.query.tab, topicId, startNewProblem]);

  const handleTopicChange = (nextTopicId) => {
    if (nextTopicId === topicId) return;
    setTopicId(nextTopicId);
    setLevel(1);
    setStreak(0);
    startNewProblem(nextTopicId, 1);
    router.replace({ pathname: '/edu', query: { tab: nextTopicId } }, undefined, { shallow: true });
  };

  const handleLevelChange = (nextLevel) => {
    if (nextLevel === level) return;
    setLevel(nextLevel);
    setStreak(0);
    startNewProblem(topicId, nextLevel);
  };

  const handlePick = (choice) => {
    if (!problem || status !== 'idle' || picked.includes(choice)) return;

    if (choice === problem.answer) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setSolved((v) => v + 1);
      setStatus('correct');
      const prevBest = bestMap[topicId] || 0;
      if (nextStreak > prevBest) {
        const nextBestMap = { ...bestMap, [topicId]: nextStreak };
        setBestMap(nextBestMap);
        try {
          window.localStorage.setItem(`${STORAGE_PREFIX}${topicId}`, String(nextStreak));
        } catch (error) {
          // 무시
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
    }
  };

  const calendarCells = useMemo(() => {
    const blanks = Array.from({ length: CALENDAR_START_DOW }, (_, i) => ({
      key: `blank-${i}`,
      day: null,
    }));
    const days = Array.from({ length: CALENDAR_TOTAL_DAYS }, (_, i) => ({
      key: `day-${i + 1}`,
      day: i + 1,
    }));
    return [...blanks, ...days];
  }, []);

  const answered = status !== 'idle';
  const currentBest = bestMap[topicId] || 0;

  return (
    <>
      <SEO
        title="생활 속 배움 놀이터 | 여전히, 나는 사람이다."
        description="유치원생과 초등학생이 생활 속에서 직접 만지며 배우는 인터랙티브 교육 놀이터입니다. 시계(12시·24시), 달력과 요일, 용돈과 거스름돈, 길이·들이·온도 단위를 재미있게 익혀 보세요."
        url="/edu/"
        noindex={true}
      />

      <div className={styles.wrap}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>🎒 유치원 · 초등 생활 속 배움 놀이터</p>
          <h1 className={styles.title}>생활 속 배움</h1>
          <p className={styles.subtitle}>
            교과서 속 개념을 매일 만나는 <strong>시계 · 달력 · 용돈 · 생활 단위 · 단어</strong>로
            직접 누르고 움직이며 스스로 깨우쳐요.
          </p>
        </header>

        {/* 전용 학습 놀이터 바로가기 배너 (시계 여행 & 단어기차) */}
        <section className={styles.QuickServicesSection} aria-label="전용 학습 놀이터 바로가기">
          <div className={styles.quickCardsGrid}>
            <Link href="/time-train/" className={styles.quickServiceCard}>
              <div className={styles.quickCardTop}>
                <span className={styles.quickCardIcon} aria-hidden="true">⏰</span>
                <span className={styles.quickCardBadge}>12시·24시 표기 + 걸린 시간</span>
              </div>
              <strong className={styles.quickCardTitle}>시계 여행 바로가기 →</strong>
              <p className={styles.quickCardDesc}>
                바늘 시계를 손으로 돌리며 걸린 시간과 오전·오후(12시)·24시 디지털 표기를 함께 배워요.
              </p>
            </Link>

            <Link href="/word-train/" className={styles.quickServiceCard}>
              <div className={styles.quickCardTop}>
                <span className={styles.quickCardIcon} aria-hidden="true">🚂</span>
                <span className={styles.quickCardBadge}>유아 ~ 초등 한글·영어 어휘</span>
              </div>
              <strong className={styles.quickCardTitle}>단어기차 바로가기 →</strong>
              <p className={styles.quickCardDesc}>
                기차 칸에 글자를 싣고 달리며 연령별 한글·영어 필수 단어와 힌트를 추리해요.
              </p>
            </Link>
          </div>
        </section>

        {/* 3대 생활 학습 주제 탭 선택 */}
        <div className={styles.topicTabs} role="tablist" aria-label="생활 속 배움 주제 선택">
          {EDU_TOPICS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={topicId === item.id}
              className={`${styles.topicTab} ${topicId === item.id ? styles.topicTabActive : ''}`}
              onClick={() => handleTopicChange(item.id)}
            >
              <span className={styles.topicEmoji} aria-hidden="true">{item.emoji}</span>
              <span className={styles.topicName}>{item.name}</span>
              <span className={styles.topicAge}>{item.ageBadge}</span>
            </button>
          ))}
        </div>

        {/* 선택된 주제 소개 및 난이도 탭 */}
        <div className={styles.topicSummaryBar}>
          <p className={styles.topicSummaryText}>{currentTopic.summary}</p>
        </div>

        <div className={styles.levelRow} role="tablist" aria-label={`${currentTopic.name} 난이도 선택`}>
          {currentTopic.levels.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={level === item.id}
              className={`${styles.levelChip} ${level === item.id ? styles.levelChipActive : ''}`}
              onClick={() => handleLevelChange(item.id)}
            >
              <span className={styles.levelEmoji} aria-hidden="true">{item.emoji}</span>
              <span className={styles.levelName}>{item.name}</span>
              <span className={styles.levelDesc}>{item.desc}</span>
            </button>
          ))}
        </div>

        {/* 점수 및 연속 기록 */}
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>맞힌 문제</span>
            <span className={styles.statValue}>{solved}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>연속 정답</span>
            <span className={styles.statValue}>{streak}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>{currentTopic.shortName} 최고</span>
            <span className={styles.statValue}>{currentBest}</span>
          </div>
          <button
            type="button"
            className={styles.resetBtn}
            onClick={() => {
              setSolved(0);
              setStreak(0);
              startNewProblem(topicId, level);
            }}
          >
            새 문제
          </button>
        </div>

        {!problem ? (
          <div className={styles.loadingCard}>생활 속 문제를 준비하고 있어요…</div>
        ) : (
          <>
            <section className={styles.problemCard} aria-live="polite">
              <div className={styles.problemHead}>
                <p className={styles.problemEyebrow}>
                  {currentTopic.emoji} {currentTopic.name} · {level}단계
                </p>
                <button
                  type="button"
                  className={`${styles.hintBtn} ${hintOpen ? styles.hintBtnOpen : ''}`}
                  onClick={() => setHintOpen((o) => !o)}
                  aria-expanded={hintOpen}
                  aria-controls="life-edu-hint"
                >
                  <span aria-hidden="true">💡</span> {hintOpen ? '힌트 닫기' : '힌트 보기'}
                </button>
              </div>

              <h2 className={styles.problemText}>{problem.prompt}</h2>

              {/* ── 1. 달력 학습 시각 자료 ── */}
              {problem.topic === 'calendar' && (
                <div className={styles.calendarBox}>
                  <div className={styles.calendarHeader}>
                    <strong>📅 {CALENDAR_MONTH}월 생활 달력</strong>
                    <span className={styles.calendarLegend}>
                      <span className={styles.legendDotToday}></span> 오늘({problem.baseDay}일)
                      {(hintOpen || answered) && (
                        <>
                          <span className={styles.legendDotTarget}></span> 정답 날({problem.targetDay}일)
                        </>
                      )}
                    </span>
                  </div>

                  <div className={styles.weekdayGrid} aria-hidden="true">
                    {WEEKDAYS.map((w, idx) => (
                      <span
                        key={w}
                        className={`${styles.weekdayCell} ${idx === 0 ? styles.sunText : idx === 6 ? styles.satText : ''}`}
                      >
                        {w}
                      </span>
                    ))}
                  </div>

                  <div className={styles.daysGrid}>
                    {calendarCells.map((cell) => {
                      if (!cell.day) {
                        return <span key={cell.key} className={styles.emptyDayCell} aria-hidden="true" />;
                      }
                      const isToday = cell.day === problem.baseDay;
                      const isTarget = (hintOpen || answered) && cell.day === problem.targetDay;
                      const isClicked = selectedCalDay === cell.day;
                      const dowIndex = (CALENDAR_START_DOW + cell.day - 1) % 7;

                      return (
                        <button
                          key={cell.key}
                          type="button"
                          onClick={() => setSelectedCalDay(cell.day)}
                          className={`${styles.dayCell} ${isToday ? styles.dayCellToday : ''} ${isTarget ? styles.dayCellTarget : ''} ${isClicked ? styles.dayCellClicked : ''} ${dowIndex === 0 ? styles.sunText : dowIndex === 6 ? styles.satText : ''}`}
                          aria-label={`${CALENDAR_MONTH}월 ${cell.day}일 ${getWeekdayOfDate(cell.day)}요일${isToday ? ' (오늘)' : ''}`}
                        >
                          <span className={styles.dayNum}>{cell.day}</span>
                          {isToday && <span className={styles.dayBadge}>오늘</span>}
                          {isTarget && !isToday && <span className={styles.dayBadgeTarget}>목표</span>}
                        </button>
                      );
                    })}
                  </div>

                  {selectedCalDay !== null && (
                    <p className={styles.calendarExploreNote}>
                      👆 선택한 <strong>{CALENDAR_MONTH}월 {selectedCalDay}일({getWeekdayOfDate(selectedCalDay)}요일)</strong>은
                      오늘({problem.baseDay}일)로부터{' '}
                      <strong>
                        {selectedCalDay === problem.baseDay
                          ? '오늘 당일(0일 차이)'
                          : selectedCalDay > problem.baseDay
                            ? `${selectedCalDay - problem.baseDay}일 뒤(+${selectedCalDay - problem.baseDay}일)`
                            : `${problem.baseDay - selectedCalDay}일 전(-${problem.baseDay - selectedCalDay}일)`}
                      </strong>
                      이에요!
                    </p>
                  )}
                </div>
              )}

              {/* ── 2. 용돈·가게 학습 시각 자료 ── */}
              {problem.topic === 'money' && (
                <div className={styles.moneyVisualBox}>
                  {problem.walletItems && (
                    <div className={styles.walletDisplay} aria-label="저금통 속 동전과 지폐">
                      {problem.walletItems.map((item, idx) => (
                        <span
                          key={`${item.value}-${idx}`}
                          className={item.kind === 'bill' ? styles.billVisual : styles.coinVisual}
                        >
                          {item.kind === 'bill' ? '💵 ' : '🪙 '}
                          {item.label}
                        </span>
                      ))}
                    </div>
                  )}

                  {problem.storeItems && (
                    <div className={styles.storeShelf}>
                      {problem.storeItems.map((item, idx) => (
                        <div key={`${item.name}-${idx}`} className={styles.storeItemCard}>
                          <span className={styles.storeItemEmoji} aria-hidden="true">{item.emoji}</span>
                          <span className={styles.storeItemName}>{item.name}</span>
                          <strong className={styles.storeItemPrice}>{formatWon(item.price)}</strong>
                        </div>
                      ))}
                      {problem.paidAmount && (
                        <div className={styles.paidBanner}>
                          <span>내가 낸 돈</span>
                          <strong>💵 {formatWon(problem.paidAmount)}</strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── 3. 단위·온도 학습 시각 자료 ── */}
              {problem.topic === 'unit' && (
                <div className={styles.unitVisualBox}>
                  {problem.visualType === 'ruler' && (
                    <div className={styles.rulerContainer}>
                      <div className={styles.rulerObjectLabel}>
                        <span>측정 물건: <strong>{problem.objectName}</strong></span>
                        <span>({problem.startCm}cm 눈금 ~ {problem.endCm}cm 눈금)</span>
                      </div>
                      <svg viewBox="0 0 440 96" className={styles.rulerSvg} aria-hidden="true">
                        {/* 물건 막대 */}
                        <rect
                          x={20 + problem.startCm * 20}
                          y={14}
                          width={(problem.endCm - problem.startCm) * 20}
                          height={22}
                          rx={6}
                          className={styles.rulerObjectBar}
                        />
                        {/* 자 본체 */}
                        <rect x={10} y={44} width={420} height={42} rx={6} className={styles.rulerBody} />
                        {Array.from({ length: 21 }, (_, cm) => {
                          const x = 20 + cm * 20;
                          const isFive = cm % 5 === 0;
                          return (
                            <g key={cm}>
                              <line
                                x1={x}
                                y1={44}
                                x2={x}
                                y2={isFive ? 62 : 55}
                                className={isFive ? styles.rulerTickMajor : styles.rulerTickMinor}
                              />
                              {cm % 2 === 0 && (
                                <text x={x} y={76} textAnchor="middle" className={styles.rulerNumber}>
                                  {cm}
                                </text>
                              )}
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  )}

                  {problem.visualType === 'meter' && (
                    <div className={styles.meterCard}>
                      <div className={styles.meterPillRow}>
                        {Array.from({ length: problem.meters }, (_, i) => (
                          <div key={i} className={styles.meterBlock}>
                            <span>1m 블록</span>
                            <strong>= 100cm</strong>
                          </div>
                        ))}
                        <div className={styles.cmExtraBlock}>
                          <span>추가 눈금</span>
                          <strong>+ {problem.extraCm}cm</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {problem.visualType === 'beaker' && (
                    <div className={styles.beakerRow}>
                      <div className={styles.beakerVisual}>
                        <div
                          className={styles.beakerWaterAdd}
                          style={{ height: `${Math.min(100, (problem.totalMl / 1200) * 100)}%` }}
                        />
                        <div
                          className={styles.beakerWaterBase}
                          style={{ height: `${Math.min(100, (problem.baseMl / 1200) * 100)}%` }}
                        />
                        <span className={styles.beakerTickLabel}>1,000mL (1L)</span>
                      </div>
                      <div className={styles.beakerInfo}>
                        <p>💧 처음 물: <strong>{problem.baseMl}mL</strong></p>
                        <p>➕ 더 부은 물: <strong>+ {problem.addMl}mL</strong></p>
                        <p className={styles.beakerRule}>💡 1,000mL가 모이면 1L(일 리터)예요.</p>
                      </div>
                    </div>
                  )}

                  {problem.visualType === 'thermometer' && (
                    <div className={styles.thermoBox}>
                      <div className={styles.thermoReadout}>
                        <span className={styles.thermoTemp}>{problem.temp}°C</span>
                        <span className={styles.thermoWeather}>{problem.weather}</span>
                      </div>
                      <div className={styles.thermoBarTrack} aria-hidden="true">
                        <div
                          className={styles.thermoBarFill}
                          style={{
                            width: `${Math.max(8, Math.min(100, ((problem.temp + 10) / 45) * 100))}%`,
                          }}
                        />
                      </div>
                      <div className={styles.thermoScaleLabels} aria-hidden="true">
                        <span>-10°C (추움)</span>
                        <span>0°C</span>
                        <span>15°C (선선)</span>
                        <span>30°C (더움)</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* ── 힌트 및 인터랙티브 조작 패널 ── */}
            {hintOpen && (
              <div className={styles.hintPanel} id="life-edu-hint">
                <p className={styles.hintTitle}>💡 스스로 깨우치는 힌트</p>
                <p className={styles.hintText}>{problem.hintText}</p>

                {problem.topic === 'money' && (
                  <div className={styles.moneyTrayBox}>
                    <p className={styles.moneyTrayTitle}>
                      👇 버튼을 눌러 목표 금액(<strong>{formatWon(problem.targetAmount)}</strong>)을 직접 만들어 보세요!
                    </p>
                    <div className={styles.moneyTrayButtons}>
                      {[1000, 500, 100].map((unit) => (
                        <button
                          key={unit}
                          type="button"
                          className={styles.moneyUnitBtn}
                          onClick={() => setTrayAmount((amt) => amt + unit)}
                        >
                          + {formatWon(unit)}
                        </button>
                      ))}
                      <button
                        type="button"
                        className={styles.moneyClearBtn}
                        onClick={() => setTrayAmount(0)}
                      >
                        비우기
                      </button>
                    </div>
                    <p className={styles.moneyTrayStatus}>
                      내가 모은 금액: <strong>{formatWon(trayAmount)}</strong>
                      {trayAmount === problem.targetAmount && (
                        <span className={styles.trayMatchBadge}> 🎉 목표 금액과 딱 맞아요!</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── 4지선다 선택지 ── */}
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
                    {choice}
                  </button>
                );
              })}
            </div>

            {status !== 'idle' && (
              <div className={`${styles.feedback} ${status === 'correct' ? styles.feedbackOk : styles.feedbackNo}`}>
                <p className={styles.feedbackTitle}>
                  {status === 'correct' ? '🎉 참 잘했어요! 정답이에요!' : '🙂 정답을 함께 확인해 볼까요?'}
                </p>
                <p className={styles.feedbackBody}>
                  정답은 <strong>{problem.answer}</strong>! {problem.explain}
                </p>
                <button
                  type="button"
                  className={styles.nextBtn}
                  onClick={() => startNewProblem(topicId, level)}
                >
                  다음 문제 풀기 →
                </button>
              </div>
            )}

            {picked.length > 0 && status === 'idle' && (
              <p className={styles.retryNote}>
                아쉬워요! 힌트 보기를 눌러 천천히 다시 생각해 볼까요? ({picked.length}/{MAX_TRIES})
              </p>
            )}
          </>
        )}

        <p className={styles.footNote}>
          유치원 누리과정 및 초등학교 1~3학년 수학·통합교과(달력과 요일, 화폐와 거스름돈, 길이·들이·온도 단위) 과정을 바탕으로 설계되었습니다. 학습 기록은 이 브라우저에만 저장됩니다.
        </p>
      </div>
    </>
  );
}
