import React, { useState, useRef, useEffect } from 'react';
import {
  getPartCategory,
  classifyPartTier
} from '../utils/categoryHelper';
import { PartMoreInfo } from './PartMoreInfo';
import { VisualVehicleSelector } from './VisualVehicleSelector';
import { scanIstemara } from '../utils/istemaraScanner';

// 🚗 استيراد بيانات السيارات المركزية
import { CAR_DATA } from '../data/carData';
import { SUPABASE_URL, API_KEY } from '../config/supabase';

/* ============================================================================
   DESIGN TOKENS — "Mawjood Auto" Luxury System
   Obsidian / Slate surfaces, Alabaster canvas, Copper–Champagne accent.
   Cairo for Arabic, Inter for Latin. Every color below is referenced by name,
   not re-typed, so the palette stays a single source of truth.
============================================================================ */
const TOKENS = {
  obsidian: '#090D16',
  obsidianSoft: '#0F172A',
  slate: '#1E293B',
  slateLine: 'rgba(226, 232, 240, 0.10)',
  hairline: 'rgba(226, 232, 240, 0.85)',
  hairlineDark: 'rgba(148, 163, 184, 0.22)',
  alabaster: '#F8FAFC',
  white: '#FFFFFF',
  ink: '#0B1220',
  slateText: '#475569',
  mutedText: '#64748B',
  copper: '#EA580C',
  copperDeep: '#C2410C',
  copperBright: '#F97316',
  copperTint: '#FFF7ED',
  copperLine: 'rgba(234, 88, 12, 0.28)',
  success: '#16A34A',
  successTint: '#F0FDF4',
  successLine: '#86EFAC',
  successInk: '#166534',
  danger: '#DC2626',
  dangerTint: '#FEF2F2',
  dangerLine: '#FCA5A5',
  dangerInk: '#991B1B',
  amber: '#B45309',
  amberTint: '#FFFBEB',
  amberLine: '#FDE68A',
  sky: '#0284C7',
  skyTint: '#F0F9FF',
  skyLine: '#BAE6FD',
};

const fontFor = (lang: 'ar' | 'en') =>
  lang === 'ar'
    ? "'Cairo', 'Segoe UI', system-ui, sans-serif"
    : "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif";

/* ============================================================================
   ICONOGRAPHY — bespoke feather-weight SVG set, replaces every emoji.
   Single-color, stroke-based, inherits currentColor for perfect theming.
============================================================================ */
type IconName =
  | 'car' | 'camera' | 'search' | 'cart' | 'share' | 'star' | 'bolt'
  | 'message' | 'alertTriangle' | 'checkCircle' | 'x' | 'refresh'
  | 'calendar' | 'folder' | 'dot' | 'doc' | 'mail' | 'target'
  | 'sortVertical' | 'trendingDown' | 'trendingUp' | 'chevronDown'
  | 'undo' | 'chevronLeft' | 'chevronRight' | 'plus' | 'minus'
  | 'layers' | 'sparkle' | 'shield' | 'truck' | 'wallet' | 'clock' | 'tag';

const ICON_PATHS: Record<IconName, React.ReactNode> = {
  car: (
    <>
      <path d="M3 12.5 4.8 7.2A2 2 0 0 1 6.7 5.8h10.6a2 2 0 0 1 1.9 1.4l1.8 5.3" />
      <rect x="2.5" y="12.5" width="19" height="6" rx="2" />
      <circle cx="7" cy="18.5" r="1.6" />
      <circle cx="17" cy="18.5" r="1.6" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.1l1-1.6h6.8l1 1.6h2.1A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z" />
      <circle cx="12" cy="12.5" r="3.4" />
    </>
  ),
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="m20 20-4.35-4.35" />
    </>
  ),
  cart: (
    <>
      <circle cx="9.5" cy="20" r="1.3" />
      <circle cx="17.5" cy="20" r="1.3" />
      <path d="M2.5 3h2l2.2 11.4a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L20.5 7H6" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5.5" r="2.1" />
      <circle cx="6" cy="12" r="2.1" />
      <circle cx="18" cy="18.5" r="2.1" />
      <path d="m7.9 10.8 8.2-4.3M7.9 13.2l8.2 4.3" />
    </>
  ),
  star: (
    <path d="m12 3.6 2.5 5.2 5.7.7-4.2 4 1 5.7L12 16.4l-5 2.8 1-5.7-4.2-4 5.7-.7z" />
  ),
  bolt: <path d="M12.9 2.4 4.6 13.5h5.6l-1.2 8.1 8.4-11.1h-5.7z" />,
  message: (
    <path d="M4 5.5h16A1.5 1.5 0 0 1 21.5 7v8A1.5 1.5 0 0 1 20 16.5H9l-4 3.4v-3.4H4A1.5 1.5 0 0 1 2.5 15V7A1.5 1.5 0 0 1 4 5.5Z" />
  ),
  alertTriangle: (
    <>
      <path d="M12 3.6 22 20H2Z" />
      <path d="M12 9.5v4.6M12 16.9h.01" />
    </>
  ),
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="m8.3 12.2 2.5 2.5 5-5.2" />
    </>
  ),
  x: <path d="M6 6l12 12M18 6 6 18" />,
  refresh: (
    <path d="M20 11.5A8 8 0 1 0 18.6 16M20 11.5V5.8M20 11.5h-5.7" />
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.7h17M8 3v3.6M16 3v3.6" />
    </>
  ),
  folder: (
    <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.7l1.7 2h9.6A1.5 1.5 0 0 1 22 8.5v9A1.5 1.5 0 0 1 20.5 19h-16A1.5 1.5 0 0 1 3 17.5Z" />
  ),
  dot: <circle cx="12" cy="12" r="3.6" />,
  doc: (
    <>
      <path d="M6.5 2.8h7.4L18 7.2v13.5a1 1 0 0 1-1 1h-10.5a1 1 0 0 1-1-1V3.8a1 1 0 0 1 1-1Z" />
      <path d="M13.6 2.8V7h4.3M8.3 12.4h7.1M8.3 15.7h7.1M8.3 9.1h3" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m4 7 8 6.2L20 7" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  sortVertical: (
    <path d="M7 4v16M7 4l-3 3M7 4l3 3M17 20V4M17 20l-3-3M17 20l3-3" />
  ),
  trendingDown: (
    <>
      <path d="m3.5 6.5 7 7 4-4 6 6" />
      <path d="M20.5 9.5v6h-6" />
    </>
  ),
  trendingUp: (
    <>
      <path d="m3.5 17.5 7-7 4 4 6-6" />
      <path d="M20.5 14.5v-6h-6" />
    </>
  ),
  chevronDown: <path d="m5 8.5 7 7 7-7" />,
  undo: <path d="M8.5 8.5H4V4M4 8.5A8.5 8.5 0 1 1 6 18.3" />,
  chevronLeft: <path d="m14.5 5-7 7 7 7" />,
  chevronRight: <path d="m9.5 5 7 7-7 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  layers: (
    <>
      <path d="m12 3 9 4.7-9 4.7-9-4.7Z" />
      <path d="m3 12.2 9 4.7 9-4.7M3 16.7l9 4.7 9-4.7" />
    </>
  ),
  sparkle: (
    <path d="M12 3.5c.5 3 1.9 4.4 4.9 4.9-3 .5-4.4 1.9-4.9 4.9-.5-3-1.9-4.4-4.9-4.9 3-.5 4.4-1.9 4.9-4.9Z M18.5 15c.3 1.5 1 2.2 2.5 2.5-1.5.3-2.2 1-2.5 2.5-.3-1.5-1-2.2-2.5-2.5 1.5-.3 2.2-1 2.5-2.5Z" />
  ),
  shield: (
    <path d="M12 3 4.5 5.8v5.6c0 4.5 3.1 7.9 7.5 9.1 4.4-1.2 7.5-4.6 7.5-9.1V5.8Z" />
  ),
  truck: (
    <>
      <path d="M2.5 6.5h11v9h-11ZM13.5 10.5h4l3 3v2h-7Z" />
      <circle cx="7" cy="17.5" r="1.6" />
      <circle cx="17" cy="17.5" r="1.6" />
    </>
  ),
  wallet: (
    <>
      <path d="M3.5 6.5A1.5 1.5 0 0 1 5 5h13a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 18 19H5a1.5 1.5 0 0 1-1.5-1.5Z" />
      <path d="M14.5 12.6a1.4 1.4 0 1 0 0-.2Z M16 10.8h2.5v3.6H16a1.8 1.8 0 0 1 0-3.6Z" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 7.2V12l3.2 2" />
    </>
  ),
  tag: (
    <>
      <path d="M12.6 3.5h5.9a1 1 0 0 1 1 1v5.9a1 1 0 0 1-.3.7l-8.6 8.6a1 1 0 0 1-1.4 0l-6.9-6.9a1 1 0 0 1 0-1.4l8.6-8.6a1 1 0 0 1 .7-.3Z" />
      <circle cx="16.3" cy="7.7" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
};

const Icon: React.FC<{
  name: IconName;
  size?: number;
  strokeWidth?: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({ name, size = 16, strokeWidth = 1.75, color = 'currentColor', style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, display: 'block', ...style }}
    aria-hidden="true"
  >
    {ICON_PATHS[name]}
  </svg>
);

// 🗂️ قاموس ترجمة الأقسام الرئيسية
const CATEGORY_TRANSLATIONS: Record<string, { ar: string; en?: string }> = {
  "Belt Drive": { ar: "نظام السيور والقوايش — Belt Drive", en: "Belt Drive" },
  "Body & Lamp Assembly": { ar: "الهيكل والإضاءة (بدي وليتات) — Body & Lamp Assembly", en: "Body & Lamp Assembly" },
  "Brake & Wheel Hub": { ar: "الفرامل والسفايف والدرامات — Brake & Wheel Hub", en: "Brake & Wheel Hub" },
  "Cooling System": { ar: "نظام التبريد والرديتر — Cooling System", en: "Cooling System" },
  "Drivetrain": { ar: "نظام الدفع والأكسلات والشفت — Drivetrain", en: "Drivetrain" },
  "Electrical": { ar: "الكهرباء والدينمة والسلف — Electrical", en: "Electrical" },
  "Electrical-Bulb & Socket": { ar: "اللمبات والفيش — Electrical-Bulb & Socket", en: "Electrical-Bulb & Socket" },
  "Electrical-Connector": { ar: "الفيش والتوصيلات — Electrical-Connector", en: "Electrical-Connector" },
  "Electrical-Switch & Relay": { ar: "المفاتيح والكتاوت — Electrical-Switch & Relay", en: "Electrical-Switch & Relay" },
  "Engine": { ar: "المحرك ومكونات المكينة — Engine", en: "Engine" },
  "Exhaust & Emission": { ar: "العادم والقزوز ودبة البيئة — Exhaust & Emission", en: "Exhaust & Emission" },
  "Fuel & Air": { ar: "الوقود وبترول وهواء المكينة — Fuel & Air", en: "Fuel & Air" },
  "Heat & Air Conditioning": { ar: "التكييف والكمبريسر والتدفئة — Heat & Air Conditioning", en: "Heat & Air Conditioning" },
  "Ignition": { ar: "نظام الاشتعال (البلاكات والكويلات) — Ignition", en: "Ignition" },
  "Interior": { ar: "المقصورة والديكور الداخلي — Interior", en: "Interior" },
  "Literature": { ar: "الكتالوجات والكتيبات — Literature", en: "Literature" },
  "Steering": { ar: "نظام التوجيه والاستيرنج راك (السكان) — Steering", en: "Steering" },
  "Suspension": { ar: "المساعدات والجامبينات والشيالات — Suspension", en: "Suspension" },
  "Transmission-Automatic": { ar: "القير الأوتوماتيك (الجير) — Transmission-Automatic", en: "Transmission-Automatic" },
  "Transmission-Manual": { ar: "القير العادي (الكلتش) — Transmission-Manual", en: "Transmission-Manual" },
  "Wheel": { ar: "الإطارات والرنجات والتواير — Wheel", en: "Wheel" },
  "Wiper & Washer": { ar: "المساحات وبخاخات ماي الجام — Wiper & Washer", en: "Wiper & Washer" }
};

// 📂 قاموس ترجمة الأقسام الفرعية بالمصطلحات القطرية والإنجليزية
const SUBCATEGORY_TRANSLATIONS: Record<string, { ar: string; en?: string }> = {
  "Brake Pad": { ar: "فحمات وقماشات الفرامل (سفايف) — Brake Pads", en: "Brake Pads" },
  "Rotor": { ar: "هوبات وأقراص الفرامل (درام ويل / ديسكات) — Brake Rotors", en: "Brake Rotors" },
  "Caliper": { ar: "كليبر وملاقط الفرامل — Calipers", en: "Brake Calipers" },
  "ABS Control Module": { ar: "منظم مانع الانزلاق (ABS) — ABS Module", en: "ABS Control Module" },
  "Brake Fluid": { ar: "زيت الفرامل (آيل بريك) — Brake Fluid", en: "Brake Fluid" },
  "Wheel Bearing & Hub": { ar: "رمان وفلنجة العجل (بيرنج / هب) — Wheel Bearings", en: "Wheel Bearings & Hub" },
  "Parking Brake Shoe": { ar: "أقمشة فرامل اليد (سفايف هاند بريك) — Parking Brake", en: "Parking Brake Shoes" },
  "Shock / Strut": { ar: "المساعدات وممتص الصدمات (جامبينات) — Shocks & Struts", en: "Shocks & Struts" },
  "Control Arm": { ar: "المقصات وأذرعة التحكم (شيالات) — Control Arms", en: "Control Arms" },
  "Coil Spring": { ar: "اليايات والزنبركات (سبرنغات) — Coil Springs", en: "Coil Springs" },
  "Sway Bar Link": { ar: "مسامير وأعمدة التوازن (رودات توازن / لينكات) — Sway Bar Links", en: "Sway Bar Links" },
  "Control Arm Bushing": { ar: "جلب وربلات المقصات (بوشات) — Bushings", en: "Control Arm Bushings" },
  "Rack and Pinion": { ar: "دودة الدركسون (استيرنج راك / مجمع سكان) — Steering Rack", en: "Rack and Pinion" },
  "Tie Rod End": { ar: "أذرعة وركب الدركسون (رودات سكان / تاي رود) — Tie Rods", en: "Tie Rod Ends" },
  "Coolant / Antifreeze": { ar: "سائل وماء تبريد الرديتر (ماي رديتر / كولانت) — Coolant", en: "Coolant / Antifreeze" },
  "Water Pump": { ar: "طرمبة ومضخة الماء (واتر بمب) — Water Pump", en: "Water Pump" },
  "Radiator": { ar: "رديتر تبريد المحرك (رديتر ماي) — Radiator", en: "Engine Radiator" },
  "Thermostat": { ar: "ثرموستات وكوع الحرارة (بلف حرارة) — Thermostat", en: "Thermostat" },
  "Radiator Fan Assembly": { ar: "مروحة تبريد الرديتر — Radiator Fan", en: "Radiator Fan Assembly" },
  "Coolant Reservoir": { ar: "قربة وخزان ماء الرديتر (قربة ماي / خرطوش) — Coolant Tank", en: "Coolant Reservoir" },
  "A/C Condenser": { ar: "مكثف ورديتر المكيف (كوندنسر) — A/C Condenser", en: "A/C Condenser" },
  "A/C Compressor": { ar: "كمبروسر وضاغط المكيف (كمبريسر) — A/C Compressor", en: "A/C Compressor" },
  "A/C Evaporator Core": { ar: "ثلاجة ومبخر المكيف (ثلاجة داخلية) — Evaporator", en: "A/C Evaporator Core" },
  "Cabin Air Filter": { ar: "فلتر هواء المكيف والمقصورة (فلتر مكيف) — Cabin Filter", en: "Cabin Air Filter" },
  "A/C Expansion Valve": { ar: "بلف وصمام تمدد المكيف — Expansion Valve", en: "A/C Expansion Valve" },
  "Spark Plug": { ar: "بواجي وشمعات الاحتراق (بلاكات / بلكات) — Spark Plugs", en: "Spark Plugs" },
  "Ignition Coil": { ar: "كويلات وملفات الإشعال (كويلات) — Ignition Coils", en: "Ignition Coils" },
  "Air Filter": { ar: "فلتر هواء المحرك (فلتر مكينة) — Air Filter", en: "Engine Air Filter" },
  "Fuel Pump & Housing Assembly": { ar: "طرمبة ومضخة الوقود (فيول بمب) — Fuel Pump", en: "Fuel Pump Assembly" },
  "Fuel Injector": { ar: "بخاخات وحاقن الوقود (نوزلات / بخاخات) — Fuel Injectors", en: "Fuel Injectors" },
  "Fuel Line / Hose": { ar: "فلاتر وخراطيم الوقود (فلتر بترول) — Fuel Lines", en: "Fuel Filter / Line" },
  "Throttle Body": { ar: "بوابة وهواء الثروتل (ثروتل بدي) — Throttle Body", en: "Throttle Body" },
  "Filter": { ar: "فلتر زيت القير (فلتر جير) — Transmission Filter", en: "Transmission Filter" },
  "Transmission Fluid": { ar: "زيت وسوائل القير (آيل جير / ATF) — ATF Fluid", en: "Transmission Fluid" },
  "Clutch Kit": { ar: "طقم وصحن الكلتش — Clutch Kit", en: "Clutch Kit" },
  "CV Axle": { ar: "العكوس ومحاور الدفع (أكسلات / اكسل) — CV Axles", en: "CV Axles" },
  "Drive Shaft": { ar: "عمود الكردان والشفت (درايف شفت) — Driveshaft", en: "Drive Shaft" },
  "Alternator / Generator": { ar: "دينمو وشاحن البطارية (دينمة) — Alternator", en: "Alternator / Generator" },
  "Starter Motor": { ar: "سلف ومارش التشغيل (ستارتر) — Starter Motor", en: "Starter Motor" },
  "Battery": { ar: "بطارية السيارة (بتري) — Battery", en: "Battery" },
  "Engine Control Module (ECM Computer)": { ar: "كمبيوتر وعقل المحرك (كمبيوتر ECU/ECM) — ECU", en: "Engine ECU / ECM" },
  "Speed Sensor": { ar: "حساسات السرعة والقير (سبيد سنسر) — Speed Sensor", en: "Speed Sensor" },
  "Oxygen (O2) Sensor": { ar: "حساسات الأكسجين والقزوز (O2 سنسر) — O2 Sensor", en: "Oxygen (O2) Sensor" },
  "Mass Air Flow (MAF) Sensor": { ar: "حساس تدفق الهواء (MAF سنسر) — MAF Sensor", en: "Mass Air Flow Sensor" },
  "Catalytic Converter": { ar: "دبة التلوث والبيئة (كربونة / دبة قزوز) — Catalytic Converter", en: "Catalytic Converter" },
  "Vapor Canister Purge Valve / Solenoid": { ar: "بلف تبخير الوقود (PCV بلف) — Purge Valve", en: "Purge / PCV Valve" },
  "Headlamp Assembly": { ar: "الأنوار والشموع الأمامية (ليتات قدام) — Headlights", en: "Headlamp Assembly" },
  "Tail Lamp Assembly": { ar: "الأنوار والإسطبات الخلفية (ليتات ورا) — Taillights", en: "Tail Lamp Assembly" },
  "Fog / Driving Lamp Assembly": { ar: "كشافات الضباب (كشافات) — Fog Lights", en: "Fog / Driving Lights" },
  "Bumper Cover": { ar: "الصدام الخارجي (دعامية / بمبر) — Bumpers", en: "Bumper Cover" },
  "Grille": { ar: "الشبك الأمامي (جريل) — Grille", en: "Front Grille" },
  "Fender": { ar: "الرفرف الجانبي (مدقار) — Fenders", en: "Fenders" },
  "Hood": { ar: "غطاء المحرك / الكبوت (بانيت / بونت) — Hood / Bonnet", en: "Hood / Bonnet" },
  "Outside Mirror Glass": { ar: "المرايا الجانبية (مناظر) — Side Mirrors", en: "Side Mirrors" },
  "Glass": { ar: "زجاج وجامات السيارة (جام) — Glass", en: "Auto Glass / Windshield" },
  "Wheel": { ar: "الإطارات والرنجات والتواير (رنجات / تواير) — Wheels & Tires", en: "Wheels & Tires" },
  "Lug Nut": { ar: "براغي وصواميل الجنوط (براغي رنج / نوتات) — Lug Nuts", en: "Wheel Lug Nuts" },
  "Tire Pressure Monitoring System (TPMS) Sensor": { ar: "حساس ضغط الإطارات (حساس تواير TPMS) — TPMS", en: "TPMS Sensor" },
  "Motor Mount": { ar: "كراسي وقواعد المحرك (كراسي مكينة) — Engine Mounts", en: "Motor / Engine Mounts" },
  "Oil Filter": { ar: "فلتر وزيت المحرك (فلتر آيل / آيل مكينة) — Oil Filter", en: "Engine Oil / Filter" },
  "Belt": { ar: "سيور المحرك الخارجية (قايش / قوايش) — Belts", en: "Drive Belts" },
  "Belt Tensioner": { ar: "شداد وبكرات السيور (شداد قايش) — Belt Tensioners", en: "Belt Tensioners" },
  "Oil Pump": { ar: "طرمبة ومضخة زيت المحرك (طرمبة آيل) — Oil Pump", en: "Oil Pump" },
  "Piston": { ar: "البساتم والشنابر (بساتم) — Pistons", en: "Pistons & Rings" },
  "Timing Chain": { ar: "جنزير وسير التايمنج (جنزير صدر) — Timing Chain", en: "Timing Chain" },
  "Cylinder Head Gasket": { ar: "قزقيت ووجه رأس المحرك (قازقيت مكينة) — Head Gasket", en: "Cylinder Head Gasket" },
  "Wiper Blade": { ar: "مساحات وشفرات الزجاج (مساحات جام) — Wiper Blades", en: "Wiper Blades" },
  "Washer Pump": { ar: "طرمبة ومضخة ماء المساحات (طرمبة ماي جام) — Washer Pump", en: "Washer Pump" }
};

// 🔄 دالة ترجمة وتنسيق اسم القطعة ثنائية اللغة
const formatBilingualPartName = (name: string, lang: 'ar' | 'en'): string => {
  if (!name) return '';
  if (lang === 'en') {
    return name
      .replace(/فحمات فرامل خلفية/g, 'Rear Brake Pads')
      .replace(/فحمات فرامل أمامية/g, 'Front Brake Pads')
      .replace(/هوب فرامل خلفي/g, 'Rear Brake Rotor')
      .replace(/هوب فرامل أمامي/g, 'Front Brake Rotor')
      .replace(/كرسي محرك خلفي/g, 'Rear Engine Mount')
      .replace(/مقص علوي مع جلب/g, 'Upper Control Arm with Bushings')
      .replace(/مقص سفلي كامل/g, 'Lower Control Arm')
      .replace(/دينامو الشحن/g, 'Alternator')
      .replace(/رديتر مكيف \(المكثف\)/g, 'A/C Condenser')
      .replace(/زيت محرك/g, 'Engine Oil')
      .replace(/شبك أمامي نيكل/g, 'Front Chrome Grille')
      .replace(/شمعة إضاءة أمامية/g, 'Headlight Assembly')
      .replace(/إسطب خلفي/g, 'Taillight Assembly')
      .replace(/بلف تبخير الزيت PCV/g, 'PCV Valve')
      .replace(/طقم مسامير جنوط/g, 'Wheel Lug Nuts Set')
      .replace(/شمعات احتراق \(بواجي\)/g, 'Spark Plugs Set')
      .replace(/سلف التشغيل \(مارش\)/g, 'Starter Motor')
      .replace(/سائل تبريد رديتر/g, 'Radiator Coolant')
      .replace(/مرآة جانبية كهربائية/g, 'Electric Side Mirror')
      .replace(/دبة التلوث \(كربونة\)/g, 'Catalytic Converter')
      .replace(/فلتر جير أوتوماتيك/g, 'Automatic Transmission Filter')
      .replace(/فلتر هواء المحرك/g, 'Engine Air Filter')
      .replace(/طرمبة بنزين كاملة/g, 'Complete Fuel Pump Assembly')
      .replace(/إطار/g, 'Tire')
      .replace(/صدام أمامي تجاري/g, 'Front Bumper');
  }

  const lower = name.toLowerCase();
  if (lower.includes('windshield wiper blade') || lower.includes('wiper blade')) return 'طقم مساحات زجاج (مساحات جام) — Wiper Blades';
  if (lower.includes('rear engine mount')) return 'كرسي محرك خلفي (كرسي مكينة ورا) — Rear Engine Mount';
  if (lower.includes('upper control arm')) return 'مقص علوي مع جلب (شيال فوق مع بوشات) — Upper Control Arm';
  if (lower.includes('lower control arm')) return 'مقص سفلي كامل (شيال تحت كامل) — Lower Control Arm';
  if (lower.includes('alternator')) return 'دينامو الشحن والكهرباء (دينمة) — Alternator';
  if (lower.includes('a/c condenser') || lower.includes('condenser')) return 'رديتر ومكثف المكيف (كوندنسر) — A/C Condenser';
  if (lower.includes('engine oil')) return 'زيت محرك للسيارات (آيل مكينة) — Engine Oil';
  if (lower.includes('front chrome grille') || lower.includes('grille')) return 'شبك أمامي نيكل (جريل) — Front Grille';
  if (lower.includes('headlight') || lower.includes('headlamp')) return 'شمعة إضاءة أمامية (ليت قدام) — Headlight Assembly';
  if (lower.includes('taillight') || lower.includes('tail lamp')) return 'إسطب وأنوار خلفية (ليت ورا) — Taillight Assembly';
  if (lower.includes('pcv valve')) return 'بلف تبخير الزيت (PCV Valve)';
  if (lower.includes('lug nut') || lower.includes('wheel bolts')) return 'طقم براغي وصواميل رنجات — Lug Nuts Set';
  if (lower.includes('rear brake rotor') || lower.includes('brake rotor')) return 'هوب فرامل خلفي (درام ويل) — Rear Brake Rotor';
  if (lower.includes('spark plug')) return 'شمعات احتراق وبواجي (بلاكات) — Spark Plugs';
  if (lower.includes('starter motor') || lower.includes('starter')) return 'سلف ومارش التشغيل (ستارتر) — Starter Motor';
  if (lower.includes('coolant') || lower.includes('antifreeze')) return 'سائل وماء تبريد رديتر (ماي رديتر) — Coolant';
  if (lower.includes('side mirror') || lower.includes('mirror')) return 'مرآة جانبية كهربائية (منظرة) — Side Mirror';
  if (lower.includes('catalytic converter')) return 'دبة التلوث والبيئة (كربونة) — Catalytic Converter';
  if (lower.includes('transmission filter')) return 'فلتر زيت القير (فلتر جير) — Transmission Filter';
  if (lower.includes('air filter')) return 'فلتر هواء المحرك (فلتر مكينة) — Engine Air Filter';
  if (lower.includes('fuel pump')) return 'طرمبة ومضخة بنزين كاملة (فيول بمب) — Fuel Pump';
  if (lower.includes('tire') || lower.includes('tires')) return 'إطار وكفر سيارات (تواير / تاير) — Tire';
  if (lower.includes('rear brake pads') || lower.includes('brake pads')) return 'فحمات وقماشات فرامل خلفية (سفايف ورا) — Rear Brake Pads';
  if (lower.includes('front brake pads')) return 'فحمات وقماشات فرامل أمامية (سفايف قدام) — Front Brake Pads';
  if (lower.includes('bumper')) return 'صدام وغطاء خارجي (دعامية / بمبر) — Bumper';

  return name;
};

const MAKE_DOMAINS: Record<string, string> = {
  "تويوتا": "toyota.com", "Toyota": "toyota.com",
  "هيونداي": "hyundai.com", "Hyundai": "hyundai.com",
  "نيسان": "nissan-global.com", "Nissan": "nissan-global.com",
  "فورد": "ford.com", "Ford": "ford.com",
  "شفروليه": "chevrolet.com", "Chevrolet": "chevrolet.com",
  "كيا": "kia.com", "Kia": "kia.com",
  "هوندا": "honda.com", "Honda": "honda.com",
  "لكزس": "lexus.com", "Lexus": "lexus.com",
  "ميتسوبيشي": "mitsubishicars.com", "Mitsubishi": "mitsubishicars.com",
  "مازدا": "mazda.com", "Mazda": "mazda.com",
  "جي إم سي": "gmc.com", "GMC": "gmc.com",
  "بي إم دبليو": "bmw.com", "BMW": "bmw.com",
  "مرسيدس": "mercedes-benz.com", "Mercedes-Benz": "mercedes-benz.com",
  "فولكس فاجن": "vw.com", "Volkswagen": "vw.com",
  "أودي": "audi.com", "Audi": "audi.com",
  "جيب": "jeep.com", "Jeep": "jeep.com",
  "دودج": "dodge.com", "Dodge": "dodge.com",
  "لاند روفر": "landrover.com", "Land Rover": "landrover.com"
};

interface SidebarProps {
  lang: 'ar' | 'en';
  carData?: any;
  years?: string[];
  translateMake?: Record<string, string>;
  translateModel?: Record<string, string>;
  categories?: string[];
  expandedCategories?: string[];
  toggleCategory?: (category: string) => void;
  inventory: any[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterMake?: string;
  setFilterMake?: (make: string) => void;
  filterModel?: string;
  setFilterModel?: (model: string) => void;
  filterYear?: string;
  setFilterYear?: (year: string) => void;
  filterCategory?: string;
  setFilterCategory?: (cat: string) => void;
  filterEngine?: string;
  setFilterEngine?: (engine: string) => void;
  addToCart?: (item: any, quantity: number) => void;
  onInquire?: (item: any) => void;
  siteSettings?: any;
  [key: string]: any;
}

export const SidebarFilters: React.FC<SidebarProps> = (props) => {
  const {
    lang, carData, inventory,
    searchTerm, setSearchTerm, addToCart, onInquire, siteSettings
  } = props;

  const activeCarData = carData || CAR_DATA;
  const isRtl = lang === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fontFamily = fontFor(lang);

  // 🚘 حالات فحص الشاصي والاستمارة
  const [searchMode, setSearchMode] = useState<'visual' | 'tree'>('visual');
  const [vinInput, setVinInput] = useState('');
  const [isDecodingVin, setIsDecodingVin] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [decodedVehicle, setDecodedVehicle] = useState<{ make: string; model: string; year: string; engine?: string; vin?: string } | null>(null);

  // 📂 حالات شجرة التصفية
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [nodeDataCache, setNodeDataCache] = useState<Record<string, any>>({});
  const [loadingNodes, setLoadingNodes] = useState<Record<string, boolean>>({});

  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const [partQuantities, setPartQuantities] = useState<Record<number, number>>({});
  const [activeSearchQuery, setActiveSearchQuery] = useState<string>('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [custPhone, setCustPhone] = useState('');
  const [custNotes, setCustNotes] = useState('');
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);
  const [reqSubmitted, setReqSubmitted] = useState(false);

  // 🔢 عدد القطع المعروضة والتحميل التلقائي عند التمرير (يبدأ بـ 20 قطعة)
  const [displayLimit, setDisplayLimit] = useState<number>(20);

  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'default'>('default');
  const [partImageIndexes, setPartImageIndex] = useState<Record<number, number>>({});
  const [expandedPartCards, setExpandedPartCards] = useState<Record<number, boolean>>({});
  const [detailedPart, setDetailedPart] = useState<any | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=400&auto=format&fit=crop&q=60";
  const isBNPLEnabled = siteSettings?.enableBNPL ?? true;

  // إعادة ضبط الحد عند كل بحث جديد
  useEffect(() => {
    setDisplayLimit(20);
  }, [searchTerm, activeSearchQuery, decodedVehicle]);

  // مستمع التمرير لأسفل الصفحة لزيادة عدد القطع المعروضة تلقائياً (+20)
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 400) {
        setDisplayLimit(prev => prev + 20);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getQty = (id: number) => partQuantities[id] || 1;

  const changeQty = (part: any, delta: number) => {
    const maxStock = typeof part.stock !== 'undefined' && part.stock !== null ? Number(part.stock) : 5;
    const current = getQty(part.id);
    const newQty = Math.max(1, Math.min(maxStock, current + delta));
    setPartQuantities(prev => ({ ...prev, [part.id]: newQty }));
  };

  const handleNextImage = (partId: number, totalImages: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setPartImageIndex(prev => ({ ...prev, [partId]: ((prev[partId] || 0) + 1) % totalImages }));
  };

  const handlePrevImage = (partId: number, totalImages: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setPartImageIndex(prev => ({ ...prev, [partId]: ((prev[partId] || 0) - 1 + totalImages) % totalImages }));
  };

  const handleSharePart = (part: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}?partId=${part.id}`;
    if (navigator.share) {
      navigator.share({ title: part.name, text: `قطعة غيار: ${part.name} - ${part.price} QAR`, url: shareUrl }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert(isRtl ? 'تم نسخ رابط القطعة إلى الحافظة!' : 'Part link copied to clipboard!');
    }
  };

  const togglePartCardExpand = (partId: number) => {
    setExpandedPartCards(prev => ({ ...prev, [partId]: !prev[partId] }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearchQuery(searchTerm.trim());
  };

  const clearSearch = () => {
    setSearchTerm('');
    setActiveSearchQuery('');
    setDecodedVehicle(null);
    setVinInput('');
    setDisplayLimit(20);
  };

  // 🧠 فك تشفير رقم الشاصي (NHTSA Decoder)
  const decodeVinNumber = async (cleanVin: string) => {
    if (cleanVin.length !== 17) {
      alert(isRtl ? 'رقم الشاصي يجب أن يتكون من 17 حرف ورقم تماماً' : 'VIN must be exactly 17 characters');
      return;
    }

    setIsDecodingVin(true);
    setStatusMsg(isRtl ? 'جاري فك تشفير رقم الشاصي وتحديد السيارة...' : 'Decoding VIN & identifying vehicle...');
    try {
      const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${encodeURIComponent(cleanVin)}?format=json`);
      if (response.ok) {
        const json = await response.json();
        const result = json.Results?.[0];

        if (result && result.Make) {
          const detectedMake = result.Make;
          const detectedModel = result.Model || '';
          const detectedYear = result.ModelYear || '';
          const detectedEngine = result.DisplacementL ? `${result.DisplacementL}L` : '';

          let matchedMakeKey = Object.keys(activeCarData).find(
            m => m.toLowerCase() === detectedMake.toLowerCase() || activeCarData[m]?.en?.toLowerCase() === detectedMake.toLowerCase()
          ) || detectedMake;

          setDecodedVehicle({
            make: matchedMakeKey,
            model: detectedModel,
            year: detectedYear,
            engine: detectedEngine,
            vin: cleanVin
          });
          setStatusMsg('');
          return;
        }
      }
      setDecodedVehicle({ make: '', model: '', year: '', vin: cleanVin });
    } catch (err) {
      alert(isRtl ? 'تعذر فك تشفير الشاصي، يرجى التأكد من صحة الرقم' : 'Failed to decode VIN');
    } finally {
      setIsDecodingVin(false);
      setStatusMsg('');
    }
  };

  // 📷 فحص وقراءة الاستمارة بالذكاء الاصطناعي
  const handleIstemaraUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsDecodingVin(true);
    setStatusMsg(isRtl ? 'جاري فحص الاستمارة بالذكاء الاصطناعي...' : 'Scanning registration card with AI...');

    try {
      const result = await scanIstemara(file, activeCarData);

      if (result.success && result.vin && result.vin.length === 17) {
        setVinInput(result.vin);
        await decodeVinNumber(result.vin);
        return;
      }

      if (result.success && (result.make || result.model)) {
        setDecodedVehicle({
          make: result.make || 'Toyota',
          model: result.model || 'Camry',
          year: result.year || '2015',
          vin: result.vin || ''
        });
        return;
      }

      alert(isRtl ? 'لم نتمكن من قراءة رقم الشاصي بوضوح، يرجى كتابته يدوياً.' : 'Could not detect VIN clearly. Please type it manually.');
    } catch (err) {
      alert(isRtl ? 'حدث خطأ أثناء فحص الصورة.' : 'Error scanning image.');
    } finally {
      setIsDecodingVin(false);
      setStatusMsg('');
    }
  };

  // 🎯 محرك تقييم مطابقة الشاصي والسيارة (متطابق / غير متطابق / اسأل البائع)
  const getPartFitmentStatus = (part: any, vehicle: { make: string; model: string; year: string; engine?: string; vin?: string } | null): 'compatible' | 'incompatible' | 'uncertain' => {
    if (!vehicle) return 'uncertain';

    if (!vehicle.make && !vehicle.vin) return 'uncertain';

    const excelVins = part.compatible_vins || part.vin_numbers || part.vins || part.chassis_code;
    if (excelVins && vehicle.vin) {
      const cleanVin = vehicle.vin.toUpperCase().trim();
      const vinList = String(excelVins).toUpperCase().split(/[,;\s\n/]+/).map(v => v.trim()).filter(Boolean);
      if (vinList.some(v => cleanVin === v || cleanVin.startsWith(v) || v.startsWith(cleanVin.substring(0, 8)))) {
        return 'compatible';
      }
    }

    const hasPartVehicleData = !!(part.make || part.model || part.year || excelVins);
    if (!hasPartVehicleData) {
      return 'uncertain';
    }

    if (vehicle.make && part.make) {
      const pMake = (part.make || '').toLowerCase();
      const vMake = vehicle.make.toLowerCase();
      if (!pMake.includes(vMake) && !vMake.includes(pMake)) return 'incompatible';
    }

    if (vehicle.model && part.model) {
      const pModel = (part.model || '').toLowerCase();
      const vModel = vehicle.model.toLowerCase();
      if (!pModel.includes(vModel) && !vModel.includes(pModel)) return 'incompatible';
    }

    if (vehicle.year && part.year) {
      const pYearStr = String(part.year).trim();
      const vYear = Number(vehicle.year);
      if (pYearStr.includes('-')) {
        const [start, end] = pYearStr.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end) && !isNaN(vYear)) {
          if (vYear < Math.min(start, end) || vYear > Math.max(start, end)) return 'incompatible';
        }
      } else if (!isNaN(vYear) && !pYearStr.includes(String(vYear))) {
        return 'incompatible';
      }
    }

    if (vehicle.make && part.make) {
      return 'compatible';
    }

    return 'uncertain';
  };

  // 🔍 دالة فحص رقم القطعة فقط (تجاهل النصوص والأسماء العامة)
  const matchesPartNumberOnly = (part: any, query: string): boolean => {
    if (!query) return false;
    const cleanQuery = query.toLowerCase().replace(/[\s\-_]/g, '');
    if (!cleanQuery) return false;

    const partNo = String(part.part_number || '').toLowerCase().replace(/[\s\-_]/g, '');
    const code = String(part.code || '').toLowerCase().replace(/[\s\-_]/g, '');
    const sku = String(part.sku || '').toLowerCase().replace(/[\s\-_]/g, '');
    const oem = String(part.oem_number || '').toLowerCase().replace(/[\s\-_]/g, '');
    const id = String(part.id || '');

    return (
      (partNo !== '' && partNo.includes(cleanQuery)) ||
      (code !== '' && code.includes(cleanQuery)) ||
      (sku !== '' && sku.includes(cleanQuery)) ||
      (oem !== '' && oem.includes(cleanQuery)) ||
      (id === cleanQuery)
    );
  };

  const fetchYearsForMake = async (make: string) => {
    const cacheKey = `years_${make}`;
    if (nodeDataCache[cacheKey]) return nodeDataCache[cacheKey];

    setLoadingNodes(prev => ({ ...prev, [cacheKey]: true }));
    try {
      const url = `${SUPABASE_URL}/parts?make=eq.${encodeURIComponent(make)}&select=year`;
      const res = await fetch(url, { headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` } });
      if (res.ok) {
        const data = await res.json();
        const expandedYearsSet = new Set<string>();

        data.forEach((item: any) => {
          const yStr = String(item.year || '').trim();
          if (yStr.includes('-')) {
            const [start, end] = yStr.split('-').map(Number);
            if (!isNaN(start) && !isNaN(end)) {
              for (let y = Math.min(start, end); y <= Math.max(start, end); y++) {
                expandedYearsSet.add(String(y));
              }
            } else {
              expandedYearsSet.add(yStr);
            }
          } else if (yStr) {
            expandedYearsSet.add(yStr);
          }
        });

        const availableYears = Array.from(expandedYearsSet).sort((a, b) => Number(b) - Number(a));
        setNodeDataCache(prev => ({ ...prev, [cacheKey]: availableYears }));
        return availableYears;
      }
    } catch (e) {
    } finally {
      setLoadingNodes(prev => ({ ...prev, [cacheKey]: false }));
    }
    return [];
  };

  const fetchModelsForYear = async (make: string, year: string) => {
    const cacheKey = `models_${make}_${year}`;
    if (nodeDataCache[cacheKey]) return nodeDataCache[cacheKey];

    setLoadingNodes(prev => ({ ...prev, [cacheKey]: true }));
    try {
      const url = `${SUPABASE_URL}/parts?make=eq.${encodeURIComponent(make)}&select=model,year`;
      const res = await fetch(url, { headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` } });
      if (res.ok) {
        const data = await res.json();
        const availableModels = Array.from(new Set(
          data.filter((item: any) => {
            const yStr = String(item.year || '').trim();
            if (yStr.includes('-')) {
              const [start, end] = yStr.split('-').map(Number);
              const target = Number(year);
              return target >= Math.min(start, end) && target <= Math.max(start, end);
            }
            return yStr === year;
          }).map((item: any) => item.model).filter(Boolean)
        )) as string[];

        setNodeDataCache(prev => ({ ...prev, [cacheKey]: availableModels }));
        return availableModels;
      }
    } catch (e) {
    } finally {
      setLoadingNodes(prev => ({ ...prev, [cacheKey]: false }));
    }
    return [];
  };

  const fetchEnginesForVehicle = async (make: string, year: string, model: string) => {
    const cacheKey = `engines_${make}_${year}_${model}`;
    if (nodeDataCache[cacheKey]) return nodeDataCache[cacheKey];

    setLoadingNodes(prev => ({ ...prev, [cacheKey]: true }));
    try {
      const url = `${SUPABASE_URL}/parts?make=eq.${encodeURIComponent(make)}&model=eq.${encodeURIComponent(model)}&select=engine,year`;
      const res = await fetch(url, { headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` } });
      if (res.ok) {
        const data = await res.json();
        const filteredData = data.filter((item: any) => {
          const yStr = String(item.year || '').trim();
          if (yStr.includes('-')) {
            const [start, end] = yStr.split('-').map(Number);
            const target = Number(year);
            matchTarget(start, end, target);
          }
          return yStr === year;
        });

        function matchTarget(start: number, end: number, target: number) {
          return target >= Math.min(start, end) && target <= Math.max(start, end);
        }

        let uniqueEngines = Array.from(new Set(filteredData.map((item: any) => item.engine && item.engine.trim() !== '' ? item.engine : (isRtl ? 'جميع المحركات (بنزين / ديزل)' : 'All Engines')))) as string[];
        if (uniqueEngines.length === 0) uniqueEngines = [isRtl ? 'جميع المحركات (بنزين / ديزل)' : 'All Engines'];

        setNodeDataCache(prev => ({ ...prev, [cacheKey]: uniqueEngines }));
        return uniqueEngines;
      }
    } catch (e) {
    } finally {
      setLoadingNodes(prev => ({ ...prev, [cacheKey]: false }));
    }
    return [isRtl ? 'جميع المحركات (بنزين / ديزل)' : 'All Engines'];
  };

  const fetchMainCategoriesForEngine = async (make: string, year: string, model: string, engine: string) => {
    const cacheKey = `maincats_${make}_${year}_${model}_${engine}`;
    if (nodeDataCache[cacheKey]) return nodeDataCache[cacheKey];

    setLoadingNodes(prev => ({ ...prev, [cacheKey]: true }));
    try {
      const url = `${SUPABASE_URL}/parts?make=eq.${encodeURIComponent(make)}&model=eq.${encodeURIComponent(model)}&select=name,category,engine,year`;
      const res = await fetch(url, { headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` } });
      if (res.ok) {
        const data = await res.json();
        const filteredParts = data.filter((p: any) => {
          const yStr = String(p.year || '').trim();
          let matchYear = yStr === year;
          if (yStr.includes('-')) {
            const [start, end] = yStr.split('-').map(Number);
            const target = Number(year);
            matchYear = target >= Math.min(start, end) && target <= Math.max(start, end);
          }
          return matchYear;
        });

        const mainCategories = new Set<string>();
        filteredParts.forEach((p: any) => {
          const pCat = p.category || getPartCategory(p.name) || '';
          const mainCat = pCat.includes('>') ? pCat.split('>')[0].trim() : pCat;
          if (mainCat) mainCategories.add(mainCat);
        });

        const result = Array.from(mainCategories);
        setNodeDataCache(prev => ({ ...prev, [cacheKey]: result }));
        return result;
      }
    } catch (e) {
    } finally {
      setLoadingNodes(prev => ({ ...prev, [cacheKey]: false }));
    }
    return [];
  };

  const fetchSubCategoriesForMain = async (make: string, year: string, model: string, engine: string, mainCategory: string) => {
    const cacheKey = `subcats_${make}_${year}_${model}_${engine}_${mainCategory}`;
    if (nodeDataCache[cacheKey]) return nodeDataCache[cacheKey];

    setLoadingNodes(prev => ({ ...prev, [cacheKey]: true }));
    try {
      const url = `${SUPABASE_URL}/parts?make=eq.${encodeURIComponent(make)}&model=eq.${encodeURIComponent(model)}&select=name,category,engine,year`;
      const res = await fetch(url, { headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` } });
      if (res.ok) {
        const data = await res.json();
        const filteredParts = data.filter((p: any) => {
          const yStr = String(p.year || '').trim();
          let matchYear = yStr === year;
          if (yStr.includes('-')) {
            const [start, end] = yStr.split('-').map(Number);
            const target = Number(year);
            matchYear = target >= Math.min(start, end) && target <= Math.max(start, end);
          }
          const pCat = p.category || getPartCategory(p.name) || '';
          const pMainCat = pCat.includes('>') ? pCat.split('>')[0].trim() : pCat;
          return matchYear && pMainCat === mainCategory;
        });

        const subCategories = new Set<string>();
        filteredParts.forEach((p: any) => {
          const pCat = p.category || getPartCategory(p.name) || '';
          const subCat = pCat.includes('>') ? pCat.split('>')[1].trim() : (isRtl ? 'عام / أخرى' : 'General / Other');
          subCategories.add(subCat);
        });

        const result = Array.from(subCategories);
        setNodeDataCache(prev => ({ ...prev, [cacheKey]: result }));
        return result;
      }
    } catch (e) {
    } finally {
      setLoadingNodes(prev => ({ ...prev, [cacheKey]: false }));
    }
    return [];
  };

  const fetchPartsForSubCategory = async (make: string, year: string, model: string, engine: string, mainCategory: string, subCategory: string) => {
    const cacheKey = `parts_${make}_${year}_${model}_${engine}_${mainCategory}_${subCategory}`;
    if (nodeDataCache[cacheKey]) return nodeDataCache[cacheKey];

    setLoadingNodes(prev => ({ ...prev, [cacheKey]: true }));
    try {
      const url = `${SUPABASE_URL}/parts?make=eq.${encodeURIComponent(make)}&model=eq.${encodeURIComponent(model)}&select=*`;
      const res = await fetch(url, { headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` } });
      if (res.ok) {
        const data = await res.json();
        const filtered = data.filter((p: any) => {
          const yStr = String(p.year || '').trim();
          let matchYear = yStr === year;
          if (yStr.includes('-')) {
            const [start, end] = yStr.split('-').map(Number);
            const target = Number(year);
            matchYear = target >= Math.min(start, end) && target <= Math.max(start, end);
          }
          const pCat = p.category || getPartCategory(p.name) || '';
          const pMainCat = pCat.includes('>') ? pCat.split('>')[0].trim() : pCat;
          const pSubCat = pCat.includes('>') ? pCat.split('>')[1].trim() : (isRtl ? 'عام / أخرى' : 'General / Other');
          return matchYear && pMainCat === mainCategory && pSubCat === subCategory;
        });
        setNodeDataCache(prev => ({ ...prev, [cacheKey]: filtered }));
        return filtered;
      }
    } catch (e) {
    } finally {
      setLoadingNodes(prev => ({ ...prev, [cacheKey]: false }));
    }
    return [];
  };

  const toggleNode = async (nodeKey: string, fetchAction?: () => Promise<any>) => {
    const isCurrentlyOpen = !!expandedNodes[nodeKey];

    if (isCurrentlyOpen) {
      setExpandedNodes(prev => {
        const nextState = { ...prev };
        Object.keys(nextState).forEach(key => {
          if (key === nodeKey || key.startsWith(nodeKey)) delete nextState[key];
        });
        return nextState;
      });

      setNodeDataCache(prev => {
        const nextCache = { ...prev };
        const cleanPattern = nodeKey.replace(/^(make|year|model|eng|maincat|subcat)_/, '');
        Object.keys(nextCache).forEach(cacheKey => {
          if (cacheKey.includes(cleanPattern) || cacheKey.includes(nodeKey)) delete nextCache[cacheKey];
        });
        return nextCache;
      });

    } else {
      setExpandedNodes(prev => ({ ...prev, [nodeKey]: true }));
      if (fetchAction) await fetchAction();
    }
  };

  const processAndSortParts = (partsList: any[]) => {
    if (sortBy === 'price_asc') return [...partsList].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    if (sortBy === 'price_desc') return [...partsList].sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    return partsList;
  };

  // 🎯 تصفية القطع حصرياً برقم القطعة وترتيب المتطابقة في المقدمة
  const searchResults = processAndSortParts(
    inventory.filter((part: any) => {
      if (activeSearchQuery) return matchesPartNumberOnly(part, activeSearchQuery);
      return false;
    })
  ).sort((a: any, b: any) => {
    if (!decodedVehicle) return 0;
    const rank: Record<string, number> = { compatible: 3, uncertain: 2, incompatible: 1 };
    const aRank = rank[getPartFitmentStatus(a, decodedVehicle)] || 0;
    const bRank = rank[getPartFitmentStatus(b, decodedVehicle)] || 0;
    return bRank - aRank;
  });

  const displayedSearchResults = searchResults.slice(0, displayLimit);

  const handleInAppRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custPhone.trim()) return alert(isRtl ? 'يرجى إدخال رقم الهاتف' : 'Please enter phone number');

    setIsSubmittingReq(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/orders`, {
        method: 'POST',
        headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify([{
          part_name: isRtl ? `طلب خاص برقم: ${activeSearchQuery || decodedVehicle?.vin || 'طلب قطعة'}` : `Special Request PN: ${activeSearchQuery || decodedVehicle?.vin}`,
          price: 0,
          customer_phone: custPhone,
          status: 'pending',
          notes: custNotes || (isRtl ? 'طلب قطعة غير متوفرة' : 'Requested unavailable part')
        }])
      });

      if (response.ok) setReqSubmitted(true);
    } catch (err) {} finally { setIsSubmittingReq(false); }
  };

  /* ==========================================================================
     PART CARD — high-end product tile: refined thumbnail rail, monospace
     part-number chip, fitment guarantee badge, stepper, dual CTA.
  ========================================================================== */
  const renderPartCard = (part: any) => {
    const partNo = part.part_number || part.code || part.sku || part.id;
    const fitmentStatus = decodedVehicle ? getPartFitmentStatus(part, decodedVehicle) : null;
    const qty = getQty(part.id);
    const maxStock = typeof part.stock !== 'undefined' && part.stock !== null ? Number(part.stock) : 5;
    const isOutOfStock = maxStock <= 0;

    const tierInfo = classifyPartTier(part);
    const isExpanded = !!expandedPartCards[part.id];
    const isHovered = hoveredCard === part.id;

    const allImages: string[] = part.additional_images && part.additional_images.length > 0
      ? part.additional_images
      : [part.image_url || part.image || DEFAULT_IMAGE];

    const currentImgIndex = partImageIndexes[part.id] || 0;
    const activeImage = allImages[currentImgIndex] || DEFAULT_IMAGE;
    const formattedPart = { ...part, image_url: activeImage, image: activeImage };

    const rawVehicles = inventory.filter((p: any) => {
      const modalPN = (partNo || '').toString().trim().toLowerCase();
      const itemPN = (p.part_number || p.code || p.sku || '').toString().trim().toLowerCase();
      return modalPN && itemPN ? modalPN === itemPN : p.id === part.id;
    });

    const groupedFitmentMap: Record<string, { make: string; model: string; years: number[] }> = {};
    rawVehicles.forEach((v: any) => {
      const key = `${v.make}_${v.model || 'عام'}`;
      if (!groupedFitmentMap[key]) groupedFitmentMap[key] = { make: v.make, model: v.model || (isRtl ? 'عام' : 'General'), years: [] };
      if (v.year && !isNaN(Number(v.year))) groupedFitmentMap[key].years.push(Number(v.year));
    });

    const formattedFitmentList = Object.values(groupedFitmentMap).map(item => {
      const sortedYears = Array.from(new Set(item.years)).sort((a, b) => a - b);
      let yearRangeStr = '';
      if (sortedYears.length === 0) yearRangeStr = String(part.year || (isRtl ? 'جميع السنوات' : 'All Years'));
      else if (sortedYears.length === 1) yearRangeStr = String(sortedYears[0]);
      else yearRangeStr = `${sortedYears[0]}-${sortedYears[sortedYears.length - 1]}`;

      return { make: item.make, model: item.model, yearRange: yearRangeStr };
    });

    const installmentValue = (Number(part.price || 0) / 4).toFixed(2);
    const displayName = formatBilingualPartName(part.name, lang);

    const fitmentPalette = fitmentStatus === 'compatible'
      ? { bg: TOKENS.successTint, fg: TOKENS.successInk, line: TOKENS.successLine, icon: 'checkCircle' as IconName }
      : fitmentStatus === 'incompatible'
      ? { bg: TOKENS.dangerTint, fg: TOKENS.dangerInk, line: TOKENS.dangerLine, icon: 'alertTriangle' as IconName }
      : { bg: TOKENS.amberTint, fg: TOKENS.amber, line: TOKENS.amberLine, icon: 'message' as IconName };

    return (
      <div
        key={part.id}
        onMouseEnter={() => setHoveredCard(part.id)}
        onMouseLeave={() => setHoveredCard(null)}
        style={{
          backgroundColor: TOKENS.white,
          padding: '18px',
          borderRadius: '18px',
          border: `1px solid ${isHovered ? TOKENS.copperLine : TOKENS.hairline}`,
          display: 'flex', flexDirection: 'column', gap: '13px',
          boxShadow: isHovered
            ? '0 18px 34px -14px rgba(9,13,22,0.16), 0 2px 8px rgba(234,88,12,0.06)'
            : '0 2px 14px rgba(9,13,22,0.045)',
          position: 'relative',
          transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
          transition: 'all 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
          fontFamily
        }}
      >
        <button
          onClick={(e) => handleSharePart(part, e)}
          title={isRtl ? "مشاركة القطعة" : "Share Part"}
          style={{
            position: 'absolute', top: '14px', [isRtl ? 'left' : 'right']: '14px',
            backgroundColor: TOKENS.alabaster, border: `1px solid ${TOKENS.hairline}`, borderRadius: '10px',
            width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 2, color: TOKENS.slateText, transition: 'all 0.18s ease'
          }}
        >
          <Icon name="share" size={14} />
        </button>

        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <div style={{ position: 'relative', width: '88px', height: '88px', flexShrink: 0 }}>
            <img
              src={activeImage}
              alt={displayName}
              onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '13px', border: `1px solid ${TOKENS.hairline}` }}
            />
            {allImages.length > 1 && (
              <>
                <button
                  onClick={(e) => handlePrevImage(part.id, allImages.length, e)}
                  style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '-8px', backgroundColor: TOKENS.white, border: `1px solid ${TOKENS.hairline}`, borderRadius: '50%', width: '22px', height: '22px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.ink, boxShadow: '0 2px 6px rgba(0,0,0,0.12)' }}
                >
                  <Icon name="chevronLeft" size={12} strokeWidth={2} />
                </button>
                <button
                  onClick={(e) => handleNextImage(part.id, allImages.length, e)}
                  style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: '-8px', backgroundColor: TOKENS.white, border: `1px solid ${TOKENS.hairline}`, borderRadius: '50%', width: '22px', height: '22px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.ink, boxShadow: '0 2px 6px rgba(0,0,0,0.12)' }}
                >
                  <Icon name="chevronRight" size={12} strokeWidth={2} />
                </button>
              </>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '14.5px', color: TOKENS.ink, fontWeight: 700, lineHeight: '1.4', letterSpacing: '-0.01em' }}>
              {displayName}
            </h4>

            <div style={{
              fontSize: '11px', color: TOKENS.sky, backgroundColor: TOKENS.skyTint, padding: '3px 8px', borderRadius: '6px',
              fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px', marginBottom: '6px',
              border: `1px solid ${TOKENS.skyLine}`, fontFamily: "'JetBrains Mono', 'SFMono-Regular', Consolas, monospace"
            }}>
              <Icon name="search" size={11} strokeWidth={2} />
              {isRtl ? 'رقم القطعة' : 'Part No.'}: {partNo}
            </div>

            {decodedVehicle && fitmentStatus && (
              <div style={{
                margin: '6px 0', padding: '7px 10px', borderRadius: '9px', fontSize: '11.5px', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: '7px',
                backgroundColor: fitmentPalette.bg, color: fitmentPalette.fg, border: `1px solid ${fitmentPalette.line}`
              }}>
                <Icon name={fitmentPalette.icon} size={14} strokeWidth={2} />
                <span>
                  {fitmentStatus === 'compatible' && (
                    isRtl
                      ? `متطابق 100% مع سيارتك (${decodedVehicle.make} ${decodedVehicle.model})`
                      : `100% Compatible with (${decodedVehicle.make} ${decodedVehicle.model})`
                  )}
                  {fitmentStatus === 'incompatible' && (
                    isRtl
                      ? `غير متطابق مع سيارتك (${decodedVehicle.make} ${decodedVehicle.model})`
                      : `Not Compatible with (${decodedVehicle.make} ${decodedVehicle.model})`
                  )}
                  {fitmentStatus === 'uncertain' && (
                    isRtl
                      ? 'اسأل البائع للتأكد من التوافق مع سيارتك'
                      : 'Ask Seller to confirm vehicle fitment'
                  )}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '10px', fontWeight: 700, letterSpacing: '0.02em',
                color: tierInfo.tier === 'oem' ? TOKENS.sky : TOKENS.copperDeep,
                backgroundColor: tierInfo.tier === 'oem' ? TOKENS.skyTint : TOKENS.copperTint,
                padding: '2px 7px', borderRadius: '5px', display: 'inline-flex', alignItems: 'center', gap: '4px'
              }}>
                <Icon name="shield" size={10} strokeWidth={2} />
                {part.part_type || (tierInfo.tier === 'oem' ? (isRtl ? 'أصلي' : 'OEM') : (isRtl ? tierInfo.label : 'Aftermarket'))}
              </span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: TOKENS.slateText, backgroundColor: TOKENS.alabaster, padding: '2px 7px', borderRadius: '5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Icon name="sparkle" size={10} strokeWidth={2} />
                {part.part_condition || (isRtl ? 'جديد' : 'New')}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: TOKENS.copperDeep, backgroundColor: TOKENS.copperTint, border: `1px solid ${TOKENS.copperLine}`, padding: '2px 7px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Icon name="star" size={11} strokeWidth={1.5} />
                {part.garage_rating ? Number(part.garage_rating).toFixed(1) : '4.9'}
              </span>
              <span style={{ fontSize: '11px', color: TOKENS.mutedText }}>
                {part.garage_name || (isRtl ? 'كراج معتمد' : 'Verified Garage')}
              </span>
            </div>

            <div style={{ color: TOKENS.copper, fontWeight: 900, fontSize: '18px', marginTop: '6px', letterSpacing: '-0.02em' }}>
              {part.price} <span style={{ fontSize: '12px', fontWeight: 700, color: TOKENS.copperDeep }}>{isRtl ? 'ر.ق' : 'QAR'}</span>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '12px', borderTop: `1px dashed ${TOKENS.hairline}` }}>
            <div style={{ border: `1px solid ${TOKENS.hairline}`, borderRadius: '12px', overflow: 'hidden', backgroundColor: TOKENS.white }}>
              <div style={{ backgroundColor: TOKENS.alabaster, padding: '8px 12px', fontSize: '11.5px', fontWeight: 700, color: TOKENS.ink, borderBottom: `1px solid ${TOKENS.hairline}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icon name="car" size={13} strokeWidth={1.75} color={TOKENS.slateText} />
                  {isRtl ? 'دليل توافق القطعة' : 'Part Fitment Guide'}
                </span>
                <span style={{ color: TOKENS.sky, fontWeight: 700 }}>({formattedFitmentList.length})</span>
              </div>
              <div style={{ maxHeight: '92px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: isRtl ? 'right' : 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: TOKENS.alabaster, color: TOKENS.mutedText }}>
                      <th style={{ padding: '5px 10px', fontWeight: 600 }}>{isRtl ? 'الشركة' : 'Make'}</th>
                      <th style={{ padding: '5px 10px', fontWeight: 600 }}>{isRtl ? 'السيارة' : 'Model'}</th>
                      <th style={{ padding: '5px 10px', fontWeight: 600 }}>{isRtl ? 'السنوات' : 'Years'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formattedFitmentList.map((fit, idx) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${TOKENS.alabaster}` }}>
                        <td style={{ padding: '5px 10px', fontWeight: 700 }}>{fit.make}</td>
                        <td style={{ padding: '5px 10px' }}>{fit.model}</td>
                        <td style={{ padding: '5px 10px', color: TOKENS.copper, fontWeight: 700 }}>{fit.yearRange}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ backgroundColor: TOKENS.alabaster, padding: '11px 12px', borderRadius: '12px', border: `1px solid ${TOKENS.hairline}`, fontSize: '11.5px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ color: TOKENS.success, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="truck" size={13} strokeWidth={1.75} />
                {isRtl ? 'التوصيل المتوقع: خلال 24 - 48 ساعة' : 'Estimated Delivery: 24-48 Hours'}
              </div>
              {isBNPLEnabled && (
                <div style={{ color: TOKENS.amber, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icon name="wallet" size={13} strokeWidth={1.75} />
                  {isRtl ? `أو قسمها على 4 دفعات بقيمة ${installmentValue} ر.ق` : `Or 4 payments of ${installmentValue} QAR`}
                </div>
              )}
            </div>

            <button
              onClick={() => setDetailedPart(part)}
              style={{
                width: '100%', padding: '11px', backgroundColor: TOKENS.obsidianSoft, color: TOKENS.white, border: 'none',
                borderRadius: '10px', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '7px', letterSpacing: '0.01em'
              }}
            >
              <Icon name="doc" size={14} strokeWidth={1.75} />
              {isRtl ? 'المواصفات الفنية الكاملة' : 'Full Technical Specifications'}
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '7px', alignItems: 'center', paddingTop: '8px', borderTop: `1px solid ${TOKENS.alabaster}`, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${TOKENS.hairline}`, borderRadius: '9px', overflow: 'hidden', backgroundColor: TOKENS.alabaster }}>
            <button onClick={(e) => { e.stopPropagation(); changeQty(part, -1); }} disabled={qty <= 1 || isOutOfStock} style={{ width: '28px', height: '34px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: TOKENS.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="minus" size={13} strokeWidth={2} />
            </button>
            <span style={{ width: '26px', textAlign: 'center', fontWeight: 700, fontSize: '12px', color: TOKENS.ink }}>{isOutOfStock ? 0 : qty}</span>
            <button onClick={(e) => { e.stopPropagation(); changeQty(part, 1); }} disabled={qty >= maxStock || isOutOfStock} style={{ width: '28px', height: '34px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: TOKENS.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="plus" size={13} strokeWidth={2} />
            </button>
          </div>

          {addToCart && (
            <button
              onClick={(e) => { e.stopPropagation(); if (!isOutOfStock) addToCart(formattedPart, qty); }}
              disabled={isOutOfStock}
              style={{
                flex: '1 1 100px', backgroundColor: isOutOfStock ? '#CBD5E1' : TOKENS.obsidianSoft, color: 'white', border: 'none',
                borderRadius: '9px', padding: '9px 8px', fontSize: '12px', fontWeight: 700, cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'background-color 0.18s ease'
              }}
            >
              <Icon name="cart" size={14} strokeWidth={1.75} />
              {isOutOfStock ? (isRtl ? 'غير متوفر' : 'Unavailable') : (isRtl ? 'أضف للسلة' : 'Add to Cart')}
            </button>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); if (onInquire) onInquire(formattedPart); else if (addToCart && !isOutOfStock) addToCart(formattedPart, qty); }}
            disabled={isOutOfStock}
            style={{ padding: '9px 12px', backgroundColor: TOKENS.alabaster, color: TOKENS.ink, border: `1px solid ${TOKENS.hairline}`, borderRadius: '9px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Icon name="message" size={13} strokeWidth={1.75} />
            {isRtl ? 'اسأل' : 'Inquire'}
          </button>

          <button
            onClick={() => togglePartCardExpand(part.id)}
            style={{
              padding: '9px 12px', backgroundColor: isExpanded ? TOKENS.copperTint : TOKENS.white, color: TOKENS.copperDeep,
              border: `1px solid ${TOKENS.copperLine}`, borderRadius: '9px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '5px'
            }}
          >
            {isExpanded ? (isRtl ? 'إغلاق' : 'Less') : (isRtl ? 'المزيد' : 'More')}
            <Icon name="chevronDown" size={12} strokeWidth={2} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
          </button>
        </div>

      </div>
    );
  };

  if (detailedPart) {
    return (
      <PartMoreInfo
        part={detailedPart}
        inventory={inventory}
        lang={lang}
        siteSettings={siteSettings}
        onAddToCart={addToCart}
        onBack={() => setDetailedPart(null)}
      />
    );
  }

  /* small helper for the hierarchical tree node row */
  const treeNodeStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    padding: '9px 13px',
    borderRadius: '11px',
    transition: 'all 0.15s ease-in-out',
    userSelect: 'none',
  };

  return (
    <aside style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '22px', fontFamily }}>

      {/* ================================================================
          1. EXECUTIVE VERIFICATION BAR — Smart VIN / Istemara scanner
      ================================================================= */}
      <div style={{
        backgroundColor: TOKENS.white,
        padding: '24px',
        borderRadius: '20px',
        border: `1.5px solid ${TOKENS.hairline}`,
        boxShadow: '0 4px 20px rgba(9,13,22,0.04)',
        direction: isRtl ? 'rtl' : 'ltr',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-40%', [isRtl ? 'left' : 'right']: '-10%', width: '240px', height: '240px', borderRadius: '50%', background: `radial-gradient(circle, ${TOKENS.copper}15 0%, transparent 70%)`, pointerEvents: 'none' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', flexWrap: 'wrap', gap: '12px', position: 'relative' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: TOKENS.copperTint, border: `1px solid ${TOKENS.copperLine}`, padding: '5px 12px', borderRadius: '999px', marginBottom: '10px' }}>
              <Icon name="shield" size={13} color={TOKENS.copper} />
              <span style={{ fontSize: '11px', fontWeight: 800, color: TOKENS.copperDeep, letterSpacing: '0.03em' }}>
                {isRtl ? 'ضمان مطابقة 100%' : '100% FITMENT GUARANTEE'}
              </span>
            </div>
            <h3 style={{ margin: '0 0 6px 0', color: TOKENS.obsidian, fontSize: '17px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '-0.01em' }}>
              <Icon name="camera" size={19} color={TOKENS.copper} />
              {isRtl ? 'الفحص الذكي بالاستمارة أو رقم الشاصي' : 'Smart VIN & Registration Scanner'}
            </h3>
            <p style={{ margin: 0, fontSize: '12.5px', color: TOKENS.mutedText, maxWidth: '560px', lineHeight: '1.6' }}>
              {isRtl
                ? 'صوّر استمارة سيارتك أو أدخل رقم الشاصي (17 حرف) ليقوم النظام بعرض حالة التوافق لكل قطعة تلقائياً.'
                : 'Upload your vehicle Istemara or enter the 17-digit VIN to identify compatibility across every part automatically.'}
            </p>
          </div>

          {decodedVehicle && (
            <button
              onClick={clearSearch}
              style={{
                backgroundColor: '#FEF2F2',
                color: '#DC2626',
                border: '1px solid #FCA5A5',
                padding: '8px 16px',
                borderRadius: '11px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                transition: 'all 0.2s ease'
              }}
            >
              <Icon name="refresh" size={13} color="#DC2626" />
              {isRtl ? 'إلغاء التحديد' : 'Clear Vehicle'}
            </button>
          )}
        </div>

        {decodedVehicle ? (
          <div style={{
            padding: '16px 20px',
            backgroundColor: TOKENS.successTint,
            border: '1.5px solid #86EFAC',
            borderRadius: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '11px', backgroundColor: 'rgba(22,163,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="checkCircle" size={20} color={TOKENS.success} />
              </div>
              <div>
                <strong style={{ color: '#166534', fontSize: '15px', display: 'block', fontWeight: 800 }}>
                  {decodedVehicle.make} {decodedVehicle.model} {decodedVehicle.year && `(${decodedVehicle.year})`}
                </strong>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '3px' }}>
                  {decodedVehicle.engine && (
                    <span style={{ fontSize: '12px', color: '#15803D', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      <Icon name="bolt" size={12} color="#15803D" /> {decodedVehicle.engine}
                    </span>
                  )}
                  {decodedVehicle.vin && (
                    <span style={{ fontSize: '12px', color: '#166534', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                      VIN: {decodedVehicle.vin}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <span style={{ backgroundColor: TOKENS.success, color: 'white', padding: '6px 14px', borderRadius: '10px', fontSize: '11.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon name="target" size={13} color="white" />
              {isRtl ? 'فحص التوافق مفعّل' : 'Fitment filter active'}
            </span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', position: 'relative' }}>

            <div
              onClick={() => !isDecodingVin && fileInputRef.current?.click()}
              style={{
                border: `1.5px dashed ${TOKENS.copperLine}`,
                backgroundColor: TOKENS.copperTint,
                borderRadius: '16px',
                padding: '20px',
                textAlign: 'center',
                cursor: isDecodingVin ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleIstemaraUpload}
                style={{ display: 'none' }}
                disabled={isDecodingVin}
              />
              <div style={{ width: '46px', height: '46px', borderRadius: '13px', backgroundColor: TOKENS.white, border: `1px solid ${TOKENS.copperLine}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                <Icon name="camera" size={21} color={TOKENS.copper} />
              </div>
              <strong style={{ color: TOKENS.obsidian, fontSize: '13.5px', display: 'block', marginBottom: '3px', fontWeight: 800 }}>
                {isRtl ? 'اضغط لتصوير أو رفع الاستمارة' : 'Snap or Upload Istemara Photo'}
              </strong>
              <span style={{ fontSize: '11.5px', color: TOKENS.mutedText }}>
                {isRtl ? 'استخراج وقراءة فورية بالذكاء الاصطناعي' : 'Instant AI OCR reading'}
              </span>
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); decodeVinNumber(vinInput.trim().toUpperCase()); }}
              style={{
                border: `1.5px solid ${TOKENS.hairline}`,
                backgroundColor: TOKENS.alabaster,
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '9px'
              }}
            >
              <label style={{ fontSize: '12px', fontWeight: 800, color: TOKENS.obsidianSoft }}>
                {isRtl ? 'أو أدخل رقم الشاصي يدوياً (17 حرف)' : 'Or enter the 17-digit VIN manually'}
              </label>
              <div style={{ display: 'flex', gap: '9px' }}>
                <input
                  type="text"
                  maxLength={17}
                  placeholder={isRtl ? "JTEBU5JR8K5..." : "Enter 17-char VIN..."}
                  value={vinInput}
                  onChange={(e) => setVinInput(e.target.value.toUpperCase())}
                  style={{
                    flex: 1,
                    padding: '11px 14px',
                    borderRadius: '11px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '13px',
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: '1px',
                    backgroundColor: TOKENS.white,
                    color: TOKENS.obsidian,
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={isDecodingVin || vinInput.trim().length !== 17}
                  style={{
                    padding: '0 20px',
                    backgroundColor: TOKENS.copper,
                    color: 'white',
                    border: 'none',
                    borderRadius: '11px',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: (vinInput.trim().length === 17) ? 'pointer' : 'not-allowed',
                    opacity: (vinInput.trim().length === 17) ? 1 : 0.45,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{isRtl ? 'فحص' : 'Check'}</span>
                  <Icon name={isRtl ? 'chevronLeft' : 'chevronRight'} size={13} color="white" />
                </button>
              </div>
            </form>

          </div>
        )}

        {isDecodingVin && (
          <div style={{ marginTop: '14px', textAlign: 'center', color: TOKENS.copper, fontWeight: 800, fontSize: '12.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Icon name="refresh" size={14} color={TOKENS.copper} style={{ animation: 'mawjood-spin 1s linear infinite' }} />
            {statusMsg}
          </div>
        )}
        <style>{`@keyframes mawjood-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div> 
      
      {/* ================================================================
          2. SEARCH MODE SELECTOR — visual vs. hierarchical catalog
      ================================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', direction: isRtl ? 'rtl' : 'ltr' }}>

        <div
          onClick={() => setSearchMode('visual')}
          style={{
            backgroundColor: searchMode === 'visual' ? TOKENS.successTint : TOKENS.white,
            border: searchMode === 'visual' ? `2px solid ${TOKENS.success}` : `1.5px solid ${TOKENS.hairline}`,
            borderRadius: '18px', padding: '18px', cursor: 'pointer', transition: 'all 0.25s ease',
            boxShadow: searchMode === 'visual' ? '0 12px 28px -14px rgba(22,163,74,0.28)' : '0 2px 10px rgba(9,13,22,0.03)',
            position: 'relative'
          }}
        >
          {searchMode === 'visual' && (
            <span style={{ position: 'absolute', top: '14px', [isRtl ? 'left' : 'right']: '14px', backgroundColor: TOKENS.success, color: 'white', fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Icon name="checkCircle" size={11} strokeWidth={2} /> {isRtl ? 'المحدد' : 'Active'}
            </span>
          )}
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: TOKENS.successTint, border: `1px solid ${TOKENS.successLine}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
            <Icon name="target" size={20} strokeWidth={1.6} color={TOKENS.success} />
          </div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', color: TOKENS.ink, fontWeight: 700 }}>
            {isRtl ? 'البحث البصري' : 'Visual Selector'}
          </h3>
          <p style={{ margin: 0, fontSize: '12px', color: TOKENS.mutedText, lineHeight: '1.5' }}>
            {isRtl ? 'اختر سيارتك بالصور والبطاقات خطوة بخطوة.' : 'Browse parts visually, step by step.'}
          </p>
        </div>

        <div
          onClick={() => setSearchMode('tree')}
          style={{
            backgroundColor: searchMode === 'tree' ? TOKENS.copperTint : TOKENS.white,
            border: searchMode === 'tree' ? `2px solid ${TOKENS.copper}` : `1.5px solid ${TOKENS.hairline}`,
            borderRadius: '18px', padding: '18px', cursor: 'pointer', transition: 'all 0.25s ease',
            boxShadow: searchMode === 'tree' ? '0 12px 28px -14px rgba(234,88,12,0.28)' : '0 2px 10px rgba(9,13,22,0.03)',
            position: 'relative'
          }}
        >
          {searchMode === 'tree' && (
            <span style={{ position: 'absolute', top: '14px', [isRtl ? 'left' : 'right']: '14px', backgroundColor: TOKENS.copper, color: 'white', fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Icon name="checkCircle" size={11} strokeWidth={2} /> {isRtl ? 'المحدد' : 'Active'}
            </span>
          )}
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: TOKENS.copperTint, border: `1px solid ${TOKENS.copperLine}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
            <Icon name="layers" size={20} strokeWidth={1.6} color={TOKENS.copperDeep} />
          </div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', color: TOKENS.ink, fontWeight: 700 }}>
            {isRtl ? 'كتالوج شجرة التصفية' : 'Full Catalog Tree'}
          </h3>
          <p style={{ margin: 0, fontSize: '12px', color: TOKENS.mutedText, lineHeight: '1.5' }}>
            {isRtl ? 'تصفح كل الماركات والموديلات بشكل هرمي.' : 'Browse the hierarchical catalog.'}
          </p>
        </div>

      </div>

      {/* Visual selector */}
      {searchMode === 'visual' && !activeSearchQuery && (
        <VisualVehicleSelector
          lang={lang}
          renderPartCard={renderPartCard}
        />
      )}

      {/* Tree catalog / strict part-number search results */}
      {(activeSearchQuery || searchMode === 'tree') && (
        <div style={{ backgroundColor: 'white', padding: '26px', borderRadius: '22px', boxShadow: '0 4px 30px rgba(9,13,22,0.05)', border: `1px solid ${TOKENS.hairline}`, direction: isRtl ? 'rtl' : 'ltr' }}>

          <div style={{ display: 'flex', gap: '11px', marginBottom: '22px', flexWrap: 'wrap' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '9px', flex: 1, minWidth: '260px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [isRtl ? 'right' : 'left']: '14px', color: TOKENS.slateText, pointerEvents: 'none' }}>
                  <Icon name="search" size={16} strokeWidth={1.75} />
                </span>
                <input
                  type="text"
                  placeholder={isRtl ? "ابحث برقم القطعة أو الكود فقط (مثال: 04465-33470)..." : "Search strictly by Part Number, Code or SKU..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: `13px 16px 13px ${isRtl ? '16px' : '40px'}`,
                    paddingRight: isRtl ? '40px' : '16px',
                    borderRadius: '13px', border: `2px solid ${TOKENS.obsidianSoft}`, outline: 'none', fontSize: '13.5px',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                />
              </div>
              <button type="submit" style={{ padding: '0 22px', backgroundColor: TOKENS.obsidianSoft, color: 'white', border: 'none', borderRadius: '13px', fontWeight: 700, cursor: 'pointer', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isRtl ? 'بحث' : 'Search'}
              </button>
            </form>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{ padding: '11px 16px', borderRadius: '13px', border: `1px solid ${TOKENS.hairline}`, fontSize: '13px', backgroundColor: TOKENS.alabaster, fontWeight: 700, cursor: 'pointer', color: TOKENS.ink }}
            >
              <option value="default">{isRtl ? 'الترتيب الافتراضي' : 'Default Sort'}</option>
              <option value="price_asc">{isRtl ? 'السعر: من الأرخص' : 'Price: Low to High'}</option>
              <option value="price_desc">{isRtl ? 'السعر: من الأعلى' : 'Price: High to Low'}</option>
            </select>
          </div>

          {activeSearchQuery ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ color: TOKENS.ink, margin: 0, fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <Icon name="search" size={17} strokeWidth={1.75} color={TOKENS.copper} />
                  {isRtl ? `نتائج البحث عن: "${activeSearchQuery}"` : `Results for: "${activeSearchQuery}"`}
                </h3>
                <button onClick={clearSearch} style={{ padding: '9px 16px', borderRadius: '11px', cursor: 'pointer', border: `1px solid ${TOKENS.hairline}`, backgroundColor: TOKENS.white, fontWeight: 700, fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '7px', color: TOKENS.ink }}>
                  <Icon name="undo" size={14} strokeWidth={1.75} />
                  {isRtl ? 'العودة للكتالوج' : 'Back to Catalog'}
                </button>
              </div>

              {searchResults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', backgroundColor: TOKENS.alabaster, borderRadius: '16px', border: `1px solid ${TOKENS.hairline}` }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '16px', backgroundColor: TOKENS.white, border: `1px solid ${TOKENS.hairline}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                    <Icon name="search" size={24} strokeWidth={1.5} color={TOKENS.mutedText} />
                  </div>
                  <p style={{ color: TOKENS.slateText, fontWeight: 600, maxWidth: '420px', margin: '0 auto', lineHeight: '1.6' }}>
                    {isRtl
                      ? 'عفواً، لا توجد قطعة مطابقة لهذا الرقم تماماً (البحث مخصص فقط لأرقام وأكواد القطع وليس للأسماء العامة).'
                      : 'No exact part number match found (search strictly requires Part Numbers/Codes, not general names).'}
                  </p>
                  <button onClick={() => { setReqSubmitted(false); setShowRequestModal(true); }} style={{ padding: '11px 22px', backgroundColor: TOKENS.copper, color: 'white', border: 'none', borderRadius: '11px', cursor: 'pointer', fontWeight: 700, marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <Icon name="mail" size={14} strokeWidth={1.75} />
                    {isRtl ? 'إرسال طلب قطعة بهذا الرقم' : 'Request part with this number'}
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
                    {displayedSearchResults.map((part: any) => renderPartCard(part))}
                  </div>

                  {displayLimit < searchResults.length && (
                    <div style={{ textAlign: 'center', marginTop: '26px' }}>
                      <button
                        onClick={() => setDisplayLimit(prev => prev + 20)}
                        style={{
                          padding: '11px 26px', backgroundColor: TOKENS.alabaster, border: `1.5px solid ${TOKENS.hairline}`,
                          borderRadius: '13px', fontWeight: 700, color: TOKENS.ink, cursor: 'pointer', fontSize: '13px',
                          display: 'inline-flex', alignItems: 'center', gap: '8px'
                        }}
                      >
                        <Icon name="chevronDown" size={14} strokeWidth={2} />
                        {isRtl ? `عرض المزيد (${displayedSearchResults.length} من ${searchResults.length})` : `Load More (${displayedSearchResults.length} of ${searchResults.length})`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
              {Object.keys(activeCarData).map(make => {
                const makeKey = `make_${make}`;
                const isMakeOpen = !!expandedNodes[makeKey];
                const makeName = isRtl ? make : (activeCarData[make]?.en || make);
                const yearsCacheKey = `years_${make}`;
                const isYearsLoading = !!loadingNodes[yearsCacheKey];
                const availableYears = nodeDataCache[yearsCacheKey] || [];

                return (
                  <li key={make} style={{ marginBottom: '8px' }}>
                    <div onClick={() => toggleNode(makeKey, () => fetchYearsForMake(make))} style={{ ...treeNodeStyle, backgroundColor: isMakeOpen ? TOKENS.skyTint : TOKENS.alabaster, fontWeight: 700, padding: '11px 15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {!imgErrors[make] ? (
                          <img src={`https://www.google.com/s2/favicons?sz=128&domain=${MAKE_DOMAINS[make] || 'google.com'}`} alt={make} style={{ width: '22px', height: '22px', objectFit: 'contain', borderRadius: '4px' }} onError={() => setImgErrors(prev => ({ ...prev, [make]: true }))} />
                        ) : (<Icon name="car" size={18} strokeWidth={1.6} color={TOKENS.slateText} />)}
                        <span style={{ fontSize: '14.5px', color: TOKENS.ink }}>{makeName} {isYearsLoading && <small style={{ color: TOKENS.copper, fontWeight: 500 }}>{isRtl ? '(فحص...)' : '(Checking...)'}</small>}</span>
                      </div>
                      <Icon name="chevronDown" size={13} strokeWidth={2} color={TOKENS.mutedText} style={{ transform: isMakeOpen ? 'rotate(0deg)' : (isRtl ? 'rotate(90deg)' : 'rotate(-90deg)'), transition: 'transform 0.18s ease' }} />
                    </div>

                    {isMakeOpen && (
                      <ul style={{ listStyleType: 'none', padding: 0, [isRtl ? 'marginRight' : 'marginLeft']: '18px', marginTop: '6px' }}>
                        {isYearsLoading ? (
                          <li style={{ padding: '7px 12px', fontSize: '12px', color: TOKENS.mutedText, display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="refresh" size={12} style={{ animation: 'mawjood-spin 1s linear infinite' }} /> {isRtl ? 'جاري فحص السنوات المتاحة...' : 'Checking available years...'}</li>
                        ) : availableYears.length === 0 ? (
                          <li style={{ padding: '7px 12px', fontSize: '12px', color: '#94A3B8' }}>{isRtl ? 'لا توجد معروضات لهذه الماركة حالياً.' : 'No items available for this make.'}</li>
                        ) : (
                          availableYears.map((year: string) => {
                            const yearKey = `year_${make}_${year}`;
                            const isYearOpen = !!expandedNodes[yearKey];
                            const modelsCacheKey = `models_${make}_${year}`;
                            const isModelsLoading = !!loadingNodes[modelsCacheKey];
                            const availableModels = nodeDataCache[modelsCacheKey] || [];

                            return (
                              <li key={year} style={{ marginBottom: '6px' }}>
                                <div onClick={() => toggleNode(yearKey, () => fetchModelsForYear(make, year))} style={{ ...treeNodeStyle, backgroundColor: isYearOpen ? TOKENS.skyTint : 'transparent', fontSize: '13.5px', color: TOKENS.sky, padding: '8px 12px', fontWeight: 700 }}>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                    <Icon name="calendar" size={13} strokeWidth={1.75} /> {year} {isModelsLoading && <small style={{ color: TOKENS.copper, fontWeight: 500 }}>{isRtl ? '(فحص...)' : '(Checking...)'}</small>}
                                  </span>
                                  <Icon name="chevronDown" size={11} strokeWidth={2} style={{ transform: isYearOpen ? 'rotate(0deg)' : (isRtl ? 'rotate(90deg)' : 'rotate(-90deg)'), transition: 'transform 0.18s ease' }} />
                                </div>

                                {isYearOpen && (
                                  <ul style={{ listStyleType: 'none', padding: 0, [isRtl ? 'marginRight' : 'marginLeft']: '18px', marginTop: '6px' }}>
                                    {isModelsLoading ? (
                                      <li style={{ padding: '7px 12px', fontSize: '12px', color: TOKENS.mutedText }}>{isRtl ? 'جاري البحث عن الموديلات...' : 'Checking models...'}</li>
                                    ) : availableModels.length === 0 ? (
                                      <li style={{ padding: '7px 12px', fontSize: '12px', color: '#94A3B8' }}>{isRtl ? 'لا توجد معروضات لهذه السنة.' : 'No items.'}</li>
                                    ) : (
                                      availableModels.map((model: string) => {
                                        const modelKey = `model_${make}_${year}_${model}`;
                                        const isModelOpen = !!expandedNodes[modelKey];
                                        const modelName = model;
                                        const enginesCacheKey = `engines_${make}_${year}_${model}`;
                                        const isEnginesLoading = !!loadingNodes[enginesCacheKey];
                                        const availableEngines = nodeDataCache[enginesCacheKey] || [];

                                        return (
                                          <li key={model} style={{ marginBottom: '6px' }}>
                                            <div onClick={() => toggleNode(modelKey, () => fetchEnginesForVehicle(make, year, model))} style={{ ...treeNodeStyle, backgroundColor: isModelOpen ? TOKENS.alabaster : 'transparent', fontSize: '13.5px', padding: '8px 12px' }}>
                                              <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                                <Icon name="car" size={13} strokeWidth={1.75} color={TOKENS.slateText} /> {modelName} {isEnginesLoading && <small style={{ color: TOKENS.copper, fontWeight: 500 }}>{isRtl ? '(فحص...)' : '(Checking...)'}</small>}
                                              </span>
                                              <Icon name="chevronDown" size={11} strokeWidth={2} color={TOKENS.mutedText} style={{ transform: isModelOpen ? 'rotate(0deg)' : (isRtl ? 'rotate(90deg)' : 'rotate(-90deg)'), transition: 'transform 0.18s ease' }} />
                                            </div>

                                            {isModelOpen && (
                                              <ul style={{ listStyleType: 'none', padding: 0, [isRtl ? 'marginRight' : 'marginLeft']: '18px', marginTop: '6px' }}>
                                                {isEnginesLoading ? (
                                                  <li style={{ padding: '7px 12px', fontSize: '12px', color: TOKENS.mutedText }}>{isRtl ? 'جاري الفحص...' : 'Checking...'}</li>
                                                ) : (
                                                  availableEngines.map((engine: string) => {
                                                    const engineKey = `eng_${make}_${year}_${model}_${engine}`;
                                                    const isEngineOpen = !!expandedNodes[engineKey];
                                                    const mainCatsCacheKey = `maincats_${make}_${year}_${model}_${engine}`;
                                                    const isMainCatsLoading = !!loadingNodes[mainCatsCacheKey];
                                                    const availableMainCategories = nodeDataCache[mainCatsCacheKey] || [];

                                                    return (
                                                      <li key={engine} style={{ marginBottom: '6px' }}>
                                                        <div onClick={() => toggleNode(engineKey, () => fetchMainCategoriesForEngine(make, year, model, engine))} style={{ ...treeNodeStyle, backgroundColor: isEngineOpen ? TOKENS.skyTint : 'transparent', fontSize: '13px', color: TOKENS.ink, padding: '7px 11px', fontWeight: 500 }}>
                                                          <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                                            <Icon name="bolt" size={13} strokeWidth={1.75} color={TOKENS.copper} /> {engine} {isMainCatsLoading && <small style={{ color: TOKENS.copper, fontWeight: 500 }}>{isRtl ? '(فحص...)' : '(Checking...)'}</small>}
                                                          </span>
                                                          <Icon name="chevronDown" size={11} strokeWidth={2} style={{ transform: isEngineOpen ? 'rotate(0deg)' : (isRtl ? 'rotate(90deg)' : 'rotate(-90deg)'), transition: 'transform 0.18s ease' }} />
                                                        </div>

                                                        {isEngineOpen && (
                                                          <ul style={{ listStyleType: 'none', padding: 0, [isRtl ? 'marginRight' : 'marginLeft']: '15px', marginTop: '6px' }}>
                                                            {isMainCatsLoading ? (
                                                              <li style={{ padding: '7px 12px', fontSize: '12px', color: TOKENS.mutedText }}>{isRtl ? 'جاري فحص الأقسام الرئيسية...' : 'Checking main categories...'}</li>
                                                            ) : availableMainCategories.length === 0 ? (
                                                              <li style={{ padding: '7px 12px', fontSize: '12px', color: '#94A3B8' }}>{isRtl ? 'لا توجد أقسام متوفرة.' : 'No categories.'}</li>
                                                            ) : (
                                                              availableMainCategories.map((mainCategory: string) => {
                                                                const mainCatKey = `maincat_${make}_${year}_${model}_${engine}_${mainCategory}`;
                                                                const isMainCatOpen = !!expandedNodes[mainCatKey];
                                                                const mainCatInfo = CATEGORY_TRANSLATIONS[mainCategory];
                                                                const displayMainCategory = mainCatInfo
                                                                  ? (isRtl ? mainCatInfo.ar : (mainCatInfo.en || mainCategory))
                                                                  : mainCategory;

                                                                const subCatsCacheKey = `subcats_${make}_${year}_${model}_${engine}_${mainCategory}`;
                                                                const isSubCatsLoading = !!loadingNodes[subCatsCacheKey];
                                                                const availableSubCategories = nodeDataCache[subCatsCacheKey] || [];

                                                                return (
                                                                  <li key={mainCategory} style={{ marginBottom: '6px' }}>
                                                                    <div onClick={() => toggleNode(mainCatKey, () => fetchSubCategoriesForMain(make, year, model, engine, mainCategory))} style={{ ...treeNodeStyle, backgroundColor: isMainCatOpen ? TOKENS.copperTint : 'transparent', fontSize: '13px', color: TOKENS.ink, padding: '7px 11px', fontWeight: 700 }}>
                                                                      <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                                                        <Icon name="folder" size={13} strokeWidth={1.75} color={TOKENS.copperDeep} /> {displayMainCategory} {isSubCatsLoading && <small style={{ color: TOKENS.copper, fontWeight: 500 }}>{isRtl ? '(فحص...)' : '(Checking...)'}</small>}
                                                                      </span>
                                                                      <Icon name="chevronDown" size={11} strokeWidth={2} color="#94A3B8" style={{ transform: isMainCatOpen ? 'rotate(0deg)' : (isRtl ? 'rotate(90deg)' : 'rotate(-90deg)'), transition: 'transform 0.18s ease' }} />
                                                                    </div>

                                                                    {isMainCatOpen && (
                                                                      <ul style={{ listStyleType: 'none', padding: 0, [isRtl ? 'marginRight' : 'marginLeft']: '15px', marginTop: '6px' }}>
                                                                        {isSubCatsLoading ? (
                                                                          <li style={{ padding: '7px 12px', fontSize: '12px', color: TOKENS.mutedText }}>{isRtl ? 'جاري فحص الأقسام الفرعية...' : 'Checking sub-categories...'}</li>
                                                                        ) : availableSubCategories.length === 0 ? (
                                                                          <li style={{ padding: '7px 12px', fontSize: '12px', color: '#94A3B8' }}>{isRtl ? 'لا توجد أقسام فرعية.' : 'No sub-categories.'}</li>
                                                                        ) : (
                                                                          availableSubCategories.map((subCategory: string) => {
                                                                            const subCatKey = `subcat_${make}_${year}_${model}_${engine}_${mainCategory}_${subCategory}`;
                                                                            const isSubCatOpen = !!expandedNodes[subCatKey];
                                                                            const subCatInfo = SUBCATEGORY_TRANSLATIONS[subCategory];
                                                                            const displaySubCategory = subCatInfo
                                                                              ? (isRtl ? subCatInfo.ar : (subCatInfo.en || subCategory))
                                                                              : subCategory;

                                                                            const partsCacheKey = `parts_${make}_${year}_${model}_${engine}_${mainCategory}_${subCategory}`;
                                                                            const isPartsLoading = !!loadingNodes[partsCacheKey];
                                                                            const subCategoryParts = processAndSortParts(nodeDataCache[partsCacheKey] || []);

                                                                            return (
                                                                              <li key={subCategory} style={{ marginBottom: '6px' }}>
                                                                                <div onClick={() => toggleNode(subCatKey, () => fetchPartsForSubCategory(make, year, model, engine, mainCategory, subCategory))} style={{ ...treeNodeStyle, backgroundColor: isSubCatOpen ? TOKENS.successTint : 'transparent', fontSize: '12.5px', color: TOKENS.successInk, padding: '7px 11px', fontWeight: 700, borderLeft: isRtl ? 'none' : `3px solid ${TOKENS.success}55`, borderRight: isRtl ? `3px solid ${TOKENS.success}55` : 'none' }}>
                                                                                  <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                                                                    <Icon name="dot" size={9} strokeWidth={2} /> {displaySubCategory} {isPartsLoading && <small style={{ color: TOKENS.copper, fontWeight: 500 }}>{isRtl ? '(جلب...)' : '(Fetching...)'}</small>}
                                                                                  </span>
                                                                                  <Icon name="chevronDown" size={11} strokeWidth={2} color="#94A3B8" style={{ transform: isSubCatOpen ? 'rotate(0deg)' : (isRtl ? 'rotate(90deg)' : 'rotate(-90deg)'), transition: 'transform 0.18s ease' }} />
                                                                                </div>

                                                                                {isSubCatOpen && (
                                                                                  <div style={{ padding: '18px', backgroundColor: TOKENS.alabaster, borderRadius: '16px', border: `1px solid ${TOKENS.hairline}`, marginTop: '8px', marginBottom: '12px' }}>
                                                                                    {isPartsLoading ? (
                                                                                      <p style={{ textAlign: 'center', color: TOKENS.mutedText, margin: 0 }}>{isRtl ? 'جاري تحميل القطع المتاحة...' : 'Loading available parts...'}</p>
                                                                                    ) : subCategoryParts.length === 0 ? (
                                                                                      <p style={{ textAlign: 'center', color: '#94A3B8', margin: 0 }}>{isRtl ? 'لا توجد قطع معروضة حالياً.' : 'No parts available currently.'}</p>
                                                                                    ) : (
                                                                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '15px' }}>
                                                                                        {subCategoryParts.map((part: any) => renderPartCard(part))}
                                                                                      </div>
                                                                                    )}
                                                                                  </div>
                                                                                )}
                                                                              </li>
                                                                            );
                                                                          })
                                                                        )}
                                                                      </ul>
                                                                    )}
                                                                  </li>
                                                                );
                                                              })
                                                            )}
                                                          </ul>
                                                        )}
                                                      </li>
                                                    );
                                                  })
                                                )}
                                              </ul>
                                            )}
                                          </li>
                                        );
                                      })
                                    )}
                                  </ul>
                                )}
                              </li>
                            );
                          })
                        )}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

        </div>
      )}

      {showRequestModal && (
        <div onClick={() => setShowRequestModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9,13,22,0.72)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '22px', padding: '26px', maxWidth: '460px', width: '100%', direction: isRtl ? 'rtl' : 'ltr', boxShadow: '0 30px 70px -20px rgba(9,13,22,0.4)', fontFamily }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${TOKENS.alabaster}`, paddingBottom: '14px', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', color: TOKENS.ink, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '9px' }}>
                <Icon name="mail" size={18} strokeWidth={1.75} color={TOKENS.copper} />
                {isRtl ? 'طلب قطعة غير متوفرة' : 'Request Unavailable Part'}
              </h3>
              <button onClick={() => setShowRequestModal(false)} style={{ background: TOKENS.alabaster, border: 'none', borderRadius: '9px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: TOKENS.slateText }}>
                <Icon name="x" size={15} strokeWidth={2} />
              </button>
            </div>

            {reqSubmitted ? (
              <div style={{ textAlign: 'center', padding: '22px 0' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', backgroundColor: TOKENS.successTint, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <Icon name="checkCircle" size={30} strokeWidth={1.6} color={TOKENS.success} />
                </div>
                <h4 style={{ margin: '0 0 10px 0', color: TOKENS.success, fontWeight: 700 }}>{isRtl ? 'تم إرسال طلبك بنجاح!' : 'Your request was sent successfully!'}</h4>
                <button onClick={() => setShowRequestModal(false)} style={{ width: '100%', padding: '13px', backgroundColor: TOKENS.obsidianSoft, color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>
                  {isRtl ? 'تم' : 'Done'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleInAppRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <input type="tel" placeholder={isRtl ? 'رقم الهاتف للتواصل' : 'Contact Phone Number'} value={custPhone} onChange={(e) => setCustPhone(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', border: `1px solid ${TOKENS.hairline}`, boxSizing: 'border-box', fontSize: '13.5px' }} required />
                <textarea placeholder={isRtl ? 'ملاحظات إضافية...' : 'Additional Notes...'} value={custNotes} onChange={(e) => setCustNotes(e.target.value)} rows={3} style={{ width: '100%', padding: '12px 14px', borderRadius: '11px', border: `1px solid ${TOKENS.hairline}`, boxSizing: 'border-box', fontSize: '13.5px', fontFamily: 'inherit' }} />
                <button type="submit" disabled={isSubmittingReq} style={{ width: '100%', padding: '14px', backgroundColor: TOKENS.success, color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {isSubmittingReq ? (
                    <>
                      <Icon name="refresh" size={15} strokeWidth={1.75} style={{ animation: 'mawjood-spin 1s linear infinite' }} />
                      {isRtl ? 'جاري الإرسال...' : 'Sending...'}
                    </>
                  ) : (
                    <>
                      <Icon name="mail" size={15} strokeWidth={1.75} />
                      {isRtl ? 'إرسال الطلب الآن' : 'Submit Request'}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

export default SidebarFilters;
