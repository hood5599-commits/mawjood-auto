import React, { useState } from 'react';
import { CAR_DATA, CAR_YEARS } from '../data/carData';
import { SUPABASE_URL, API_KEY } from '../config/supabase';

/* ============================================================================
   🖼️ قسم التحكم السريع في صور الأقسام (عدّل الروابط من هنا في أي وقت)
   يمكنك وضع رابط مباشر من الإنترنت أو مسار من جهازك داخل مجلد public
============================================================================ */
export const CATEGORY_CUSTOM_IMAGES: Record<string, string> = {
  "Brake & Wheel Hub": "https://images.unsplash.com/photo-1600706432502-778d9763cb6d?w=500&auto=format&fit=crop&q=80",
  "Suspension": "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=500&auto=format&fit=crop&q=80",
  "Engine": "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=500&auto=format&fit=crop&q=80",
  "Cooling System": "https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?w=500&auto=format&fit=crop&q=80",
  "Heat & Air Conditioning": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=500&auto=format&fit=crop&q=80",
  "Ignition": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=500&auto=format&fit=crop&q=80",
  "Fuel & Air": "https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?w=500&auto=format&fit=crop&q=80",
  "Electrical": "https://images.unsplash.com/photo-1597762117709-8588820c7d7e?w=500&auto=format&fit=crop&q=80",
  "Body & Lamp Assembly": "https://images.unsplash.com/photo-1508974239320-0a029497e820?w=500&auto=format&fit=crop&q=80",
  "Steering": "https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?w=500&auto=format&fit=crop&q=80",
  "Drivetrain": "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=500&auto=format&fit=crop&q=80",
  "Transmission-Automatic": "https://images.unsplash.com/photo-1588644525273-f37b60d78512?w=500&auto=format&fit=crop&q=80",
  "Transmission-Manual": "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=500&auto=format&fit=crop&q=80",
  "Wheel": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500&auto=format&fit=crop&q=80",
  "Wiper & Washer": "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=500&auto=format&fit=crop&q=80"
};

const DEFAULT_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=500&auto=format&fit=crop&q=80";

const TOKENS = {
  obsidian: '#090D16',
  obsidianSoft: '#0F172A',
  slate: '#1E293B',
  slateText: '#475569',
  mutedText: '#64748B',
  alabaster: '#F8FAFC',
  white: '#FFFFFF',
  hairline: 'rgba(226, 232, 240, 0.85)',
  copper: '#EA580C',
  copperTint: '#FFF7ED',
  copperLine: 'rgba(234, 88, 12, 0.25)',
  success: '#16A34A',
  successTint: '#F0FDF4',
};

type IconName = 'car' | 'search' | 'bolt' | 'folder' | 'refresh' | 'undo' | 'layers';

const Icon: React.FC<{ name: IconName; size?: number; color?: string }> = ({ name, size = 16, color = 'currentColor' }) => {
  const icons: Record<IconName, React.ReactNode> = {
    car: (
      <>
        <path d="M3 12.5 4.8 7.2A2 2 0 0 1 6.7 5.8h10.6a2 2 0 0 1 1.9 1.4l1.8 5.3" />
        <rect x="2.5" y="12.5" width="19" height="6" rx="2" />
        <circle cx="7" cy="18.5" r="1.6" />
        <circle cx="17" cy="18.5" r="1.6" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.35-4.35" />
      </>
    ),
    bolt: <path d="M13 2 4.5 13.5h6l-1.5 8.5 9-12h-6.5z" />,
    folder: <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.7l1.7 2h9.6A1.5 1.5 0 0 1 22 8.5v9A1.5 1.5 0 0 1 20.5 19h-16A1.5 1.5 0 0 1 3 17.5Z" />,
    refresh: <path d="M20 11.5A8 8 0 1 0 18.6 16M20 11.5V5.8M20 11.5h-5.7" />,
    undo: <path d="M9 14 4 9l5-5M4 9h10.5a6.5 6.5 0 0 1 0 13H11" />,
    layers: (
      <>
        <path d="m12 3 9 4.7-9 4.7-9-4.7Z" />
        <path d="m3 12.2 9 4.7 9-4.7M3 16.7l9 4.7 9-4.7" />
      </>
    )
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}
    >
      {icons[name]}
    </svg>
  );
};

const CATEGORY_NAMES: Record<string, { ar: string; en: string; tag: string }> = {
  "Brake & Wheel Hub": { ar: "الفرامل والسفايف والدرامات", en: "Brake & Wheel Hub", tag: "Braking & Rotors" },
  "Suspension": { ar: "المساعدات والجامبينات والشيالات", en: "Suspension & Shocks", tag: "Chassis & Dampers" },
  "Engine": { ar: "المحرك ومكونات المكينة", en: "Engine & Components", tag: "Powertrain & Blocks" },
  "Cooling System": { ar: "نظام التبريد والرديتر", en: "Cooling & Radiators", tag: "Thermal Management" },
  "Heat & Air Conditioning": { ar: "التكييف والكمبريسر والتدفئة", en: "A/C & Climate Control", tag: "Compressors & A/C" },
  "Ignition": { ar: "نظام الاشتعال (البلاكات والكويلات)", en: "Ignition System", tag: "Spark Plugs & Coils" },
  "Fuel & Air": { ar: "الوقود وبترول وهواء المكينة", en: "Fuel & Air Intake", tag: "Pumps & Injectors" },
  "Electrical": { ar: "الكهرباء والدينمة والسلف", en: "Electrical & Alternator", tag: "Starters & Dynamos" },
  "Body & Lamp Assembly": { ar: "الهيكل والإضاءة (بدي وليتات)", en: "Body & Lighting", tag: "LEDs & Body Panels" },
  "Steering": { ar: "نظام التوجيه والاستيرنج راك", en: "Steering System", tag: "Racks & Tie Rods" },
  "Drivetrain": { ar: "الدفع والمحاور (الأكسلات والشفت)", en: "Drivetrain & Axles", tag: "Shafts & CV Axles" },
  "Transmission-Automatic": { ar: "القير الأوتوماتيك (الجير)", en: "Automatic Transmission", tag: "Gearboxes & Torque" },
  "Transmission-Manual": { ar: "القير العادي (الكلتش)", en: "Manual Transmission", tag: "Clutch & Flywheels" },
  "Wheel": { ar: "الإطارات والرنجات والتواير", en: "Wheels & Tires", tag: "Rims & TPMS" },
  "Wiper & Washer": { ar: "المساحات وبخاخات ماي الجام", en: "Wipers & Washers", tag: "Blades & Motors" }
};

const SUBCATEGORY_NAMES: Record<string, { ar: string; en: string }> = {
  "Brake Pad": { ar: "فحمات وقماشات الفرامل (سفايف) — Brake Pads", en: "Brake Pads" },
  "Rotor": { ar: "هوبات وأقراص الفرامل (درام ويل) — Brake Rotors", en: "Brake Rotors" },
  "Caliper": { ar: "كليبر وملاقط الفرامل — Calipers", en: "Brake Calipers" },
  "ABS Control Module": { ar: "منظم مانع الانزلاق (ABS) — ABS Module", en: "ABS Control Module" },
  "Brake Fluid": { ar: "زيت الفرامل (آيل بريك) — Brake Fluid", en: "Brake Fluid" },
  "Wheel Bearing & Hub": { ar: "رمان وفلنجة العجل (بيرنج) — Wheel Bearings", en: "Wheel Bearings & Hub" },
  "Shock / Strut": { ar: "المساعدات وممتص الصدمات (جامبينات) — Shocks & Struts", en: "Shocks & Struts" },
  "Control Arm": { ar: "المقصات وأذرعة التحكم (شيالات) — Control Arms", en: "Control Arms" },
  "Coil Spring": { ar: "اليايات والزنبركات (سبرنغات) — Coil Springs", en: "Coil Springs" },
  "Sway Bar Link": { ar: "مسامير وأعمدة التوازن (رودات توازن) — Sway Bar Links", en: "Sway Bar Links" },
  "Control Arm Bushing": { ar: "جلب وربلات المقصات (بوشات) — Bushings", en: "Control Arm Bushings" },
  "Rack and Pinion": { ar: "دودة الدركسون (استيرنج راك) — Steering Rack", en: "Rack & Pinion Steering" },
  "Tie Rod End": { ar: "أذرعة وركب الدركسون (رودات سكان) — Tie Rods", en: "Tie Rod Ends" },
  "Coolant / Antifreeze": { ar: "سائل وماء تبريد الرديتر (ماي رديتر) — Coolant", en: "Coolant / Antifreeze" },
  "Water Pump": { ar: "طرمبة ومضخة الماء (واتر بمب) — Water Pump", en: "Water Pump" },
  "Radiator": { ar: "رديتر تبريد المحرك (رديتر ماي) — Radiator", en: "Engine Radiator" },
  "Thermostat": { ar: "ثرموستات وكوع الحرارة (بلف حرارة) — Thermostat", en: "Thermostat" },
  "Radiator Fan Assembly": { ar: "مروحة تبريد الرديتر — Radiator Fan", en: "Radiator Fan Assembly" },
  "Coolant Reservoir": { ar: "قربة وخزان ماء الرديتر (قربة ماي) — Coolant Tank", en: "Coolant Reservoir" },
  "A/C Condenser": { ar: "مكثف ورديتر المكيف (كوندنسر) — A/C Condenser", en: "A/C Condenser" },
  "A/C Compressor": { ar: "كمبروسر وضاغط المكيف (كمبريسر) — A/C Compressor", en: "A/C Compressor" },
  "Cabin Air Filter": { ar: "فلتر هواء المكيف والمقصورة (فلتر مكيف) — Cabin Filter", en: "Cabin Air Filter" },
  "Spark Plug": { ar: "بواجي وشمعات الاحتراق (بلاكات) — Spark Plugs", en: "Spark Plugs" },
  "Ignition Coil": { ar: "كويلات وملفات الإشعال (كويلات) — Ignition Coils", en: "Ignition Coils" },
  "Air Filter": { ar: "فلتر هواء المحرك (فلتر مكينة) — Air Filter", en: "Engine Air Filter" },
  "Fuel Pump & Housing Assembly": { ar: "طرمبة ومضخة الوقود (فيول بمب) — Fuel Pump", en: "Fuel Pump Assembly" },
  "Fuel Injector": { ar: "بخاخات وحاقن الوقود (نوزلات) — Fuel Injectors", en: "Fuel Injectors" },
  "Filter": { ar: "فلتر زيت القير (فلتر جير) — Transmission Filter", en: "Transmission Filter" },
  "Transmission Fluid": { ar: "زيت وسوائل القير (آيل جير / ATF) — ATF Fluid", en: "Transmission Fluid" },
  "CV Axle": { ar: "العكوس ومحاور الدفع (أكسلات) — CV Axles", en: "CV Axles" },
  "Alternator / Generator": { ar: "دينمو وشاحن البطارية (دينمة) — Alternator", en: "Alternator / Generator" },
  "Starter Motor": { ar: "سلف ومارش التشغيل (ستارتر) — Starter Motor", en: "Starter Motor" },
  "Battery": { ar: "بطارية السيارة (بتري) — Battery", en: "Battery" },
  "Catalytic Converter": { ar: "دبة التلوث والبيئة (كربونة) — Catalytic Converter", en: "Catalytic Converter" },
  "Headlamp Assembly": { ar: "الأنوار والشموع الأمامية (ليتات قدام) — Headlights", en: "Headlamp Assembly" },
  "Tail Lamp Assembly": { ar: "الأنوار والإسطبات الخلفية (ليتات ورا) — Tail Lamp Assembly", en: "Tail Lamp Assembly" },
  "Fog / Driving Lamp Assembly": { ar: "كشافات الضباب (كشافات) — Fog Lights", en: "Fog / Driving Lights" },
  "Bumper Cover": { ar: "الصدام الخارجي (دعامية / بمبر) — Bumpers", en: "Bumper Cover" },
  "Grille": { ar: "الشبك الأمامي (جريل) — Grille", en: "Front Grille" },
  "Fender": { ar: "الرفرف الجانبي (مدقار) — Fenders", en: "Fenders" },
  "Hood": { ar: "غطاء المحرك / الكبوت (بانيت) — Hood", en: "Hood / Bonnet" },
  "Outside Mirror Glass": { ar: "المرايا الجانبية (مناظر) — Side Mirrors", en: "Side Mirrors" },
  "Wheel": { ar: "الإطارات والرنجات والتواير — Wheels & Tires", en: "Wheels & Tires" },
  "Lug Nut": { ar: "براغي وصواميل الجنوط (براغي رنج) — Lug Nuts", en: "Lug Nuts" },
  "Motor Mount": { ar: "كراسي وقواعد المحرك (كراسي مكينة) — Engine Mounts", en: "Motor Mounts" },
  "Oil Filter": { ar: "فلتر وزيت المحرك (فلتر آيل) — Oil Filter", en: "Oil Filter" },
  "Belt": { ar: "سيور المحرك الخارجية (قايش) — Belts", en: "Drive Belts" }
};

interface VisualVehicleSelectorProps {
  lang: 'ar' | 'en';
  renderPartCard: (part: any) => React.ReactNode;
}

export const VisualVehicleSelector: React.FC<VisualVehicleSelectorProps> = ({ lang, renderPartCard }) => {
  const isRtl = lang === 'ar';

  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedEngine, setSelectedEngine] = useState('');

  const [currentStep, setCurrentStep] = useState<'idle' | 'engine' | 'main_cat' | 'sub_cat' | 'parts'>('idle');

  const [carFilteredParts, setCarFilteredParts] = useState<any[]>([]);
  const [availableEngines, setAvailableEngines] = useState<string[]>([]);
  const [availableMainCats, setAvailableMainCats] = useState<string[]>([]);
  const [availableSubCats, setAvailableSubCats] = useState<string[]>([]);
  const [matchingParts, setMatchingParts] = useState<any[]>([]);

  const [chosenEngine, setChosenEngine] = useState('');
  const [chosenMainCat, setChosenMainCat] = useState('');
  const [chosenSubCat, setChosenSubCat] = useState('');

  const [loading, setLoading] = useState(false);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);

  const isModelMatching = (dbModel: string, targetModel: string): boolean => {
    if (!dbModel || !targetModel) return true;
    const d = dbModel.toLowerCase().trim();
    const t = targetModel.toLowerCase().trim();
    if (d === t || d.includes(t) || t.includes(d)) return true;

    const aliases: Record<string, string[]> = {
      'باترول': ['patrol', 'باترول', 'فتك'],
      'كامري': ['camry', 'كامري'],
      'كورولا': ['corolla', 'كورولا'],
      'لاندكروزر': ['land cruiser', 'landcruiser', 'لاندكروزر', 'لاند كروزر'],
      'النترا': ['elantra', 'النترا', 'إلنترا'],
      'سوناتا': ['sonata', 'سوناتا'],
      'اوبتيما': ['optima', 'k5', 'أوبتيما', 'اوبتيما'],
      'تورس': ['taurus', 'تورس', 'توروس'],
      'تاهو': ['tahoe', 'تاهو'],
      'التيما': ['altima', 'التيما', 'ألتيما'],
      'e-class': ['e-class', 'e class', 'e300', 'e200', 'e350'],
      '6': ['6', 'مازدا 6', 'mazda 6'],
      'اكورد': ['accord', 'اكورد', 'أكورد']
    };

    for (const key of Object.keys(aliases)) {
      const list = aliases[key];
      if (list.some(a => t.includes(a)) && list.some(a => d.includes(a))) {
        return true;
      }
    }
    return false;
  };

  const isYearMatching = (dbYear: string, targetYear: string): boolean => {
    if (!dbYear || !targetYear) return true;
    const yStr = String(dbYear).trim();
    const target = Number(targetYear);

    if (yStr.includes('-')) {
      const [start, end] = yStr.split('-').map(Number);
      if (!isNaN(start) && !isNaN(end)) {
        return target >= Math.min(start, end) && target <= Math.max(start, end);
      }
    }
    return yStr === targetYear || yStr.includes(targetYear);
  };

  const handleStartSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMake || !selectedModel || !selectedYear) return;

    setLoading(true);
    try {
      const enMake = CAR_DATA[selectedMake]?.en || selectedMake;
      const url = `${SUPABASE_URL}/parts?or=(make.ilike.*${encodeURIComponent(selectedMake)}*,make.ilike.*${encodeURIComponent(enMake)}*)&select=*`;
      const res = await fetch(url, { headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` } });
      const data = await res.json();

      const matchedVehicles = (data || []).filter((p: any) => {
        const matchModel = isModelMatching(p.model || '', selectedModel);
        const matchYear = isYearMatching(p.year || '', selectedYear);
        return matchModel && matchYear;
      });

      setCarFilteredParts(matchedVehicles);

      const rawEngines = matchedVehicles.map((p: any) => p.engine && p.engine.trim() !== '' ? p.engine : (isRtl ? 'جميع المحركات (بنزين / ديزل)' : 'All Engines'));
      const enginesList = Array.from(new Set(rawEngines)) as string[];
      setAvailableEngines(enginesList.length > 0 ? enginesList : [isRtl ? 'جميع المحركات (بنزين / ديزل)' : 'All Engines']);

      if (selectedEngine) {
        setChosenEngine(selectedEngine);
        loadMainCategories(matchedVehicles, selectedEngine);
      } else if (enginesList.length <= 1) {
        const defaultEng = enginesList[0] || (isRtl ? 'جميع المحركات (بنزين / ديزل)' : 'All Engines');
        setChosenEngine(defaultEng);
        loadMainCategories(matchedVehicles, defaultEng);
      } else {
        setCurrentStep('engine');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMainCategories = (partsList: any[], engine?: string) => {
    const filtered = engine && !engine.includes('جميع المحركات') && !engine.includes('All Engines')
      ? partsList.filter(p => !p.engine || p.engine.includes('جميع') || p.engine.includes('All') || p.engine === engine)
      : partsList;

    const mainCats = new Set<string>();

    filtered.forEach((p: any) => {
      const pCat = p.category || '';
      const main = pCat.includes('>') ? pCat.split('>')[0].trim() : pCat;
      if (main && main !== 'عام') mainCats.add(main);
    });

    setAvailableMainCats(Array.from(mainCats));
    setCurrentStep('main_cat');
  };

  const handleSelectEngine = (eng: string) => {
    setChosenEngine(eng);
    loadMainCategories(carFilteredParts, eng);
  };

  const handleSelectMainCat = (cat: string) => {
    setChosenMainCat(cat);

    const subCats = new Set<string>();
    carFilteredParts.forEach((p: any) => {
      const pCat = p.category || '';
      const main = pCat.includes('>') ? pCat.split('>')[0].trim() : pCat;
      const sub = pCat.includes('>') ? pCat.split('>')[1].trim() : '';

      if (main === cat && sub) {
        subCats.add(sub);
      }
    });

    if (subCats.size === 0) {
      const parts = carFilteredParts.filter(p => (p.category || '').includes(cat));
      setMatchingParts(parts);
      setCurrentStep('parts');
    } else {
      setAvailableSubCats(Array.from(subCats));
      setCurrentStep('sub_cat');
    }
  };

  const handleSelectSubCat = (subCat: string) => {
    setChosenSubCat(subCat);

    const finalParts = carFilteredParts.filter((p: any) => {
      const pCat = p.category || '';
      const main = pCat.includes('>') ? pCat.split('>')[0].trim() : pCat;
      const sub = pCat.includes('>') ? pCat.split('>')[1].trim() : '';
      return main === chosenMainCat && (sub === subCat || !sub);
    });

    setMatchingParts(finalParts);
    setCurrentStep('parts');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', direction: isRtl ? 'rtl' : 'ltr' }}>
      
      {/* 🚘 صندوق محدد السيارة */}
      <div style={{
        backgroundColor: TOKENS.white,
        padding: '26px',
        borderRadius: '20px',
        border: `1.5px solid ${TOKENS.hairline}`,
        boxShadow: '0 8px 30px rgba(9,13,22,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '11px', backgroundColor: TOKENS.copperTint, border: `1px solid ${TOKENS.copperLine}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="car" size={18} color={TOKENS.copper} />
          </div>
          <div>
            <h3 style={{ margin: 0, color: TOKENS.obsidian, fontSize: '16.5px', fontWeight: 800 }}>
              {isRtl ? 'حدد سيارتك لعرض الأقسام والقطع المتوافقة 100%' : 'Select Your Vehicle for 100% Fitment Match'}
            </h3>
            <span style={{ fontSize: '12px', color: TOKENS.mutedText }}>
              {isRtl ? 'تصفح الكتالوج المخصص لسيارتك بدقة متناهية' : 'Browse catalog tailored exclusively to your model'}
            </span>
          </div>
        </div>

        <form onSubmit={handleStartSearch} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '6px', color: TOKENS.slateText }}>
              {isRtl ? '1. الماركة *' : '1. Make *'}
            </label>
            <select
              value={selectedMake}
              onChange={(e) => { setSelectedMake(e.target.value); setSelectedModel(''); }}
              required
              style={{ width: '100%', padding: '12px', borderRadius: '11px', border: `1px solid ${TOKENS.hairline}`, fontSize: '13px', fontWeight: 700, backgroundColor: TOKENS.alabaster, color: TOKENS.obsidian, outline: 'none' }}
            >
              <option value="">{isRtl ? '-- اختر الشركة --' : '-- Select Make --'}</option>
              {Object.keys(CAR_DATA).map(m => (
                <option key={m} value={m}>{m} ({CAR_DATA[m].en})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '6px', color: TOKENS.slateText }}>
              {isRtl ? '2. الموديل *' : '2. Model *'}
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              required
              disabled={!selectedMake}
              style={{ width: '100%', padding: '12px', borderRadius: '11px', border: `1px solid ${TOKENS.hairline}`, fontSize: '13px', fontWeight: 700, backgroundColor: TOKENS.alabaster, color: TOKENS.obsidian, outline: 'none' }}
            >
              <option value="">{isRtl ? '-- اختر الموديل --' : '-- Select Model --'}</option>
              {selectedMake && CAR_DATA[selectedMake]?.models?.map((mod: string) => (
                <option key={mod} value={mod}>{mod}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '6px', color: TOKENS.slateText }}>
              {isRtl ? '3. سنة الصنع *' : '3. Year *'}
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              required
              style={{ width: '100%', padding: '12px', borderRadius: '11px', border: `1px solid ${TOKENS.hairline}`, fontSize: '13px', fontWeight: 700, backgroundColor: TOKENS.alabaster, color: TOKENS.obsidian, outline: 'none' }}
            >
              <option value="">{isRtl ? '-- اختر السنة --' : '-- Select Year --'}</option>
              {CAR_YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '6px', color: TOKENS.slateText }}>
              {isRtl ? '4. المحرك (اختياري)' : '4. Engine (Optional)'}
            </label>
            <select
              value={selectedEngine}
              onChange={(e) => setSelectedEngine(e.target.value)}
              disabled={!selectedMake}
              style={{ width: '100%', padding: '12px', borderRadius: '11px', border: `1px solid ${TOKENS.hairline}`, fontSize: '13px', backgroundColor: TOKENS.alabaster, color: TOKENS.obsidian, outline: 'none' }}
            >
              <option value="">{isRtl ? '-- كل المحركات --' : '-- All Engines --'}</option>
              {selectedMake && CAR_DATA[selectedMake]?.engines?.map((eng: string) => (
                <option key={eng} value={eng}>{eng}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '13px 20px',
              backgroundColor: TOKENS.copper,
              color: '#ffffff',
              border: 'none',
              borderRadius: '11px',
              fontWeight: 800,
              fontSize: '13.5px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(234, 88, 12, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <Icon name="search" size={15} color="white" />
            <span>{loading ? (isRtl ? 'جاري الفحص...' : 'Checking...') : (isRtl ? 'استعراض الأقسام' : 'Explore Parts')}</span>
          </button>
        </form>
      </div>

      {/* 🧭 مسار التنقل (Breadcrumbs) */}
      {currentStep !== 'idle' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 18px', backgroundColor: TOKENS.white, borderRadius: '14px', border: `1px solid ${TOKENS.hairline}`, fontSize: '13px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 800, color: TOKENS.obsidian, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icon name="car" size={14} color={TOKENS.copper} />
            {selectedMake} {selectedModel} ({selectedYear})
          </span>
          {chosenEngine && <span style={{ color: TOKENS.slateText }}> › ⚡ {chosenEngine}</span>}
          {chosenMainCat && <span style={{ color: TOKENS.slateText }}> › 🗂️ {isRtl ? (CATEGORY_NAMES[chosenMainCat]?.ar || chosenMainCat) : (CATEGORY_NAMES[chosenMainCat]?.en || chosenMainCat)}</span>}
          {chosenSubCat && <span style={{ color: TOKENS.copper, fontWeight: 800 }}> › 📂 {isRtl ? (SUBCATEGORY_NAMES[chosenSubCat]?.ar || chosenSubCat) : (SUBCATEGORY_NAMES[chosenSubCat]?.en || chosenSubCat)}</span>}
          
          <button
            onClick={() => setCurrentStep('idle')}
            style={{ marginRight: isRtl ? 'auto' : '0', marginLeft: isRtl ? '0' : 'auto', background: 'none', border: 'none', color: '#dc2626', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Icon name="refresh" size={12} color="#dc2626" />
            {isRtl ? 'إعادة ضبط الاختيار' : 'Reset Selection'}
          </button>
        </div>
      )}

      {/* 1️⃣ شبكة اختيار نوع المحرك */}
      {currentStep === 'engine' && (
        <div style={{ backgroundColor: TOKENS.white, padding: '24px', borderRadius: '20px', border: `1px solid ${TOKENS.hairline}` }}>
          <h4 style={{ margin: '0 0 16px 0', color: TOKENS.obsidian, fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="bolt" size={17} color={TOKENS.copper} />
            {isRtl ? 'اختر نوع المحرك لسيارتك:' : 'Select Your Vehicle Engine:'}
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
            {availableEngines.map((eng, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectEngine(eng)}
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  border: `1.5px solid ${TOKENS.hairline}`,
                  backgroundColor: TOKENS.alabaster,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontWeight: 800,
                  color: TOKENS.obsidian
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = TOKENS.copper; e.currentTarget.style.backgroundColor = TOKENS.copperTint; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = TOKENS.hairline; e.currentTarget.style.backgroundColor = TOKENS.alabaster; }}
              >
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: TOKENS.copperTint, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  <Icon name="bolt" size={20} color={TOKENS.copper} />
                </div>
                <div>{eng}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2️⃣ شبكة بطاقات الأقسام الرئيسية مع صور قابلة للتخصيص */}
      {currentStep === 'main_cat' && (
        <div style={{ backgroundColor: TOKENS.white, padding: '24px', borderRadius: '20px', border: `1px solid ${TOKENS.hairline}` }}>
          <h4 style={{ margin: '0 0 18px 0', color: TOKENS.obsidian, fontSize: '16.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="layers" size={18} color={TOKENS.copper} />
            {isRtl ? 'اختر القسم الرئيسي لقطعة الغيار:' : 'Select Main Category:'}
          </h4>
          {availableMainCats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 0' }}>
              <p style={{ color: TOKENS.mutedText, fontWeight: 700 }}>
                {isRtl ? 'لا توجد قطع معروضة حالياً لسيارة:' : 'No parts available for:'} ({selectedMake} {selectedModel} {selectedYear})
              </p>
              <button
                onClick={() => setCurrentStep('idle')}
                style={{ padding: '9px 20px', backgroundColor: TOKENS.obsidian, color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, marginTop: '10px' }}
              >
                {isRtl ? 'اختيار سيارة أخرى' : 'Select Another Vehicle'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '16px' }}>
              {availableMainCats.map((cat) => {
                const meta = CATEGORY_NAMES[cat] || { ar: cat, en: cat, tag: "Spare Parts" };
                const catImage = CATEGORY_CUSTOM_IMAGES[cat] || DEFAULT_FALLBACK_IMAGE;
                const isHovered = hoveredCat === cat;

                return (
                  <div
                    key={cat}
                    onClick={() => handleSelectMainCat(cat)}
                    onMouseEnter={() => setHoveredCat(cat)}
                    onMouseLeave={() => setHoveredCat(null)}
                    style={{
                      borderRadius: '18px',
                      border: `1.5px solid ${isHovered ? TOKENS.copperLine : TOKENS.hairline}`,
                      backgroundColor: TOKENS.white,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
                      boxShadow: isHovered ? '0 14px 28px -10px rgba(9,13,22,0.12), 0 2px 6px rgba(234,88,12,0.06)' : '0 2px 10px rgba(9,13,22,0.03)',
                      transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <div style={{ position: 'relative', width: '100%', height: '115px', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
                      <img
                        src={catImage}
                        alt={meta.ar}
                        onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE; }}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                          transition: 'transform 0.4s ease'
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '40px',
                        background: 'linear-gradient(to top, rgba(15,23,42,0.6) 0%, transparent 100%)'
                      }} />
                      <span style={{
                        position: 'absolute',
                        bottom: '6px',
                        [isRtl ? 'right' : 'left']: '8px',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#ffffff',
                        letterSpacing: '0.03em',
                        textTransform: 'uppercase'
                      }}>
                        {meta.tag}
                      </span>
                    </div>

                    <div style={{ padding: '14px 12px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <strong style={{ fontSize: '13.5px', color: isHovered ? TOKENS.copper : TOKENS.obsidian, display: 'block', marginBottom: '3px', fontWeight: 800, transition: 'color 0.2s ease' }}>
                        {isRtl ? meta.ar : meta.en}
                      </strong>
                      <span style={{ fontSize: '11px', color: TOKENS.mutedText }}>{cat}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3️⃣ شبكة بطاقات الأقسام الفرعية */}
      {currentStep === 'sub_cat' && (
        <div style={{ backgroundColor: TOKENS.white, padding: '24px', borderRadius: '20px', border: `1px solid ${TOKENS.hairline}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h4 style={{ margin: 0, color: TOKENS.obsidian, fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="folder" size={17} color={TOKENS.copper} />
              {isRtl ? `الأقسام الفرعية المتوفرة في (${CATEGORY_NAMES[chosenMainCat]?.ar || chosenMainCat}):` : `Subcategories in (${chosenMainCat}):`}
            </h4>
            <button
              onClick={() => setCurrentStep('main_cat')}
              style={{ background: TOKENS.alabaster, border: `1px solid ${TOKENS.hairline}`, padding: '7px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: TOKENS.obsidian }}
            >
              <Icon name="undo" size={13} />
              {isRtl ? 'رجوع للأقسام الرئيسية' : 'Back to Categories'}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
            {availableSubCats.map((sub) => {
              const subInfo = SUBCATEGORY_NAMES[sub];
              const displaySubName = subInfo ? (isRtl ? subInfo.ar : subInfo.en) : sub;

              return (
                <div
                  key={sub}
                  onClick={() => handleSelectSubCat(sub)}
                  style={{
                    padding: '16px 14px',
                    borderRadius: '14px',
                    border: `1.5px solid ${TOKENS.hairline}`,
                    backgroundColor: TOKENS.alabaster,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.2s ease',
                    fontWeight: 700,
                    color: TOKENS.obsidian,
                    fontSize: '13px'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = TOKENS.success; e.currentTarget.style.backgroundColor = TOKENS.successTint; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = TOKENS.hairline; e.currentTarget.style.backgroundColor = TOKENS.alabaster; }}
                >
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: TOKENS.copper, flexShrink: 0 }} />
                  <span>{displaySubName}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4️⃣ عرض قطع الغيار المطابقة */}
      {currentStep === 'parts' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h4 style={{ margin: 0, color: TOKENS.obsidian, fontSize: '16.5px', fontWeight: 800 }}>
              🛒 {isRtl ? `القطع المتوافقة المتوفرة (${matchingParts.length}):` : `Compatible Parts (${matchingParts.length}):`}
            </h4>
            <button
              onClick={() => setCurrentStep(availableSubCats.length > 0 ? 'sub_cat' : 'main_cat')}
              style={{ background: TOKENS.white, border: `1px solid ${TOKENS.hairline}`, padding: '7px 14px', borderRadius: '10px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: TOKENS.obsidian }}
            >
              <Icon name="undo" size={13} />
              {isRtl ? 'تغيير القسم' : 'Change Category'}
            </button>
          </div>

          {matchingParts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', backgroundColor: TOKENS.white, borderRadius: '18px', border: `1px solid ${TOKENS.hairline}` }}>
              <p style={{ color: TOKENS.mutedText, fontWeight: 700 }}>
                {isRtl ? 'عفواً، لا توجد قطع متوفرة لهذا القسم حالياً.' : 'No parts available for this section.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {matchingParts.map((part) => renderPartCard(part))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default VisualVehicleSelector;
