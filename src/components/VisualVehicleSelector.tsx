import React, { useState } from 'react';
import { CAR_DATA, CAR_YEARS } from '../data/carData';

// 🌐 روابط صور وصقور واقعية ومفرغة عالية الدقة للأقسام الرئيسية
const CATEGORY_META: Record<string, { ar: string; img: string; bg: string; animClass: string }> = {
  "Engine": { 
    ar: "المحرك ومكوناته", 
    img: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=300&q=80", 
    bg: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
    animClass: "mw-anim-engine"
  },
  "Brake & Wheel Hub": { 
    ar: "الفرامل والفحمات", 
    img: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=300&q=80", 
    bg: "linear-gradient(135deg, #991b1b 0%, #ef4444 100%)",
    animClass: "mw-anim-brake"
  },
  "Cooling System": { 
    ar: "التبريد والرديتر", 
    img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=300&q=80", 
    bg: "linear-gradient(135deg, #065f46 0%, #10b981 100%)",
    animClass: "mw-anim-cool"
  },
  "Heat & Air Conditioning": { 
    ar: "التكييف والكمبروسر", 
    img: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=300&q=80", 
    bg: "linear-gradient(135deg, #78350f 0%, #f59e0b 100%)",
    animClass: "mw-anim-ac"
  },
  "Suspension": { 
    ar: "المساعدات والتعليق", 
    img: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=300&q=80", 
    bg: "linear-gradient(135deg, #581c87 0%, #a855f7 100%)",
    animClass: "mw-anim-suspension"
  },
  "Drivetrain": { 
    ar: "الدفع والمحاور (العكوس)", 
    img: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=300&q=80", 
    bg: "linear-gradient(135deg, #831843 0%, #ec4899 100%)",
    animClass: "mw-anim-spin"
  },
  "Electrical": { 
    ar: "الكهرباء والدينمو", 
    img: "https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=300&q=80", 
    bg: "linear-gradient(135deg, #ca8a04 0%, #facc15 100%)",
    animClass: "mw-anim-spark"
  },
  "Transmission-Automatic": { 
    ar: "القير الأوتوماتيك", 
    img: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=300&q=80", 
    bg: "linear-gradient(135deg, #334155 0%, #64748b 100%)",
    animClass: "mw-anim-pulse"
  },
  "Transmission-Manual": { 
    ar: "القير العادي", 
    img: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=300&q=80", 
    bg: "linear-gradient(135deg, #334155 0%, #64748b 100%)",
    animClass: "mw-anim-pulse"
  },
  "Body & Lamp Assembly": { 
    ar: "الهيكل والإضاءة", 
    img: "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=300&q=80", 
    bg: "linear-gradient(135deg, #0f172a 0%, #475569 100%)",
    animClass: "mw-anim-pulse"
  },
  "Fuel & Air": { 
    ar: "الوقود والفلاتر (البخاخات)", 
    img: "https://images.unsplash.com/photo-1526726538690-5cbf956ae2fd?auto=format&fit=crop&w=300&q=80", 
    bg: "linear-gradient(135deg, #134e4e 0%, #20b2aa 100%)",
    animClass: "mw-anim-spray"
  },
  "Ignition": { 
    ar: "الاشتعال والبواجي", 
    img: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=300&q=80", 
    bg: "linear-gradient(135deg, #c2410c 0%, #fb923c 100%)",
    animClass: "mw-anim-spark"
  },
  "Steering": { 
    ar: "التوجيه (الدركسون)", 
    img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=300&q=80", 
    bg: "linear-gradient(135deg, #312e81 0%, #6366f1 100%)",
    animClass: "mw-anim-pulse"
  },
  "Wheel": { 
    ar: "الجنوط والكفرات", 
    img: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=300&q=80", 
    bg: "linear-gradient(135deg, #18181b 0%, #3f3f46 100%)",
    animClass: "mw-anim-spin"
  },
  "Wiper & Washer": { 
    ar: "المساحات والمضخات", 
    img: "https://images.unsplash.com/photo-1527786455041-d218f0804473?auto=format&fit=crop&w=300&q=80", 
    bg: "linear-gradient(135deg, #0c4a6e 0%, #38bdf8 100%)",
    animClass: "mw-anim-cool"
  }
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

  const [availableEngines, setAvailableEngines] = useState<string[]>([]);
  const [availableMainCats, setAvailableMainCats] = useState<string[]>([]);
  const [availableSubCats, setAvailableSubCats] = useState<string[]>([]);
  const [matchingParts, setMatchingParts] = useState<any[]>([]);

  const [chosenEngine, setChosenEngine] = useState('');
  const [chosenMainCat, setChosenMainCat] = useState('');
  const [chosenSubCat, setChosenSubCat] = useState('');

  const [loading, setLoading] = useState(false);

  const SUPABASE_URL = "https://shszpcjmhkemqwborfwy.supabase.co/rest/v1";
  const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoc3pwY2ptaGtlbXF3Ym9yZnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMDcxNzMsImV4cCI6MjA5OTY4MzE3M30.QycaUsYnhXX-uyeq3LVht_b1HVR0V0Tp72yMZUkdz2k";

  const handleStartSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMake || !selectedModel || !selectedYear) return;

    setLoading(true);
    try {
      const url = `${SUPABASE_URL}/parts?make=eq.${encodeURIComponent(selectedMake)}&model=eq.${encodeURIComponent(selectedModel)}&select=*`;
      const res = await fetch(url, { headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` } });
      const data = await res.json();

      const yearFiltered = (data || []).filter((p: any) => {
        const yStr = String(p.year || '').trim();
        if (yStr.includes('-')) {
          const [start, end] = yStr.split('-').map(Number);
          const target = Number(selectedYear);
          return target >= Math.min(start, end) && target <= Math.max(start, end);
        }
        return yStr === selectedYear;
      });

      const enginesList = Array.from(new Set(yearFiltered.map((p: any) => p.engine && p.engine.trim() !== '' ? p.engine : (isRtl ? 'عام / كل المحركات' : 'General')))) as string[];
      setAvailableEngines(enginesList.length > 0 ? enginesList : [isRtl ? 'عام / كل المحركات' : 'General']);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', direction: isRtl ? 'rtl' : 'ltr', fontFamily: 'Cairo, sans-serif' }}>
      
      <style>{`
        @keyframes mwEngineRattle {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          20% { transform: translate(-2px, 2px) rotate(-1deg); }
          40% { transform: translate(2px, -2px) rotate(1deg); }
          60% { transform: translate(-1px, -1px) rotate(0deg); }
          80% { transform: translate(1px, 2px) rotate(1deg); }
        }
        @keyframes mwSuspensionBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes mwBrakeClamp {
          0%, 100% { filter: drop-shadow(0 0 0px rgba(239,68,68,0)); }
          50% { filter: drop-shadow(0 0 14px rgba(239,68,68,0.8)); transform: scale(1.02); }
        }
        @keyframes mwCoolFlow {
          0% { filter: hue-rotate(0deg); }
          50% { filter: hue-rotate(90deg) brightness(1.2); }
          100% { filter: hue-rotate(0deg); }
        }
        @keyframes mwSparkFlash {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); filter: brightness(1.3); }
        }
        @keyframes mwSpinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .mw-anim-engine:hover { animation: mwEngineRattle 0.3s infinite ease-in-out; }
        .mw-anim-suspension:hover { animation: mwSuspensionBounce 0.4s infinite ease-in-out; }
        .mw-anim-brake:hover { animation: mwBrakeClamp 0.6s infinite ease-in-out; }
        .mw-anim-cool:hover { animation: mwCoolFlow 1.2s infinite ease-in-out; }
        .mw-anim-spark:hover { animation: mwSparkFlash 0.5s infinite ease-in-out; }
        .mw-anim-spin:hover img { animation: mwSpinSlow 2s infinite linear; }
      `}</style>

      {/* 🚘 صندوق محدد السيارة */}
      <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '20px', border: '2px solid #1f3a5f', boxShadow: '0 10px 30px rgba(31,58,95,0.08)' }}>
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

      {/* 🌟 ديكور بانر عرض السيارة المختارة */}
      {currentStep !== 'idle' && (
        <div style={{ background: 'linear-gradient(135deg, #1f3a5f 0%, #2b4c7e 100%)', borderRadius: '18px', padding: '20px 24px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 25px rgba(31,58,95,0.2)', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
              🏎️
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#93c5fd', fontWeight: 'bold', textTransform: 'uppercase' }}>{isRtl ? 'السيارة المختارة حالياً' : 'Active Vehicle'}</span>
              <h2 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: '900' }}>{selectedMake} {selectedModel} ({selectedYear})</h2>
              {chosenEngine && <span style={{ fontSize: '13px', color: '#cbd5e1' }}>⚡ {chosenEngine}</span>}
            </div>
          </div>
          
          <button
            onClick={() => setCurrentStep('idle')}
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '12.5px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            🔄 {isRtl ? 'تغيير السيارة' : 'Change Vehicle'}
          </button>
        </div>
      )}

      {/* 🧭 مسار التنقل البصري (Breadcrumbs) */}
      {currentStep !== 'idle' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12.5px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 'bold', color: '#1f3a5f' }}>🚘 {selectedMake}</span>
          {chosenEngine && <span style={{ color: '#64748b' }}> › ⚡ {chosenEngine}</span>}
          {chosenMainCat && <span style={{ color: '#64748b' }}> › 🗂️ {CATEGORY_META[chosenMainCat]?.ar || chosenMainCat}</span>}
          {chosenSubCat && <span style={{ color: '#e0872a', fontWeight: 'bold' }}> › 📂 {chosenSubCat}</span>}
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

      {/* 2️⃣ شبكة بطاقات الأقسام الرئيسية مع الصور والأنيميشن الحركي */}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '16px' }}>
              {availableMainCats.map((cat) => {
                const meta = CATEGORY_META[cat] || { ar: cat, img: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=300&q=80', bg: '#1f3a5f', animClass: 'mw-anim-pulse' };
                return (
                  <div
                    key={cat}
                    onClick={() => handleSelectMainCat(cat)}
                    className={meta.animClass}
                    style={{
                      borderRadius: '16px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      position: 'relative',
                      height: '150px',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                      transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 12px 25px rgba(0,0,0,0.15)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)'; }}
                  >
                    <img 
                      src={meta.img} 
                      alt={cat} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.6)', transition: 'transform 0.4s ease' }} 
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=300&q=80'; }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.9) 0%, rgba(15,23,42,0.2) 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '14px' }}>
                      <strong style={{ fontSize: '14.5px', color: '#ffffff', fontWeight: 'bold' }}>{isRtl ? meta.ar : cat}</strong>
                      <span style={{ fontSize: '11px', color: '#93c5fd', marginTop: '2px' }}>{cat}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3️⃣ شبكة بطاقات الأقسام الفرعية مع الصور */}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
            {availableSubCats.map((sub) => (
              <div
                key={sub}
                onClick={() => handleSelectSubCat(sub)}
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  border: '1.5px solid #cbd5e0',
                  backgroundColor: '#f8fafc',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.backgroundColor = '#f0fdf4'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e0'; e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <img 
                  src={CATEGORY_META[chosenMainCat]?.img || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=100&q=80'} 
                  alt={sub} 
                  style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #cbd5e0' }} 
                />
                <span style={{ fontWeight: 'bold', color: '#1f3a5f', fontSize: '13px' }}>{sub}</span>
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
