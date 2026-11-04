import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  CALENDAR_TOTAL_DAYS,
  EDU_TOPICS,
  createCalendarProblem,
  createEduProblem,
  createMoneyProblem,
  createUnitProblem,
  formatCalendarDay,
  formatWon,
  getWeekdayOfDate,
} from '../lib/life-edu.js';

test('formatWon and getWeekdayOfDate return accurate Korean strings', () => {
  assert.equal(formatWon(500), '500원');
  assert.equal(formatWon(1500), '1,500원');
  assert.equal(getWeekdayOfDate(1), '금');
  assert.equal(getWeekdayOfDate(2), '토');
  assert.equal(getWeekdayOfDate(3), '일');
  assert.equal(formatCalendarDay(8), '5월 8일 (금요일)');
});

test('createCalendarProblem generates valid 4-choice problems for levels 1..3', () => {
  for (const level of [1, 2, 3]) {
    for (let i = 0; i < 100; i += 1) {
      const p = createCalendarProblem(level);
      assert.equal(p.topic, 'calendar');
      assert.equal(p.level, level);
      assert.ok(p.baseDay >= 1 && p.baseDay <= CALENDAR_TOTAL_DAYS);
      assert.ok(p.targetDay >= 1 && p.targetDay <= CALENDAR_TOTAL_DAYS);
      assert.equal(p.choices.length, 4);
      assert.equal(new Set(p.choices).size, 4);
      assert.ok(p.choices.includes(p.answer));
    }
  }
});

test('createMoneyProblem generates valid 4-choice problems for levels 1..3', () => {
  for (const level of [1, 2, 3]) {
    for (let i = 0; i < 100; i += 1) {
      const p = createMoneyProblem(level);
      assert.equal(p.topic, 'money');
      assert.equal(p.level, level);
      assert.ok(p.targetAmount >= 100);
      assert.equal(p.answer, formatWon(p.targetAmount));
      assert.equal(p.choices.length, 4);
      assert.equal(new Set(p.choices).size, 4);
      assert.ok(p.choices.includes(p.answer));
    }
  }
});

test('createUnitProblem generates valid 4-choice problems for levels 1..3', () => {
  for (const level of [1, 2, 3]) {
    for (let i = 0; i < 100; i += 1) {
      const p = createUnitProblem(level);
      assert.equal(p.topic, 'unit');
      assert.equal(p.level, level);
      assert.equal(p.choices.length, 4);
      assert.equal(new Set(p.choices).size, 4);
      assert.ok(p.choices.includes(p.answer));
    }
  }
});

test('createEduProblem dispatches all EDU_TOPICS cleanly', () => {
  assert.equal(EDU_TOPICS.length, 3);
  for (const topic of EDU_TOPICS) {
    for (const lvl of topic.levels) {
      const p = createEduProblem(topic.id, lvl.id);
      assert.equal(p.topic, topic.id);
      assert.equal(p.level, lvl.id);
    }
  }
});
