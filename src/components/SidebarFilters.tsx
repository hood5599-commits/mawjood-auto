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
  "Belt Drive": "السيور والبكرات", "Body & Lamp Assembly": "الهيكل والإضاءة", "Brake & Wheel Hub": "الفرامل ومحاور العجلات",
  "Cooling System": "نظام التبريد (الراديتر)", "Drivetrain": "نظام الدفع", "Electrical": "الكهرباء",
  "Engine": "المحرك (الماكينة)", "Exhaust & Emission": "نظام العادم (الشكمان)", "Fuel & Air": "نظام الوقود والهواء",
  "Heat & Air Conditioning": "التكييف والتدفئة", "Ignition": "نظام الإشعال (البواجي)", "Interior": "المقصورة الداخلية",
  "Steering": "نظام التوجيه", "Suspension": "نظام التعليق", "Transmission-Automatic": "ناقل الحركة",
  "Wheel": "العجلات والجنوط", "Wiper & Washer": "المساحات وبخاخات المياه"
};

const MAKE_DOMAINS: Record<string, string> = {
  "تويوتا": "toyota.com", "هيونداي": "hyundai.com", "نيسان": "nissan-global.com", "فورد": "ford.com",
  "شفروليه": "chevrolet.com", "كيا": "kia.com", "هوندا": "honda.com", "لكزس": "lexus.com"
};

export const SidebarFilters: React.FC<SidebarProps> = (props) => {
  const { 
    lang, carData, years, translateMake, translateModel, categories, inventory, 
    searchTerm, setSearchTerm, filterMake, setFilterMake, filterModel, setFilterModel, 
    filterYear, setFilterYear, filterCategory, setFilterCategory, addToCart 
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

  const clearSearch = () => { setSearchTerm(''); setActiveSearchQuery(''); };

  const toggleNode = (nodeKey: string, make?: string, model?: string, year?: string, category?: string) => {
    const willBeOpen = !expandedNodes[nodeKey];
    setExpandedNodes(prev => ({ ...prev, [nodeKey]: willBeOpen }));
    if (make !== undefined) { setFilterMake(willBeOpen ? make : ''); setFilterModel(''); setFilterYear(''); setFilterCategory(''); }
    if (model !== undefined) { setFilterModel(willBeOpen ? model : ''); setFilterYear(''); setFilterCategory(''); }
    if (year !== undefined) { setFilterYear(willBeOpen ? year : ''); setFilterCategory(''); }
    if (category !== undefined) { setFilterCategory(willBeOpen ? category : ''); }
  };

  const isRtl = lang === 'ar';

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
        body: JSON.stringify([{ part_name: `طلب خاص: ${activeSearchQuery}`, price: 0, customer_phone: custPhone, status: 'pending', notes: custNotes || 'طلب قطعة غير متوفرة' }])
      });
      if (response.ok) setReqSubmitted(true);
    } catch (err) {} finally { setIsSubmittingReq(false); }
  };

  // 🔥 دالة رسم كرت القطعة مع باج الجودة (أصلي / تجاري)
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
              <h4 style={{ margin: 0, fontSize: '15px', color: '#2d3748', fontWeight: 'bold' }}>{part.name}</h4>
            </div>

            <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>
              🚘 {part.make} - {part.model} ({part.year})
            </div>
            
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '6px' }}>
              {/* زر رقم القطعة */}
              <div 
                onClick={(e) => { e.stopPropagation(); setFitmentModalPart(part); }}
                style={{ 
                  fontSize: '11px', color: '#2b6cb0', backgroundColor: '#ebf8ff', 
                  padding: '2px 6px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', border: '1px solid #bee3f8' 
                }}
              >
                🔍 PN: {partNo}
              </div>

              {/* 🔥 باج يوضح هل القطعة أصلي أم تجاري / كوبي */}
              <span style={{ 
                fontSize: '11px', 
                fontWeight: 'bold', 
                color: pType.includes('تجاري') ? '#c05621' : '#2b6cb0', 
                backgroundColor: pType.includes('تجاري') ? '#fffaf0' : '#ebf8ff', 
                padding: '2px 6px', 
                borderRadius: '5px',
                border: pType.includes('تجاري') ? '1px solid #feebc8' : '1px solid #bee3f8'
              }}>
                {pType.includes('تجاري') ? '⚙️ تجاري/كوبي' : '💎 أصلي OEM'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#dd6b20', fontWeight: 'bold', fontSize: '16.5px' }}>{part.price} QAR</span>
              
              <span style={{ 
                fontSize: '11px', fontWeight: 'bold', 
                color: isOutOfStock ? '#e53e3e' : '#2f855a', 
                backgroundColor: isOutOfStock ? '#fff5f5' : '#f0fff4', 
                padding: '2px 6px', borderRadius: '5px'
              }}>
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
              style={{ flex: 1, backgroundColor: isOutOfStock ? '#a0aec0' : '#38a169', color: 'white', border: 'none', borderRadius: '8px', padding: '8px', fontSize: '12.5px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              🛒 {isOutOfStock ? 'غير متوفر' : 'أضف للسلة'}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '18px' }}>
              {searchResults.map(part => renderPartCard(part))}
            </div>
          </div>
        ) : (
          <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
            {Object.keys(carData).map(make => {
              const makeKey = `make_${make}`;
              const isMakeOpen = !!expandedNodes[makeKey] || filterMake === make;
              return (
                <li key={make} style={{ marginBottom: '8px' }}>
                  <div onClick={() => toggleNode(makeKey, make)} style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer', padding: '10px', backgroundColor: '#f7fafc', borderRadius: '8px', fontWeight: 'bold' }}>
                    <span>🚗 {make}</span>
                    <span>{isMakeOpen ? '▼' : '◀'}</span>
                  </div>
                  {isMakeOpen && (
                    <div style={{ padding: '10px' }}>
                      {carData[make]?.models.map((model: string) => (
                        <div key={model} style={{ padding: '6px' }}>📂 {model}</div>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

      </div>
    </aside>
  );
};
