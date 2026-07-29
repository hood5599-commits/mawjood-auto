import React, { useState } from 'react';

interface SidebarFiltersProps {
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
  filterEngine: string;
  setFilterEngine: (engine: string) => void;
  filterCategory: string;
  setFilterCategory: (category: string) => void;
  addToCart: (item: any, qty?: number) => void;
  onInquire?: (item: any) => void;
}

export const SidebarFilters: React.FC<SidebarFiltersProps> = ({
  lang,
  carData,
  years,
  inventory,
  searchTerm,
  setSearchTerm,
  filterMake,
  setFilterMake,
  filterModel,
  setFilterModel,
  filterYear,
  setFilterYear,
  filterEngine,
  setFilterEngine,
  filterCategory,
  setFilterCategory,
  addToCart,
  onInquire
}) => {
  const isRtl = lang === 'ar';
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const handleQtyChange = (partId: number, delta: number) => {
    setQuantities(prev => {
      const current = prev[partId] || 1;
      const updated = Math.max(1, current + delta);
      return { ...prev, [partId]: updated };
    });
  };

  // فلترة القطع المعروضة
  const filteredParts = inventory.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.part_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id?.toString().includes(searchTerm);

    const matchesMake = !filterMake || item.make === filterMake;
    const matchesModel = !filterModel || item.model === filterModel;
    const matchesYear = !filterYear || item.year?.toString() === filterYear;
    const matchesEngine = !filterEngine || item.engine === filterEngine;
    const matchesCategory = !filterCategory || item.category === filterCategory;

    return matchesSearch && matchesMake && matchesModel && matchesYear && matchesEngine && matchesCategory;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', direction: isRtl ? 'rtl' : 'ltr', fontFamily: 'Cairo, sans-serif' }}>
      
      {/* 🔍 شريط البحث العلوي */}
      <div style={{ backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder={isRtl ? 'ابحث برقم القطعة (PN)، الكود، أو المصطلح (مثل: دينمو، سلف، كمبيوتر)...' : 'Search part name, PN, or code...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e0', fontSize: '14px', outline: 'none' }}
        />
        <button style={{ padding: '12px 24px', backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
          🔍 {isRtl ? 'بحث' : 'Search'}
        </button>
      </div>

      {/* 🏎️ فلترة الماركة والموديل والسنة */}
      <div style={{ backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        <select value={filterMake} onChange={(e) => { setFilterMake(e.target.value); setFilterModel(''); setFilterEngine(''); }} style={{ padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13.5px' }}>
          <option value="">{isRtl ? '🚗 كل الماركات' : 'All Makes'}</option>
          {Object.keys(carData).map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        <select value={filterModel} onChange={(e) => setFilterModel(e.target.value)} disabled={!filterMake} style={{ padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13.5px' }}>
          <option value="">{isRtl ? '🚘 كل الموديلات' : 'All Models'}</option>
          {filterMake && carData[filterMake]?.models.map((m: string) => <option key={m} value={m}>{m}</option>)}
        </select>

        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} style={{ padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13.5px' }}>
          <option value="">{isRtl ? '📅 كل السنوات' : 'All Years'}</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        {(filterMake || filterModel || filterYear || filterCategory || searchTerm) && (
          <button onClick={() => { setFilterMake(''); setFilterModel(''); setFilterYear(''); setFilterEngine(''); setFilterCategory(''); setSearchTerm(''); }} style={{ padding: '10px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12.5px' }}>
            🔄 {isRtl ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
          </button>
        )}
      </div>

      {/* 📦 قائمة عرض قطع الغيار */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginTop: '10px' }}>
        {filteredParts.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px 20px', backgroundColor: '#ffffff', borderRadius: '20px' }}>
            <span style={{ fontSize: '48px' }}>📦</span>
            <h4 style={{ color: '#64748b', margin: '12px 0 0 0' }}>{isRtl ? 'لا توجد قطع غيار مطابقة للبحث حالياً' : 'No parts match your search'}</h4>
          </div>
        ) : (
          filteredParts.map(item => {
            const qty = quantities[item.id] || 1;

            return (
              <div key={item.id} style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '18px', boxShadow: '0 6px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.2s' }}>
                <div>
                  <div style={{ position: 'relative', height: '180px', borderRadius: '14px', overflow: 'hidden', backgroundColor: '#f8fafc', marginBottom: '14px' }}>
                    <img src={item.image_url || 'https://via.placeholder.com/300'} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(31, 58, 95, 0.85)', color: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' }}>
                      {item.part_type || 'مستعمل'}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', color: '#1e293b', fontWeight: 'bold' }}>{item.name}</h3>
                  <div style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '10px' }}>
                    🚘 {item.make} - {item.model} ({item.year})
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {item.part_number && (
                      <span style={{ fontSize: '11px', backgroundColor: '#ebf8ff', color: '#2b6cb0', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                        PN: {item.part_number} 🔍
                      </span>
                    )}
                    <span style={{ fontSize: '11px', backgroundColor: '#f0fff4', color: '#276749', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                      المتوفر: {item.stock || 1}
                    </span>
                  </div>

                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#e0872a', marginBottom: '16px' }}>
                    QAR {item.price}
                  </div>
                </div>

                {/* 🔘 أزرار التحكم وإضافة للسلة */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  
                  {/* أزرار زيادة ونقصان الكمية */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', backgroundColor: '#f8fafc', padding: '6px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <button onClick={() => handleQtyChange(item.id, -1)} style={{ width: '32px', height: '32px', border: 'none', backgroundColor: '#ffffff', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>-</button>
                    <span style={{ fontWeight: 'bold', fontSize: '14px', minWidth: '20px', textAlign: 'center' }}>{qty}</span>
                    <button onClick={() => handleQtyChange(item.id, 1)} style={{ width: '32px', height: '32px', border: 'none', backgroundColor: '#ffffff', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>+</button>
                  </div>

                  {/* 🛒 1. زر إضافة للسلة المباشر */}
                  <button
                    onClick={() => addToCart(item, qty)}
                    style={{
                      width: '100%',
                      padding: '11px',
                      backgroundColor: '#e0872a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: 'bold',
                      fontSize: '13.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    🛒 {isRtl ? 'أضف إلى السلة' : 'Add to Cart'}
                  </button>

                  {/* ❓ 2. زر أسأل البائع فحص التوافق */}
                  <button
                    onClick={() => onInquire ? onInquire(item) : addToCart(item, qty)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#1f3a5f',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    ❓ {isRtl ? 'أسأل البائع هل تركب؟' : 'Check Fitment'}
                  </button>

                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default SidebarFilters;
