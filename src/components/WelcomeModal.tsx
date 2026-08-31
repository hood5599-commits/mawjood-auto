import React, { useEffect, useRef, useState } from 'react';

/* ============================================================
   Z-INDEX SCALE
   VideoBg: 0 | Rig/Hud: 1 | GlassPanel: 9992 | InteractiveDeck: 9993 | Overlay: 9990
   ============================================================ */
const Z_OVERLAY = 9990;
const Z_GLASS = 9992;
const Z_DECK = 9993;

/* Apple's signature spring deceleration curve */
const EASE_APPLE = 'cubic-bezier(0.32, 0.72, 0, 1)';
const EASE_OVERSHOOT = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

/* ============================================================
   VIDEO SOURCE
   ============================================================ */
const CHASSIS_VIDEO_SRC = '/videos/amgvid.mp4';

// كم ثانية قبل نهاية الفيديو تظهر الشاشة الترحيبية
const REVEAL_BEFORE_END_SECONDS = 1.8;

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
   SCI-FI HUD FRAME
   ============================================================ */
const HudFrame: React.FC<{ isRtl: boolean }> = ({ isRtl }) => (
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
   AMBIENT MECHANICAL RIG
   ============================================================ */
const MechanicalRig: React.FC = () => (
  <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
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

    <svg className="wm-driveshaft" width="240" height="60" viewBox="0 0 240 60" fill="none">
      <ellipse cx="18" cy="30" rx="14" ry="20" stroke="currentColor" strokeWidth="1.3" />
      <line x1="18" y1="10" x2="18" y2="50" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
      <rect x="18" y="24" width="204" height="12" rx="6" stroke="currentColor" strokeWidth="1.2" />
      <ellipse cx="222" cy="30" rx="14" ry="20" stroke="currentColor" strokeWidth="1.3" />
      <line x1="222" y1="10" x2="222" y2="50" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
    </svg>

    <div className="wm-rig-vignette" />
  </div>
);

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export const WelcomeModal: React.FC<WelcomeProps> = ({ lang, onStart }) => {
  const isRtl = lang === 'ar';
  const [ctaHover, setCtaHover] = useState<boolean>(false);
  const [dismissHover, setDismissHover] = useState<boolean>(false);
  const [logoError, setLogoError] = useState<boolean>(false);

  // حالة إظهار المحتوى الترحيبي (يظهر قبل نهاية الفيديو)
  const [showContent, setShowContent] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const dismissRef = useRef<HTMLButtonElement>(null);

  const OBSIDIAN = '#090D16';
  const SLATE = '#0F172A';
  const TITANIUM = '#1E293B';
  const ALABASTER = '#F8FAFC';
  const COPPER = '#EA580C';
  const COPPER_LIGHT = '#F97316';
  const CYAN = '#38BDF8';

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
          ? 'قطع غيار وكالة وتجارية أصلية جديدة — نضمن لك أعلى معايير الجودة والضمان الذهبي.'
          : '100% factory-sealed Genuine OEM & certified aftermarket parts with full warranty. Zero compromises.',
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

  // مراقبة توقيت الفيديو لإظهار المحتوى قبل نهايته بقليل
  const handleTimeUpdate = () => {
    if (!videoRef.current || showContent) return;
    const { currentTime, duration } = videoRef.current;
    if (duration > 0 && duration - currentTime <= REVEAL_BEFORE_END_SECONDS) {
      setShowContent(true);
    }
  };

  // حماية احتياطية لضمان ظهور المحتوى إذا كان الفيديو قصيراً أو واجه مشكلة
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      setShowContent(true);
    }, 4500);

    return () => clearTimeout(fallbackTimer);
  }, []);

  // تعديل ارتفاع الشاشة للأجهزة الذكية
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

  // إدارة الفوكس وزر الخروج Escape
  useEffect(() => {
    if (showContent) {
      ctaRef.current?.focus();
    }

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onStart();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showContent, onStart]);

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
        padding: 'max(20px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))',
        backgroundColor: OBSIDIAN,
        overflow: 'hidden',
      }}
    >
      <style>{`
        /* ================= FULLSCREEN VIDEO BACKGROUND ================= */
        .wm-bg-video-container {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 0;
          pointer-events: none;
        }

        .wm-bg-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          transition: filter 1.2s ease, transform 1.2s ease;
        }

        .wm-bg-overlay {
          position: absolute;
          inset: 0;
          transition: background 1.2s ease;
          pointer-events: none;
        }

        /* ================= AMBIENT RIG ================= */
        @keyframes wm-gear-cw { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes wm-gear-ccw { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes wm-drive-spin { from { transform: translateX(0); } to { transform: translateX(-24px); } }

        .wm-gear-train { position: absolute; top: 8%; inset-inline-start: 5%; color: ${ALABASTER}; opacity: 0.08; }
        .wm-gear-big { animation: wm-gear-cw 18s linear infinite; }
        .wm-gear-small { animation: wm-gear-ccw 12.6s linear infinite; }
        .wm-driveshaft { position: absolute; bottom: 10%; inset-inline-start: 4%; color: ${COPPER}; opacity: 0.09; }
        .wm-driveshaft rect { animation: wm-drive-spin 0.9s linear infinite; }
        .wm-rig-vignette { position: absolute; inset: 0; background: radial-gradient(ellipse at center, transparent 40%, rgba(9,13,22,0.7) 100%); }

        /* ================= HUD ================= */
        .wm-hud-corner { position: absolute; color: ${CYAN}; opacity: 0.45; }
        .wm-hud-tl { top: 16px; inset-inline-start: 16px; }
        .wm-hud-tr { top: 16px; inset-inline-end: 16px; transform: scaleX(${isRtl ? '1' : '-1'}); }
        .wm-hud-bl { bottom: 16px; inset-inline-start: 16px; }
        .wm-hud-br { bottom: 16px; inset-inline-end: 16px; transform: scaleX(${isRtl ? '1' : '-1'}); }
        .wm-hud-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(56,189,248,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56,189,248,0.035) 1px, transparent 1px);
          background-size: 32px 32px;
          mask-image: radial-gradient(ellipse at center, black 0%, transparent 75%);
          -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 75%);
        }

        /* ================= CONTENT SMOOTH REVEAL ================= */
        @keyframes wm-content-slideup {
          0% { opacity: 0; transform: translateY(32px) scale(0.96); filter: blur(6px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0px); }
        }

        @keyframes wm-logo-descent {
          0% { transform: translateY(-40px) scale(0.6); opacity: 0; }
          65% { transform: translateY(6px) scale(1.06); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }

        .wm-content-entering {
          animation: wm-content-slideup 0.85s ${EASE_APPLE} both;
        }

        .wm-logo-entering {
          animation: wm-logo-descent 0.75s ${EASE_OVERSHOOT} both;
        }

        .wm-card { transition: transform 0.25s ${EASE_APPLE}, border-color 0.25s ease, background-color 0.25s ease; }
        .wm-card:hover { transform: translateY(-4px); }

        @keyframes shimmerSweep { 0% { transform: translateX(-120%) skewX(-18deg); } 100% { transform: translateX(220%) skewX(-18deg); } }
        @keyframes wm-glow-pulse {
          0%, 100% { box-shadow: 0 0 24px rgba(234,88,12,0.4), 0 12px 30px rgba(0,0,0,0.5); }
          50% { box-shadow: 0 0 42px rgba(234,88,12,0.65), 0 12px 30px rgba(0,0,0,0.5); }
        }

        @media (max-width: 760px) {
          .wm-pillars { grid-template-columns: 1fr !important; gap: 10px !important; }
          .wm-deck-panel { padding: 22px 16px 20px !important; border-radius: 22px !important; }
        }
      `}</style>

      {/* 1️⃣ الفيديو في كامل خلفية الصفحة (بدون تكرار Loop) */}
      <div className="wm-bg-video-container">
        <video
          ref={videoRef}
          src={CHASSIS_VIDEO_SRC}
          autoPlay
          muted
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setShowContent(true)}
          onError={() => setShowContent(true)}
          className="wm-bg-video"
          style={{
            filter: showContent ? 'brightness(0.32) saturate(120%) blur(2px)' : 'brightness(0.85) saturate(110%)',
            transform: showContent ? 'scale(1.03)' : 'scale(1)',
          }}
        />

        {/* طبقة تظليل سينمائية لحفظ تباين النصوص */}
        <div
          className="wm-bg-overlay"
          style={{
            background: showContent
              ? 'radial-gradient(ellipse at center, rgba(9,13,22,0.65) 0%, rgba(9,13,22,0.92) 100%)'
              : 'radial-gradient(ellipse at center, transparent 40%, rgba(9,13,22,0.55) 100%)',
          }}
        />
      </div>

      <MechanicalRig />
      <HudFrame isRtl={isRtl} />

      {/* 2️⃣ المحتوى الترحيبي (يظهر قبل نهاية الفيديو) */}
      {showContent && (
        <div
          className="wm-content-entering"
          style={{
            position: 'relative',
            zIndex: Z_GLASS,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: '920px',
          }}
        >
          {/* Logo Badge */}
          <div className="wm-logo-entering" style={{ marginBottom: '14px' }}>
            <div
              style={{
                width: '74px',
                height: '74px',
                borderRadius: '20px',
                background: `linear-gradient(145deg, ${OBSIDIAN} 0%, ${TITANIUM} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1.5px solid rgba(234, 88, 12, 0.6)`,
                boxShadow: `0 0 35px rgba(234, 88, 12, 0.4), 0 10px 25px rgba(0,0,0,0.6)`,
                overflow: 'hidden',
              }}
            >
              {!logoError ? (
                <img
                  src="/favicon.svg"
                  alt="Mawjood Auto"
                  width={38}
                  height={38}
                  style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(234,88,12,0.5))' }}
                  onError={() => setLogoError(true)}
                />
              ) : (
                <span style={{ color: COPPER_LIGHT, display: 'inline-flex' }}>
                  <IconLogoFallback size={36} />
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <h2
            id="welcome-modal-title"
            style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px', margin: 0 }}
          >
            <span style={{ fontSize: 'clamp(1.9rem, 4vw, 2.7rem)', fontWeight: 900, color: ALABASTER, letterSpacing: '-0.5px' }}>
              {lang === 'ar' ? 'موجود' : 'Mawjood'}
            </span>
            <span style={{ fontSize: 'clamp(1.9rem, 4vw, 2.7rem)', fontWeight: 900, color: COPPER, letterSpacing: '-0.5px', textShadow: '0 0 22px rgba(234,88,12,0.6)' }}>
              {lang === 'ar' ? 'أوتو' : 'Auto'}
            </span>
          </h2>

          <p
            style={{
              fontSize: '1rem',
              marginBottom: '22px',
              marginTop: '6px',
              color: 'rgba(248,250,252,0.75)',
              maxWidth: '540px',
              lineHeight: 1.6,
              textAlign: 'center',
              padding: '0 12px',
            }}
          >
            {lang === 'ar'
              ? 'منصتك الأولى لقطع غيار السيارات الجديدة والمعتمدة في قطر'
              : "Qatar's Premier Ecosystem for 100% Brand-New & Genuine Auto Spare Parts"}
          </p>

          {/* Glass Deck Panel */}
          <div
            className="wm-deck-panel"
            style={{
              position: 'relative',
              width: '100%',
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(26px) saturate(180%)',
              WebkitBackdropFilter: 'blur(26px) saturate(180%)',
              border: '1px solid rgba(226, 232, 240, 0.16)',
              borderRadius: '26px',
              boxShadow: '0 30px 80px -15px rgba(0,0,0,0.75), 0 8px 24px rgba(234,88,12,0.12)',
              padding: '28px 28px 26px',
              textAlign: 'center',
              overflow: 'hidden',
            }}
          >
            {/* Tag Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 16px',
                borderRadius: '999px',
                border: '1px solid rgba(234, 88, 12, 0.5)',
                backgroundColor: 'rgba(234, 88, 12, 0.12)',
                color: '#fdba74',
                fontWeight: 800,
                fontSize: '12px',
                marginBottom: '22px',
              }}
            >
              <IconShieldCheck size={14} />
              <span>{lang === 'ar' ? 'قطع جديدة ومضمونة 100%' : '100% Brand New Guaranteed'}</span>
            </div>

            {/* 3 Pillars */}
            <div
              className="wm-pillars"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '14px',
                marginBottom: '26px',
                textAlign: isRtl ? 'right' : 'left',
              }}
            >
              {pillars.map((p) => (
                <div
                  key={p.key}
                  className="wm-card"
                  style={{
                    background: 'rgba(248, 250, 252, 0.05)',
                    border: '1px solid rgba(248, 250, 252, 0.12)',
                    borderRadius: '18px',
                    padding: '16px 14px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: `linear-gradient(145deg, ${TITANIUM} 0%, ${OBSIDIAN} 100%)`,
                      border: '1px solid rgba(234,88,12,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: COPPER_LIGHT,
                      marginBottom: '10px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    }}
                  >
                    {p.icon}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: ALABASTER, marginBottom: '5px', lineHeight: 1.35 }}>
                    {p.title}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'rgba(248,250,252,0.65)', lineHeight: 1.55, fontWeight: 500 }}>
                    {p.desc}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button */}
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
                transition: `transform 0.25s ${EASE_APPLE}`,
                transform: ctaHover ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
                animation: ctaHover ? 'wm-glow-pulse 1.6s ease-in-out infinite' : 'none',
                boxShadow: '0 12px 30px -6px rgba(234,88,12,0.55), 0 4px 14px rgba(0,0,0,0.4)',
                minHeight: '48px',
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
                  animation: ctaHover ? 'shimmerSweep 1.1s ease-in-out infinite' : 'none',
                  pointerEvents: 'none',
                }}
              />
              <span style={{ position: 'relative', zIndex: 1 }}>
                {lang === 'ar' ? 'ابدأ استعراض القطع المتوافقة مع سيارتك' : 'Explore Compatible Parts Catalog'}
              </span>
              <span style={{ position: 'relative', zIndex: 1, display: 'inline-flex', transform: isRtl ? 'scaleX(-1)' : 'none' }}>
                <IconCompassArrow size={17} />
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Close Button */}
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
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          border: '1px solid rgba(248,250,252,0.2)',
          backgroundColor: dismissHover ? 'rgba(248,250,252,0.15)' : 'rgba(15,23,42,0.6)',
          backdropFilter: 'blur(10px)',
          color: 'rgba(248,250,252,0.85)',
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
    </div>
  );
};

export default WelcomeModal;
