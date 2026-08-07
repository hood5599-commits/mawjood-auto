import React, { useState } from 'react';
import { 
  getPartCategory, 
  matchesSmartSearch, 
  findSmartInterchangeParts, 
  classifyPartTier 
} from '../utils/categoryHelper';
import { AITranslatedText } from './AITranslatedText';

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
  onInquire?: (item: any) => void;
  siteSettings?: any;
}

const CATEGORY_TRANSLATION: Record<string, string> = {
  "Belt Drive": "نظام السيور والمكرات — Belt Drive",
  "Body & Lamp Assembly": "الهيكل والإضاءة — Body & Lamp Assembly",
  "Brake & Wheel Hub": "الفرامل والفرامات — Brake & Wheel Hub",
  "Cooling System": "التبريد والرديتر — Cooling System",
  "Drivetrain": "نظام الدفع والمحاور — Drivetrain",
  "Electrical": "الكهرباء والكهربائيات — Electrical",
  "Electrical-Bulb & Socket": "اللمبات والسوكتات — Electrical-Bulb & Socket",
  "Electrical-Connector": "الفيش والتوصيلات — Electrical-Connector",
  "Electrical-Switch & Relay": "المفاتيح والكتاوت — Electrical-Switch & Relay",
  "Engine": "المحرك ومكوناته — Engine",
  "Exhaust & Emission": "العادم والانبعاثات — Exhaust & Emission",
  "Fuel & Air": "الوقود وهواء المحرك — Fuel & Air",
  "Heat & Air Conditioning": "التكييف والتدفئة — Heat & Air Conditioning",
  "Ignition": "نظام الاشتعال (البواجي) — Ignition",
  "Interior": "المقصورة الداخلية — Interior",
  "Literature": "الكتالوجات — Literature",
  "Steering": "نظام التوجيه (الدركسون) — Steering",
  "Suspension": "المساعدات ونظام التعليق — Suspension",
  "Transmission-Automatic": "القير الأوتوماتيك — Transmission-Automatic",
  "Transmission-Manual": "القير العادي — Transmission-Manual",
  "Wheel": "الإطارات والجنوط — Wheel",
  "Wiper & Washer": "المساحات وبخاخات المياه — Wiper & Washer"
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

export const SidebarFilters: React.FC<SidebarProps> = (props) => {
  const { 
    lang, carData, categories, inventory, 
    searchTerm, setSearchTerm, addToCart, onInquire, siteSettings 
  } = props;

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

  const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=400&auto=format&fit=crop&q=60";

  const isRtl = lang === 'ar';

  const isBNPLEnabled = siteSettings?.enableBNPL ?? true;

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

  const fetchYearsForMake = async (make: string) => {
    const cacheKey = `years_${make}`;
    if (nodeDataCache[cacheKey]) return nodeDataCache[cacheKey];

    setLoadingNodes(prev => ({ ...prev, [cacheKey]: true }));
    try {
      const url = `${SUPABASE_URL}/parts?make=eq.${encodeURIComponent(make)}&select=year`;
      const res = await fetch(url, { headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` } });
      if (res.ok) {
        const data = await res.json();
        const availableYears = Array.from(new Set(data.map((item: any) => String(item.year)).filter(Boolean)))
          .sort((a, b) => Number(b) - Number(a));
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

  const fetchEnginesForVehicle = async (make: string, year: string, model: string) => {
    const cacheKey = `engines_${make}_${year}_${model}`;
    if (nodeDataCache[cacheKey]) return nodeDataCache[cacheKey];

    setLoadingNodes(prev => ({ ...prev, [cacheKey]: true }));
    try {
      const url = `${SUPABASE_URL}/parts?make=eq.${encodeURIComponent(make)}&year=eq.${encodeURIComponent(year)}&model=eq.${encodeURIComponent(model)}&select=engine`;
      const res = await fetch(url, { headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` } });
      if (res.ok) {
        const data = await res.json();
        const uniqueEngines = Array.from(new Set(data.map((item: any) => item.engine && item.engine.trim() !== '' ? item.engine : (lang === 'ar' ? 'عام' : 'General')))) as string[];
        setNodeDataCache(prev => ({ ...prev, [cacheKey]: uniqueEngines }));
        return uniqueEngines;
      }
    } catch (e) {
    } finally {
      setLoadingNodes(prev => ({ ...prev, [cacheKey]: false }));
    }
    return [lang === 'ar' ? 'عام' : 'General'];
  };

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
          const pEng = p.engine && p.engine.trim() !== '' ? p.engine : (lang === 'ar' ? 'عام' : 'General');
          return pEng === engine || pEng === (lang === 'ar' ? 'عام' : 'General') || engine === (lang === 'ar' ? 'عام' : 'General');
        });

        const activeCategories = categories.filter(cat => {
          return filteredParts.some((p: any) => p.category === cat || getPartCategory(p.name) === cat || (p.category && p.category.includes(cat)));
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
          const pEng = p.engine && p.engine.trim() !== '' ? p.engine : (lang === 'ar' ? 'عام' : 'General');
          const matchEngine = pEng === engine || pEng === (lang === 'ar' ? 'عام' : 'General') || engine === (lang === 'ar' ? 'عام' : 'General');
          return matchEngine && (getPartCategory(p.name) === category || p.category === category || (p.category && p.category.includes(category)));
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
      setExpandedNodes(prev => ({ ...prev, [nodeKey]: true }));
      if (fetchAction) {
        await fetchAction();
      }
    }
  };

  const searchResults = activeSearchQuery 
    ? inventory.filter(part => matchesSmartSearch(part, activeSearchQuery))
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
          part_name: lang === 'ar' ? `طلب خاص: ${activeSearchQuery}` : `Special Request: ${activeSearchQuery}`,
          price: 0,
          customer_phone: custPhone,
          status: 'pending',
          notes: custNotes || (lang === 'ar' ? 'طلب قطعة غير متوفرة' : 'Requested unavailable part')
        }])
      });

      if (response.ok) { setReqSubmitted(true); } else { alert(lang === 'ar' ? 'حدث خطأ في إرسال الطلب' : 'Error sending request'); }
    } catch (err) { alert(lang === 'ar' ? 'تعذر الاتصال بالخادم' : 'Connection error'); } finally { setIsSubmittingReq(false); }
  };

  // 🎴 رسم كرت القطعة المحسّن بالجدول المدمج ذو المدى الزمني
  const renderPartCard = (part: any) => {
    const partNo = part.part_number || part.code || part.sku || part.id;
    const qty = getQty(part.id);
    const maxStock = typeof part.stock !== 'undefined' && part.stock !== null ? Number(part.stock) : 5;
    const isOutOfStock = maxStock <= 0;

    const tierInfo = classifyPartTier(part);

    const formattedPart = {
      ...part,
      image_url: part.image_url || part.image || part.part_image || DEFAULT_IMAGE,
      image: part.image_url || part.image || part.part_image || DEFAULT_IMAGE
    };

    // 🚘 1. جلب كافة السيارات المتوافقة من قاعدة البيانات
    const rawVehicles = inventory.filter(p => {
      const modalPN = (partNo || '').toString().trim().toLowerCase();
      const itemPN = (p.part_number || p.code || p.sku || '').toString().trim().toLowerCase();
      return modalPN && itemPN ? modalPN === itemPN : p.id === part.id;
    });

    // 🧠 2. دمج السنوات المتتالية تلقائياً لكل (شركة + موديل) مثل نظام RockAuto (مثال: 2008-2021)
    const groupedFitmentMap: Record<string, { make: string; model: string; years: number[] }> = {};

    rawVehicles.forEach(v => {
      const key = `${v.make}_${v.model || 'عام'}`;
      if (!groupedFitmentMap[key]) {
        groupedFitmentMap[key] = { make: v.make, model: v.model || (isRtl ? 'عام' : 'General'), years: [] };
      }
      if (v.year && !isNaN(Number(v.year))) {
        groupedFitmentMap[key].years.push(Number(v.year));
      }
    });

    const formattedFitmentList = Object.values(groupedFitmentMap).map(item => {
      const sortedYears = Array.from(new Set(item.years)).sort((a, b) => a - b);
      let yearRangeStr = '';

      if (sortedYears.length === 0) {
        yearRangeStr = String(part.year || (isRtl ? 'جميع السنوات' : 'All Years'));
      } else if (sortedYears.length === 1) {
        yearRangeStr = String(sortedYears[0]);
      } else {
        const minYear = sortedYears[0];
        const maxYear = sortedYears[sortedYears.length - 1];
        yearRangeStr = `${minYear}-${maxYear}`;
      }

      return {
        make: item.make,
        model: item.model,
        yearRange: yearRangeStr
      };
    });

    const installmentValue = (Number(part.price || 0) / 4).toFixed(2);

    return (
      <div 
        key={part.id} 
        style={{ 
          backgroundColor: 'white', 
          padding: '18px', 
          borderRadius: '18px', 
          border: '1px solid #e2e8f0', 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'space-between', 
          gap: '14px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          
          {/* تفاصيل القطعة وصورتها ورقمها الصريح */}
          <div style={{ display: 'flex', gap: '12px', flex: '1 1 230px', alignItems: 'flex-start' }}>
            <img 
              src={formattedPart.image_url} 
              alt={part.name} 
              onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
              style={{ width: '85px', height: '85px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #edf2f7', flexShrink: 0 }} 
            />
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '15.5px', color: '#1f3a5f', fontWeight: 'bold', lineHeight: '1.4' }}>
                <AITranslatedText text={part.name} lang={lang} />
              </h4>

              {/* النص الصريح لرقم القطعة */}
              <div style={{ fontSize: '12px', color: '#1f3a5f', backgroundColor: '#e8f2fc', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold', display: 'inline-block', marginBottom: '6px', border: '1px solid #bae6fd', fontFamily: 'monospace' }}>
                🔍 {isRtl ? 'رقم القطعة' : 'Part Number'}: {partNo}
              </div>

              {/* نوع وحالة القطعة بالكامل دون اختصار */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ 
                  fontSize: '11px', fontWeight: 'bold', 
                  color: tierInfo.tier === 'oem' ? '#0369a1' : '#c2410c', 
                  backgroundColor: tierInfo.badgeColor, 
                  padding: '2px 8px', borderRadius: '6px',
                  whiteSpace: 'nowrap',
                  border: tierInfo.tier === 'oem' ? '1px solid #bae6fd' : '1px solid #ffedd5'
                }}>
                  {part.part_type || (tierInfo.tier === 'oem' ? (isRtl ? 'أصلي' : 'OEM') : (isRtl ? tierInfo.label : 'Aftermarket'))}
                </span>

                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                  ✨ {part.part_condition || (isRtl ? 'نظيف' : 'Good Condition')}
                </span>
              </div>
            </div>
          </div>

          {/* 📊 3. جدول التوافق المندمج الأنيق (المصمم بأسلوب RockAuto + العربي الحديث) */}
          <div style={{ flex: '1 1 240px', border: '1px solid #cbd5e0', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#ffffff' }}>
            <div style={{ backgroundColor: '#f1f5f9', padding: '6px 10px', fontSize: '11.5px', fontWeight: 'bold', color: '#1f3a5f', borderBottom: '1px solid #cbd5e0', display: 'flex', justifyContent: 'space-between' }}>
              <span>🚘 {isRtl ? 'توافق القطعة (Buyer\'s Guide):' : 'Part Fitment Guide:'}</span>
              <span style={{ color: '#0284c7' }}>({formattedFitmentList.length})</span>
            </div>

            <div style={{ maxHeight: '95px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: isRtl ? 'right' : 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', color: '#64748b', borderBottom: '1px solid #edf2f7' }}>
                    <th style={{ padding: '4px 8px' }}>{isRtl ? 'الشركة' : 'Make'}</th>
                    <th style={{ padding: '4px 8px' }}>{isRtl ? 'السيارة' : 'Model'}</th>
                    <th style={{ padding: '4px 8px' }}>{isRtl ? 'السنوات' : 'Years'}</th>
                  </tr>
                </thead>
                <tbody>
                  {formattedFitmentList.map((fit, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ padding: '4px 8px', fontWeight: 'bold', color: '#1e293b' }}>{fit.make}</td>
                      <td style={{ padding: '4px 8px', color: '#475569' }}>{fit.model}</td>
                      <td style={{ padding: '4px 8px', fontWeight: 'bold', color: '#e0872a', fontFamily: 'monospace' }}>{fit.yearRange}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* 4. تفاصيل السعر، وقسم فاتورتك، والكمية */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', backgroundColor: '#fafafa', padding: '10px 14px', borderRadius: '12px', border: '1px dashed #cbd5e0' }}>
          <div>
            <div style={{ color: '#e0872a', fontWeight: '900', fontSize: '18px' }}>
              {part.price} {isRtl ? 'ر.ق' : 'QAR'}
            </div>
            <div style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: 'bold', marginTop: '2px' }}>
              ⚡ {isRtl ? 'التوصيل المتوقع: خلال 24 - 48 ساعة' : 'Estimated Delivery: 24-48 Hours'}
            </div>
          </div>

          {/* 💳 شريط التقسيط الذكي الآجل (الذي يتحكم به الأدمن) */}
          {isBNPLEnabled && (
            <div style={{ backgroundColor: '#fffdf5', border: '1px solid #fef08a', padding: '6px 12px', borderRadius: '10px', textAlign: isRtl ? 'right' : 'left' }}>
              <span style={{ fontSize: '11.5px', color: '#854d0e', fontWeight: 'bold', display: 'block' }}>
                🛒 {isRtl ? `أو قسمها على 4 دفعات بقيمة ${installmentValue} ر.ق` : `Or 4 payments of ${installmentValue} QAR`}
              </span>
              <span style={{ fontSize: '10px', backgroundColor: '#fef08a', color: '#a16207', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold', display: 'inline-block', marginTop: '2px' }}>
                ⏳ {isRtl ? 'خدمة الدفع الآجل (قريباً)' : 'Pay Later (Coming Soon)'}
              </span>
            </div>
          )}

          <div style={{ textAlign: isRtl ? 'left' : 'right' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: isOutOfStock ? '#ef4444' : '#16a34a', backgroundColor: isOutOfStock ? '#fef2f2' : '#f0fff4', padding: '3px 8px', borderRadius: '6px' }}>
              {isOutOfStock ? (isRtl ? 'نفدت من المخزون' : 'Out of Stock') : (isRtl ? `المتوفر: ${maxStock} قطعة` : `In Stock: ${maxStock}`)}
            </span>
          </div>
        </div>

        {/* أزرار الإضافة والشراء */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e0', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
            <button onClick={(e) => { e.stopPropagation(); changeQty(part, -1); }} disabled={qty <= 1 || isOutOfStock} style={{ width: '32px', height: '36px', border: 'none', backgroundColor: '#e2e8f0', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
            <span style={{ width: '32px', textAlign: 'center', fontWeight: 'bold', fontSize: '13px' }}>{isOutOfStock ? 0 : qty}</span>
            <button onClick={(e) => { e.stopPropagation(); changeQty(part, 1); }} disabled={qty >= maxStock || isOutOfStock} style={{ width: '32px', height: '36px', border: 'none', backgroundColor: '#e2e8f0', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
          </div>

          <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
            {addToCart && (
              <button 
                onClick={(e) => { e.stopPropagation(); if (!isOutOfStock) addToCart(formattedPart, qty); }}
                disabled={isOutOfStock}
                style={{ flex: 1, backgroundColor: isOutOfStock ? '#94a3b8' : '#1f3a5f', color: 'white', border: 'none', borderRadius: '10px', padding: '10px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                🛒 {isOutOfStock ? (isRtl ? 'غير متوفر' : 'Unavailable') : (isRtl ? 'أضف للسلة' : 'Add to Cart')}
              </button>
            )}

            <button 
              onClick={(e) => { e.stopPropagation(); if (onInquire) onInquire(formattedPart); else if (addToCart && !isOutOfStock) addToCart(formattedPart, qty); }}
              disabled={isOutOfStock}
              style={{ flex: 1, backgroundColor: isOutOfStock ? '#94a3b8' : '#f1f5f9', color: '#1f3a5f', border: '1px solid #cbd5e0', borderRadius: '10px', padding: '10px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              🔍 {isRtl ? 'فحص / اسأل' : 'Inquire'}
            </button>
          </div>
        </div>

      </div>
    );
  };

  return (
    <aside style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 4px 25px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', direction: isRtl ? 'rtl' : 'ltr' }}>
        
        {/* شريط البحث المباشر السريع */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder={isRtl ? "ابحث برقم القطعة، الكود، أو الاسم (مثل: فلتر زيت، دينمو)..." : "Search by Part Number, Code, or Name..."} 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '2px solid #1f3a5f', outline: 'none', fontSize: '13.5px' }} 
          />
          <button type="submit" style={{ padding: '0 24px', backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
            🔍 {isRtl ? 'بحث' : 'Search'}
          </button>
        </form>

        {activeSearchQuery ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#1f3a5f', margin: 0 }}>🔎 {isRtl ? 'نتائج البحث عن:' : 'Search results for:'} "{activeSearchQuery}"</h3>
              <button onClick={clearSearch} style={{ padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', border: '1px solid #cbd5e0', backgroundColor: '#ffffff', fontWeight: 'bold', fontSize: '12.5px' }}>
                ↩️ {isRtl ? 'العودة للكتالوج' : 'Back to Catalog'}
              </button>
            </div>
            {searchResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <p style={{ color: '#64748b', fontWeight: 'bold' }}>{isRtl ? 'عفواً، لا توجد قطع متوفرة لهذا البحث حالياً.' : 'Sorry, no parts found for this search.'}</p>
                <button onClick={() => { setReqSubmitted(false); setShowRequestModal(true); }} style={{ padding: '10px 20px', backgroundColor: '#e0872a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>
                  📩 {isRtl ? 'إرسال طلب قطعة داخل البرنامج' : 'Request a part in-app'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
                {searchResults.map(part => renderPartCard(part))}
              </div>
            )}
          </div>
        ) : (
          /* شجرة البحث المباشرة المنظمة حسب الماركة والسنوات */
          <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
            {Object.keys(carData).map(make => {
              const makeKey = `make_${make}`;
              const isMakeOpen = !!expandedNodes[makeKey];
              const makeName = make;
              const yearsCacheKey = `years_${make}`;
              const isYearsLoading = !!loadingNodes[yearsCacheKey];
              const availableYears = nodeDataCache[yearsCacheKey] || [];

              return (
                <li key={make} style={{ marginBottom: '8px' }}>
                  
                  <div 
                    onClick={() => toggleNode(makeKey, () => fetchYearsForMake(make))} 
                    style={{ ...nodeStyle, backgroundColor: isMakeOpen ? '#e8f2fc' : '#f8fafc', fontWeight: 'bold', padding: '10px 14px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {!imgErrors[make] ? (
                        <img src={`https://www.google.com/s2/favicons?sz=128&domain=${MAKE_DOMAINS[make] || 'google.com'}`} alt={make} style={{ width: '22px', height: '22px', objectFit: 'contain' }} onError={() => setImgErrors(prev => ({...prev, [make]: true}))} />
                      ) : (
                        <span style={{ fontSize: '16px' }}>🚗</span>
                      )}
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
                              <div 
                                onClick={() => toggleNode(yearKey, () => fetchModelsForYear(make, year))} 
                                style={{ ...nodeStyle, backgroundColor: isYearOpen ? '#f0f7ff' : 'transparent', fontSize: '13.5px', color: '#0284c7', padding: '7px 12px', fontWeight: 'bold' }}
                              >
                                <span>📅 {year} {isModelsLoading && <small style={{ color: '#e0872a' }}>{isRtl ? '(فحص...)' : '(Checking...)'}</small>}</span>
                                <span style={{ fontSize: '10px' }}>{isYearOpen ? '▼' : isRtl ? '◀' : '▶'}</span>
                              </div>

                              {isYearOpen && (
                                <ul style={{ listStyleType: 'none', padding: 0, [isRtl ? 'marginRight' : 'marginLeft']: '18px', marginTop: '6px' }}>
                                  {isModelsLoading ? (
                                    <li style={{ padding: '6px 12px', fontSize: '12px', color: '#64748b' }}>🔄 {isRtl ? 'جاري البحث عن الموديلات المتاحة...' : 'Checking available models...'}</li>
                                  ) : availableModels.length === 0 ? (
                                    <li style={{ padding: '6px 12px', fontSize: '12px', color: '#94a3b8' }}>{isRtl ? 'لا توجد معروضات لموديلات هذه السنة.' : 'No items available for this year.'}</li>
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
                                          <div 
                                            onClick={() => toggleNode(modelKey, () => fetchEnginesForVehicle(make, year, model))} 
                                            style={{ ...nodeStyle, backgroundColor: isModelOpen ? '#f1f5f9' : 'transparent', fontSize: '13.5px', padding: '7px 12px' }}
                                          >
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
                                                  const categoriesCacheKey = `categories_${make}_${year}_${model}_${engine}`;
                                                  const isCategoriesLoading = !!loadingNodes[categoriesCacheKey];
                                                  const availableCategories = nodeDataCache[categoriesCacheKey] || [];

                                                  return (
                                                    <li key={engine} style={{ marginBottom: '6px' }}>
                                                      <div 
                                                        onClick={() => toggleNode(engineKey, () => fetchCategoriesForEngine(make, year, model, engine))} 
                                                        style={{ ...nodeStyle, backgroundColor: isEngineOpen ? '#e8f2fc' : 'transparent', fontSize: '13px', color: '#1f3a5f', padding: '6px 10px', fontWeight: '500' }}
                                                      >
                                                        <span>⚡ {engine} {isCategoriesLoading && <small style={{ color: '#e0872a' }}>{isRtl ? '(فحص...)' : '(Checking...)'}</small>}</span>
                                                        <span style={{ fontSize: '10px' }}>{isEngineOpen ? '▼' : isRtl ? '◀' : '▶'}</span>
                                                      </div>

                                                      {isEngineOpen && (
                                                        <ul style={{ listStyleType: 'none', padding: 0, [isRtl ? 'marginRight' : 'marginLeft']: '15px', marginTop: '6px' }}>
                                                          {isCategoriesLoading ? (
                                                            <li style={{ padding: '6px 12px', fontSize: '12px', color: '#64748b' }}>🔄 {isRtl ? 'جاري فحص الأقسام...' : 'Checking categories...'}</li>
                                                          ) : availableCategories.length === 0 ? (
                                                            <li style={{ padding: '6px 12px', fontSize: '12px', color: '#94a3b8' }}>{isRtl ? 'لا توجد أقسام متوفرة لهذا المحرك.' : 'No categories available for this engine.'}</li>
                                                          ) : (
                                                            availableCategories.map((category: string) => {
                                                              const categoryKey = `cat_${make}_${year}_${model}_${engine}_${category}`;
                                                              const isCategoryOpen = !!expandedNodes[categoryKey];
                                                              const translatedCategory = CATEGORY_TRANSLATION[category] || category;
                                                              const partsCacheKey = `parts_${make}_${year}_${model}_${engine}_${category}`;
                                                              const isPartsLoading = !!loadingNodes[partsCacheKey];
                                                              const categoryParts = nodeDataCache[partsCacheKey] || [];

                                                              return (
                                                                <li key={category} style={{ marginBottom: '6px' }}>
                                                                  <div 
                                                                    onClick={() => toggleNode(categoryKey, () => fetchPartsForLeafNode(make, year, model, engine, category))} 
                                                                    style={{ ...nodeStyle, backgroundColor: isCategoryOpen ? '#fff7ed' : 'transparent', fontSize: '13px', color: '#1f3a5f', padding: '6px 10px', fontWeight: 'bold' }}
                                                                  >
                                                                    <span>{translatedCategory} {isPartsLoading && <small style={{ color: '#e0872a' }}>{isRtl ? '(جلب القطع...)' : '(Fetching...)'}</small>}</span>
                                                                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>{isCategoryOpen ? '▼' : isRtl ? '◀' : '▶'}</span>
                                                                  </div>

                                                                  {isCategoryOpen && (
                                                                    <div style={{ padding: '16px', backgroundColor: '#fff7ed', borderRadius: '14px', border: '1px solid #ffedd5', marginTop: '8px', marginBottom: '12px' }}>
                                                                      {isPartsLoading ? (
                                                                        <p style={{ textAlign: 'center', color: '#64748b', margin: 0 }}>🔄 {isRtl ? 'جاري تحميل القطع المتاحة...' : 'Loading available parts...'}</p>
                                                                      ) : categoryParts.length === 0 ? (
                                                                        <p style={{ textAlign: 'center', color: '#94a3b8', margin: 0 }}>{isRtl ? 'لا توجد قطع معروضة حالياً.' : 'No parts available currently.'}</p>
                                                                      ) : (
                                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '15px' }}>
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
