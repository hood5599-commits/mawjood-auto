import React, { useState } from 'react';
import { CAR_DATA, CAR_YEARS } from '../data/carData';

const SUPABASE_URL = "https://shszpcjmhkemqwborfwy.supabase.co/rest/v1";
const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoc3pwY2ptaGtlbXF3Ym9yZnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMDcxNzMsImV4cCI6MjA5OTY4MzE3M30.QycaUsYnhXX-uyeq3LVht_b1HVR0V0Tp72yMZUkdz2k";

// 🗂️ أيقونات وبيانات الأقسام الرئيسية
const CATEGORY_META: Record<string, { ar: string; en: string; icon: string; bg: string }> = {
  "Brake & Wheel Hub": { ar: "الفرامل والسفايف والدرامات", en: "Brake & Wheel Hub", icon: "🛑", bg: "#fef2f2" },
  "Suspension": { ar: "المساعدات والجامبينات والشيالات", en: "Suspension", icon: "🔩", bg: "#faf5ff" },
  "Engine": { ar: "المحرك ومكونات المكينة", en: "Engine & Components", icon: "⚙️", bg: "#eff6ff" },
  "Cooling System": { ar: "نظام التبريد والرديتر", en: "Cooling System", icon: "❄️", bg: "#f0fdf4" },
  "Heat & Air Conditioning": { ar: "التكييف والكمبريسر والتدفئة", en: "Heat & Air Conditioning", icon: "💨", bg: "#fffbeb" },
  "Ignition": { ar: "نظام الاشتعال (البلاكات والكويلات)", en: "Ignition System", icon: "🔥", bg: "#fff7ed" },
  "Fuel & Air": { ar: "الوقود وبترول وهواء المكينة", en: "Fuel & Air", icon: "⛽", bg: "#f0fdfa" },
  "Electrical": { ar: "الكهرباء والدينمة والسلف", en: "Electrical System", icon: "⚡", bg: "#fefce8" },
  "Body & Lamp Assembly": { ar: "الهيكل والإضاءة (بدي وليتات)", en: "Body & Lighting", icon: "💡", bg: "#f8fafc" },
  "Steering": { ar: "نظام التوجيه والاستيرنج راك", en: "Steering System", icon: "🎯", bg: "#f5f3ff" },
  "Drivetrain": { ar: "الدفع والمحاور (الأكسلات والشفت)", en: "Drivetrain & Axles", icon: "🔄", bg: "#fdf2f8" },
  "Transmission-Automatic": { ar: "القير الأوتوماتيك (الجير)", en: "Automatic Transmission", icon: "🕹️", bg: "#f1f5f9" },
  "Transmission-Manual": { ar: "القير العادي (الكلتش)", en: "Manual Transmission", icon: "⚙️", bg: "#f1f5f9" },
  "Wheel": { ar: "الإطارات والرنجات والتواير", en: "Wheels & Tires", icon: "🛞", bg: "#f8fafc" },
  "Wiper & Washer": { ar: "المساحات وبخاخات ماي الجام", en: "Wipers & Washers", icon: "🌧️", bg: "#eff6ff" }
};

// 📂 قاموس ترجمة الأقسام الفرعية بالمصطلحات القطرية والإنجليزية
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
  "Tail Lamp Assembly": { ar: "الأنوار والإسطبات الخلفية (ليتات ورا) — Taillights", en: "Tail Lamp Assembly" },
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

  // 🚗 بيانات محدد السيارة
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedEngine, setSelectedEngine] = useState('');

  // 🪜 مراحل التدفق البصري
  const [currentStep, setCurrentStep] = useState<'idle' | 'engine' | 'main_cat' | 'sub_cat' | 'parts'>('idle');

  // تخزين القطع المفلترة الخاصة بالسيارة المختارة لمنع تكرار طلبات الشبكة
  const [carFilteredParts, setCarFilteredParts] = useState<any[]>([]);
  const [availableEngines, setAvailableEngines] = useState<string[]>([]);
  const [availableMainCats, setAvailableMainCats] = useState<string[]>([]);
  const [availableSubCats, setAvailableSubCats] = useState<string[]>([]);
  const [matchingParts, setMatchingParts] = useState<any[]>([]);

  const [chosenEngine, setChosenEngine] = useState('');
  const [chosenMainCat, setChosenMainCat] = useState('');
  const [chosenSubCat, setChosenSubCat] = useState('');

  const [loading, setLoading] = useState(false);

  // 🧠 مطابقة ذكية مرنة للموديل (تدعم العربي والإنجليزي)
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

  // 🧠 فحص وتطابق سنة الصنع (سواء نطاق 2015-2022 أو سنة مفردة 2019)
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

  // 1️⃣ بدء البحث البصري عند الضغط على "استعراض الأقسام"
  const handleStartSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMake || !selectedModel || !selectedYear) return;

    setLoading(true);
    try {
      const enMake = CAR_DATA[selectedMake]?.en || selectedMake;
      
      // جلب القطع بمرونة تشمل الاسم العربي أو الإنجليزي للماركة
      const url = `${SUPABASE_URL}/parts?or=(make.ilike.*${encodeURIComponent(selectedMake)}*,make.ilike.*${encodeURIComponent(enMake)}*)&select=*`;
      const res = await fetch(url, { headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` } });
      const data = await res.json();

      // تصفية القطع بناءً على الموديل وسنة الصنع بذكاء
      const matchedVehicles = (data || []).filter((p: any) => {
        const matchModel = isModelMatching(p.model || '', selectedModel);
        const matchYear = isYearMatching(p.year || '', selectedYear);
        return matchModel && matchYear;
      });

      setCarFilteredParts(matchedVehicles);

      // استخراج المحركات المتاحة
      const rawEngines = matchedVehicles.map((p: any) => p.engine && p.engine.trim() !== '' ? p.engine : (isRtl ? 'جميع المحركات (بنزين / ديزل)' : 'All Engines'));
      const enginesList = Array.from(new Set(rawEngines)) as string[];
      setAvailableEngines(enginesList.length > 0 ? enginesList : [isRtl ? 'جميع المحركات (بنزين / ديزل)' : 'All Engines']);

      // الانتقال الذكي للخطوة التالية
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

  // 2️⃣ استخراج الأقسام الرئيسية المتاحة للسيارة
  const loadMainCategories = (partsList: any[], engine: string) => {
    const mainCats = new Set<string>();

    partsList.forEach((p: any) => {
      const pCat = p.category || '';
      const main = pCat.includes('>') ? pCat.split('>')[0].trim() : pCat;
      if (main && main !== 'عام') mainCats.add(main);
    });

    setAvailableMainCats(Array.from(mainCats));
    setCurrentStep('main_cat');
  };

  // 3️⃣ عند اختيار المحرك بصرياً
  const handleSelectEngine = (eng: string) => {
    setChosenEngine(eng);
    loadMainCategories(carFilteredParts, eng);
  };

  // 4️⃣ عند اختيار القسم الرئيسي
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

    // إذا لم تكن هناك أقسام فرعية محددة، ننتقل لعرض القطع مباشرة
    if (subCats.size === 0) {
      const parts = carFilteredParts.filter(p => (p.category || '').includes(cat));
      setMatchingParts(parts);
      setCurrentStep('parts');
    } else {
      setAvailableSubCats(Array.from(subCats));
      setCurrentStep('sub_cat');
    }
  };

  // 5️⃣ عند اختيار القسم الفرعي وعرض القطع المتوافقة
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', direction: isRtl ? 'rtl' : 'ltr' }}>
      
      {/* 🚘 صندوق محدد السيارة */}
      <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '18px', border: '2px solid #1f3a5f', boxShadow: '0 8px 24px rgba(31,58,95,0.06)' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#1f3a5f', fontSize: '17px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🚘</span> {isRtl ? 'حدد سيارتك لعرض الأقسام والقطع المتوافقة 100%' : 'Select Your Vehicle for 100% Fitment Match'}
        </h3>

        <form onSubmit={handleStartSearch} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#475569' }}>
              {isRtl ? '1. الماركة *' : '1. Make *'}
            </label>
            <select
              value={selectedMake}
              onChange={(e) => { setSelectedMake(e.target.value); setSelectedModel(''); }}
              required
              style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#f8fafc' }}
            >
              <option value="">{isRtl ? '-- اختر الشركة --' : '-- Select Make --'}</option>
              {Object.keys(CAR_DATA).map(m => (
                <option key={m} value={m}>{m} ({CAR_DATA[m].en})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#475569' }}>
              {isRtl ? '2. الموديل *' : '2. Model *'}
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              required
              disabled={!selectedMake}
              style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#f8fafc' }}
            >
              <option value="">{isRtl ? '-- اختر الموديل --' : '-- Select Model --'}</option>
              {selectedMake && CAR_DATA[selectedMake]?.models?.map((mod: string) => (
                <option key={mod} value={mod}>{mod}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#475569' }}>
              {isRtl ? '3. سنة الصنع *' : '3. Year *'}
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              required
              style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#f8fafc' }}
            >
              <option value="">{isRtl ? '-- اختر السنة --' : '-- Select Year --'}</option>
              {CAR_YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#475569' }}>
              {isRtl ? '4. المحرك (اختياري)' : '4. Engine (Optional)'}
            </label>
            <select
              value={selectedEngine}
              onChange={(e) => setSelectedEngine(e.target.value)}
              disabled={!selectedMake}
              style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13px', backgroundColor: '#f8fafc' }}
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
              padding: '12px 20px',
              backgroundColor: '#e0872a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(224,135,42,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            🔍 {loading ? (isRtl ? 'جاري الفحص...' : 'Checking...') : (isRtl ? 'استعراض الأقسام' : 'Explore Parts')}
          </button>
        </form>
      </div>

      {/* 🧭 مسار التنقل البصري (Breadcrumbs) */}
      {currentStep !== 'idle' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 18px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 'bold', color: '#1f3a5f' }}>🚘 {selectedMake} {selectedModel} ({selectedYear})</span>
          {chosenEngine && <span style={{ color: '#64748b' }}> › ⚡ {chosenEngine}</span>}
          {chosenMainCat && <span style={{ color: '#64748b' }}> › 🗂️ {isRtl ? (CATEGORY_META[chosenMainCat]?.ar || chosenMainCat) : (CATEGORY_META[chosenMainCat]?.en || chosenMainCat)}</span>}
          {chosenSubCat && <span style={{ color: '#e0872a', fontWeight: 'bold' }}> › 📂 {isRtl ? (SUBCATEGORY_NAMES[chosenSubCat]?.ar || chosenSubCat) : (SUBCATEGORY_NAMES[chosenSubCat]?.en || chosenSubCat)}</span>}
          
          <button
            onClick={() => setCurrentStep('idle')}
            style={{ marginRight: isRtl ? 'auto' : '0', marginLeft: isRtl ? '0' : 'auto', background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            🔄 {isRtl ? 'إعادة ضبط الاختيار' : 'Reset Selection'}
          </button>
        </div>
      )}

      {/* 1️⃣ شبكة اختيار نوع المحرك */}
      {currentStep === 'engine' && (
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#1f3a5f', fontSize: '16px', fontWeight: 'bold' }}>
            ⚡ {isRtl ? 'اختر نوع المحرك لسيارتك:' : 'Select Your Vehicle Engine:'}
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
            {availableEngines.map((eng, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectEngine(eng)}
                style={{
                  padding: '20px',
                  borderRadius: '14px',
                  border: '1.5px solid #cbd5e0',
                  backgroundColor: '#f8fafc',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontWeight: 'bold',
                  color: '#1f3a5f'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#e0872a'; e.currentTarget.style.backgroundColor = '#fff7ed'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e0'; e.currentTarget.style.backgroundColor = '#f8fafc'; }}
              >
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚡</div>
                <div>{eng}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2️⃣ شبكة بطاقات الأقسام الرئيسية */}
      {currentStep === 'main_cat' && (
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#1f3a5f', fontSize: '16px', fontWeight: 'bold' }}>
            🗂️ {isRtl ? 'اختر القسم الرئيسي لقطعة الغيار:' : 'Select Main Category:'}
          </h4>
          {availableMainCats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <p style={{ color: '#64748b', fontWeight: 'bold' }}>
                {isRtl ? 'لا توجد قطع معروضة حالياً لسيارة:' : 'No parts available for:'} ({selectedMake} {selectedModel} {selectedYear})
              </p>
              <button
                onClick={() => setCurrentStep('idle')}
                style={{ padding: '8px 18px', backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}
              >
                🔄 {isRtl ? 'اختيار سيارة أخرى' : 'Select Another Vehicle'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
              {availableMainCats.map((cat) => {
                const meta = CATEGORY_META[cat] || { ar: cat, en: cat, icon: '📦', bg: '#f8fafc' };
                return (
                  <div
                    key={cat}
                    onClick={() => handleSelectMainCat(cat)}
                    style={{
                      padding: '22px 14px',
                      borderRadius: '16px',
                      border: '1.5px solid #e2e8f0',
                      backgroundColor: meta.bg,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)'; }}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>{meta.icon}</div>
                    <strong style={{ fontSize: '14px', color: '#1f3a5f', display: 'block', marginBottom: '4px' }}>
                      {isRtl ? meta.ar : meta.en}
                    </strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{cat}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3️⃣ شبكة بطاقات الأقسام الفرعية */}
      {currentStep === 'sub_cat' && (
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, color: '#1f3a5f', fontSize: '16px', fontWeight: 'bold' }}>
              📂 {isRtl ? `الأقسام الفرعية المتوفرة في (${CATEGORY_META[chosenMainCat]?.ar || chosenMainCat}):` : `Subcategories in (${chosenMainCat}):`}
            </h4>
            <button
              onClick={() => setCurrentStep('main_cat')}
              style={{ background: 'none', border: '1px solid #cbd5e0', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              ↩️ {isRtl ? 'رجوع للأقسام الرئيسية' : 'Back to Categories'}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
            {availableSubCats.map((sub) => {
              const subName = SUBCATEGORY_NAMES[sub] 
                ? (isRtl ? subName?.ar || sub : subName?.en || sub)
                : sub;
              return (
                <div
                  key={sub}
                  onClick={() => handleSelectSubCat(sub)}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e0',
                    backgroundColor: '#f8fafc',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.2s ease',
                    fontWeight: 'bold',
                    color: '#1f3a5f',
                    fontSize: '13px'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.backgroundColor = '#f0fdf4'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e0'; e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                >
                  <span style={{ fontSize: '20px' }}>🔸</span>
                  <span>{SUBCATEGORY_NAMES[sub] ? (isRtl ? SUBCATEGORY_NAMES[sub].ar : SUBCATEGORY_NAMES[sub].en) : sub}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4️⃣ عرض قطع الغيار المطابقة */}
      {currentStep === 'parts' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, color: '#1f3a5f', fontSize: '16px', fontWeight: 'bold' }}>
              🛒 {isRtl ? `القطع المتوافقة المتوفرة (${matchingParts.length}):` : `Compatible Parts (${matchingParts.length}):`}
            </h4>
            <button
              onClick={() => setCurrentStep(availableSubCats.length > 0 ? 'sub_cat' : 'main_cat')}
              style={{ background: 'none', border: '1px solid #cbd5e0', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              ↩️ {isRtl ? 'تغيير القسم' : 'Change Category'}
            </button>
          </div>

          {matchingParts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <p style={{ color: '#64748b', fontWeight: 'bold' }}>{isRtl ? 'عفواً، لا توجد قطع متوفرة لهذا القسم حالياً.' : 'No parts available for this section.'}</p>
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
