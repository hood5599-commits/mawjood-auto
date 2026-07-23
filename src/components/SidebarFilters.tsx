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
  filterEngine: string;
  setFilterEngine: (engine: string) => void;
  filterCategory: string;
  setFilterCategory: (cat: string) => void;
  addToCart?: (part: any) => void; // إضافة دالة السلة اختياريًا
}

// 1. القاموس العربي للأقسام
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

// 2. الروابط الموثوقة للشعارات
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
    filterMake, setFilterMake, filterModel, setFilterModel, filterYear, setFilterYear,
    filterCategory, setFilterCategory, addToCart
  } = props;

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const toggleNode = (nodeKey: string, make?: string, model?: string, year?: string, category?: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeKey]: !prev[nodeKey]
    }));

    if (make !== undefined) setFilterMake(make);
    if (model !== undefined) setFilterModel(model);
    if (year !== undefined) setFilterYear(year);
    if (category !== undefined) setFilterCategory(category);
  };

  const isRtl = lang === 'ar';

  return (
    <aside style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{  
        backgroundColor: 'white',  
        padding: '20px',  
        borderRadius: '16px',  
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        border: '1px solid #edf2f7',
        direction: isRtl ? 'rtl' : 'ltr'
      }}>
        
        <h3 style={{  
          margin: '0 0 20px 0',  
          color: '#1a365d',  
          borderBottom: '2px solid #3182ce',  
          paddingBottom: '12px',
          fontSize: '16px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          📋 {lang === 'ar' ? 'كتالوج قطع الغيار' : 'Parts Catalog'}
        </h3>

        <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
          {Object.keys(carData).map(make => {
            const makeKey = `make_${make}`;
            const isMakeOpen = expandedNodes[makeKey] || filterMake === make;
            const makeName = isRtl ? make : (translateMake[make] || make);

            return (
              <li key={make} style={{ marginBottom: '6px' }}>
                <div  
                  onClick={() => toggleNode(makeKey, make, '', '', '')}
                  style={{ ...nodeStyle, backgroundColor: isMakeOpen ? '#e2e8f0' : '#f7fafc', fontWeight: 'bold' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {!imgErrors[make] ? (
                      <img  
                        src={`https://www.google.com/s2/favicons?sz=128&domain=${MAKE_DOMAINS[make] || 'google.com'}`}  
                        alt={make}  
                        style={{ width: '22px', height: '22px', objectFit: 'contain' }}
                        onError={() => setImgErrors(prev => ({...prev, [make]: true}))}
                      />
                    ) : (
                      <span style={{ fontSize: '16px' }}>🚗</span>
                    )}
                    <span>{makeName}</span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#4a5568' }}>{isMakeOpen ? '▼' : isRtl ? '◀' : '▶'}</span>
                </div>

                {isMakeOpen && (
                  <ul style={{ listStyleType: 'none', padding: 0, [isRtl ? 'marginRight' : 'marginLeft']: '15px', marginTop: '4px' }}>
                    {carData[make]?.models.map((model: string) => {
                      const modelKey = `model_${make}_${model}`;
                      const isModelOpen = expandedNodes[modelKey] || (filterMake === make && filterModel === model);
                      const modelName = isRtl ? model : (translateModel[model] || model);

                      return (
                        <li key={model} style={{ marginBottom: '4px' }}>
                          <div  
                            onClick={() => toggleNode(modelKey, make, model, '', '')}
                            style={{ ...nodeStyle, backgroundColor: isModelOpen ? '#edf2f7' : 'transparent', fontSize: '13px' }}
                          >
                            <span>📂 {modelName}</span>
                            <span style={{ fontSize: '9px', color: '#718096' }}>{isModelOpen ? '▼' : isRtl ? '◀' : '▶'}</span>
                          </div>

                          {isModelOpen && (
                            <ul style={{ listStyleType: 'none', padding: 0, [isRtl ? 'marginRight' : 'marginLeft']: '15px', marginTop: '4px' }}>
                              {years.map(year => {
                                const yearKey = `year_${make}_${model}_${year}`;
                                const isYearOpen = expandedNodes[yearKey] || (filterMake === make && filterModel === model && filterYear === year);

                                return (
                                  <li key={year} style={{ marginBottom: '4px' }}>
                                    <div  
                                      onClick={() => toggleNode(yearKey, make, model, year, '')}
                                      style={{ ...nodeStyle, backgroundColor: isYearOpen ? '#ebf8ff' : 'transparent', fontSize: '12px', color: '#2b6cb0' }}
                                    >
                                      <span>📅 {year}</span>
                                      <span style={{ fontSize: '9px' }}>{isYearOpen ? '▼' : isRtl ? '◀' : '▶'}</span>
                                    </div>

                                    {isYearOpen && (
                                      <ul style={{ listStyleType: 'none', padding: 0, [isRtl ? 'marginRight' : 'marginLeft']: '15px', marginTop: '4px' }}>
                                        {categories.map(category => {
                                          const categoryKey = `cat_${make}_${model}_${year}_${category}`;
                                          const isCategoryOpen = expandedNodes[categoryKey] || (filterMake === make && filterModel === model && filterYear === year && filterCategory === category);
                                          const translatedCategory = lang === 'ar' ? (CATEGORY_TRANSLATION[category] || category) : category;

                                          const filteredParts = inventory.filter(part =>  
                                            part.make === make &&  
                                            part.model === model &&  
                                            String(part.year) === String(year) &&  
                                            getPartCategory(part.name) === category
                                          );

                                          // إخفاء الفئة إن لم تحتوي على قطع لتسهيل التصفح
                                          if (filteredParts.length === 0) return null;

                                          return (
                                            <li key={category} style={{ marginBottom: '6px' }}>
                                              <div  
                                                onClick={() => toggleNode(categoryKey, make, model, year, category)}
                                                style={{ ...nodeStyle, backgroundColor: isCategoryOpen ? '#feebc8' : '#f7fafc', fontSize: '12px', color: '#2d3748', padding: '6px 10px', border: '1px solid #e2e8f0' }}
                                              >
                                                <span>⚙️ {translatedCategory} <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#dd6b20' }}>({filteredParts.length})</span></span>
                                                <span style={{ fontSize: '8px', color: '#a0aec0' }}>{isCategoryOpen ? '▼' : isRtl ? '◀' : '▶'}</span>
                                              </div>

                                              {/* 🛒 شجرة القطع داخل الفئة مباشرة بأسلوب RockAuto */}
                                              {isCategoryOpen && (
                                                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px', backgroundColor: '#fff', border: '1px solid #cbd5e0', borderRadius: '8px' }}>
                                                  {filteredParts.map(part => (
                                                    <div 
                                                      key={part.id} 
                                                      style={{ 
                                                        display: 'flex', 
                                                        flexDirection: 'column',
                                                        gap: '8px', 
                                                        padding: '10px', 
                                                        backgroundColor: '#f8fafc', 
                                                        border: '1px solid #e2e8f0', 
                                                        borderRadius: '8px' 
                                                      }}
                                                    >
                                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        {part.image_url ? (
                                                          <img src={part.image_url} alt={part.name} style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                                                        ) : (
                                                          <div style={{ width: '45px', height: '45px', backgroundColor: '#edf2f7', borderRadius: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px' }}>🔧</div>
                                                        )}
                                                        <div style={{ flex: 1 }}>
                                                          <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1a202c' }}>{part.name}</div>
                                                          {part.engine && <div style={{ fontSize: '11px', color: '#718096' }}>{part.engine}</div>}
                                                        </div>
                                                      </div>

                                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #cbd5e0', paddingTop: '6px' }}>
                                                        <span style={{ fontWeight: 'bold', color: '#c53030', fontSize: '14px' }}>
                                                          {part.price} QAR
                                                        </span>
                                                        {addToCart && (
                                                          <button
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              addToCart(part);
                                                            }}
                                                            style={{
                                                              backgroundColor: '#2b6cb0',
                                                              color: 'white',
                                                              border: 'none',
                                                              padding: '5px 10px',
                                                              borderRadius: '6px',
                                                              cursor: 'pointer',
                                                              fontWeight: 'bold',
                                                              fontSize: '11px',
                                                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                            }}
                                                          >
                                                            🛒 {isRtl ? 'إضافة' : 'Add'}
                                                          </button>
                                                        )}
                                                      </div>
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
  justify: 'space-between',
  alignItems: 'center',
  cursor: 'pointer',
  padding: '6px 10px',
  borderRadius: '8px',
  transition: 'all 0.15s ease-in-out',
  userSelect: 'none',
};
