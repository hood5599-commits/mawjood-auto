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
  const filteredParts = inventory.filter((part) => {
    const matchesSearch =
      !searchTerm ||
      part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (part.part_number && part.part_number.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesMake = !filterMake || part.make === filterMake;
    const matchesModel = !filterModel || part.model === filterModel;
    const matchesYear = !filterYear || part.year === filterYear;
    const matchesEngine = !filterEngine || part.engine === filterEngine;

    return matchesSearch && matchesMake && matchesModel && matchesYear && matchesEngine;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setFilterMake('');
    setFilterModel('');
    setFilterYear('');
    setFilterEngine('');
    setFilterCategory('');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
      
      {/* Sidebar Filters */}
      <aside style={{ backgroundColor: 'var(--mw-surface, #ffffff)', padding: '20px', borderRadius: '16px', border: '1px solid var(--mw-border, #e2e8f0)', height: 'fit-content' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '17px', color: 'var(--mw-ink, #1a202c)' }}>🔍 {lang === 'ar' ? 'تصفية البحث' : 'Filter Search'}</h3>
          {(filterMake || filterModel || filterYear || filterEngine || searchTerm || filterCategory) && (
            <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: '#e53e3e', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              {lang === 'ar' ? 'إعادة ضبط' : 'Reset'}
            </button>
          )}
        </div>

        <div style={{ marginBottom: '14px' }}>
          <input
            type="text"
            placeholder={lang === 'ar' ? 'ابحث باسم القطعة أو رقمها...' : 'Search part name or number...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--mw-border, #cbd5e0)', boxSizing: 'border-box', fontSize: '13px' }}
          />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '4px' }}>{lang === 'ar' ? 'الماركة:' : 'Make:'}</label>
          <select
            value={filterMake}
            onChange={(e) => {
              setFilterMake(e.target.value);
              setFilterModel('');
              setFilterEngine('');
            }}
            style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid var(--mw-border, #cbd5e0)', fontSize: '13px' }}
          >
            <option value="">{lang === 'ar' ? 'الكل' : 'All Makes'}</option>
            {Object.keys(carData).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '4px' }}>{lang === 'ar' ? 'الموديل:' : 'Model:'}</label>
          <select
            value={filterModel}
            onChange={(e) => setFilterModel(e.target.value)}
            disabled={!filterMake}
            style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid var(--mw-border, #cbd5e0)', fontSize: '13px' }}
          >
            <option value="">{lang === 'ar' ? 'الكل' : 'All Models'}</option>
            {filterMake && carData[filterMake]?.models.map((mod) => (
              <option key={mod} value={mod}>{mod}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '4px' }}>{lang === 'ar' ? 'سنة الصنع:' : 'Year:'}</label>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid var(--mw-border, #cbd5e0)', fontSize: '13px' }}
          >
            <option value="">{lang === 'ar' ? 'الكل' : 'All Years'}</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '4px' }}>{lang === 'ar' ? 'التصنيف:' : 'Category:'}</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid var(--mw-border, #cbd5e0)', fontSize: '13px' }}
          >
            <option value="">{lang === 'ar' ? 'جميع التصنيفات' : 'All Categories'}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </aside>

      {/* Main Parts Grid */}
      <main>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '19px', color: 'var(--mw-ink, #1a202c)' }}>
            📦 {lang === 'ar' ? `القطع المتاحة (${filteredParts.length})` : `Available Parts (${filteredParts.length})`}
          </h2>
        </div>

        {filteredParts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'var(--mw-surface, #ffffff)', borderRadius: '16px', border: '1px solid var(--mw-border, #e2e8f0)' }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>🔍</span>
            <p style={{ color: 'var(--mw-ink-muted, #718096)', margin: 0 }}>{lang === 'ar' ? 'لم نجد أي قطع تطابق معايير البحث الحالية.' : 'No parts match your search filters.'}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
            {filteredParts.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: 'var(--mw-surface, #ffffff)',
                  borderRadius: '16px',
                  border: '1px solid var(--mw-border, #e2e8f0)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--mw-shadow-sm, 0 4px 12px rgba(0,0,0,0.03))',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                <div>
                  <div style={{ position: 'relative', width: '100%', height: '160px', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px', backgroundColor: '#f7fafc' }}>
                    <img
                      src={item.image_url || 'https://via.placeholder.com/300x200?text=No+Image'}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {item.part_type && (
                      <span style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'rgba(15,23,32,0.85)', color: '#ffffff', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                        {item.part_type}
                      </span>
                    )}
                  </div>

                  <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: 'var(--mw-ink, #1a202c)', lineHeight: '1.3' }}>{item.name}</h3>

                  {item.part_number && (
                    <div style={{ fontSize: '11.5px', color: 'var(--mw-ink-muted, #718096)', fontFamily: 'monospace', marginBottom: '6px' }}>
                      PN: {item.part_number}
                    </div>
                  )}

                  <div style={{ fontSize: '12.5px', color: 'var(--mw-ink-muted, #718096)', marginBottom: '10px' }}>
                    🚘 {item.make} {item.model} ({item.year})
                  </div>

                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--mw-accent, #dd6b20)', marginBottom: '14px' }}>
                    {item.price} <span style={{ fontSize: '13px' }}>QAR</span>
                  </div>
                </div>

                <button
                  onClick={() => addToCart(item, 1)}
                  style={{
                    width: '100%',
                    padding: '11px',
                    backgroundColor: '#805ad5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  ❓ {lang === 'ar' ? 'أسأل البائع هل تركب؟' : 'Ask Seller Fitment'}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
