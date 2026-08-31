import React, { useEffect, useRef, useState } from 'react';

/* ============================================================
   Z-INDEX SCALE
   VideoBg: 0 | AmbientRig/HUD: 1 | GlassPanel: 9992 | InteractiveDeck: 9993
   ============================================================ */
const Z_OVERLAY = 9990;
const Z_GLASS = 9992;
const Z_DECK = 9993;

/* Deceleration curves for smooth arrival motions */
const EASE_APPLE = 'cubic-bezier(0.32, 0.72, 0, 1)';
const EASE_OVERSHOOT = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

/* ============================================================
   VIDEO SOURCE — ضع ملف الفيديو داخل مجلد public في مشروعك
   (مثال: public/videos/amgvid.mp4)
   ============================================================ */
const CHASSIS_VIDEO_SRC = '/videos/amgvid.mp4';

export interface WelcomeProps {
  lang: 'ar' | 'en';
  onStart: () => void;
}

export type WelcomeModalProps = WelcomeProps;

/* ============================================================
   BESPOKE ICON SUITE — stroke-based, 1.75px, geometric curves
   ============================================================ */

interface IconProps {
  size?: number;
}

const IconShieldCheck: React.FC<IconProps> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M12 3L19.5 6V11.2C19.5 15.6 16.7 19.5 12 21C7.3 19.5 4.5 15.6 4.5 11.2V6L12 3Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    <path d="M8.7 12.2L10.8 14.3L15.3 9.6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconScan: React.FC<IconProps> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M4.5 8V6C4.5 5.2 5.2 4.5 6 4.5H8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    <path d="M16 4.5H18C18.8 4.5 19.5 5.2 19.5 6V8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    <path d="M19.5 16V18C19.5 18.8 18.8 19.5 18 19.5H16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    <path d="M8 19.5H6C5.2 19.5 4.5 18.8 4.5 18V16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    <path d="M4.5 12H19.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    <circle cx="12" cy="12" r="0.9" fill="currentColor" />
  </svg>
);

const IconTruckFast: React.FC<IconProps> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M2.5 7.5H13.5V15.5H2.5V7.5Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    <path d="M13.5 10.2H17.3L20.5 13.1V15.5H13.5V10.2Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    <circle cx="7" cy="17.5" r="1.7" stroke="currentColor" strokeWidth="1.75" />
    <circle cx="17" cy="17.5" r="1.7" stroke="currentColor" strokeWidth="1.75" />
    <path d="M0.8 10.5H4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    <path d="M0.8 13H2.8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

const IconCompassArrow: React.FC<IconProps> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
    <path d="M15.2 8.8L13.1 13.1L8.8 15.2L10.9 10.9L15.2 8.8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

const IconClose: React.FC<IconProps> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M5 5L19 19" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    <path d="M19 5L5 19" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

const IconLogoFallback: React.FC<IconProps> = ({ size = 30 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M4 15L5.4 9.6C5.7 8.5 6.7 7.7 7.8 7.7H16.2C17.3 7.7 18.3 8.5 18.6 9.6L20 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 15H21V17.5C21 18.3 20.3 19 19.5 19H4.5C3.7 19 3 18.3 3 17.5V15Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    <circle cx="7.5" cy="19" r="1.6" stroke="currentColor" strokeWidth="1.75" />
    <circle cx="16.5" cy="19" r="1.6" stroke="currentColor" strokeWidth="1.75" />
    <path d="M7 11.5H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/* ============================================================
   SCI-FI HUD FRAME — corner brackets + scanning grid
   ============================================================ */

const HudFrame: React.FC = () => (
  <div aria-hidden="true" className="wm-hud" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
    <svg className="wm-hud-corner wm-hud-tl" width="64" height="64" viewBox="0 0 64 64" fill="none">
      <path d="M2 22V6C2 3.8 3.8 2 6 2H22" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="2" cy="2" r="2" fill="currentColor" />
    </svg>
    <svg className="wm-hud-corner wm-hud-tr" width="64" height="64" viewBox="0 0 64 64" fill="none">
      <path d="M62 22V6C62 3.8 60.2 2 58 2H42" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="62" cy="2" r="2" fill="currentColor" />
    </svg>
    <svg className="wm-hud-corner wm-hud-bl" width="64" height="64" viewBox="0 0 64 64" fill="none">
      <path d="M2 42V58C2 60.2 3.8 62 6 62H22" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="2" cy="62" r="2" fill="currentColor" />
    </svg>
    <svg className="wm-hud-corner wm-hud-br" width="64" height="64" viewBox="0 0 64 64" fill="none">
      <path d="M62 42V58C62 60.2 60.2 62 58 62H42" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="62" cy="62" r="2" fill="currentColor" />
    </svg>
    <div className="wm-hud-grid" />
    <div className="wm-hud-scanline" />
  </div>
);

/* ============================================================
   AMBIENT MECHANICAL RIG — gears, driveshaft, piston, coil
   ============================================================ */

const MechanicalRig: React.FC = () => (
  <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
    {/* Gear train */}
    <svg className="wm-gear-train" width="220" height="140" viewBox="0 0 220 140" fill="none">
      <g className="wm-gear-big" style={{ transformOrigin: '70px 70px' }}>
        <circle cx="70" cy="70" r="38" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="70" cy="70" r="10" stroke="currentColor" strokeWidth="1.1" />
        {Array.from({ length: 10 }).map((_, i) => (
          <rect
            key={i}
            x={67}
            y={26}
            width={6}
            height={12}
            rx={1.5}
            stroke="currentColor"
            strokeWidth="1"
            transform={`rotate(${(i * 360) / 10} 70 70)`}
          />
        ))}
      </g>
      <g className="wm-gear-small" style={{ transformOrigin: '156px 70px' }}>
        <circle cx="156" cy="70" r="24" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="156" cy="70" r="7" stroke="currentColor" strokeWidth="1.1" />
        {Array.from({ length: 8 }).map((_, i) => (
          <rect
            key={i}
            x={153}
            y={38}
            width={5.5}
            height={9}
            rx={1.3}
            stroke="currentColor"
            strokeWidth="1"
            transform={`rotate(${(i * 360) / 8} 156 70)`}
          />
        ))}
      </g>
    </svg>

    {/* Driveshaft */}
    <svg className="wm-driveshaft" width="240" height="60" viewBox="0 0 240 60" fill="none">
      <ellipse cx="18" cy="30" rx="14" ry="20" stroke="currentColor" strokeWidth="1.3" />
      <line x1="18" y1="10" x2="18" y2="50" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
      <rect x="18" y="24" width="204" height="12" rx="6" stroke="currentColor" strokeWidth="1.2" />
      <ellipse cx="222" cy="30" rx="14" ry="20" stroke="currentColor" strokeWidth="1.3" />
      <line x1="222" y1="10" x2="222" y2="50" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
    </svg>

    {/* Piston */}
    <svg className="wm-piston-rig" width="70" height="160" viewBox="0 0 70 160" fill="none">
      <rect x="14" y="6" width="42" height="100" rx="4" stroke="currentColor" strokeWidth="1.2" />
      <g className="wm-piston-head">
        <rect x="20" y="16" width="30" height="26" rx="3" stroke="currentColor" strokeWidth="1.2" />
        <line x1="35" y1="42" x2="35" y2="92" stroke="currentColor" strokeWidth="1.4" />
      </g>
      <path d="M20 106L35 130L50 106" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="35" cy="140" r="10" stroke="currentColor" strokeWidth="1.2" />
    </svg>

    {/* Suspension coil */}
    <svg className="wm-coil-rig" width="60" height="150" viewBox="0 0 60 150" fill="none">
      <line x1="30" y1="2" x2="30" y2="20" stroke="currentColor" strokeWidth="1.3" />
      <g className="wm-coil-spring">
        <path
          d="M30 20 L44 32 L16 44 L44 56 L16 68 L44 80 L16 92 L30 104"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <line x1="30" y1="104" x2="30" y2="122" stroke="currentColor" strokeWidth="1.3" />
      <rect x="14" y="122" width="32" height="14" rx="3" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  </div>
);

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export const WelcomeModal: React.FC<WelcomeProps> = ({ lang, onStart }) => {
  const isRtl = lang === 'ar';
  const [videoFinished, setVideoFinished] = useState<boolean>(false);
  const [showDeck, setShowDeck] = useState<boolean>(false);
  const [ctaHover, setCtaHover] = useState<boolean>(false);
  const [dismissHover, setDismissHover] = useState<boolean>(false);
  const [logoError, setLogoError] = useState<boolean>(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const dismissRef = useRef<HTMLButtonElement>(null);

  const OBSIDIAN = '#090D16';
  const SLATE = '#0F172A';
  const TITANIUM = '#1E293B';
  const ALABASTER = '#F8FAFC';
  const COPPER = '#EA580C';
  const COPPER_LIGHT = '#F97316';
  const CYAN = '#38BDF8';

  // معالجة انتهاء الفيديو وإظهار المحتوى بسلاسة
  const handleVideoEnd = () => {
    setVideoFinished(true);
    setTimeout(() => {
      setShowDeck(true);
    }, 250);
  };

  interface Pillar {
    key: string;
    icon: React.ReactElement;
    title: string;
    desc: string;
  }

  const pillars: Pillar[] = [
    {
      key: 'brandnew',
      icon: <IconShieldCheck size={24} />,
      title: lang === 'ar' ? 'قطع جديدة وأصلية 100%' : '100% Factory-New & Certified Guarantee',
      desc:
        lang === 'ar'
          ? 'قطع غيار وكالة وتجارية أصلية جديدة — نضمن لك أعلى معايير الجودة.'
          : '100% factory-sealed Genuine OEM & certified aftermarket parts with full warranty.',
    },
    {
      key: 'aiscan',
      icon: <IconScan size={24} />,
      title: lang === 'ar' ? 'فحص الاستمارة والشاصي الذكي' : 'Instant AI VIN & Istemara Scanner',
      desc:
        lang === 'ar'
          ? 'محرك ذكاء اصطناعي فوري لمطابقة رقم الشاصي (17 حرف) مع سيارتك لضمان توافق القطعة بنسبة 100% قبل الشراء.'
          : 'AI-powered optical registration & 17-digit VIN decoding ensuring 100% precise vehicle fitment.',
    },
    {
      key: 'delivery',
      icon: <IconTruckFast size={24} />,
      title: lang === 'ar' ? 'توصيل فوري لجميع مناطق قطر' : 'Express Qatar Doorstep Delivery',
      desc:
        lang === 'ar'
          ? 'توصيل سريع ومباشر لباب منزلك أو الكراج خلال ساعتين إلى 24 ساعة في كافة مناطق ومدن دولة قطر.'
          : 'Rapid fulfillment across all Qatar municipalities within 2 to 24 hours directly to your doorstep or workshop.',
    },
  ];

  // Dynamic viewport height fix for mobile browsers
  useEffect(() => {
    const setVh = (): void => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--wm-vh', `${vh}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', setVh);
    return () => {
      window.removeEventListener('resize', setVh);
      window.removeEventListener('orientationchange', setVh);
    };
  }, []);

  // مؤقت أمان تلقائي في حال حدوث بطء في تحميل الفيديو أو حجب التشغيل التلقائي
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!videoFinished) {
        handleVideoEnd();
      }
    }, 9000);
    return () => clearTimeout(fallbackTimer);
  }, [videoFinished]);

  // Focus management & Escape key handling
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;

    if (showDeck) {
      ctaRef.current?.focus();
    }

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onStart();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [showDeck, onStart]);

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: 'calc(var(--wm-vh, 1vh) * 100)',
        zIndex: Z_OVERLAY,
        direction: isRtl ? 'rtl' : 'ltr',
        fontFamily: isRtl ? "'Cairo', sans-serif" : "'Cairo', system-ui, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 'max(20px, env(safe-area-inset-top)) max(18px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(18px, env(safe-area-inset-left))',
        backgroundColor: OBSIDIAN,
        overflow: 'hidden',
      }}
    >
      <style>{`
        /* ================= FULLSCREEN VIDEO BACKGROUND ================= */
        .wm-video-container {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 0;
        }

        .wm-fullscreen-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: opacity 1.2s ease, filter 1.2s ease, transform 1.2s ease;
          opacity: ${videoFinished ? 0.22 : 1};
          filter: ${videoFinished ? 'blur(10px) brightness(0.55)' : 'none'};
          transform: ${videoFinished ? 'scale(1.05)' : 'scale(1)'};
        }

        .wm-video-overlay {
          position: absolute;
          inset: 0;
          transition: background 1s ease;
          background: ${
            videoFinished
              ? `radial-gradient(ellipse at 30% 20%, rgba(56,189,248,0.12) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(234,88,12,0.15) 0%, transparent 50%), linear-gradient(160deg, ${OBSIDIAN}e6 0%, ${SLATE}d9 55%, ${OBSIDIAN}f2 100%)`
              : 'rgba(0,0,0,0.15)'
          };
        }

        /* زر تخطي الفيديو */
        .wm-skip-video-btn {
          position: absolute;
          bottom: max(28px, env(safe-area-inset-bottom));
          inset-inline-end: max(28px, env(safe-area-inset-right));
          z-index: 10;
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(248, 250, 252, 0.2);
          color: ${ALABASTER};
          padding: 8px 18px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.25s ease;
        }
        .wm-skip-video-btn:hover {
          background: rgba(234, 88, 12, 0.85);
          border-color: ${COPPER_LIGHT};
          transform: scale(1.05);
        }

        /* ================= AMBIENT RIG & HUD ================= */
        @keyframes wm-gear-cw { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes wm-gear-ccw { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes wm-drive-spin { from { transform: translateX(0); } to { transform: translateX(-24px); } }
        @keyframes wm-piston-stroke { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(18px); } }
        @keyframes wm-coil-breathe { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(0.72); } }
        @keyframes wm-drift { 0%, 100% { transform: translateY(0px) translateX(0px); } 50% { transform: translateY(-10px) translateX(6px); } }

        .wm-gear-train { position: absolute; top: 8%; inset-inline-start: 6%; color: ${ALABASTER}; opacity: 0.08; animation: wm-drift 16s ease-in-out infinite; }
        .wm-gear-big { animation: wm-gear-cw 18s linear infinite; }
        .wm-gear-small { animation: wm-gear-ccw 12.6s linear infinite; }
        .wm-driveshaft { position: absolute; bottom: 12%; inset-inline-start: 4%; color: ${COPPER}; opacity: 0.09; overflow: visible; }
        .wm-driveshaft rect { animation: wm-drive-spin 0.9s linear infinite; }
        .wm-piston-rig { position: absolute; top: 8%; inset-inline-end: 8%; color: ${ALABASTER}; opacity: 0.08; }
        .wm-piston-head { animation: wm-piston-stroke 1.3s cubic-bezier(0.45, 0, 0.55, 1) infinite; }
        .wm-coil-rig { position: absolute; bottom: 8%; inset-inline-end: 10%; color: ${COPPER_LIGHT}; opacity: 0.09; }
        .wm-coil-spring { animation: wm-coil-breathe 2.1s cubic-bezier(0.45, 0, 0.55, 1) infinite; transform-origin: 30px 20px; }

        .wm-hud-corner { position: absolute; color: ${CYAN}; opacity: 0.55; }
        .wm-hud-tl { top: 16px; inset-inline-start: 16px; }
        .wm-hud-tr { top: 16px; inset-inline-end: 16px; transform: scaleX(${isRtl ? '1' : '-1'}); }
        .wm-hud-bl { bottom: 16px; inset-inline-start: 16px; }
        .wm-hud-br { bottom: 16px; inset-inline-end: 16px; transform: scaleX(${isRtl ? '1' : '-1'}); }
        .wm-hud-grid {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(56,189,248,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.04) 1px, transparent 1px);
          background-size: 34px 34px;
          mask-image: radial-gradient(ellipse at center, black 0%, transparent 72%);
          -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 72%);
        }

        /* ================= REVEAL OF INTRO CONTENT ================= */
        @keyframes wm-deck-appear {
          0% { opacity: 0; transform: translateY(32px) scale(0.96); filter: blur(6px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }

        @keyframes wm-logo-descent {
          0% { transform: translateY(-50px) scale(0.6); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }

        .wm-content-animated {
          animation: wm-deck-appear 0.85s ${EASE_APPLE} both;
        }

        .wm-logo-animated {
          animation: wm-logo-descent 0.7s ${EASE_OVERSHOOT} both;
        }

        .wm-deck-specular {
          position: absolute; top: 0; left: 0; width: 40%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent);
          pointer-events: none;
        }

        .wm-card { transition: transform 0.25s ${EASE_APPLE}, border-color 0.25s ease; }
        .wm-card:hover { transform: translateY(-4px); border-color: rgba(234, 88, 12, 0.45) !important; }

        .wm-cta:focus-visible, .wm-dismiss:focus-visible {
          outline: 2px solid ${COPPER_LIGHT};
          outline-offset: 3px;
        }

        /* Responsive Breakpoints */
        @media (max-width: 760px) {
          .wm-pillars { grid-template-columns: 1fr !important; gap: 10px !important; }
        }
        @media (max-width: 428px) {
          .wm-deck-panel { padding: 22px 16px 20px !important; border-radius: 20px !important; }
        }
      `}</style>

      {/* 1. الفيديو بكامل الشاشة */}
      <div className="wm-video-container">
        <video
          ref={videoRef}
          src={CHASSIS_VIDEO_SRC}
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnd}
          onError={handleVideoEnd}
          className="wm-fullscreen-video"
        />
        <div className="wm-video-overlay" />
      </div>

      {/* 2. زر تخطي الفيديو يظهر أثناء تشغيل الفيديو فقط */}
      {!videoFinished && (
        <button
          onClick={handleVideoEnd}
          className="wm-skip-video-btn"
          aria-label="تخطي الفيديو"
        >
          <span>{lang === 'ar' ? 'تخطي' : 'Skip'}</span>
          <span style={{ transform: isRtl ? 'scaleX(-1)' : 'none', display: 'inline-block' }}>❯</span>
        </button>
      )}

      {/* 3. عناصر التصميم تظهر عند انتهاء الفيديو */}
      {showDeck && (
        <>
          <MechanicalRig />
          <HudFrame />

          <div className="wm-content-wrap wm-content-animated" style={{ position: 'relative', zIndex: Z_GLASS, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            {/* الشعار */}
            <div style={{ position: 'relative', marginBottom: '16px' }} className="wm-logo-animated">
              <div
                style={{
                  width: '74px',
                  height: '74px',
                  borderRadius: '20px',
                  background: `linear-gradient(145deg, ${OBSIDIAN} 0%, ${TITANIUM} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid rgba(234, 88, 12, 0.5)`,
                  boxShadow: `0 0 30px rgba(234, 88, 12, 0.35), 0 10px 24px rgba(0,0,0,0.5)`,
                  overflow: 'hidden',
                }}
              >
                {!logoError ? (
                  <img
                    src="/favicon.svg"
                    alt="Mawjood Auto"
                    width={36}
                    height={36}
                    style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(234,88,12,0.4))' }}
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <span style={{ color: COPPER_LIGHT, display: 'inline-flex' }}>
                    <IconLogoFallback size={34} />
                  </span>
                )}
              </div>
            </div>

            {/* اسم المنصة */}
            <h2
              id="welcome-modal-title"
              style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px', margin: 0 }}
            >
              <span style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, color: ALABASTER, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                {lang === 'ar' ? 'موجود' : 'Mawjood'}
              </span>
              <span style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, color: COPPER, letterSpacing: '-0.5px', lineHeight: 1.1, textShadow: '0 0 22px rgba(234,88,12,0.5)' }}>
                {lang === 'ar' ? 'أوتو' : 'Auto'}
              </span>
            </h2>

            {/* العنوان الفرعي */}
            <p
              style={{
                fontSize: '1rem',
                marginBottom: '24px',
                marginTop: '6px',
                color: 'rgba(248,250,252,0.75)',
                maxWidth: '540px',
                marginInline: 'auto',
                lineHeight: 1.6,
                textAlign: 'center',
                padding: '0 12px',
              }}
            >
              {lang === 'ar'
                ? 'منصتك الأولى لقطع غيار السيارات الجديدة والمعتمدة في قطر'
                : "Qatar's Premier Ecosystem for 100% Brand-New & Genuine Auto Spare Parts"}
            </p>

            {/* بطاقة الواجهة الزجاجية والمميزات */}
            <div
              className="wm-deck-panel"
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '880px',
                background: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                border: '1px solid rgba(226, 232, 240, 0.16)',
                borderRadius: '26px',
                boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7), 0 8px 24px rgba(234,88,12,0.1)',
                padding: '30px 28px 28px',
                textAlign: 'center',
                overflow: 'hidden',
              }}
            >
              <div aria-hidden="true" className="wm-deck-specular" />

              {/* شارة الجودة */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '5px 16px',
                  borderRadius: '999px',
                  border: '1px solid rgba(234, 88, 12, 0.45)',
                  backgroundColor: 'rgba(234, 88, 12, 0.12)',
                  color: '#fdba74',
                  fontWeight: 800,
                  fontSize: '11.5px',
                  letterSpacing: isRtl ? '0px' : '0.6px',
                  marginBottom: '22px',
                }}
              >
                <IconShieldCheck size={14} />
                <span>{lang === 'ar' ? 'قطع جديدة ومضمونة 100%' : '100% Factory-New Guarantee'}</span>
              </div>

              {/* الأعمدة الثلاثة */}
              <div
                className="wm-pillars"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                  marginBottom: '28px',
                  textAlign: isRtl ? 'right' : 'left',
                }}
              >
                {pillars.map((p) => (
                  <div
                    key={p.key}
                    className="wm-card"
                    style={{
                      background: 'rgba(248, 250, 252, 0.04)',
                      border: '1px solid rgba(248, 250, 252, 0.12)',
                      borderRadius: '16px',
                      padding: '16px 14px',
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: `linear-gradient(145deg, ${TITANIUM} 0%, ${OBSIDIAN} 100%)`,
                        border: '1px solid rgba(234,88,12,0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: COPPER_LIGHT,
                        marginBottom: '10px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
                      }}
                    >
                      {p.icon}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: ALABASTER, marginBottom: '5px', lineHeight: 1.35 }}>{p.title}</div>
                    <div style={{ fontSize: '11.5px', color: 'rgba(248,250,252,0.65)', lineHeight: 1.55, fontWeight: 500 }}>{p.desc}</div>
                  </div>
                ))}
              </div>

              {/* زر الدخول الرئيسي */}
              <button
                ref={ctaRef}
                className="wm-cta"
                onClick={onStart}
                onMouseEnter={() => setCtaHover(true)}
                onMouseLeave={() => setCtaHover(false)}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  padding: '15px 44px',
                  fontSize: '1rem',
                  background: `linear-gradient(135deg, ${COPPER} 0%, ${COPPER_LIGHT} 100%)`,
                  color: ALABASTER,
                  border: 'none',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontFamily: "'Cairo', system-ui, sans-serif",
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: `transform 0.25s ${EASE_APPLE}, box-shadow 0.25s ease`,
                  transform: ctaHover ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
                  boxShadow: '0 12px 30px -6px rgba(234,88,12,0.55), 0 4px 14px rgba(0,0,0,0.4)',
                  minHeight: '48px',
                }}
              >
                <span style={{ position: 'relative', zIndex: 1 }}>
                  {lang === 'ar' ? 'ابدأ استعراض القطع المتوافقة مع سيارتك' : 'Explore Compatible Parts Catalog'}
                </span>
                <span style={{ position: 'relative', zIndex: 1, display: 'inline-flex', transform: isRtl ? 'scaleX(-1)' : 'none' }}>
                  <IconCompassArrow size={17} />
                </span>
              </button>
            </div>
          </div>

          {/* زر الإغلاق العلوي */}
          <button
            ref={dismissRef}
            className="wm-dismiss"
            aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}
            onClick={onStart}
            onMouseEnter={() => setDismissHover(true)}
            onMouseLeave={() => setDismissHover(false)}
            style={{
              position: 'absolute',
              top: 'max(20px, env(safe-area-inset-top))',
              insetInlineEnd: 'max(20px, env(safe-area-inset-right))',
              zIndex: Z_DECK,
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '1px solid rgba(248,250,252,0.18)',
              backgroundColor: dismissHover ? 'rgba(248,250,252,0.15)' : 'rgba(248,250,252,0.06)',
              color: ALABASTER,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              transform: dismissHover ? 'scale(1.08)' : 'scale(1)',
            }}
          >
            <IconClose size={15} />
          </button>
        </>
      )}
    </div>
  );
};

export default WelcomeModal;
