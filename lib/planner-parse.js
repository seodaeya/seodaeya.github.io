import { createId, dateKeyOf, normalizeData, timeLabelOf, todayKey, wallDate } from './planner-model.js';

/**
 * Turns pasted text (or Gemini JSON) into planner rows.
 *
 * The JSON path is preferred: it is exact and comes from GEMINI_PROMPT. The
 * text path is a best-effort Korean parser for notices pasted as-is; the UI
 * always shows a preview so the user can fix mistakes before saving.
 */

const pad = (value) => String(value).padStart(2, '0');

const EVENT_WORDS =
  /(체험학습|현장학습|운동회|소풍|캠프|발표회|공연|상담|모임|방문|개학|방학|휴교|재량휴업|등교|하교|시험|행사|축제|견학|수련회|졸업식|입학식)/;

const EVENT_INFO_RE = /^(일시|날짜|시간|장소|대상|비고)\s*[:：]\s*(.*)$/;

function stripDecorations(line) {
  return line
    .replace(/<[^>]+>/g, ' ')
    .replace(/[*_`]/g, '')
    .replace(/^\s*[#>\s]+/, '')
    .replace(/^\s*(?:[-*•·▪◦]|\d+[.)])\s*/, '')
    .replace(/^\s*\[[ xX✓]\]\s*/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function splitList(value) {
  return String(value || '')
    .split(/[,、·•]|\s{2,}/)
    .map((part) => part.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);
}

function isValidYmd(year, month, day) {
  if (!(month >= 1 && month <= 12) || !(day >= 1 && day <= 31)) return false;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

/** Extends a date match with an adjacent weekday or "까지/부터" particle. */
function extendDateMatch(line, match) {
  let matched = match[0];
  const index = (match.index ?? 0) + matched.length;
  const weekday = /^\s*\(([일월화수목금토])(?:요일)?\)/.exec(line.slice(index));
  if (weekday) matched += weekday[0];
  const particle = /^\s*(까지|부터)/.exec(line.slice(index + (weekday ? weekday[0].length : 0)));
  if (particle) matched += particle[0];
  return matched;
}

function extractDate(line, now = new Date()) {
  let match = /(\d{4})\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})\s*일?/.exec(line);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (isValidYmd(year, month, day)) {
      return { date: `${year}-${pad(month)}-${pad(day)}`, matched: extendDateMatch(line, match) };
    }
  }

  match = /(\d{1,2})\s*월\s*(\d{1,2})\s*일/.exec(line);
  if (match) {
    const month = Number(match[1]);
    const day = Number(match[2]);
    if (isValidYmd(now.getFullYear(), month, day)) {
      let year = now.getFullYear();
      const candidate = new Date(year, month - 1, day);
      const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 60);
      // A December notice may mention January; keep it in the future.
      if (candidate < cutoff) year += 1;
      if (isValidYmd(year, month, day)) {
        return { date: `${year}-${pad(month)}-${pad(day)}`, matched: extendDateMatch(line, match) };
      }
    }
  }

  match = /(?:^|[^\d])(\d{1,2})\s*[/.]\s*(\d{1,2})(?!\d)/.exec(line);
  if (match) {
    const month = Number(match[1]);
    const day = Number(match[2]);
    if (isValidYmd(now.getFullYear(), month, day)) {
      let year = now.getFullYear();
      const candidate = new Date(year, month - 1, day);
      const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 60);
      if (candidate < cutoff) year += 1;
      return { date: `${year}-${pad(month)}-${pad(day)}`, matched: extendDateMatch(line, match) };
    }
  }

  return null;
}

function extractTime(line) {
  let match = /(오전|오후|아침|점심|저녁|밤)\s*(\d{1,2})\s*(?:시|:)\s*(\d{1,2})?\s*분?/.exec(line);
  if (match) {
    let hour = Number(match[2]);
    const minute = Number(match[3] || 0);
    if (/오후|저녁|밤/.test(match[1]) && hour < 12) hour += 12;
    if (/오전|아침/.test(match[1]) && hour === 12) hour = 0;
    if (hour < 24 && minute < 60) {
      return { time: `${pad(hour)}:${pad(minute)}`, matched: match[0] };
    }
  }

  match = /(?:^|[^\d])(\d{1,2}):(\d{2})(?!\d)/.exec(line);
  if (match) {
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour < 24 && minute < 60) {
      return { time: `${pad(hour)}:${pad(minute)}`, matched: match[0] };
    }
  }

  if (/종일|하루\s*종일/.test(line)) {
    return { time: null, allDay: true, matched: '종일' };
  }

  return null;
}

function detectSection(line) {
  const text = line.replace(/[\[\]【】()]/g, '').replace(/[:：]\s*$/, '').trim();
  if (!text || text.length > 24) return null;
  if (/준비물|챙길\s*것|가져갈\s*것|준비할\s*것/.test(text)) return 'supply';
  if (/장보기|장\s*볼\s*것|구매\s*목록/.test(text)) return 'shopping';
  if (/할\s*일|해야\s*할\s*일|과제|숙제/.test(text)) return 'todo';
  if (/일정|행사\s*안내|안내\s*사항/.test(text)) return 'event';
  return null;
}

function cleanTitle(line, matches) {
  let title = line;
  for (const matched of matches) {
    if (matched) title = title.replace(matched, ' ');
  }
  return title
    .replace(/\(\s*\)/g, ' ')
    .replace(/\[\s*\]/g, ' ')
    .replace(/^[\s\-–—:：·,、]+/, '')
    .replace(/[\s\-–—:：·,、]+$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function extractQty(title) {
  const match = /^(.*?)\s+(\d+\s*(?:개|켤레|장|병|봉|세트|권|매|팩|통|박스|줄|컵|포기))$/.exec(title);
  if (!match) return { title, qty: null };
  return { title: match[1].trim(), qty: match[2].trim() };
}

function isNoise(line) {
  if (!line) return true;
  if (/^https?:\/\//i.test(line)) return true;
  if (/^(문의|연락처|전화|첨부|붙임|감사합니다|이상입니다)/.test(line)) return true;
  if (/^[-=]{3,}$/.test(line)) return true;
  return false;
}

function looksLikeEvent(title) {
  return EVENT_WORDS.test(title);
}

function parseJsonValue(parsed) {
  const candidates = [parsed, parsed?.result, parsed?.data, parsed?.planner];
  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'object' && (Array.isArray(candidate.events) || Array.isArray(candidate.items))) {
      const data = normalizeData(candidate);
      return {
        ok: data.events.length + data.items.length > 0,
        kind: 'json',
        data,
        warnings: [],
        error:
          data.events.length + data.items.length > 0
            ? null
            : 'JSON은 읽었지만 일정이나 할 일이 비어 있습니다.',
      };
    }
  }
  return null;
}

function tryParseJson(source) {
  const unfenced = source
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  const attempts = [unfenced];
  const first = unfenced.search(/[{[]/);
  const last = Math.max(unfenced.lastIndexOf('}'), unfenced.lastIndexOf(']'));
  if (first >= 0 && last > first) attempts.push(unfenced.slice(first, last + 1));

  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt);
    } catch {
      // try the next shape
    }
  }
  return null;
}

export function parsePlannerInput(text) {
  const source = String(text || '').trim();
  if (!source) {
    return { ok: false, kind: 'text', data: { events: [], items: [] }, warnings: [], error: '붙여넣은 내용이 없습니다.' };
  }

  const looksJson = /^```(?:json)?/i.test(source) || /^[{[]/.test(source) || /"(events|items)"\s*:/.test(source);
  if (looksJson) {
    const parsed = tryParseJson(source);
    if (parsed) {
      const result = parseJsonValue(parsed);
      if (result) return result;
      return {
        ok: false,
        kind: 'json',
        data: { events: [], items: [] },
        warnings: [],
        error: 'JSON 형식이지만 events/items 배열을 찾지 못했습니다.',
      };
    }
    return {
      ok: false,
      kind: 'json',
      data: { events: [], items: [] },
      warnings: [],
      error: 'JSON을 해석하지 못했습니다. 코드블록 표시 없이 다시 붙여넣어 주세요.',
    };
  }

  return parseText(source);
}

export function parseText(source, now = new Date()) {
  const events = [];
  const items = [];
  const warnings = [];
  let context = null;
  let lastEvent = null;
  let pendingInfo = {};
  let sawDate = false;

  const pushEvent = (title, date, time, allDay) => {
    if (!title) return;
    const useDate = date || pendingInfo.date || null;
    const useTime = time || pendingInfo.time || null;
    const isAllDay = allDay || (!useTime && !!(useDate || pendingInfo.allDay));
    const event = {
      id: createId(),
      title,
      startsAt: useDate ? (isAllDay ? useDate : `${useDate}T${useTime || '09:00'}`) : null,
      endsAt: null,
      allDay: isAllDay ? 1 : 0,
      location: pendingInfo.location || null,
      memo: pendingInfo.memo || null,
      updatedAt: Date.now(),
    };
    pendingInfo = {};
    events.push(event);
    lastEvent = event;
  };

  const pushItem = (title, listType, dueAt, eventId = null) => {
    if (!title) return;
    const { title: clean, qty } = extractQty(title);
    items.push({
      listType,
      title: clean,
      qty,
      dueAt: dueAt || null,
      done: 0,
      eventId: eventId || null,
      updatedAt: Date.now(),
    });
  };

  for (const rawLine of source.split(/\r?\n/)) {
    const line = stripDecorations(rawLine);
    if (isNoise(line)) continue;

    // Inline labelled lists: "준비물: 운동화, 반 티"
    const inline = /^(준비물|준비물\s*목록|챙길\s*것|가져갈\s*것|할\s*일|과제|해야\s*할\s*일|장보기|구매)\s*[:：]\s*(.+)$/.exec(
      line,
    );
    if (inline) {
      const label = inline[1];
      const type = /준비물|챙길|가져갈/.test(label)
        ? 'supply'
        : /장보기|구매/.test(label)
          ? 'shopping'
          : 'todo';
      for (const part of splitList(inline[2])) {
        const due = extractDate(part, now);
        const title = due ? cleanTitle(part, [due.matched]) : part;
        // "12월 1일 체험학습 / 준비물: 운동화"는 바로 앞 일정에 붙인다.
        pushItem(title, type, due?.date, lastEvent?.id || null);
      }
      continue;
    }

    // "일시: 12월 1일", "장소: 북한산"
    const info = EVENT_INFO_RE.exec(line);
    if (info) {
      const field = info[1];
      const value = info[2].trim();
      if (field === '장소') {
        if (lastEvent) lastEvent.location = value;
        else pendingInfo.location = value;
        continue;
      }
      if (field === '대상' || field === '비고') {
        if (lastEvent) lastEvent.memo = value;
        else pendingInfo.memo = value;
        continue;
      }
      const date = extractDate(value, now);
      const time = extractTime(value);
      if (date) sawDate = true;
      const eventDay = lastEvent ? dateKeyOf(lastEvent) : null;
      const sameDay = !!date && eventDay === date.date;
      const timeOnlyForDated = !date && !!time && !!eventDay;

      // "12월 1일 체험학습" followed by "일시: 12월 1일 오전 9시" should
      // upgrade the just-created all-day row instead of leaking the time to
      // the next event.
      if (lastEvent && (date || time) && (!eventDay || sameDay || timeOnlyForDated)) {
        const day = date?.date || eventDay || null;
        const clock = time?.time || timeLabelOf(lastEvent) || null;
        if (day) {
          lastEvent.allDay = clock ? 0 : 1;
          lastEvent.startsAt = clock ? `${day}T${clock}` : day;
          continue;
        }
      }

      if (date) pendingInfo.date = date.date;
      if (time) pendingInfo.time = time.time;
      if (!date && !time && value) pendingInfo.memo = value;
      continue;
    }

    const section = detectSection(line);
    if (section) {
      context = section;
      continue;
    }

    const date = extractDate(line, now);
    const time = extractTime(line);
    if (date) sawDate = true;

    const matches = [date?.matched, time?.matched].filter(Boolean);
    const withoutWhen = cleanTitle(line, matches);
    if (!withoutWhen) {
      // A line that only contains a date attaches it to the previous event.
      if (lastEvent && date && !lastEvent.startsAt) {
        lastEvent.allDay = time?.time ? 0 : 1;
        lastEvent.startsAt = time?.time ? `${date.date}T${time.time}` : date.date;
      }
      continue;
    }

    if (context === 'supply' || context === 'shopping' || context === 'todo') {
      pushItem(withoutWhen, context, date?.date);
      continue;
    }

    if (context === 'event' || date || looksLikeEvent(withoutWhen)) {
      const allDay = !!time?.allDay;
      pushEvent(withoutWhen, date?.date || null, time?.time || null, allDay);
      continue;
    }

    pushItem(withoutWhen, 'todo', null);
  }

  // Merge exact duplicates so pasted lists with repeated bullets stay tidy.
  const uniqueEvents = [];
  const eventKeys = new Set();
  for (const event of events) {
    const key = `${event.title}|${event.startsAt || ''}`;
    if (eventKeys.has(key)) continue;
    eventKeys.add(key);
    uniqueEvents.push(event);
  }
  const uniqueItems = [];
  const itemKeys = new Set();
  for (const item of items) {
    const key = `${item.listType}|${item.title}|${item.dueAt || ''}|${item.eventId || ''}`;
    if (itemKeys.has(key)) continue;
    itemKeys.add(key);
    uniqueItems.push(item);
  }

  // A notice with a single event is the common case: the 준비물/할 일 lists
  // belong to that event even if they appear under their own heading.
  if (uniqueEvents.length === 1) {
    for (const item of uniqueItems) {
      if (!item.eventId) item.eventId = uniqueEvents[0].id;
    }
  }

  const data = normalizeData({ events: uniqueEvents, items: uniqueItems });

  if (!data.events.length && !data.items.length) {
    return {
      ok: false,
      kind: 'text',
      data,
      warnings,
      error: '일정이나 할 일을 찾지 못했습니다. AI로 정리된 JSON을 사용하거나 직접 추가해 주세요.',
    };
  }

  if (data.events.some((event) => !event.startsAt)) {
    warnings.push('날짜를 찾지 못한 일정이 있습니다. 미리보기에서 날짜를 지정해 주세요.');
  }
  if (!sawDate && data.events.length === 0) {
    warnings.push('날짜가 없어 모두 할 일로 정리했습니다.');
  }
  if (data.events.length > 1) {
    const unlinked = data.items.filter((item) => !item.eventId).length;
    if (unlinked) {
      warnings.push(
        `일정이 여러 개라 연결하지 못한 항목 ${unlinked}개가 있습니다. 미리보기에서 연결할 일정을 선택해 주세요.`,
      );
    }
  }

  return { ok: true, kind: 'text', data, warnings, error: null, today: todayKey(), parsedAt: wallDate(now) };
}
