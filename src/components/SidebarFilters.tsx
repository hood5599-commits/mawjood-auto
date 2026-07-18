import React, { useState } from 'react';
import { getPartCategory } from '../utils/categoryHelper';

// الواجهة البرمجية لتفادي أخطاء TypeScript
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

// 1. قاموس ترجمة أقسام قطع الغيار إلى العربية
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

// 2. روابط الشعارات الحقيقية لشركات السيارات
const MAKE_LOGOS: Record<string, string> = {
  "تويوتا": "https://logo.clearbit.com/toyota.com",
  "هيونداي": "https://logo.clearbit.com/hyundai.com",
  "نيسان": "https://logo.clearbit.com/nissan-global.com",
  "فورد": "https://logo.clearbit.com/ford.com",
  "شفروليه": "https://logo.clearbit.com/chevrolet.com",
  "كيا": "https://logo.clearbit.com/kia.com",
  "هوندا": "https://logo.clearbit.com/honda.com",
  "لكزس": "https://logo.clearbit.com/lexus.com",
  "ميتسوبيشي": "https://logo.clearbit.com/mitsubishicars.com",
  "مازدا": "https://logo.clearbit.com/mazda.com",
  "جي إم سي": "https://logo.clearbit.com/gmc.com",
  "بي إم دبليو": "https://logo.clearbit.com/bmw.com",
  "مرسيدس": "https://logo.clearbit.com/mercedes-benz.com",
  "فولكس فاجن": "https://logo.clearbit.com/vw.com",
  "أودي": "https://logo.clearbit.com/audi.com",
  "جيب": "https://logo.clearbit.com/jeep.com",
  "دودج": "https://logo.clearbit.com/dodge.com",
  "رام": "https://logo.clearbit.com/ramtrucks.com",
  "لاند روفر": "https://logo.clearbit.com/landrover.com",
  "إنفينيتي": "https://logo.clearbit.com/infinitiusa.com",
  "سوبارو": "https://logo.clearbit.com/subaru.com",
  "رينو": "https://logo.clearbit.com/renault.com",
  "سوزوكي": "https://logo.clearbit.com/globalsuzuki.com",
  "بورش": "https://logo.clearbit.com/porsche.com",
  "كرايسلر": "https://logo.clearbit.com/chrysler.com"
};

export const SidebarFilters: React.FC<SidebarProps> = (props) => {
  const { lang, carData, years, translateMake, categories, inventory, setSearchTerm } = props;

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  // حالة برمجية ذكية لمراقبة الصور التي تفشل في التحميل
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const toggleNode = (nodeKey: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeKey]: !prev[nodeKey]
    }));
  };

  const isRtl = lang === 'ar';

  return (
    <aside style={{ flex: '1 1 300px', maxWidth: '350px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '25px', 
        borderRadius: '16px', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        border: '1px solid #edf2f7',
        direction: isRtl ? 'rtl' : 'ltr'
      }}>
        
        {/* 3. تعديل العنوان ليكون "كتالوج قطع الغيار" فقط */}
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
          
          {/* المستوى 1: الشركات (Makes) */}
          {Object.keys(carData).map(make => {
            const makeKey = `make_${make}`;
            const isMakeOpen = expandedNodes[makeKey];
            const makeName = isRtl ? make : (translateMake[make] || make);

            return (
              <li key={make} style={{ marginBottom: '6px' }}>
                <div 
                  onClick={() => toggleNode(makeKey)}
                  style={{ ...nodeStyle, backgroundColor: isMakeOpen ? '#e2e8f0' : '#f7fafc', fontWeight: 'bold' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* نظام عرض الشعار مع حماية عند فشل التحميل */}
                    {!imgErrors[make] ? (
                      <img 
                        src={MAKE_LOGOS[make] || ''} 
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

                {/* المستوى 2: الموديلات (Models) */}
                {isMakeOpen && (
                  <ul style={{ listStyleType: 'none', padding: 0, [isRtl ? 'marginRight' : 'marginLeft']: '15px', marginTop: '4px' }}>
                    {carData[make]?.models.map((model: string) => {
                      const modelKey = `model_${make}_${model}`;
                      const isModelOpen = expandedNodes[modelKey];

                      return (
                        <li key={model} style={{ marginBottom: '4px' }}>
                          <div 
                            onClick={() => toggleNode(modelKey)}
                            style={{ ...nodeStyle, backgroundColor: isModelOpen ? '#edf2f7' : 'transparent', fontSize: '13px' }}
                          >
                            <span>📂 {model}</span>
                            <span style={{ fontSize: '9px', color: '#718096' }}>{isModelOpen ? '▼' : isRtl ? '◀' : '▶'}</span>
                          </div>

                          {/* المستوى 3: سنوات الصنع (Years) */}
                          {isModelOpen && (
                            <ul style={{ listStyleType: 'none', padding: 0, [isRtl ? 'marginRight' : 'marginLeft']: '15px', marginTop: '4px' }}>
                              {years.map(year => {
                                const yearKey = `year_${make}_${model}_${year}`;
                                const isYearOpen = expandedNodes[yearKey];

                                return (
                                  <li key={year} style={{ marginBottom: '4px' }}>
                                    <div 
                                      onClick={() => toggleNode(yearKey)}
                                      style={{ ...nodeStyle, backgroundColor: isYearOpen ? '#ebf8ff' : 'transparent', fontSize: '12px', color: '#2b6cb0' }}
                                    >
                                      <span>📅 {year}</span>
                                      <span style={{ fontSize: '9px' }}>{isYearOpen ? '▼' : isRtl ? '◀' : '▶'}</span>
                                    </div>

                                    {/* المستوى 4: أقسام قطع الغيار المترجمة */}
                                    {isYearOpen && (
                                      <ul style={{ listStyleType: 'none', padding: 0, [isRtl ? 'marginRight' : 'marginLeft']: '15px', marginTop: '4px' }}>
                                        {categories.map(category => {
                                          const categoryKey = `cat_${make}_${model}_${year}_${category}`;
                                          const isCategoryOpen = expandedNodes[categoryKey];

                                          // تطبيق الترجمة على القسم
                                          const translatedCategory = lang === 'ar' ? (CATEGORY_TRANSLATION[category] || category) : category;

                                          const filteredParts = inventory.filter(part => 
                                            part.make === make && 
                                            part.model === model && 
                                            String(part.year) === String(year) && 
                                            getPartCategory(part.name) === category
                                          );

                                          return (
                                            <li key={category} style={{ marginBottom: '3px' }}>
                                              <div 
                                                onClick={() => toggleNode(categoryKey)}
                                                style={{ ...nodeStyle, fontSize: '12px', color: '#2d3748', padding: '4px 6px' }}
                                              >
                                                <span>⚙️ {translatedCategory} <span style={{ fontSize: '10px', color: '#a0aec0' }}>({filteredParts.length})</span></span>
                                                <span style={{ fontSize: '8px', color: '#a0aec0' }}>{isCategoryOpen ? '▼' : isRtl ? '◀' : '▶'}</span>
                                              </div>

                                              {/* المستوى 5: القطع الفعلية */}
                                              {isCategoryOpen && (
                                                <div style={{ 
                                                  padding: '6px 12px', 
                                                  backgroundColor: '#fffaf0', 
                                                  borderRadius: '6px', 
                                                  border: '1px solid #feebc8',
                                                  marginTop: '2px',
                                                  display: 'flex',
                                                  flexDirection: 'column',
                                                  gap: '6px',
                                                  [isRtl ? 'marginRight' : 'marginLeft']: '12px'
                                                }}>
                                                  {filteredParts.length === 0 ? (
                                                    <span style={{ color: '#a0aec0', fontSize: '11px', fontStyle: 'italic' }}>
                                                      {lang === 'ar' ? 'لا توجد قطع متوفرة لهذا الموديل' : 'No parts available'}
                                                    </span>
                                                  ) : (
                                                    filteredParts.map(part => (
                                                      <div 
                                                        key={part.id}
                                                        onClick={() => setSearchTerm(part.name)}
                                                        style={{ 
                                                          cursor: 'pointer', 
                                                          fontSize: '12px', 
                                                          color: '#dd6b20',
                                                          padding: '3px 0',
                                                          borderBottom: '1px dashed #fbd38d',
                                                          fontWeight: '500',
                                                          transition: 'all 0.2s'
                                                        }}
                                                        onMouseOver={(e) => e.currentTarget.style.color = '#9c4221'}
                                                        onMouseOut={(e) => e.currentTarget.style.color = '#dd6b20'}
                                                      >
                                                        📦 {part.name}
                                                      </div>
                                                    ))
                                                  )}
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
