import { PLANNER_META_KEY, PLANNER_STORAGE_KEY, PLANNER_VERSION, normalizeData } from './planner-model.js';

/** localStorage access lives here so the page and the pure helpers stay testable. */

const emptyState = () => ({ events: [], items: [], meta: { lastSavedAt: null, lastExportAt: null } });

export function loadPlanner() {
  if (typeof window === 'undefined') return emptyState();
  try {
    const raw = window.localStorage.getItem(PLANNER_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const data = parsed ? normalizeData(parsed) : { events: [], items: [] };
    let meta = parsed && parsed.meta && typeof parsed.meta === 'object' ? parsed.meta : {};
    try {
      const metaRaw = window.localStorage.getItem(PLANNER_META_KEY);
      if (metaRaw) meta = { ...meta, ...JSON.parse(metaRaw) };
    } catch {
      // A broken meta value must not hide the actual planner data.
    }
    return { ...data, meta };
  } catch {
    return emptyState();
  }
}

export function savePlanner(data) {
  if (typeof window === 'undefined') return { ok: false, error: '브라우저에서만 저장할 수 있습니다.' };
  try {
    const payload = {
      version: PLANNER_VERSION,
      savedAt: new Date().toISOString(),
      events: data.events || [],
      items: data.items || [],
    };
    const text = JSON.stringify(payload);
    window.localStorage.setItem(PLANNER_STORAGE_KEY, text);
    // Keep the whole meta object: it also holds the optional Google Calendar
    // connection (calendarId) that must survive reloads. Tokens never live here.
    const meta = {
      ...(data.meta || {}),
      lastSavedAt: Date.now(),
      lastExportAt: data.meta?.lastExportAt || null,
    };
    window.localStorage.setItem(PLANNER_META_KEY, JSON.stringify(meta));
    return { ok: true, bytes: byteLength(text) };
  } catch (error) {
    return {
      ok: false,
      error:
        error && error.name === 'QuotaExceededError'
          ? '브라우저 저장 공간이 가득 찼습니다. JSON으로 내보낸 뒤 오래된 항목을 정리해 주세요.'
          : '브라우저에 저장하지 못했습니다. 시크릿 모드인지 확인해 주세요.',
    };
  }
}

export function markExported(data) {
  const meta = { ...(data.meta || {}), lastExportAt: Date.now() };
  try {
    window.localStorage.setItem(
      PLANNER_META_KEY,
      JSON.stringify({ ...meta, lastSavedAt: meta.lastSavedAt || Date.now() }),
    );
  } catch {
    // exporting still succeeded even if the timestamp cannot be stored
  }
  return meta;
}

export function clearPlanner() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(PLANNER_STORAGE_KEY);
    window.localStorage.removeItem(PLANNER_META_KEY);
  } catch {
    // nothing else to do
  }
}

export function byteLength(text) {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(String(text)).length;
  return String(text).length;
}

export function formatBytes(bytes) {
  if (!bytes) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
