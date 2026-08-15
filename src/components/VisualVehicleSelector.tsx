import React, { useState } from 'react';
import { CAR_DATA, CAR_YEARS } from '../data/carData';

const SUPABASE_URL = "https://shszpcjmhkemqwborfwy.supabase.co/rest/v1";
const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoc3pwY2ptaGtlbXF3Ym9yZnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMDcxNzMsImV4cCI6MjA5OTY4MzE3M30.QycaUsYnhXX-uyeq3LVht_b1HVR0V0Tp72yMZUkdz2k";

// أيقونات وصور دلالية للأقسام الرئيسية
const CATEGORY_META: Record<string, { ar: string; icon: string; bg: string }> = {
  "Engine": { ar: "المحرك ومكوناته", icon: "⚙️", bg: "#eff6ff" },
  "Brake & Wheel Hub": { ar: "الفرامل والفحمات", icon: "🛑", bg: "#fef2f2" },
  "Cooling System": { ar: "التبريد والرديتر", icon: "❄️", bg: "#f0fdf4" },
  "Heat & Air Conditioning": { ar: "التكييف والكمبروسر", icon: "💨", bg: "#fffbeb" },
  "Suspension": { ar: "المساعدات والتعليق", icon: "🔩", bg: "#faf5ff" },
  "Drivetrain": { ar: "الدفع والمحاور (العكوس)", icon: "🔄", bg: "#fdf2f8" },
  "Electrical": { ar: "الكهرباء والدينمو", icon: "⚡", bg: "#fefce8" },
  "Transmission-Automatic": { ar: "القير الأوتوماتيك", icon: "🕹️", bg: "#f1f5f9" },
  "Transmission-Manual": { ar: "القير العادي", icon: "⚙️", bg: "#f1f5f9" },
  "Body & Lamp Assembly": { ar: "الهيكل والإضاءة", icon: "💡", bg: "#f8fafc" },
  "Fuel & Air": { ar: "الوقود والفلاتر", icon: "⛽", bg: "#f0fdfa" },
  "Ignition": { ar: "الاشتعال والبواجي", icon: "🔥", bg: "#fff7ed" },
  "Steering": { ar: "التوجيه (الدركسون)", icon: "🎯", bg: "#f5f3ff" },
  "Wheel": { ar: "الجنوط والكفرات", icon: "🛞", bg: "#f8fafc" },
  "Wiper & Washer": { ar: "المساحات والمضخات", icon: "🌧️", bg: "#eff6ff" }
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

  // البيانات المحملة ديناميكياً
  const [availableEngines, setAvailableEngines] = useState<string[]>([]);
  const [availableMainCats, setAvailableMainCats] = useState<string[]>([]);
  const [availableSubCats, setAvailableSubCats] = useState<string[]>([]);
  const [matchingParts, setMatchingParts] = useState<any[]>([]);

  // الخيارات المحددة في المسار البصري
  const [chosenEngine, setChosenEngine] = useState('');
  const [chosenMainCat, setChosenMainCat] = useState('');
  const [chosenSubCat, setChosenSubCat] = useState('');

  const [loading, setLoading] = useState(false);

  // 1️⃣ عند الضغط على زر "ابحث عن القطع" من صندوق محدد السيارة
  const handleStartSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMake || !selectedModel || !selectedYear) return;

    setLoading(true);
    try {
      const url = `${SUPABASE_URL}/parts?make=eq.${encodeURIComponent(selectedMake)}&model=eq.${encodeURIComponent(selectedModel)}&select=*`;
      const res = await fetch(url, { headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` } });
      const data = await res.json();

      // تصفية القطع بناءً على السنة
      const yearFiltered = (data || []).filter((p: any) => {
        const yStr = String(p.year || '').trim();
        if (yStr.includes('-')) {
          const [start, end] = yStr.split('-').map(Number);
          const target = Number(selectedYear);
          return target >= Math.min(start, end) && target <= Math.max(start, end);
        }
        return yStr === selectedYear;
      });

      // استخراج المحركات المتوفرة لهذه السيارة
      const enginesList = Array.from(new Set(yearFiltered.map((p: any) => p.engine && p.engine.trim() !== '' ? p.engine : (isRtl ? 'عام / كل المحركات' : 'General')))) as string[];
      setAvailableEngines(enginesList.length > 0 ? enginesList : [isRtl ? 'عام / كل المحركات' : 'General']);

      // ⚡ التحقق الذكي: إذا حدد المستخدم محركاً في القائمة المنسدلة، نتخطى مرحلة المحرك فوراً
      if (selectedEngine) {
        setChosenEngine(selectedEngine);
        loadMainCategories(yearFiltered, selectedEngine);
      } else if (enginesList.length === 1) {
        setChosenEngine(enginesList[0]);
        loadMainCategories(yearFiltered, enginesList[0]);
      } else {
        setCurrentStep('engine');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 2️⃣ استخراج وتجهيز الأقسام الرئيسية
  const loadMainCategories = (parts: any[], engine: string) => {
    const filtered = parts.filter((p: any) => {
      const pEng = p.engine && p.engine.trim() !== '' ? p.engine : (isRtl ? 'عام / كل المحركات' : 'General');
      return pEng === engine || pEng === (isRtl ? 'عام / كل المحركات' : 'General') || engine === (isRtl ? 'عام / كل المحركات' : 'General');
    });

    const mainCats = new Set<string>();
    filtered.forEach((p: any) => {
      const pCat = p.category || '';
      const main = pCat.includes('>') ? pCat.split('>')[0].trim() : pCat;
      if (main) mainCats.add(main);
    });

    setAvailableMainCats(Array.from(mainCats));
    setCurrentStep('main_cat');
  };

  // 3️⃣ عند اختيار المحرك بصرياً
  const handleSelectEngine = async (eng: string) => {
    setChosenEngine(eng);
    setLoading(true);
    try {
      const url = `${SUPABASE_URL}/parts?make=eq.${encodeURIComponent(selectedMake)}&model=eq.${encodeURIComponent(selectedModel)}&select=*`;
      const res = await fetch(url, { headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` } });
      const data = await res.json();
      loadMainCategories(data || [], eng);
    } catch (err) {} finally {
      setLoading(false);
    }
  };

  // 4️⃣ عند اختيار القسم الرئيسي بصرياً
  const handleSelectMainCat = async (cat: string) => {
    setChosenMainCat(cat);
    setLoading(true);
    try {
      const url = `${SUPABASE_URL}/parts?make=eq.${encodeURIComponent(selectedMake)}&model=eq.${encodeURIComponent(selectedModel)}&select=*`;
      const res = await fetch(url, { headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` } });
      const data = await res.json();

      const subCats = new Set<string>();
      (data || []).forEach((p: any) => {
        const pCat = p.category || '';
        const main = pCat.includes('>') ? pCat.split('>')[0].trim() : pCat;
        const sub = pCat.includes('>') ? pCat.split('>')[1].trim() : (isRtl ? 'قطع عامة' : 'General Parts');
        if (main === cat) subCats.add(sub);
      });

      setAvailableSubCats(Array.from(subCats));
      setCurrentStep('sub_cat');
    } catch (err) {} finally {
      setLoading(false);
    }
  };

  // 5️⃣ عند اختيار القسم الفرعي بصرياً وعرض القطع
  const handleSelectSubCat = async (subCat: string) => {
    setChosenSubCat(subCat);
    setLoading(true);
    try {
      const url = `${SUPABASE_URL}/parts?make=eq.${encodeURIComponent(selectedMake)}&model=eq.${encodeURIComponent(selectedModel)}&select=*`;
      const res = await fetch(url, { headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` } });
      const data = await res.json();

      const finalParts = (data || []).filter((p: any) => {
        const yStr = String(p.year || '').trim();
        let matchYear = yStr === selectedYear;
        if (yStr.includes('-')) {
          const [start, end] = yStr.split('-').map(Number);
          const target = Number(selectedYear);
          matchYear = target >= Math.min(start, end) && target <= Math.max(start, end);
        }

        const pEng = p.engine && p.engine.trim() !== '' ? p.engine : (isRtl ? 'عام / كل المحركات' : 'General');
        const matchEngine = pEng === chosenEngine || pEng === (isRtl ? 'عام / كل المحركات' : 'General') || chosenEngine === (isRtl ? 'عام / كل المحركات' : 'General');

        const pCat = p.category || '';
        const main = pCat.includes('>') ? pCat.split('>')[0].trim() : pCat;
        const sub = pCat.includes('>') ? pCat.split('>')[1].trim() : (isRtl ? 'قطع عامة' : 'General Parts');

        return matchYear && matchEngine && main === chosenMainCat && sub === subCat;
      });

      setMatchingParts(finalParts);
      setCurrentStep('parts');
    } catch (err) {} finally {
      setLoading(false);
    }
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
          {chosenMainCat && <span style={{ color: '#64748b' }}> › 🗂️ {CATEGORY_META[chosenMainCat]?.ar || chosenMainCat}</span>}
          {chosenSubCat && <span style={{ color: '#e0872a', fontWeight: 'bold' }}> › 📂 {chosenSubCat}</span>}
          
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
            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '30px 0' }}>
              {isRtl ? 'لا توجد قطع معروضة حالياً لهذه الفئة.' : 'No parts available for this vehicle.'}
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
              {availableMainCats.map((cat) => {
                const meta = CATEGORY_META[cat] || { ar: cat, icon: '📦', bg: '#f8fafc' };
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
                    <strong style={{ fontSize: '14px', color: '#1f3a5f', display: 'block' }}>{isRtl ? meta.ar : cat}</strong>
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
              📂 {isRtl ? `القطع والأقسام الفرعية في (${CATEGORY_META[chosenMainCat]?.ar || chosenMainCat}):` : `Subcategories in (${chosenMainCat}):`}
            </h4>
            <button
              onClick={() => setCurrentStep('main_cat')}
              style={{ background: 'none', border: '1px solid #cbd5e0', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              ↩️ {isRtl ? 'رجوع للأقسام الرئيسية' : 'Back to Categories'}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {availableSubCats.map((sub) => (
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
                <span>{sub}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4️⃣ عرض قطع الغيار المطابقة */}
      {currentStep === 'parts' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, color: '#1f3a5f', fontSize: '16px', fontWeight: 'bold' }}>
              🛒 {isRtl ? `القطع المتوفرة (${matchingParts.length}):` : `Available Parts (${matchingParts.length}):`}
            </h4>
            <button
              onClick={() => setCurrentStep('sub_cat')}
              style={{ background: 'none', border: '1px solid #cbd5e0', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              ↩️ {isRtl ? 'تغيير القسم الفرعي' : 'Change Subcategory'}
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
