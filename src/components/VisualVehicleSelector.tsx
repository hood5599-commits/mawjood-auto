import React, { useState } from 'react';
import { CAR_DATA, CAR_YEARS } from '../data/carData';

// 🌐 تم تصحيح الصور: الآن تعرض قطع غيار حقيقية بدلاً من سيارات كاملة!
// ✨ تم ربط كل قسم بالـ Animation الفيزيائي المخصص له
const CATEGORY_META: Record<string, { ar: string; img: string; bg: string; animClass: string }> = {
  "Engine": { 
    ar: "المحرك ومكوناته", 
    img: "https://images.unsplash.com/photo-1588610515668-80f089da01eb?auto=format&fit=crop&w=300&q=80", // صورة محرك
    bg: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
    animClass: "mw-anim-engine" 
  },
  "Brake & Wheel Hub": { 
    ar: "الفرامل والفحمات", 
    img: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=300&q=80", // صورة هوب وفرامل
    bg: "linear-gradient(135deg, #991b1b 0%, #ef4444 100%)",
    animClass: "mw-anim-brake" 
  },
  "Cooling System": { 
    ar: "التبريد والرديتر", 
    img: "https://images.unsplash.com/photo-1621255462529-5ee42844390b?auto=format&fit=crop&w=300&q=80", // صورة رديتر/مروحة
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
    img: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=300&q=80", // صورة مساعدات/يايات
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
    img: "https://images.unsplash.com/photo-1605342111100-36e3fc95bd8a?auto=format&fit=crop&w=300&q=80", // صورة تروس قير
    bg: "linear-gradient(135deg, #334155 0%, #64748b 100%)",
    animClass: "mw-anim-pulse" 
  },
  "Transmission-Manual": { 
    ar: "القير العادي", 
    img: "https://images.unsplash.com/photo-1605342111100-36e3fc95bd8a?auto=format&fit=crop&w=300&q=80", 
    bg: "linear-gradient(135deg, #334155 0%, #64748b 100%)",
    animClass: "mw-anim-pulse"
  },
  "Body & Lamp Assembly": { 
    ar: "الهيكل والإضاءة", 
    img: "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=300&q=80", // كشاف سيارة
    bg: "linear-gradient(135deg, #0f172a 0%, #475569 100%)",
    animClass: "mw-anim-lights" 
  },
  "Fuel & Air": { 
    ar: "الوقود والفلاتر", 
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
    img: "https://images.unsplash.com/photo-1600705722908-bab1e61c0b4d?auto=format&fit=crop&w=300&q=80", // صورة دركسون حقيقية
    bg: "linear-gradient(135deg, #312e81 0%, #6366f1 100%)",
    animClass: "mw-anim-steer" // أنيميشن خاص بالدركسون
  },
  "Wheel": { 
    ar: "الجنوط والكفرات", 
    img: "https://images.unsplash.com/photo-1596541620023-e129188a834d?auto=format&fit=crop&w=300&q=80", 
    bg: "linear-gradient(135deg, #18181b 0%, #3f3f46 100%)",
    animClass: "mw-anim-spin"
  },
  "Wiper & Washer": { 
    ar: "المساحات والمضخات", 
    img: "https://images.unsplash.com/photo-1527786455041-d218f0804473?auto=format&fit=crop&w=300&q=80", 
    bg: "linear-gradient(135deg, #0c4a6e 0%, #38bdf8 100%)",
    animClass: "mw-anim-wiper" 
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
  const [triggeredCat, setTriggeredCat] = useState<string | null>(null);

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

  const handleMainCatCardClick = (cat: string) => {
    setTriggeredCat(cat);
    window.setTimeout(() => {
      setTriggeredCat(null);
      handleSelectMainCat(cat);
    }, 550);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', direction: isRtl ? 'rtl' : 'ltr', fontFamily: 'Cairo, sans-serif' }}>
      
      {/* ⚙️ CSS المخصص للمحاكاة الميكانيكية للقطع */}
      <style>{`
        @keyframes mwEngineRattle {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          20% { transform: translate(-1.5px, 1.5px) rotate(-1deg); }
          40% { transform: translate(1.5px, -1.5px) rotate(1deg); }
          60% { transform: translate(-1px, -1px) rotate(0deg); }
          80% { transform: translate(1px, 1.5px) rotate(1deg); }
        }
        @keyframes mwSuspensionCompress {
          0%, 100% { transform: scaleY(1) translateY(0); }
          30% { transform: scaleY(0.85) translateY(5px); }
          55% { transform: scaleY(1.05) translateY(-3px); }
          75% { transform: scaleY(0.95) translateY(1px); }
        }
        @keyframes mwBrakeClampBurst {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(239,68,68,0)); }
          35% { transform: scale(0.96); filter: drop-shadow(0 0 15px rgba(239,68,68,0.8)); }
          60% { transform: scale(1.02); }
        }
        @keyframes mwCoolFlow {
          0%, 100% { filter: hue-rotate(0deg); }
          50% { filter: hue-rotate(45deg) brightness(1.2); }
        }
        @keyframes mwSparkArc {
          0%, 100% { opacity: 1; filter: brightness(1) drop-shadow(0 0 0 rgba(250,204,21,0)); }
          25%, 75% { opacity: 0.6; filter: brightness(1.5) drop-shadow(0 0 12px #facc15); transform: scale(1.03); }
        }
        @keyframes mwSpinBurst {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes mwSprayBurst {
          0%, 100% { box-shadow: inset 0 0 0 0 rgba(32,178,170,0); }
          50% { box-shadow: inset 0 0 40px 10px rgba(32,178,170,0.6); transform: scale(1.02); }
        }
        @keyframes mwSteerTurn {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(45deg); }
          75% { transform: rotate(-45deg); }
        }
        @keyframes mwWiperSweep {
          0%, 100% { transform: rotate(-15deg); }
          50% { transform: rotate(15deg); }
        }

        /* ربط الـ Classes بالتأثيرات */
        .mw-anim-engine:hover img { animation: mwEngineRattle 0.2s infinite ease-in-out; }
        .mw-anim-engine.mw-is-active img { animation: mwEngineRattle 0.1s infinite; filter: brightness(1.2); }

        .mw-anim-suspension:hover img { animation: mwSuspensionCompress 0.8s infinite; }
        .mw-anim-suspension.mw-is-active img { animation: mwSuspensionCompress 0.4s ease-out; }

        .mw-anim-brake:hover img { animation: mwBrakeClampBurst 1s infinite; }
        .mw-anim-brake.mw-is-active img { animation: mwBrakeClampBurst 0.4s ease-out; }

        .mw-anim-cool:hover img { animation: mwCoolFlow 1.5s infinite; }
        
        .mw-anim-spark:hover img { animation: mwSparkArc 0.6s infinite steps(2); }
        .mw-anim-spark.mw-is-active img { animation: mwSparkArc 0.2s infinite steps(2); }

        .mw-anim-spin:hover img { animation: mwSpinBurst 2s infinite linear; }
        .mw-anim-spin.mw-is-active img { animation: mwSpinBurst 0.6s ease-out; }

        .mw-anim-spray:hover img { animation: mwSprayBurst 1s infinite; }
        
        .mw-anim-steer:hover img { animation: mwSteerTurn 1.5s infinite ease-in-out; }
        .mw-anim-steer.mw-is-active img { animation: mwSteerTurn 0.5s ease-out; }

        .mw-anim-wiper:hover img { animation: mwWiperSweep 1s infinite ease-in-out; transform-origin: bottom center; }
        .mw-anim-wiper.mw-is-active img { animation: mwWiperSweep 0.4s ease-out; transform-origin: bottom center; }
      `}</style>

      {/* 🚘 صندوق محدد السيارة (يطابق تصميم موقعك) */}
      <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <form onSubmit={handleStartSearch} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#1f3a5f' }}>
              {isRtl ? '1. الماركة *' : '1. Make *'}
            </label>
            <select
              value={selectedMake}
              onChange={(e) => { setSelectedMake(e.target.value); setSelectedModel(''); }}
              required
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: '#f9fafb', outline: 'none' }}
            >
              <option value="">{isRtl ? '-- اختر الماركة --' : '-- Select Make --'}</option>
              {Object.keys(CAR_DATA).map(m => (
                <option key={m} value={m}>{m} ({CAR_DATA[m].en})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#1f3a5f' }}>
              {isRtl ? '2. الموديل *' : '2. Model *'}
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              required
              disabled={!selectedMake}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: '#f9fafb', outline: 'none' }}
            >
              <option value="">{isRtl ? '-- اختر الموديل --' : '-- Select Model --'}</option>
              {selectedMake && CAR_DATA[selectedMake]?.models?.map((mod: string) => (
                <option key={mod} value={mod}>{mod}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#1f3a5f' }}>
              {isRtl ? '3. سنة الصنع *' : '3. Year *'}
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              required
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: '#f9fafb', outline: 'none' }}
            >
              <option value="">{isRtl ? '-- اختر السنة --' : '-- Select Year --'}</option>
              {CAR_YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#1f3a5f' }}>
              {isRtl ? '4. المحرك (اختياري)' : '4. Engine (Optional)'}
            </label>
            <select
              value={selectedEngine}
              onChange={(e) => setSelectedEngine(e.target.value)}
              disabled={!selectedMake}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: '#f9fafb', outline: 'none' }}
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
              padding: '12px 24px',
              backgroundColor: '#e0872a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              height: '45px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d07a22'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e0872a'}
          >
            🔍 {loading ? (isRtl ? 'جاري الفحص...' : 'Checking...') : (isRtl ? 'استعراض الأقسام' : 'Explore Parts')}
          </button>
        </form>
      </div>

      {/* 🌟 بانر السيارة المختارة (مثل تصميم موقعك باللون الكحلي) */}
      {currentStep !== 'idle' && (
        <div style={{ backgroundColor: '#2b3f5c', borderRadius: '12px', padding: '24px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          
          <button
            onClick={() => setCurrentStep('idle')}
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
          >
            ⚙️ {isRtl ? 'تغيير السيارة' : 'Change Vehicle'}
          </button>

          <div style={{ textAlign: isRtl ? 'left' : 'right' }}>
             <span style={{ fontSize: '12px', color: '#93c5fd' }}>{isRtl ? 'السيارة المختارة حالياً' : 'Current Vehicle'}</span>
             <h2 style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: 'bold' }}>{selectedMake} {selectedModel} ({selectedYear})</h2>
             {chosenEngine && <span style={{ fontSize: '13px', color: '#fb923c' }}>⚡ {chosenEngine}</span>}
          </div>
        </div>
      )}

      {/* 🧭 مسار التنقل (Breadcrumbs) */}
      {currentStep !== 'idle' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px', flexWrap: 'wrap', color: '#4b5563', fontWeight: 'bold' }}>
          <span>🚘 {selectedMake}</span>
          {chosenEngine && <span> {isRtl ? '«' : '»'} ⚡ {chosenEngine}</span>}
          {chosenMainCat && <span> {isRtl ? '«' : '»'} 🗂️ {CATEGORY_META[chosenMainCat]?.ar || chosenMainCat}</span>}
          {chosenSubCat && <span style={{ color: '#e0872a' }}> {isRtl ? '«' : '»'} 📂 {chosenSubCat}</span>}
        </div>
      )}

      {/* 1️⃣ المحركات */}
      {currentStep === 'engine' && (
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#1f3a5f', fontSize: '16px', fontWeight: 'bold' }}>
             {isRtl ? 'اختر نوع المحرك لسيارتك:' : 'Select Your Vehicle Engine:'}
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
            {availableEngines.map((eng, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectEngine(eng)}
                style={{ padding: '20px', borderRadius: '8px', border: '1.5px solid #e5e7eb', backgroundColor: '#f9fafb', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 'bold', color: '#1f3a5f' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#e0872a'; e.currentTarget.style.backgroundColor = '#fff7ed'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.backgroundColor = '#f9fafb'; }}
              >
                <div>{eng}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2️⃣ الأقسام الرئيسية (مع الأنيميشن والصور الجديدة) */}
      {currentStep === 'main_cat' && (
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#1f3a5f', fontSize: '16px', fontWeight: 'bold' }}>
             {isRtl ? '🗂️ اختر القسم الرئيسي لقطعة الغيار:' : '🗂️ Select Main Category:'}
          </h4>
          {availableMainCats.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', padding: '30px 0' }}>{isRtl ? 'لا توجد قطع معروضة حالياً.' : 'No parts available.'}</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              {availableMainCats.map((cat) => {
                const meta = CATEGORY_META[cat] || { ar: cat, img: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=300&q=80', bg: '#1f3a5f', animClass: '' };
                const isActive = triggeredCat === cat;
                return (
                  <div
                    key={cat}
                    onClick={() => handleMainCatCardClick(cat)}
                    className={`${meta.animClass}${isActive ? ' mw-is-active' : ''}`}
                    style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      position: 'relative',
                      height: '160px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#1f2937'
                    }}
                  >
                    <img 
                      src={meta.img} 
                      alt={cat} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8, transition: 'transform 0.3s' }} 
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1596541620023-e129188a834d?auto=format&fit=crop&w=300&q=80'; }}
                    />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0) 100%)', padding: '16px', textAlign: 'center' }}>
                      <strong style={{ fontSize: '15px', color: '#ffffff', fontWeight: 'bold', display: 'block' }}>{isRtl ? meta.ar : cat}</strong>
                      <span style={{ fontSize: '11px', color: '#93c5fd', marginTop: '4px', display: 'block' }}>{cat}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3️⃣ الأقسام الفرعية (تم إكمال الكود هنا) */}
      {currentStep === 'sub_cat' && (
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#1f3a5f', fontSize: '16px', fontWeight: 'bold' }}>
             {isRtl ? '📂 اختر القسم الفرعي:' : '📂 Select Sub-Category:'}
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {availableSubCats.map((sub, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSubCat(sub)}
                style={{ padding: '14px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', color: '#1f3a5f', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e0872a'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#e0872a'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; e.currentTarget.style.color = '#1f3a5f'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4️⃣ عرض قطع الغيار (تم إكمال الكود هنا ليتوافق مع component الخاص بك) */}
      {currentStep === 'parts' && (
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#1f3a5f', fontSize: '16px', fontWeight: 'bold' }}>
             {isRtl ? '⚙️ القطع المتوافقة مع سيارتك:' : '⚙️ Compatible Parts:'}
          </h4>
          {matchingParts.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#ef4444', fontWeight: 'bold', padding: '20px' }}>
              {isRtl ? 'عذراً، لا توجد قطع متوفرة حالياً لهذا القسم.' : 'Sorry, no parts available for this section.'}
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
              {matchingParts.map((part, idx) => (
                <div key={idx}>
                   {renderPartCard(part)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
