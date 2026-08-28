import React, { useState } from 'react';

interface HeaderProps {
  lang: 'ar' | 'en';
  setLang: (lang: 'ar' | 'en') => void;
  view: string;
  setView: (view: any) => void;
  session: any;
  cartCount: number;
  onOpenCart: () => void;
  onLogout: () => void;
  onRequestCustomPart?: () => void;
  onOpenOrdersTracker?: () => void;
}

/* ============================================================
   BESPOKE ICON SUITE — stroke-based, 1.75px, geometric curves
   ============================================================ */

const IconCart: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 4H4.7L5.6 6M5.6 6L7.2 14.6C7.35 15.4 8.05 16 8.87 16H17.4C18.2 16 18.9 15.42 19.06 14.63L20.4 8H6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9.5" cy="19.5" r="1.5" stroke="currentColor" strokeWidth="1.75"/>
    <circle cx="17" cy="19.5" r="1.5" stroke="currentColor" strokeWidth="1.75"/>
  </svg>
);

const IconUser: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.75"/>
    <path d="M5 19.2C5.9 16.2 8.5 14.4 12 14.4C15.5 14.4 18.1 16.2 19 19.2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
  </svg>
);

const IconGlobe: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1.6"/>
    <path d="M4 12H20" stroke="currentColor" strokeWidth="1.6"/>
    <path d="M12 3.8C14.5 6.3 15.8 9 15.8 12C15.8 15 14.5 17.7 12 20.2C9.5 17.7 8.2 15 8.2 12C8.2 9 9.5 6.3 12 3.8Z" stroke="currentColor" strokeWidth="1.6"/>
  </svg>
);

const IconPackage: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3L20.5 7.5V16.5L12 21L3.5 16.5V7.5L12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
    <path d="M3.5 7.5L12 12L20.5 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
    <path d="M12 12V21" stroke="currentColor" strokeWidth="1.6"/>
    <path d="M7.7 5.2L16.3 9.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);

const IconWrench: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.7 6.3C13.5 5.1 11.7 4.8 10.2 5.5L12.9 8.2L11.4 9.7L8.7 7C8 8.5 8.3 10.3 9.5 11.5C10.7 12.7 12.4 13 13.9 12.4L18.8 17.3C19.3 17.8 20.1 17.8 20.6 17.3C21.1 16.8 21.1 16 20.6 15.5L15.7 10.6C16.3 9.1 16 7.4 14.7 6.3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
    <path d="M4.5 18.5L9 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);

const IconLogout: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 4.5H6.5C5.4 4.5 4.5 5.4 4.5 6.5V17.5C4.5 18.6 5.4 19.5 6.5 19.5H9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15.5 16L19.5 12L15.5 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19.3 12H10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
  </svg>
);

const IconGear: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M12 2.5V5.2M12 18.8V21.5M21.5 12H18.8M5.2 12H2.5M18.5 5.5L16.6 7.4M7.4 16.6L5.5 18.5M18.5 18.5L16.6 16.6M7.4 7.4L5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

/* ============================================================
   AMBIENT MECHANICAL ENGINE — pure CSS/SVG, ultra-low opacity
   ============================================================ */

const AmbientEngineLayer: React.FC = () => (
  <div
    aria-hidden="true"
    style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: 0,
    }}
  >
    <div className="mwj-gear mwj-gear-a">
      <IconGear size={120} />
    </div>
    <div className="mwj-gear mwj-gear-b">
      <IconGear size={70} />
    </div>
    <svg className="mwj-piston" width="180" height="40" viewBox="0 0 180 40" fill="none">
      <line x1="5" y1="20" x2="150" y2="20" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="150" cy="20" r="9" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="5" cy="20" r="4" stroke="currentColor" strokeWidth="1.2" />
    </svg>
    <svg className="mwj-rotor" width="90" height="90" viewBox="0 0 90 90" fill="none">
      <circle cx="45" cy="45" r="40" stroke="currentColor" strokeWidth="1" />
      <circle cx="45" cy="45" r="28" stroke="currentColor" strokeWidth="1" strokeDasharray="4 5" />
      <circle cx="45" cy="45" r="6" stroke="currentColor" strokeWidth="1" />
    </svg>
    <span className="mwj-spark mwj-spark-1" />
    <span className="mwj-spark mwj-spark-2" />
    <span className="mwj-spark mwj-spark-3" />
  </div>
);

export const Header: React.FC<HeaderProps> = ({
  lang,
  setLang,
  setView,
  session,
  cartCount,
  onOpenCart,
  onLogout,
  onRequestCustomPart,
  onOpenOrdersTracker
}) => {
  const isRtl = lang === 'ar';
  const [hovered, setHovered] = useState<string | null>(null);

  const OBSIDIAN = '#090D16';
  const SLATE = '#0F172A';
  const ALABASTER = '#F8FAFC';
  const COPPER = '#EA580C';

  const capsuleBase: React.CSSProperties = {
    padding: '9px 16px',
    borderRadius: '999px',
    cursor: 'pointer',
    fontWeight: 800,
    fontSize: '12.5px',
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    transition: 'transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.22s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.22s ease, border-color 0.22s ease',
    fontFamily: 'Cairo, system-ui, sans-serif',
    letterSpacing: isRtl ? '0px' : '0.2px',
    whiteSpace: 'nowrap',
  };

  const elevate = (key: string): React.CSSProperties =>
    hovered === key ? { transform: 'translateY(-1.5px)' } : {};

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        direction: isRtl ? 'rtl' : 'ltr',
        fontFamily: 'Cairo, system-ui, sans-serif',
      }}
    >
      <style>{`
        @keyframes mwj-spin-cw {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes mwj-spin-ccw {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes mwj-drift {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-6px) translateX(4px); }
        }
        @keyframes mwj-spark-pulse {
          0%, 100% { opacity: 0.05; transform: scale(0.8); }
          50% { opacity: 0.35; transform: scale(1.15); }
        }
        .mwj-gear {
          position: absolute;
          color: ${ALABASTER};
          opacity: 0.05;
        }
        .mwj-gear-a {
          top: -30px;
          inset-inline-end: 6%;
          animation: mwj-spin-cw 38s linear infinite;
        }
        .mwj-gear-b {
          bottom: -18px;
          inset-inline-end: 18%;
          animation: mwj-spin-ccw 26s linear infinite;
        }
        .mwj-piston {
          position: absolute;
          top: 8px;
          inset-inline-start: 30%;
          color: ${COPPER};
          opacity: 0.06;
          animation: mwj-drift 12s ease-in-out infinite;
        }
        .mwj-rotor {
          position: absolute;
          bottom: -20px;
          inset-inline-start: 8%;
          color: ${ALABASTER};
          opacity: 0.045;
          animation: mwj-spin-cw 50s linear infinite;
        }
        .mwj-spark {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: ${COPPER};
        }
        .mwj-spark-1 { top: 14px; inset-inline-start: 45%; animation: mwj-spark-pulse 4.2s ease-in-out infinite; }
        .mwj-spark-2 { bottom: 20px; inset-inline-start: 62%; animation: mwj-spark-pulse 5.6s ease-in-out infinite 1.2s; }
        .mwj-spark-3 { top: 40%; inset-inline-end: 22%; animation: mwj-spark-pulse 3.4s ease-in-out infinite 0.6s; }
      `}</style>

      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(180deg, rgba(9,13,22,0.96) 0%, rgba(15,23,42,0.92) 100%)`,
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.14)',
          boxShadow: `0 10px 30px -10px rgba(15, 23, 42, 0.55), inset 0 1px 0 rgba(255,255,255,0.04)`,
          padding: '14px 24px',
        }}
      >
        <AmbientEngineLayer />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: '1320px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          {/* ===== Brand Anchor: Logo + Wordmark ===== */}
          <div
            onClick={() => setView('shop')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: `linear-gradient(145deg, ${OBSIDIAN} 0%, ${SLATE} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid rgba(234, 88, 12, 0.45)`,
                boxShadow: `0 0 0 1px rgba(248,250,252,0.05), 0 0 22px rgba(234, 88, 12, 0.22), 0 6px 14px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.08)`,
                overflow: 'hidden',
              }}
            >
              <img
                src="/public/favicon.svg"
                alt="Mawjood Auto"
                width={30}
                height={30}
                style={{
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 0 6px rgba(234,88,12,0.35))',
                }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                <span
                  style={{
                    fontSize: '24px',
                    fontWeight: 900,
                    color: ALABASTER,
                    letterSpacing: '-0.5px',
                    lineHeight: 1.1,
                  }}
                >
                  {lang === 'ar' ? 'موجود ' : 'Mawjood '}
                </span>
                <span
                  style={{
                    fontSize: '24px',
                    fontWeight: 900,
                    color: COPPER,
                    letterSpacing: '-0.5px',
                    lineHeight: 1.1,
                    textShadow: '0 0 18px rgba(234,88,12,0.4)',
                  }}
                >
                  {lang === 'ar' ? 'أوتو' : 'Auto'}
                </span>
              </div>

              <span
                style={{
                  fontSize: '10.5px',
                  color: 'rgba(248,250,252,0.55)',
                  fontWeight: 700,
                  letterSpacing: isRtl ? '0px' : '0.9px',
                  marginTop: '3px',
                  textTransform: isRtl ? 'none' : 'uppercase',
                }}
              >
                {lang === 'ar' ? 'منصتك الأولى لقطع غيار السيارات' : "Qatar's Premier Auto Parts Ecosystem"}
              </span>
            </div>
          </div>

          {/* ===== Control Deck ===== */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flexWrap: 'wrap' }}>
            {onRequestCustomPart && (
              <button
                onClick={onRequestCustomPart}
                onMouseEnter={() => setHovered('custom')}
                onMouseLeave={() => setHovered(null)}
                style={{
                  ...capsuleBase,
                  ...elevate('custom'),
                  border: '1px solid rgba(234, 88, 12, 0.4)',
                  backgroundColor: 'rgba(234, 88, 12, 0.1)',
                  color: '#fdba74',
                  boxShadow: hovered === 'custom'
                    ? '0 8px 20px -6px rgba(234,88,12,0.4)'
                    : '0 2px 8px rgba(234, 88, 12, 0.1)',
                }}
              >
                <IconWrench size={16} />
                <span>{lang === 'ar' ? 'طلب قطعة خاصة' : 'Custom Request'}</span>
              </button>
            )}

            {onOpenOrdersTracker && (
              <button
                onClick={onOpenOrdersTracker}
                onMouseEnter={() => setHovered('orders')}
                onMouseLeave={() => setHovered(null)}
                style={{
                  ...capsuleBase,
                  ...elevate('orders'),
                  border: '1px solid rgba(248,250,252,0.16)',
                  backgroundColor: 'rgba(248,250,252,0.05)',
                  color: 'rgba(248,250,252,0.85)',
                  boxShadow: hovered === 'orders'
                    ? '0 8px 20px -6px rgba(0,0,0,0.4)'
                    : '0 2px 6px rgba(0,0,0,0.15)',
                }}
              >
                <IconPackage size={16} />
                <span>{lang === 'ar' ? 'طلباتي' : 'Orders'}</span>
              </button>
            )}

            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              onMouseEnter={() => setHovered('lang')}
              onMouseLeave={() => setHovered(null)}
              style={{
                ...capsuleBase,
                ...elevate('lang'),
                border: '1px solid rgba(248,250,252,0.16)',
                backgroundColor: 'rgba(248,250,252,0.05)',
                color: ALABASTER,
                boxShadow: hovered === 'lang'
                  ? '0 8px 20px -6px rgba(0,0,0,0.4)'
                  : '0 2px 6px rgba(0,0,0,0.15)',
              }}
            >
              <IconGlobe size={16} />
              <span>{lang === 'ar' ? 'English' : 'عربي'}</span>
            </button>

            <button
              onClick={onOpenCart}
              onMouseEnter={() => setHovered('cart')}
              onMouseLeave={() => setHovered(null)}
              style={{
                ...capsuleBase,
                ...elevate('cart'),
                position: 'relative',
                border: cartCount > 0 ? '1px solid rgba(234,88,12,0.5)' : '1px solid rgba(248,250,252,0.16)',
                backgroundColor: cartCount > 0 ? 'rgba(234, 88, 12, 0.12)' : 'rgba(248,250,252,0.05)',
                color: cartCount > 0 ? '#fdba74' : ALABASTER,
                boxShadow: hovered === 'cart'
                  ? '0 8px 20px -6px rgba(0,0,0,0.45)'
                  : '0 2px 6px rgba(0,0,0,0.15)',
              }}
            >
              <IconCart size={16} />
              <span>{lang === 'ar' ? 'السلة' : 'Cart'}</span>
              {cartCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-7px',
                    insetInlineEnd: '-6px',
                    backgroundColor: COPPER,
                    color: ALABASTER,
                    borderRadius: '999px',
                    padding: '2px 6px',
                    fontSize: '10.5px',
                    fontWeight: 900,
                    minWidth: '18px',
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(234, 88, 12, 0.55), 0 0 0 2px rgba(9,13,22,0.9)',
                  }}
                >
                  {cartCount}
                </span>
              )}
            </button>

            {session ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <button
                  onClick={() => {
                    if (session.role === 'admin' || session.email?.endsWith('@admin.mawjood.com')) setView('admin');
                    else if (session.role === 'driver' || session.email?.endsWith('@driver.mawjood.com')) setView('driver');
                    else if (session.role === 'garage') setView('dashboard');
                    else setView('profile');
                  }}
                  onMouseEnter={() => setHovered('account')}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    ...capsuleBase,
                    ...elevate('account'),
                    position: 'relative',
                    border: `1px solid ${COPPER}`,
                    background: `linear-gradient(135deg, ${SLATE} 0%, ${OBSIDIAN} 100%)`,
                    color: ALABASTER,
                    paddingInlineStart: '18px',
                    boxShadow: hovered === 'account'
                      ? `0 10px 24px -6px rgba(234,88,12,0.35)`
                      : '0 4px 14px rgba(0,0,0,0.35)',
                  }}
                >
                  <span style={{ position: 'relative', display: 'inline-flex' }}>
                    <IconUser size={16} />
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '-2px',
                        insetInlineEnd: '-2px',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#22c55e',
                        boxShadow: '0 0 0 2px rgba(9,13,22,0.95)',
                      }}
                    />
                  </span>
                  <span>{lang === 'ar' ? 'حسابي' : 'Account'}</span>
                </button>

                <button
                  onClick={onLogout}
                  title={lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                  onMouseEnter={() => setHovered('logout')}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    ...capsuleBase,
                    ...elevate('logout'),
                    padding: '9px 11px',
                    border: '1px solid rgba(220, 38, 38, 0.4)',
                    backgroundColor: 'rgba(220, 38, 38, 0.12)',
                    color: '#fca5a5',
                    boxShadow: hovered === 'logout'
                      ? '0 8px 20px -6px rgba(220,38,38,0.4)'
                      : '0 2px 6px rgba(0,0,0,0.15)',
                  }}
                >
                  <IconLogout size={15} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setView('auth')}
                onMouseEnter={() => setHovered('signin')}
                onMouseLeave={() => setHovered(null)}
                style={{
                  ...capsuleBase,
                  ...elevate('signin'),
                  border: `1px solid ${COPPER}`,
                  background: `linear-gradient(135deg, ${SLATE} 0%, ${OBSIDIAN} 100%)`,
                  color: ALABASTER,
                  padding: '9px 20px',
                  boxShadow: hovered === 'signin'
                    ? `0 10px 24px -6px rgba(234,88,12,0.4)`
                    : '0 4px 14px rgba(0,0,0,0.35)',
                }}
              >
                <IconUser size={16} />
                <span>{lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
