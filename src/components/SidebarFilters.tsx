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
  "Electrical-Bulb & Socket": "اللمبات والقواعد",
  "Electrical-Connector": "الوصلات الكهربائية",
  "Electrical-Switch & Relay": "المفاتيح والمرحلات",
  "Engine": "المحرك (الماكينة)",
  "Exhaust & Emission": "نظام العادم (الشكمان)",
  "Fuel & Air": "نظام الوقود والهواء",
  "Heat & Air Conditioning": "التكييف والتدفئة",
  "Ignition": "نظام الإشعال (البواجي)",
  "Interior": "المقصورة الداخلية (الديكور)",
  "Steering": "نظام التوجيه (الدريكسيون)",
  "Suspension": "نظام التعليق (المساعدين)",
  "Transmission-Automatic": "ناقل الحركة (الجيربكس)",
  "Wheel": "العجلات (الجنوط)",
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
    searchTerm, setSearchTerm, 
    filterMake, setFilterMake, filterModel, setFilterModel, filterYear, setFilterYear,
    filterCategory, setFilterCategory, addToCart 
  } = props;

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const [partQuantities, setPartQuantities] = useState<Record<number, number>>({});
  const [fitmentModalPart, setFitmentModalPart] = useState<any | null>(null);

  const [activeSearchQuery, setActiveSearchQuery] = useState<string>('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [custPhone, setCustPhone] = useState('');
  const [custNotes, setCustNotes] = useState('');
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);
  const [reqSubmitted, setReqSubmitted] = useState(false);

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

  const toggleNode = (nodeKey: string, make?: string, model?: string, year?: string, category?: string) => {
    const willBeOpen = !expandedNodes[nodeKey];
    setExpandedNodes(prev => ({ ...prev, [nodeKey]: willBeOpen }));

    if (make !== undefined) { setFilterMake(willBeOpen ? make : ''); setFilterModel(''); setFilterYear(''); setFilterCategory(''); }
    if (model !== undefined) { setFilterModel(willBeOpen ? model : ''); setFilterYear(''); setFilterCategory(''); }
    if (year !== undefined) { setFilterYear(willBeOpen ? year : ''); setFilterCategory(''); }
    if (category !== undefined) { setFilterCategory(willBeOpen ? category : ''); }
  };

  const isRtl = lang === 'ar';

  // 🔥 استخدام محرك البحث الموسع والدقيق الذكي (RockAuto Search Logic)
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
          notes: custNotes || 'طلب قطعة غيار غير متوفرة'
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
            
            <div 
              onClick={(e) => { e.stopPropagation(); setFitmentModalPart(part); }}
              style={{ 
                fontSize: '11.5px', color: '#2b6cb0', backgroundColor: '#ebf8ff', 
                padding: '3px 8px', borderRadius: '6px', width: 'fit-content', 
                marginBottom: '6px', fontWeight: 'bold', cursor: 'pointer', border: '1px solid #bee3f8' 
              }}
            >
              🔍 Part #: {partNo}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#dd6b20', fontWeight: 'bold', fontSize: '16.5px' }}>{part.price} QAR</span>
              
              <span style={{ 
                fontSize: '11px', 
                fontWeight: 'bold', 
                color: isOutOfStock ? '#e53e3e' : '#2f855a', 
                backgroundColor: isOutOfStock ? '#fff5f5' : '#f0fff4', 
                padding: '2px 8px', 
                borderRadius: '6px',
                border: isOutOfStock ? '1px solid #fed7d7' : '1px solid #c6f6d5'
              }}>
                {isOutOfStock ? (lang === 'ar' ? 'نفدت الكمية' : 'Out of Stock') : `${lang === 'ar' ? 'المتوفر:' : 'Stock:'} ${maxStock}`}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e0', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
            <button 
              onClick={(e) => { e.stopPropagation(); changeQty(part, -1); }}
              disabled={qty <= 1 || isOutOfStock}
              style={{ 
                width: '32px', height: '32px', border: 'none', 
                backgroundColor: (qty <= 1 || isOutOfStock) ? '#edf2f7' : '#e2e8f0', 
                color: (qty <= 1 || isOutOfStock) ? '#a0aec0' : '#2d3748', 
                fontWeight: 'bold', fontSize: '16px', 
                cursor: (qty <= 1 || isOutOfStock) ? 'not-allowed' : 'pointer' 
              }}
            >
              -
            </button>

            <span style={{ width: '32px', textAlign: 'center', fontWeight: 'bold', fontSize: '13px', color: '#2d3748' }}>
              {isOutOfStock ? 0 : qty}
            </span>

            <button 
              onClick={(e) => { e.stopPropagation(); changeQty(part, 1); }}
              disabled={qty >= maxStock || isOutOfStock}
              style={{ 
                width: '32px', height: '32px', border: 'none', 
                backgroundColor: (qty >= maxStock || isOutOfStock) ? '#edf2f7' : '#e2e8f0', 
                color: (qty >= maxStock || isOutOfStock) ? '#a0aec0' : '#2d3748', 
                fontWeight: 'bold', fontSize: '16px', 
                cursor: (qty >= maxStock || isOutOfStock) ? 'not-allowed' : 'pointer' 
              }}
            >
              +
            </button>
          </div>

          {addToCart && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (!isOutOfStock) addToCart(part, qty);
              }}
              disabled={isOutOfStock}
              style={{ 
                flex: 1,
                backgroundColor: isOutOfStock ? '#a0aec0' : '#38a169', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                padding: '9px 12px', 
                fontSize: '13px', 
                fontWeight: 'bold', 
                cursor: isOutOfStock ? 'not-allowed' : 'pointer', 
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              🛒 {isOutOfStock ? (lang === 'ar' ? 'غير متوفر' : 'Unavailable') : (lang === 'ar' ? 'أضف للسلة' : 'Add to Cart')}
            </button>
          )}
        </div>

      </div>
    );
  };

  return (
    <aside style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{  
        backgroundColor: 'white',  
        padding: '25px',  
        borderRadius: '20px',  
        boxShadow: '0 4px 25px rgba(0,0,0,0.05)',
        border: '1px solid #edf2f7',
        direction: isRtl ? 'rtl' : 'ltr',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        
        {/* شريط البحث المطور */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              placeholder={lang === 'ar' ? 'ابحث برقم القطعة (PN)، الكود، أو المصطلح (مثل: دينمو، سلف، كمبيوتر، BCM)...' : 'Search Part Number, Code, or Term (e.g. Alternator, Starter, ECM, BCM)...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: '2px solid #3182ce', outline: 'none', fontSize: '15px', boxSizing: 'border-box', backgroundColor: '#f8fafc', direction: isRtl ? 'rtl' : 'ltr' }}
            />
            {searchTerm && (
              <button type="button" onClick={clearSearch} style={{ position: 'absolute', [isRtl ? 'left' : 'right']: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: '18px', color: '#a0aec0', cursor: 'pointer' }}>✖</button>
            )}
          </div>
          <button type="submit" style={{ padding: '0 24px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🔍 {lang === 'ar' ? 'بحث' : 'Search'}
          </button>
        </form>

        {/* نتائج البحث */}
        {activeSearchQuery ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #edf2f7', paddingBottom: '12px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#1a365d', fontSize: '18px', fontWeight: 'bold' }}>
                  🔎 {lang === 'ar' ? `نتائج البحث الذكي عن: "${activeSearchQuery}"` : `Smart Search Results for: "${activeSearchQuery}"`}
                </h3>
                <span style={{ fontSize: '13px', color: '#718096', marginTop: '4px', display: 'block' }}>
                  {lang === 'ar' ? `تم العثور على (${searchResults.length}) قطعة متطابقة` : `Found (${searchResults.length}) matching parts`}
                </span>
              </div>
              <button onClick={clearSearch} style={{ padding: '8px 16px', backgroundColor: '#edf2f7', color: '#2d3748', border: '1px solid #cbd5e0', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
                ↩️ {lang === 'ar' ? 'العودة للكتالوج' : 'Back to Catalog'}
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>🚫</span>
                <h4 style={{ margin: '0 0 8px 0', color: '#2d3748', fontSize: '16px' }}>{lang === 'ar' ? `عفواً، لا توجد قطع متوفرة لهذا البحث ("${activeSearchQuery}")` : `No parts found matching "${activeSearchQuery}"`}</h4>
                <button onClick={() => { setReqSubmitted(false); setShowRequestModal(true); }} style={{ padding: '12px 24px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', marginTop: '15px' }}>
                  📩 {lang === 'ar' ? 'إرسال طلب قطعة داخل البرنامج' : 'Send In-App Request'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '18px' }}>
                {searchResults.map(part => renderPartCard(part))}
              </div>
            )}
          </div>
        ) : (
          /* الشجرة */
          <>
            <h3 style={{ margin: '0 0 16px 0', color: '#1a365d', borderBottom: '2px solid #3182ce', paddingBottom: '10px', fontSize: '17px', fontWeight: 'bold' }}>
              📋 {lang === 'ar' ? 'تصفح حسب نوع السيارة' : 'Browse by Vehicle'}
            </h3>

            <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
              {Object.keys(carData).map(make => {
                const makeKey = `make_${make}`;
                const isMakeOpen = !!expandedNodes[makeKey] || filterMake === make;
                const makeName = isRtl ? make : (translateMake[make] || make);

                return (
                  <li key={make} style={{ marginBottom: '8px' }}>
                    <div onClick={() => toggleNode(makeKey, make)} style={{ ...nodeStyle, backgroundColor: isMakeOpen ? '#e2e8f0' : '#f7fafc', fontWeight: 'bold', padding: '10px 14px' }}>
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

                    {isMakeOpen && (
                      <ul style={{ listStyleType: 'none', padding: 0, [isRtl ? 'marginRight' : 'marginLeft']: '20px', marginTop: '6px' }}>
                        {carData[make]?.models.map((model: string) => {
                          const modelKey = `model_${make}_${model}`;
                          const isModelOpen = !!expandedNodes[modelKey] || (filterMake === make && filterModel === model);
                          const modelName = isRtl ? model : (translateModel[model] || model);

                          return (
                            <li key={model} style={{ marginBottom: '6px' }}>
                              <div onClick={() => toggleNode(modelKey, undefined, model)} style={{ ...nodeStyle, backgroundColor: isModelOpen ? '#edf2f7' : 'transparent', fontSize: '14px', padding: '8px 12px' }}>
                                <span>📂 {modelName}</span>
                                <span style={{ fontSize: '10px', color: '#718096' }}>{isModelOpen ? '▼' : isRtl ? '◀' : '▶'}</span>
                              </div>

                              {isModelOpen && (
                                <ul style={{ listStyleType: 'none', padding: 0, [isRtl ? 'marginRight' : 'marginLeft']: '20px', marginTop: '6px' }}>
                                  {years.map(year => {
                                    const yearKey = `year_${make}_${model}_${year}`;
                                    const isYearOpen = !!expandedNodes[yearKey] || (filterMake === make && filterModel === model && filterYear === year);

                                    return (
                                      <li key={year} style={{ marginBottom: '6px' }}>
                                        <div onClick={() => toggleNode(yearKey, undefined, undefined, year)} style={{ ...nodeStyle, backgroundColor: isYearOpen ? '#ebf8ff' : 'transparent', fontSize: '13.5px', color: '#2b6cb0', padding: '7px 12px' }}>
                                          <span>📅 {year}</span>
                                          <span style={{ fontSize: '10px' }}>{isYearOpen ? '▼' : isRtl ? '◀' : '▶'}</span>
                                        </div>

                                        {isYearOpen && (
                                          <ul style={{ listStyleType: 'none', padding: 0, [isRtl ? 'marginRight' : 'marginLeft']: '15px', marginTop: '6px' }}>
                                            {categories.map(category => {
                                              const categoryKey = `cat_${make}_${model}_${year}_${category}`;
                                              const isCategoryOpen = !!expandedNodes[categoryKey] || filterCategory === category;
                                              const translatedCategory = lang === 'ar' ? (CATEGORY_TRANSLATION[category] || category) : category;

                                              const filteredParts = inventory.filter(part =>  
                                                part.make === make &&  
                                                part.model === model &&  
                                                String(part.year) === String(year) &&  
                                                getPartCategory(part.name) === category
                                              );

                                              if (filteredParts.length === 0) return null;

                                              return (
                                                <li key={category} style={{ marginBottom: '6px' }}>
                                                  <div onClick={() => toggleNode(categoryKey, undefined, undefined, undefined, category)} style={{ ...nodeStyle, backgroundColor: isCategoryOpen ? '#fffaf0' : 'transparent', fontSize: '13px', color: '#2d3748', padding: '6px 10px', fontWeight: 'bold' }}>
                                                    <span>⚙️ {translatedCategory} <span style={{ fontSize: '11px', color: '#3182ce' }}>({filteredParts.length} قطع)</span></span>
                                                    <span style={{ fontSize: '10px', color: '#a0aec0' }}>{isCategoryOpen ? '▼' : isRtl ? '◀' : '▶'}</span>
                                                  </div>

                                                  {isCategoryOpen && (
                                                    <div style={{ padding: '16px', backgroundColor: '#fffaf0', borderRadius: '14px', border: '1px solid #feebc8', marginTop: '8px', marginBottom: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '15px', [isRtl ? 'marginRight' : 'marginLeft']: '10px' }}>
                                                      {filteredParts.map(part => renderPartCard(part))}
                                                    </div>
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
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}

      </div>

      {/* نافذة طلب قطعة غير متوفرة */}
      {showRequestModal && (
        <div onClick={() => setShowRequestModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '18px', padding: '24px', maxWidth: '460px', width: '100%', direction: isRtl ? 'rtl' : 'ltr' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #edf2f7', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#1a365d', fontWeight: 'bold' }}>📩 {lang === 'ar' ? 'طلب قطعة غير متوفرة' : 'Request Part'}</h3>
              <button onClick={() => setShowRequestModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#a0aec0' }}>✖</button>
            </div>

            {reqSubmitted ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <span style={{ fontSize: '50px', display: 'block', marginBottom: '10px' }}>✅</span>
                <h4 style={{ margin: '0 0 8px 0', color: '#2f855a' }}>{lang === 'ar' ? 'تم إرسال طلبك بنجاح!' : 'Request Sent!'}</h4>
                <button onClick={() => setShowRequestModal(false)} style={{ width: '100%', padding: '12px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {lang === 'ar' ? 'تم' : 'OK'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleInAppRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ backgroundColor: '#ebf8ff', padding: '12px', borderRadius: '10px', fontSize: '13.5px', color: '#2b6cb0' }}>
                  <strong>{lang === 'ar' ? 'القطعة المطلوبة:' : 'Requested Part:'}</strong> {activeSearchQuery}
                </div>
                <input type="tel" placeholder="رقم الهاتف" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required />
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
              <h3 style={{ margin: 0, fontSize: '18px', color: '#1a365d', fontWeight: 'bold' }}>🚘 {lang === 'ar' ? 'دليل توافق القطعة' : 'Fitment Guide'}</h3>
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
            <button onClick={() => setFitmentModalPart(null)} style={{ width: '100%', marginTop: '20px', padding: '12px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
              {lang === 'ar' ? 'إغلاق' : 'Close'}
            </button>
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
