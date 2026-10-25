import { useEffect, useMemo, useRef, useState } from 'react';
import SEO from '@/components/SEO';
import {
  GEMINI_PROMPT,
  LIST_TYPES,
  addDays,
  buildExport,
  buildIcs,
  createId,
  dateKeyOf,
  formatDateLabel,
  googleCalendarUrl,
  googleSyncState,
  mergeData,
  normalizeData,
  normalizeEvent,
  normalizeItem,
  relativeDayLabel,
  sortEvents,
  sortItems,
  timeLabelOf,
  todayKey,
} from '@/lib/planner-model';
import {
  clearGoogleUsage,
  deleteGoogleEvent,
  ensurePlannerCalendar,
  getGoogleUsage,
  hasGoogleToken,
  insertGoogleEvent,
  isGoogleConfigured,
  loadGoogleIdentity,
  requestGoogleToken,
  revokeGoogleToken,
  updateGoogleEvent,
} from '@/lib/planner-google';
import { parsePlannerInput } from '@/lib/planner-parse';
import {
  byteLength,
  clearPlanner,
  formatBytes,
  loadPlanner,
  markExported,
  savePlanner,
} from '@/lib/planner-storage';
import styles from '@/styles/planner.module.css';

const TABS = [
  { key: 'home', label: '오늘' },
  { key: 'events', label: '일정' },
  { key: 'items', label: '할 일·준비물' },
  { key: 'import', label: '가져오기' },
  { key: 'google', label: '구글' },
  { key: 'backup', label: '백업' },
];

const GOOGLE_SYNC_MAX = 1000;

const TYPE_LABEL = Object.fromEntries(LIST_TYPES.map((type) => [type.value, type.label]));

function emptyEventDraft(date) {
  return {
    id: null,
    title: '',
    date: date || todayKey(),
    time: '',
    location: '',
    memo: '',
    linkedItemIds: [],
  };
}

function emptyItemDraft() {
  return { id: null, title: '', listType: 'todo', qty: '', dueAt: '', eventId: '' };
}

function eventOptionLabel(event) {
  const day = event.startsAt ? relativeDayLabel(dateKeyOf(event)) : '날짜 미정';
  const time = event.startsAt && !event.allDay ? ` ${timeLabelOf(event)}` : '';
  return `${day}${time} · ${event.title}`;
}

function eventWhenLabel(event) {
  const day = event.startsAt ? relativeDayLabel(dateKeyOf(event)) : '날짜 미정';
  if (!event.startsAt) return day;
  return event.allDay ? `${day} · 종일` : `${day} ${timeLabelOf(event)}`;
}

function CustomEventSelect({
  value,
  onChange,
  events = [],
  placeholder = '연결 안 함 (독립 할 일 · 준비물)',
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function onPointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('pointerdown', onPointerDown);
      document.addEventListener('keydown', onKeyDown);
      return () => {
        document.removeEventListener('pointerdown', onPointerDown);
        document.removeEventListener('keydown', onKeyDown);
      };
    }
  }, [open]);

  const selectedEvent = events.find((e) => e.id === value);
  const displayLabel = selectedEvent ? eventOptionLabel(selectedEvent) : placeholder;

  return (
    <div className={styles.customSelectWrap} ref={containerRef}>
      <button
        type="button"
        className={`${styles.customSelectTrigger} ${open ? styles.customSelectTriggerOpen : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={styles.customSelectText}>{displayLabel}</span>
        <svg
          className={`${styles.customSelectArrow} ${open ? styles.customSelectArrowOpen : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open ? (
        <ul className={styles.customSelectList} role="listbox">
          <li
            role="option"
            aria-selected={!value}
            className={`${styles.customSelectOption} ${!value ? styles.customSelectOptionActive : ''}`}
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
          >
            <span className={styles.customSelectCheck}>{!value ? '✓' : ''}</span>
            <span className={styles.customSelectOptionLabel}>{placeholder}</span>
          </li>
          {events.map((event) => {
            const isSelected = event.id === value;
            return (
              <li
                key={event.id}
                role="option"
                aria-selected={isSelected}
                className={`${styles.customSelectOption} ${isSelected ? styles.customSelectOptionActive : ''}`}
                onClick={() => {
                  onChange(event.id);
                  setOpen(false);
                }}
              >
                <span className={styles.customSelectCheck}>{isSelected ? '✓' : ''}</span>
                <span className={styles.customSelectOptionLabel}>{eventOptionLabel(event)}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function CustomItemPicker({
  items = [],
  onSelect,
  placeholder = '+ 기존 항목 연결',
  eventTitleById,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function onPointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('pointerdown', onPointerDown);
      document.addEventListener('keydown', onKeyDown);
      return () => {
        document.removeEventListener('pointerdown', onPointerDown);
        document.removeEventListener('keydown', onKeyDown);
      };
    }
  }, [open]);

  if (!items.length) return null;

  return (
    <div className={styles.itemPickerWrap} ref={containerRef}>
      <button
        type="button"
        className={`${styles.linkPickerButton} ${open ? styles.linkPickerButtonActive : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>
          {placeholder} ({items.length})
        </span>
        <svg
          className={`${styles.linkPickerArrow} ${open ? styles.linkPickerArrowOpen : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open ? (
        <ul className={styles.itemPickerMenu} role="listbox">
          {items.map((item) => {
            const otherTitle =
              item.eventId && eventTitleById ? eventTitleById.get(item.eventId) : null;
            return (
              <li
                key={item.id}
                role="option"
                className={styles.itemPickerOption}
                onClick={() => {
                  onSelect(item.id);
                  setOpen(false);
                }}
              >
                <span className={styles.linkedType}>
                  {TYPE_LABEL[item.listType] || '할 일'}
                </span>
                <span className={styles.itemPickerTitle}>
                  {item.title}
                  {item.qty ? ` (${item.qty})` : ''}
                </span>
                {otherTitle ? (
                  <span className={styles.itemPickerOther}>· 현재: {otherTitle}</span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function CustomEventPicker({
  events = [],
  onSelect,
  placeholder = '+ 일정 연결',
  compact = false,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function onPointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('pointerdown', onPointerDown);
      document.addEventListener('keydown', onKeyDown);
      return () => {
        document.removeEventListener('pointerdown', onPointerDown);
        document.removeEventListener('keydown', onKeyDown);
      };
    }
  }, [open]);

  if (!events.length) return null;

  return (
    <div className={styles.itemPickerWrap} ref={containerRef}>
      <button
        type="button"
        className={`${compact ? styles.quickLinkButton : styles.linkPickerButton} ${
          open ? styles.linkPickerButtonActive : ''
        }`}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{placeholder}</span>
        <svg
          className={`${styles.linkPickerArrow} ${open ? styles.linkPickerArrowOpen : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open ? (
        <ul className={styles.itemPickerMenu} role="listbox">
          {events.map((event) => (
            <li
              key={event.id}
              role="option"
              className={styles.itemPickerOption}
              onClick={() => {
                onSelect(event.id);
                setOpen(false);
              }}
            >
              <span className={styles.itemPickerTitle}>{eventOptionLabel(event)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function downloadFile(filename, text, mime) {
  const blob = new Blob([text], { type: mime || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatPercent(value) {
  if (!value) return '0';
  if (value < 0.1) return '<0.1';
  return value.toFixed(1);
}

function googleStateLabel(state) {
  if (state === 'synced') return '전송됨';
  if (state === 'changed') return '변경됨';
  return '미전송';
}

function googleErrorMessage(error) {
  return error?.message || '구글 캘린더 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.';
}

function toPreview(result) {
  return {
    kind: result.kind,
    warnings: result.warnings || [],
    events: (result.data.events || []).map((event) => ({
      key: event.id,
      selected: true,
      title: event.title,
      date: dateKeyOf(event) || '',
      time: timeLabelOf(event),
      location: event.location || '',
      memo: event.memo || '',
    })),
    items: (result.data.items || []).map((item) => ({
      selected: true,
      title: item.title,
      listType: item.listType,
      qty: item.qty || '',
      dueAt: item.dueAt || '',
      eventKey: item.eventId || '',
    })),
  };
}

export default function Planner() {
  const [tab, setTab] = useState('home');
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState({ events: [], items: [], meta: {} });
  const [saveError, setSaveError] = useState(null);
  const [toast, setToast] = useState(null);
  const [eventDraft, setEventDraft] = useState(() => emptyEventDraft());
  const [itemDraft, setItemDraft] = useState(() => emptyItemDraft());
  const [showPast, setShowPast] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [paste, setPaste] = useState('');
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [previewMode, setPreviewMode] = useState('merge');
  const [pendingImport, setPendingImport] = useState(null);
  const [eventQuickItem, setEventQuickItem] = useState({
    listType: 'supply',
    title: '',
    qty: '',
    dueAt: '',
  });
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleAuthed, setGoogleAuthed] = useState(false);
  const [googleError, setGoogleError] = useState(null);
  const [googleUsage, setGoogleUsage] = useState(() => getGoogleUsage());
  const [googleSync, setGoogleSync] = useState({
    running: false,
    total: 0,
    done: 0,
    failed: 0,
  });
  const toastTimer = useRef(null);
  const eventFormRef = useRef(null);
  const itemFormRef = useRef(null);
  const fileRef = useRef(null);
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    setData(loadPlanner());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return undefined;
    const timer = setTimeout(() => {
      const result = savePlanner(data);
      setSaveError(result.ok ? null : result.error);
    }, 250);
    return () => clearTimeout(timer);
  }, [data, mounted]);

  // The debounce above can lose the last edit if the tab closes immediately.
  // Flush once more when the page is being hidden or unloaded.
  useEffect(() => {
    if (!mounted) return undefined;
    const flush = () => savePlanner(dataRef.current);
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [mounted]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  useEffect(() => {
    if (!mounted) return;
    setGoogleUsage(getGoogleUsage());
  }, [mounted, tab]);

  // Load Google Identity Services only when the user opens the Google tab.
  // This keeps a third-party script off the page for everyone who never uses it.
  useEffect(() => {
    if (!mounted || tab !== 'google' || !isGoogleConfigured()) return;
    loadGoogleIdentity().catch(() => {
      // The connect button shows a friendly error if loading really failed.
    });
  }, [mounted, tab]);

  useEffect(() => {
    if (!googleAuthed) return undefined;
    const timer = setInterval(() => {
      if (!hasGoogleToken()) setGoogleAuthed(false);
    }, 30_000);
    return () => clearInterval(timer);
  }, [googleAuthed]);

  const notify = (message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  };

  const copyText = async (text, message) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(message || '복사했습니다.');
    } catch {
      try {
        const area = document.createElement('textarea');
        area.value = text;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        area.remove();
        notify(message || '복사했습니다.');
      } catch {
        notify('복사하지 못했습니다. 직접 선택해 주세요.');
      }
    }
  };

  const today = todayKey();
  const sortedEvents = useMemo(() => sortEvents(data.events), [data.events]);
  const sortedItems = useMemo(() => sortItems(data.items), [data.items]);
  const eventTitleById = useMemo(
    () => new Map(data.events.map((event) => [event.id, event.title])),
    [data.events],
  );
  const itemsByEvent = useMemo(() => {
    const map = new Map();
    for (const item of sortedItems) {
      if (!item.eventId) continue;
      if (!map.has(item.eventId)) map.set(item.eventId, []);
      map.get(item.eventId).push(item);
    }
    return map;
  }, [sortedItems]);
  const linkedItemCount = data.items.filter((item) => item.eventId).length;

  const todayEvents = today ? sortedEvents.filter((event) => dateKeyOf(event) === today) : [];
  const upcomingEvents = today
    ? sortedEvents.filter((event) => {
        const key = dateKeyOf(event);
        return key && key > today && key <= addDays(today, 21);
      })
    : [];
  const pastEvents = today
    ? sortedEvents.filter((event) => {
        const key = dateKeyOf(event);
        return key && key < today;
      })
    : [];
  const undatedEvents = sortedEvents.filter((event) => !event.startsAt);
  const openItems = sortedItems.filter((item) => !item.done);
  const storageBytes = mounted ? byteLength(JSON.stringify({ events: data.events, items: data.items })) : 0;
  const daysSinceExport = data.meta?.lastExportAt
    ? Math.floor((Date.now() - data.meta.lastExportAt) / 86400000)
    : null;
  const backupDue = data.events.length + data.items.length > 0 && (daysSinceExport === null || daysSinceExport >= 7);

  const googleEnabled = isGoogleConfigured();
  const googleConnection = data.meta?.google || null;
  const googleCalendarId = googleConnection?.calendarId || null;
  const googleSession = googleAuthed && hasGoogleToken();
  const googleDatedEvents = sortedEvents.filter((event) => event.startsAt);
  const googleStateFor = (event) =>
    googleSyncState(event, itemsByEvent.get(event.id) || []);
  const googleSyncedCount = googleDatedEvents.filter(
    (event) => googleStateFor(event) === 'synced',
  ).length;
  const googleChangedCount = googleDatedEvents.filter(
    (event) => googleStateFor(event) === 'changed',
  ).length;
  const googleStatusText = !googleCalendarId
    ? '연결 안 됨'
    : googleSession
      ? '이번 세션 연결됨'
      : '로그인 필요';
  const googleStatusClass = !googleCalendarId
    ? styles.googleStatusOff
    : googleSession
      ? styles.googleStatusOn
      : styles.googleStatusWarn;
  const googleProgressPercent = googleSync.total
    ? Math.round(((googleSync.done + googleSync.failed) / googleSync.total) * 100)
    : 0;

  const saveEventDraft = (event) => {
    event.preventDefault();
    const title = eventDraft.title.trim();
    if (!title) {
      notify('일정 제목을 입력해 주세요.');
      return;
    }
    const startsAt = eventDraft.date
      ? eventDraft.time
        ? `${eventDraft.date}T${eventDraft.time}`
        : eventDraft.date
      : null;
    const stamp = Date.now();
    const existing = eventDraft.id
      ? data.events.find((event) => event.id === eventDraft.id)
      : null;
    const row = normalizeEvent({
      id: eventDraft.id || createId(),
      title,
      startsAt,
      allDay: eventDraft.time ? 0 : 1,
      location: eventDraft.location,
      memo: eventDraft.memo,
      // Editing a synced event must keep its Google mapping. The new
      // updatedAt makes the badge switch to "변경됨" until the next send.
      googleEventId: existing?.googleEventId || null,
      googleSyncedAt: existing?.googleSyncedAt || null,
      updatedAt: stamp,
    });
    if (!row) return;
    const pendingIds = new Set(!eventDraft.id && Array.isArray(eventDraft.linkedItemIds) ? eventDraft.linkedItemIds : []);
    setData((prev) => {
      const exists = prev.events.some((item) => item.id === row.id);
      return {
        ...prev,
        events: exists ? prev.events.map((item) => (item.id === row.id ? row : item)) : [...prev.events, row],
        items: pendingIds.size
          ? prev.items.map((item) =>
              pendingIds.has(item.id) ? { ...item, eventId: row.id, updatedAt: stamp } : item,
            )
          : prev.items,
      };
    });
    setEventDraft(emptyEventDraft(eventDraft.date));
    notify(eventDraft.id ? '일정을 수정했습니다.' : '일정을 추가했습니다.');
  };

  const editEvent = (event) => {
    const dayKey = dateKeyOf(event) || todayKey();
    setEventDraft({
      id: event.id,
      title: event.title,
      date: dayKey,
      time: timeLabelOf(event),
      location: event.location || '',
      memo: event.memo || '',
      linkedItemIds: [],
    });
    setEventQuickItem((prev) => ({ ...prev, dueAt: dateKeyOf(event) || '' }));
    setTab('events');
    setTimeout(() => {
      eventFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      eventFormRef.current?.querySelector('input')?.focus();
    }, 40);
  };

  const jumpToEvent = (eventId) => {
    const target = data.events.find((event) => event.id === eventId);
    if (!target) {
      notify('연결된 일정을 찾을 수 없습니다.');
      return;
    }
    editEvent(target);
  };

  const linkItemToEvent = (itemId, nextEventId) => {
    const normalizedEventId = nextEventId || null;
    const targetItem = data.items.find((item) => item.id === itemId);
    if (!targetItem) return;
    const targetEvent = normalizedEventId
      ? data.events.find((event) => event.id === normalizedEventId)
      : null;
    const stamp = Date.now();
    const touchedEventIds = new Set(
      [targetItem.eventId, normalizedEventId].filter(Boolean),
    );
    setData((prev) => ({
      ...prev,
      events: prev.events.map((event) =>
        touchedEventIds.has(event.id) ? { ...event, updatedAt: stamp } : event,
      ),
      items: prev.items.map((row) =>
        row.id === itemId ? { ...row, eventId: normalizedEventId, updatedAt: stamp } : row,
      ),
    }));
    if (itemDraft.id === itemId) {
      setItemDraft((prev) => ({ ...prev, eventId: normalizedEventId || '' }));
    }
    notify(
      targetEvent
        ? `"${targetItem.title}" 항목을 "${targetEvent.title}" 일정에 연결했습니다.`
        : `"${targetItem.title}" 항목의 일정 연결을 해제했습니다.`,
    );
  };

  const linkItemInEventDraft = (itemId) => {
    if (!itemId) return;
    if (eventDraft.id) {
      linkItemToEvent(itemId, eventDraft.id);
      return;
    }
    setEventDraft((prev) => {
      const current = Array.isArray(prev.linkedItemIds) ? prev.linkedItemIds : [];
      if (current.includes(itemId)) return prev;
      return { ...prev, linkedItemIds: [...current, itemId] };
    });
    const targetItem = data.items.find((item) => item.id === itemId);
    if (targetItem) {
      notify(`"${targetItem.title}" 항목을 새 일정 저장 시 연결합니다.`);
    }
  };

  const unlinkItemInEventDraft = (item) => {
    if (!item) return;
    if (eventDraft.id) {
      linkItemToEvent(item.id, null);
      return;
    }
    setEventDraft((prev) => ({
      ...prev,
      linkedItemIds: (prev.linkedItemIds || []).filter((id) => id !== item.id),
    }));
    notify(`"${item.title}" 항목의 연결 선택을 해제했습니다.`);
  };

  const quickAddItemForEvent = (targetEventId, draftFields) => {
    const title = (draftFields.title || '').trim();
    if (!title) {
      notify('추가할 준비물·할 일 이름을 입력해 주세요.');
      return false;
    }
    const row = normalizeItem({
      id: createId(),
      title,
      listType: draftFields.listType || 'supply',
      qty: draftFields.qty || '',
      dueAt: draftFields.dueAt || null,
      done: 0,
      eventId: targetEventId || null,
      updatedAt: Date.now(),
    });
    if (!row) return false;
    setData((prev) => ({
      ...prev,
      items: [...prev.items, row],
    }));
    if (!targetEventId) {
      setEventDraft((prev) => ({
        ...prev,
        linkedItemIds: [...(prev.linkedItemIds || []), row.id],
      }));
      notify(`"${row.title}" 항목을 추가했습니다. 일정 저장 시 함께 연결됩니다.`);
    } else {
      notify(`"${row.title}" 항목을 추가하고 일정에 연결했습니다.`);
    }
    return true;
  };

  const deleteEvent = async (event) => {
    const linked = data.items.filter((item) => item.eventId === event.id).length;
    const googleLinked = Boolean(event.googleEventId && googleCalendarId);
    const message = [
      `"${event.title}" 일정을 삭제할까요?`,
      linked ? `연결된 준비물·할 일 ${linked}개는 삭제되지 않고 연결만 해제됩니다.` : '',
      googleLinked && !hasGoogleToken()
        ? '구글에 보낸 일정은 이번 세션에 로그인하지 않아 구글 캘린더에 그대로 남습니다.'
        : '',
    ]
      .filter(Boolean)
      .join('\n');
    if (!window.confirm(message)) return;

    let remoteDeleted = false;
    let remoteWarning = null;
    if (googleLinked && hasGoogleToken()) {
      const deleteRemote = window.confirm(
        '구글 캘린더에 보낸 일정도 함께 삭제할까요?\n\n취소를 누르면 플래너에서만 삭제하고 구글 일정은 유지합니다.',
      );
      if (deleteRemote) {
        try {
          await deleteGoogleEvent(googleCalendarId, event.googleEventId);
          remoteDeleted = true;
        } catch (error) {
          // 404 means the Google event is already gone, which is the desired end state.
          if (error?.status === 404) remoteDeleted = true;
          else remoteWarning = googleErrorMessage(error);
        }
        setGoogleUsage(getGoogleUsage());
      }
    }

    setData((prev) => ({
      ...prev,
      events: prev.events.filter((item) => item.id !== event.id),
      items: prev.items.map((item) =>
        item.eventId === event.id ? { ...item, eventId: null, updatedAt: Date.now() } : item,
      ),
    }));
    if (eventDraft.id === event.id) setEventDraft(emptyEventDraft());

    if (remoteWarning) {
      notify(`플래너에서는 삭제했습니다. 구글 일정 삭제는 실패했습니다: ${remoteWarning}`);
    } else if (remoteDeleted) {
      notify(
        linked
          ? `일정을 삭제하고 구글 캘린더에서도 지웠으며, 항목 ${linked}개의 연결을 해제했습니다.`
          : '일정을 플래너와 구글 캘린더에서 삭제했습니다.',
      );
    } else {
      notify(
        linked ? `일정을 삭제하고 항목 ${linked}개의 연결을 해제했습니다.` : '일정을 삭제했습니다.',
      );
    }
  };

  const saveItemDraft = (event) => {
    event.preventDefault();
    const title = itemDraft.title.trim();
    if (!title) {
      notify('할 일 제목을 입력해 주세요.');
      return;
    }
    const existing = data.items.find((item) => item.id === itemDraft.id);
    const stamp = Date.now();
    const row = normalizeItem({
      id: itemDraft.id || createId(),
      title,
      listType: itemDraft.listType,
      qty: itemDraft.qty,
      dueAt: itemDraft.dueAt || null,
      done: existing ? existing.done : 0,
      eventId: itemDraft.eventId || null,
      updatedAt: stamp,
    });
    if (!row) return;
    const touchedEventIds = new Set(
      [existing?.eventId, row.eventId].filter(Boolean),
    );
    setData((prev) => {
      const exists = prev.items.some((item) => item.id === row.id);
      return {
        ...prev,
        events: prev.events.map((event) =>
          touchedEventIds.has(event.id) ? { ...event, updatedAt: stamp } : event,
        ),
        items: exists ? prev.items.map((item) => (item.id === row.id ? row : item)) : [...prev.items, row],
      };
    });
    setItemDraft(emptyItemDraft());
    notify(itemDraft.id ? '할 일을 수정했습니다.' : '할 일을 추가했습니다.');
  };

  const editItem = (item) => {
    setItemDraft({
      id: item.id,
      title: item.title,
      listType: item.listType,
      qty: item.qty || '',
      dueAt: item.dueAt || '',
      eventId: item.eventId || '',
    });
    setTab('items');
    setTimeout(() => {
      itemFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      itemFormRef.current?.querySelector('input')?.focus();
    }, 40);
  };

  const toggleItem = (item) => {
    const stamp = Date.now();
    setData((prev) => ({
      ...prev,
      events: item.eventId
        ? prev.events.map((event) =>
            event.id === item.eventId ? { ...event, updatedAt: stamp } : event,
          )
        : prev.events,
      items: prev.items.map((row) =>
        row.id === item.id ? { ...row, done: row.done ? 0 : 1, updatedAt: stamp } : row,
      ),
    }));
  };

  const deleteItem = (item) => {
    if (!window.confirm(`"${item.title}" 항목을 삭제할까요?`)) return;
    const stamp = Date.now();
    setData((prev) => ({
      ...prev,
      events: item.eventId
        ? prev.events.map((event) =>
            event.id === item.eventId ? { ...event, updatedAt: stamp } : event,
          )
        : prev.events,
      items: prev.items.filter((row) => row.id !== item.id),
    }));
    if (itemDraft.id === item.id) setItemDraft(emptyItemDraft());
    notify('삭제했습니다.');
  };

  const parsePaste = () => {
    const result = parsePlannerInput(paste);
    if (!result.ok) {
      setPreview(null);
      setPreviewError(result.error || '내용을 읽지 못했습니다.');
      return;
    }
    setPreviewError(null);
    setPreview(toPreview(result));
  };

  const updatePreviewEvent = (index, patch) => {
    setPreview((prev) => ({
      ...prev,
      events: prev.events.map((row, idx) => (idx === index ? { ...row, ...patch } : row)),
    }));
  };

  const updatePreviewItem = (index, patch) => {
    setPreview((prev) => ({
      ...prev,
      items: prev.items.map((row, idx) => (idx === index ? { ...row, ...patch } : row)),
    }));
  };

  const savePreview = () => {
    const selectedEvents = preview.events.filter((row) => row.selected && row.title.trim());
    const selectedItems = preview.items.filter((row) => row.selected && row.title.trim());
    if (!selectedEvents.length && !selectedItems.length) {
      notify('저장할 항목을 선택해 주세요.');
      return;
    }
    if (
      previewMode === 'replace' &&
      !window.confirm('기존 일정과 할 일을 모두 지우고 이번 내용으로 바꿀까요? 되돌릴 수 없습니다.')
    ) {
      return;
    }
    const stamp = Date.now();
    const eventIdMap = new Map();
    const events = selectedEvents
      .map((row) => {
        const id = createId();
        if (row.key) eventIdMap.set(row.key, id);
        return normalizeEvent({
          id,
          title: row.title,
          startsAt: row.date ? (row.time ? `${row.date}T${row.time}` : row.date) : null,
          allDay: row.time ? 0 : 1,
          location: row.location,
          memo: row.memo,
          updatedAt: stamp,
        });
      })
      .filter(Boolean);
    const items = selectedItems
      .map((row) =>
        normalizeItem({
          id: createId(),
          title: row.title,
          listType: row.listType,
          qty: row.qty,
          dueAt: row.dueAt || null,
          done: 0,
          eventId: eventIdMap.get(row.eventKey) || null,
          updatedAt: stamp,
        }),
      )
      .filter(Boolean);
    const linkedCount = items.filter((item) => item.eventId).length;

    setData((prev) => {
      const next =
        previewMode === 'replace'
          ? normalizeData({ events, items })
          : mergeData(prev, { events, items });
      // Importing content must not disconnect the Google calendar.
      return { ...next, meta: prev.meta };
    });
    setPaste('');
    setPreview(null);
    setPreviewMode('merge');
    setTab('home');
    notify(
      `일정 ${events.length}개 · 할 일 ${items.length}개를 저장했습니다.${
        linkedCount ? ` (연결 ${linkedCount}개)` : ''
      }`,
    );
  };

  const exportJson = () => {
    const text = buildExport(data);
    downloadFile(`family-planner-${todayKey()}.json`, text, 'application/json;charset=utf-8');
    setData((prev) => ({ ...prev, meta: markExported(prev) }));
    notify('JSON 파일을 내려받았습니다.');
  };

  const exportIcs = () => {
    const events = data.events.filter((event) => event.startsAt);
    if (!events.length) {
      notify('내보낼 일정이 없습니다.');
      return;
    }
    downloadFile(
      `family-planner-${todayKey()}.ics`,
      buildIcs(events, data.items),
      'text/calendar;charset=utf-8',
    );
    notify('캘린더 파일(.ics)을 내려받았습니다.');
  };

  const googleItemsFor = (event) => data.items.filter((item) => item.eventId === event.id);

  const rememberGoogleCalendar = (calendar) => {
    const stamp = Date.now();
    setData((prev) => {
      const previous = prev.meta?.google || {};
      return {
        ...prev,
        meta: {
          ...prev.meta,
          google: {
            ...previous,
            calendarId: calendar.id,
            calendarSummary: calendar.summary || previous.calendarSummary || '우리집 AI',
            timeZone: calendar.timeZone || previous.timeZone || 'Asia/Seoul',
            connectedAt: previous.connectedAt || stamp,
            lastConnectedAt: stamp,
          },
        },
      };
    });
  };

  const connectGoogle = async () => {
    if (googleBusy) return;
    if (!googleEnabled) {
      setGoogleError(
        'Google OAuth 클라이언트 ID가 설정되지 않았습니다. NEXT_PUBLIC_GOOGLE_CLIENT_ID를 설정하고 다시 배포해 주세요.',
      );
      return;
    }
    setGoogleBusy(true);
    setGoogleError(null);
    try {
      await requestGoogleToken({ prompt: '' });
      setGoogleAuthed(true);
      const calendar = await ensurePlannerCalendar(googleCalendarId || null);
      rememberGoogleCalendar(calendar);
      setGoogleUsage(getGoogleUsage());
      notify(
        googleCalendarId
          ? '이번 세션에 구글 캘린더를 다시 연결했습니다.'
          : `앱 전용 캘린더 "${calendar.summary || '우리집 AI'}"를 만들고 연결했습니다.`,
      );
    } catch (error) {
      setGoogleError(googleErrorMessage(error));
      setGoogleAuthed(hasGoogleToken());
      setGoogleUsage(getGoogleUsage());
    } finally {
      setGoogleBusy(false);
    }
  };

  const disconnectGoogle = async () => {
    if (
      !window.confirm(
        '구글 연결을 해제할까요?\n\n이 브라우저의 로그인 토큰만 지웁니다. 플래너 데이터와 구글 캘린더에 이미 보낸 일정은 그대로 유지됩니다.',
      )
    ) {
      return;
    }
    await revokeGoogleToken();
    setGoogleAuthed(false);
    setGoogleError(null);
    setGoogleUsage(getGoogleUsage());
    notify('구글 연결을 해제했습니다. 구글 캘린더의 일정은 유지됩니다.');
  };

  const pushEventToGoogle = async (event, calendarIdOverride) => {
    let googleEventId = event.googleEventId || null;
    let activeCalendarId = calendarIdOverride || googleCalendarId;
    let created = false;
    const items = googleItemsFor(event);

    const insertWithRecovery = async () => {
      try {
        return await insertGoogleEvent(activeCalendarId, event, items);
      } catch (error) {
        // A 404 on insert usually means the app-created calendar was deleted in
        // Google Calendar. Create a fresh one once and retry.
        if (error?.status !== 404) throw error;
        const calendar = await ensurePlannerCalendar(null);
        activeCalendarId = calendar.id;
        rememberGoogleCalendar(calendar);
        return insertGoogleEvent(activeCalendarId, event, items);
      }
    };

    if (googleEventId) {
      try {
        await updateGoogleEvent(activeCalendarId, googleEventId, event, items);
      } catch (error) {
        // The Google copy may have been deleted by hand. Re-create it instead
        // of leaving the local event permanently stuck on a 404.
        if (error?.status !== 404) throw error;
        const inserted = await insertWithRecovery();
        googleEventId = inserted.id;
        created = true;
      }
    } else {
      const inserted = await insertWithRecovery();
      googleEventId = inserted.id;
      created = true;
    }

    return { googleEventId, created, calendarId: activeCalendarId };
  };

  const saveGoogleSyncResult = (eventId, googleEventId) => {
    const syncedAt = Date.now();
    setData((prev) => ({
      ...prev,
      meta: {
        ...prev.meta,
        google: { ...(prev.meta?.google || {}), lastSyncAt: syncedAt },
      },
      events: prev.events.map((row) =>
        row.id === eventId
          ? { ...row, googleEventId, googleSyncedAt: syncedAt }
          : row,
      ),
    }));
  };

  const syncEventToGoogle = async (event) => {
    if (!googleEnabled) return false;
    if (!googleCalendarId) {
      setTab('google');
      notify('구글 탭에서 구글 캘린더를 먼저 연결해 주세요.');
      return false;
    }
    if (!hasGoogleToken()) {
      setTab('google');
      notify('구글 탭에서 이번 세션 로그인을 먼저 해 주세요.');
      return false;
    }
    setGoogleError(null);
    try {
      const { googleEventId, created } = await pushEventToGoogle(event);
      saveGoogleSyncResult(event.id, googleEventId);
      setGoogleAuthed(true);
      setGoogleUsage(getGoogleUsage());
      notify(
        created
          ? `"${event.title}" 일정을 구글 캘린더에 보냈습니다.`
          : `"${event.title}" 일정을 구글 캘린더에 반영했습니다.`,
      );
      return true;
    } catch (error) {
      setGoogleError(googleErrorMessage(error));
      setGoogleAuthed(hasGoogleToken());
      setGoogleUsage(getGoogleUsage());
      notify(googleErrorMessage(error));
      return false;
    }
  };

  const syncAllGoogle = async () => {
    if (googleBusy || googleSync.running) return;
    if (!googleEnabled) {
      setGoogleError('Google OAuth 클라이언트 ID가 설정되지 않았습니다.');
      return;
    }
    if (!googleCalendarId) {
      notify('구글 탭에서 구글 캘린더를 먼저 연결해 주세요.');
      return;
    }
    if (!hasGoogleToken()) {
      notify('구글 로그인이 필요합니다. 위의 연결 버튼을 눌러 주세요.');
      return;
    }
    const candidates = googleDatedEvents;
    if (!candidates.length) {
      notify('구글에 보낼 날짜가 있는 일정이 없습니다.');
      return;
    }
    const targets = candidates.slice(0, GOOGLE_SYNC_MAX);
    const changed = targets.filter((event) => googleStateFor(event) === 'changed').length;
    const fresh = targets.length - changed;
    const extra = candidates.length - targets.length;
    if (
      !window.confirm(
        `일정 ${targets.length}개를 구글 캘린더에 보낼까요?\n\n새 일정 ${fresh}개 · 변경 반영 ${changed}개${
          extra ? `\n안전 한도에 따라 나머지 ${extra}개는 이번에 보내지 않습니다.` : ''
        }`,
      )
    ) {
      return;
    }

    setGoogleBusy(true);
    setGoogleError(null);
    setGoogleSync({ running: true, total: targets.length, done: 0, failed: 0 });
    let done = 0;
    let failed = 0;
    let lastError = null;
    let fatalError = null;
    let activeCalendarId = googleCalendarId;

    for (const event of targets) {
      try {
        const { googleEventId, calendarId } = await pushEventToGoogle(event, activeCalendarId);
        activeCalendarId = calendarId;
        saveGoogleSyncResult(event.id, googleEventId);
        done += 1;
        setGoogleSync((prev) => ({ ...prev, done }));
      } catch (error) {
        failed += 1;
        lastError = error;
        setGoogleSync((prev) => ({ ...prev, failed }));
        const isFatal =
          [401, 403, 429].includes(error?.status) ||
          ['AUTH_REQUIRED', 'USAGE_LIMIT', 'RATE_GUARD', 'NOT_CONFIGURED'].includes(error?.code);
        if (isFatal) {
          fatalError = error;
          break;
        }
      }
    }

    setGoogleUsage(getGoogleUsage());
    setGoogleAuthed(hasGoogleToken());
    setGoogleSync((prev) => ({ ...prev, running: false }));
    setGoogleBusy(false);
    if (fatalError || lastError) setGoogleError(googleErrorMessage(fatalError || lastError));
    notify(
      failed
        ? `구글 동기화: 성공 ${done}개 · 실패 ${failed}개${fatalError ? ' (중단됨)' : ''}`
        : `구글 캘린더에 일정 ${done}개를 보냈습니다.`,
    );
  };

  const readImportFile = async (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const normalized = normalizeData(parsed);
      if (!normalized.events.length && !normalized.items.length) {
        notify('파일에 일정이나 할 일이 없습니다.');
        return;
      }
      setPendingImport({ name: file.name, data: normalized });
    } catch {
      notify('JSON 파일을 읽지 못했습니다.');
    }
  };

  const applyPendingImport = (mode) => {
    if (!pendingImport) return;
    if (
      mode === 'replace' &&
      !window.confirm('현재 데이터를 모두 지우고 파일 내용으로 바꿀까요? 되돌릴 수 없습니다.')
    ) {
      return;
    }
    setData((prev) => {
      const next =
        mode === 'merge' ? mergeData(prev, pendingImport.data) : normalizeData(pendingImport.data);
      const previousEvents = new Map(prev.events.map((event) => [event.id, event]));
      return {
        ...next,
        // Keep the local Google mapping when restoring a backup that predates
        // the integration, even in "replace" mode.
        events: next.events.map((event) => {
          const previous = previousEvents.get(event.id);
          if (!previous?.googleEventId || event.googleEventId) return event;
          return {
            ...event,
            googleEventId: previous.googleEventId,
            googleSyncedAt: previous.googleSyncedAt || event.googleSyncedAt,
          };
        }),
        meta: prev.meta,
      };
    });
    notify(mode === 'merge' ? '파일 내용을 기존 데이터에 합쳤습니다.' : '파일 내용으로 교체했습니다.');
    setPendingImport(null);
  };

  const clearAll = async () => {
    if (!window.confirm('이 브라우저에 저장된 일정과 할 일을 모두 삭제할까요? 되돌릴 수 없습니다.')) return;
    if (
      !window.confirm(
        '정말 삭제합니다. JSON으로 백업하지 않았다면 복구할 수 없습니다.\n\n구글 캘린더에 이미 보낸 일정은 삭제되지 않고 그대로 남습니다.',
      )
    ) {
      return;
    }
    await revokeGoogleToken();
    clearGoogleUsage();
    clearPlanner();
    setGoogleAuthed(false);
    setGoogleSync({ running: false, total: 0, done: 0, failed: 0 });
    setGoogleError(null);
    setGoogleUsage(getGoogleUsage());
    setData({ events: [], items: [], meta: {} });
    notify('모든 데이터를 삭제했습니다. 구글 캘린더의 일정은 유지됩니다.');
  };

  const startEventAdd = () => {
    setEventDraft(emptyEventDraft(todayKey()));
    setTab('events');
  };

  const startItemAdd = () => {
    setItemDraft(emptyItemDraft());
    setTab('items');
  };

  const draftLinkedItems = useMemo(() => {
    if (eventDraft.id) {
      return sortedItems.filter((item) => item.eventId === eventDraft.id);
    }
    const ids = new Set(eventDraft.linkedItemIds || []);
    return sortedItems.filter((item) => ids.has(item.id));
  }, [eventDraft.id, eventDraft.linkedItemIds, sortedItems]);

  const draftAvailableItems = useMemo(() => {
    const linkedIds = new Set(draftLinkedItems.map((item) => item.id));
    return sortedItems.filter((item) => !linkedIds.has(item.id));
  }, [draftLinkedItems, sortedItems]);

  const itemDraftLinkedEvent = useMemo(
    () => (itemDraft.eventId ? data.events.find((event) => event.id === itemDraft.eventId) || null : null),
    [data.events, itemDraft.eventId],
  );

  return (
    <>
      <SEO
        title="가족 일정 관리 | 여전히, 나는 사람이다."
        description="AI로 정리한 가정 통신문을 일정과 준비물로 나눠 브라우저에만 저장하는 로컬 우선 가족 일정 관리 서비스입니다. 일정과 준비물·할 일을 연결하고, 선택한 구글 캘린더로 바로 보내거나 JSON·ICS로 백업합니다. 설치 없이 무료로 사용하세요."
        url="https://seodaeya.github.io/planner/"
      />

      <div className={styles.wrap}>
        <header className={styles.hero}>
          <span className="category-badge">LOCAL-FIRST FAMILY SCHEDULE</span>
          <h1 className={styles.title}>📅 가족 일정 관리</h1>
          <p className={styles.lead}>
            AI로 정리한 안내문을 붙여넣으면 일정과 준비물로 나눠 드립니다.
            <br />
            일정과 준비물·할 일을 양방향에서 자유롭게 연결하고 해제하며 한눈에 관리하세요.
            <br />
            <strong>모든 데이터는 이 브라우저에만 저장</strong>되고 서버로 보내지 않습니다. 플래너 계정은
            필요 없으며, 구글 캘린더 연동은 원할 때만 켜는 선택 기능입니다.
          </p>
          <div className={styles.heroMeta}>
            <span>🔗 양방향 일정–항목 연결</span>
            <span>🔒 로컬 저장</span>
            <span>🗂 JSON 백업</span>
            <span>📆 구글 캘린더 연동 · ICS</span>
          </div>
        </header>

        <nav className={styles.tabs} aria-label="가족 일정 관리 메뉴">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`${styles.tab} ${tab === item.key ? styles.tabActive : ''}`}
              onClick={() => setTab(item.key)}
            >
              {item.label}
              {item.key === 'items' && openItems.length > 0 ? (
                <span className={styles.tabCount}>{openItems.length}</span>
              ) : null}
            </button>
          ))}
        </nav>

        {saveError ? <div className={`${styles.banner} ${styles.bannerDanger}`}>⚠ {saveError}</div> : null}
        {backupDue ? (
          <div className={`${styles.banner} ${styles.bannerWarn}`}>
            ⚠ 브라우저 저장소는 오래 방문하지 않으면 지워질 수 있습니다. <button type="button" className={styles.linkButton} onClick={exportJson}>지금 JSON으로 백업</button>
          </div>
        ) : null}

        {tab === 'home' ? (
          <section className={styles.stack}>
            <div className={styles.todayBar}>
              <div>
                <p className={styles.todayLabel} suppressHydrationWarning>{formatDateLabel(today)}</p>
                <h2 className={styles.todayTitle}>오늘의 우리 집</h2>
              </div>
              <div className={styles.summary}>
                <span>일정 {todayEvents.length}</span>
                <span>할 일 {openItems.length}</span>
                {linkedItemCount ? <span>연결 {linkedItemCount}</span> : null}
              </div>
            </div>

            <div className={styles.twoCol}>
              <section className={styles.card}>
                <div className={styles.cardHead}>
                  <h3>오늘 일정</h3>
                  <button type="button" className={styles.btnGhost} onClick={startEventAdd}>+ 일정</button>
                </div>
                {todayEvents.length ? (
                  <ul className={styles.list}>
                    {todayEvents.map((event) => (
                      <EventRow
                        key={event.id}
                        event={event}
                        items={itemsByEvent.get(event.id) || []}
                        allItems={sortedItems}
                        eventTitleById={eventTitleById}
                        googleEnabled={googleEnabled}
                        onGoogleSync={syncEventToGoogle}
                        onToggleItem={toggleItem}
                        onItemEdit={editItem}
                        onLinkItem={(itemId) => linkItemToEvent(itemId, event.id)}
                        onUnlinkItem={(item) => linkItemToEvent(item.id, null)}
                        onQuickAddItem={(fields) => quickAddItemForEvent(event.id, fields)}
                        onEdit={() => editEvent(event)}
                        onDelete={() => deleteEvent(event)}
                      />
                    ))}
                  </ul>
                ) : (
                  <p className={styles.empty}>오늘은 등록된 일정이 없습니다.</p>
                )}

                {upcomingEvents.length ? (
                  <>
                    <h4 className={styles.subHead}>다가오는 일정</h4>
                    <ul className={styles.list}>
                      {upcomingEvents.slice(0, 5).map((event) => (
                        <EventRow
                          key={event.id}
                          event={event}
                          items={itemsByEvent.get(event.id) || []}
                          allItems={sortedItems}
                          eventTitleById={eventTitleById}
                          googleEnabled={googleEnabled}
                          onGoogleSync={syncEventToGoogle}
                          onToggleItem={toggleItem}
                          onItemEdit={editItem}
                          onLinkItem={(itemId) => linkItemToEvent(itemId, event.id)}
                          onUnlinkItem={(item) => linkItemToEvent(item.id, null)}
                          onQuickAddItem={(fields) => quickAddItemForEvent(event.id, fields)}
                          onEdit={() => editEvent(event)}
                          onDelete={() => deleteEvent(event)}
                        />
                      ))}
                    </ul>
                  </>
                ) : null}
              </section>

              <section className={styles.card}>
                <div className={styles.cardHead}>
                  <h3>할 일 · 준비물</h3>
                  <button type="button" className={styles.btnGhost} onClick={startItemAdd}>+ 추가</button>
                </div>
                {openItems.length ? (
                  <ul className={styles.list}>
                    {openItems.slice(0, 8).map((item) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        events={sortedEvents}
                        eventTitle={item.eventId ? eventTitleById.get(item.eventId) : null}
                        onJumpEvent={() => item.eventId && jumpToEvent(item.eventId)}
                        onLinkEvent={(eventId) => linkItemToEvent(item.id, eventId)}
                        onUnlink={() => linkItemToEvent(item.id, null)}
                        onToggle={() => toggleItem(item)}
                        onEdit={() => editItem(item)}
                        onDelete={() => deleteItem(item)}
                      />
                    ))}
                  </ul>
                ) : (
                  <p className={styles.empty}>남은 할 일이 없습니다. 🎉</p>
                )}
                {openItems.length > 8 ? (
                  <button type="button" className={styles.btnGhost} onClick={() => setTab('items')}>
                    +{openItems.length - 8}개 더 보기
                  </button>
                ) : null}
              </section>
            </div>

            <section className={`${styles.card} ${styles.importCta}`}>
              <div>
                <h3>📥 AI로 정리한 내용이 있나요?</h3>
                <p className={styles.muted}>
                  링크는 브라우저 보안 정책상 직접 읽을 수 없습니다. AI에서 <strong>복사한 내용</strong>을
                  붙여넣으면 일정과 준비물로 나누고, 관련 항목을 일정에 연결해 드립니다.
                </p>
              </div>
              <button type="button" className={styles.btnPrimary} onClick={() => setTab('import')}>
                가져오기
              </button>
            </section>
          </section>
        ) : null}

        {tab === 'events' ? (
          <section className={styles.stack}>
            <section className={styles.card} ref={eventFormRef}>
              <div className={styles.cardHead}>
                <h3>{eventDraft.id ? '일정 수정' : '일정 추가'}</h3>
                {eventDraft.id ? (
                  <button type="button" className={styles.btnGhost} onClick={() => setEventDraft(emptyEventDraft())}>
                    수정 취소
                  </button>
                ) : null}
              </div>
              <form className={styles.form} onSubmit={saveEventDraft}>
                <label className={styles.field}>
                  <span>제목</span>
                  <input
                    value={eventDraft.title}
                    onChange={(event) => setEventDraft({ ...eventDraft, title: event.target.value })}
                    placeholder="예: 북한산 현장체험학습"
                    required
                  />
                </label>
                <div className={styles.fieldRow}>
                  <label className={styles.field}>
                    <span>날짜</span>
                    <input
                      type="date"
                      value={eventDraft.date}
                      onChange={(event) => setEventDraft({ ...eventDraft, date: event.target.value })}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>시간 (비우면 종일)</span>
                    <input
                      type="time"
                      value={eventDraft.time}
                      onChange={(event) => setEventDraft({ ...eventDraft, time: event.target.value })}
                    />
                  </label>
                </div>
                <div className={styles.fieldRow}>
                  <label className={styles.field}>
                    <span>장소 (선택)</span>
                    <input
                      value={eventDraft.location}
                      onChange={(event) => setEventDraft({ ...eventDraft, location: event.target.value })}
                      placeholder="예: 북한산"
                    />
                  </label>
                  <label className={styles.field}>
                    <span>메모 (선택)</span>
                    <input
                      value={eventDraft.memo}
                      onChange={(event) => setEventDraft({ ...eventDraft, memo: event.target.value })}
                      placeholder="예: x반"
                    />
                  </label>
                </div>

                <div className={styles.formLinkSection}>
                  <div className={styles.formLinkHead}>
                    <span className={styles.formLinkTitle}>
                      🔗 연결된 준비물 · 할 일 ({draftLinkedItems.length})
                    </span>
                    {draftAvailableItems.length ? (
                      <CustomItemPicker
                        items={draftAvailableItems}
                        onSelect={linkItemInEventDraft}
                        placeholder="+ 기존 항목 연결"
                        eventTitleById={eventTitleById}
                      />
                    ) : null}
                  </div>

                  {draftLinkedItems.length ? (
                    <ul className={styles.formLinkedList}>
                      {draftLinkedItems.map((item) => (
                        <li
                          key={item.id}
                          className={`${styles.formLinkedItem} ${item.done ? styles.linkedDone : ''}`}
                        >
                          <label className={styles.linkedCheck}>
                            <input
                              type="checkbox"
                              checked={!!item.done}
                              onChange={() => toggleItem(item)}
                            />
                            <span className={styles.linkedType}>
                              {TYPE_LABEL[item.listType] || '할 일'}
                            </span>
                            <span>
                              {item.title}
                              {item.qty ? ` (${item.qty})` : ''}
                            </span>
                            {item.dueAt ? (
                              <span className={styles.dueTag}>마감 {item.dueAt}</span>
                            ) : null}
                          </label>
                          <div className={styles.linkedActions}>
                            <button
                              type="button"
                              className={styles.linkedEdit}
                              onClick={() => editItem(item)}
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              className={styles.unlinkBtn}
                              onClick={() => unlinkItemInEventDraft(item)}
                            >
                              연결 해제
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.formLinkEmpty}>
                      아직 연결된 준비물·할 일이 없습니다. 기존 항목을 선택하거나 아래에서 바로 추가해 보세요.
                    </p>
                  )}

                  <div className={styles.quickAddBox}>
                    <div className={styles.quickAddTop}>
                      <div className={styles.chips} role="group" aria-label="새 항목 종류">
                        {LIST_TYPES.map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            className={`${styles.chip} ${
                              eventQuickItem.listType === type.value ? styles.chipActive : ''
                            }`}
                            onClick={() =>
                              setEventQuickItem((prev) => ({ ...prev, listType: type.value }))
                            }
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                      <label className={styles.quickDueLabel}>
                        <span>마감일</span>
                        <input
                          type="date"
                          value={eventQuickItem.dueAt || eventDraft.date || ''}
                          onChange={(event) =>
                            setEventQuickItem((prev) => ({ ...prev, dueAt: event.target.value }))
                          }
                        />
                      </label>
                    </div>
                    <div className={styles.quickAddInputRow}>
                      <input
                        value={eventQuickItem.title}
                        onChange={(event) =>
                          setEventQuickItem((prev) => ({ ...prev, title: event.target.value }))
                        }
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            const ok = quickAddItemForEvent(eventDraft.id, {
                              ...eventQuickItem,
                              dueAt: eventQuickItem.dueAt || eventDraft.date || null,
                            });
                            if (ok) {
                              setEventQuickItem((prev) => ({ ...prev, title: '', qty: '' }));
                            }
                          }
                        }}
                        placeholder={`새 ${
                          TYPE_LABEL[eventQuickItem.listType] || '준비물'
                        } 입력 (예: 도시락, 운동화)`}
                      />
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={() => {
                          const ok = quickAddItemForEvent(eventDraft.id, {
                            ...eventQuickItem,
                            dueAt: eventQuickItem.dueAt || eventDraft.date || null,
                          });
                          if (ok) {
                            setEventQuickItem((prev) => ({ ...prev, title: '', qty: '' }));
                          }
                        }}
                      >
                        추가
                      </button>
                    </div>
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button type="submit" className={styles.btnPrimary}>
                    {eventDraft.id ? '수정 저장' : '일정 추가'}
                  </button>
                </div>
              </form>
            </section>

            <section className={styles.card}>
              <div className={styles.cardHead}>
                <h3>일정 목록</h3>
                <span className={styles.muted}>{data.events.length}개</span>
              </div>
              {sortedEvents.filter((event) => event.startsAt && dateKeyOf(event) >= today).length ? (
                <ul className={styles.list}>
                  {sortedEvents
                    .filter((event) => event.startsAt && dateKeyOf(event) >= today)
                    .map((event) => (
                      <EventRow
                        key={event.id}
                        event={event}
                        items={itemsByEvent.get(event.id) || []}
                        allItems={sortedItems}
                        eventTitleById={eventTitleById}
                        googleEnabled={googleEnabled}
                        onGoogleSync={syncEventToGoogle}
                        onToggleItem={toggleItem}
                        onItemEdit={editItem}
                        onLinkItem={(itemId) => linkItemToEvent(itemId, event.id)}
                        onUnlinkItem={(item) => linkItemToEvent(item.id, null)}
                        onQuickAddItem={(fields) => quickAddItemForEvent(event.id, fields)}
                        onEdit={() => editEvent(event)}
                        onDelete={() => deleteEvent(event)}
                      />
                    ))}
                </ul>
              ) : (
                <p className={styles.empty}>예정된 일정이 없습니다.</p>
              )}

              {undatedEvents.length ? (
                <>
                  <h4 className={styles.subHead}>날짜 미정</h4>
                  <ul className={styles.list}>
                    {undatedEvents.map((event) => (
                      <EventRow
                        key={event.id}
                        event={event}
                        items={itemsByEvent.get(event.id) || []}
                        allItems={sortedItems}
                        eventTitleById={eventTitleById}
                        googleEnabled={googleEnabled}
                        onGoogleSync={syncEventToGoogle}
                        onToggleItem={toggleItem}
                        onItemEdit={editItem}
                        onLinkItem={(itemId) => linkItemToEvent(itemId, event.id)}
                        onUnlinkItem={(item) => linkItemToEvent(item.id, null)}
                        onQuickAddItem={(fields) => quickAddItemForEvent(event.id, fields)}
                        onEdit={() => editEvent(event)}
                        onDelete={() => deleteEvent(event)}
                      />
                    ))}
                  </ul>
                </>
              ) : null}

              {pastEvents.length ? (
                <>
                  <button type="button" className={styles.btnGhost} onClick={() => setShowPast((value) => !value)}>
                    {showPast ? '지난 일정 숨기기' : `지난 일정 ${pastEvents.length}개 보기`}
                  </button>
                  {showPast ? (
                    <ul className={styles.list}>
                      {pastEvents.map((event) => (
                        <EventRow
                          key={event.id}
                          event={event}
                          past
                          items={itemsByEvent.get(event.id) || []}
                          allItems={sortedItems}
                          eventTitleById={eventTitleById}
                          googleEnabled={googleEnabled}
                          onGoogleSync={syncEventToGoogle}
                          onToggleItem={toggleItem}
                          onItemEdit={editItem}
                          onLinkItem={(itemId) => linkItemToEvent(itemId, event.id)}
                          onUnlinkItem={(item) => linkItemToEvent(item.id, null)}
                          onQuickAddItem={(fields) => quickAddItemForEvent(event.id, fields)}
                          onEdit={() => editEvent(event)}
                          onDelete={() => deleteEvent(event)}
                        />
                      ))}
                    </ul>
                  ) : null}
                </>
              ) : null}
            </section>
          </section>
        ) : null}

        {tab === 'items' ? (
          <section className={styles.stack}>
            <section className={styles.card} ref={itemFormRef}>
              <div className={styles.cardHead}>
                <h3>{itemDraft.id ? '할 일 · 준비물 수정' : '할 일 · 준비물 추가'}</h3>
                {itemDraft.id ? (
                  <button type="button" className={styles.btnGhost} onClick={() => setItemDraft(emptyItemDraft())}>
                    수정 취소
                  </button>
                ) : null}
              </div>
              <form className={styles.form} onSubmit={saveItemDraft}>
                <label className={styles.field}>
                  <span>내용</span>
                  <input
                    value={itemDraft.title}
                    onChange={(event) => setItemDraft({ ...itemDraft, title: event.target.value })}
                    placeholder="예: 운동화"
                    required
                  />
                </label>
                <div className={styles.chips} role="group" aria-label="종류">
                  {LIST_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      className={`${styles.chip} ${itemDraft.listType === type.value ? styles.chipActive : ''}`}
                      onClick={() => setItemDraft({ ...itemDraft, listType: type.value })}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
                <div className={styles.field}>
                  <span>연결된 일정 (선택 · 해제 가능)</span>
                  {itemDraftLinkedEvent ? (
                    <div className={styles.selectedEventBanner}>
                      <div className={styles.selectedEventBadge}>
                        <span>
                          🔗 { itemDraftLinkedEvent.title } ({ eventWhenLabel(itemDraftLinkedEvent) })
                        </span>
                        <button
                          type="button"
                          className={styles.selectedEventClear}
                          onClick={() => {
                            setItemDraft((prev) => ({ ...prev, eventId: '' }));
                            if (itemDraft.id) {
                              linkItemToEvent(itemDraft.id, null);
                            }
                          }}
                          aria-label="일정 연결 해제"
                          title="일정 연결 해제"
                        >
                          ✕
                        </button>
                      </div>
                      <button
                        type="button"
                        className={styles.jumpEventBtn}
                        onClick={() => jumpToEvent(itemDraftLinkedEvent.id)}
                      >
                        연결된 일정 보기 &gt;
                      </button>
                    </div>
                  ) : null}
                  <CustomEventSelect
                    value={itemDraft.eventId}
                    onChange={(nextEventId) => {
                      setItemDraft((prev) => ({ ...prev, eventId: nextEventId }));
                      if (itemDraft.id) {
                        linkItemToEvent(itemDraft.id, nextEventId || null);
                      }
                    }}
                    events={sortedEvents}
                    placeholder="연결 안 함 (독립 할 일 · 준비물)"
                  />
                  <p className={styles.fieldHelp}>
                    일정을 연결하면 일정 화면과 할 일 화면 양쪽에서 준비물·할 일을 바로 확인하고 연결·해제할 수 있습니다.
                  </p>
                </div>
                <div className={styles.fieldRow}>
                  <label className={styles.field}>
                    <span>수량 (선택)</span>
                    <input
                      value={itemDraft.qty}
                      onChange={(event) => setItemDraft({ ...itemDraft, qty: event.target.value })}
                      placeholder="예: 1켤레"
                    />
                  </label>
                  <label className={styles.field}>
                    <span>기한 (선택)</span>
                    <input
                      type="date"
                      value={itemDraft.dueAt}
                      onChange={(event) => setItemDraft({ ...itemDraft, dueAt: event.target.value })}
                    />
                  </label>
                </div>
                <div className={styles.formActions}>
                  <button type="submit" className={styles.btnPrimary}>
                    {itemDraft.id ? '수정 저장' : '추가'}
                  </button>
                </div>
              </form>
            </section>

            <section className={styles.card}>
              <div className={styles.cardHead}>
                <h3>목록</h3>
                <label className={styles.checkLabel}>
                  <input type="checkbox" checked={showDone} onChange={(event) => setShowDone(event.target.checked)} />
                  완료된 항목 보기
                </label>
              </div>
              <p className={styles.muted}>
                각 항목에서 바로 <strong>일정을 연결하거나 ✕ 버튼으로 연결 해제</strong>할 수 있으며, 일정 배지를 누르면 해당 일정으로 이동합니다.
              </p>
              {LIST_TYPES.map((type) => {
                const rows = sortedItems.filter((item) => item.listType === type.value && (showDone || !item.done));
                if (!rows.length) return null;
                return (
                  <div key={type.value}>
                    <h4 className={styles.subHead}>{type.label}</h4>
                    <ul className={styles.list}>
                      {rows.map((item) => (
                        <ItemRow
                          key={item.id}
                          item={item}
                          events={sortedEvents}
                          eventTitle={item.eventId ? eventTitleById.get(item.eventId) : null}
                          onJumpEvent={() => item.eventId && jumpToEvent(item.eventId)}
                          onLinkEvent={(eventId) => linkItemToEvent(item.id, eventId)}
                          onUnlink={() => linkItemToEvent(item.id, null)}
                          onToggle={() => toggleItem(item)}
                          onEdit={() => editItem(item)}
                          onDelete={() => deleteItem(item)}
                        />
                      ))}
                    </ul>
                  </div>
                );
              })}
              {!data.items.length ? <p className={styles.empty}>등록된 할 일이 없습니다.</p> : null}
            </section>
          </section>
        ) : null}

        {tab === 'import' ? (
          <section className={styles.stack}>
            <section className={styles.card}>
              <div className={styles.cardHead}>
                <h3>1. AI에게 정리 요청</h3>
                <button type="button" className={styles.btnSecondary} onClick={() => copyText(GEMINI_PROMPT, '프롬프트를 복사했습니다.')}>
                  프롬프트 복사
                </button>
              </div>
              <p className={styles.muted}>
                공유 링크는 브라우저가 직접 읽을 수 없습니다. 아래 프롬프트를 AI에 붙여넣고, 돌아온
                <strong> JSON을 그대로 복사</strong>해 주세요.
              </p>
              <details className={styles.details}>
                <summary>프롬프트 미리 보기</summary>
                <pre className={styles.prompt}>{GEMINI_PROMPT}</pre>
              </details>
              <a className={styles.link} href="https://gemini.google.com/app" target="_blank" rel="noopener noreferrer">
                GEMINI 열기 ↗
              </a>
            </section>

            <section className={styles.card}>
              <div className={styles.cardHead}>
                <h3>2. 정리된 내용 붙여넣기</h3>
                <button
                  type="button"
                  className={styles.btnGhost}
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text) {
                        setPaste(text);
                        notify('클립보드 내용을 붙여넣었습니다.');
                      } else {
                        notify('클립보드가 비어 있습니다.');
                      }
                    } catch {
                      notify('브라우저가 클립보드 읽기를 막았습니다. 직접 붙여넣어 주세요.');
                    }
                  }}
                >
                  클립보드에서
                </button>
              </div>
              <textarea
                className={styles.textarea}
                value={paste}
                onChange={(event) => {
                  setPaste(event.target.value);
                  setPreviewError(null);
                }}
                rows={8}
                placeholder={'JSON 또는 정리된 글을 붙여넣으세요.\n예) 12월 1일(화) 북한산 현장체험학습\n준비물: 운동화, 반 티, 식수'}
              />
              {previewError ? <p className={styles.errorText}>{previewError}</p> : null}
              <div className={styles.formActions}>
                <button type="button" className={styles.btnPrimary} onClick={parsePaste} disabled={!paste.trim()}>
                  내용 읽기
                </button>
                {paste ? (
                  <button
                    type="button"
                    className={styles.btnGhost}
                    onClick={() => {
                      setPaste('');
                      setPreview(null);
                      setPreviewError(null);
                    }}
                  >
                    지우기
                  </button>
                ) : null}
              </div>
            </section>

            {preview ? (
              <section className={styles.card}>
                <div className={styles.cardHead}>
                  <h3>3. 확인하고 저장</h3>
                  <span className={styles.badge}>{preview.kind === 'json' ? 'JSON' : '텍스트'}</span>
                </div>
                {preview.warnings.map((warning) => (
                  <p key={warning} className={styles.warnText}>⚠ {warning}</p>
                ))}

                {preview.events.length ? (
                  <>
                    <h4 className={styles.subHead}>일정 {preview.events.length}개</h4>
                    <ul className={styles.previewList}>
                      {preview.events.map((row, index) => (
                        <li key={`event-${index}`} className={styles.previewRow}>
                          <input
                            type="checkbox"
                            checked={row.selected}
                            onChange={(event) => updatePreviewEvent(index, { selected: event.target.checked })}
                            aria-label="이 일정 포함"
                          />
                          <input
                            className={styles.previewTitle}
                            value={row.title}
                            onChange={(event) => updatePreviewEvent(index, { title: event.target.value })}
                            aria-label="일정 제목"
                          />
                          <input
                            type="date"
                            value={row.date}
                            onChange={(event) => updatePreviewEvent(index, { date: event.target.value })}
                            aria-label="일정 날짜"
                          />
                          <input
                            type="time"
                            value={row.time}
                            onChange={(event) => updatePreviewEvent(index, { time: event.target.value })}
                            aria-label="일정 시간 (비우면 종일)"
                          />
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}

                {preview.items.length ? (
                  <>
                    <h4 className={styles.subHead}>할 일 · 준비물 {preview.items.length}개</h4>
                    <ul className={styles.previewList}>
                      {preview.items.map((row, index) => (
                        <li key={`item-${index}`} className={styles.previewRow}>
                          <input
                            type="checkbox"
                            checked={row.selected}
                            onChange={(event) => updatePreviewItem(index, { selected: event.target.checked })}
                            aria-label="이 항목 포함"
                          />
                          <input
                            className={styles.previewTitle}
                            value={row.title}
                            onChange={(event) => updatePreviewItem(index, { title: event.target.value })}
                            aria-label="항목 내용"
                          />
                          <select
                            value={row.listType}
                            onChange={(event) => updatePreviewItem(index, { listType: event.target.value })}
                            aria-label="항목 종류"
                          >
                            {LIST_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                          <input
                            type="date"
                            value={row.dueAt}
                            onChange={(event) => updatePreviewItem(index, { dueAt: event.target.value })}
                            aria-label="기한"
                          />
                          <select
                            className={styles.previewEvent}
                            value={row.eventKey}
                            onChange={(event) => updatePreviewItem(index, { eventKey: event.target.value })}
                            aria-label="연결할 일정"
                          >
                            <option value="">연결 안 함</option>
                            {preview.events.map((eventRow, eventIndex) => (
                              <option key={eventRow.key || `pe-${eventIndex}`} value={eventRow.key}>
                                {eventRow.title || `일정 ${eventIndex + 1}`}
                              </option>
                            ))}
                          </select>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}

                <div className={styles.radioRow}>
                  <label className={styles.checkLabel}>
                    <input
                      type="radio"
                      name="preview-mode"
                      checked={previewMode === 'merge'}
                      onChange={() => setPreviewMode('merge')}
                    />
                    기존 데이터에 추가
                  </label>
                  <label className={styles.checkLabel}>
                    <input
                      type="radio"
                      name="preview-mode"
                      checked={previewMode === 'replace'}
                      onChange={() => setPreviewMode('replace')}
                    />
                    이번 내용으로 교체
                  </label>
                </div>

                <div className={styles.formActions}>
                  <button type="button" className={styles.btnPrimary} onClick={savePreview}>
                    선택한 항목 저장
                  </button>
                  <button type="button" className={styles.btnGhost} onClick={() => setPreview(null)}>
                    미리보기 닫기
                  </button>
                </div>
                <p className={styles.tiny}>
                  시간을 비우면 종일 일정으로 저장됩니다. 날짜를 비우면 &lsquo;날짜 미정&rsquo;으로 남습니다.
                  항목은 <strong>연결할 일정</strong>을 골라 함께 묶을 수 있습니다.
                </p>
              </section>
            ) : null}
          </section>
        ) : null}

        {tab === 'google' ? (
          <section className={styles.stack}>
            {googleError ? (
              <div className={`${styles.banner} ${styles.bannerDanger}`}>
                ⚠ {googleError}
                <button type="button" className={styles.linkButton} onClick={() => setGoogleError(null)}>
                  닫기
                </button>
              </div>
            ) : null}

            {!googleEnabled ? (
              <section className={styles.card}>
                <div className={styles.cardHead}>
                  <h3>구글 캘린더 자동 연동 설정</h3>
                  <span className={styles.badge}>관리자 1회 설정</span>
                </div>
                <p className={styles.muted}>
                  이 빌드에는 Google OAuth 클라이언트 ID가 없어 자동 전송을 켤 수 없습니다. 아래 순서대로
                  한 번만 설정하면, 방문자는 각자 구글 로그인 후 자기 캘린더로 일정을 보낼 수 있습니다.
                </p>
                <div className={styles.googleSetupCallout}>
                  <strong>서버·데이터베이스·결제 계정은 필요 없습니다.</strong>
                  <p>
                    Google Cloud 프로젝트는 <strong>앱 등록증</strong> 역할만 합니다. 플래너 데이터는 계속
                    이 브라우저에만 저장되고, 로그인 토큰은 메모리에만 둡니다.
                  </p>
                </div>
                <ol className={styles.helpList}>
                  <li>
                    <a
                      href="https://console.cloud.google.com/projectcreate"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Google Cloud Console
                    </a>
                    에서 프로젝트를 만듭니다. 결제 계정은 연결하지 않아도 됩니다.
                  </li>
                  <li>
                    <strong>API 및 서비스 → 라이브러리</strong>에서 <strong>Google Calendar API</strong>를
                    사용 설정합니다.
                  </li>
                  <li>
                    <strong>OAuth 동의 화면</strong>: External → Testing으로 시작합니다. 앱 이름, 지원
                    이메일, 개인정보처리방침 URL(<code>https://seodaeya.github.io/privacy/</code>)을 넣고,
                    범위에 <code>https://www.googleapis.com/auth/calendar.app.created</code>를 추가합니다.
                    가족 구글 계정을 <strong>테스트 사용자</strong>로 등록하세요.
                  </li>
                  <li>
                    <strong>사용자 인증 정보 → OAuth 클라이언트 ID</strong>를 <strong>웹 애플리케이션</strong>
                    으로 만듭니다. 승인된 JavaScript 출처에 <code>https://seodaeya.github.io</code>와{' '}
                    <code>http://localhost:4173</code>을 넣습니다. 리디렉션 URI는 필요 없습니다.
                  </li>
                  <li>
                    로컬 개발: <code>.env.local</code>에{' '}
                    <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID=...apps.googleusercontent.com</code>를 추가하고 다시
                    빌드합니다.
                  </li>
                  <li>
                    배포: GitHub 저장소의 <strong>Settings → Secrets and variables → Actions → Variables</strong>
                    에 <code>GOOGLE_CLIENT_ID</code>를 추가합니다. 워크플로가 이를{' '}
                    <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>로 주입합니다.
                  </li>
                </ol>
                <div className={styles.formActions}>
                  <a
                    className={styles.btnSecondary}
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Google Cloud 사용자 인증 정보 ↗
                  </a>
                  <a
                    className={styles.btnGhost}
                    href="https://developers.google.com/identity/oauth2/web/guides/overview"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    OAuth 웹 앱 안내 ↗
                  </a>
                </div>
                <p className={styles.tiny}>
                  클라이언트 ID는 비밀번호가 아니라 공개 식별자입니다. 클라이언트 시크릿은 만들거나 저장하지
                  않습니다. Testing 모드에서는 등록한 테스트 사용자만 로그인할 수 있고, 공개 배포 시에는
                  Google 앱 검증이 필요할 수 있습니다.
                </p>
              </section>
            ) : (
              <>
                <section className={styles.card}>
                  <div className={styles.cardHead}>
                    <h3>구글 캘린더 연결</h3>
                    <span className={`${styles.googleStatus} ${googleStatusClass}`}>
                      <span className={styles.googleStatusDot} aria-hidden="true" />
                      {googleStatusText}
                    </span>
                  </div>
                  <p className={styles.muted}>
                    각자 자기 구글 계정으로 로그인해 <strong>앱 전용 캘린더</strong>에 일정을 보냅니다.
                    플래너는 구글 계정을 중개·보관하지 않으며, 접근 토큰은 이 탭의 메모리에만 있습니다.
                  </p>
                  {googleConnection ? (
                    <dl className={styles.googleFacts}>
                      <div>
                        <dt>캘린더</dt>
                        <dd>{googleConnection.calendarSummary || '우리집 AI'}</dd>
                      </div>
                      <div>
                        <dt>캘린더 ID</dt>
                        <dd>
                          <code className={styles.googleCalendarId}>{googleConnection.calendarId}</code>
                        </dd>
                      </div>
                      <div>
                        <dt>마지막 동기화</dt>
                        <dd>
                          {googleConnection.lastSyncAt
                            ? new Date(googleConnection.lastSyncAt).toLocaleString('ko-KR')
                            : '아직 없음'}
                        </dd>
                      </div>
                    </dl>
                  ) : null}
                  <ul className={styles.helpList}>
                    <li>
                      권한 범위는 <code>calendar.app.created</code> 하나뿐입니다. 이 앱이 만든 보조
                      캘린더 외의 기존 캘린더는 읽거나 수정할 수 없습니다.
                    </li>
                    <li>로그인 토큰은 저장하지 않습니다. 새로고침하거나 약 1시간이 지나면 다시 로그인합니다.</li>
                    <li>연결 해제는 이 브라우저의 토큰만 지우며, 구글 캘린더의 일정은 유지됩니다.</li>
                  </ul>
                  <div className={styles.formActions}>
                    {!googleSession || !googleCalendarId ? (
                      <button
                        type="button"
                        className={styles.btnPrimary}
                        onClick={connectGoogle}
                        disabled={googleBusy}
                      >
                        {googleBusy
                          ? '구글 연결 중…'
                          : googleSession
                            ? '앱 전용 캘린더 다시 만들기'
                            : googleCalendarId
                              ? '이번 세션 구글 로그인'
                              : '구글 캘린더 연결'}
                      </button>
                    ) : (
                      <span className={styles.googleSessionNote}>✓ 구글 캘린더에 연결되어 있습니다.</span>
                    )}
                    {googleCalendarId || googleSession ? (
                      <button
                        type="button"
                        className={styles.btnGhost}
                        onClick={disconnectGoogle}
                        disabled={googleBusy}
                      >
                        연결 해제
                      </button>
                    ) : null}
                    {googleCalendarId ? (
                      <a
                        className={styles.btnSecondary}
                        href="https://calendar.google.com/calendar/u/0/r"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        구글 캘린더 열기 ↗
                      </a>
                    ) : null}
                  </div>

                  <div className={styles.googleUsage}>
                    <div className={styles.googleUsageHead}>
                      <span>오늘 API 사용량</span>
                      <span>
                        {googleUsage.count.toLocaleString()} / {googleUsage.limit.toLocaleString()}회 ·{' '}
                        {formatPercent(googleUsage.percent)}%
                      </span>
                    </div>
                    <div
                      className={styles.googleUsageTrack}
                      role="progressbar"
                      aria-label="오늘 구글 API 사용량"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.min(100, Math.round(googleUsage.percent))}
                    >
                      <div
                        className={`${styles.googleUsageFill} ${
                          googleUsage.percent >= 80 ? styles.googleUsageFillWarn : ''
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(googleUsage.percent, googleUsage.count ? 0.5 : 0),
                          )}%`,
                        }}
                      />
                    </div>
                    <p className={styles.tiny}>
                      안전 한도는 Google 공식 한도의 50%입니다. 최근 1분{' '}
                      {googleUsage.minuteCount.toLocaleString()} / {googleUsage.minuteLimit.toLocaleString()}
                      회. 이 카운터는 서버가 없어 <strong>이 브라우저에서만</strong> 적용됩니다.
                    </p>
                  </div>
                </section>

                <section className={styles.card}>
                  <div className={styles.cardHead}>
                    <h3>일정 보내기</h3>
                    <span className={styles.badge}>
                      전송 {googleSyncedCount} · 변경 {googleChangedCount}
                    </span>
                  </div>
                  <p className={styles.muted}>
                    날짜가 있는 일정 가운데 아직 보내지 않은 일정은 새로 만들고, 이미 보낸 일정은 같은 구글
                    일정을 갱신합니다. 연결된 준비물·할 일은 일정 설명에 함께 들어갑니다.
                  </p>
                  {googleSync.running || googleSync.total ? (
                    <div className={styles.googleProgress}>
                      <div className={styles.googleUsageHead}>
                        <span>
                          {googleSync.running ? '동기화 중…' : '마지막 동기화 결과'}
                        </span>
                        <span>
                          {googleSync.done} / {googleSync.total}
                          {googleSync.failed ? ` · 실패 ${googleSync.failed}` : ''}
                        </span>
                      </div>
                      <div className={styles.googleUsageTrack}>
                        <div
                          className={styles.googleUsageFill}
                          style={{ width: `${googleProgressPercent}%` }}
                        />
                      </div>
                    </div>
                  ) : null}
                  <div className={styles.formActions}>
                    <button
                      type="button"
                      className={styles.btnPrimary}
                      onClick={syncAllGoogle}
                      disabled={
                        googleBusy ||
                        googleSync.running ||
                        !googleSession ||
                        !googleCalendarId ||
                        !googleDatedEvents.length
                      }
                    >
                      {googleSync.running
                        ? '구글로 보내는 중…'
                        : `전체 동기화 (${googleDatedEvents.length}개)`}
                    </button>
                    <button type="button" className={styles.btnSecondary} onClick={exportIcs}>
                      ICS 내보내기
                    </button>
                  </div>
                  {!googleSession || !googleCalendarId ? (
                    <p className={styles.warnText}>
                      위에서 구글 로그인과 앱 전용 캘린더 연결을 먼저 완료해 주세요. 연결 후 이 버튼이
                      활성화됩니다.
                    </p>
                  ) : null}
                  <p className={styles.tiny}>
                    한 번에 최대 {GOOGLE_SYNC_MAX.toLocaleString()}개까지 보냅니다. 50% 안전 한도에 닿으면
                    요청을 멈추고 안내합니다. 구글에서 직접 수정한 내용은 플래너로 돌아오지 않습니다.
                  </p>
                </section>

                <section className={styles.card}>
                  <div className={styles.cardHead}>
                    <h3>일정별 전송 상태</h3>
                    <span className={styles.muted}>{googleDatedEvents.length}개</span>
                  </div>
                  {googleDatedEvents.length ? (
                    <ul className={styles.googleEventList}>
                      {googleDatedEvents.map((event) => (
                        <GoogleSyncRow
                          key={event.id}
                          event={event}
                          items={itemsByEvent.get(event.id) || []}
                          state={googleStateFor(event)}
                          disabled={
                            !googleSession || !googleCalendarId || googleBusy || googleSync.running
                          }
                          onSync={syncEventToGoogle}
                        />
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.empty}>날짜가 있는 일정이 없습니다.</p>
                  )}
                  <p className={styles.tiny}>
                    &lsquo;변경됨&rsquo;은 마지막 전송 이후 플래너에서 내용을 고쳤다는 뜻입니다. 날짜가 없는
                    일정은 구글 캘린더에 보낼 수 없습니다.
                  </p>
                </section>
              </>
            )}

            <section className={styles.card}>
              <div className={styles.cardHead}>
                <h3>구글 연동 없이 보내기</h3>
                <span className={styles.badge}>수동 대체</span>
              </div>
              <p className={styles.muted}>
                로그인을 쓰지 않거나 동기화가 실패해도 ICS 파일과 구글 캘린더 링크로 일정을 보낼 수 있습니다.
                일정 카드의 <strong>구글</strong> 링크는 로그인 없이 구글 캘린더 추가 화면을 엽니다.
              </p>
              <div className={styles.formActions}>
                <button type="button" className={styles.btnSecondary} onClick={exportIcs}>
                  ICS 내보내기
                </button>
                <a
                  className={styles.btnSecondary}
                  href="https://calendar.google.com/calendar/u/0/r/settings/export"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  구글 캘린더 가져오기 열기 ↗
                </a>
              </div>
              <details className={styles.details}>
                <summary>ICS 파일을 구글 캘린더에 넣는 방법</summary>
                <ol className={styles.helpList}>
                  <li>구글 캘린더 → 설정 → &lsquo;가져오기 및 내보내기&rsquo;</li>
                  <li>파일 선택에서 내려받은 <code>.ics</code> 선택</li>
                  <li>추가할 캘린더를 고르고 &lsquo;가져오기&rsquo;</li>
                </ol>
              </details>
            </section>
          </section>
        ) : null}

        {tab === 'backup' ? (
          <section className={styles.stack}>
            <section className={styles.card}>
              <div className={styles.cardHead}>
                <h3>JSON 백업 · 복원</h3>
                <span className={styles.badge}>{formatBytes(storageBytes)}</span>
              </div>
              <p className={styles.muted}>
                서버에 보관하지 않기 때문에 브라우저를 바꾸거나 저장소를 지우면 데이터가 사라집니다. 주기적으로
                JSON 파일을 내려받아 두세요. 기존 우리집 AI 앱의 내보내기 파일도 가져올 수 있습니다.
              </p>
              <div className={styles.formActions}>
                <button type="button" className={styles.btnPrimary} onClick={exportJson}>
                  JSON 내보내기
                </button>
                <button type="button" className={styles.btnSecondary} onClick={() => fileRef.current?.click()}>
                  JSON 가져오기
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  className={styles.hiddenInput}
                  onChange={readImportFile}
                />
              </div>
              <p className={styles.tiny}>
                마지막 백업:{' '}
                {data.meta?.lastExportAt
                  ? new Date(data.meta.lastExportAt).toLocaleString('ko-KR')
                  : '아직 없음'}
              </p>

              {pendingImport ? (
                <div className={styles.importBox}>
                  <p>
                    <strong>{pendingImport.name}</strong> 파일에서 일정 {pendingImport.data.events.length}개 · 할 일{' '}
                    {pendingImport.data.items.length}개를 읽었습니다.
                  </p>
                  <div className={styles.formActions}>
                    <button type="button" className={styles.btnPrimary} onClick={() => applyPendingImport('merge')}>
                      기존 데이터에 합치기
                    </button>
                    <button type="button" className={styles.btnSecondary} onClick={() => applyPendingImport('replace')}>
                      파일 내용으로 교체
                    </button>
                    <button type="button" className={styles.btnGhost} onClick={() => setPendingImport(null)}>
                      취소
                    </button>
                  </div>
                </div>
              ) : null}
            </section>

            <section className={styles.card}>
              <div className={styles.cardHead}>
                <h3>캘린더로 보내기</h3>
                <span className={styles.badge}>{googleEnabled ? '자동 · 수동' : '수동'}</span>
              </div>
              <p className={styles.muted}>
                <strong>구글</strong> 탭에서 구글 계정을 연결하면 일정을 바로 보낼 수 있습니다. 연결하지 않아도
                일정 카드의 <strong>구글</strong> 링크와 아래 <strong>ICS 파일</strong>로 보낼 수 있습니다.
              </p>
              <ul className={styles.helpList}>
                <li>일정 카드의 <strong>구글 보내기</strong> 또는 <strong>구글</strong> 링크로 한 건씩 전송</li>
                <li>아래 ICS 내보내기: 전체 일정을 파일로 받아 구글 캘린더에서 가져오기</li>
              </ul>
              <div className={styles.formActions}>
                <button type="button" className={styles.btnSecondary} onClick={exportIcs}>
                  ICS 내보내기
                </button>
                <button type="button" className={styles.btnGhost} onClick={() => setTab('google')}>
                  구글 탭 열기
                </button>
                <a
                  className={styles.btnSecondary}
                  href="https://calendar.google.com/calendar/u/0/r/settings/export"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  구글 캘린더 가져오기 열기 ↗
                </a>
              </div>
              <details className={styles.details}>
                <summary>ICS 파일을 구글 캘린더에 넣는 방법</summary>
                <ol className={styles.helpList}>
                  <li>구글 캘린더 → 설정 → &lsquo;가져오기 및 내보내기&rsquo;</li>
                  <li>파일 선택에서 내려받은 <code>.ics</code> 선택</li>
                  <li>추가할 캘린더를 고르고 &lsquo;가져오기&rsquo;</li>
                </ol>
              </details>
              <p className={styles.tiny}>
                자동 전송은 플래너 → 구글 단방향입니다. 구글에서 직접 고친 내용은 플래너로 돌아오지 않습니다.
              </p>
            </section>

            <section className={styles.card}>
              <div className={styles.cardHead}>
                <h3>이 브라우저에 저장된 데이터</h3>
                <span className={styles.badge}>
                  일정 {data.events.length} · 할 일 {data.items.length}
                </span>
              </div>
              <p className={styles.muted}>
                저장 위치: <code>localStorage</code> · 약 {formatBytes(storageBytes)} 사용 중
              </p>
              <p className={styles.tiny}>
                시크릿 모드나 저장 공간이 가득 찬 경우 저장되지 않을 수 있습니다. 사파리는 오래 방문하지 않은
                사이트의 저장소를 정리할 수 있으니 JSON 백업을 권장합니다.
              </p>
              <div className={styles.formActions}>
                <button type="button" className={styles.btnDanger} onClick={clearAll}>
                  모든 데이터 삭제
                </button>
              </div>
            </section>

            <section className={styles.card}>
              <div className={styles.cardHead}>
                <h3>개인정보</h3>
              </div>
              <ul className={styles.helpList}>
                <li>붙여넣은 글은 이 브라우저 안에서만 처리되며 어떤 서버로도 전송되지 않습니다.</li>
                <li>
                  구글 캘린더를 연결하면 사용자가 보낸 일정의 제목·시간·장소·메모·연결 항목만 해당 구글
                  계정의 앱 전용 캘린더로 전송됩니다. 접근 토큰은 메모리에만 있고 서버에 저장하지 않습니다.
                </li>
                <li>구글 링크·ICS 파일은 사용자가 직접 눌러야 구글로 전달되며, 이 사이트가 계정에 접근하지 않습니다.</li>
                <li>백업 파일에는 가족 일정이 들어 있으니 공유하지 마세요.</li>
              </ul>
            </section>
          </section>
        ) : null}

        <div className={styles.footer}>
          <p>우리집 AI · 일정 기능만 가볍게 · 서버 없이 브라우저에서 동작</p>
          <p className={styles.tiny}>데이터는 이 기기에만 있습니다. 브라우저를 바꾸면 JSON으로 옮겨 주세요.</p>
        </div>
      </div>

      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </>
  );
}

function EventRow({
  event,
  past,
  items = [],
  allItems = [],
  eventTitleById,
  googleEnabled = false,
  onGoogleSync,
  onToggleItem,
  onItemEdit,
  onLinkItem,
  onUnlinkItem,
  onQuickAddItem,
  onEdit,
  onDelete,
}) {
  const googleUrl = googleCalendarUrl(event, items);
  const googleState = googleSyncState(event, items);
  const [showAllLinks, setShowAllLinks] = useState(false);
  const [showLinkTools, setShowLinkTools] = useState(false);
  const [quickType, setQuickType] = useState('supply');
  const [quickTitle, setQuickTitle] = useState('');
  const [googleSyncing, setGoogleSyncing] = useState(false);
  const doneCount = items.filter((item) => item.done).length;
  const visibleItems = showAllLinks ? items : items.slice(0, 4);
  const linkedIdSet = new Set(items.map((item) => item.id));
  const availableItems = allItems.filter((item) => !linkedIdSet.has(item.id));

  const submitQuickAdd = () => {
    if (!onQuickAddItem) return;
    const ok = onQuickAddItem({
      listType: quickType,
      title: quickTitle,
      dueAt: dateKeyOf(event) || null,
    });
    if (ok) {
      setQuickTitle('');
    }
  };

  const runGoogleSync = async () => {
    if (!onGoogleSync || googleSyncing) return;
    setGoogleSyncing(true);
    try {
      await onGoogleSync(event);
    } finally {
      setGoogleSyncing(false);
    }
  };

  return (
    <li className={`${styles.eventRow} ${past ? styles.past : ''}`}>
      <button
        type="button"
        className={styles.eventMain}
        onClick={onEdit}
        aria-label={`${event.title} 일정 수정`}
        title="눌러서 수정"
      >
        <span className={styles.eventWhen}>{eventWhenLabel(event)}</span>
        <span className={styles.eventTitle}>{event.title}</span>
        {googleState !== 'none' ? (
          <span
            className={`${styles.googleBadge} ${
              googleState === 'synced' ? styles.googleBadgeSynced : styles.googleBadgeChanged
            }`}
          >
            ☁ 구글 {googleStateLabel(googleState)}
          </span>
        ) : null}
        {event.location || event.memo ? (
          <span className={styles.eventMeta}>
            {event.location ? `📍 ${event.location}` : ''}
            {event.location && event.memo ? ' · ' : ''}
            {event.memo || ''}
          </span>
        ) : null}
      </button>
      <div className={styles.rowActions}>
        <button
          type="button"
          className={styles.rowLink}
          onClick={() => setShowLinkTools((value) => !value)}
        >
          {showLinkTools ? '연결 닫기' : '+ 항목 연결'}
        </button>
        {googleEnabled && onGoogleSync ? (
          <button
            type="button"
            className={`${styles.rowLink} ${styles.rowGoogle}`}
            onClick={runGoogleSync}
            disabled={!event.startsAt || googleSyncing}
            title={
              !event.startsAt
                ? '날짜가 없는 일정은 구글 캘린더로 보낼 수 없습니다.'
                : googleState === 'none'
                  ? '이 일정을 구글 캘린더에 보내기'
                  : '변경한 내용을 구글 캘린더에 반영'
            }
          >
            {googleSyncing
              ? '보내는 중…'
              : googleState === 'none'
                ? '구글 보내기'
                : '구글 반영'}
          </button>
        ) : googleUrl ? (
          <a className={styles.rowLink} href={googleUrl} target="_blank" rel="noopener noreferrer">
            구글
          </a>
        ) : null}
        <button type="button" className={styles.rowLink} onClick={onEdit}>
          수정
        </button>
        <button type="button" className={`${styles.rowLink} ${styles.rowDanger}`} onClick={onDelete}>
          삭제
        </button>
      </div>

      {items.length || showLinkTools ? (
        <div className={styles.linkedItems}>
          <div className={styles.linkedHead}>
            <span>🔗 연결된 준비물 · 할 일 ({items.length})</span>
            <div className={styles.linkedHeadRight}>
              {items.length ? (
                <span className={styles.linkedCount}>
                  {doneCount}/{items.length} 완료
                </span>
              ) : null}
              <button
                type="button"
                className={styles.linkedToggleBtn}
                onClick={() => setShowLinkTools((value) => !value)}
              >
                {showLinkTools ? '닫기' : '+ 연결·추가'}
              </button>
            </div>
          </div>

          {items.length ? (
            <ul className={styles.linkedList}>
              {visibleItems.map((item) => (
                <li key={item.id} className={`${styles.linkedItem} ${item.done ? styles.linkedDone : ''}`}>
                  <label className={styles.linkedCheck}>
                    <input type="checkbox" checked={!!item.done} onChange={() => onToggleItem?.(item)} />
                    <span>
                      {item.title}
                      {item.qty ? ` ${item.qty}` : ''}
                    </span>
                  </label>
                  <span className={styles.linkedType}>{TYPE_LABEL[item.listType] || '할 일'}</span>
                  {onItemEdit ? (
                    <button type="button" className={styles.linkedEdit} onClick={() => onItemEdit(item)}>
                      수정
                    </button>
                  ) : null}
                  {onUnlinkItem ? (
                    <button
                      type="button"
                      className={styles.unlinkBtn}
                      onClick={() => onUnlinkItem(item)}
                      title="이 일정에서 연결 해제"
                    >
                      연결 해제
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.formLinkEmpty}>이 일정에 연결된 준비물·할 일이 없습니다.</p>
          )}

          {items.length > 4 ? (
            <button type="button" className={styles.linkedMore} onClick={() => setShowAllLinks((value) => !value)}>
              {showAllLinks ? '접기' : `+${items.length - 4}개 더 보기`}
            </button>
          ) : null}

          {showLinkTools ? (
            <div className={styles.inlineLinkBox}>
              {availableItems.length && onLinkItem ? (
                <CustomItemPicker
                  items={availableItems}
                  onSelect={onLinkItem}
                  placeholder="+ 기존 항목 선택해 연결"
                  eventTitleById={eventTitleById}
                />
              ) : null}
              {onQuickAddItem ? (
                <div className={styles.inlineQuickAddRow}>
                  <div className={styles.miniChips} role="group" aria-label="새 항목 종류">
                    {LIST_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        className={`${styles.miniChip} ${quickType === type.value ? styles.miniChipActive : ''}`}
                        onClick={() => setQuickType(type.value)}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                  <div className={styles.inlineQuickAddInputGroup}>
                    <input
                      value={quickTitle}
                      onChange={(e) => setQuickTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          submitQuickAdd();
                        }
                      }}
                      placeholder={`새 ${TYPE_LABEL[quickType] || '준비물'} 입력 후 추가`}
                    />
                    <button type="button" className={styles.btnSecondary} onClick={submitQuickAdd}>
                      추가
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function GoogleSyncRow({ event, items = [], state, disabled, onSync }) {
  const [syncing, setSyncing] = useState(false);
  const googleUrl = googleCalendarUrl(event, items);

  const run = async () => {
    if (disabled || syncing || !onSync) return;
    setSyncing(true);
    try {
      await onSync(event);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <li className={styles.googleEventRow}>
      <div className={styles.googleEventMain}>
        <span className={styles.googleEventTitle}>{event.title}</span>
        <span className={styles.googleEventWhen}>{eventWhenLabel(event)}</span>
      </div>
      <span
        className={`${styles.googleBadge} ${
          state === 'synced'
            ? styles.googleBadgeSynced
            : state === 'changed'
              ? styles.googleBadgeChanged
              : styles.googleBadgeNone
        }`}
      >
        {googleStateLabel(state)}
      </span>
      <div className={styles.googleEventActions}>
        <button
          type="button"
          className={styles.googleMiniBtn}
          onClick={run}
          disabled={disabled || syncing || !event.startsAt}
        >
          {syncing
            ? '보내는 중…'
            : state === 'none'
              ? '보내기'
              : state === 'changed'
                ? '반영'
                : '다시 보내기'}
        </button>
        {googleUrl ? (
          <a
            className={styles.googleMiniLink}
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            수동
          </a>
        ) : null}
      </div>
    </li>
  );
}

function ItemRow({ item, events = [], eventTitle, onJumpEvent, onLinkEvent, onUnlink, onToggle, onEdit, onDelete }) {
  return (
    <li className={`${styles.itemRow} ${item.done ? styles.done : ''}`}>
      <div className={styles.itemMain}>
        <label className={styles.itemCheck}>
          <input type="checkbox" checked={!!item.done} onChange={onToggle} />
          <span>
            {item.title}
            {item.qty ? <em className={styles.qty}> {item.qty}</em> : null}
            <span className={styles.typeTag}>{TYPE_LABEL[item.listType] || '할 일'}</span>
            {item.dueAt ? <span className={styles.dueTag}>{relativeDayLabel(item.dueAt)}까지</span> : null}
          </span>
        </label>
        <div className={styles.itemLinkBar}>
          {eventTitle ? (
            <span className={styles.eventPillGroup}>
              <button
                type="button"
                className={styles.eventTagBtn}
                onClick={onJumpEvent}
                title={`연결된 일정 보기: ${eventTitle}`}
              >
                🔗 {eventTitle}
              </button>
              {onUnlink ? (
                <button
                  type="button"
                  className={styles.eventUnlinkBtn}
                  onClick={onUnlink}
                  aria-label="일정 연결 해제"
                  title="일정 연결 해제"
                >
                  ✕
                </button>
              ) : null}
            </span>
          ) : events.length && onLinkEvent ? (
            <CustomEventPicker
              events={events}
              onSelect={onLinkEvent}
              placeholder="+ 일정 연결"
              compact
            />
          ) : null}
        </div>
      </div>
      <div className={styles.rowActions}>
        <button type="button" className={styles.rowLink} onClick={onEdit}>
          수정
        </button>
        <button type="button" className={`${styles.rowLink} ${styles.rowDanger}`} onClick={onDelete}>
          삭제
        </button>
      </div>
    </li>
  );
}
