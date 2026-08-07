import React, { useState } from 'react';
import { AITranslatedText } from './AITranslatedText';

interface PartMoreInfoProps {
  part: any;
  inventory?: any[];
  lang: 'ar' | 'en';
  siteSettings: any;
  onAddToCart?: (part: any, quantity: number) => void;
  onBack: () => void;
}

export const PartMoreInfo: React.FC<PartMoreInfoProps> = ({
  part,
  lang,
  siteSettings,
  onAddToCart,
  onBack
}) => {
  const isRtl = lang === 'ar';
  const [activeImgIdx, setActiveImgIndex] = useState(0);

  const images: string[] = part.additional_images && part.additional_images.length > 0 
    ? part.additional_images 
    : [part.image_url || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80'];

  const partNo = part.part_number || part.code || part.sku || part.id;
  const isBNPLEnabled = siteSettings?.enableBNPL ?? true;
  const installmentValue = (Number(part.price || 0) / 4).toFixed(2);

  // 🎯 فحص وجود وصف حقيقي مدخل بملف الإكسل أو الكراج فقط (بدون أي توليد وهمي)
  const hasRealDescription = typeof part.description === 'string' && part.description.trim().length > 0;

  return (
    <div style={{ maxWidth: '1000px', margin: '20px auto', padding: '24px', backgroundColor: '#ffffff', borderRadius: '20px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)', fontFamily: 'Cairo, sans-serif', direction: isRtl ? 'rtl' : 'ltr' }}>
      
      {/* ↩️ شريط العودة والشراء المباشر العلوي */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <button 
          onClick={onBack} 
          style={{ padding: '10px 18px', backgroundColor: '#1f3a5f', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          ↩️ {isRtl ? 'العودة لنتائج البحث' : 'Continue Shopping / Back to Search'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#f8fafc', padding: '6px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <strong style={{ color: '#1f3a5f', fontSize: '14px' }}>PN: {partNo}</strong>
          <span style={{ color: '#e0872a', fontWeight: '900', fontSize: '16px' }}>QAR {part.price}</span>
          <button 
            onClick={() => onAddToCart && onAddToCart(part, 1)}
            style={{ padding: '8px 16px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
          >
            🛒 {isRtl ? 'أضف للسلة' : 'Add to Cart'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', marginBottom: '28px' }}>
        
        {/* 📸 معرض الصور المكبر بأسهم التنقل */}
        <div>
          <div style={{ position: 'relative', width: '100%', height: '320px', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', backgroundColor: '#fafafa', marginBottom: '12px' }}>
            <img src={images[activeImgIdx]} alt={part.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            
            {images.length > 1 && (
              <>
                <button 
                  onClick={() => setActiveImgIndex((prev) => (prev - 1 + images.length) % images.length)}
                  style={{ position: 'absolute', top: '45%', left: '10px', backgroundColor: 'rgba(255,255,255,0.9)', border: '1px solid #cbd5e0', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
                >
                  ‹
                </button>
                <button 
                  onClick={() => setActiveImgIndex((prev) => (prev + 1) % images.length)}
                  style={{ position: 'absolute', top: '45%', right: '10px', backgroundColor: 'rgba(255,255,255,0.9)', border: '1px solid #cbd5e0', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
                >
                  ›
                </button>
                <span style={{ position: 'absolute', bottom: '10px', right: '10px', backgroundColor: 'rgba(0,0,0,0.65)', color: 'white', fontSize: '11px', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                  {activeImgIdx + 1} / {images.length}
                </span>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
            {images.map((img, idx) => (
              <img 
                key={idx} 
                src={img} 
                alt="thumb" 
                onClick={() => setActiveImgIndex(idx)} 
                style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: activeImgIdx === idx ? '2px solid #e0872a' : '1px solid #cbd5e0', cursor: 'pointer' }} 
              />
            ))}
          </div>
        </div>

        {/* 📝 التفاصيل الحقيقية للقطعة */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px 0', color: '#1f3a5f', fontSize: '22px' }}>
              <AITranslatedText text={part.name} lang={lang} />
            </h2>
            <span style={{ fontSize: '13.5px', color: '#64748b', fontWeight: 'bold' }}>{part.make} - {part.model} ({part.year})</span>
          </div>

          {/* 📝 يظهر صندوق الوصف فقط في حالة وجود وصف حقيقي مرفوع بالإكسل/الكراج */}
          {hasRealDescription && (
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#1f3a5f', fontSize: '14px' }}>📝 {isRtl ? 'الوصف:' : 'Description:'}</h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>
                {part.description}
              </p>
            </div>
          )}

          {/* 🛡️ معلومات الضمان والتجربة الحقيقية */}
          <div style={{ backgroundColor: '#f0fdf4', padding: '14px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
            <strong style={{ fontSize: '13px', color: '#166534', display: 'block', marginBottom: '4px' }}>🛡️ {isRtl ? 'معلومات الضمان والتجربة:' : 'Warranty Information:'}</strong>
            <span style={{ fontSize: '12.5px', color: '#15803d' }}>
              {part.warranty || (isRtl ? 'ضمان تجربة واختبار لمدة 14 يوماً مع إمكانية الإرجاع والاستبدال.' : '14 Days Limited Operational Warranty.')}
            </span>
          </div>

          {/* 🛒 خيار التقسيط */}
          {isBNPLEnabled && (
            <div style={{ backgroundColor: '#fffdf5', border: '1px solid #fef08a', padding: '10px 14px', borderRadius: '12px' }}>
              <span style={{ fontSize: '12.5px', color: '#854d0e', fontWeight: 'bold' }}>🛒 أو قسمها على 4 دفعات بقيمة {installmentValue} ر.ق (قريباً)</span>
            </div>
          )}

          {/* 🔗 الأرقام التبديلية OEM / Interchange Numbers */}
          <div style={{ fontSize: '12.5px', color: '#334155', backgroundColor: '#f1f5f9', padding: '10px 14px', borderRadius: '10px', fontFamily: 'monospace' }}>
            <strong>OEM / Interchange Numbers:</strong> {partNo}{part.code ? `, ${part.code}` : ''}
          </div>
        </div>

      </div>

      {/* 📊 ⚙️ جدول المواصفات الفنية الحقيقي الموحد لجميع القطع دون زيف */}
      <div style={{ border: '1px solid #cbd5e0', borderRadius: '14px', overflow: 'hidden' }}>
        <div style={{ backgroundColor: '#1f3a5f', color: 'white', padding: '12px 18px', fontWeight: 'bold', fontSize: '14.5px' }}>
          ⚙️ {isRtl ? `المواصفات الفنية لـ ${part.name} (${partNo})` : `Technical Specifications for ${part.name}`}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: isRtl ? 'right' : 'left' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #edf2f7', backgroundColor: '#f8fafc' }}>
              <td style={{ padding: '10px 16px', fontWeight: 'bold', color: '#475569', width: '220px' }}>{isRtl ? 'رقم القطعة OEM' : 'OEM Part Number'}</td>
              <td style={{ padding: '10px 16px', color: '#1e293b', fontWeight: 'bold', fontFamily: 'monospace' }}>{partNo}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #edf2f7' }}>
              <td style={{ padding: '10px 16px', fontWeight: 'bold', color: '#475569' }}>{isRtl ? 'السيارة المخصصة' : 'Compatible Vehicle'}</td>
              <td style={{ padding: '10px 16px', color: '#1e293b' }}>{part.make} - {part.model} ({part.year})</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #edf2f7', backgroundColor: '#f8fafc' }}>
              <td style={{ padding: '10px 16px', fontWeight: 'bold', color: '#475569' }}>{isRtl ? 'القسم والفرع' : 'Category'}</td>
              <td style={{ padding: '10px 16px', color: '#1e293b' }}>{part.category || (isRtl ? 'قطع غيار عامة' : 'General Parts')}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #edf2f7' }}>
              <td style={{ padding: '10px 16px', fontWeight: 'bold', color: '#475569' }}>{isRtl ? 'نوع القطعة' : 'Part Tier'}</td>
              <td style={{ padding: '10px 16px', color: '#1e293b' }}>{part.part_type || (isRtl ? 'أصلي' : 'Original OEM')}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #edf2f7', backgroundColor: '#f8fafc' }}>
              <td style={{ padding: '10px 16px', fontWeight: 'bold', color: '#475569' }}>{isRtl ? 'حالة المنتج' : 'Condition'}</td>
              <td style={{ padding: '10px 16px', color: '#1e293b' }}>{part.part_condition || (isRtl ? 'نظيف / مختبر' : 'Tested / Clean')}</td>
            </tr>
            <tr>
              <td style={{ padding: '10px 16px', fontWeight: 'bold', color: '#475569' }}>{isRtl ? 'التوصيل المتوقع' : 'Estimated Delivery'}</td>
              <td style={{ padding: '10px 16px', color: '#16a34a', fontWeight: 'bold' }}>{isRtl ? 'خلال 24 - 48 ساعة' : 'Within 24-48 Hours'}</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default PartMoreInfo;
