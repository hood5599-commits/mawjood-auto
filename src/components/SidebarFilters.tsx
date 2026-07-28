import React, { useState } from 'react';
import { getPartCategory, matchesSmartSearch } from '../utils/categoryHelper';

const SUPABASE_URL = "https://shszpcjmhkemqwborfwy.supabase.co/rest/v1";
const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoc3pwY2ptaGtlbXF3Ym9yZnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMDcxNzMsImV4cCI6MjA5OTY4MzE3M30.QycaUsYnhXX-uyeq3LVht_b1HVR0V0Tp72yMZUkdz2k";

interface SidebarProps {
  lang: 'ar' | 'en';
  carData: any;
  years: string[];
  translateMake: Record<string, string>;
  translateModel: Record<string, string>;
  categories: string[];
  expandedCategories: string[];
  toggleCategory: (category: string) => void;
  inventory: any[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterMake: string;
  setFilterMake: (make: string) => void;
  filterModel: string;
  setFilterModel: (model: string) => void;
  filterYear: string;
  setFilterYear: (year: string) => void;
  filterCategory: string;
  setFilterCategory: (cat: string) => void;
  filterEngine?: string;
  setFilterEngine?: (engine: string) => void;
  addToCart?: (item: any, quantity: number) => void;
}

const CATEGORY_TRANSLATION: Record<string, string> = {
  "Belt Drive": "السيور والبكرات",
  "Body & Lamp Assembly": "الهيكل والإضاءة",
  "Brake & Wheel Hub": "الفرامل ومحاور العجلات",
  "Cooling System": "نظام التبريد (الراديتر)",
  "Drivetrain": "نظام الدفع",
  "Electrical": "الكهرباء",
  "Engine": "المحرك (الماكينة)",
  "Exhaust & Emission": "نظام العادم (الشكمان)",
  "Fuel & Air": "نظام الوقود والهواء",
  "Heat & Air Conditioning": "التكييف والتدفئة",
  "Ignition": "نظام الإشعال (البواجي)",
  "Interior": "المقصورة الداخلية",
  "Steering": "نظام التوجيه",
  "Suspension": "نظام التعليق",
  "Transmission-Automatic": "ناقل الحركة",
  "Wheel": "العجلات والجنوط",
  "Wiper & Washer": "المساحات وبخاخات المياه"
};

const MAKE_DOMAINS: Record<string, string> = {
  "تويوتا": "toyota.com", "هيونداي": "hyundai.com", "نيسان": "nissan-global.com",
  "فورد": "ford.com", "شفروليه": "chevrolet.com", "كيا": "kia.com",
  "هوندا": "honda.com", "لكزس": "lexus.com", "ميتسوبيشي": "mitsubishicars.com",
  "مازدا": "mazda.com", "جي إم سي": "gmc.com", "بي إم دبليو": "bmw.com",
  "مرسيدس": "mercedes-benz.com", "فولكس فاجن": "vw.com", "أودي": "audi.com",
  "جيب": "jeep.com", "دودج": "dodge.com", "رام": "ramtrucks.com",
  "لاند روفر": "landrover.com", "إنفينيتي": "infinitiusa.com", "سوبارو": "subaru.com",
  "رينو": "renault.com", "سوزوكي": "globalsuzuki.com", "بورش": "porsche.com",
  "كرايسلر": "chrysler.com"
};

export const SidebarFilters: React.FC<SidebarProps> = (props) => {
  const { 
    lang, carData, years, translateMake, translateModel, categories, inventory, 
    searchTerm, setSearchTerm, addToCart 
  } = props;

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [nodeDataCache, setNodeDataCache] = useState<Record<string, any>>({});
  const [loadingNodes, setLoadingNodes] = useState<Record<string, boolean>>({});
  
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const [partQuantities, setPartQuantities] = useState<Record<number, number>>({});
  const [fitmentModalPart, setFitmentModalPart] = useState<any | null>(null);

  const [activeSearchQuery, setActiveSearchQuery] = useState<string>('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [custPhone, setCustPhone] = useState('');
  const [custNotes, setCustNotes] = useState('');
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);
  const [reqSubmitted, setReqSubmitted] = useState(false);

  const isRtl = lang === 'ar';

  const getQty = (id: number) => partQuantities[id] || 1;

  const changeQty = (part: any, delta: number) => {
    const maxStock = typeof part.stock !== 'undefined' && part.stock !== null ? Number(part.stock) : 5;
    const current = getQty(part.id);
    const newQty = Math.max(1, Math.min(maxStock, current + delta));
    setPartQuantities(prev => ({ ...prev, [part.id]: newQty }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearchQuery(searchTerm.trim());
  };

  const clearSearch = () => {
    setSearchTerm('');
    setActiveSearchQuery('');
  };

  // 1️⃣ جلب الموديلات المتوفر بها قطع فقط لسنة معينة
  const fetchModelsForYear = async (make: string, year: string) => {
    const cacheKey = `models_${make}_${year}`;
    if (nodeDataCache[cacheKey]) return nodeDataCache[cacheKey];

    setLoadingNodes(prev => ({ ...prev, [cacheKey]: true }));
    try {
      const url = `${SUPABASE_URL}/parts?make=eq.${encodeURIComponent(make)}&year=eq.${encodeURIComponent(year)}&select=model`;
      const res = await fetch(url, { headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` } });
      if (res.ok) {
        const data = await res.json();
        const availableModels = Array.from(new Set(data.map((item: any) => item.model).filter(Boolean))) as string[];
        setNodeDataCache(prev => ({ ...prev, [cacheKey]: availableModels }));
        return availableModels;
      }
    } catch (e) {
    } finally {
      setLoadingNodes(prev => ({ ...prev, [cacheKey]: false }));
    }
    return [];
  };

  // 2️⃣ جلب المحركات المتوفر لها قطع فقط
  const fetchEnginesForVehicle = async (make: string, year: string, model: string) => {
    const cacheKey = `engines_${make}_${year}_${model}`;
    if (nodeDataCache[cacheKey]) return nodeDataCache[cacheKey];

    setLoadingNodes(prev => ({ ...prev, [cacheKey]: true }));
    try {
      const url = `${SUPABASE_URL}/parts?make=eq.${encodeURIComponent(make)}&year=eq.${encodeURIComponent(year)}&model=eq.${encodeURIComponent(model)}&select=engine`;
      const res = await fetch(url, { headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` } });
      if (res.ok) {
        const data = await res.json();
        const uniqueEngines = Array.from(new Set(data.map((item: any) => item.engine && item.engine.trim() !== '' ? item.engine : 'عام'))) as string[];
        setNodeDataCache(prev => ({ ...prev, [cacheKey]: uniqueEngines }));
        return uniqueEngines;
      }
    } catch (e) {
    } finally {
      setLoadingNodes(prev => ({ ...prev, [cacheKey]: false }));
    }
    return ['عام'];
  };

  // 3️⃣ جلب الأقسام التي تحتوي على قطع غيار فعلياً فقط
  const fetchCategoriesForEngine = async (make: string, year: string, model: string, engine: string) => {
    const cacheKey = `categories_${make}_${year}_${model}_${engine}`;
    if (nodeDataCache[cacheKey]) return nodeDataCache[cacheKey];

    setLoadingNodes(prev => ({ ...prev, [cacheKey]: true }));
    try {
      const url = `${SUPABASE_URL}/parts?make=eq.${encodeURIComponent(make)}&year=eq.${encodeURIComponent(year)}&model=eq.${encodeURIComponent(model)}&select=name,category,engine`;
      const res = await fetch(url, { headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` } });
      if (res.ok) {
        const data = await res.json();
        const filteredParts = data.filter((p: any) => {
          const pEng = p.engine && p.engine.trim() !== '' ? p.engine : 'عام';
          return pEng === engine || pEng === 'عام' || engine === 'عام';
        });

        const activeCategories = categories.filter(cat => {
          return filteredParts.some((p: any) => p.category === cat || getPartCategory(p.name) === cat || CATEGORY_TRANSLATION[cat] === p.category);
        });

        setNodeDataCache(prev => ({ ...prev, [cacheKey]: activeCategories }));
        return activeCategories;
      }
    } catch (e) {
    } finally {
      setLoadingNodes(prev => ({ ...prev, [cacheKey]: false }));
    }
    return [];
  };

  // 4️⃣ جلب كروت القطع والصور بالكامل في المرحلة الأخيرة
  const fetchPartsForLeafNode = async (make: string, year: string, model: string, engine: string, category: string) => {
    const cacheKey = `parts_${make}_${year}_${model}_${engine}_${category}`;
    if (nodeDataCache[cacheKey]) return nodeDataCache[cacheKey];

    setLoadingNodes(prev => ({ ...prev, [cacheKey]: true }));
    try {
      const url = `${SUPABASE_URL}/parts?make=eq.${encodeURIComponent(make)}&year=eq.${encodeURIComponent(year)}&model=eq.${encodeURIComponent(model)}&select=*`;
      
      const res = await fetch(url, { headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` } });
      if (res.ok) {
        const data = await res.json();
        const filtered = data.filter((p: any) => {
          const pEng = p.engine && p.engine.trim() !== '' ? p.engine : 'عام';
          const matchEngine = pEng === engine || pEng === 'عام' || engine === 'عام';
          return matchEngine && (getPartCategory(p.name) === category || p.category === category || CATEGORY_TRANSLATION[category] === p.category);
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

  // 🔥 إدارة فتح وإغلاق الشجرة وتنظيف الذاكرة (Garbage Collection)
  const toggleNode = async (nodeKey: string, fetchAction?: () => Promise<any>) => {
    const isCurrentlyOpen = !!expandedNodes[nodeKey];

    if (isCurrentlyOpen) {
      // ♻️ إغلاق الشجرة: تفريغ الذاكرة فوراً من البيانات والصور لمنع ثقل الموقع
      setExpandedNodes(prev => {
        const nextState = { ...prev };
        Object.keys(nextState).forEach(key => {
          if (key === nodeKey || key.startsWith(nodeKey)) {
            delete nextState[key];
          }
        });
        return nextState;
      });

      setNodeDataCache(prev => {
        const nextCache = { ...prev };
        const cleanPattern = nodeKey.replace(/^(make|year|model|eng|cat)_/, '');
        Object.keys(nextCache).forEach(cacheKey => {
          if (cacheKey.includes(cleanPattern) || cacheKey.includes(nodeKey)) {
            delete nextCache[cacheKey];
          }
        });
        return nextCache;
      });

    } else {
      // 📂 فتح الشجرة وجلب البيانات المطلوبة فقط
      setExpandedNodes(prev => ({ ...prev, [nodeKey]: true }));
      if (fetchAction) {
        await fetchAction();
      }
    }
  };

  const searchResults = activeSearchQuery 
    ? inventory.filter(part => matchesSmartSearch(part, activeSearchQuery))
    : [];

  const compatibleVehicles = fitmentModalPart
    ? inventory.filter(p => {
        const modalPN = (fitmentModalPart.part_number || fitmentModalPart.code || fitmentModalPart.sku || '').toString().trim().toLowerCase();
        const itemPN = (p.part_number || p.code || p.sku || '').toString().trim().toLowerCase();
        return modalPN && itemPN ? modalPN === itemPN : p.id === fitmentModalPart.id;
      })
    : [];

  const handleInAppRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custPhone.trim()) return alert(lang === 'ar' ? 'يرجى إدخال رقم الهاتف' : 'Please enter phone number');

    setIsSubmittingReq(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/orders`, {
        method: 'POST',
        headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify([{
          part_name: `طلب خاص: ${activeSearchQuery}`,
          price: 0,
          customer_phone: custPhone,
          status: 'pending',
          notes: custNotes || 'طلب قطعة غير متوفرة'
        }])
      });

      if (response.ok) { setReqSubmitted(true); } else { alert(lang === 'ar' ? 'حدث خطأ في إرسال الطلب' : 'Error sending request'); }
    } catch (err) { alert(lang === 'ar' ? 'تعذر الاتصال بالخادم' : 'Connection error'); } finally { setIsSubmittingReq(false); }
  };

  const renderPartCard = (part: any) => {
    const partNo = part.part_number || part.code || part.sku || part.id;
    const qty = getQty(part.id);
    const maxStock = typeof part.stock !== 'undefined' && part.stock !== null ? Number(part.stock) : 5;
    const isOutOfStock = maxStock <= 0;
    const pType = part.part_type || 'أصلي (OEM)';

    return (
      <div 
        key={part.id} 
        style={{ 
          backgroundColor: 'white', 
          padding: '16px', 
          borderRadius: '14px', 
          border: '1px solid #e2e8f0', 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'space-between', 
          gap: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <img 
            src={part.image_url || 'https://via.placeholder.com/80'} 
            alt={part.name} 
            style={{ width: '75px', height: '75px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #edf2f7' }} 
          />
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#2d3748', fontWeight: 'bold' }}>{part.name}</h4>
            <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>
              🚘 {part.make} - {part.model} ({part.year})
            </div>
            
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '6px' }}>
              <div 
                onClick={(e) => { e.stopPropagation(); setFitmentModalPart(part); }}
                style={{ fontSize: '11px', color: '#2b6cb0', backgroundColor: '#ebf8ff', padding: '2px 6px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', border: '1px solid #bee3f8' }}
              >
                🔍 PN: {partNo}
              </div>

              <span style={{ 
                fontSize: '11px', fontWeight: 'bold', 
                color: pType.includes('تجاري') ? '#c05621' : '#2b6cb0', 
                backgroundColor: pType.includes('تجاري') ? '#fffaf0' : '#ebf8ff', 
                padding: '2px 6px', borderRadius: '5px',
                border: pType.includes('تجاري') ? '1px solid #feebc8' : '1px solid #bee3f8'
              }}>
                {pType.includes('تجاري') ? '⚙️ تجاري/كوبي' : '💎 أصلي OEM'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#dd6b20', fontWeight: 'bold', fontSize: '16.5px' }}>{part.price} QAR</span>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: isOutOfStock ? '#e53e3e' : '#2f855a', backgroundColor: isOutOfStock ? '#fff5f5' : '#f0fff4', padding: '2px 6px', borderRadius: '5px' }}>
                {isOutOfStock ? 'نفدت' : `المتوفر: ${maxStock}`}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e0', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
            <button onClick={(e) => { e.stopPropagation(); changeQty(part, -1); }} disabled={qty <= 1 || isOutOfStock} style={{ width: '30px', height: '30px', border: 'none', backgroundColor: '#e2e8f0', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
            <span style={{ width: '30px', textAlign: 'center', fontWeight: 'bold', fontSize: '13px' }}>{isOutOfStock ? 0 : qty}</span>
            <button onClick={(e) => { e.stopPropagation(); changeQty(part, 1); }} disabled={qty >= maxStock || isOutOfStock} style={{ width: '30px', height: '30px', border: 'none', backgroundColor: '#e2e8f0', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
          </div>

          {addToCart && (
            <button 
              onClick={(e) => { e.stopPropagation(); if (!isOutOfStock) addToCart(part, qty); }}
              disabled={isOutOfStock}
              style={{ flex: 1, backgroundColor: isOutOfStock ? '#a0aec0' : '#805ad5', color: 'white', border: 'none', borderRadius: '8px', padding: '8px', fontSize: '12.5px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              ❓ {isOutOfStock ? 'غير متوفر' : 'أسأل البائع هل تركب؟'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <aside style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 4px 25px rgba(0,0,0,0.05)', border: '1px solid #edf2f7', direction: isRtl ? 'rtl' : 'ltr' }}>
        
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input type="text" placeholder="ابحث برقم القطعة (PN)، الكود، أو المصطلح (مثل: دينمو، سلف، كمبيوتر)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '2px solid #3182ce', outline: 'none' }} />
          <button type="submit" style={{ padding: '0 24px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>🔍 بحث</button>
        </form>

        {activeSearchQuery ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>🔎 نتائج البحث عن: "{activeSearchQuery}"</h3>
              <button onClick={clearSearch} style={{ padding: '8px 16px', borderRadius: '10px', cursor: 'pointer' }}>↩️ العودة للكتالوج</button>
            </div>
            {searchResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                <p>عفواً، لا توجد قطع متوفرة لهذا البحث.</p>
                <button onClick={() => { setReqSubmitted(false); setShowRequestModal(true); }} style={{ padding: '10px 20px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  📩 إرسال طلب قطعة داخل البرنامج
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '18px' }}>
                {searchResults.map(part => renderPartCard(part))}
              </div>
            )}
          </div>
        ) : (
          /* 🔥 شجرة RockAuto فائقة الخفة والخالية من البيانات العشوائية */
          <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
            {Object.keys(carData).map(make => {
              const makeKey = `make_${make}`;
              const isMakeOpen = !!expandedNodes[makeKey];
              const makeName = isRtl ? make : (translateMake[make] || make);

              return (
                <li key={make} style={{ marginBottom: '8px' }}>
                  
                  {/* 1️⃣ المستوى الأول: الماركة */}
                  <div onClick={() => toggleNode(makeKey)} style={{ ...nodeStyle, backgroundColor: isMakeOpen ? '#e2e8f0' : '#f7fafc', fontWeight: 'bold', padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {!imgErrors[make] ? (
                        <img src={`https://www.google.com/s2/favicons?sz=128&domain=${MAKE_DOMAINS[make] || 'google.com'}`} alt={make} style={{ width: '24px', height: '24px', objectFit: 'contain' }} onError={() => setImgErrors(prev => ({...prev, [make]: true}))} />
                      ) : (
                        <span style={{ fontSize: '18px' }}>🚗</span>
                      )}
                      <span style={{ fontSize: '15px' }}>{makeName}</span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#4a5568' }}>{isMakeOpen ? '▼' : isRtl ? '◀' : '▶'}</span>
                  </div>

                  {/* 2️⃣ المستوى الثاني: سنة الصنع */}
                  {isMakeOpen && (
                    <ul style={{ listStyleType: 'none', padding: 0, [isRtl ? 'marginRight' : 'marginLeft']: '18px', marginTop: '6px' }}>
                      {years.map(year => {
                        const yearKey = `year_${make}_${year}`;
                        const isYearOpen = !!expandedNodes[yearKey];
                        const modelsCacheKey = `models_${make}_${year}`;
                        const isModelsLoading = !!loadingNodes[modelsCacheKey];
                        const availableModels = nodeDataCache[modelsCacheKey] || [];

                        return (
                          <li key={year} style={{ marginBottom: '6px' }}>
                            <div 
                              onClick={() => toggleNode(yearKey, () => fetchModelsForYear(make, year))} 
                              style={{ ...nodeStyle, backgroundColor: isYearOpen ? '#ebf8ff' : 'transparent', fontSize: '13.5px', color: '#2b6cb0', padding: '7px 12px', fontWeight: 'bold' }}
                            >
                              <span>📅 {year} {isModelsLoading && <small style={{ color: '#dd6b20' }}>(جاري الفحص...)</small>}</span>
                              <span style={{ fontSize: '10px' }}>{isYearOpen ? '▼' : isRtl ? '◀' : '▶'}</span>
                            </div>

                            {/* 3️⃣ المستوى الثالث: الموديلات التي تملك قطع غيار فعلياً فقط */}
                            {isYearOpen && (
                              <ul style={{ listStyleType: 'none', padding: 0, [isRtl ? 'marginRight' : 'marginLeft']: '18px', marginTop: '6px' }}>
                                {isModelsLoading ? (
                                  <li style={{ padding: '6px 12px', fontSize: '12px', color: '#718096' }}>🔄 جاري البحث عن الموديلات المتاحة...</li>
                                ) : availableModels.length === 0 ? (
                                  <li style={{ padding: '6px 12px', fontSize: '12px', color: '#a0aec0' }}>لا توجد معروضات لموديلات هذه السنة.</li>
                                ) : (
                                  availableModels.map((model: string) => {
                                    const modelKey = `model_${make}_${year}_${model}`;
                                    const isModelOpen = !!expandedNodes[modelKey];
                                    const modelName = isRtl ? model : (translateModel[model] || model);
                                    const enginesCacheKey = `engines_${make}_${year}_${model}`;
                                    const isEnginesLoading = !!loadingNodes[enginesCacheKey];
                                    const availableEngines = nodeDataCache[enginesCacheKey] || [];

                                    return (
                                      <li key={model} style={{ marginBottom: '6px' }}>
                                        <div 
                                          onClick={() => toggleNode(modelKey, () => fetchEnginesForVehicle(make, year, model))} 
                                          style={{ ...nodeStyle, backgroundColor: isModelOpen ? '#edf2f7' : 'transparent', fontSize: '13.5px', padding: '7px 12px' }}
                                        >
                                          <span>🚘 {modelName} {isEnginesLoading && <small style={{ color: '#dd6b20' }}>(فحص المحركات...)</small>}</span>
                                          <span style={{ fontSize: '10px', color: '#718096' }}>{isModelOpen ? '▼' : isRtl ? '◀' : '▶'}</span>
                                        </div>

                                        {/* 4️⃣ المستوى الرابع: المحركات المتاحة فقط */}
                                        {isModelOpen && (
                                          <ul style={{ listStyleType: 'none', padding: 0, [isRtl ? 'marginRight' : 'marginLeft']: '18px', marginTop: '6px' }}>
                                            {isEnginesLoading ? (
                                              <li style={{ padding: '6px 12px', fontSize: '12px', color: '#718096' }}>🔄 جاري الفحص...</li>
                                            ) : (
                                              availableEngines.map((engine: string) => {
                                                const engineKey = `eng_${make}_${year}_${model}_${engine}`;
                                                const isEngineOpen = !!expandedNodes[engineKey];
                                                const categoriesCacheKey = `categories_${make}_${year}_${model}_${engine}`;
                                                const isCategoriesLoading = !!loadingNodes[categoriesCacheKey];
                                                const availableCategories = nodeDataCache[categoriesCacheKey] || [];

                                                return (
                                                  <li key={engine} style={{ marginBottom: '6px' }}>
                                                    <div 
                                                      onClick={() => toggleNode(engineKey, () => fetchCategoriesForEngine(make, year, model, engine))} 
                                                      style={{ ...nodeStyle, backgroundColor: isEngineOpen ? '#ebf8ff' : 'transparent', fontSize: '13px', color: '#2c5282', padding: '6px 10px', fontWeight: '500' }}
                                                    >
                                                      <span>⚡ {engine} {isCategoriesLoading && <small style={{ color: '#dd6b20' }}>(فحص الأقسام...)</small>}</span>
                                                      <span style={{ fontSize: '10px' }}>{isEngineOpen ? '▼' : isRtl ? '◀' : '▶'}</span>
                                                    </div>

                                                    {/* 5️⃣ المستوى الخامس: الأقسام التي تحتوي على قطع فقط */}
                                                    {isEngineOpen && (
                                                      <ul style={{ listStyleType: 'none', padding: 0, [isRtl ? 'marginRight' : 'marginLeft']: '15px', marginTop: '6px' }}>
                                                        {isCategoriesLoading ? (
                                                          <li style={{ padding: '6px 12px', fontSize: '12px', color: '#718096' }}>🔄 جاري فحص الأقسام...</li>
                                                        ) : availableCategories.length === 0 ? (
                                                          <li style={{ padding: '6px 12px', fontSize: '12px', color: '#a0aec0' }}>لا توجد أقسام متوفرة لهذا المحرك.</li>
                                                        ) : (
                                                          availableCategories.map((category: string) => {
                                                            const categoryKey = `cat_${make}_${year}_${model}_${engine}_${category}`;
                                                            const isCategoryOpen = !!expandedNodes[categoryKey];
                                                            const translatedCategory = lang === 'ar' ? (CATEGORY_TRANSLATION[category] || category) : category;
                                                            const partsCacheKey = `parts_${make}_${year}_${model}_${engine}_${category}`;
                                                            const isPartsLoading = !!loadingNodes[partsCacheKey];
                                                            const categoryParts = nodeDataCache[partsCacheKey] || [];

                                                            return (
                                                              <li key={category} style={{ marginBottom: '6px' }}>
                                                                <div 
                                                                  onClick={() => toggleNode(categoryKey, () => fetchPartsForLeafNode(make, year, model, engine, category))} 
                                                                  style={{ ...nodeStyle, backgroundColor: isCategoryOpen ? '#fffaf0' : 'transparent', fontSize: '13px', color: '#2d3748', padding: '6px 10px', fontWeight: 'bold' }}
                                                                >
                                                                  <span>⚙️ {translatedCategory} {isPartsLoading && <small style={{ color: '#dd6b20' }}>(جاري جلب القطع...)</small>}</span>
                                                                  <span style={{ fontSize: '10px', color: '#a0aec0' }}>{isCategoryOpen ? '▼' : isRtl ? '◀' : '▶'}</span>
                                                                </div>

                                                                {/* 6️⃣ كروت القطع المباشرة (يتم حذفها من الذاكرة عند إغلاق القسم) */}
                                                                {isCategoryOpen && (
                                                                  <div style={{ padding: '16px', backgroundColor: '#fffaf0', borderRadius: '14px', border: '1px solid #feebc8', marginTop: '8px', marginBottom: '12px' }}>
                                                                    {isPartsLoading ? (
                                                                      <p style={{ textAlign: 'center', color: '#718096', margin: 0 }}>🔄 جاري تحميل القطع المتاحة...</p>
                                                                    ) : categoryParts.length === 0 ? (
                                                                      <p style={{ textAlign: 'center', color: '#a0aec0', margin: 0 }}>لا توجد قطع معروضة حالياً.</p>
                                                                    ) : (
                                                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '15px' }}>
                                                                        {categoryParts.map((part: any) => renderPartCard(part))}
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
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}

      </div>

      {/* نافذة طلب قطعة غير متوفرة */}
      {showRequestModal && (
        <div onClick={() => setShowRequestModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '18px', padding: '24px', maxWidth: '460px', width: '100%', direction: isRtl ? 'rtl' : 'ltr' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #edf2f7', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#1a365d', fontWeight: 'bold' }}>📩 طلب قطعة غير متوفرة</h3>
              <button onClick={() => setShowRequestModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#a0aec0' }}>✖</button>
            </div>

            {reqSubmitted ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <span style={{ fontSize: '50px', display: 'block', marginBottom: '10px' }}>✅</span>
                <h4 style={{ margin: '0 0 8px 0', color: '#2f855a' }}>تم إرسال طلبك بنجاح!</h4>
                <button onClick={() => setShowRequestModal(false)} style={{ width: '100%', padding: '12px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>تم</button>
              </div>
            ) : (
              <form onSubmit={handleInAppRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <input type="tel" placeholder="رقم الهاتف للتواصل" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required />
                <textarea placeholder="ملاحظات إضافية..." value={custNotes} onChange={(e) => setCustNotes(e.target.value)} rows={3} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} />
                <button type="submit" disabled={isSubmittingReq} style={{ width: '100%', padding: '13px', backgroundColor: '#38a169', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {isSubmittingReq ? 'جاري الإرسال...' : 'إرسال الطلب الآن 🚀'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* نافذة التوافق */}
      {fitmentModalPart && (
        <div onClick={() => setFitmentModalPart(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '18px', padding: '24px', maxWidth: '520px', width: '100%', maxHeight: '80vh', overflowY: 'auto', direction: isRtl ? 'rtl' : 'ltr' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #edf2f7', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#1a365d', fontWeight: 'bold' }}>🚘 دليل توافق القطعة مع السيارات</h3>
              <button onClick={() => setFitmentModalPart(null)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#a0aec0' }}>✖</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {compatibleVehicles.map((v, idx) => (
                <div key={idx} style={{ padding: '10px 14px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #cbd5e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{v.make} - {v.model || 'عام'}</strong>
                  <span style={{ backgroundColor: '#ebf8ff', color: '#2b6cb0', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold' }}>📅 {v.year}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setFitmentModalPart(null)} style={{ width: '100%', marginTop: '20px', padding: '12px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>إغلاق</button>
          </div>
        </div>
      )}

    </aside>
  );
};

const nodeStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  cursor: 'pointer',
  padding: '6px 10px',
  borderRadius: '8px',
  transition: 'all 0.15s ease-in-out',
  userSelect: 'none',
};
