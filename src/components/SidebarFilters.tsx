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

const nodeStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  cursor: 'pointer',
  padding: '8px 12px',
  borderRadius: '10px',
  transition: 'all 0.15s ease-in-out',
  userSelect: 'none',
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

    // إذا لم تتوفر معلومات واضحة عن الماركة أو الشاصي
    if (!vehicle.make && !vehicle.vin) return 'uncertain';

    const excelVins = part.compatible_vins || part.vin_numbers || part.vins || part.chassis_code;
    if (excelVins && vehicle.vin) {
      const cleanVin = vehicle.vin.toUpperCase().trim();
      const vinList = String(excelVins).toUpperCase().split(/[,;\s\n/]+/).map(v => v.trim()).filter(Boolean);
      if (vinList.some(v => cleanVin === v || cleanVin.startsWith(v) || v.startsWith(cleanVin.substring(0, 8)))) {
        return 'compatible';
      }
    }

    // إذا كانت بيانات توافق القطعة غير مدخلة بالكراج
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
            return target >= Math.min(start, end) && target <= Math.max(start, end);
          }
          return yStr === year;
        });

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

  // 🎯 نتائج البحث الحصري برقم القطعة مع تقديم المتطابقة
  const searchResults = processAndSortParts(
    inventory.filter((part: any) => {
      if (activeSearchQuery) return matchesPartNumberOnly(part, activeSearchQuery);
      return false; // إذا لم يبحث برقم قطعة لا يعرض شيء في نتائج البحث المباشرة
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

  const renderPartCard = (part: any) => {
    const partNo = part.part_number || part.code || part.sku || part.id;
    const fitmentStatus = decodedVehicle ? getPartFitmentStatus(part, decodedVehicle) : null;
    const qty = getQty(part.id);
    const maxStock = typeof part.stock !== 'undefined' && part.stock !== null ? Number(part.stock) : 5;
    const isOutOfStock = maxStock <= 0;

    const tierInfo = classifyPartTier(part);
    const isExpanded = !!expandedPartCards[part.id];

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

    return (
      <div 
        key={part.id} 
        style={{ 
          backgroundColor: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', 
          display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', 
          position: 'relative', transition: 'all 0.25s ease-in-out' 
        }}
      >
        <button 
          onClick={(e) => handleSharePart(part, e)} 
          title={isRtl ? "مشاركة القطعة" : "Share Part"}
          style={{ position: 'absolute', top: '12px', [isRtl ? 'left' : 'right']: '12px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', zIndex: 2 }}
        >
          🔗
        </button>

        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '85px', height: '85px', flexShrink: 0 }}>
            <img src={activeImage} alt={displayName} onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px', border: '1px solid #edf2f7' }} />
            {allImages.length > 1 && (
              <>
                <button onClick={(e) => handlePrevImage(part.id, allImages.length, e)} style={{ position: 'absolute', top: '35%', left: '-6px', backgroundColor: 'rgba(255,255,255,0.9)', border: '1px solid #cbd5e0', borderRadius: '50%', width: '20px', height: '20px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}>‹</button>
                <button onClick={(e) => handleNextImage(part.id, allImages.length, e)} style={{ position: 'absolute', top: '35%', right: '-6px', backgroundColor: 'rgba(255,255,255,0.9)', border: '1px solid #cbd5e0', borderRadius: '50%', width: '20px', height: '20px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}>›</button>
              </>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#1f3a5f', fontWeight: 'bold', lineHeight: '1.4' }}>
              {displayName}
            </h4>

            <div style={{ fontSize: '11.5px', color: '#1f3a5f', backgroundColor: '#e8f2fc', padding: '2px 6px', borderRadius: '5px', fontWeight: 'bold', display: 'inline-block', marginBottom: '4px', border: '1px solid #bae6fd', fontFamily: 'monospace' }}>
              🔍 {isRtl ? 'رقم القطعة' : 'Part Number'}: {partNo}
            </div>

            {/* 🎯 شارة التوافق الذكية (متطابق / غير متطابق / اسأل البائع) */}
            {decodedVehicle && fitmentStatus && (
              <div style={{
                margin: '6px 0',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '11.5px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: fitmentStatus === 'compatible' ? '#f0fdf4' : fitmentStatus === 'incompatible' ? '#fef2f2' : '#fffbeb',
                color: fitmentStatus === 'compatible' ? '#166534' : fitmentStatus === 'incompatible' ? '#991b1b' : '#b45309',
                border: `1px solid ${fitmentStatus === 'compatible' ? '#86efac' : fitmentStatus === 'incompatible' ? '#fca5a5' : '#fde68a'}`
              }}>
                <span>{fitmentStatus === 'compatible' ? '✅' : fitmentStatus === 'incompatible' ? '⚠️' : '💬'}</span>
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
              <span style={{ fontSize: '10.5px', fontWeight: 'bold', color: tierInfo.tier === 'oem' ? '#0369a1' : '#c2410c', backgroundColor: tierInfo.badgeColor, padding: '1px 6px', borderRadius: '4px' }}>
                {part.part_type || (tierInfo.tier === 'oem' ? (isRtl ? 'أصلي' : 'OEM') : (isRtl ? tierInfo.label : 'Aftermarket'))}
              </span>
              <span style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#475569', backgroundColor: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>
                ✨ {part.part_condition || (isRtl ? 'جديد' : 'New')}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#e0872a', backgroundColor: '#fff7ed', border: '1px solid #ffedd5', padding: '1px 6px', borderRadius: '5px' }}>
                ⭐ {part.garage_rating ? Number(part.garage_rating).toFixed(1) : '4.9'}
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                ({part.garage_name || (isRtl ? 'كراج معتمد' : 'Verified Garage')})
              </span>
            </div>

            <div style={{ color: '#e0872a', fontWeight: '900', fontSize: '16.5px', marginTop: '4px' }}>
              {part.price} {isRtl ? 'ر.ق' : 'QAR'}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '10px', borderTop: '1px dashed #cbd5e0' }}>
            <div style={{ border: '1px solid #cbd5e0', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#ffffff' }}>
              <div style={{ backgroundColor: '#f1f5f9', padding: '6px 10px', fontSize: '11.5px', fontWeight: 'bold', color: '#1f3a5f', borderBottom: '1px solid #cbd5e0', display: 'flex', justifyContent: 'space-between' }}>
                <span>🚘 {isRtl ? 'توافق القطعة (Buyer\'s Guide):' : 'Part Fitment Guide:'}</span>
                <span style={{ color: '#0284c7' }}>({formattedFitmentList.length})</span>
              </div>
              <div style={{ maxHeight: '90px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: isRtl ? 'right' : 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', color: '#64748b' }}>
                      <th style={{ padding: '4px 8px' }}>{isRtl ? 'الشركة' : 'Make'}</th>
                      <th style={{ padding: '4px 8px' }}>{isRtl ? 'السيارة' : 'Model'}</th>
                      <th style={{ padding: '4px 8px' }}>{isRtl ? 'السنوات' : 'Years'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formattedFitmentList.map((fit, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>{fit.make}</td>
                        <td style={{ padding: '4px 8px' }}>{fit.model}</td>
                        <td style={{ padding: '4px 8px', color: '#e0872a', fontWeight: 'bold' }}>{fit.yearRange}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ backgroundColor: '#fafafa', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '11.5px' }}>
              <div style={{ color: '#16a34a', fontWeight: 'bold' }}>⚡ {isRtl ? 'التوصيل المتوقع: خلال 24 - 48 ساعة' : 'Estimated Delivery: 24-48 Hours'}</div>
              {isBNPLEnabled && (
                <div style={{ color: '#854d0e', fontWeight: 'bold', marginTop: '4px' }}>
                  🛒 {isRtl ? `أو قسمها على 4 دفعات بقيمة ${installmentValue} ر.ق` : `Or 4 payments of ${installmentValue} QAR`}
                </div>
              )}
            </div>

            <button 
              onClick={() => setDetailedPart(part)}
              style={{ width: '100%', padding: '10px', backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '12.5px', cursor: 'pointer' }}
            >
              📄 {isRtl ? 'صفحة المواصفات الفنية الكاملة (More Info)' : 'Full Technical Specifications (More Info)'}
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e0', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
            <button onClick={(e) => { e.stopPropagation(); changeQty(part, -1); }} disabled={qty <= 1 || isOutOfStock} style={{ width: '26px', height: '32px', border: 'none', backgroundColor: '#e2e8f0', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
            <span style={{ width: '26px', textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }}>{isOutOfStock ? 0 : qty}</span>
            <button onClick={(e) => { e.stopPropagation(); changeQty(part, 1); }} disabled={qty >= maxStock || isOutOfStock} style={{ width: '26px', height: '32px', border: 'none', backgroundColor: '#e2e8f0', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
          </div>

          {addToCart && (
            <button 
              onClick={(e) => { e.stopPropagation(); if (!isOutOfStock) addToCart(formattedPart, qty); }}
              disabled={isOutOfStock}
              style={{ flex: '1 1 90px', backgroundColor: isOutOfStock ? '#94a3b8' : '#1f3a5f', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              🛒 {isOutOfStock ? (isRtl ? 'غير متوفر' : 'Unavailable') : (isRtl ? 'أضف للسلة' : 'Add to Cart')}
            </button>
          )}

          <button 
            onClick={(e) => { e.stopPropagation(); if (onInquire) onInquire(formattedPart); else if (addToCart && !isOutOfStock) addToCart(formattedPart, qty); }}
            disabled={isOutOfStock}
            style={{ padding: '8px 10px', backgroundColor: '#f1f5f9', color: '#1f3a5f', border: '1px solid #cbd5e0', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            🔍 {isRtl ? 'فحص / اسأل' : 'Inquire'}
          </button>

          <button 
            onClick={() => togglePartCardExpand(part.id)}
            style={{ padding: '8px 10px', backgroundColor: isExpanded ? '#feefe8' : '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {isExpanded ? (isRtl ? 'إغلاق ▲' : 'Less ▲') : (isRtl ? 'المزيد 🔍' : 'More 🔍')}
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

  return (
    <aside style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 🚀 1. الماسح الذكي لرقم الشاصي وصورة الاستمارة (أعلى الصفحة) */}
      <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '18px', border: '2px solid #e0872a', boxShadow: '0 8px 24px rgba(224,135,42,0.08)', direction: isRtl ? 'rtl' : 'ltr' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', color: '#1f3a5f', fontSize: '17px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📸</span> {isRtl ? 'الفحص الذكي بالاستمارة ورقم الشاصي (مطابقة 100% فورياً)' : 'Smart VIN & Registration Card Scanner (100% Fitment)'}
            </h3>
            <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
              {isRtl 
                ? 'صوّر استمارة سيارتك أو أدخل رقم الشاصي (17 حرف) ليقوم النظام بعرض حالة التوافق لكل قطعة تلقائياً.' 
                : 'Upload vehicle Istemara or enter 17-digit VIN to automatically identify compatibility.'}
            </p>
          </div>

          {decodedVehicle && (
            <button
              onClick={clearSearch}
              style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', padding: '6px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              🔄 {isRtl ? 'إلغاء التحديد وعرض كل السيارات' : 'Clear Vehicle Match'}
            </button>
          )}
        </div>

        {decodedVehicle ? (
          <div style={{ padding: '16px 20px', backgroundColor: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <strong style={{ color: '#166534', fontSize: '15px', display: 'block' }}>
                ✅ {isRtl ? 'تم التعرف على السيارة بنجاح:' : 'Vehicle Identified:'} {decodedVehicle.make} {decodedVehicle.model} ({decodedVehicle.year})
              </strong>
              {decodedVehicle.engine && <span style={{ fontSize: '12.5px', color: '#15803d' }}>⚡ {isRtl ? 'المحرك:' : 'Engine:'} {decodedVehicle.engine} </span>}
              {decodedVehicle.vin && <span style={{ fontSize: '12px', color: '#166534', fontFamily: 'monospace', fontWeight: 'bold' }}>[VIN: {decodedVehicle.vin}]</span>}
            </div>
            <span style={{ backgroundColor: '#166534', color: 'white', padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>
              🎯 {isRtl ? 'تم تفعيل فحص التوافق على جميع القطع' : 'Fitment filter active on all parts'}
            </span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            
            {/* زر رفع وتصوير الاستمارة */}
            <div
              onClick={() => !isDecodingVin && fileInputRef.current?.click()}
              style={{
                border: '2px dashed #0284c7',
                backgroundColor: '#f0f9ff',
                borderRadius: '14px',
                padding: '16px',
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
              <div style={{ fontSize: '28px', marginBottom: '4px' }}>📷</div>
              <strong style={{ color: '#0369a1', fontSize: '13.5px', display: 'block', marginBottom: '2px' }}>
                {isRtl ? 'اضغط لتصوير أو رفع الاستمارة' : 'Snap / Upload Istemara Photo'}
              </strong>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                {isRtl ? 'استخراج وقراءة فورية بالذكاء الاصطناعي' : 'Instant AI OCR Reading'}
              </span>
            </div>

            {/* إدخال رقم الشاصي يدوياً */}
            <form
              onSubmit={(e) => { e.preventDefault(); decodeVinNumber(vinInput.trim().toUpperCase()); }}
              style={{
                border: '1.5px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                borderRadius: '14px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '8px'
              }}
            >
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#1f3a5f' }}>
                {isRtl ? 'أو أدخل رقم الشاصي يدوياً (17 حرف ورقم):' : 'Or Enter 17-digit VIN Manually:'}
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  maxLength={17}
                  placeholder={isRtl ? "JTEBU5JR8K5..." : "Enter 17-char VIN..."}
                  value={vinInput}
                  onChange={(e) => setVinInput(e.target.value.toUpperCase())}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e0', fontSize: '13px', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '1px' }}
                />
                <button
                  type="submit"
                  disabled={isDecodingVin || vinInput.trim().length !== 17}
                  style={{ padding: '10px 18px', backgroundColor: '#e0872a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px', cursor: (vinInput.trim().length === 17) ? 'pointer' : 'not-allowed', opacity: (vinInput.trim().length === 17) ? 1 : 0.6 }}
                >
                  {isRtl ? 'فحص 🚀' : 'Check 🚀'}
                </button>
              </div>
            </form>

          </div>
        )}

        {isDecodingVin && (
          <div style={{ marginTop: '12px', textAlign: 'center', color: '#0369a1', fontWeight: 'bold', fontSize: '12.5px' }}>
            🔄 {statusMsg}
          </div>
        )}
      </div>

      {/* 🌟 2. بطاقات اختيار طريقة البحث (البصري / الكتالوج الهرمي) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', direction: isRtl ? 'rtl' : 'ltr' }}>
        
        {/* الخيار 1: البحث البصري السريع */}
        <div
          onClick={() => setSearchMode('visual')}
          style={{
            backgroundColor: searchMode === 'visual' ? '#f0fdf4' : '#ffffff',
            border: searchMode === 'visual' ? '2.5px solid #16a34a' : '1.5px solid #e2e8f0',
            borderRadius: '16px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            boxShadow: searchMode === 'visual' ? '0 8px 20px rgba(22,163,74,0.12)' : '0 2px 8px rgba(0,0,0,0.03)',
            position: 'relative'
          }}
        >
          {searchMode === 'visual' && (
            <span style={{ position: 'absolute', top: '12px', [isRtl ? 'left' : 'right']: '12px', backgroundColor: '#16a34a', color: 'white', fontSize: '10.5px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px' }}>
              ✓ {isRtl ? 'المحدد' : 'Active'}
            </span>
          )}
          <div style={{ fontSize: '28px', marginBottom: '6px' }}>🎯</div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#1f3a5f', fontWeight: 'bold' }}>
            {isRtl ? '1. البحث البصري (محدد السيارة)' : '1. Visual Selector'}
          </h3>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
            {isRtl ? 'اختر سيارتك بالصور والبطاقات خطوة بخطوة.' : 'Browse parts visually step-by-step.'}
          </p>
        </div>

        {/* الخيار 2: شجرة الكتالوج الهرمية */}
        <div
          onClick={() => setSearchMode('tree')}
          style={{
            backgroundColor: searchMode === 'tree' ? '#e8f2fc' : '#ffffff',
            border: searchMode === 'tree' ? '2.5px solid #1f3a5f' : '1.5px solid #e2e8f0',
            borderRadius: '16px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            boxShadow: searchMode === 'tree' ? '0 8px 20px rgba(31,58,95,0.12)' : '0 2px 8px rgba(0,0,0,0.03)',
            position: 'relative'
          }}
        >
          {searchMode === 'tree' && (
            <span style={{ position: 'absolute', top: '12px', [isRtl ? 'left' : 'right']: '12px', backgroundColor: '#1f3a5f', color: 'white', fontSize: '10.5px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px' }}>
              ✓ {isRtl ? 'المحدد' : 'Active'}
            </span>
          )}
          <div style={{ fontSize: '28px', marginBottom: '6px' }}>📂</div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#1f3a5f', fontWeight: 'bold' }}>
            {isRtl ? '2. كتالوج شجرة التصفية' : '2. Full Catalog Tree'}
          </h3>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
            {isRtl ? 'تصفح كل الماركات والموديلات بشكل هرمي.' : 'Browse hierarchical catalog.'}
          </p>
        </div>

      </div>

      {/* 🚀 عرض الطريقة الأولى: محدد السيارة البصري (يظل متاحاً دائماً) */}
      {searchMode === 'visual' && !activeSearchQuery && (
        <VisualVehicleSelector 
          lang={lang} 
          renderPartCard={renderPartCard} 
        />
      )}

      {/* 🚀 عرض الطريقة الثانية: شجرة التصفية / نتائج البحث برقم القطعة */}
      {(activeSearchQuery || searchMode === 'tree') && (
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 4px 25px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', direction: isRtl ? 'rtl' : 'ltr' }}>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '260px' }}>
              <input 
                type="text" 
                placeholder={isRtl ? "ابحث برقم القطعة أو الكود الحصري فقط (مثال: 04465-33470)..." : "Search strictly by Part Number, Code or SKU..."} 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '2px solid #1f3a5f', outline: 'none', fontSize: '13.5px', fontFamily: 'monospace' }} 
              />
              <button type="submit" style={{ padding: '0 20px', backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                🔍 {isRtl ? 'بحث برقم القطعة' : 'Search Number'}
              </button>
            </form>

            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid #cbd5e0', fontSize: '13px', backgroundColor: '#f8fafc', fontWeight: 'bold', cursor: 'pointer' }}
            >
              <option value="default">↕️ {isRtl ? 'الترتيب الافتراضي' : 'Default Sort'}</option>
              <option value="price_asc">📉 {isRtl ? 'السعر: من الأرخص للأغلى' : 'Price: Low to High'}</option>
              <option value="price_desc">📈 {isRtl ? 'السعر: من الأعلى للأرخص' : 'Price: High to Low'}</option>
            </select>
          </div>

          {activeSearchQuery ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: '#1f3a5f', margin: 0 }}>
                  🔍 {isRtl ? `نتائج البحث عن رقم القطعة: "${activeSearchQuery}"` : `Results for Part Number: "${activeSearchQuery}"`}
                </h3>
                <button onClick={clearSearch} style={{ padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', border: '1px solid #cbd5e0', backgroundColor: '#ffffff', fontWeight: 'bold', fontSize: '12.5px' }}>
                  ↩️ {isRtl ? 'العودة للكتالوج' : 'Back to Catalog'}
                </button>
              </div>

              {searchResults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <p style={{ color: '#64748b', fontWeight: 'bold' }}>
                    {isRtl 
                      ? 'عفواً، لا توجد قطعة مطابقة لهذا الرقم تماماً (البحث مخصص فقط لأرقام وأكواد القطع وليس للأسماء العامة).' 
                      : 'No exact part number match found (Search strictly requires Part Numbers/Codes, not general names).'}
                  </p>
                  <button onClick={() => { setReqSubmitted(false); setShowRequestModal(true); }} style={{ padding: '10px 20px', backgroundColor: '#e0872a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>
                    📩 {isRtl ? 'إرسال طلب قطعة بهذا الرقم' : 'Request part with this number'}
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
                    {displayedSearchResults.map((part: any) => renderPartCard(part))}
                  </div>

                  {displayLimit < searchResults.length && (
                    <div style={{ textAlign: 'center', marginTop: '24px' }}>
                      <button
                        onClick={() => setDisplayLimit(prev => prev + 20)}
                        style={{
                          padding: '10px 24px',
                          backgroundColor: '#f1f5f9',
                          border: '1.5px solid #cbd5e0',
                          borderRadius: '12px',
                          fontWeight: 'bold',
                          color: '#1f3a5f',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        🔽 {isRtl ? `عرض المزيد من القطع (${displayedSearchResults.length} من ${searchResults.length})` : `Load More Parts (${displayedSearchResults.length} of ${searchResults.length})`}
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
                    <div onClick={() => toggleNode(makeKey, () => fetchYearsForMake(make))} style={{ ...nodeStyle, backgroundColor: isMakeOpen ? '#e8f2fc' : '#f8fafc', fontWeight: 'bold', padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {!imgErrors[make] ? (
                          <img src={`https://www.google.com/s2/favicons?sz=128&domain=${MAKE_DOMAINS[make] || 'google.com'}`} alt={make} style={{ width: '22px', height: '22px', objectFit: 'contain' }} onError={() => setImgErrors(prev => ({...prev, [make]: true}))} />
                        ) : (<span style={{ fontSize: '16px' }}>🚗</span>)}
                        <span style={{ fontSize: '14.5px', color: '#1f3a5f' }}>{makeName} {isYearsLoading && <small style={{ color: '#e0872a' }}>{isRtl ? '(فحص...)' : '(Checking...)'}</small>}</span>
                      </div>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{isMakeOpen ? '▼' : isRtl ? '◀' : '▶'}</span>
                    </div>

                    {isMakeOpen && (
                      <ul style={{ listStyleType: 'none', padding: 0, [isRtl ? 'marginRight' : 'marginLeft']: '18px', marginTop: '6px' }}>
                        {isYearsLoading ? (
                          <li style={{ padding: '6px 12px', fontSize: '12px', color: '#64748b' }}>🔄 {isRtl ? 'جاري فحص السنوات المتاحة...' : 'Checking available years...'}</li>
                        ) : availableYears.length === 0 ? (
                          <li style={{ padding: '6px 12px', fontSize: '12px', color: '#94a3b8' }}>{isRtl ? 'لا توجد معروضات لهذه الماركة حالياً.' : 'No items available for this make.'}</li>
                        ) : (
                          availableYears.map((year: string) => {
                            const yearKey = `year_${make}_${year}`;
                            const isYearOpen = !!expandedNodes[yearKey];
                            const modelsCacheKey = `models_${make}_${year}`;
                            const isModelsLoading = !!loadingNodes[modelsCacheKey];
                            const availableModels = nodeDataCache[modelsCacheKey] || [];

                            return (
                              <li key={year} style={{ marginBottom: '6px' }}>
                                <div onClick={() => toggleNode(yearKey, () => fetchModelsForYear(make, year))} style={{ ...nodeStyle, backgroundColor: isYearOpen ? '#f0f7ff' : 'transparent', fontSize: '13.5px', color: '#0284c7', padding: '7px 12px', fontWeight: 'bold' }}>
                                  <span>📅 {year} {isModelsLoading && <small style={{ color: '#e0872a' }}>{isRtl ? '(فحص...)' : '(Checking...)'}</small>}</span>
                                  <span style={{ fontSize: '10px' }}>{isYearOpen ? '▼' : isRtl ? '◀' : '▶'}</span>
                                </div>

                                {isYearOpen && (
                                  <ul style={{ listStyleType: 'none', padding: 0, [isRtl ? 'marginRight' : 'marginLeft']: '18px', marginTop: '6px' }}>
                                    {isModelsLoading ? (
                                      <li style={{ padding: '6px 12px', fontSize: '12px', color: '#64748b' }}>🔄 {isRtl ? 'جاري البحث عن الموديلات...' : 'Checking models...'}</li>
                                    ) : availableModels.length === 0 ? (
                                      <li style={{ padding: '6px 12px', fontSize: '12px', color: '#94a3b8' }}>{isRtl ? 'لا توجد معروضات لهذه السنة.' : 'No items.'}</li>
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
                                            <div onClick={() => toggleNode(modelKey, () => fetchEnginesForVehicle(make, year, model))} style={{ ...nodeStyle, backgroundColor: isModelOpen ? '#f1f5f9' : 'transparent', fontSize: '13.5px', padding: '7px 12px' }}>
                                              <span>🚘 {modelName} {isEnginesLoading && <small style={{ color: '#e0872a' }}>{isRtl ? '(فحص...)' : '(Checking...)'}</small>}</span>
                                              <span style={{ fontSize: '10px', color: '#64748b' }}>{isModelOpen ? '▼' : isRtl ? '◀' : '▶'}</span>
                                            </div>

                                            {isModelOpen && (
                                              <ul style={{ listStyleType: 'none', padding: 0, [isRtl ? 'marginRight' : 'marginLeft']: '18px', marginTop: '6px' }}>
                                                {isEnginesLoading ? (
                                                  <li style={{ padding: '6px 12px', fontSize: '12px', color: '#64748b' }}>🔄 {isRtl ? 'جاري الفحص...' : 'Checking...'}</li>
                                                ) : (
                                                  availableEngines.map((engine: string) => {
                                                    const engineKey = `eng_${make}_${year}_${model}_${engine}`;
                                                    const isEngineOpen = !!expandedNodes[engineKey];
                                                    const mainCatsCacheKey = `maincats_${make}_${year}_${model}_${engine}`;
                                                    const isMainCatsLoading = !!loadingNodes[mainCatsCacheKey];
                                                    const availableMainCategories = nodeDataCache[mainCatsCacheKey] || [];

                                                    return (
                                                      <li key={engine} style={{ marginBottom: '6px' }}>
                                                        <div onClick={() => toggleNode(engineKey, () => fetchMainCategoriesForEngine(make, year, model, engine))} style={{ ...nodeStyle, backgroundColor: isEngineOpen ? '#e8f2fc' : 'transparent', fontSize: '13px', color: '#1f3a5f', padding: '6px 10px', fontWeight: '500' }}>
                                                          <span>⚡ {engine} {isMainCatsLoading && <small style={{ color: '#e0872a' }}>{isRtl ? '(فحص...)' : '(Checking...)'}</small>}</span>
                                                          <span style={{ fontSize: '10px' }}>{isEngineOpen ? '▼' : isRtl ? '◀' : '▶'}</span>
                                                        </div>

                                                        {isEngineOpen && (
                                                          <ul style={{ listStyleType: 'none', padding: 0, [isRtl ? 'marginRight' : 'marginLeft']: '15px', marginTop: '6px' }}>
                                                            {isMainCatsLoading ? (
                                                              <li style={{ padding: '6px 12px', fontSize: '12px', color: '#64748b' }}>🔄 {isRtl ? 'جاري فحص الأقسام الرئيسية...' : 'Checking main categories...'}</li>
                                                            ) : availableMainCategories.length === 0 ? (
                                                              <li style={{ padding: '6px 12px', fontSize: '12px', color: '#94a3b8' }}>{isRtl ? 'لا توجد أقسام متوفرة.' : 'No categories.'}</li>
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
                                                                    <div onClick={() => toggleNode(mainCatKey, () => fetchSubCategoriesForMain(make, year, model, engine, mainCategory))} style={{ ...nodeStyle, backgroundColor: isMainCatOpen ? '#fff7ed' : 'transparent', fontSize: '13px', color: '#1f3a5f', padding: '6px 10px', fontWeight: 'bold' }}>
                                                                      <span>📂 {displayMainCategory} {isSubCatsLoading && <small style={{ color: '#e0872a' }}>{isRtl ? '(فحص...)' : '(Checking...)'}</small>}</span>
                                                                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>{isMainCatOpen ? '▼' : isRtl ? '◀' : '▶'}</span>
                                                                    </div>

                                                                    {isMainCatOpen && (
                                                                      <ul style={{ listStyleType: 'none', padding: 0, [isRtl ? 'marginRight' : 'marginLeft']: '15px', marginTop: '6px' }}>
                                                                        {isSubCatsLoading ? (
                                                                          <li style={{ padding: '6px 12px', fontSize: '12px', color: '#64748b' }}>🔄 {isRtl ? 'جاري فحص الأقسام الفرعية...' : 'Checking sub-categories...'}</li>
                                                                        ) : availableSubCategories.length === 0 ? (
                                                                          <li style={{ padding: '6px 12px', fontSize: '12px', color: '#94a3b8' }}>{isRtl ? 'لا توجد أقسام فرعية.' : 'No sub-categories.'}</li>
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
                                                                                <div onClick={() => toggleNode(subCatKey, () => fetchPartsForSubCategory(make, year, model, engine, mainCategory, subCategory))} style={{ ...nodeStyle, backgroundColor: isSubCatOpen ? '#f0fdf4' : 'transparent', fontSize: '12.5px', color: '#166534', padding: '6px 10px', fontWeight: 'bold', borderLeft: isRtl ? 'none' : '3px solid #4ade80', borderRight: isRtl ? '3px solid #4ade80' : 'none' }}>
                                                                                  <span>🔸 {displaySubCategory} {isPartsLoading && <small style={{ color: '#e0872a' }}>{isRtl ? '(جلب...)' : '(Fetching...)'}</small>}</span>
                                                                                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>{isSubCatOpen ? '▼' : isRtl ? '◀' : '▶'}</span>
                                                                                </div>

                                                                                {isSubCatOpen && (
                                                                                  <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0', marginTop: '8px', marginBottom: '12px' }}>
                                                                                    {isPartsLoading ? (
                                                                                      <p style={{ textAlign: 'center', color: '#64748b', margin: 0 }}>🔄 {isRtl ? 'جاري تحميل القطع المتاحة...' : 'Loading available parts...'}</p>
                                                                                    ) : subCategoryParts.length === 0 ? (
                                                                                      <p style={{ textAlign: 'center', color: '#94a3b8', margin: 0 }}>{isRtl ? 'لا توجد قطع معروضة حالياً.' : 'No parts available currently.'}</p>
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
        <div onClick={() => setShowRequestModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '18px', padding: '24px', maxWidth: '460px', width: '100%', direction: isRtl ? 'rtl' : 'ltr' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #edf2f7', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#1f3a5f', fontWeight: 'bold' }}>📩 {isRtl ? 'طلب قطعة غير متوفرة' : 'Request Unavailable Part'}</h3>
              <button onClick={() => setShowRequestModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#94a3b8' }}>✖</button>
            </div>

            {reqSubmitted ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <span style={{ fontSize: '50px', display: 'block', marginBottom: '10px' }}>✅</span>
                <h4 style={{ margin: '0 0 8px 0', color: '#16a34a' }}>{isRtl ? 'تم إرسال طلبك بنجاح!' : 'Your request was sent successfully!'}</h4>
                <button onClick={() => setShowRequestModal(false)} style={{ width: '100%', padding: '12px', backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {isRtl ? 'تم' : 'Done'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleInAppRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <input type="tel" placeholder={isRtl ? 'رقم الهاتف للتواصل' : 'Contact Phone Number'} value={custPhone} onChange={(e) => setCustPhone(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required />
                <textarea placeholder={isRtl ? 'ملاحظات إضافية...' : 'Additional Notes...'} value={custNotes} onChange={(e) => setCustNotes(e.target.value)} rows={3} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} />
                <button type="submit" disabled={isSubmittingReq} style={{ width: '100%', padding: '13px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {isSubmittingReq ? (isRtl ? 'جاري الإرسال...' : 'Sending...') : (isRtl ? 'إرسال الطلب الآن 🚀' : 'Submit Request 🚀')}
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
