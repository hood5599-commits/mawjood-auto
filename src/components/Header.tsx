import React from 'react';
import { t } from '../utils/translations.ts';
import { Logo } from './Logo';

interface HeaderProps {
  lang: 'ar' | 'en';
  setLang: (lang: 'ar' | 'en') => void;
  view: 'shop' | 'dashboard' | 'auth' | 'profile';
  setView: (view: 'shop' | 'dashboard' | 'auth' | 'profile') => void;
  session: any;
  onLogout: () => void;
  cartCount: number;
  onOpenCart: () => void;
}

export const Header: React.FC<HeaderProps> = ({ lang, setLang, view, setView, session, onLogout, cartCount, onOpenCart }) => {
  const isRtl = lang === 'ar';

  return (
    <>
      <style>{`
        .mwj-header {
          font-family: 'Cairo', 'Segoe UI', sans-serif;
          background: linear-gradient(180deg, rgba(15,23,32,0.92) 0%, rgba(31,58,95,0.92) 100%);
          backdrop-filter: blur(14px) saturate(140%);
          -webkit-backdrop-filter: blur(14px) saturate(140%);
          border-bottom: 1px solid rgba(224,135,42,0.15);
          box-shadow: 0 8px 30px rgba(0,0,0,0.35);
        }

        .mwj-logo-zone { transition: opacity 0.2s ease; }
        .mwj-logo-zone:hover { opacity: 0.85; }
        .mwj-logo-zone:active { transform: scale(0.98); }

        .mwj-title {
          background: linear-gradient(90deg, #ffffff 0%, #cfe3ff 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .mwj-icon-btn {
          transition: transform 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease;
        }
        .mwj-icon-btn:hover {
          background-color: rgba(255,255,255,0.08) !important;
          transform: translateY(-1px);
        }
        .mwj-icon-btn:active { transform: translateY(0) scale(0.94); }

        .mwj-badge {
          animation: mwj-pop 0.25s ease;
        }
        @keyframes mwj-pop {
          0% { transform: scale(0.4); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .mwj-pill {
          transition: all 0.2s ease;
        }
        .mwj-pill:hover {
          background-color: rgba(224,135,42,0.14) !important;
          border-color: rgba(224,135,42,0.5) !important;
          transform: translateY(-1px);
        }
        .mwj-pill:active { transform: translateY(0); }

        .mwj-nav-btn {
          position: relative;
          transition: color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
        }
        .mwj-nav-btn:hover:not(.mwj-nav-btn-active) {
          background-color: rgba(255,255,255,0.06) !important;
          color: #ffffff !important;
        }
        .mwj-nav-btn-active {
          box-shadow: 0 4px 14px rgba(224,135,42,0.35);
        }

        .mwj-cta {
          transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
        }
        .mwj-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(224,135,42,0.4);
          filter: brightness(1.06);
        }
        .mwj-cta:active { transform: translateY(0); }

        .mwj-session-pill {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
        }

        .mwj-link-btn {
          transition: color 0.2s ease, opacity 0.2s ease;
        }
        .mwj-link-btn:hover { opacity: 0.8; }

        .mwj-logout-btn:hover { color: #ff8686 !important; }

        @media (max-width: 640px) {
          .mwj-header-inner { padding: 12px 16px !important; }
          .mwj-title { font-size: 17px !important; }
          .mwj-nav-btn { padding: 7px 11px !important; font-size: 12.5px !important; }
          .mwj-pill-label { display: none !important; }
        }
      `}</style>

      <header className="mwj-header" style={{ position: 'sticky', top: 0, zIndex: 50 }}>
        <div
          className="mwj-header-inner"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            padding: '14px 28px',
            direction: isRtl ? 'rtl' : 'ltr',
          }}
        >
          {/* Logo + Title */}
          <div
            className="mwj-logo-zone"
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
            onClick={() => setView('shop')}
          >
            <Logo />
            <h1 className="mwj-title" style={{ margin: 0, fontSize: '21px', fontWeight: 800, letterSpacing: '0.3px' }}>
              {t[lang]?.title || (lang === 'ar' ? 'موجود أوتو' : 'Mawjood Auto')}
            </h1>
          </div>

          {/* Right cluster */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>

            {/* Cart */}
            <button
              onClick={onOpenCart}
              className="mwj-icon-btn"
              style={{
                position: 'relative',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '19px',
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label={lang === 'ar' ? 'سلة المشتريات' : 'Cart'}
            >
              🛒
              {cartCount > 0 && (
                <span
                  className="mwj-badge"
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    [isRtl ? 'left' : 'right']: '-6px',
                    backgroundColor: '#E0872A',
                    color: '#0F1720',
                    fontSize: '11px',
                    fontWeight: 800,
                    borderRadius: '999px',
                    minWidth: '20px',
                    height: '20px',
                    padding: '0 4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(224,135,42,0.5)',
                    border: '2px solid #1F3A5F',
                  }}
                >
                  {cartCount}
                </span>
              )}
            </button>

            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="mwj-pill"
              style={{
                padding: '9px 14px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: '#cfe3ff',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '999px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '13px',
                whiteSpace: 'nowrap',
              }}
            >
              {lang === 'ar' ? '🇬🇧 English' : '🇶🇦 العربية'}
            </button>

            {/* Browse Parts */}
            <button
              onClick={() => setView('shop')}
              className={`mwj-nav-btn ${view === 'shop' ? 'mwj-nav-btn-active' : ''}`}
              style={{
                padding: '9px 16px',
                backgroundColor: view === 'shop' ? '#E0872A' : 'transparent',
                color: view === 'shop' ? '#0F1720' : '#e2e8f0',
                border: view === 'shop' ? 'none' : '1px solid rgba(255,255,255,0.15)',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '13.5px',
              }}
            >
              {t[lang]?.browseParts || (lang === 'ar' ? 'تصفح القطع' : 'Browse Parts')}
            </button>

            {/* Garage Panel */}
            {session && session.role === 'garage' && (
              <button
                onClick={() => setView('dashboard')}
                className={`mwj-nav-btn ${view === 'dashboard' ? 'mwj-nav-btn-active' : ''}`}
                style={{
                  padding: '9px 16px',
                  backgroundColor: view === 'dashboard' ? '#E0872A' : 'transparent',
                  color: view === 'dashboard' ? '#0F1720' : '#e2e8f0',
                  border: view === 'dashboard' ? 'none' : '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '13.5px',
                }}
              >
                {t[lang]?.garagePanel || (lang === 'ar' ? 'لوحة الكراج' : 'Garage Panel')}
              </button>
            )}

            {/* Session / Auth */}
            {session ? (
              <div
                className="mwj-session-pill"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '7px 16px',
                  borderRadius: '999px',
                }}
              >
                <button
                  onClick={() => setView('profile')}
                  className="mwj-link-btn"
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: view === 'profile' ? '#E0872A' : '#e2e8f0',
                    cursor: 'pointer',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  👤 <span className="mwj-pill-label">{lang === 'ar' ? 'حسابي' : 'Profile'}</span>
                </button>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
                <button
                  onClick={onLogout}
                  className="mwj-link-btn mwj-logout-btn"
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#fc8181',
                    cursor: 'pointer',
                    fontSize: '13.5px',
                    fontWeight: 700,
                  }}
                >
                  {t[lang]?.logout || (lang === 'ar' ? 'تسجيل خروج' : 'Logout')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setView('auth')}
                className="mwj-cta"
                style={{
                  padding: '9px 18px',
                  backgroundColor: '#E0872A',
                  color: '#0F1720',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: '13.5px',
                  boxShadow: '0 4px 14px rgba(224,135,42,0.3)',
                }}
              >
                {t[lang]?.loginRegister || (lang === 'ar' ? 'دخول / تسجيل' : 'Login / Register')}
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
