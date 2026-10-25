import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';

import {
  GOOGLE_DAILY_LIMIT,
  GOOGLE_MINUTE_LIMIT,
  buildGoogleEvent,
  clearGoogleUsage,
  consumeGoogleUsage,
  getGoogleUsage,
} from '../lib/planner-google.js';
import {
  buildEventDescription,
  buildIcs,
  googleCalendarUrl,
  googleSyncState,
  normalizeEvent,
  todayKey,
} from '../lib/planner-model.js';

const USAGE_KEY = 'family-planner-google-usage-v1';
const originalWindow = globalThis.window;
const store = new Map();

function installStorage() {
  globalThis.window = {
    localStorage: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key),
    },
  };
}

beforeEach(() => {
  store.clear();
  installStorage();
});

after(() => {
  globalThis.window = originalWindow;
});

const event = normalizeEvent({
  id: 'event-1',
  title: '불암산 현장체험학습',
  startsAt: '2026-10-27',
  allDay: 1,
  location: '불암산',
  memo: 'x반',
  updatedAt: 1000,
  googleEventId: 'google-1',
  googleSyncedAt: 2000,
});

const items = [
  {
    id: 'item-1',
    title: '운동화',
    listType: 'supply',
    qty: '1켤레',
    dueAt: '2026-10-26',
    done: 0,
    eventId: 'event-1',
    updatedAt: 1000,
  },
  {
    id: 'item-2',
    title: '신청서 제출',
    listType: 'todo',
    qty: null,
    dueAt: null,
    done: 1,
    eventId: 'event-1',
    updatedAt: 1000,
  },
];

test('normalizeEvent keeps the Google mapping and sync state', () => {
  assert.equal(event.googleEventId, 'google-1');
  assert.equal(event.googleSyncedAt, 2000);
  assert.equal(googleSyncState(event, []), 'synced');
  assert.equal(
    googleSyncState({ ...event, updatedAt: 3000 }, []),
    'changed',
  );
  assert.equal(
    googleSyncState(event, [{ updatedAt: 3000 }]),
    'changed',
    'editing a linked item should mark the Google description as changed',
  );
  assert.equal(googleSyncState({ ...event, googleEventId: null }, []), 'none');
});

test('buildGoogleEvent sends an exclusive all-day end date and item summary', () => {
  const payload = buildGoogleEvent(event, items);
  assert.deepEqual(payload.start, { date: '2026-10-27' });
  assert.deepEqual(payload.end, { date: '2026-10-28' });
  assert.equal(payload.iCalUID, 'planner-event-1@seodaeya.github.io');
  assert.equal(payload.location, '불암산');
  assert.match(payload.description, /x반/);
  assert.match(payload.description, /\[준비물\]/);
  assert.match(payload.description, /운동화 \(1켤레\)/);
  assert.match(payload.description, /신청서 제출 ✓/);
  assert.equal(payload.extendedProperties.private.plannerEventId, 'event-1');
});

test('buildGoogleEvent gives timed events a one-hour default and Asia/Seoul', () => {
  const timed = normalizeEvent({
    id: 'event-2',
    title: '학예발표회',
    startsAt: '2026-10-30T14:00',
    allDay: 0,
    updatedAt: 1,
  });
  const payload = buildGoogleEvent(timed, [], { includeUid: false });
  assert.deepEqual(payload.start, { dateTime: '2026-10-30T14:00:00', timeZone: 'Asia/Seoul' });
  assert.deepEqual(payload.end, { dateTime: '2026-10-30T15:00:00', timeZone: 'Asia/Seoul' });
  assert.equal(payload.iCalUID, undefined);
  assert.equal(payload.location, '');
  assert.equal(payload.description, '');
});

test('buildGoogleEvent rejects undated events', () => {
  assert.throws(() => buildGoogleEvent({ id: 'x', title: '날짜 없음' }), /날짜가 없는/);
});

test('ICS, template URL, and description share the same stable UID/details', () => {
  const description = buildEventDescription(event, items);
  const ics = buildIcs([event], items);
  assert.match(ics, /UID:planner-event-1@seodaeya\.github\.io/);
  assert.match(ics, /DTSTART;VALUE=DATE:20261027/);
  assert.match(ics, /DTEND;VALUE=DATE:20261028/);
  assert.ok(ics.includes('DESCRIPTION:x반\\n\\n연결된 준비물'));

  const url = new URL(googleCalendarUrl(event, items));
  assert.equal(url.searchParams.get('text'), '불암산 현장체험학습');
  assert.equal(url.searchParams.get('dates'), '20261027/20261028');
  assert.equal(url.searchParams.get('details'), description);
});

test('usage guard blocks the 50% daily and per-minute limits', () => {
  const today = todayKey();
  store.set(
    USAGE_KEY,
    JSON.stringify({ date: today, count: GOOGLE_DAILY_LIMIT, windowStart: Date.now(), windowCount: 1 }),
  );
  assert.throws(() => consumeGoogleUsage(), (error) => error.code === 'USAGE_LIMIT');

  store.set(
    USAGE_KEY,
    JSON.stringify({
      date: today,
      count: 1,
      windowStart: Date.now(),
      windowCount: GOOGLE_MINUTE_LIMIT,
    }),
  );
  assert.throws(() => consumeGoogleUsage(), (error) => error.code === 'RATE_GUARD');
});

test('usage guard increments once and resets an expired minute window', () => {
  store.set(
    USAGE_KEY,
    JSON.stringify({
      date: todayKey(),
      count: 10,
      windowStart: Date.now() - 61_000,
      windowCount: 999,
    }),
  );
  consumeGoogleUsage();
  const usage = getGoogleUsage();
  assert.equal(usage.count, 11);
  assert.equal(usage.limit, GOOGLE_DAILY_LIMIT);
  assert.ok(usage.minuteCount <= 1);
  assert.equal(usage.minuteLimit, GOOGLE_MINUTE_LIMIT);

  clearGoogleUsage();
  assert.equal(getGoogleUsage().count, 0);
});
