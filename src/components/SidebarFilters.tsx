import React from 'react';

interface PartItem {
  id: number;
  name: string;
  price: number;
  make: string;
  model: string;
  year: string;
  engine?: string;
  image_url?: string;
  user_id: string;
  part_number?: string;
  stock?: number;
  part_type?: string;
  category?: string;
}

interface SidebarFiltersProps {
  lang: 'ar' | 'en';
  carData: Record<string, { models: string[]; engines: string[] }>;
  years: string[];
  translateMake: Record<string, string>;
  translateModel: Record<string, string>;
  categories: string[];
  expandedCategories: string[];
  toggleCategory: (category: string) => void;
  inventory: PartItem[];
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  filterMake: string;
  setFilterMake: (val: string) => void;
  filterModel: string;
  setFilterModel: (val: string) => void;
  filterYear: string;
  setFilterYear: (val: string) => void;
  filterEngine: string;
  setFilterEngine: (val: string) => void;
  filterCategory: string;
  setFilterCategory: (val: string) => void;
  addToCart: (item: PartItem, qty?: number) => void;
}

export const SidebarFilters: React.FC<SidebarFiltersProps> = ({
  lang,
  carData,
  years,
  categories,
  expandedCategories,
  toggleCategory,
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
}) => {
  const isRtl = lang === 'ar';

  // التحقق من وجود أي معيار بحث أو تصفية فعال
  const hasActiveFilter = Boolean(
    searchTerm.trim() || filterMake || filterModel || filterYear || filterEngine || filterCategory
  );

  // عرض القطع فقط عند قيام العميل بالبحث أو الاختيار
  const filteredParts = hasActiveFilter
    ? inventory.filter((part) => {
        const matchesSearch =
          !searchTerm ||
          part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (part.part_number && part.part_number.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesMake = !filterMake || part.make === filterMake;
        const matchesModel = !filterModel || part.model === filterModel;
        const matchesYear = !filterYear || part.year === filterYear;
        const matchesEngine = !filterEngine || part.engine === filterEngine;
        const matchesCategory = !filterCategory || part.category === filterCategory;

        return matchesSearch && matchesMake && matchesModel && matchesYear && matchesEngine && matchesCategory;
      })
    : [];

  const clearFilters = () => {
    setSearchTerm('');
    setFilterMake('');
    setFilterModel('');
    setFilterYear('');
    setFilterEngine('');
    setFilterCategory('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', direction: isRtl ? 'rtl' : 'ltr' }}>
      
      {/* 1️⃣ شريط اختيار السيارة والبحث السريع */}
      <div style={{ backgroundColor: 'var(--mw-surface, #ffffff)', padding: '20px', borderRadius: '16px', border: '1px solid var(--mw-border, #e2e8f0)', boxShadow: 'var(--mw-shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--mw-ink, #1a202c)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🚘 {isRtl ? 'حدد بيانات سيارتك للبحث المباشر' : 'Select Your Vehicle'}
          </h3>
          {hasActiveFilter && (
            <button onClick={clearFilters} style={{ background: '#fff5f5', border: '1px solid #fed7d7', color: '#e53e3e', padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              🔄 {isRtl ? 'إعادة ضبط البحث' : 'Reset Filters'}
            </button>
          )}
        </div>

        {/* حقل البحث */}
        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            placeholder={isRtl ? '🔍 ابحث باسم القطعة، المحرك، أو رقم القطعة (PN)...' : 'Search by part name or number...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--mw-border, #cbd5e0)', fontSize: '14px', boxSizing: 'border-box', backgroundColor: 'var(--mw-bg)' }}
          />
        </div>

        {/* خيارات الفلترة السريعة */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--mw-ink-muted)' }}>{isRtl ? 'الماركة:' : 'Make:'}</label>
            <select
              value={filterMake}
              onChange={(e) => {
                setFilterMake(e.target.value);
                setFilterModel('');
                setFilterEngine('');
              }}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--mw-border)', fontSize: '13.5px', backgroundColor: 'var(--mw-surface)', color: 'var(--mw-ink)' }}
            >
              <option value="">{isRtl ? 'جميع الماركات' : 'All Makes'}</option>
              {Object.keys(carData).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--mw-ink-muted)' }}>{isRtl ? 'الموديل:' : 'Model:'}</label>
            <select
              value={filterModel}
              onChange={(e) => setFilterModel(e.target.value)}
              disabled={!filterMake}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--mw-border)', fontSize: '13.5px', backgroundColor: 'var(--mw-surface)', color: 'var(--mw-ink)' }}
            >
              <option value="">{isRtl ? 'جميع الموديلات' : 'All Models'}</option>
              {filterMake && carData[filterMake]?.models.map((mod) => (
                <option key={mod} value={mod}>{mod}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--mw-ink-muted)' }}>{isRtl ? 'سنة الصنع:' : 'Year:'}</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--mw-border)', fontSize: '13.5px', backgroundColor: 'var(--mw-surface)', color: 'var(--mw-ink)' }}
            >
              <option value="">{isRtl ? 'جميع السنوات' : 'All Years'}</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {filterMake && carData[filterMake]?.engines?.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--mw-ink-muted)' }}>{isRtl ? 'سعة المحرك:' : 'Engine:'}</label>
              <select
                value={filterEngine}
                onChange={(e) => setFilterEngine(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--mw-border)', fontSize: '13.5px', backgroundColor: 'var(--mw-surface)', color: 'var(--mw-ink)' }}
              >
                <option value="">{isRtl ? 'جميع المحركات' : 'All Engines'}</option>
                {carData[filterMake].engines.map((eng) => (
                  <option key={eng} value={eng}>{eng}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 2️⃣ القسم الرئيسي: التصنيفات + معروضات القطع */}
      <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr', gap: '20px' }}>
        
        {/* قائمة تصنيفات القطع */}
        <aside style={{ backgroundColor: 'var(--mw-surface, #ffffff)', padding: '16px', borderRadius: '16px', border: '1px solid var(--mw-border, #e2e8f0)', height: 'fit-content' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: 'var(--mw-ink)', borderBottom: '1px solid var(--mw-border)', paddingBottom: '10px' }}>
            ⚙️ {isRtl ? 'أقسام قطع الغيار' : 'Part Categories'}
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={() => setFilterCategory('')}
              style={{
                textAlign: isRtl ? 'right' : 'left',
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: filterCategory === '' ? 'var(--mw-accent-bg, #FDF1E3)' : 'transparent',
                color: filterCategory === '' ? 'var(--mw-accent-dark, #C56E17)' : 'var(--mw-ink)',
                fontWeight: filterCategory === '' ? 'bold' : 'normal',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              📁 {isRtl ? 'جميع التصنيفات' : 'All Categories'}
            </button>

            {categories.map((cat) => {
              const isExpanded = expandedCategories.includes(cat);
              const isSelected = filterCategory === cat;

              return (
                <div key={cat} style={{ borderBottom: '1px border-dashed var(--mw-border)' }}>
                  <div
                    onClick={() => {
                      toggleCategory(cat);
                      setFilterCategory(cat);
                    }}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      backgroundColor: isSelected ? 'var(--mw-accent-bg, #FDF1E3)' : 'transparent',
                      color: isSelected ? 'var(--mw-accent-dark, #C56E17)' : 'var(--mw-ink)',
                      fontWeight: isSelected ? 'bold' : '500',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    <span>🔩 {cat}</span>
                    <span style={{ fontSize: '10px' }}>{isExpanded ? '▼' : '◀'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* شبكة عرض القطع */}
        <main>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--mw-ink)' }}>
              📦 {isRtl ? `نتائج البحث (${filteredParts.length})` : `Search Results (${filteredParts.length})`}
            </h2>
          </div>

          {!hasActiveFilter ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'var(--mw-surface, #ffffff)', borderRadius: '16px', border: '2px dashed var(--mw-border, #cbd5e0)' }}>
              <span style={{ fontSize: '52px', display: 'block', marginBottom: '14px' }}>🚘</span>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: 'var(--mw-ink)' }}>
                {isRtl ? 'اختر سيارتك أو ابحث لرؤية القطع المتاحة' : 'Select vehicle or search to view parts'}
              </h3>
              <p style={{ color: 'var(--mw-ink-muted, #718096)', margin: 0, fontSize: '13.5px' }}>
                {isRtl ? 'حدد الماركة والموديل والسنة أعلاه أو استخدم حقل البحث لعرض القطع المطابقة لسيارتك فقط.' : 'Specify make, model, year above or type in the search bar.'}
              </p>
            </div>
          ) : filteredParts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'var(--mw-surface, #ffffff)', borderRadius: '16px', border: '1px solid var(--mw-border, #e2e8f0)' }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>🔍</span>
              <p style={{ color: 'var(--mw-ink-muted, #718096)', margin: 0 }}>
                {isRtl ? 'لا توجد قطع تطابق خيارات البحث الحالية.' : 'No parts match your current search.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
              {filteredParts.map((item) => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: 'var(--mw-surface, #ffffff)',
                    borderRadius: '16px',
                    border: '1px solid var(--mw-border, #e2e8f0)',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--mw-shadow-sm, 0 4px 12px rgba(0,0,0,0.03))',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                >
                  <div>
                    <div style={{ position: 'relative', width: '100%', height: '150px', borderRadius: '10px', overflow: 'hidden', marginBottom: '10px', backgroundColor: '#edf2f7' }}>
                      <img
                        src={item.image_url && item.image_url.trim() !== '' ? item.image_url : 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&q=80'}
                        alt={item.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&q=80';
                        }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      {item.part_type && (
                        <span style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'rgba(15,23,32,0.85)', color: '#ffffff', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                          {item.part_type}
                        </span>
                      )}
                    </div>

                    <h3 style={{ margin: '0 0 4px 0', fontSize: '15.5px', color: 'var(--mw-ink)', fontWeight: 'bold' }}>{item.name}</h3>

                    {item.part_number && (
                      <div style={{ fontSize: '11px', color: 'var(--mw-ink-muted)', fontFamily: 'monospace', marginBottom: '4px' }}>
                        PN: {item.part_number}
                      </div>
                    )}

                    <div style={{ fontSize: '12px', color: 'var(--mw-ink-muted)', marginBottom: '10px' }}>
                      🚘 {item.make} {item.model} ({item.year})
                    </div>

                    <div style={{ fontSize: '17px', fontWeight: 'bold', color: 'var(--mw-accent, #dd6b20)', marginBottom: '12px' }}>
                      {item.price} <span style={{ fontSize: '12px' }}>QAR</span>
                    </div>
                  </div>

                  <button
                    onClick={() => addToCart(item, 1)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#805ad5',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    ❓ {isRtl ? 'أسأل البائع هل تركب؟' : 'Ask Seller Fitment'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

    </div>
  );
};
