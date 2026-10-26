import { useCallback, useEffect, useState } from 'react';
import styles from '@/styles/layout.module.css';

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('ko');

  /**
   * Google Translate 위젯 로드 (약 110KB + 추가 요청).
   *
   * 기존에는 모든 페이지에서 마운트 즉시 로드했으나, 실제로 번역을 쓰는 사용자는 소수이므로
   * - 과거에 언어를 선택한 사용자(`googtrans` 쿠키 보유)만 즉시 로드해 자동 번역을 유지하고,
   * - 그 외에는 언어 드롭다운을 처음 열 때 로드한다.
   * 첫 화면(FCP/LCP)의 대역폭 경합을 줄이는 것이 목적이다.
   */
  const loadTranslate = useCallback(() => {
    // 이미 초기화됐거나 로딩 중이면 다시 주입하지 않는다.
    if (window.google && window.google.translate) return;
    if (document.getElementById('google-translate-script')) return;

    if (!window.googleTranslateElementInit) {
      window.googleTranslateElementInit = () => {
        if (window.google && window.google.translate) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'ko',
              includedLanguages: 'ko,en,ja,zh-CN,es,fr,de',
              autoDisplay: false,
            },
            'google_translate_element'
          );
        }
      };
    }

    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    // 로드 실패 시 다음 시도에서 다시 주입할 수 있도록 노드를 제거한다.
    script.onerror = () => script.remove();
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    // 언어를 이미 선택한 사용자는 자동 번역이 계속 적용되어야 하므로 즉시 로드한다.
    const match = document.cookie.match(/googtrans=\/ko\/([a-zA-Z\-]+)/);
    if (match && match[1]) {
      setCurrentLang(match[1]);
      loadTranslate();
    }
  }, [loadTranslate]);

  const toggleOpen = () => {
    if (!isOpen) loadTranslate();
    setIsOpen(!isOpen);
  };

  const changeLanguage = (langCode) => {
    setCurrentLang(langCode);
    setIsOpen(false);

    // Set cookie for Google Translate
    if (langCode === 'ko') {
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=' + window.location.hostname + '; path=/;';
    } else {
      document.cookie = `googtrans=/ko/${langCode}; path=/;`;
      document.cookie = `googtrans=/ko/${langCode}; domain=${window.location.hostname}; path=/;`;
    }

    // Trigger translate select dropdown
    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event('change'));
    } else {
      window.location.reload();
    }
  };

  const languages = [
    { code: 'ko', label: '🇰🇷 한국어' },
    { code: 'en', label: '🇺🇸 English' },
    { code: 'ja', label: '🇯🇵 日本語' },
    { code: 'zh-CN', label: '🇨🇳 中文' },
    { code: 'es', label: '🇪🇸 Español' }
  ];

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Hidden google translate anchor container */}
      <div id="google_translate_element" style={{ display: 'none' }} />

      <button
        type="button"
        onClick={toggleOpen}
        className={styles.themeToggleBtn}
        style={{ width: 'auto', padding: '0 10px', borderRadius: '18px', gap: '4px', fontSize: '0.8rem', fontWeight: 600 }}
        aria-label="언어 변경 / Change Language"
        title="🌐 다국어 번역 / Global Translation"
      >
        <span>🌐</span>
        <span style={{ textTransform: 'uppercase' }}>{currentLang}</span>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '46px',
          right: 0,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-glass-active)',
          borderRadius: '14px',
          padding: '8px',
          minWidth: '130px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
          zIndex: 1100,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              style={{
                background: currentLang === lang.code ? 'rgba(138, 43, 226, 0.15)' : 'transparent',
                border: 'none',
                color: currentLang === lang.code ? 'var(--accent-light)' : 'var(--text-primary)',
                fontWeight: currentLang === lang.code ? 700 : 500,
                fontSize: '0.85rem',
                padding: '8px 12px',
                borderRadius: '8px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
              onMouseOut={(e) => e.currentTarget.style.background = currentLang === lang.code ? 'rgba(138, 43, 226, 0.15)' : 'transparent'}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
