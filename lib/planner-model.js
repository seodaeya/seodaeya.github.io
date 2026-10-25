/**
 * Data model for the static family planner.
 *
 * Everything here is pure: no window/document access, so the same helpers can
 * be unit-tested in Node and reused by the page. Times are stored as *wall
 * clock* strings so a local planner never shifts an all-day event across days:
 *   all-day  -> "YYYY-MM-DD"
 *   timed    -> "YYYY-MM-DDTHH:mm"
 */

export const PLANNER_VERSION = 1;
export const PLANNER_STORAGE_KEY = 'family-planner-v1';
export const PLANNER_META_KEY = 'family-planner-meta-v1';

export const LIST_TYPES = [
  { value: 'todo', label: '할 일' },
  { value: 'supply', label: '준비물' },
  { value: 'shopping', label: '장보기' },
];

const LIST_TYPE_VALUES = new Set(LIST_TYPES.map((type) => type.value));

const pad = (value) => String(value).padStart(2, '0');

export function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function wallDate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function wallDateTime(date = new Date()) {
  return `${wallDate(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function todayKey() {
  return wallDate(new Date());
}

/** Parses any accepted date shape into { date, time } in local wall time. */
export function toWall(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text) return null;

  let match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (match) return { date: `${match[1]}-${match[2]}-${match[3]}`, time: null };

  const hasZone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(text);
  match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(text);
  if (match && !hasZone) {
    return { date: `${match[1]}-${match[2]}-${match[3]}`, time: `${match[4]}:${match[5]}` };
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return { date: wallDate(parsed), time: `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}` };
  }
  return null;
}

/** Local Date for a wall-clock string ("YYYY-MM-DD" is treated as midnight). */
export function wallToDate(value) {
  const wall = toWall(value);
  if (!wall) return null;
  const [year, month, day] = wall.date.split('-').map(Number);
  const [hour, minute] = (wall.time || '00:00').split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

export function addDays(dateKey, days) {
  const base = toWall(dateKey);
  if (!base) return dateKey;
  const [year, month, day] = base.date.split('-').map(Number);
  const next = new Date(year, month - 1, day + days);
  return wallDate(next);
}

export function dateKeyOf(event) {
  if (!event || !event.startsAt) return null;
  return String(event.startsAt).slice(0, 10);
}

export function timeLabelOf(event) {
  if (!event || event.allDay || !event.startsAt) return '';
  return String(event.startsAt).slice(11, 16);
}

export function normalizeEvent(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const title = String(raw.title ?? raw.summary ?? '').trim();
  if (!title) return null;

  const dayFlag =
    raw.allDay === true || raw.allDay === 1 || raw.allDay === '1' || raw.allDay === 'true';
  let source = raw.startsAt ?? raw.start ?? raw.date ?? null;

  // The Expo app stores all-day events at UTC midnight. Keep the intended date.
  if (dayFlag && typeof source === 'string' && /^\d{4}-\d{2}-\d{2}T00:00:00(?:\.\d+)?Z$/.test(source)) {
    source = source.slice(0, 10);
  }

  const wall = toWall(source);
  const allDay = dayFlag || !wall || !wall.time;
  const startsAt = wall ? (allDay ? wall.date : `${wall.date}T${wall.time}`) : null;

  let endsAt = null;
  const endWall = toWall(raw.endsAt ?? raw.end ?? null);
  if (endWall) endsAt = allDay ? endWall.date : `${endWall.date}T${endWall.time || '23:59'}`;

  return {
    id: String(raw.id || createId()),
    title,
    startsAt,
    endsAt,
    allDay: allDay ? 1 : 0,
    location: raw.location ? String(raw.location).trim() : null,
    memo: raw.memo ? String(raw.memo).trim() : null,
    // Google Calendar is optional. Keep the mapping across reloads/backups so
    // the same planner event updates the same Google event instead of growing
    // duplicates. The access token itself is never persisted.
    googleEventId:
      raw.googleEventId != null && String(raw.googleEventId).trim()
        ? String(raw.googleEventId).trim()
        : null,
    googleSyncedAt: Number(raw.googleSyncedAt) || null,
    updatedAt: Number(raw.updatedAt) || Date.now(),
  };
}

/**
 * "synced" = sent after the last local edit, "changed" = needs a refresh.
 * Linked items are part of the Google description, so an edited/checked item
 * also counts as a change to the event.
 */
export function googleSyncState(event, items = []) {
  if (!event?.googleEventId) return 'none';
  if (!event.googleSyncedAt) return 'changed';
  const latest = Math.max(
    Number(event.updatedAt) || 0,
    ...(items || []).map((item) => Number(item.updatedAt) || 0),
  );
  return latest > Number(event.googleSyncedAt) ? 'changed' : 'synced';
}

function normalizeTitleKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @param {object} raw
 * @param {{ byIndex?: Array<{id: string, title: string}>, byTitle?: Map<string, string> } | null} eventLookup
 *   Lets imported JSON say `eventIndex` (0-based) or `eventTitle` instead of a
 *   generated id, so Gemini and hand-written JSON can link items to events.
 */
export function normalizeItem(raw, eventLookup = null) {
  if (!raw || typeof raw !== 'object') return null;
  const title = String(raw.title ?? '').trim();
  if (!title) return null;

  const listType = LIST_TYPE_VALUES.has(raw.listType) ? raw.listType : 'todo';
  const dueWall = toWall(raw.dueAt ?? raw.due ?? null);
  const done = raw.done === true || raw.done === 1 || raw.done === '1' ? 1 : 0;

  let eventId = raw.eventId != null && String(raw.eventId).trim() ? String(raw.eventId).trim() : null;
  if (!eventId && eventLookup) {
    // null/'' must stay "not linked"; Number(null) would be 0.
    const hasIndex =
      raw.eventIndex !== null && raw.eventIndex !== undefined && String(raw.eventIndex).trim() !== '';
    const index = hasIndex ? Number(raw.eventIndex) : NaN;
    if (Number.isInteger(index) && index >= 0 && eventLookup.byIndex?.[index]) {
      eventId = eventLookup.byIndex[index].id;
    }
    if (!eventId && eventLookup.byTitle) {
      const ref = raw.eventTitle ?? raw.event ?? null;
      if (ref) eventId = eventLookup.byTitle.get(normalizeTitleKey(ref)) || null;
    }
  }

  return {
    id: String(raw.id || createId()),
    listType,
    title,
    qty: raw.qty ? String(raw.qty).trim() : null,
    dueAt: dueWall ? dueWall.date : null,
    done,
    eventId,
    updatedAt: Number(raw.updatedAt) || Date.now(),
  };
}

/** Removes links to events that are no longer in the dataset (delete/import). */
function pruneItemLinks(items, events) {
  const validIds = new Set(events.map((event) => event.id));
  return items.map((item) => (item.eventId && !validIds.has(item.eventId) ? { ...item, eventId: null } : item));
}

function dedupeById(rows) {
  const map = new Map();
  for (const row of rows) {
    const existing = map.get(row.id);
    if (!existing || Number(row.updatedAt) >= Number(existing.updatedAt)) map.set(row.id, row);
  }
  return [...map.values()];
}

export function normalizeData(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const events = dedupeById(
    Array.isArray(source.events) ? source.events.map(normalizeEvent).filter(Boolean) : [],
  );

  const byTitle = new Map();
  for (const event of events) {
    const key = normalizeTitleKey(event.title);
    if (key && !byTitle.has(key)) byTitle.set(key, event.id);
  }
  const eventLookup = { byIndex: events, byTitle };

  const items = dedupeById(
    Array.isArray(source.items) ? source.items.map((item) => normalizeItem(item, eventLookup)).filter(Boolean) : [],
  );

  return { events, items: pruneItemLinks(items, events) };
}

/** Merge two datasets by id, newest updatedAt wins. */
export function mergeData(current, incoming) {
  const source = normalizeData(current);
  const next = normalizeData(incoming);
  const merge = (left, right) => {
    const map = new Map(left.map((row) => [row.id, row]));
    for (const row of right) {
      const existing = map.get(row.id);
      if (!existing || Number(row.updatedAt) >= Number(existing.updatedAt)) {
        // Older exports have no Google fields. Keep the local mapping so a
        // restore does not silently create duplicate Google events.
        const nextRow =
          existing?.googleEventId && !row.googleEventId
            ? {
                ...row,
                googleEventId: existing.googleEventId,
                googleSyncedAt: existing.googleSyncedAt,
              }
            : row;
        map.set(row.id, nextRow);
      }
    }
    return [...map.values()];
  };
  const events = dedupeById(merge(source.events, next.events));
  const items = dedupeById(merge(source.items, next.items));
  return { events, items: pruneItemLinks(items, events) };
}

export function sortEvents(events) {
  return [...events].sort((a, b) => {
    const left = a.startsAt || '9999-12-31';
    const right = b.startsAt || '9999-12-31';
    if (left === right) return a.title.localeCompare(b.title, 'ko');
    return left.localeCompare(right);
  });
}

export function sortItems(items) {
  const order = { supply: 0, todo: 1, shopping: 2 };
  return [...items].sort((a, b) => {
    if (a.done !== b.done) return a.done - b.done;
    const left = a.dueAt || '9999-12-31';
    const right = b.dueAt || '9999-12-31';
    if (left !== right) return left.localeCompare(right);
    const typeDiff = (order[a.listType] ?? 9) - (order[b.listType] ?? 9);
    if (typeDiff !== 0) return typeDiff;
    return a.title.localeCompare(b.title, 'ko');
  });
}

export function openItemCount(items) {
  return items.filter((item) => !item.done).length;
}

export function buildExport(data) {
  return JSON.stringify(
    {
      version: PLANNER_VERSION,
      kind: 'family-planner',
      exportedAt: new Date().toISOString(),
      events: sortEvents(data.events || []),
      items: sortItems(data.items || []),
    },
    null,
    2,
  );
}

export function formatDateLabel(dateKey) {
  const wall = toWall(dateKey);
  if (!wall) return '날짜 미정';
  const [year, month, day] = wall.date.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  return `${month}월 ${day}일 (${weekdays[date.getDay()]})`;
}

export function relativeDayLabel(dateKey) {
  if (!dateKey) return '날짜 미정';
  const today = todayKey();
  if (dateKey === today) return '오늘';
  if (dateKey === addDays(today, 1)) return '내일';
  if (dateKey === addDays(today, -1)) return '어제';
  return formatDateLabel(dateKey);
}

// ------------------------------------------------------------------ Google

/**
 * Body shared by Google Calendar (API + TEMPLATE) and ICS exports.
 * Linked supplies/todos are grouped so they read naturally in a calendar app.
 */
export function buildEventDescription(event, items = []) {
  if (!event) return '';
  const blocks = [];
  if (event.memo) blocks.push(String(event.memo).trim());

  const groups = [
    ['supply', '준비물'],
    ['todo', '할 일'],
    ['shopping', '장보기'],
  ];
  const lines = [];
  for (const [type, label] of groups) {
    const rows = (items || []).filter((item) => item && item.listType === type);
    if (!rows.length) continue;
    lines.push(`[${label}]`);
    for (const item of rows) {
      const qty = item.qty ? ` (${item.qty})` : '';
      const done = item.done ? ' ✓' : '';
      const due = item.dueAt ? ` · ${item.dueAt}까지` : '';
      lines.push(`- ${item.title}${qty}${done}${due}`);
    }
  }
  if (lines.length) blocks.push(['연결된 준비물·할 일', ...lines].join('\n'));

  // Google Calendar allows longer descriptions, but keep exports/payloads sane.
  return blocks.join('\n\n').slice(0, 8000);
}

function compactDate(dateKey) {
  return dateKey.replace(/-/g, '');
}

function utcStamp(date) {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(
    date.getUTCHours(),
  )}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

/** Google Calendar "add event" template link. No login or API setup required. */
export function googleCalendarUrl(event, items = []) {
  if (!event || !event.startsAt) return null;
  const params = new URLSearchParams({ action: 'TEMPLATE', text: event.title });
  if (event.allDay) {
    const start = dateKeyOf(event);
    params.set('dates', `${compactDate(start)}/${compactDate(addDays(start, 1))}`);
  } else {
    const start = wallToDate(event.startsAt);
    if (!start) return null;
    let end = wallToDate(event.endsAt);
    if (!end || end <= start) end = new Date(start.getTime() + 60 * 60 * 1000);
    params.set('dates', `${utcStamp(start)}/${utcStamp(end)}`);
  }
  if (event.location) params.set('location', event.location);
  const description = buildEventDescription(event, items);
  if (description) params.set('details', description);
  params.set('ctz', 'Asia/Seoul');
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function icsEscape(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

/** A single .ics file the user can import into Google Calendar / Apple Calendar. */
export function buildIcs(events, items = []) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NaRD//Family Planner//KO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const event of sortEvents(events || [])) {
    if (!event.startsAt) continue;
    lines.push('BEGIN:VEVENT');
    // Keep this UID stable and identical to the API's iCalUID so re-importing
    // an updated export/Google sync does not create a second copy.
    lines.push(`UID:planner-${icsEscape(event.id)}@seodaeya.github.io`);
    lines.push(`DTSTAMP:${utcStamp(new Date())}`);
    if (event.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${compactDate(dateKeyOf(event))}`);
      lines.push(`DTEND;VALUE=DATE:${compactDate(addDays(dateKeyOf(event), 1))}`);
    } else {
      const start = wallToDate(event.startsAt);
      if (!start) continue;
      let end = wallToDate(event.endsAt);
      if (!end || end <= start) end = new Date(start.getTime() + 60 * 60 * 1000);
      lines.push(`DTSTART:${utcStamp(start)}`);
      lines.push(`DTEND:${utcStamp(end)}`);
    }
    lines.push(`SUMMARY:${icsEscape(event.title)}`);
    if (event.location) lines.push(`LOCATION:${icsEscape(event.location)}`);
    const description = buildEventDescription(
      event,
      (items || []).filter((item) => item && item.eventId === event.id),
    );
    if (description) lines.push(`DESCRIPTION:${icsEscape(description)}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}

/** Convenience wrapper for one event; keeps the same UID as a full export. */
export function buildEventIcs(event, items = []) {
  return buildIcs(event ? [event] : [], items);
}

// ------------------------------------------------------------------ prompt

export const GEMINI_PROMPT = `너는 가정 통신문·안내문을 가족 일정과 준비물로 정리하는 도우미다.
아래 JSON 형식으로만 답한다. 설명, 인사말, 코드블록 표시(\`\`\`) 없이 JSON만 출력한다.

규칙:
- 날짜는 YYYY-MM-DD, 시간은 24시간 HH:mm
- 날짜만 있으면 allDay는 true이고 startsAt은 "YYYY-MM-DD"
- 시간이 있으면 allDay는 false이고 startsAt은 "YYYY-MM-DDTHH:mm"
- 준비물은 listType "supply", 해야 할 일은 "todo", 장보기는 "shopping"
- 수량은 qty에 ("운동화 1켤레" → qty "1켤레")
- 항목이 특정 일정에 딸린 준비물·할 일이면 eventIndex에 events 배열에서의 순번(0부터)을 적는다
- 여러 일정에 공통으로 필요한 항목이거나 일정을 특정할 수 없으면 eventIndex는 null
- 확실하지 않은 값은 null로 두고 추측하지 않는다
- 광고, 인사말, 링크 목록은 제외한다
- 일정이 여러 개면 events에 모두 넣는다

출력 예시:
{"events":[{"title":"북한산 현장체험학습","startsAt":"2026-12-01","allDay":true,"location":"북한산","memo":"x반"}],"items":[{"listType":"supply","title":"운동화","qty":"1켤레","dueAt":null,"eventIndex":0},{"listType":"todo","title":"신청서 제출","qty":null,"dueAt":"2026-11-15","eventIndex":0}]}`;
