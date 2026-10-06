import { useState, useEffect } from 'react';

const FONT_KEY = 'nard-font-size';
const SIZES = [0.95, 1, 1.1, 1.2];

// 본문 글꼴 크기 조절 (A- / 보통 / A+). #post-content에 직접 적용, 선택값 로컬 저장.
export default function FontSizeControl() {
  const [level, setLevel] = useState(1);

  const apply = (lv) => {
    const el = document.getElementById('post-content');
    if (el) el.style.fontSize = `${SIZES[lv]}rem`;
    try {
      localStorage.setItem(FONT_KEY, String(lv));
    } catch (e) {}
  };

  useEffect(() => {
    try {
      const saved = parseInt(localStorage.getItem(FONT_KEY) || '1', 10);
      const lv = Number.isInteger(saved) && saved >= 0 && saved < SIZES.length ? saved : 1;
      setLevel(lv);
      const el = document.getElementById('post-content');
      if (el && lv !== 1) el.style.fontSize = `${SIZES[lv]}rem`;
    } catch (e) {}
  }, []);

  const change = (next) => {
    const lv = Math.min(SIZES.length - 1, Math.max(0, next));
    setLevel(lv);
    apply(lv);
  };

  const btn = (label, target, active) => (
    <button
      key={label}
      type="button"
      onClick={() => change(target)}
      aria-label={`글꼴 크기: ${label}`}
      title={`글꼴 크기: ${label}`}
      style={{
        padding: '7px 12px',
        borderRadius: '16px',
        border: '1px solid var(--border-glass)',
        background: active ? 'var(--accent-gradient)' : 'transparent',
        color: active ? '#fff' : 'var(--text-secondary)',
        fontSize: '0.85rem',
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }} role="group" aria-label="글꼴 크기 조절">
      {btn('A-', 0, level === 0)}
      {btn('보통', 1, level === 1)}
      {btn('A+', SIZES.length - 1, level === SIZES.length - 1)}
    </div>
  );
}
