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

            {/* 🎯 إضافة تقييم واسم الكراج المدمجة */}
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

  return (
    <aside style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 4px 25px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', direction: isRtl ? 'rtl' : 'ltr' }}>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '260px' }}>
            <input 
              type="text" 
              placeholder={isRtl ? "ابحث برقم القطعة، الكود، أو الاسم..." : "Search by Part Number, Code, or Name..."} 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '2px solid #1f3a5f', outline: 'none', fontSize: '13.5px' }}
            />
            <button type="submit" style={{ padding: '12px 20px', backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              🔍 {isRtl ? 'بحث' : 'Search'}
            </button>
          </form>
          {activeSearchQuery && (
            <button onClick={clearSearch} style={{ padding: '12px 16px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              ✕ {isRtl ? 'إلغاء البحث' : 'Clear'}
            </button>
          )}
        </div>

        {activeSearchQuery ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#1f3a5f', fontSize: '16px' }}>
                {isRtl ? `نتائج البحث عن: "${activeSearchQuery}"` : `Search Results for: "${activeSearchQuery}"`} ({searchResults.length})
              </h3>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '12px' }}>
                <option value="default">{isRtl ? 'الترتيب الافتراضي' : 'Default Sorting'}</option>
                <option value="price_asc">{isRtl ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}</option>
                <option value="price_desc">{isRtl ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}</option>
              </select>
            </div>

            {searchResults.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {searchResults.map(part => renderPartCard(part))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e0' }}>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '15px' }}>
                  {isRtl ? 'عذراً، لم نجد أي قطعة تطابق بحثك حالياً.' : 'No parts matched your search.'}
                </p>
                <button onClick={() => setShowRequestModal(true)} style={{ padding: '12px 24px', backgroundColor: '#e0872a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                  ➕ {isRtl ? 'اطلب هذه القطعة بشكل خاص' : 'Request this Part Specially'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <h3 style={{ margin: '0 0 15px 0', color: '#1f3a5f', fontSize: '16px', fontWeight: 'bold' }}>
              🚗 {isRtl ? 'اختر شركة السيارة' : 'Select Car Make'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.keys(carData).map((make) => {
                const makeKey = `make_${make}`;
                const isMakeExpanded = !!expandedNodes[makeKey];
                const availableYears = nodeDataCache[`years_${make}`] || [];

                return (
                  <div key={make} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                    <div 
                      style={{ ...nodeStyle, backgroundColor: isMakeExpanded ? '#f1f5f9' : '#ffffff' }}
                      onClick={() => toggleNode(makeKey, () => fetchYearsForMake(make))}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {MAKE_DOMAINS[make] && (
                          <img 
                            src={`https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${MAKE_DOMAINS[make]}&size=128`} 
                            alt={make} 
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} 
                            style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                          />
                        )}
                        <span style={{ fontWeight: 'bold', color: '#1f3a5f', fontSize: '14px' }}>{make}</span>
                      </div>
                      <span style={{ color: '#94a3b8', fontSize: '12px' }}>{isMakeExpanded ? '▲' : '▼'}</span>
                    </div>

                    {isMakeExpanded && (
                      <div style={{ padding: '10px 15px', backgroundColor: '#fafafa', borderTop: '1px solid #f1f5f9' }}>
                        {loadingNodes[`years_${make}`] ? (
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{isRtl ? 'جاري التحميل...' : 'Loading...'}</div>
                        ) : availableYears.map((year: string) => {
                          const yearKey = `${makeKey}_year_${year}`;
                          const isYearExpanded = !!expandedNodes[yearKey];
                          const availableModels = nodeDataCache[`models_${make}_${year}`] || [];

                          return (
                            <div key={year} style={{ margin: '6px 0' }}>
                              <div 
                                style={{ ...nodeStyle, backgroundColor: isYearExpanded ? '#e2e8f0' : '#ffffff', border: '1px solid #cbd5e0' }}
                                onClick={() => toggleNode(yearKey, () => fetchModelsForYear(make, year))}
                              >
                                <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#334155' }}>📅 {year}</span>
                                <span style={{ color: '#94a3b8', fontSize: '11px' }}>{isYearExpanded ? '▲' : '▼'}</span>
                              </div>

                              {isYearExpanded && (
                                <div style={{ padding: '8px 12px', borderRight: isRtl ? '2px solid #1f3a5f' : 'none', borderLeft: !isRtl ? '2px solid #1f3a5f' : 'none' }}>
                                  {loadingNodes[`models_${make}_${year}`] ? (
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>{isRtl ? 'جاري التحميل...' : 'Loading...'}</div>
                                  ) : availableModels.map((model: string) => {
                                    const modelKey = `${yearKey}_model_${model}`;
                                    const isModelExpanded = !!expandedNodes[modelKey];
                                    const availableEngines = nodeDataCache[`engines_${make}_${year}_${model}`] || [];

                                    return (
                                      <div key={model} style={{ margin: '4px 0' }}>
                                        <div 
                                          style={{ ...nodeStyle, backgroundColor: isModelExpanded ? '#f8fafc' : '#ffffff', border: '1px solid #e2e8f0' }}
                                          onClick={() => toggleNode(modelKey, () => fetchEnginesForVehicle(make, year, model))}
                                        >
                                          <span style={{ fontSize: '12.5px', color: '#1f3a5f', fontWeight: '600' }}>🚘 {model}</span>
                                          <span style={{ color: '#94a3b8', fontSize: '10px' }}>{isModelExpanded ? '▲' : '▼'}</span>
                                        </div>

                                        {isModelExpanded && (
                                          <div style={{ padding: '6px 10px' }}>
                                            {loadingNodes[`engines_${make}_${year}_${model}`] ? (
                                              <div style={{ fontSize: '11px', color: '#64748b' }}>{isRtl ? 'جاري التحميل...' : 'Loading...'}</div>
                                            ) : availableEngines.map((engine: string) => {
                                              const engineKey = `${modelKey}_eng_${engine}`;
                                              const isEngineExpanded = !!expandedNodes[engineKey];
                                              const availableMainCats = nodeDataCache[`maincats_${make}_${year}_${model}_${engine}`] || [];

                                              return (
                                                <div key={engine} style={{ margin: '4px 0' }}>
                                                  <div 
                                                    style={{ ...nodeStyle, backgroundColor: isEngineExpanded ? '#e0f2fe' : '#f1f5f9' }}
                                                    onClick={() => toggleNode(engineKey, () => fetchMainCategoriesForEngine(make, year, model, engine))}
                                                  >
                                                    <span style={{ fontSize: '12px', color: '#0369a1', fontWeight: 'bold' }}>⚙️ {engine}</span>
                                                    <span style={{ color: '#0369a1', fontSize: '10px' }}>{isEngineExpanded ? '▲' : '▼'}</span>
                                                  </div>

                                                  {isEngineExpanded && (
                                                    <div style={{ padding: '6px 8px' }}>
                                                      {loadingNodes[`maincats_${make}_${year}_${model}_${engine}`] ? (
                                                        <div style={{ fontSize: '11px', color: '#64748b' }}>{isRtl ? 'جاري التحميل...' : 'Loading...'}</div>
                                                      ) : availableMainCats.map((mainCat: string) => {
                                                        const mainCatKey = `${engineKey}_maincat_${mainCat}`;
                                                        const isMainCatExpanded = !!expandedNodes[mainCatKey];
                                                        const availableSubCats = nodeDataCache[`subcats_${make}_${year}_${model}_${engine}_${mainCat}`] || [];

                                                        return (
                                                          <div key={mainCat} style={{ margin: '4px 0' }}>
                                                            <div 
                                                              style={{ ...nodeStyle, backgroundColor: isMainCatExpanded ? '#fef3c7' : '#ffffff', border: '1px solid #fde68a' }}
                                                              onClick={() => toggleNode(mainCatKey, () => fetchSubCategoriesForMain(make, year, model, engine, mainCat))}
                                                            >
                                                              <span style={{ fontSize: '11.5px', color: '#92400e', fontWeight: 'bold' }}>📁 {CATEGORY_TRANSLATION[mainCat] || mainCat}</span>
                                                              <span style={{ color: '#92400e', fontSize: '10px' }}>{isMainCatExpanded ? '▲' : '▼'}</span>
                                                            </div>

                                                            {isMainCatExpanded && (
                                                              <div style={{ padding: '6px 8px' }}>
                                                                {loadingNodes[`subcats_${make}_${year}_${model}_${engine}_${mainCat}`] ? (
                                                                  <div style={{ fontSize: '11px', color: '#64748b' }}>{isRtl ? 'جاري التحميل...' : 'Loading...'}</div>
                                                                ) : availableSubCats.map((subCat: string) => {
                                                                  const subCatKey = `${mainCatKey}_subcat_${subCat}`;
                                                                  const isSubCatExpanded = !!expandedNodes[subCatKey];
                                                                  const partsList = nodeDataCache[`parts_${make}_${year}_${model}_${engine}_${mainCat}_${subCat}`] || [];

                                                                  return (
                                                                    <div key={subCat} style={{ margin: '4px 0' }}>
                                                                      <div 
                                                                        style={{ ...nodeStyle, backgroundColor: isSubCatExpanded ? '#f0fdf4' : '#ffffff', border: '1px solid #bbf7d0' }}
                                                                        onClick={() => toggleNode(subCatKey, () => fetchPartsForSubCategory(make, year, model, engine, mainCat, subCat))}
                                                                      >
                                                                        <span style={{ fontSize: '11px', color: '#166534', fontWeight: 'bold' }}>📂 {subCat}</span>
                                                                        <span style={{ color: '#166534', fontSize: '10px' }}>{isSubCatExpanded ? '▲' : '▼'}</span>
                                                                      </div>

                                                                      {isSubCatExpanded && (
                                                                        <div style={{ padding: '8px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                                                                          {loadingNodes[`parts_${make}_${year}_${model}_${engine}_${mainCat}_${subCat}`] ? (
                                                                            <div style={{ fontSize: '11px', color: '#64748b' }}>{isRtl ? 'جاري جلب القطع...' : 'Fetching parts...'}</div>
                                                                          ) : partsList.length > 0 ? (
                                                                            partsList.map((part: any) => renderPartCard(part))
                                                                          ) : (
                                                                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{isRtl ? 'لا توجد قطع حالياً لهذا القسم' : 'No parts in this category'}</div>
                                                                          )}
                                                                        </div>
                                                                      )}
                                                                    </div>
                                                                  );
                                                                })}
                                                              </div>
                                                            )}
                                                          </div>
                                                        );
                                                      })}
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showRequestModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', maxWidth: '400px', width: '90%', direction: isRtl ? 'rtl' : 'ltr' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#1f3a5f' }}>{isRtl ? 'طلب قطعة غير متوفرة' : 'Request Unavailable Part'}</h3>
            {reqSubmitted ? (
              <div>
                <p style={{ color: '#16a34a', fontWeight: 'bold' }}>{isRtl ? 'تم إرسال طلبك بنجاح! سنتواصل معك قريباً.' : 'Request sent successfully! We will contact you soon.'}</p>
                <button onClick={() => { setShowRequestModal(false); setReqSubmitted(false); }} style={{ width: '100%', padding: '10px', backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>{isRtl ? 'إغلاق' : 'Close'}</button>
              </div>
            ) : (
              <form onSubmit={handleInAppRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input type="text" placeholder={isRtl ? 'رقم الهاتف *' : 'Phone Number *'} value={custPhone} onChange={(e) => setCustPhone(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0' }} required />
                <textarea placeholder={isRtl ? 'ملاحظات إضافية...' : 'Additional Notes...'} value={custNotes} onChange={(e) => setCustNotes(e.target.value)} rows={3} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="submit" disabled={isSubmittingReq} style={{ flex: 1, padding: '10px', backgroundColor: '#e0872a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                    {isSubmittingReq ? (isRtl ? 'جاري الإرسال...' : 'Sending...') : (isRtl ? 'إرسال الطلب' : 'Send Request')}
                  </button>
                  <button type="button" onClick={() => setShowRequestModal(false)} style={{ padding: '10px 16px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>{isRtl ? 'إلغاء' : 'Cancel'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
