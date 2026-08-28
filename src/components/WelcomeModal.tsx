import React, { useState } from 'react';
import { t } from '../utils/translations';

interface WelcomeProps {
  lang: 'ar' | 'en';
  onStart: () => void;
}

/* ============================================================
   BESPOKE ICON SUITE — stroke-based, 1.75px, geometric curves
   ============================================================ */

const IconShieldCheck: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3L19.5 6V11.2C19.5 15.6 16.7 19.5 12 21C7.3 19.5 4.5 15.6 4.5 11.2V6L12 3Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
    <path d="M8.7 12.2L10.8 14.3L15.3 9.6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconScan: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.5 8V6C4.5 5.2 5.2 4.5 6 4.5H8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
    <path d="M16 4.5H18C18.8 4.5 19.5 5.2 19.5 6V8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
    <path d="M19.5 16V18C19.5 18.8 18.8 19.5 18 19.5H16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
    <path d="M8 19.5H6C5.2 19.5 4.5 18.8 4.5 18V16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
    <path d="M4.5 12H19.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
    <circle cx="12" cy="12" r="0.9" fill="currentColor"/>
  </svg>
);

const IconTruckFast: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 7.5H13.5V15.5H2.5V7.5Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
    <path d="M13.5 10.2H17.3L20.5 13.1V15.5H13.5V10.2Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
    <circle cx="7" cy="17.5" r="1.7" stroke="currentColor" strokeWidth="1.75"/>
    <circle cx="17" cy="17.5" r="1.7" stroke="currentColor" strokeWidth="1.75"/>
    <path d="M0.8 10.5H4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
    <path d="M0.8 13H2.8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
  </svg>
);

const IconCompassArrow: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75"/>
    <path d="M15.2 8.8L13.1 13.1L8.8 15.2L10.9 10.9L15.2 8.8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
  </svg>
);

const IconGearGlyph: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M12 2.5V5.2M12 18.8V21.5M21.5 12H18.8M5.2 12H2.5M18.5 5.5L16.6 7.4M7.4 16.6L5.5 18.5M18.5 18.5L16.6 16.6M7.4 7.4L5.5 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const IconClose: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 5L19 19" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
    <path d="M19 5L5 19" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
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
    <div className="wm-gear wm-gear-a">
      <IconGearGlyph size={220} />
    </div>
    <div className="wm-gear wm-gear-b">
      <IconGearGlyph size={140} />
    </div>
    <div className="wm-gear wm-gear-c">
      <IconGearGlyph size={90} />
    </div>

    <svg className="wm-piston" width="260" height="46" viewBox="0 0 260 46" fill="none">
      <line x1="8" y1="23" x2="220" y2="23" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="220" cy="23" r="12" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="23" r="5" stroke="currentColor" strokeWidth="1.2" />
      <line x1="200" y1="23" x2="240" y2="23" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.4" />
    </svg>

    <svg className="wm-rotor" width="140" height="140" viewBox="0 0 140 140" fill="none">
      <circle cx="70" cy="70" r="62" stroke="currentColor" strokeWidth="1" />
      <circle cx="70" cy="70" r="44" stroke="currentColor" strokeWidth="1" strokeDasharray="5 7" />
      <circle cx="70" cy="70" r="10" stroke="currentColor" strokeWidth="1" />
    </svg>

    <span className="wm-spark wm-spark-1" />
    <span className="wm-spark wm-spark-2" />
    <span className="wm-spark wm-spark-3" />
    <span className="wm-spark wm-spark-4" />
    <span className="wm-spark wm-spark-5" />

    <div className="wm-vignette" />
  </div>
);

export const WelcomeModal: React.FC<WelcomeProps> = ({ lang, onStart }) => {
  const isRtl = lang === 'ar';
  const [ctaHover, setCtaHover] = useState(false);
  const [dismissHover, setDismissHover] = useState(false);

  const OBSIDIAN = '#090D16';
  const SLATE = '#0F172A';
  const ALABASTER = '#F8FAFC';
  const COPPER = '#EA580C';
  const COPPER_LIGHT = '#F97316';

  const pillars = [
    {
      key: 'brandnew',
      icon: <IconShieldCheck size={24} />,
      title: lang === 'ar' ? '100% قطع أصلية جديدة' : '100% Brand-New Guarantee',
      desc:
        lang === 'ar'
          ? 'لا قطع تالفة، لا قطع مستعملة إطلاقًا — قطع أصلية OEM وبديل فاخر معتمدة من المصنع فقط.'
          : 'Zero scrap. Zero used parts. Certified factory-new OEM & premium aftermarket only.',
    },
    {
      key: 'aiscan',
      icon: <IconScan size={24} />,
      title: lang === 'ar' ? 'مسح ذكي بالاستمارة و VIN' : 'Smart AI Istemara & VIN Scanner',
      desc:
        lang === 'ar'
          ? 'مطابقة فورية بدقة 100% لقطع سيارتك عبر الذكاء الاصطناعي.'
          : 'Instant AI-powered 100% vehicle fitment match, every time.',
    },
    {
      key: 'delivery',
      icon: <IconTruckFast size={24} />,
      title: lang === 'ar' ? 'توصيل قطر السريع' : 'Express Qatar Delivery',
      desc:
        lang === 'ar'
          ? 'توصيل سريع إلى باب منزلك خلال 24 إلى 48 ساعة فقط.'
          : 'Rapid doorstep fulfillment within 24–48 hours across Qatar.',
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 9999,
        direction: isRtl ? 'rtl' : 'ltr',
        fontFamily: 'Cairo, system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px',
        background: `radial-gradient(ellipse at 30% 20%, rgba(234,88,12,0.10) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(249,115,22,0.08) 0%, transparent 50%), linear-gradient(160deg, ${OBSIDIAN} 0%, ${SLATE} 55%, ${OBSIDIAN} 100%)`,
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes wm-spin-cw {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes wm-spin-ccw {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes wm-drift {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-10px) translateX(6px); }
        }
        @keyframes wm-spark-pulse {
          0%, 100% { opacity: 0.06; transform: scale(0.75); }
          50% { opacity: 0.4; transform: scale(1.2); }
        }
        @keyframes wm-fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes wm-shimmer {
          0% { transform: translateX(-120%) skewX(-18deg); }
          100% { transform: translateX(220%) skewX(-18deg); }
        }
        @keyframes wm-glow-pulse {
          0%, 100% { box-shadow: 0 0 24px rgba(234,88,12,0.35), 0 12px 30px rgba(0,0,0,0.5); }
          50% { box-shadow: 0 0 40px rgba(234,88,12,0.55), 0 12px 30px rgba(0,0,0,0.5); }
        }

        .wm-gear {
          position: absolute;
          color: ${ALABASTER};
          opacity: 0.05;
        }
        .wm-gear-a {
          top: -60px;
          inset-inline-end: -40px;
          animation: wm-spin-cw 60s linear infinite;
        }
        .wm-gear-b {
          bottom: -40px;
          inset-inline-start: -30px;
          animation: wm-spin-ccw 42s linear infinite;
        }
        .wm-gear-c {
          top: 55%;
          inset-inline-end: 12%;
          animation: wm-spin-cw 30s linear infinite;
          opacity: 0.045;
        }
        .wm-piston {
          position: absolute;
          top: 12%;
          inset-inline-start: 8%;
          color: ${COPPER};
          opacity: 0.07;
          animation: wm-drift 14s ease-in-out infinite;
        }
        .wm-rotor {
          position: absolute;
          bottom: 6%;
          inset-inline-end: 6%;
          color: ${ALABASTER};
          opacity: 0.05;
          animation: wm-spin-cw 70s linear infinite;
        }
        .wm-spark {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: ${COPPER_LIGHT};
        }
        .wm-spark-1 { top: 18%; inset-inline-start: 25%; animation: wm-spark-pulse 4.5s ease-in-out infinite; }
        .wm-spark-2 { top: 65%; inset-inline-start: 40%; animation: wm-spark-pulse 5.8s ease-in-out infinite 1.1s; }
        .wm-spark-3 { top: 35%; inset-inline-end: 30%; animation: wm-spark-pulse 3.8s ease-in-out infinite 0.5s; }
        .wm-spark-4 { top: 78%; inset-inline-end: 18%; animation: wm-spark-pulse 5s ease-in-out infinite 1.8s; }
        .wm-spark-5 { top: 10%; inset-inline-end: 45%; animation: wm-spark-pulse 4.1s ease-in-out infinite 0.9s; }

        .wm-vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 40%, rgba(9,13,22,0.65) 100%);
        }

        .wm-fade-in {
          animation: wm-fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .wm-card {
          transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.25s ease, background-color 0.25s ease;
        }
        .wm-card:hover {
          transform: translateY(-4px);
        }

        @media (max-width: 760px) {
          .wm-pillars {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <AmbientEngineLayer />

      {/* ===== Modal Glass Panel ===== */}
      <div
        className="wm-fade-in"
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '860px',
          background: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(226, 232, 240, 0.14)',
          borderRadius: '28px',
          boxShadow: '0 30px 80px -20px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.06)',
          padding: '48px 40px 40px',
          textAlign: 'center',
          animationDelay: '0.05s',
        }}
      >
        {/* Emblem */}
        <div
          style={{
            width: '68px',
            height: '68px',
            margin: '0 auto 22px',
            borderRadius: '18px',
            background: `linear-gradient(145deg, ${OBSIDIAN} 0%, ${SLATE} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid rgba(234, 88, 12, 0.5)`,
            boxShadow: `0 0 0 1px rgba(248,250,252,0.05), 0 0 30px rgba(234, 88, 12, 0.28), inset 0 1px 1px rgba(255,255,255,0.08)`,
          }}
        >
          <IconShieldCheck size={30} />
          <span style={{ color: COPPER, position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} />
        </div>

        {/* Recolor emblem icon via wrapper */}
        <style>{`
          .wm-fade-in > div:first-of-type svg { color: ${COPPER_LIGHT}; }
        `}</style>

        <h1
          style={{
            fontSize: 'clamp(1.9rem, 4vw, 2.7rem)',
            fontWeight: 900,
            marginBottom: '12px',
            color: ALABASTER,
            letterSpacing: '-0.5px',
            lineHeight: 1.15,
          }}
        >
          {t[lang].welcomeTitle}
        </h1>

        <p
          style={{
            fontSize: '1.05rem',
            marginBottom: '10px',
            color: 'rgba(248,250,252,0.72)',
            maxWidth: '560px',
            marginInline: 'auto',
            lineHeight: 1.7,
          }}
        >
          {t[lang].welcomeDesc}
        </p>

        {/* Brand-new badge strip */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '999px',
            border: '1px solid rgba(234, 88, 12, 0.45)',
            backgroundColor: 'rgba(234, 88, 12, 0.1)',
            color: '#fdba74',
            fontWeight: 800,
            fontSize: '12px',
            letterSpacing: isRtl ? '0px' : '0.6px',
            marginBottom: '36px',
            marginTop: '6px',
            textTransform: isRtl ? 'none' : 'uppercase',
          }}
        >
          <IconShieldCheck size={14} />
          <span>{lang === 'ar' ? 'صفر قطع مستعملة — أصلية جديدة 100%' : 'Zero Used Parts — 100% Brand New'}</span>
        </div>

        {/* Feature Pillars */}
        <div
          className="wm-pillars"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '14px',
            marginBottom: '38px',
            textAlign: isRtl ? 'right' : 'left',
          }}
        >
          {pillars.map((p, idx) => (
            <div
              key={p.key}
              className="wm-card"
              style={{
                background: 'rgba(248, 250, 252, 0.04)',
                border: '1px solid rgba(248, 250, 252, 0.12)',
                borderRadius: '18px',
                padding: '18px 16px',
                animation: `wm-fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both`,
                animationDelay: `${0.15 + idx * 0.1}s`,
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: `linear-gradient(145deg, ${SLATE} 0%, ${OBSIDIAN} 100%)`,
                  border: '1px solid rgba(234,88,12,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: COPPER_LIGHT,
                  marginBottom: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
                }}
              >
                {p.icon}
              </div>
              <div
                style={{
                  fontSize: '13.5px',
                  fontWeight: 800,
                  color: ALABASTER,
                  marginBottom: '5px',
                  lineHeight: 1.35,
                }}
              >
                {p.title}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'rgba(248,250,252,0.6)',
                  lineHeight: 1.55,
                  fontWeight: 500,
                }}
              >
                {p.desc}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onStart}
          onMouseEnter={() => setCtaHover(true)}
          onMouseLeave={() => setCtaHover(false)}
          style={{
            position: 'relative',
            overflow: 'hidden',
            padding: '16px 46px',
            fontSize: '1.02rem',
            background: `linear-gradient(135deg, ${COPPER} 0%, ${COPPER_LIGHT} 100%)`,
            color: ALABASTER,
            border: 'none',
            borderRadius: '999px',
            cursor: 'pointer',
            fontWeight: 800,
            fontFamily: 'Cairo, system-ui, sans-serif',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            letterSpacing: isRtl ? '0px' : '0.3px',
            transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1)',
            transform: ctaHover ? 'translateY(-3px)' : 'translateY(0)',
            animation: ctaHover
              ? 'wm-glow-pulse 1.6s ease-in-out infinite'
              : 'none',
            boxShadow: '0 12px 30px -6px rgba(234,88,12,0.5), 0 4px 14px rgba(0,0,0,0.4)',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '40%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)',
              animation: ctaHover ? 'wm-shimmer 1.1s ease-in-out infinite' : 'none',
              pointerEvents: 'none',
            }}
          />
          <span style={{ position: 'relative', zIndex: 1 }}>{t[lang].startShopping}</span>
          <span
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'inline-flex',
              transform: isRtl ? 'scaleX(-1)' : 'none',
            }}
          >
            <IconCompassArrow size={17} />
          </span>
        </button>
      </div>

      {/* Optional close affordance for future use (non-blocking, decorative-safe) */}
      <button
        aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}
        onClick={onStart}
        onMouseEnter={() => setDismissHover(true)}
        onMouseLeave={() => setDismissHover(false)}
        style={{
          position: 'absolute',
          top: '22px',
          insetInlineEnd: '22px',
          zIndex: 2,
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: '1px solid rgba(248,250,252,0.16)',
          backgroundColor: dismissHover ? 'rgba(248,250,252,0.12)' : 'rgba(248,250,252,0.05)',
          color: 'rgba(248,250,252,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'background-color 0.2s ease, transform 0.2s ease',
          transform: dismissHover ? 'scale(1.08)' : 'scale(1)',
        }}
      >
        <IconClose size={15} />
      </button>
    </div>
  );
};

export default WelcomeModal;
