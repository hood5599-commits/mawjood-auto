import React from 'react';
import { t } from '/src/utils/translations.ts';
import { getPartCategory } from '/src/utils/categoryHelper.ts';

interface SidebarProps {
  lang: 'ar' | 'en';
  carData: any;
  years: string[];
  translateMake: any;
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
}

export const SidebarFilters: React.FC<SidebarProps> = ({
  lang, carData, years, translateMake, categories, expandedCategories, toggleCategory, inventory,
  searchTerm, setSearchTerm, filterMake, setFilterMake, filterModel, setFilterModel, filterYear, setFilterYear, filterEngine, setFilterEngine
}) => {
  return (
    <aside style={{ flex: '1 1 280px', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* صندوق فلاتر البحث والفرز */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#1a365d', borderBottom: '2px solid #edf2f7', paddingBottom: '10px' }}>
          ⚙️ {lang === 'ar' ? 'تصفية النتائج' : 'Filters'}
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: '600', color: '#718096' }}>{t[lang].makeLabel}</label>
            <select value={filterMake} onChange={(e) => { setFilterMake(e.target.value); setFilterModel(''); setFilterEngine(''); }} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px' }}>
              <option value="">{t[lang].allMakes}</option>
              {Object.keys(carData).map(make => (
                <option key={make} value={make}>{lang === 'ar' ? make : (translateMake[make] || make)}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: '600', color: '#718096' }}>{t[lang].modelLabel}</label>
            <select value={filterModel} onChange={(e) => setFilterModel(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px' }} disabled={!filterMake}>
              <option value="">{t[lang].allModels}</option>
              {filterMake && carData[filterMake]?.models.map((model: string) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: '600', color: '#718096' }}>{t[lang].yearLabel}</label>
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px' }}>
              <option value="">{t[lang].allYears}</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: '600', color: '#718096' }}>{t[lang].engineLabel}</label>
            <select value={filterEngine} onChange={(e) => setFilterEngine(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px' }} disabled={!filterMake}>
              <option value="">{t[lang].allEngines}</option>
              {filterMake && carData[filterMake]?.engines.map((engine: string) => (
                <option key={engine} value={engine}>{engine}</option>
              ))}
            </select>
          </div>

          <button onClick={() => { setFilterMake(''); setFilterModel(''); setFilterYear(''); setFilterEngine(''); setSearchTerm(''); }} style={{ width: '100%', padding: '10px', backgroundColor: '#edf2f7', color: '#4a5568', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
            {t[lang].resetFilters}
          </button>
        </div>
      </div>

      {/* شجرة التصنيفات والقطع الديناميكية */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#1a365d', borderBottom: '2px solid #edf2f7', paddingBottom: '10px' }}>
          📁 {lang === 'ar' ? 'أقسام قطع الغيار' : 'Parts Categories'}
        </h3>
        <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {categories.map(category => {
            const isExpanded = expandedCategories.includes(category);
            const matchingPartsInInventory = inventory.filter(part => getPartCategory(part.name) === category);

            return (
              <li key={category} style={{ borderBottom: '1px solid #f7fafc', paddingBottom: '6px' }}>
                <div 
                  onClick={() => {
                    toggleCategory(category);
                    setSearchTerm(category);
                  }} 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '6px 8px', borderRadius: '6px', backgroundColor: searchTerm === category ? '#ebf8ff' : 'transparent', color: searchTerm === category ? '#2b6cb0' : '#2d3748', transition: 'background-color 0.2s', fontWeight: searchTerm === category ? 'bold' : 'normal' }}
                >
                  <span style={{ fontSize: '13px' }}>
                    ⚙️ {category} 
                    <span style={{ fontSize: '11px', color: '#a0aec0', marginRight: '6px', marginLeft: '6px' }}>
                      ({matchingPartsInInventory.length})
                    </span>
                  </span>
                  <span style={{ fontSize: '10px', color: '#a0aec0' }}>{isExpanded ? '▼' : '►'}</span>
                </div>
                
                {isExpanded && (
                  <div style={{ padding: '8px 15px 4px 15px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: lang === 'en' ? '2px solid #cbd5e0' : 'none', borderRight: lang === 'ar' ? '2px solid #cbd5e0' : 'none', marginRight: lang === 'ar' ? '10px' : '0', marginLeft: lang === 'en' ? '10px' : '0' }}>
                    {matchingPartsInInventory.length === 0 ? (
                      <span style={{ color: '#a0aec0', fontStyle: 'italic' }}>
                        {lang === 'ar' ? 'لا توجد قطع متوفرة حالياً' : 'No parts available'}
                      </span>
                    ) : (
                      matchingPartsInInventory.map(part => (
                        <span 
                          key={part.id} 
                          onClick={() => setSearchTerm(part.name)}
                          style={{ cursor: 'pointer', color: '#4a5568', padding: '2px 0', transition: 'color 0.2s', display: 'block' }}
                          onMouseOver={(e) => e.currentTarget.style.color = '#2b6cb0'}
                          onMouseOut={(e) => e.currentTarget.style.color = '#4a5568'}
                        >
                          • {part.name} ({lang === 'ar' ? part.make : (translateMake[part.make] || part.make)})
                        </span>
                      ))
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
};