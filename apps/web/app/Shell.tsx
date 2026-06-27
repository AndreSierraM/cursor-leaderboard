'use client';

import { LangToggle, useT } from './i18n';

function CursorLogo() {
  return (
    <svg
      className="logo-mark"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 2L3 7v10l9 5 9-5V7l-9-5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 12l9-5M12 12L3 7M12 12v10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 12L16.5 9.5"
        stroke="#f54e00"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const { t } = useT();
  return (
    <div className="site">
      <header className="header">
        <div className="container header-inner">
          <a href="/" className="logo">
            <CursorLogo />
            <span className="logo-text">
              Cursor <span>Leaderboard</span>
            </span>
          </a>
          <div className="header-actions">
            <LangToggle />
            <a
              href="https://github.com/AndreSierraM/cursor-leaderboard"
              className="nav-link"
              target="_blank"
              rel="noreferrer"
            >
              {t('nav_github')}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path
                  d="M3 9L9 3M9 3H4M9 3v5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </div>
      </header>

      {children}

      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <CursorLogo />
            <p className="footer-tagline">{t('footer_tagline')}</p>
          </div>
          <div className="footer-links">
            <a href="https://cursor.com" target="_blank" rel="noreferrer">
              {t('footer_cursor')}
            </a>
            <a
              href="https://github.com/AndreSierraM/cursor-leaderboard"
              target="_blank"
              rel="noreferrer"
            >
              {t('footer_source')}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
