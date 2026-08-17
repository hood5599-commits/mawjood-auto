import React, { useState, useMemo, useEffect } from 'react';
import { AITranslatedText } from '../AITranslatedText';

interface MyPartsTabProps {
  isRtl: boolean;
  lang: 'ar' | 'en';
  myParts: any[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenExcelModal: () => void;
  onEditPart: (part: any) => void;
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

  // 📄 إعدادات تقسيم الصفحات (Pagination)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);

  // 🔍 فلاتر سريعة إضافية
  const [selectedMakeFilter, setSelectedMakeFilter] = useState<string>('all');
  const [selectedStockFilter, setSelectedStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');

  // استخراج قائمة الماركات المتوفرة تلقائياً
  const availableMakes = useMemo(() => {
    return Array.from(new Set(myParts.map(p => p.make).filter(Boolean)));
  }, [myParts]);

  // تصفية القطع بناءً على البحث والماركة والمخزون
  const filteredParts = useMemo(() => {
    return myParts.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || (
        String(p.name || '').toLowerCase().includes(q) ||
        String(p.part_number || '').toLowerCase().includes(q) ||
        String(p.make || '').toLowerCase().includes(q) ||
        String(p.model || '').toLowerCase().includes(q) ||
        String(p.category || '').toLowerCase().includes(q)
      );

      const matchMake = selectedMakeFilter === 'all' || p.make === selectedMakeFilter;

      const stockNum = Number(p.stock ?? 1);
      const matchStock = 
        selectedStockFilter === 'all' ? true :
        selectedStockFilter === 'in_stock' ? stockNum > 0 :
        stockNum <= 0;

      return matchSearch && matchMake && matchStock;
    });
  }, [myParts, searchQuery, selectedMakeFilter, selectedStockFilter]);

  // إعادة ضبط الصفحة إلى رقم 1 فور تغيير أي فلتر بحث
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedMakeFilter, selectedStockFilter, itemsPerPage]);

  // حسابات تقسيم الصفحات واستخراج عناصر الصفحة الحالية فقط
  const totalPages = Math.ceil(filteredParts.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedParts = filteredParts.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '26px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', direction: isRtl ? 'rtl' : 'ltr' }}>
      
      {/* 🌟 الهيدر وأدوات التحكم */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', color: '#1f3a5f', fontSize: '18px', fontWeight: 'bold' }}>
            {isRtl ? `إدارة معروضات الكراج (${filteredParts.length} قطعة)` : `Manage Ads (${filteredParts.length} parts)`}
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            {isRtl ? `عرض ${filteredParts.length > 0 ? startIndex + 1 : 0} إلى ${Math.min(startIndex + itemsPerPage, filteredParts.length)} من أصل ${filteredParts.length}` : `Showing ${startIndex + 1} - ${Math.min(startIndex + itemsPerPage, filteredParts.length)} of ${filteredParts.length}`}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* محدد عدد العناصر بالصفحة */}
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#f8fafc' }}
          >
            <option value={20}>20 {isRtl ? 'قطعة / صفحة' : 'per page'}</option>
            <option value={50}>50 {isRtl ? 'قطعة / صفحة' : 'per page'}</option>
            <option value={100}>100 {isRtl ? 'قطعة / صفحة' : 'per page'}</option>
          </select>

          {/* تبديل العرض بين جدول وبطاقات */}
          <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '3px' }}>
            <button onClick={() => setViewMode('table')} style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', backgroundColor: viewMode === 'table' ? '#1f3a5f' : 'transparent', color: viewMode === 'table' ? '#ffffff' : '#64748b', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>📄 جدول</button>
            <button onClick={() => setViewMode('cards')} style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', backgroundColor: viewMode === 'cards' ? '#1f3a5f' : 'transparent', color: viewMode === 'cards' ? '#ffffff' : '#64748b', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>🎴 بطاقات</button>
          </div>

          <button onClick={onOpenExcelModal} style={{ padding: '8px 14px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12.5px' }}>📄 رفع إكسل</button>
        </div>
      </div>

      {/* 🔍 شريط البحث والفلاتر السريعة */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '16px' }}>
        <input
          type="text"
          placeholder={isRtl ? "🔍 بحث برقم OEM، الاسم، أو الموديل..." : "🔍 Search by PN, Name, Model..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13px', backgroundColor: '#f8fafc', gridColumn: 'span 2' }}
        />

        <select
          value={selectedMakeFilter}
          onChange={(e) => setSelectedMakeFilter(e.target.value)}
          style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13px', backgroundColor: '#ffffff', fontWeight: 'bold' }}
        >
          <option value="all">🚗 {isRtl ? 'كل الماركات' : 'All Makes'}</option>
          {availableMakes.map((m: any) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <select
          value={selectedStockFilter}
          onChange={(e) => setSelectedStockFilter(e.target.value as any)}
          style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13px', backgroundColor: '#ffffff', fontWeight: 'bold' }}
        >
          <option value="all">📦 {isRtl ? 'كل حالات المخزون' : 'All Stock Status'}</option>
          <option value="in_stock">✅ {isRtl ? 'متوفر بالمخزون' : 'In Stock'}</option>
          <option value="out_of_stock">⚠️ {isRtl ? 'نفد من المخزون' : 'Out of Stock'}</option>
        </select>
      </div>

      {/* 📊 عرض الجدول المدمج */}
      {viewMode === 'table' ? (
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isRtl ? 'right' : 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', color: '#1f3a5f', borderBottom: '2px solid #cbd5e0' }}>
                <th style={{ padding: '12px 10px' }}>الصورة</th>
                <th style={{ padding: '12px 10px' }}>اسم القطعة / OEM</th>
                <th style={{ padding: '12px 10px' }}>الماركة والموديل</th>
                <th style={{ padding: '12px 10px' }}>السعر</th>
                <th style={{ padding: '12px 10px' }}>المخزون</th>
                <th style={{ padding: '12px 10px', textAlign: 'center' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {paginatedParts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    {isRtl ? 'لا توجد نتائج مطابقة لخيارات البحث' : 'No matching parts found'}
                  </td>
                </tr>
              ) : (
                paginatedParts.map(part => {
                  const isInline = inlineEditingPartId === part.id;
                  return (
                    <tr key={part.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#ffffff' }}>
                      <td style={{ padding: '8px 10px' }}>
                        <img 
                          src={part.image_url || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=80&q=80'} 
                          alt={part.name} 
                          style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }} 
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=80&q=80'; }}
                        />
                      </td>

                      <td style={{ padding: '8px 10px' }}>
                        <strong style={{ color: '#1f3a5f', display: 'block' }}>
                          <AITranslatedText text={part.name} lang={lang} />
                        </strong>
                        {part.part_number && <span style={{ fontSize: '11px', color: '#e0872a', fontFamily: 'monospace' }}>PN: {part.part_number}</span>}
                      </td>

                      <td style={{ padding: '8px 10px', color: '#475569' }}>
                        <span style={{ fontWeight: 'bold', color: '#1f3a5f' }}>{part.make}</span> {part.model} ({part.year})
                        {part.engine && <div style={{ fontSize: '11px', color: '#64748b' }}>⚡ {part.engine}</div>}
                      </td>

                      <td style={{ padding: '8px 10px' }}>
                        {isInline ? (
                          <input
                            type="number"
                            value={inlinePrice}
                            onChange={(e) => setInlinePrice(e.target.value)}
                            style={{ width: '75px', padding: '4px', borderRadius: '4px', border: '1px solid #e0872a', fontWeight: 'bold' }}
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
                            style={{ width: '55px', padding: '4px', borderRadius: '4px', border: '1px solid #e0872a', fontWeight: 'bold' }}
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
                              ⚡ سريع
                            </button>
                            <button 
                              onClick={() => onEditPart(part)} 
                              style={{ padding: '4px 8px', backgroundColor: '#ebf8ff', color: '#2b6cb0', border: '1px solid #bee3f8', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11.5px' }}
                            >
                              تعديل
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
        /* 🎴 عرض البطاقات */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
          {paginatedParts.map(part => (
            <div key={part.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', backgroundColor: '#f8fafc', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <img 
                  src={part.image_url || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=100&q=80'} 
                  alt={part.name} 
                  style={{ width: '65px', height: '65px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #cbd5e0' }} 
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=100&q=80'; }}
                />
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 4px 0', color: '#1f3a5f', fontSize: '14px' }}>
                    <AITranslatedText text={part.name} lang={lang} />
                  </h4>
                  {part.part_number && <span style={{ fontSize: '11px', color: '#e0872a', fontWeight: 'bold', display: 'block' }}>PN: {part.part_number}</span>}
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{part.make} - {part.model} ({part.year})</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '8px', alignItems: 'center' }}>
                <strong style={{ color: '#16a34a', fontSize: '15px' }}>{part.price} QAR</strong>
                <span style={{ fontSize: '12px', color: '#1f3a5f', fontWeight: 'bold' }}>المخزون: {part.stock ?? 1}</span>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button onClick={() => onEditPart(part)} style={{ flex: 1, padding: '7px', backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>تعديل</button>
                <button onClick={() => onDeletePart(part.id)} style={{ padding: '7px 12px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>حذف</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🧭 شريط أزرار التنقل بين الصفحات (Pagination Bar) */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '22px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
          
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e0', backgroundColor: currentPage === 1 ? '#f1f5f9' : '#ffffff', color: currentPage === 1 ? '#94a3b8' : '#1f3a5f', fontWeight: 'bold', fontSize: '12.5px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
          >
            {isRtl ? '◀ السابق' : '◀ Prev'}
          </button>

          {/* أرقام الصفحات */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5 && currentPage > 3) {
                pageNum = Math.min(currentPage - 2 + i, totalPages - (4 - i));
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    border: pageNum === currentPage ? 'none' : '1px solid #cbd5e0',
                    backgroundColor: pageNum === currentPage ? '#1f3a5f' : '#ffffff',
                    color: pageNum === currentPage ? '#ffffff' : '#1f3a5f',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e0', backgroundColor: currentPage === totalPages ? '#f1f5f9' : '#ffffff', color: currentPage === totalPages ? '#94a3b8' : '#1f3a5f', fontWeight: 'bold', fontSize: '12.5px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
          >
            {isRtl ? 'التالي ▶' : 'Next ▶'}
          </button>

          <span style={{ fontSize: '12px', color: '#64748b', marginInlineStart: '10px' }}>
            {isRtl ? `صفحة ${currentPage} من ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
          </span>
        </div>
      )}

    </div>
  );
};

export default MyPartsTab;
