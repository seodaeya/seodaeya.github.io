/**
 * Google Calendar OAuth + REST helpers for the static planner.
 *
 * The browser talks to Google directly: no server, no database, and no refresh
 * token stored anywhere. The access token lives in memory for the current tab
 * only, which is why a reload asks Google for a fresh (usually silent) token.
 *
 * Scope: calendar.app.created
 *   - create a secondary calendar owned by the user
 *   - manage only events in calendars this app created
 *   - the user's existing calendars stay unreadable
 */

import {
  addDays,
  buildEventDescription,
  dateKeyOf,
  todayKey,
  wallDateTime,
  wallToDate,
} from './planner-model.js';

export const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/calendar.app.created';
export const GOOGLE_CALENDAR_SUMMARY = '우리집 AI';
export const GOOGLE_TIMEZONE = 'Asia/Seoul';

/** 50% of Google's 1,000,000/day billing threshold, per browser. */
export const GOOGLE_DAILY_LIMIT = 500_000;
/** 50% of Google's 600/min per-user quota. */
export const GOOGLE_MINUTE_LIMIT = 300;

const API_BASE = 'https://www.googleapis.com/calendar/v3';
const GIS_SRC = 'https://accounts.google.com/gsi/client';
const USAGE_KEY = 'family-planner-google-usage-v1';
const TOKEN_TIMEOUT_MS = 120_000;

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export function isGoogleConfigured() {
  const id = String(GOOGLE_CLIENT_ID || '').trim();
  return Boolean(id) && !id.startsWith('YOUR_') && id.includes('.apps.googleusercontent.com');
}

export class GoogleApiError extends Error {
  constructor(message, { status = 0, code = '', detail = '' } = {}) {
    super(message);
    this.name = 'GoogleApiError';
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

// ------------------------------------------------------------------ identity

let gisPromise = null;
let tokenClient = null;
let token = null;
let pendingToken = null;
let tokenTimer = null;

function googleIdentity() {
  if (typeof window === 'undefined') return null;
  return window.google?.accounts?.oauth2 || null;
}

export function loadGoogleIdentity() {
  if (typeof window === 'undefined') {
    return Promise.reject(new GoogleApiError('브라우저에서만 구글 로그인을 사용할 수 있습니다.'));
  }
  if (googleIdentity()) return Promise.resolve(window.google);

  if (!gisPromise) {
    gisPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-planner-google-identity]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.google));
        existing.addEventListener('error', () => {
          gisPromise = null;
          reject(new GoogleApiError('Google 로그인 스크립트를 불러오지 못했습니다.'));
        });
        return;
      }
      const script = document.createElement('script');
      script.src = GIS_SRC;
      script.async = true;
      script.defer = true;
      script.dataset.plannerGoogleIdentity = 'true';
      script.onload = () => {
        if (window.google?.accounts?.oauth2) resolve(window.google);
        else {
          gisPromise = null;
          reject(new GoogleApiError('Google 로그인을 초기화하지 못했습니다.'));
        }
      };
      script.onerror = () => {
        gisPromise = null;
        reject(new GoogleApiError('Google 로그인 스크립트를 불러오지 못했습니다.'));
      };
      document.head.appendChild(script);
    });
  }
  return gisPromise;
}

function settleToken(error, value) {
  clearTimeout(tokenTimer);
  tokenTimer = null;
  const pending = pendingToken;
  pendingToken = null;
  if (!pending) return;
  if (error) pending.reject(error);
  else pending.resolve(value);
}

function handleTokenResponse(response) {
  if (response?.error) {
    settleToken(
      new GoogleApiError('구글 로그인이 취소되었거나 권한이 거부되었습니다.', {
        code: response.error,
        detail: response.error_description || '',
      }),
    );
    return;
  }
  if (!response?.access_token) {
    settleToken(new GoogleApiError('구글 접근 토큰을 받지 못했습니다.', { code: 'NO_TOKEN' }));
    return;
  }
  token = {
    accessToken: response.access_token,
    expiresAt: Date.now() + (Number(response.expires_in) || 3600) * 1000,
  };
  settleToken(null, token.accessToken);
}

function handleTokenError(error) {
  settleToken(
    new GoogleApiError(
      error?.message || '구글 로그인 창을 열지 못했습니다. 팝업 차단을 확인해 주세요.',
      { code: error?.type || 'POPUP_FAILED' },
    ),
  );
}

/**
 * Opens the Google consent/token popup. Must be called from a user gesture.
 * `prompt: ''` reuses an existing grant when possible.
 */
export async function requestGoogleToken({ prompt = '' } = {}) {
  if (!isGoogleConfigured()) {
    throw new GoogleApiError(
      'Google OAuth 클라이언트 ID가 설정되지 않았습니다. NEXT_PUBLIC_GOOGLE_CLIENT_ID를 설정해 주세요.',
      { code: 'NOT_CONFIGURED' },
    );
  }
  await loadGoogleIdentity();

  // Reuse the in-flight popup instead of replacing its resolver (which would
  // leave the first caller waiting forever).
  if (pendingToken) return pendingToken.promise;

  let resolvePromise;
  let rejectPromise;
  const promise = new Promise((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  pendingToken = { promise, resolve: resolvePromise, reject: rejectPromise };
  tokenTimer = setTimeout(() => {
    settleToken(
      new GoogleApiError('구글 로그인 응답이 없습니다. 팝업 차단을 확인한 뒤 다시 시도해 주세요.', {
        code: 'AUTH_TIMEOUT',
      }),
    );
  }, TOKEN_TIMEOUT_MS);

  try {
    if (!tokenClient) {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: GOOGLE_SCOPE,
        callback: handleTokenResponse,
        error_callback: handleTokenError,
      });
    }
    tokenClient.requestAccessToken({ prompt });
  } catch (error) {
    settleToken(
      new GoogleApiError(error?.message || '구글 로그인 창을 열지 못했습니다.', {
        code: 'AUTH_INIT_FAILED',
      }),
    );
  }

  return promise;
}

export function hasGoogleToken() {
  return Boolean(token && Date.now() < token.expiresAt - 60_000);
}

export function clearGoogleToken() {
  token = null;
  tokenClient = null;
  settleToken(new GoogleApiError('구글 로그인을 다시 시도해 주세요.', { code: 'AUTH_CLEARED' }));
}

/** Revokes the current token so it cannot be reused by this tab. */
export async function revokeGoogleToken() {
  const current = token?.accessToken;
  clearGoogleToken();
  const oauth = googleIdentity();
  if (!current || !oauth?.revoke) return;
  await new Promise((resolve) => {
    try {
      oauth.revoke(current, () => resolve());
    } catch {
      resolve();
    }
  });
}

async function getAccessToken() {
  if (hasGoogleToken()) return token.accessToken;
  try {
    return await requestGoogleToken({ prompt: '' });
  } catch (error) {
    throw new GoogleApiError(
      error?.message || '구글 로그인이 필요합니다. 구글 탭에서 연결해 주세요.',
      { status: 401, code: 'AUTH_REQUIRED' },
    );
  }
}

// ------------------------------------------------------------------- usage

function readUsage() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(USAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeUsage(value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(USAGE_KEY, JSON.stringify(value));
  } catch {
    // The guard is best-effort; a full storage must not block syncing.
  }
}

/**
 * Reserves one request against the browser-local 50% guard.
 * Google's real quota is project-wide; this is a per-browser safety net.
 */
export function consumeGoogleUsage() {
  const now = Date.now();
  const today = todayKey();
  const stored = readUsage();
  const sameDay = stored?.date === today;
  const count = sameDay ? Number(stored.count) || 0 : 0;
  const windowStart =
    sameDay && now - (Number(stored.windowStart) || 0) < 60_000 ? Number(stored.windowStart) : now;
  const windowCount =
    sameDay && windowStart === Number(stored?.windowStart) ? Number(stored.windowCount) || 0 : 0;

  if (count >= GOOGLE_DAILY_LIMIT) {
    throw new GoogleApiError(
      `오늘 구글 API 사용량이 안전 한도(50% · ${GOOGLE_DAILY_LIMIT.toLocaleString()}회)에 도달했습니다. 내일 다시 시도해 주세요.`,
      { code: 'USAGE_LIMIT' },
    );
  }
  if (windowCount >= GOOGLE_MINUTE_LIMIT) {
    throw new GoogleApiError('잠시 요청이 많았습니다. 1분 뒤 다시 시도해 주세요.', {
      code: 'RATE_GUARD',
    });
  }

  writeUsage({
    date: today,
    count: count + 1,
    windowStart,
    windowCount: windowCount + 1,
  });
}

export function getGoogleUsage() {
  const today = todayKey();
  const stored = readUsage();
  const sameDay = stored?.date === today;
  const count = sameDay ? Number(stored.count) || 0 : 0;
  const windowActive = sameDay && Date.now() - (Number(stored?.windowStart) || 0) < 60_000;
  return {
    date: today,
    count,
    limit: GOOGLE_DAILY_LIMIT,
    percent: (count / GOOGLE_DAILY_LIMIT) * 100,
    minuteCount: windowActive ? Number(stored.windowCount) || 0 : 0,
    minuteLimit: GOOGLE_MINUTE_LIMIT,
  };
}

/** Used by "delete everything" so the safety counter starts clean too. */
export function clearGoogleUsage() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(USAGE_KEY);
  } catch {
    // Best-effort only.
  }
}

// --------------------------------------------------------------------- REST

function parseApiError(status, body) {
  const message =
    body?.error?.message ||
    (status === 401
      ? '구글 로그인이 만료되었습니다. 다시 연결해 주세요.'
      : status === 403
        ? '구글 캘린더 권한이 없습니다. 연결을 해제하고 다시 동의해 주세요.'
        : status === 404
          ? '구글 캘린더 또는 일정을 찾지 못했습니다.'
          : status === 429
            ? '구글 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.'
            : '구글 캘린더 요청에 실패했습니다.');
  return new GoogleApiError(message, {
    status,
    code: body?.error?.status || body?.error?.code || `HTTP_${status}`,
    detail: body?.error?.message || '',
  });
}

async function apiFetch(path, options = {}, retry = true) {
  const accessToken = await getAccessToken();
  consumeGoogleUsage();

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (response.status === 401 && retry) {
    clearGoogleToken();
    return apiFetch(path, options, false);
  }

  if (response.status === 204) return null;

  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  if (!response.ok) throw parseApiError(response.status, body);
  return body;
}

export async function ensurePlannerCalendar(calendarId) {
  if (calendarId) {
    try {
      return await apiFetch(`/calendars/${encodeURIComponent(calendarId)}`);
    } catch (error) {
      if (error?.status !== 404) throw error;
    }
  }

  const created = await apiFetch('/calendars', {
    method: 'POST',
    body: JSON.stringify({
      summary: GOOGLE_CALENDAR_SUMMARY,
      timeZone: GOOGLE_TIMEZONE,
    }),
  });
  if (!created?.id) {
    throw new GoogleApiError('구글 캘린더를 만들지 못했습니다.', { code: 'NO_CALENDAR' });
  }
  return created;
}

// ---------------------------------------------------------------- event body

/**
 * Pure payload builder, exported so it can be tested without a browser.
 * All-day events use date-only fields (end is exclusive), timed events use
 * Asia/Seoul wall time and a one-hour default duration.
 */
export function buildGoogleEvent(event, items = [], { includeUid = true } = {}) {
  if (!event?.startsAt) {
    throw new GoogleApiError('날짜가 없는 일정은 구글 캘린더로 보낼 수 없습니다.', {
      code: 'NO_DATE',
    });
  }

  const payload = {
    summary: event.title,
    // Send empty strings as well so a PATCH clears a location/description the
    // user removed locally instead of silently keeping the old Google value.
    location: event.location || '',
    description: buildEventDescription(event, items) || '',
    extendedProperties: { private: { plannerEventId: event.id } },
  };

  if (event.allDay) {
    const startDate = dateKeyOf(event);
    if (!startDate) {
      throw new GoogleApiError('일정 날짜를 읽지 못했습니다.', { code: 'BAD_DATE' });
    }
    payload.start = { date: startDate };
    payload.end = { date: addDays(startDate, 1) };
  } else {
    const start = wallToDate(event.startsAt);
    if (!start) {
      throw new GoogleApiError('일정 시간을 읽지 못했습니다.', { code: 'BAD_DATE' });
    }
    let end = wallToDate(event.endsAt);
    if (!end || end <= start) end = new Date(start.getTime() + 60 * 60 * 1000);
    payload.start = { dateTime: `${wallDateTime(start)}:00`, timeZone: GOOGLE_TIMEZONE };
    payload.end = { dateTime: `${wallDateTime(end)}:00`, timeZone: GOOGLE_TIMEZONE };
  }

  if (includeUid) payload.iCalUID = `planner-${event.id}@seodaeya.github.io`;
  return payload;
}

export async function insertGoogleEvent(calendarId, event, items = []) {
  return apiFetch(`/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    body: JSON.stringify(buildGoogleEvent(event, items, { includeUid: true })),
  });
}

export async function updateGoogleEvent(calendarId, googleEventId, event, items = []) {
  return apiFetch(
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(buildGoogleEvent(event, items, { includeUid: false })),
    },
  );
}

export async function deleteGoogleEvent(calendarId, googleEventId) {
  return apiFetch(
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`,
    { method: 'DELETE' },
  );
}
