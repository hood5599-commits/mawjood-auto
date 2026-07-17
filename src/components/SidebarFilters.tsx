import React, { useState } from 'react';
import { t } from '../utils/translations';
import { getPartCategory } from '../utils/categoryHelper';

interface SidebarProps {
  lang: 'ar' | 'en';
  carData: any;
  years: string[];
  translateMake: any;
  categories: string[];
  inventory: any[];
  setSearchTerm: (term: string) => void;
}

export const SidebarFilters: React.FC<SidebarProps> = ({
  lang, carData, years, translateMake, categories, inventory, setSearchTerm
}) => {
  // حالة لتخزين الفروع المفتوحة في الشجرة
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // دالة لفتح وإغلاق الفروع
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
        
        {/* عنوان شجرة البحث */}
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
          📋 {lang === 'ar' ? 'كتالوج قطع الغيار (RockAuto)' : 'Parts Catalog (RockAuto)'}
        </h3>

        {/* بداية الشجرة المتداخلة */}
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
                  <span>🚗 {makeName}</span>
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

                                    {/* المستوى 4: أقسام قطع الغيار (Categories) */}
                                    {isYearOpen && (
                                      <ul style={{ listStyleType: 'none', padding: 0, [isRtl ? 'marginRight' : 'marginLeft']: '15px', marginTop: '4px' }}>
                                        {categories.map(category => {
                                          const categoryKey = `cat_${make}_${model}_${year}_${category}`;
                                          const isCategoryOpen = expandedNodes[categoryKey];

                                          // تصفية المخزون بدقة متناهية بناءً على فرع الشجرة الحالي فقط
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
                                                <span>⚙️ {category} <span style={{ fontSize: '10px', color: '#a0aec0' }}>({filteredParts.length})</span></span>
                                                <span style={{ fontSize: '8px', color: '#a0aec0' }}>{isCategoryOpen ? '▼' : isRtl ? '◀' : '▶'}</span>
                                              </div>

                                              {/* المستوى 5 والأخير: القطع الفعلية داخل شجرة البحث فقط! */}
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

// تنسيق مشترك وموحد لعناصر الشجرة لجعلها تبدو كبرنامج احترافي
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
