import { useEffect, useState } from 'react';
import styles from '@/styles/layout.module.css';

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('ko');

  useEffect(() => {
    // 1. Initialize Google Translate element script
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

      const script = document.createElement('script');
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }

    // Check existing cookie
    const match = document.cookie.match(/googtrans=\/ko\/([a-zA-Z\-]+)/);
    if (match && match[1]) {
      setCurrentLang(match[1]);
    }
  }, []);

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
        onClick={() => setIsOpen(!isOpen)}
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
