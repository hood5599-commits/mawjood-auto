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
    lang, carData, translateMake, translateModel, categories, inventory, 
    searchTerm, setSearchTerm, addToCart, onInquire 
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

  const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=400&auto=format&fit=crop&q=60";

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

  const renderPartCard = (part: any) => {
    const partNo = part.part_number || part.code || part.sku || part.id;
    const qty = getQty(part.id);
    const maxStock = typeof part.stock !== 'undefined' && part.stock !== null ? Number(part.stock) : 5;
    const isOutOfStock = maxStock <= 0;

    const { alternatives } = findSmartInterchangeParts(part, inventory);
    const tierInfo = classifyPartTier(part);

    const formattedPart = {
      ...part,
      image_url: part.image_url || part.image || part.part_image || DEFAULT_IMAGE,
      image: part.image_url || part.image || part.part_image || DEFAULT_IMAGE
    };

    return (
      <div 
        key={part.id} 
        style={{ 
          backgroundColor: 'white', 
          padding: '16px', 
          borderRadius: '16px', 
          border: '1px solid #e2e8f0', 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'space-between', 
          gap: '12px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
        }}
      >
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <img 
            src={formattedPart.image_url} 
            alt={part.name} 
            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
            style={{ width: '75px', height: '75px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #edf2f7' }} 
          />
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#1f3a5f', fontWeight: 'bold' }}>
              <AITranslatedText text={part.name} lang={lang} />
            </h4>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>
              🚗 {translateMake[part.make] || part.make} - {translateModel[part.model] || part.model} ({part.year})
            </div>

            {/* تم دمج كود التقييم واسم الكراج هنا */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '4px 0' }}>
              <span style={{ color: '#e0872a', fontSize: '13px', fontWeight: 800 }}>⭐ {part.rating || part.garage_rating || '4.9'}</span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>({part.garage_name || 'كراج معتمد'})</span>
            </div>
            
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '6px' }}>
              <div 
                onClick={(e) => { e.stopPropagation(); setFitmentModalPart(part); }}
                style={{ fontSize: '11px', color: '#1f3a5f', backgroundColor: '#e8f2fc', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', border: '1px solid #bae6fd' }}
              >
                🔍 PN: {partNo}
              </div>

              <span style={{ 
                fontSize: '11px', fontWeight: 'bold', 
                color: tierInfo.tier === 'oem' ? '#0369a1' : '#c2410c', 
                backgroundColor: tierInfo.badgeColor, 
                padding: '2px 8px', borderRadius: '6px',
                border: tierInfo.tier === 'oem' ? '1px solid #bae6fd' : '1px solid #ffedd5'
              }}>
                {tierInfo.tier === 'oem' ? (lang === 'ar' ? 'أصلي' : 'OEM') : (lang === 'ar' ? tierInfo.label : 'Aftermarket')}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#e0872a', fontWeight: 'bold', fontSize: '16.5px' }}>{part.price} {lang === 'ar' ? 'ر.ق' : 'QAR'}</span>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: isOutOfStock ? '#ef4444' : '#16a34a', backgroundColor: isOutOfStock ? '#fef2f2' : '#f0fff4', padding: '2px 6px', borderRadius: '5px' }}>
                {isOutOfStock ? (lang === 'ar' ? 'نفدت' : 'Out of Stock') : (lang === 'ar' ? `المتوفر: ${maxStock}` : `In Stock: ${maxStock}`)}
              </span>
            </div>
          </div>
        </div>

        {alternatives.length > 0 && (
          <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px dashed #cbd5e0' }}>
            <strong style={{ fontSize: '11.5px', color: '#0369a1', display: 'block', marginBottom: '6px' }}>
              💡 {lang === 'ar' ? `متوفر (${alternatives.length}) بدائل متوافقة مع هذا البارت نمبر:` : `Available (${alternatives.length}) compatible alternatives:`}
            </strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {alternatives.slice(0, 2).map((alt) => (
                <div key={alt.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#334155' }}>
                  <span>
                    <AITranslatedText text={alt.name} lang={lang} /> ({classifyPartTier(alt).tier === 'oem' ? (lang === 'ar' ? 'أصلي' : 'OEM') : (lang === 'ar' ? 'بديل' : 'Aftermarket')})
                  </span>
                  <strong style={{ color: '#e0872a' }}>{alt.price} {lang === 'ar' ? 'ر.ق' : 'QAR'}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e0', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f8fafc', justifyContent: 'center' }}>
            <button onClick={(e) => { e.stopPropagation(); changeQty(part, -1); }} disabled={qty <= 1 || isOutOfStock} style={{ width: '30px', height: '30px', border: 'none', backgroundColor: '#e2e8f0', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
            <span style={{ width: '30px', textAlign: 'center', fontWeight: 'bold', fontSize: '13px' }}>{isOutOfStock ? 0 : qty}</span>
            <button onClick={(e) => { e.stopPropagation(); changeQty(part, 1); }} disabled={qty >= maxStock || isOutOfStock} style={{ width: '30px', height: '30px', border: 'none', backgroundColor: '#e2e8f0', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {addToCart && (
              <button 
                onClick={(e) => { e.stopPropagation(); if (!isOutOfStock) addToCart(formattedPart, qty); }}
                disabled={isOutOfStock}
                style={{ flex: 1, backgroundColor: isOutOfStock ? '#94a3b8' : '#1f3a5f', color: 'white', border: 'none', borderRadius: '8px', padding: '9px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                🛒 {isOutOfStock ? (lang === 'ar' ? 'غير متوفر' : 'Unavailable') : (lang === 'ar' ? 'أضف للسلة' : 'Add to Cart')}
              </button>
            )}

            <button 
              onClick={(e) => { e.stopPropagation(); if (onInquire) onInquire(formattedPart); else if (addToCart && !isOutOfStock) addToCart(formattedPart, qty); }}
              disabled={isOutOfStock}
              style={{ flex: 1, backgroundColor: isOutOfStock ? '#94a3b8' : '#f1f5f9', color: '#1f3a5f', border: '1px solid #cbd5e0', borderRadius: '8px', padding: '9px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              🔍 {lang === 'ar' ? 'فحص / اسأل' : 'Inquire'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <aside style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 4px 25px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', direction: isRtl ? 'rtl' : 'ltr' }}>
        
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder={lang === 'ar' ? "ابحث برقم القطعة (PN)، الكود، أو الاسم (مثل: فلتر زيت، دينمو)..." : "Search by PN, Code, or Name..."} 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '2px solid #1f3a5f', outline: 'none', fontSize: '13.5px' }} 
          />
          <button type="submit" style={{ padding: '0 24px', backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
            🔍 {lang === 'ar' ? 'بحث' : 'Search'}
          </button>
        </form>

        {activeSearchQuery ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#1f3a5f', margin: 0 }}>🔎 {lang === 'ar' ? 'نتائج البحث عن:' : 'Search results for:'} "{activeSearchQuery}"</h3>
              <button onClick={clearSearch} style={{ padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', border: '1px solid #cbd5e0', backgroundColor: '#ffffff', fontWeight: 'bold', fontSize: '12.5px' }}>
                ↩️ {lang === 'ar' ? 'العودة للكتالوج' : 'Back to Catalog'}
              </button>
            </div>
            {searchResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <p style={{ color: '#64748b', fontWeight: 'bold' }}>{lang === 'ar' ? 'عفواً، لا توجد قطع متوفرة لهذا البحث حالياً.' : 'Sorry, no parts found for this search.'}</p>
                <button onClick={() => { setReqSubmitted(false); setShowRequestModal(true); }} style={{ padding: '10px 20px', backgroundColor: '#e0872a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>
                  📩 {lang === 'ar' ? 'إرسال طلب قطعة داخل البرنامج' : 'Request a part in-app'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '18px' }}>
                {searchResults.map(part => renderPartCard(part))}
              </div>
            )}
          </div>
        ) : (
          <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
            {Object.keys(carData).map(make => {
              const makeKey = `make_${make}`;
              const isMakeOpen = !!expandedNodes[makeKey];
              const makeName = isRtl ? make : (translateMake[make] || make);
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
                      <span style={{ fontSize: '14.5px', color: '#1f3a5f' }}>{makeName} {isYearsLoading && <small style={{ color: '#e0872a' }}>{lang === 'ar' ? '(فحص...)' : '(Checking...)'}</small>}</span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{isMakeOpen ? '▼' : isRtl ? '◀' : '▶'}</span>
                  </div>

                  {isMakeOpen && (
                    <ul style={{ listStyleType: 'none', padding: 0, [isRtl ? 'marginRight' : 'marginLeft']: '18px', marginTop: '6px' }}>
                      {isYearsLoading ? (
                        <li style={{ padding: '6px 12px', fontSize: '12px', color: '#64748b' }}>🔄 {lang === 'ar' ? 'جاري فحص السنوات المتاحة...' : 'Checking available years...'}</li>
                      ) : availableYears.length === 0 ? (
                        <li style={{ padding: '6px 12px', fontSize: '12px', color: '#94a3b8' }}>{lang === 'ar' ? 'لا توجد معروضات لهذه الماركة حالياً.' : 'No items available for this make.'}</li>
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
                                <span>📅 {year} {isModelsLoading && <small style={{ color: '#e0872a' }}>{lang === 'ar' ? '(فحص...)' : '(Checking...)'}</small>}</span>
                                <span style={{ fontSize: '10px' }}>{isYearOpen ? '▼' : isRtl ? '◀' : '▶'}</span>
                              </div>

                              {isYearOpen && (
                                <ul style={{ listStyleType: 'none', padding: 0, [isRtl ? 'marginRight' : 'marginLeft']: '18px', marginTop: '6px' }}>
                                  {isModelsLoading ? (
                                    <li style={{ padding: '6px 12px', fontSize: '12px', color: '#64748b' }}>🔄 {lang === 'ar' ? 'جاري البحث عن الموديلات المتاحة...' : 'Checking available models...'}</li>
                                  ) : availableModels.length === 0 ? (
                                    <li style={{ padding: '6px 12px', fontSize: '12px', color: '#94a3b8' }}>{lang === 'ar' ? 'لا توجد معروضات لموديلات هذه السنة.' : 'No items available for this year.'}</li>
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
                                            style={{ ...nodeStyle, backgroundColor: isModelOpen ? '#f1f5f9' : 'transparent', fontSize: '13.5px', padding: '7px 12px' }}
                                          >
                                            <span>🚘 {modelName} {isEnginesLoading && <small style={{ color: '#e0872a' }}>{lang === 'ar' ? '(فحص...)' : '(Checking...)'}</small>}</span>
                                            <span style={{ fontSize: '10px', color: '#64748b' }}>{isModelOpen ? '▼' : isRtl ? '◀' : '▶'}</span>
                                          </div>

                                          {isModelOpen && (
                                            <ul style={{ listStyleType: 'none', padding: 0, [isRtl ? 'marginRight' : 'marginLeft']: '18px', marginTop: '6px' }}>
                                              {isEnginesLoading ? (
                                                <li style={{ padding: '6px 12px', fontSize: '12px', color: '#64748b' }}>🔄 {lang === 'ar' ? 'جاري الفحص...' : 'Checking...'}</li>
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
                                                        <span>⚡ {engine} {isCategoriesLoading && <small style={{ color: '#e0872a' }}>{lang === 'ar' ? '(فحص...)' : '(Checking...)'}</small>}</span>
                                                        <span style={{ fontSize: '10px' }}>{isEngineOpen ? '▼' : isRtl ? '◀' : '▶'}</span>
                                                      </div>

                                                      {isEngineOpen && (
                                                        <ul style={{ listStyleType: 'none', padding: 0, [isRtl ? 'marginRight' : 'marginLeft']: '18px', marginTop: '6px' }}>
                                                          {isCategoriesLoading ? (
                                                            <li style={{ padding: '6px 12px', fontSize: '12px', color: '#64748b' }}>🔄 {lang === 'ar' ? 'جاري الفحص...' : 'Checking...'}</li>
                                                          ) : availableCategories.length === 0 ? (
                                                            <li style={{ padding: '6px 12px', fontSize: '12px', color: '#94a3b8' }}>{lang === 'ar' ? 'لا توجد أقسام متاحة.' : 'No categories available.'}</li>
                                                          ) : (
                                                            availableCategories.map((category: string) => {
                                                              const categoryKey = `cat_${make}_${year}_${model}_${engine}_${category}`;
                                                              const isCategoryOpen = !!expandedNodes[categoryKey];
                                                              const partsCacheKey = `parts_${make}_${year}_${model}_${engine}_${category}`;
                                                              const isPartsLoading = !!loadingNodes[partsCacheKey];
                                                              const categoryParts = nodeDataCache[partsCacheKey] || [];
                                                              const translatedCatName = CATEGORY_TRANSLATION[category] || category;

                                                              return (
                                                                <li key={category} style={{ marginBottom: '6px' }}>
                                                                  <div 
                                                                    onClick={() => toggleNode(categoryKey, () => fetchPartsForLeafNode(make, year, model, engine, category))} 
                                                                    style={{ ...nodeStyle, backgroundColor: isCategoryOpen ? '#fff3e2' : 'transparent', fontSize: '12.5px', color: '#c2410c', padding: '6px 10px', fontWeight: 'bold' }}
                                                                  >
                                                                    <span>📂 <AITranslatedText text={translatedCatName} lang={lang} /> {isPartsLoading && <small style={{ color: '#e0872a' }}>{lang === 'ar' ? '(جاري التحميل...)' : '(Loading...)'}</small>}</span>
                                                                    <span style={{ fontSize: '10px' }}>{isCategoryOpen ? '▼' : isRtl ? '◀' : '▶'}</span>
                                                                  </div>

                                                                  {isCategoryOpen && (
                                                                    <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                                      {isPartsLoading ? (
                                                                        <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>🔄 {lang === 'ar' ? 'جاري جلب القطع...' : 'Loading parts...'}</div>
                                                                      ) : categoryParts.length === 0 ? (
                                                                        <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>{lang === 'ar' ? 'لا توجد قطع معروضة هنا حالياً.' : 'No parts available here.'}</div>
                                                                      ) : (
                                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
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

      {/* مودال الفحص والتوافق للقطعة */}
      {fitmentModalPart && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', maxWidth: '500px', width: '100%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#1f3a5f', fontSize: '16px', fontWeight: 'bold' }}>
                🚗 {lang === 'ar' ? 'السيارات المتوافقة مع هذا البارت رقم' : 'Compatible Vehicles'}
              </h3>
              <button onClick={() => setFitmentModalPart(null)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
            </div>
            
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
              {lang === 'ar' ? 'القطعة:' : 'Part:'} <strong><AITranslatedText text={fitmentModalPart.name} lang={lang} /></strong> (PN: {fitmentModalPart.part_number || fitmentModalPart.code || fitmentModalPart.sku})
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {compatibleVehicles.map((v, i) => (
                <div key={i} style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12.5px', color: '#1f3a5f', fontWeight: '500' }}>
                  ✅ {translateMake[v.make] || v.make} - {translateModel[v.model] || v.model} ({v.year})
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* مودال طلب قطعة غير متوفرة */}
      {showRequestModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', maxWidth: '450px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#1f3a5f', fontSize: '16px', fontWeight: 'bold' }}>
                📩 {lang === 'ar' ? 'طلب قطعة غير متوفرة' : 'Request Unavailable Part'}
              </h3>
              <button onClick={() => setShowRequestModal(false)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
            </div>

            {reqSubmitted ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>✅</div>
                <h4 style={{ color: '#16a34a', margin: '0 0 8px 0' }}>{lang === 'ar' ? 'تم إرسال طلبك بنجاح!' : 'Request sent successfully!'}</h4>
                <p style={{ fontSize: '13px', color: '#64748b' }}>{lang === 'ar' ? 'سيتواصل معك الكراج فور توفر القطعة أو تقديم عرض سعر.' : 'Garage will contact you once quote is ready.'}</p>
              </div>
            ) : (
              <form onSubmit={handleInAppRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>
                    {lang === 'ar' ? 'القطعة المطلوبة:' : 'Requested Part:'}
                  </label>
                  <input type="text" value={activeSearchQuery} disabled style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', backgroundColor: '#f8fafc', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>
                    {lang === 'ar' ? 'رقم الجوال:' : 'Phone Number:'}
                  </label>
                  <input type="tel" required value={custPhone} onChange={(e) => setCustPhone(e.target.value)} placeholder="05xxxxxxxx" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>
                    {lang === 'ar' ? 'تفاصيل إضافية (رقم الهيكل / السنة):' : 'Additional Notes:'}
                  </label>
                  <textarea rows={3} value={custNotes} onChange={(e) => setCustNotes(e.target.value)} placeholder={lang === 'ar' ? 'اكتب موديل السيارة أو رقم الشاسي إن وجد...' : 'Write car model or VIN...'} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>

                <button type="submit" disabled={isSubmittingReq} style={{ padding: '12px', backgroundColor: '#e0872a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px' }}>
                  {isSubmittingReq ? (lang === 'ar' ? 'جاري الإرسال...' : 'Sending...') : (lang === 'ar' ? 'إرسال الطلب الآن' : 'Submit Request')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
