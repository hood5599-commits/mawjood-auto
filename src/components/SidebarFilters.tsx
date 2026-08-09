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
    lang, carData, inventory, 
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
      alert(isRtl ? 'تم نسخ رابط القطعة إلى حافظة الجهاز!' : 'Part link copied to clipboard!');
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
          const pEng = p.engine && p.engine.trim() !== '' ? p.engine : (lang === 'ar' ? 'عام' : 'General');
          const matchEngine = pEng === engine || pEng === (lang === 'ar' ? 'عام' : 'General') || engine === (lang === 'ar' ? 'عام' : 'General');
          return matchYear && matchEngine;
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
          const pEng = p.engine && p.engine.trim() !== '' ? p.engine : (lang === 'ar' ? 'عام' : 'General');
          const matchEngine = pEng === engine || pEng === (lang === 'ar' ? 'عام' : 'General') || engine === (lang === 'ar' ? 'عام' : 'General');
          
          const pCat = p.category || getPartCategory(p.name) || '';
          const pMainCat = pCat.includes('>') ? pCat.split('>')[0].trim() : pCat;
          
          return matchYear && matchEngine && pMainCat === mainCategory;
        });

        const subCategories = new Set<string>();
        filteredParts.forEach((p: any) => {
          const pCat = p.category || getPartCategory(p.name) || '';
          const subCat = pCat.includes('>') ? pCat.split('>')[1].trim() : (lang === 'ar' ? 'عام / أخرى' : 'General / Other');
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
          const pEng = p.engine && p.engine.trim() !== '' ? p.engine : (lang === 'ar' ? 'عام' : 'General');
          const matchEngine = pEng === engine || pEng === (lang === 'ar' ? 'عام' : 'General') || engine === (lang === 'ar' ? 'عام' : 'General');
          
          const pCat = p.category || getPartCategory(p.name) || '';
          const pMainCat = pCat.includes('>') ? pCat.split('>')[0].trim() : pCat;
          const pSubCat = pCat.includes('>') ? pCat.split('>')[1].trim() : (lang === 'ar' ? 'عام / أخرى' : 'General / Other');
          
          return matchYear && matchEngine && pMainCat === mainCategory && pSubCat === subCategory;
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

  const searchResults = activeSearchQuery 
    ? processAndSortParts(inventory.filter((part: any) => matchesSmartSearch(part, activeSearchQuery)))
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '4px 0' }}>
              <span style={{ color: '#e0872a', fontSize: '13px', fontWeight: 800 }}>⭐ 4.9</span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>({part.garage_name || (isRtl ? 'كراج معتمد' : 'Verified Garage')})</span>
            </div>

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

  const makesList = carData && Object.keys(carData).length > 0 ? Object.keys(carData) : Object.keys(MAKE_DOMAINS);

  return (
    <aside style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 4px 25px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', direction: isRtl ? 'rtl' : 'ltr' }}>
        
        {/* Search Bar & Sorting Control */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '260px' }}>
            <input 
              type="text" 
              placeholder={isRtl ? "ابحث برقم القطعة، الكود، أو الاسم..." : "Search by Part Number, Code, or Name..."} 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e0', fontSize: '14px', outline: 'none' }}
            />
            <button type="submit" style={{ padding: '12px 20px', backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              🔍 {isRtl ? 'بحث' : 'Search'}
            </button>
            {activeSearchQuery && (
              <button type="button" onClick={clearSearch} style={{ padding: '12px 16px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e0', borderRadius: '12px', cursor: 'pointer' }}>
                ✕
              </button>
            )}
          </form>

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e0', fontSize: '13px', backgroundColor: '#f8fafc', color: '#1f3a5f', fontWeight: 'bold', cursor: 'pointer' }}
          >
            <option value="default">{isRtl ? 'ترتيب الافتراضي' : 'Default Order'}</option>
            <option value="price_asc">{isRtl ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}</option>
            <option value="price_desc">{isRtl ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}</option>
          </select>
        </div>

        {/* View Mode 1: Search Results */}
        {activeSearchQuery ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0f9ff', padding: '12px 16px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
              <span style={{ fontWeight: 'bold', color: '#0369a1', fontSize: '14px' }}>
                🔍 {isRtl ? `نتائج البحث عن: "${activeSearchQuery}"` : `Search results for: "${activeSearchQuery}"`} ({searchResults.length})
              </span>
              <button onClick={clearSearch} style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                {isRtl ? 'إلغاء البحث' : 'Clear Search'}
              </button>
            </div>

            {searchResults.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {searchResults.map(renderPartCard)}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 20px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e0' }}>
                <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '16px' }}>
                  {isRtl ? 'لم نجد قطع غيار تطابق بحثك حالياً.' : 'No parts match your search at the moment.'}
                </p>
                <button 
                  onClick={() => setShowRequestModal(true)} 
                  style={{ padding: '12px 24px', backgroundColor: '#e0872a', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
                >
                  📝 {isRtl ? 'اطلب القطعة عبر طلب خاص' : 'Submit a Special Request'}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* View Mode 2: Dynamic Category & Vehicle Hierarchy Tree */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f3a5f', marginBottom: '12px' }}>
              🚗 {isRtl ? 'تصفح قطع الغيار حسب الشركة والسيارة' : 'Browse Parts by Make & Model'}
            </h3>

            {makesList.map((make) => {
              const makeKey = `make_${make}`;
              const isMakeExpanded = !!expandedNodes[makeKey];
              const yearsList = nodeDataCache[`years_${make}`] || [];
              const isYearsLoading = loadingNodes[`years_${make}`];

              return (
                <div key={make} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#ffffff' }}>
                  <div 
                    onClick={() => toggleNode(makeKey, () => fetchYearsForMake(make))}
                    style={{ ...nodeStyle, backgroundColor: isMakeExpanded ? '#f1f5f9' : '#ffffff' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img 
                        src={`https://www.google.com/s2/favicons?domain=${MAKE_DOMAINS[make] || 'car.com'}&sz=32`} 
                        alt={make} 
                        style={{ width: '20px', height: '20px', borderRadius: '4px' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <span style={{ fontWeight: 'bold', fontSize: '14.5px', color: '#1f3a5f' }}>{make}</span>
                    </div>
                    <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}>{isMakeExpanded ? '▲' : '▼'}</span>
                  </div>

                  {isMakeExpanded && (
                    <div style={{ padding: '8px 12px 12px 12px', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {isYearsLoading ? (
                        <div style={{ fontSize: '12px', color: '#64748b', padding: '6px' }}>⏳ {isRtl ? 'جاري التحميل...' : 'Loading years...'}</div>
                      ) : (
                        yearsList.map((year: string) => {
                          const yearKey = `year_${make}_${year}`;
                          const isYearExpanded = !!expandedNodes[yearKey];
                          const modelsList = nodeDataCache[`models_${make}_${year}`] || [];
                          const isModelsLoading = loadingNodes[`models_${make}_${year}`];

                          return (
                            <div key={year} style={{ border: '1px solid #cbd5e0', borderRadius: '10px', backgroundColor: 'white' }}>
                              <div 
                                onClick={() => toggleNode(yearKey, () => fetchModelsForYear(make, year))}
                                style={{ ...nodeStyle, padding: '6px 10px', backgroundColor: isYearExpanded ? '#e2e8f0' : '#ffffff' }}
                              >
                                <span style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#e0872a' }}>📅 {year}</span>
                                <span style={{ fontSize: '11px', color: '#64748b' }}>{isYearExpanded ? '▲' : '▼'}</span>
                              </div>

                              {isYearExpanded && (
                                <div style={{ padding: '6px 10px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {isModelsLoading ? (
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>⏳ {isRtl ? 'جاري التحميل...' : 'Loading models...'}</div>
                                  ) : (
                                    modelsList.map((model: string) => {
                                      const modelKey = `model_${make}_${year}_${model}`;
                                      const isModelExpanded = !!expandedNodes[modelKey];
                                      const enginesList = nodeDataCache[`engines_${make}_${year}_${model}`] || [];
                                      const isEnginesLoading = loadingNodes[`engines_${make}_${year}_${model}`];

                                      return (
                                        <div key={model} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white' }}>
                                          <div 
                                            onClick={() => toggleNode(modelKey, () => fetchEnginesForVehicle(make, year, model))}
                                            style={{ ...nodeStyle, padding: '6px 8px' }}
                                          >
                                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1f3a5f' }}>🚘 {model}</span>
                                            <span style={{ fontSize: '10px', color: '#64748b' }}>{isModelExpanded ? '▲' : '▼'}</span>
                                          </div>

                                          {isModelExpanded && (
                                            <div style={{ padding: '6px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                              {isEnginesLoading ? (
                                                <div style={{ fontSize: '11.5px', color: '#64748b' }}>⏳ {isRtl ? 'جاري التحميل...' : 'Loading engines...'}</div>
                                              ) : (
                                                enginesList.map((engine: string) => {
                                                  const engKey = `eng_${make}_${year}_${model}_${engine}`;
                                                  const isEngExpanded = !!expandedNodes[engKey];
                                                  const mainCatsList = nodeDataCache[`maincats_${make}_${year}_${model}_${engine}`] || [];
                                                  const isMainCatsLoading = loadingNodes[`maincats_${make}_${year}_${model}_${engine}`];

                                                  return (
                                                    <div key={engine} style={{ border: '1px solid #f1f5f9', borderRadius: '6px' }}>
                                                      <div 
                                                        onClick={() => toggleNode(engKey, () => fetchMainCategoriesForEngine(make, year, model, engine))}
                                                        style={{ ...nodeStyle, padding: '5px 8px', backgroundColor: '#f0fdf4' }}
                                                      >
                                                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#166534' }}>⚙️ {engine}</span>
                                                        <span style={{ fontSize: '10px', color: '#64748b' }}>{isEngExpanded ? '▲' : '▼'}</span>
                                                      </div>

                                                      {isEngExpanded && (
                                                        <div style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                          {isMainCatsLoading ? (
                                                            <div style={{ fontSize: '11px', color: '#64748b' }}>⏳ {isRtl ? 'جاري التحميل...' : 'Loading categories...'}</div>
                                                          ) : (
                                                            mainCatsList.map((mainCat: string) => {
                                                              const mainCatKey = `maincat_${make}_${year}_${model}_${engine}_${mainCat}`;
                                                              const isMainCatExpanded = !!expandedNodes[mainCatKey];
                                                              const subCatsList = nodeDataCache[`subcats_${make}_${year}_${model}_${engine}_${mainCat}`] || [];
                                                              const isSubCatsLoading = loadingNodes[`subcats_${make}_${year}_${model}_${engine}_${mainCat}`];

                                                              return (
                                                                <div key={mainCat} style={{ border: '1px dashed #cbd5e0', borderRadius: '6px' }}>
                                                                  <div 
                                                                    onClick={() => toggleNode(mainCatKey, () => fetchSubCategoriesForMain(make, year, model, engine, mainCat))}
                                                                    style={{ ...nodeStyle, padding: '5px 8px', backgroundColor: '#fdf4ff' }}
                                                                  >
                                                                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#86198f' }}>
                                                                      📦 {CATEGORY_TRANSLATION[mainCat] || mainCat}
                                                                    </span>
                                                                    <span style={{ fontSize: '10px', color: '#64748b' }}>{isMainCatExpanded ? '▲' : '▼'}</span>
                                                                  </div>

                                                                  {isMainCatExpanded && (
                                                                    <div style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                                      {isSubCatsLoading ? (
                                                                        <div style={{ fontSize: '11px', color: '#64748b' }}>⏳ {isRtl ? 'جاري التحميل...' : 'Loading subcategories...'}</div>
                                                                      ) : (
                                                                        subCatsList.map((subCat: string) => {
                                                                          const subCatKey = `subcat_${make}_${year}_${model}_${engine}_${mainCat}_${subCat}`;
                                                                          const isSubCatExpanded = !!expandedNodes[subCatKey];
                                                                          const partsList = nodeDataCache[`parts_${make}_${year}_${model}_${engine}_${mainCat}_${subCat}`] || [];
                                                                          const isPartsLoading = loadingNodes[`parts_${make}_${year}_${model}_${engine}_${mainCat}_${subCat}`];

                                                                          return (
                                                                            <div key={subCat} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                                                                              <div 
                                                                                onClick={() => toggleNode(subCatKey, () => fetchPartsForSubCategory(make, year, model, engine, mainCat, subCat))}
                                                                                style={{ ...nodeStyle, padding: '4px 8px', backgroundColor: '#f8fafc' }}
                                                                              >
                                                                                <span style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#0369a1' }}>🔹 {subCat}</span>
                                                                                <span style={{ fontSize: '10px', color: '#64748b' }}>{isSubCatExpanded ? '▲' : '▼'}</span>
                                                                              </div>

                                                                              {isSubCatExpanded && (
                                                                                <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                                                  {isPartsLoading ? (
                                                                                    <div style={{ fontSize: '11px', color: '#64748b' }}>⏳ {isRtl ? 'جاري التحميل...' : 'Loading parts...'}</div>
                                                                                  ) : partsList.length > 0 ? (
                                                                                    processAndSortParts(partsList).map(renderPartCard)
                                                                                  ) : (
                                                                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{isRtl ? 'لا توجد قطع غيار متوفرة في هذه الفئة حالياً' : 'No parts available in this subcategory'}</div>
                                                                                  )}
                                                                                </div>
                                                                              )}
                                                                            </div>
                                                                          );
                                                                        })
                                                                      )}
                                                                    </div>
                                                                  )}
                                                                </div>
                                                              );
                                                            })
                                                          )}
                                                        </div>
                                                      )}
                                                    </div>
                                                  );
                                                })
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Special Request Modal */}
      {showRequestModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', maxWidth: '420px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', direction: isRtl ? 'rtl' : 'ltr' }}>
            {reqSubmitted ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f3a5f', marginBottom: '8px' }}>
                  {isRtl ? 'تم إرسال طلبك بنجاح!' : 'Request Submitted Successfully!'}
                </h3>
                <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '20px' }}>
                  {isRtl ? 'سيتواصل معك فريقنا قريباً لتوفير القطعة المطلوبة بأفضل سعر.' : 'Our team will contact you shortly with the best available offer.'}
                </p>
                <button 
                  onClick={() => { setShowRequestModal(false); setReqSubmitted(false); setCustPhone(''); setCustNotes(''); }} 
                  style={{ width: '100%', padding: '10px', backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {isRtl ? 'إغلاق' : 'Close'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleInAppRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold', color: '#1f3a5f' }}>
                    📝 {isRtl ? 'طلب قطعة غير متوفرة' : 'Request Unavailable Part'}
                  </h3>
                  <button type="button" onClick={() => setShowRequestModal(false)} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}>✕</button>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>
                    {isRtl ? 'القطعة المطلوبة:' : 'Requested Part:'}
                  </label>
                  <input type="text" readOnly value={activeSearchQuery} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', backgroundColor: '#f8fafc', fontSize: '13px', fontWeight: 'bold' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>
                    {isRtl ? 'رقم الجوال *' : 'Phone Number *'}
                  </label>
                  <input 
                    type="tel" 
                    required 
                    placeholder="e.g. 55000000" 
                    value={custPhone} 
                    onChange={(e) => setCustPhone(e.target.value)} 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px' }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>
                    {isRtl ? 'ملاحظات إضافية (موديل السيارة، رقم الهيكل VIN...)' : 'Additional Notes (Vehicle Model, VIN...)'}
                  </label>
                  <textarea 
                    rows={3} 
                    value={custNotes} 
                    onChange={(e) => setCustNotes(e.target.value)} 
                    placeholder={isRtl ? 'أدخل التفاصيل لتسريع توفير القطعة...' : 'Provide details to help us source the part faster...'} 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px', resize: 'vertical' }} 
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button 
                    type="submit" 
                    disabled={isSubmittingReq} 
                    style={{ flex: 1, padding: '12px', backgroundColor: '#e0872a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    {isSubmittingReq ? (isRtl ? 'جاري الإرسال...' : 'Submitting...') : (isRtl ? 'إرسال الطلب' : 'Submit Request')}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowRequestModal(false)} 
                    style={{ padding: '12px 16px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e0', borderRadius: '10px', cursor: 'pointer' }}
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
