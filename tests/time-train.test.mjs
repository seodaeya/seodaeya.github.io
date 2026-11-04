import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  LEVELS,
  MAX_OFFSET,
  NOTATIONS,
  choiceTo24,
  createProblem,
  explain12To24,
  formatAnswer,
  formatAnswerByNotation,
  formatChoiceByNotation,
  formatClock,
  formatClock24,
  formatClockByNotation,
  formatClockWithPeriod,
  formatDigital,
  formatDuration,
  isAtTarget,
  to24HourMinutes,
} from '../lib/time-train.js';

const toMinutes = (text) => {
  const match = text.match(/(\d+)시 (\d+)분/);
  assert.ok(match, `시각 형식이 아닙니다: ${text}`);
  return Number(match[1]) * 60 + Number(match[2]);
};

test('formatClock uses a 12-hour clock', () => {
  assert.equal(formatClock(0), '12시 00분');
  assert.equal(formatClock(10), '12시 10분');
  assert.equal(formatClock(70), '1시 10분');
  assert.equal(formatClock(660), '11시 00분');
  assert.equal(formatClock(720), '12시 00분');
  assert.equal(formatClock(780), '1시 00분');
  assert.equal(formatClock(1439), '11시 59분');
  assert.equal(formatClock(1440), '12시 00분');
  assert.equal(formatClock(-10), '11시 50분');
});

test('formatDuration spells hours and minutes', () => {
  assert.equal(formatDuration(10), '10분');
  assert.equal(formatDuration(60), '1시간');
  assert.equal(formatDuration(70), '1시간 10분');
  assert.equal(formatDuration(150), '2시간 30분');
});

test('createProblem builds a solvable problem for every level', () => {
  for (const level of LEVELS.map((item) => item.id)) {
    for (let i = 0; i < 300; i += 1) {
      const problem = createProblem(level);

      assert.equal(problem.level, level);
      assert.ok(problem.duration > 0, '걸린 시간은 0보다 커야 합니다');
      assert.ok(problem.duration <= MAX_OFFSET, '힌트 시계가 움직일 수 있는 범위를 넘었습니다');
      assert.equal(problem.choices.length, 4, '선택지는 4개여야 합니다');
      assert.ok(problem.choices.includes(problem.answer), '정답이 선택지에 없습니다');
      assert.equal(new Set(problem.choices).size, 4, '선택지가 중복됩니다');

      const labels = problem.choices.map((choice) => (
        problem.kind === 'duration' ? formatDuration(choice) : formatClock(choice)
      ));
      assert.equal(new Set(labels).size, 4, `표시 문구가 중복됩니다: ${labels.join(', ')}`);

      assert.equal(problem.start % 10, 0, '시작 분은 10분 단위여야 합니다');
      assert.ok(problem.start >= 60 && problem.start < 12 * 60, '시작 시각은 1시~11시대여야 합니다');
      assert.ok(problem.prompt.includes(formatClock(problem.start)), '문제에 시작 시각이 없습니다');

      if (level === 3) {
        assert.equal(problem.kind, 'duration');
        assert.equal(problem.answer, problem.duration);
        assert.equal(problem.end - problem.start, problem.duration);
        assert.ok(problem.prompt.includes(formatClock(problem.end)), '문제에 도착 시각이 없습니다');
        assert.equal(formatAnswer(problem), formatDuration(problem.duration));
      } else {
        assert.equal(problem.kind, 'time');
        assert.equal(problem.end - problem.start, problem.duration);
        assert.equal(formatAnswer(problem), formatClock(problem.end));
        assert.ok(problem.prompt.includes(formatDuration(problem.duration)), '문제에 더할 시간이 없습니다');
      }

      if (level === 1) {
        assert.ok([10, 20, 30, 40, 50].includes(problem.duration), '1단계는 10~50분이어야 합니다');
      }
      if (level === 2) {
        assert.ok(problem.duration >= 60, '2단계는 1시간을 넘겨야 합니다');
        assert.ok(problem.duration <= 150, '2단계는 2시간 30분을 넘지 않아야 합니다');
      }
    }
  }
});

test('createProblem returns a fresh id for each problem', () => {
  const ids = new Set();
  for (let i = 0; i < 50; i += 1) ids.add(createProblem(1).id);
  assert.ok(ids.size >= 45, `문제 id가 재사용됩니다: ${ids.size}/50`);
});

test('a 12-hour answer stays inside a single clock face', () => {
  for (let i = 0; i < 200; i += 1) {
    const problem = createProblem(2);
    const start = toMinutes(formatClock(problem.start));
    const end = toMinutes(formatAnswer(problem));
    const elapsed = ((end - start) % 720 + 720) % 720;
    // 2단계는 최대 150분이므로 12시간 경계를 넘어도 경과 분은 그대로 보여야 합니다.
    assert.equal(elapsed, problem.duration % 720);
  }
});

test('도착 판정은 목표와 정확히 같을 때만 true', () => {
  assert.equal(isAtTarget(40, 40), true);
  assert.equal(isAtTarget(39, 40), false, '1분 부족은 도착이 아닙니다');
  assert.equal(isAtTarget(41, 40), false, '1분 초과는 도착이 아닙니다');
  assert.equal(isAtTarget(0, 0), true);
  assert.equal(isAtTarget(0, null), false);
  assert.equal(isAtTarget(0, undefined), false);
});

test('12시간제·24시간제 표기 변환과 디지털 시계 포맷 검증', () => {
  assert.equal(NOTATIONS.length, 3);
  assert.equal(to24HourMinutes(200, 'pm'), 920); // 오후 3시 20분 -> 15시 20분
  assert.equal(to24HourMinutes(560, 'am'), 560); // 오전 9시 20분 -> 09시 20분

  assert.equal(formatClockWithPeriod(560), '오전 9시 20분');
  assert.equal(formatClockWithPeriod(920), '오후 3시 20분');
  assert.equal(formatClock24(560), '09시 20분');
  assert.equal(formatClock24(920), '15시 20분');

  assert.equal(formatDigital(560, '12h'), '오전 09:20');
  assert.equal(formatDigital(920, '12h'), '오후 03:20');
  assert.equal(formatDigital(560, '24h'), '09:20');
  assert.equal(formatDigital(920, '24h'), '15:20');

  assert.equal(formatClockByNotation(920, '12h'), '오후 3시 20분');
  assert.equal(formatClockByNotation(920, '24h'), '15시 20분');
  assert.equal(formatClockByNotation(920, 'both'), '오후 3시 20분 (15:20)');
  assert.ok(explain12To24(920).includes('3 + 12 = 15시'));

  for (let i = 0; i < 60; i += 1) {
    const p = createProblem(2);
    const ansLabel = formatAnswerByNotation(p, '24h');
    const choiceLabels = p.choices.map((c) => formatChoiceByNotation(p, c, '24h'));
    assert.ok(choiceLabels.includes(ansLabel));
    assert.equal(new Set(choiceLabels).size, 4);
    assert.equal(choiceTo24(p, p.answer), p.end24 % 1440);
  }
});
