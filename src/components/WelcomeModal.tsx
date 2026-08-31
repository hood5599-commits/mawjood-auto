import React, { useEffect, useRef, useState } from 'react';

/* ============================================================
   Z-INDEX SCALE
   Overlay: 9990 | EngineLayer: 9991 | GlassPanel: 9992 | InteractiveDeck: 9993
   ============================================================ */
const Z_OVERLAY = 9990;
const Z_GLASS = 9992;
const Z_DECK = 9993;

/* Apple's signature spring-like deceleration curve, used for every "arrival" motion */
const EASE_APPLE = 'cubic-bezier(0.32, 0.72, 0, 1)';
const EASE_OVERSHOOT = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

/* ============================================================
   VIDEO SOURCE — ضع ملف الفيديو داخل مجلد public في مشروعك
   (مثال: public/videos/welcome-video.mp4)
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
  <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
    <svg className="wm-gear-train" width="220" height="140" viewBox="0 0 220 140" fill="none">
      <g className="wm-gear-big" style={{ transformOrigin: '70px 70px' }}>
        <circle cx="70" cy="70" r="38" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="70" cy="70" r="10" stroke="currentColor" strokeWidth="1.1" />
        {Array.from({ length: 10 }).map((_, i) => {
          const angle = (i * 360) / 10;
          return (
            <rect
              key={i}
              x={67}
              y={26}
              width={6}
              height={12}
              rx={1.5}
              stroke="currentColor"
              strokeWidth="1"
              transform={`rotate(${angle} 70 70)`}
            />
          );
        })}
      </g>
      <g className="wm-gear-small" style={{ transformOrigin: '156px 70px' }}>
        <circle cx="156" cy="70" r="24" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="156" cy="70" r="7" stroke="currentColor" strokeWidth="1.1" />
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 360) / 8;
          return (
            <rect
              key={i}
              x={153}
              y={38}
              width={5.5}
              height={9}
              rx={1.3}
              stroke="currentColor"
              strokeWidth="1"
              transform={`rotate(${angle} 156 70)`}
            />
          );
        })}
      </g>
    </svg>

    <svg className="wm-driveshaft" width="240" height="60" viewBox="0 0 240 60" fill="none">
      <ellipse cx="18" cy="30" rx="14" ry="20" stroke="currentColor" strokeWidth="1.3" />
      <line x1="18" y1="10" x2="18" y2="50" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
      <rect x="18" y="24" width="204" height="12" rx="6" stroke="currentColor" strokeWidth="1.2" />
      <ellipse cx="222" cy="30" rx="14" ry="20" stroke="currentColor" strokeWidth="1.3" />
      <line x1="222" y1="10" x2="222" y2="50" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
    </svg>

    <svg className="wm-piston-rig" width="70" height="160" viewBox="0 0 70 160" fill="none">
      <rect x="14" y="6" width="42" height="100" rx="4" stroke="currentColor" strokeWidth="1.2" />
      <g className="wm-piston-head">
        <rect x="20" y="16" width="30" height="26" rx="3" stroke="currentColor" strokeWidth="1.2" />
        <line x1="35" y1="42" x2="35" y2="92" stroke="currentColor" strokeWidth="1.4" />
      </g>
      <path d="M20 106L35 130L50 106" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="35" cy="140" r="10" stroke="currentColor" strokeWidth="1.2" />
    </svg>

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
   FULL-SCREEN VIDEO BACKGROUND SCENE
   ============================================================ */

interface BlueprintChassisSceneProps {
  isRtl: boolean;
  lang: 'ar' | 'en';
}

const BlueprintChassisScene: React.FC<BlueprintChassisSceneProps> = ({ isRtl, lang }) => {
  const [videoError, setVideoError] = useState<boolean>(false);

  return (
    <div
      aria-hidden="true"
      className="wm-blueprint-stage"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0, // وضعت خلفية تحت جميع العناصر
      }}
    >
      <div className="wm-video-overlay" style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(9, 13, 22, 0.4) 0%, rgba(9, 13, 22, 0.85) 100%)',
        zIndex: 1,
      }} />

      {!videoError ? (
        <video
          src={CHASSIS_VIDEO_SRC}
          autoPlay
          muted
          playsInline
          /* تم إزالة loop لجعل الفيديو يعمل مرة واحدة فقط */
          className="wm-bg-video"
          onError={() => setVideoError(true)}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '100vw',
            height: '100vh',
            objectFit: 'cover',
            transform: 'translate(-50%, -50%)',
            zIndex: 0,
            opacity: 0.6, // تعتيم خفيف ليبرز النص الأمامي
          }}
        />
      ) : (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.8) 0%, rgba(9, 13, 22, 1) 100%)',
          zIndex: 0
        }} />
      )}
    </div>
  );
};

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export const WelcomeModal: React.FC<WelcomeProps> = ({ lang, onStart }) => {
  const isRtl = lang === 'ar';
  const [ctaHover, setCtaHover] = useState<boolean>(false);
  const [dismissHover, setDismissHover] = useState<boolean>(false);
  const [logoError, setLogoError] = useState<boolean>(false);

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
          ? 'قطع غيار وكالة وتجارية أصلية جديدة — نضمن لك أعلى معايير الجودة.'
          : '100% factory-sealed Genuine OEM & certified aftermarket parts with full warranty. Zero scrap, zero compromises.',
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

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusInitial = window.setTimeout(() => {
      ctaRef.current?.focus();
    }, 50);

    const getFocusable = (): HTMLElement[] => {
      if (!modalRef.current) return [];
      const nodes = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      return Array.from(nodes).filter((el) => !el.hasAttribute('disabled'));
    };

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onStart();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = getFocusable();
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(focusInitial);
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [onStart]);

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
        padding: 'max(24px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left))',
        background: OBSIDIAN, // تم إزالة التدرج اللوني القديم للاعتماد كلياً على الفيديو
        overflow: 'hidden',
      }}
    >
      <style>{`
        /* ================= AMBIENT RIG ================= */
        @keyframes wm-gear-cw { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes wm-gear-ccw { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes wm-drive-spin { from { transform: translateX(0); } to { transform: translateX(-24px); } }
        @keyframes wm-piston-stroke {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(18px); }
        }
        @keyframes wm-coil-breathe {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.72); }
        }
        @keyframes wm-drift { 0%, 100% { transform: translateY(0px) translateX(0px); } 50% { transform: translateY(-10px) translateX(6px); } }

        .wm-gear-train { position: absolute; top: 10%; inset-inline-start: 6%; color: ${ALABASTER}; opacity: 0.08; will-change: transform; animation: wm-drift 16s ease-in-out infinite; z-index: 2; }
        .wm-gear-big { animation: wm-gear-cw 18s linear infinite; }
        .wm-gear-small { animation: wm-gear-ccw 12.6s linear infinite; }
        .wm-driveshaft { position: absolute; bottom: 14%; inset-inline-start: 4%; color: ${COPPER}; opacity: 0.09; overflow: visible; z-index: 2; }
        .wm-driveshaft rect { animation: wm-drive-spin 0.9s linear infinite; }
        .wm-piston-rig { position: absolute; top: 8%; inset-inline-end: 10%; color: ${ALABASTER}; opacity: 0.08; z-index: 2; }
        .wm-piston-head { animation: wm-piston-stroke 1.3s cubic-bezier(0.45, 0, 0.55, 1) infinite; transform-origin: center; }
        .wm-coil-rig { position: absolute; bottom: 10%; inset-inline-end: 14%; color: ${COPPER_LIGHT}; opacity: 0.09; z-index: 2; }
        .wm-coil-spring { animation: wm-coil-breathe 2.1s cubic-bezier(0.45, 0, 0.55, 1) infinite; transform-origin: 30px 20px; }

        /* ================= SCI-FI HUD FRAME ================= */
        @keyframes wm-hud-fade { from { opacity: 0; } to { opacity: 0.9; } }
        @keyframes wm-hud-scan {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        .wm-hud { animation: wm-hud-fade 0.5s ease-out 0.05s both; }
        .wm-hud-corner { position: absolute; color: ${CYAN}; opacity: 0.55; }
        .wm-hud-tl { top: 16px; inset-inline-start: 16px; }
        .wm-hud-tr { top: 16px; inset-inline-end: 16px; transform: scaleX(${isRtl ? '1' : '-1'}); }
        .wm-hud-bl { bottom: 16px; inset-inline-start: 16px; }
        .wm-hud-br { bottom: 16px; inset-inline-end: 16px; transform: scaleX(${isRtl ? '1' : '-1'}); }
        .wm-hud-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(56,189,248,0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56,189,248,0.045) 1px, transparent 1px);
          background-size: 34px 34px;
          mask-image: radial-gradient(ellipse at center, black 0%, transparent 72%);
          -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 72%);
        }
        .wm-hud-scanline {
          position: absolute; left: 0; right: 0; height: 120px;
          background: linear-gradient(180deg, transparent, rgba(56,189,248,0.09), transparent);
          animation: wm-hud-scan 3.2s cubic-bezier(0.45, 0, 0.55, 1) 0.3s infinite;
        }

        /* ================= VIDEO BACKGROUND TRANSITION ================= */
        @keyframes wm-scene-recede { 0% { filter: blur(0px); opacity: 1; } 100% { filter: blur(3px); opacity: 0.3; } }
        .wm-blueprint-stage { animation: wm-scene-recede 1.5s ${EASE_APPLE} 3s both; }

        /* ================= LOGO — POWERFUL ENTRANCE ================= */
        @keyframes wm-logo-burst-ring {
          0% { transform: scale(0.2); opacity: 0.9; }
          100% { transform: scale(2.6); opacity: 0; }
        }
        @keyframes wm-logo-rays-spin { from { transform: rotate(0deg); opacity: 0.5; } 70% { opacity: 0.15; } to { transform: rotate(140deg); opacity: 0; } }
        @keyframes wm-logo-descent {
          0% { transform: translateY(-120px) scale(0.55); opacity: 0; }
          58% { transform: translateY(8px) scale(1.08); opacity: 1; }
          78% { transform: translateY(-3px) scale(0.98); }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes wm-screen-flash {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.9; }
        }

        .wm-logo-flash {
          position: absolute; inset: 0; background: ${ALABASTER};
          animation: wm-screen-flash 0.3s ease-out 2.08s both;
          pointer-events: none; z-index: 3; mix-blend-mode: overlay;
        }
        .wm-logo-badge-wrap { position: relative; margin-bottom: 20px; }
        .wm-logo-burst {
          position: absolute; inset: 0; margin: auto; width: 78px; height: 78px; border-radius: 20px;
          border: 1.5px solid ${COPPER_LIGHT};
          animation: wm-logo-burst-ring 0.9s ${EASE_APPLE} 2.1s both;
          pointer-events: none;
        }
        .wm-logo-rays {
          position: absolute; inset: -40px; margin: auto; pointer-events: none;
          background: conic-gradient(from 0deg, transparent 0deg, rgba(234,88,12,0.5) 8deg, transparent 20deg, transparent 160deg, rgba(56,189,248,0.4) 172deg, transparent 184deg, transparent 360deg);
          border-radius: 50%;
          animation: wm-logo-rays-spin 1.1s ease-out 2.1s both;
        }
        .wm-logo-badge {
          position: relative; z-index: 1;
          animation: wm-logo-descent 0.85s ${EASE_OVERSHOOT} 2.15s both;
          will-change: transform, opacity;
        }

        @keyframes wm-wordmark-fade { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes wm-subhead-fade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes wm-deck-slideup { from { opacity: 0; transform: translateY(28px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes wm-deck-specular {
          0%, 92%, 100% { transform: translateX(-140%) skewX(-18deg); opacity: 0; }
          4% { opacity: 0.5; }
          16% { transform: translateX(260%) skewX(-18deg); opacity: 0; }
        }
        @keyframes wm-spark-pulse { 0%, 100% { opacity: 0.06; transform: scale(0.75); } 50% { opacity: 0.4; transform: scale(1.2); } }
        @keyframes shimmerSweep { 0% { transform: translateX(-120%) skewX(-18deg); } 100% { transform: translateX(220%) skewX(-18deg); } }
        @keyframes wm-glow-pulse {
          0%, 100% { box-shadow: 0 0 24px rgba(234,88,12,0.35), 0 12px 30px rgba(0,0,0,0.5); }
          50% { box-shadow: 0 0 40px rgba(234,88,12,0.55), 0 12px 30px rgba(0,0,0,0.5); }
        }

        .wm-spark { position: absolute; width: 3px; height: 3px; border-radius: 50%; background: ${COPPER_LIGHT}; z-index: 2; }
        .wm-spark-1 { top: 18%; inset-inline-start: 25%; animation: wm-spark-pulse 4.5s ease-in-out infinite; }
        .wm-spark-2 { top: 65%; inset-inline-start: 40%; animation: wm-spark-pulse 5.8s ease-in-out infinite 1.1s; }
        .wm-spark-3 { top: 35%; inset-inline-end: 30%; animation: wm-spark-pulse 3.8s ease-in-out infinite 0.5s; }

        .wm-content-wrap { position: relative; z-index: ${Z_GLASS}; display: flex; flex-direction: column; align-items: center; width: 100%; }
        .wm-wordmark { animation: wm-wordmark-fade 0.6s ${EASE_APPLE} 2.55s both; will-change: transform, opacity; }
        .wm-subhead { animation: wm-subhead-fade 0.6s ${EASE_APPLE} 2.68s both; will-change: transform, opacity; }
        .wm-deck-panel { animation: wm-deck-slideup 0.75s ${EASE_APPLE} 2.8s both; will-change: transform, opacity; }
        .wm-deck-specular {
          position: absolute; top: 0; left: 0; width: 40%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent);
          pointer-events: none; animation: wm-deck-specular 7s ease-in-out 3.4s infinite;
        }
        .wm-card { transition: transform 0.25s ${EASE_APPLE}, border-color 0.25s ease, background-color 0.25s ease; }
        .wm-card:hover { transform: translateY(-4px); }

        .wm-cta:focus-visible, .wm-dismiss:focus-visible {
          outline: 2px solid ${COPPER_LIGHT};
          outline-offset: 3px;
          box-shadow: 0 0 0 5px rgba(249, 115, 22, 0.25);
        }

        /* ================= RESPONSIVE ================= */
        @media (max-width: 760px) {
          .wm-pillars { grid-template-columns: 1fr !important; }
          .wm-hud-grid { background-size: 26px 26px; }
        }
        @media (max-width: 428px) {
          .wm-deck-panel { padding: 26px 18px 24px !important; border-radius: 22px !important; }
        }
        @media (max-width: 375px) {
          .wm-deck-panel { padding: 20px 14px 20px !important; border-radius: 18px !important; }
          .wm-hud-corner { width: 44px !important; height: 44px !important; }
        }
      `}</style>

      {/* خلفية الفيديو التي تملأ الشاشة */}
      <BlueprintChassisScene isRtl={isRtl} lang={lang} />

      <MechanicalRig />
      <HudFrame />
      
      <span className="wm-spark wm-spark-1" aria-hidden="true" />
      <span className="wm-spark wm-spark-2" aria-hidden="true" />
      <span className="wm-spark wm-spark-3" aria-hidden="true" />

      <div className="wm-content-wrap">
        <div className="wm-logo-badge-wrap">
          <div className="wm-logo-flash" aria-hidden="true" />
          <div className="wm-logo-rays" aria-hidden="true" />
          <div className="wm-logo-burst" aria-hidden="true" />
          <div
            className="wm-logo-badge"
            style={{
              width: '78px',
              height: '78px',
              borderRadius: '20px',
              background: `linear-gradient(145deg, ${OBSIDIAN} 0%, ${TITANIUM} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid rgba(234, 88, 12, 0.5)`,
              boxShadow: `0 0 0 1px rgba(248,250,252,0.06), 0 0 34px rgba(234, 88, 12, 0.3), 0 10px 24px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.08)`,
              overflow: 'hidden',
            }}
          >
            {!logoError ? (
              <img
                src="/favicon.svg"
                alt="Mawjood Auto"
                width={38}
                height={38}
                style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(234,88,12,0.4))' }}
                onError={() => setLogoError(true)}
              />
            ) : (
              <span style={{ color: COPPER_LIGHT, display: 'inline-flex' }}>
                <IconLogoFallback size={36} />
              </span>
            )}
          </div>
        </div>

        <h2
          id="welcome-modal-title"
          className="wm-wordmark"
          style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px', margin: 0 }}
        >
          <span style={{ fontSize: 'clamp(1.9rem, 4.2vw, 2.8rem)', fontWeight: 900, color: ALABASTER, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
            {lang === 'ar' ? 'موجود' : 'Mawjood'}
          </span>
          <span style={{ fontSize: 'clamp(1.9rem, 4.2vw, 2.8rem)', fontWeight: 900, color: COPPER, letterSpacing: '-0.5px', lineHeight: 1.1, textShadow: '0 0 22px rgba(234,88,12,0.5)' }}>
            {lang === 'ar' ? 'أوتو' : 'Auto'}
          </span>
        </h2>

        <p
          className="wm-subhead"
          style={{
            fontSize: '1.02rem',
            marginBottom: '28px',
            marginTop: '10px',
            color: 'rgba(248,250,252,0.7)',
            maxWidth: '540px',
            marginInline: 'auto',
            lineHeight: 1.7,
            textAlign: 'center',
            padding: '0 12px',
          }}
        >
          {lang === 'ar'
            ? 'منصتك الأولى لقطع غيار السيارات الجديدة والمعتمدة في قطر'
            : "Qatar's Premier Ecosystem for 100% Brand-New & Genuine Auto Spare Parts"}
        </p>

        <div
          className="wm-deck-panel"
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '900px',
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(226, 232, 240, 0.14)',
            borderRadius: '28px',
            boxShadow: '0 30px 80px -20px rgba(0,0,0,0.65), 0 8px 24px rgba(234,88,12,0.08), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(56,189,248,0.06)',
            padding: '34px 32px 32px',
            textAlign: 'center',
            overflow: 'hidden',
          }}
        >
          <div aria-hidden="true" className="wm-deck-specular" />

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
              marginBottom: '26px',
              textTransform: isRtl ? 'none' : 'uppercase',
            }}
          >
            <IconShieldCheck size={14} />
            <span>{lang === 'ar' ? 'قطع جديده ومضمونة %100' : '100% Brand New'}</span>
          </div>

          <div
            className="wm-pillars"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '14px',
              marginBottom: '32px',
              textAlign: isRtl ? 'right' : 'left',
            }}
          >
            {pillars.map((p) => (
              <div
                key={p.key}
                className="wm-card"
                style={{
                  background: 'rgba(248, 250, 252, 0.08)',
                  border: '1px solid rgba(248, 250, 252, 0.12)',
                  borderRadius: '18px',
                  padding: '18px 16px',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: `linear-gradient(145deg, ${TITANIUM} 0%, ${OBSIDIAN} 100%)`,
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
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: ALABASTER, marginBottom: '6px', lineHeight: 1.35 }}>{p.title}</div>
                <div style={{ fontSize: '12px', color: 'rgba(248,250,252,0.7)', lineHeight: 1.6, fontWeight: 500 }}>{p.desc}</div>
              </div>
            ))}
          </div>

          <button
            ref={ctaRef}
            className="wm-cta"
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
              fontFamily: "'Cairo', system-ui, sans-serif",
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              letterSpacing: isRtl ? '0px' : '0.3px',
              transition: `transform 0.25s ${EASE_APPLE}`,
              transform: ctaHover ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
              animation: ctaHover ? 'wm-glow-pulse 1.6s ease-in-out infinite' : 'none',
              boxShadow: '0 12px 30px -6px rgba(234,88,12,0.5), 0 4px 14px rgba(0,0,0,0.4)',
              willChange: 'transform',
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

      <button
        ref={dismissRef}
        className="wm-dismiss"
        aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}
        onClick={onStart}
        onMouseEnter={() => setDismissHover(true)}
        onMouseLeave={() => setDismissHover(false)}
        style={{
          position: 'absolute',
          top: 'max(22px, env(safe-area-inset-top))',
          insetInlineEnd: 'max(22px, env(safe-area-inset-right))',
          zIndex: Z_DECK,
          width: '40px',
          height: '40px',
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
