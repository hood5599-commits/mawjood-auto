import React, { useEffect, useRef, useState } from 'react';

/* ============================================================
   Z-INDEX SCALE
   Overlay: 9990 | EngineLayer: 9991 | GlassPanel: 9992 | InteractiveDeck: 9993
   ============================================================ */
const Z_OVERLAY = 9990;
const Z_ENGINE = 9991;
const Z_GLASS = 9992;
const Z_DECK = 9993;

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

const IconGearGlyph: React.FC<IconProps> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.4" />
    <path d="M12 2.5V5.2M12 18.8V21.5M21.5 12H18.8M5.2 12H2.5M18.5 5.5L16.6 7.4M7.4 16.6L5.5 18.5M18.5 18.5L16.6 16.6M7.4 7.4L5.5 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
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
   AMBIENT MECHANICAL ENGINE LAYER
   ============================================================ */

const AmbientEngineLayer: React.FC = () => (
  <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
    <div className="wm-gear wm-gear-a"><IconGearGlyph size={220} /></div>
    <div className="wm-gear wm-gear-b"><IconGearGlyph size={140} /></div>
    <div className="wm-gear wm-gear-c"><IconGearGlyph size={90} /></div>

    <svg className="wm-piston" width="260" height="46" viewBox="0 0 260 46" fill="none" aria-hidden="true">
      <line x1="8" y1="23" x2="220" y2="23" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="220" cy="23" r="12" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="23" r="5" stroke="currentColor" strokeWidth="1.2" />
      <line x1="200" y1="23" x2="240" y2="23" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity={0.4} />
    </svg>

    <svg className="wm-rotor" width="140" height="140" viewBox="0 0 140 140" fill="none" aria-hidden="true">
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

/* ============================================================
   EXPLODED BLUEPRINT CHASSIS SCENE
   ============================================================ */

interface BlueprintChassisSceneProps {
  isRtl: boolean;
}

const BlueprintChassisScene: React.FC<BlueprintChassisSceneProps> = ({ isRtl }) => (
  <div
    aria-hidden="true"
    className="wm-blueprint-stage"
    style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: 1,
      transform: isRtl ? 'scaleX(-1)' : 'none',
    }}
  >
    <div className="wm-chassis-zoom">
      <svg className="wm-blueprint-strokes" width="900" height="420" viewBox="0 0 900 420" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g className="wm-body-fadein">
          <path
            d="M120 300 C130 250 180 210 250 205 L320 170 C360 150 420 140 470 140 L560 140 C620 140 660 160 690 200 L740 205 C780 210 810 250 800 300"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M120 300 L800 300" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M330 175 L340 240 M470 145 L470 240 M600 165 L600 240" stroke="currentColor" strokeWidth="0.9" strokeDasharray="3 5" opacity={0.6} />
          <path d="M250 205 L470 205 L690 205" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 6" opacity={0.5} />
        </g>

        <g className="wm-part wm-part-rotor-front">
          <circle cx="250" cy="305" r="48" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="250" cy="305" r="30" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" />
          <circle cx="250" cy="305" r="6" stroke="currentColor" strokeWidth="1" />
          <path d="M250 275L250 285M250 325L250 335M220 305L230 305M270 305L280 305" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </g>

        <g className="wm-part wm-part-rotor-rear">
          <circle cx="670" cy="305" r="48" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="670" cy="305" r="30" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" />
          <circle cx="670" cy="305" r="6" stroke="currentColor" strokeWidth="1" />
          <path d="M670 275L670 285M670 325L670 335M640 305L650 305M690 305L700 305" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </g>

        <g className="wm-part wm-part-spring-front">
          <path d="M250 250 L262 240 L238 228 L262 216 L238 204 L262 192 L250 182" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        <g className="wm-part wm-part-spring-rear">
          <path d="M670 250 L682 240 L658 228 L682 216 L658 204 L682 192 L670 182" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        <g className="wm-part wm-part-engine">
          <rect x="390" y="235" width="70" height="46" rx="6" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="425" cy="215" r="14" stroke="currentColor" strokeWidth="1.2" />
          <path d="M425 229 L425 235" stroke="currentColor" strokeWidth="1.2" />
          <path d="M405 258 L370 258" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="365" cy="258" r="5" stroke="currentColor" strokeWidth="1.1" />
        </g>
      </svg>
    </div>

    <div className="wm-laser-line" />
    <div className="wm-flash-bloom" />
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
          ? 'قطع غيار وكالة وتجارية أصلية جديدة بالكرتون مع الضمان الذهبي — تم إلغاء السكراب والمستعمل نهائياً لنضمن لك أعلى معايير الجودة.'
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

  // Focus management, Escape-to-close, and cyclic Tab focus trap.
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
        height: '100%',
        zIndex: Z_OVERLAY,
        direction: isRtl ? 'rtl' : 'ltr',
        fontFamily: isRtl ? "'Cairo', sans-serif" : "'Cairo', system-ui, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px',
        background: `radial-gradient(ellipse at 30% 20%, rgba(56,189,248,0.08) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(234,88,12,0.10) 0%, transparent 50%), linear-gradient(160deg, ${OBSIDIAN} 0%, ${SLATE} 55%, ${OBSIDIAN} 100%)`,
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes wm-spin-cw { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes wm-spin-ccw { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes wm-drift {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-10px) translateX(6px); }
        }
        @keyframes wm-spark-pulse {
          0%, 100% { opacity: 0.06; transform: scale(0.75); }
          50% { opacity: 0.4; transform: scale(1.2); }
        }
        @keyframes shimmerSweep {
          0% { transform: translateX(-120%) skewX(-18deg); }
          100% { transform: translateX(220%) skewX(-18deg); }
        }
        @keyframes wm-glow-pulse {
          0%, 100% { box-shadow: 0 0 24px rgba(234,88,12,0.35), 0 12px 30px rgba(0,0,0,0.5); }
          50% { box-shadow: 0 0 40px rgba(234,88,12,0.55), 0 12px 30px rgba(0,0,0,0.5); }
        }

        @keyframes chassisExplodeZoom {
          0% { transform: scale(2.5); opacity: 0.35; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes blueprintStrokeCycle {
          0%, 100% { color: ${CYAN}; }
          50% { color: ${ALABASTER}; }
        }
        @keyframes wm-body-fadein {
          from { opacity: 0; }
          to { opacity: 0.85; }
        }

        @keyframes wm-laser-sweep {
          0% { transform: translateX(-60%); opacity: 0; }
          8% { opacity: 1; }
          92% { opacity: 1; }
          100% { transform: translateX(760px); opacity: 0; }
        }
        @keyframes wm-flash-bloom {
          0%, 100% { opacity: 0; transform: scale(0.6); }
          50% { opacity: 0.85; transform: scale(1.6); }
        }
        @keyframes wm-converge-rotor-front {
          0% { transform: translate(-70px, -60px) scale(1.2); opacity: 0.55; }
          100% { transform: translate(0, 0) scale(1); opacity: 1; }
        }
        @keyframes wm-converge-rotor-rear {
          0% { transform: translate(70px, -60px) scale(1.2); opacity: 0.55; }
          100% { transform: translate(0, 0) scale(1); opacity: 1; }
        }
        @keyframes wm-converge-spring-front {
          0% { transform: translate(-30px, -50px); opacity: 0.5; }
          100% { transform: translate(0, 0); opacity: 1; }
        }
        @keyframes wm-converge-spring-rear {
          0% { transform: translate(30px, -50px); opacity: 0.5; }
          100% { transform: translate(0, 0); opacity: 1; }
        }
        @keyframes wm-converge-engine {
          0% { transform: translate(90px, -40px) scale(1.15); opacity: 0.5; }
          100% { transform: translate(0, 0) scale(1); opacity: 1; }
        }
        @keyframes wm-scene-recede {
          0% { opacity: 1; }
          100% { opacity: 0.1; }
        }

        @keyframes wm-logo-descent {
          0% { transform: translateY(-140px) scale(0.7); opacity: 0; }
          70% { transform: translateY(6px) scale(1.03); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes wm-wordmark-fade {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes wm-subhead-fade {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes wm-deck-slideup {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes wm-deck-specular {
          0%, 92%, 100% { transform: translateX(-140%) skewX(-18deg); opacity: 0; }
          4% { opacity: 0.5; }
          16% { transform: translateX(260%) skewX(-18deg); opacity: 0; }
        }

        @keyframes wm-reduced-crossfade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .wm-gear { position: absolute; color: ${ALABASTER}; opacity: 0.05; will-change: transform; }
        .wm-gear-a { top: -60px; inset-inline-end: -40px; animation: wm-spin-cw 60s linear infinite; }
        .wm-gear-b { bottom: -40px; inset-inline-start: -30px; animation: wm-spin-ccw 42s linear infinite; }
        .wm-gear-c { top: 55%; inset-inline-end: 12%; animation: wm-spin-cw 30s linear infinite; opacity: 0.045; }
        .wm-piston { position: absolute; top: 12%; inset-inline-start: 8%; color: ${COPPER}; opacity: 0.07; animation: wm-drift 14s ease-in-out infinite; will-change: transform; }
        .wm-rotor { position: absolute; bottom: 6%; inset-inline-end: 6%; color: ${ALABASTER}; opacity: 0.05; animation: wm-spin-cw 70s linear infinite; will-change: transform; }
        .wm-spark { position: absolute; width: 3px; height: 3px; border-radius: 50%; background: ${COPPER_LIGHT}; }
        .wm-spark-1 { top: 18%; inset-inline-start: 25%; animation: wm-spark-pulse 4.5s ease-in-out infinite; }
        .wm-spark-2 { top: 65%; inset-inline-start: 40%; animation: wm-spark-pulse 5.8s ease-in-out infinite 1.1s; }
        .wm-spark-3 { top: 35%; inset-inline-end: 30%; animation: wm-spark-pulse 3.8s ease-in-out infinite 0.5s; }
        .wm-spark-4 { top: 78%; inset-inline-end: 18%; animation: wm-spark-pulse 5s ease-in-out infinite 1.8s; }
        .wm-spark-5 { top: 10%; inset-inline-end: 45%; animation: wm-spark-pulse 4.1s ease-in-out infinite 0.9s; }
        .wm-vignette { position: absolute; inset: 0; background: radial-gradient(ellipse at center, transparent 40%, rgba(9,13,22,0.65) 100%); }

        .wm-blueprint-stage { animation: wm-scene-recede 1s cubic-bezier(0.22, 1, 0.36, 1) 2.6s both; }
        .wm-chassis-zoom { transform-origin: center center; animation: chassisExplodeZoom 1.8s cubic-bezier(0.16, 1, 0.3, 1) both; will-change: transform, opacity; }
        .wm-blueprint-strokes { animation: blueprintStrokeCycle 2.4s ease-in-out infinite; }
        .wm-body-fadein { animation: wm-body-fadein 1s ease-out 0.2s both; }

        .wm-part { will-change: transform, opacity; }
        .wm-part-rotor-front { animation: wm-converge-rotor-front 0.65s cubic-bezier(0.16, 1, 0.3, 1) 1.8s both; }
        .wm-part-rotor-rear { animation: wm-converge-rotor-rear 0.65s cubic-bezier(0.16, 1, 0.3, 1) 1.8s both; }
        .wm-part-spring-front { animation: wm-converge-spring-front 0.6s cubic-bezier(0.16, 1, 0.3, 1) 1.9s both; }
        .wm-part-spring-rear { animation: wm-converge-spring-rear 0.6s cubic-bezier(0.16, 1, 0.3, 1) 1.9s both; }
        .wm-part-engine { animation: wm-converge-engine 0.65s cubic-bezier(0.16, 1, 0.3, 1) 1.85s both; }

        .wm-laser-line {
          position: absolute; top: 8%; bottom: 8%; left: 6%; width: 3px;
          background: linear-gradient(180deg, transparent, ${CYAN}, ${ALABASTER}, ${CYAN}, transparent);
          box-shadow: 0 0 18px 3px rgba(56,189,248,0.65), 0 0 40px 8px rgba(56,189,248,0.3);
          animation: wm-laser-sweep 0.6s cubic-bezier(0.4, 0, 0.2, 1) 1.8s both;
          will-change: transform, opacity;
        }
        .wm-flash-bloom {
          position: absolute; inset: 0; margin: auto; width: 60%; height: 60%; border-radius: 50%;
          background: radial-gradient(circle, rgba(248,250,252,0.5) 0%, rgba(56,189,248,0.22) 45%, transparent 70%);
          animation: wm-flash-bloom 0.7s ease-out 2.05s both;
          will-change: transform, opacity;
        }

        .wm-content-wrap { position: relative; z-index: ${Z_GLASS}; display: flex; flex-direction: column; align-items: center; }

        .wm-logo-badge { animation: wm-logo-descent 0.75s cubic-bezier(0.34, 1.56, 0.64, 1) 2.2s both; will-change: transform, opacity; }
        .wm-wordmark { animation: wm-wordmark-fade 0.6s cubic-bezier(0.22, 1, 0.36, 1) 2.5s both; will-change: transform, opacity; }
        .wm-subhead { animation: wm-subhead-fade 0.6s cubic-bezier(0.22, 1, 0.36, 1) 2.65s both; will-change: transform, opacity; }

        .wm-deck-panel { animation: wm-deck-slideup 0.75s cubic-bezier(0.22, 1, 0.36, 1) 2.75s both; will-change: transform, opacity; }
        .wm-deck-specular {
          position: absolute; top: 0; left: 0; width: 40%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent);
          pointer-events: none; animation: wm-deck-specular 7s ease-in-out 3.4s infinite;
        }
        .wm-card { transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.25s ease, background-color 0.25s ease; }
        .wm-card:hover { transform: translateY(-4px); }

        .wm-cta:focus-visible, .wm-dismiss:focus-visible {
          outline: 2px solid ${COPPER_LIGHT};
          outline-offset: 3px;
          box-shadow: 0 0 0 5px rgba(249, 115, 22, 0.25);
        }

        @media (max-width: 760px) {
          .wm-pillars { grid-template-columns: 1fr !important; }
          .wm-blueprint-stage { transform: scale(0.75) ${isRtl ? 'scaleX(-1)' : ''}; }
        }
        @media (max-width: 375px) {
          .wm-deck-panel { padding: 24px 16px 22px !important; border-radius: 20px !important; }
          .wm-wordmark span { font-size: 1.6rem !important; }
        }

        @media (prefers-reduced-motion: reduce) {
          .wm-gear, .wm-piston, .wm-rotor, .wm-spark,
          .wm-chassis-zoom, .wm-blueprint-strokes, .wm-body-fadein,
          .wm-part-rotor-front, .wm-part-rotor-rear, .wm-part-spring-front, .wm-part-spring-rear, .wm-part-engine,
          .wm-laser-line, .wm-flash-bloom, .wm-blueprint-stage,
          .wm-logo-badge, .wm-wordmark, .wm-subhead, .wm-deck-panel, .wm-deck-specular {
            animation: none !important;
          }
          .wm-blueprint-stage, .wm-laser-line, .wm-flash-bloom { display: none !important; }
          .wm-content-wrap { animation: wm-reduced-crossfade 0.18s ease-out both; }
        }
      `}</style>

      <AmbientEngineLayer />
      <BlueprintChassisScene isRtl={isRtl} />

      <div className="wm-content-wrap">
        <div
          className="wm-logo-badge"
          style={{
            width: '78px',
            height: '78px',
            marginBottom: '18px',
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
              src="/logo-mawjood-auto.svg"
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
            marginBottom: '30px',
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
            background: 'rgba(15, 23, 42, 0.55)',
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
            <span>{lang === 'ar' ? 'صفر سكراب — صفر مستعمل — 100% جديد' : 'Zero Scrap — Zero Used — 100% Brand New'}</span>
          </div>

          <div
            className="wm-pillars"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '14px',
              marginBottom: '34px',
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
                <div style={{ fontSize: '12px', color: 'rgba(248,250,252,0.62)', lineHeight: 1.6, fontWeight: 500 }}>{p.desc}</div>
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
              transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1)',
              transform: ctaHover ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
              animation: ctaHover ? 'wm-glow-pulse 1.6s ease-in-out infinite' : 'none',
              boxShadow: '0 12px 30px -6px rgba(234,88,12,0.5), 0 4px 14px rgba(0,0,0,0.4)',
              willChange: 'transform',
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
          top: '22px',
          insetInlineEnd: '22px',
          zIndex: Z_DECK,
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
