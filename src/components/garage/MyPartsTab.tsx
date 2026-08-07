import React, { useState } from 'react';
import { AITranslatedText } from '../AITranslatedText';

interface MyPartsTabProps {
  isRtl: boolean;
  lang: 'ar' | 'en';
  myParts: any[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenExcelModal: () => void;
  onEditPart: (part: any) => void; // 👈 يستقبل القطعة بالكامل
  onDeletePart: (id: number) => void;
  onQuickSaveInline: (partId: number, price: string, stock: string) => void;
}

export const MyPartsTab: React.FC<MyPartsTabProps> = ({
  isRtl,
  lang,
  myParts,
  searchQuery,
  setSearchQuery,
  onOpenExcelModal,
  onEditPart,
  onDeletePart,
  onQuickSaveInline
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [inlineEditingPartId, setInlineEditingPartId] = useState<number | null>(null);
  const [inlinePrice, setInlinePrice] = useState('');
  const [inlineStock, setInlineStock] = useState('');

  const filteredParts = myParts.filter(p => 
    String(p.name || '').toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    String(p.part_number || '').toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    String(p.make || '').toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    String(p.model || '').toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div style={{ backgroundColor: 'white', padding: '26px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', direction: isRtl ? 'rtl' : 'ltr' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{ margin: 0, color: '#1f3a5f', fontSize: '18px', fontWeight: 'bold' }}>
          {isRtl ? `إدارة معروضات الكراج (${filteredParts.length} / ${myParts.length})` : `Manage Ads (${filteredParts.length})`}
        </h3>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '3px' }}>
            <button onClick={() => setViewMode('table')} style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', backgroundColor: viewMode === 'table' ? '#1f3a5f' : 'transparent', color: viewMode === 'table' ? '#ffffff' : '#64748b', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>📄 جدول مدمج</button>
            <button onClick={() => setViewMode('cards')} style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', backgroundColor: viewMode === 'cards' ? '#1f3a5f' : 'transparent', color: viewMode === 'cards' ? '#ffffff' : '#64748b', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>🎴 بطاقات</button>
          </div>
          <button onClick={onOpenExcelModal} style={{ padding: '8px 14px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12.5px' }}>📄 رفع إكسل</button>
        </div>
      </div>

      <input
        type="text"
        placeholder={isRtl ? "🔍 بحث سريع برقم القطعة OEM، اسمها، أو ماركة السيارة..." : "🔍 Search by PN, Name, or Make..."}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13.5px', marginBottom: '16px', boxSizing: 'border-box', backgroundColor: '#f8fafc' }}
      />

      {viewMode === 'table' ? (
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isRtl ? 'right' : 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', color: '#1f3a5f', borderBottom: '2px solid #cbd5e0' }}>
                <th style={{ padding: '12px 10px' }}>الصورة</th>
                <th style={{ padding: '12px 10px' }}>اسم القطعة / OEM</th>
                <th style={{ padding: '12px 10px' }}>التوافق والسيارة</th>
                <th style={{ padding: '12px 10px' }}>السعر</th>
                <th style={{ padding: '12px 10px' }}>المخزون</th>
                <th style={{ padding: '12px 10px', textAlign: 'center' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredParts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    {isRtl ? 'لا توجد نتائج مطابقة للبحث' : 'No matching parts found'}
                  </td>
                </tr>
              ) : (
                filteredParts.map(part => {
                  const isInline = inlineEditingPartId === part.id;
                  return (
                    <tr key={part.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#ffffff' }}>
                      <td style={{ padding: '8px 10px' }}>
                        <img src={part.image_url || 'https://via.placeholder.com/40'} alt={part.name} style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                      </td>

                      <td style={{ padding: '8px 10px' }}>
                        <strong style={{ color: '#1f3a5f', display: 'block' }}>
                          <AITranslatedText text={part.name} lang={lang} />
                        </strong>
                        {part.part_number && <span style={{ fontSize: '11px', color: '#e0872a', fontFamily: 'monospace' }}>PN: {part.part_number}</span>}
                      </td>

                      <td style={{ padding: '8px 10px', color: '#475569' }}>
                        {part.make} - {part.model} ({part.year})
                      </td>

                      <td style={{ padding: '8px 10px' }}>
                        {isInline ? (
                          <input
                            type="number"
                            value={inlinePrice}
                            onChange={(e) => setInlinePrice(e.target.value)}
                            style={{ width: '70px', padding: '4px', borderRadius: '4px', border: '1px solid #e0872a', fontWeight: 'bold' }}
                          />
                        ) : (
                          <span style={{ fontWeight: 'bold', color: '#16a34a' }}>{part.price} QAR</span>
                        )}
                      </td>

                      <td style={{ padding: '8px 10px' }}>
                        {isInline ? (
                          <input
                            type="number"
                            value={inlineStock}
                            onChange={(e) => setInlineStock(e.target.value)}
                            style={{ width: '50px', padding: '4px', borderRadius: '4px', border: '1px solid #e0872a', fontWeight: 'bold' }}
                          />
                        ) : (
                          <span style={{ fontWeight: 'bold', color: (part.stock || 1) > 0 ? '#1f3a5f' : '#dc2626' }}>
                            {part.stock ?? 1}
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        {isInline ? (
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            <button onClick={() => { onQuickSaveInline(part.id, inlinePrice, inlineStock); setInlineEditingPartId(null); }} style={{ backgroundColor: '#16a34a', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>حفظ</button>
                            <button onClick={() => setInlineEditingPartId(null)} style={{ backgroundColor: '#94a3b8', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>إلغاء</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              onClick={() => {
                                setInlineEditingPartId(part.id);
                                setInlinePrice(String(part.price));
                                setInlineStock(String(part.stock ?? 1));
                              }}
                              title="تعديل سريع للسعر والمخزون"
                              style={{ backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '11.5px', fontWeight: 'bold' }}
                            >
                              ⚡ تعديل سريع
                            </button>
                            {/* 👈 هنا الربط المباشر مع دالة التعديل الكامل */}
                            <button 
                              onClick={() => onEditPart(part)} 
                              style={{ padding: '4px 8px', backgroundColor: '#ebf8ff', color: '#2b6cb0', border: '1px solid #bee3f8', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11.5px' }}
                            >
                              تعديل كامل
                            </button>
                            <button 
                              onClick={() => onDeletePart(part.id)} 
                              style={{ padding: '4px 8px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11.5px' }}
                            >
                              حذف
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
          {filteredParts.map(part => (
            <div key={part.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', backgroundColor: '#f8fafc', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <img src={part.image_url || 'https://via.placeholder.com/70'} alt={part.name} style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #cbd5e0' }} />
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 4px 0', color: '#1f3a5f', fontSize: '14.5px' }}>
                    <AITranslatedText text={part.name} lang={lang} />
                  </h4>
                  {part.part_number && <span style={{ fontSize: '11.5px', color: '#e0872a', fontWeight: 'bold', display: 'block' }}>PN: {part.part_number}</span>}
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{part.make} - {part.model} ({part.year})</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '8px', alignItems: 'center' }}>
                <strong style={{ color: '#16a34a', fontSize: '16px' }}>{part.price} QAR</strong>
                <span style={{ fontSize: '12px', color: '#1f3a5f', fontWeight: 'bold' }}>المخزون: {part.stock ?? 1}</span>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button onClick={() => onEditPart(part)} style={{ flex: 1, padding: '8px', backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>تعديل البيانات</button>
                <button onClick={() => onDeletePart(part.id)} style={{ padding: '8px 12px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>حذف</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
