import React, { useState } from 'react';
import { getPartCategory } from '../utils/categoryHelper';

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
  addToCart?: (item: any) => void;
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

  const toggleNode = (nodeKey: string, make?: string, model?: string, year?: string, category?: string) => {
    const willBeOpen = !expandedNodes[nodeKey];
    
    setExpandedNodes(prev => ({
      ...prev,
      [nodeKey]: willBeOpen
    }));

    if (make !== undefined) {
      setFilterMake(willBeOpen ? make : '');
      setFilterModel('');
      setFilterYear('');
      setFilterCategory('');
    }
    if (model !== undefined) {
      setFilterModel(willBeOpen ? model : '');
      setFilterYear('');
      setFilterCategory('');
    }
    if (year !== undefined) {
      setFilterYear(willBeOpen ? year : '');
      setFilterCategory('');
    }
    if (category !== undefined) {
      setFilterCategory(willBeOpen ? category : '');
    }
  };

  const isRtl = lang === 'ar';

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
        
        <h3 style={{  
          margin: '0 0 20px 0',  
          color: '#1a365d',  
          borderBottom: '2px solid #3182ce',  
          paddingBottom: '12px',
          fontSize: '18px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          📋 {lang === 'ar' ? 'كتالوج قطع الغيار التفاعلي (RockAuto Style)' : 'Interactive Parts Catalog'}
        </h3>

        {/* مربع البحث العلوي الشامل */}
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder={lang === 'ar' ? 'ابحث برقم القطعة أو الاسم مباشرة...' : 'Search by part number or name...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 18px',
              borderRadius: '12px',
              border: '1.5px solid #cbd5e0',
              outline: 'none',
              fontSize: '15px',
              boxSizing: 'border-box',
              backgroundColor: '#f8fafc',
              direction: isRtl ? 'rtl' : 'ltr'
            }}
          />
        </div>

        <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
          {Object.keys(carData).map(make => {
            const makeKey = `make_${make}`;
            const isMakeOpen = !!expandedNodes[makeKey] || filterMake === make;
            const makeName = isRtl ? make : (translateMake[make] || make);

            return (
              <li key={make} style={{ marginBottom: '8px' }}>
                <div  
                  onClick={() => toggleNode(makeKey, make)}
                  style={{ ...nodeStyle, backgroundColor: isMakeOpen ? '#e2e8f0' : '#f7fafc', fontWeight: 'bold', padding: '10px 14px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {!imgErrors[make] ? (
                      <img  
                        src={`https://www.google.com/s2/favicons?sz=128&domain=${MAKE_DOMAINS[make] || 'google.com'}`}  
                        alt={make}  
                        style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                        onError={() => setImgErrors(prev => ({...prev, [make]: true}))}
                      />
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
                          <div  
                            onClick={() => toggleNode(modelKey, undefined, model)}
                            style={{ ...nodeStyle, backgroundColor: isModelOpen ? '#edf2f7' : 'transparent', fontSize: '14px', padding: '8px 12px' }}
                          >
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
                                    <div  
                                      onClick={() => toggleNode(yearKey, undefined, undefined, year)}
                                      style={{ ...nodeStyle, backgroundColor: isYearOpen ? '#ebf8ff' : 'transparent', fontSize: '13.5px', color: '#2b6cb0', padding: '7px 12px' }}
                                    >
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
                                              <div  
                                                onClick={() => toggleNode(categoryKey, undefined, undefined, undefined, category)}
                                                style={{ ...nodeStyle, backgroundColor: isCategoryOpen ? '#fffaf0' : 'transparent', fontSize: '13px', color: '#2d3748', padding: '6px 10px', fontWeight: 'bold' }}
                                              >
                                                <span>⚙️ {translatedCategory} <span style={{ fontSize: '11px', color: '#3182ce' }}>({filteredParts.length} قطع)</span></span>
                                                <span style={{ fontSize: '10px', color: '#a0aec0' }}>{isCategoryOpen ? '▼' : isRtl ? '◀' : '▶'}</span>
                                              </div>

                                              {/* 🔥 عرض القطع مباشرة داخل الشجرة بشكل شبكي واسع يملأ عرض الشاشة (Grid View) */}
                                              {isCategoryOpen && (
                                                <div style={{  
                                                  padding: '16px',  
                                                  backgroundColor: '#fffaf0',  
                                                  borderRadius: '14px',  
                                                  border: '1px solid #feebc8',
                                                  marginTop: '8px',
                                                  marginBottom: '12px',
                                                  display: 'grid',
                                                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', // 👈 يتكيف مع العرض
                                                  gap: '15px',
                                                  [isRtl ? 'marginRight' : 'marginLeft']: '10px'
                                                }}>
                                                  {filteredParts.map(part => (
                                                    <div 
                                                      key={part.id} 
                                                      style={{ 
                                                        backgroundColor: 'white', 
                                                        padding: '14px', 
                                                        borderRadius: '12px', 
                                                        border: '1px solid #e2e8f0', 
                                                        display: 'flex', 
                                                        flexDirection: 'column',
                                                        justifyContent: 'space-between', 
                                                        gap: '12px',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                                                      }}
                                                    >
                                                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                        <img 
                                                          src={part.image_url || 'https://via.placeholder.com/80'} 
                                                          alt={part.name} 
                                                          style={{ width: '65px', height: '65px', objectFit: 'cover', borderRadius: '8px' }} 
                                                        />
                                                        <div style={{ flex: 1 }}>
                                                          <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#2d3748', fontWeight: 'bold' }}>{part.name}</h4>
                                                          <span style={{ color: '#dd6b20', fontWeight: 'bold', fontSize: '15px' }}>{part.price} QAR</span>
                                                        </div>
                                                      </div>

                                                      {addToCart && (
                                                        <button 
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            addToCart(part);
                                                          }}
                                                          style={{ 
                                                            width: '100%',
                                                            backgroundColor: '#38a169', 
                                                            color: 'white', 
                                                            border: 'none', 
                                                            borderRadius: '8px', 
                                                            padding: '8px 12px', 
                                                            fontSize: '12.5px', 
                                                            fontWeight: 'bold', 
                                                            cursor: 'pointer', 
                                                            textAlign: 'center',
                                                            display: 'flex',
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                            gap: '6px'
                                                          }}
                                                        >
                                                          🛒 {lang === 'ar' ? 'أضف للسلة' : 'Add to Cart'}
                                                        </button>
                                                      )}
                                                    </div>
                                                  ))}
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
      </div>
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
