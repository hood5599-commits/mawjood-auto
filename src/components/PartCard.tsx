import React from 'react';
import { t } from '../utils/translations';
import { AITranslatedText } from './AITranslatedText';

interface PartCardProps {
  lang: 'ar' | 'en';
  item: any;
  translateMake?: any;
  onBuy?: (item: any) => void;
  onBuyClick?: (item: any) => void;
  onAddToCartDirect?: (item: any) => void; // 🛒 خاصية الإضافة المباشرة للسلة
  onShare?: (item: any) => void;
  onShareClick?: (item: any) => Promise<void> | void; 
}

export const PartCard: React.FC<PartCardProps> = ({ 
  lang, 
  item, 
  translateMake = {}, 
  onBuy, 
  onBuyClick, 
  onAddToCartDirect,
  onShare,
  onShareClick 
}) => {
  const handleInquire = onBuyClick || onBuy || (() => {});
  const handleShare = onShareClick || onShare || (() => {});

  // 🛒 دالة الإضافة المباشرة للسلة مع توحيد بيانات الصورة
  const handleDirectCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // تجهيز كائن القطعة بالصورة الموحدة
    const formattedItem = {
      ...item,
      image: item.image_url || item.image || item.part_image || 'https://via.placeholder.com/150',
      image_url: item.image_url || item.image || item.part_image || 'https://via.placeholder.com/150',
      quantity: 1
    };

    if (onAddToCartDirect) {
      onAddToCartDirect(formattedItem);
    } else {
      // fallback في حال لم تُمرر الخاصية
      handleInquire(formattedItem);
    }
  };

  return (
    <div 
      style={{ 
        backgroundColor: 'white', 
        borderRadius: '16px', 
        overflow: 'hidden', 
        boxShadow: '0 4px 15px rgba(0,0,0,0.02)', 
        display: 'flex', 
        flexDirection: 'column', 
        transition: 'transform 0.2s, box-shadow 0.2s' 
      }} 
      onMouseOver={(e) => { 
        e.currentTarget.style.transform = 'translateY(-4px)'; 
        e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.05)'; 
      }} 
      onMouseOut={(e) => { 
        e.currentTarget.style.transform = 'none'; 
        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.02)'; 
      }}
    >
      <div style={{ height: '180px', overflow: 'hidden', position: 'relative', backgroundColor: '#f7fafc' }}>
        <img 
          src={item.image_url || item.image || item.part_image} 
          alt={item.name} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          onError={(e) => { 
            e.currentTarget.src = 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80'; 
          }} 
        />
        <span style={{ 
          position: 'absolute', 
          top: '10px', 
          right: lang === 'ar' ? 'auto' : '10px', 
          left: lang === 'ar' ? '10px' : 'auto', 
          backgroundColor: '#1f3a5f', 
          color: 'white', 
          fontSize: '11px', 
          fontWeight: 'bold', 
          padding: '4px 10px', 
          borderRadius: '12px' 
        }}>
          {item.year}
        </span>
      </div>

      <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h4 style={{ margin: 0, fontSize: '15px', color: '#1f3a5f', fontWeight: 'bold', lineHeight: '1.4' }}>
          <AITranslatedText text={item.name} lang={lang} />
        </h4>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          <span style={{ backgroundColor: '#ebf8ff', color: '#2b6cb0', fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '6px' }}>
            🚗 {lang === 'ar' ? item.make : (translateMake[item.make] || item.make)}
          </span>
          <span style={{ backgroundColor: '#f0fff4', color: '#2f855a', fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '6px' }}>
            🚘 {item.model}
          </span>
          {item.engine && (
            <span style={{ backgroundColor: '#fffaf0', color: '#dd6b20', fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '6px', width: '100%' }}>
              🔌 {item.engine}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid #edf2f7', paddingTop: '10px' }}>
          <span style={{ fontSize: '12px', color: '#718096' }}>{t[lang]?.expectedPrice || (lang === 'ar' ? 'السعر المتوقع' : 'Expected Price')}:</span>
          <strong style={{ fontSize: '17px', color: '#e0872a' }}>
            {item.price} <span style={{ fontSize: '12px' }}>{t[lang]?.currency || (lang === 'ar' ? 'ر.ق' : 'QAR')}</span>
          </strong>
        </div>

        {/* 🛠️ أزرار التفاعل المقسمة بوضوح */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
          
          {/* 🛒 1. زر إضافة مباشرة للسلة */}
          <button 
            type="button"
            onClick={handleDirectCart} 
            style={{ 
              flex: 1, 
              padding: '9px 6px', 
              backgroundColor: '#1f3a5f', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              fontWeight: 'bold', 
              cursor: 'pointer', 
              fontSize: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '4px' 
            }}
          >
            🛒 {lang === 'ar' ? 'أضف للسلة' : 'Add to Cart'}
          </button>
          
          {/* 🔍 2. زر اسأل البائع / فحص الشاصي */}
          <button 
            type="button"
            onClick={() => handleInquire(item)} 
            style={{ 
              padding: '9px 10px', 
              backgroundColor: '#f1f5f9', 
              color: '#1f3a5f', 
              border: '1px solid #cbd5e0', 
              borderRadius: '8px', 
              fontWeight: 'bold', 
              cursor: 'pointer', 
              fontSize: '11.5px' 
            }}
          >
            🔍 {lang === 'ar' ? 'فحص' : 'Inquire'}
          </button>

          {/* 🔗 3. زر المشاركة */}
          <button 
            type="button"
            onClick={() => handleShare(item)} 
            style={{ 
              padding: '9px 10px', 
              backgroundColor: '#edf2f7', 
              color: '#4a5568', 
              border: 'none', 
              borderRadius: '8px', 
              fontWeight: 'bold', 
              cursor: 'pointer', 
              fontSize: '11.5px' 
            }}
          >
            {t[lang]?.share || (lang === 'ar' ? 'مشاركة' : 'Share')}
          </button>

        </div>
      </div>
    </div>
  );
};

export default PartCard;
