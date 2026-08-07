import React, { useState } from 'react';
import { 
  getPartCategory, 
  matchesSmartSearch, 
  classifyPartTier 
} from '../utils/categoryHelper';
import { AITranslatedText } from './AITranslatedText';
import { PartMoreInfo } from './PartMoreInfo';

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

  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'default'>('default');
  const [partImageIndexes, setPartImageIndex] = useState<Record<number, number>>({});

  const [expandedPartCards, setExpandedPartCards] = useState<Record<number, boolean>>({});
  const [detailedPart, setDetailedPart] = useState<any | null>(null);

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
      navigator.share({ title: part.name, text: `قطعة غيار: ${part.name} - ${part.price} ر.ق`, url: shareUrl }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert(isRtl ? 'تم نسخ رابط القطعة حافظة الجهاز!' : 'Part link copied to clipboard!');
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
  };

  // 1️⃣ فك تجميع النطاقات الزمنية (2003-2006) إلى سنوات منفصلة
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

        const uniqueEngines = Array.from(new Set(filteredData.map((item: any) => item.engine && item.engine.trim() !== '' ? item.engine : (lang === 'ar' ? 'عام' : 'General')))) as string[];
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
          const pEng = p.engine && p.engine.trim() !== '' ? p.engine : (lang === 'ar' ? 'عام' : 'General');
          const matchEngine = pEng === engine || pEng === (lang === 'ar' ? 'عام' : 'General') || engine === (lang === 'ar' ? 'عام' : 'General');
          return matchYear && matchEngine;
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
          const pEng = p.engine && p.engine.trim() !== '' ? p.engine : (lang === 'ar' ? 'عام' : 'General');
          const matchEngine = pEng === engine || pEng === (lang === 'ar' ? 'عام' : 'General') || engine === (lang === 'ar' ? 'عام' : 'General');
          const matchCat = getPartCategory(p.name) === category || p.category === category || (p.category && p.category.includes(category));
          return matchYear && matchEngine && matchCat;
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
        const cleanPattern = nodeKey.replace(/^(make|year|model|eng|cat)_/, '');
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

  const searchResults = activeSearchQuery 
    ? processAndSortParts(inventory.filter(part => matchesSmartSearch(part, activeSearchQuery)))
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

      if (response.ok) setReqSubmitted(true);
    } catch (err) {} finally { setIsSubmittingReq(false); }
  };

  const renderPartCard = (part: any) => {
    const partNo = part.part_number || part.code || part.sku || part.id;
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

    const rawVehicles = inventory.filter(p => {
      const modalPN = (partNo || '').toString().trim().toLowerCase();
      const itemPN = (p.part_number || p.code || p.sku || '').toString().trim().toLowerCase();
      return modalPN && itemPN ? modalPN === itemPN : p.id === part.id;
    });

    const groupedFitmentMap: Record<string, { make: string; model: string; years: number[] }> = {};
    rawVehicles.forEach(v => {
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
            <img src={activeImage} alt={part.name} onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px', border: '1px solid #edf2f7' }} />
            {allImages.length > 1 && (
              <>
                <button onClick={(e) => handlePrevImage(part.id, allImages.length, e)} style={{ position: 'absolute', top: '35%', left: '-6px', backgroundColor: 'rgba(255,255,255,0.9)', border: '1px solid #cbd5e0', borderRadius: '50%', width: '20px', height: '20px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}>‹</button>
                <button onClick={(e) => handleNextImage(part.id, allImages.length, e)} style={{ position: 'absolute', top: '35%', right: '-6px', backgroundColor: 'rgba(255,255,255,0.9)', border: '1px solid #cbd5e0', borderRadius: '50%', width: '20px', height: '20px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}>›</button>
              </>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#1f3a5f', fontWeight: 'bold' }}>
              <AITranslatedText text={part.name} lang={lang} />
            </h4>

            <div style={{ fontSize: '11.5px', color: '#1f3a5f', backgroundColor: '#e8f2fc', padding: '2px 6px', borderRadius: '5px', fontWeight: 'bold', display: 'inline-block', marginBottom: '4px', border: '1px solid #bae6fd', fontFamily: 'monospace' }}>
              🔍 {isRtl ? 'رقم القطعة' : 'Part Number'}: {partNo}
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '10.5px', fontWeight: 'bold', color: tierInfo.tier === 'oem' ? '#0369a1' : '#c2410c', backgroundColor: tierInfo.badgeColor, padding: '1px 6px', borderRadius: '4px' }}>
                {part.part_type || (tierInfo.tier === 'oem' ? (isRtl ? 'أصلي' : 'OEM') : (isRtl ? tierInfo.label : 'Aftermarket'))}
              </span>
              <span style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#475569', backgroundColor: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>
                ✨ {part.part_condition || (isRtl ? 'نظيف' : 'Good Condition')}
              </span>
            </div>

            <div style={{ color: '#e0872a', fontWeight: '900', fontSize: '16.5px', marginTop: '4px' }}>
              {part.price} {isRtl ? 'ر.ق' : 'QAR'}
            </div>
          </div>
        </div>

        {/* 🔻 المربع المتمدد لأسفل عند ضغط المزيد */}
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
                      <th style={{ padding: '4px 8px' }}>الشركة</th>
                      <th style={{ padding: '4px 8px' }}>السيارة</th>
                      <th style={{ padding: '4px 8px' }}>السنوات</th>
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
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 4px 25px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', direction: isRtl ? 'rtl' : 'ltr' }}>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '260px' }}>
            <input 
              type="text" 
              placeholder={isRtl ? "ابحث برقم القطعة، الكود، أو الاسم (مثل: فلتر زيت)..." : "Search by Part Number, Code, or Name..."} 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '2px solid #1f3a5f', outline: 'none', fontSize: '13.5px' }} 
            />
            <button type="submit" style={{ padding: '0 20px', backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
              🔍 {isRtl ? 'بحث' : 'Search'}
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
                                                  const categoriesCacheKey = `categories_${make}_${year}_${model}_${engine}`;
                                                  const isCategoriesLoading = !!loadingNodes[categoriesCacheKey];
                                                  const availableCategories = nodeDataCache[categoriesCacheKey] || [];

                                                  return (
                                                    <li key={engine} style={{ marginBottom: '6px' }}>
                                                      <div onClick={() => toggleNode(engineKey, () => fetchCategoriesForEngine(make, year, model, engine))} style={{ ...nodeStyle, backgroundColor: isEngineOpen ? '#e8f2fc' : 'transparent', fontSize: '13px', color: '#1f3a5f', padding: '6px 10px', fontWeight: '500' }}>
                                                        <span>⚡ {engine} {isCategoriesLoading && <small style={{ color: '#e0872a' }}>{isRtl ? '(فحص...)' : '(Checking...)'}</small>}</span>
                                                        <span style={{ fontSize: '10px' }}>{isEngineOpen ? '▼' : isRtl ? '◀' : '▶'}</span>
                                                      </div>

                                                      {isEngineOpen && (
                                                        <ul style={{ listStyleType: 'none', padding: 0, [isRtl ? 'marginRight' : 'marginLeft']: '15px', marginTop: '6px' }}>
                                                          {isCategoriesLoading ? (
                                                            <li style={{ padding: '6px 12px', fontSize: '12px', color: '#64748b' }}>🔄 {isRtl ? 'جاري فحص الأقسام...' : 'Checking categories...'}</li>
                                                          ) : availableCategories.length === 0 ? (
                                                            <li style={{ padding: '6px 12px', fontSize: '12px', color: '#94a3b8' }}>{isRtl ? 'لا توجد أقسام متوفرة.' : 'No categories.'}</li>
                                                          ) : (
                                                            availableCategories.map((category: string) => {
                                                              const categoryKey = `cat_${make}_${year}_${model}_${engine}_${category}`;
                                                              const isCategoryOpen = !!expandedNodes[categoryKey];
                                                              const translatedCategory = CATEGORY_TRANSLATION[category] || category;
                                                              const partsCacheKey = `parts_${make}_${year}_${model}_${engine}_${category}`;
                                                              const isPartsLoading = !!loadingNodes[partsCacheKey];
                                                              const categoryParts = processAndSortParts(nodeDataCache[partsCacheKey] || []);

                                                              return (
                                                                <li key={category} style={{ marginBottom: '6px' }}>
                                                                  <div onClick={() => toggleNode(categoryKey, () => fetchPartsForLeafNode(make, year, model, engine, category))} style={{ ...nodeStyle, backgroundColor: isCategoryOpen ? '#fff7ed' : 'transparent', fontSize: '13px', color: '#1f3a5f', padding: '6px 10px', fontWeight: 'bold' }}>
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
