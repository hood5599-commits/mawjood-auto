import React, { useState } from 'react';
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

  const [isHovered, setIsHovered] = useState(false);
  const [cartPressed, setCartPressed] = useState(false);
  const [inquireHover, setInquireHover] = useState(false);
  const [shareHover, setShareHover] = useState(false);

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

    // micro feedback animation
    setCartPressed(true);
    setTimeout(() => setCartPressed(false), 180);

    if (onAddToCartDirect) {
      onAddToCartDirect(formattedItem);
    } else {
      // fallback في حال لم تُمرر الخاصية
      handleInquire(formattedItem);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: isHovered
          ? '0 20px 40px -12px rgba(31,58,95,0.18), 0 4px 10px rgba(31,58,95,0.06)'
          : '0 2px 8px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
        border: '1px solid rgba(15,23,42,0.05)',
        display: 'flex',
        flexDirection: 'column',
        transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      }}
    >
      {/* 🖼️ Image */}
      <div style={{ height: '180px', overflow: 'hidden', position: 'relative', backgroundColor: '#f4f6f9' }}>
        <img
          src={item.image_url || item.image || item.part_image}
          alt={item.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: isHovered ? 'scale(1.06)' : 'scale(1)',
            transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)'
          }}
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80';
          }}
        />

        {/* subtle gradient overlay for legibility */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.12) 100%)',
            pointerEvents: 'none'
          }}
        />

        <span
          style={{
            position: 'absolute',
            top: '12px',
            right: lang === 'ar' ? 'auto' : '12px',
            left: lang === 'ar' ? '12px' : 'auto',
            background: 'linear-gradient(135deg, #24466f 0%, #1f3a5f 100%)',
            color: 'white',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.3px',
            padding: '5px 12px',
            borderRadius: '20px',
            boxShadow: '0 4px 10px rgba(31,58,95,0.35)',
            backdropFilter: 'blur(4px)'
          }}
        >
          {item.year}
        </span>
      </div>

      {/* 📋 Content */}
      <div style={{ padding: '18px 18px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h4
          style={{
            margin: 0,
            fontSize: '15px',
            color: '#16283f',
            fontWeight: 700,
            lineHeight: '1.4',
            letterSpacing: '-0.1px'
          }}
        >
          <AITranslatedText text={item.name} lang={lang} />
        </h4>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          <span
            style={{
              backgroundColor: '#eaf3fc',
              color: '#1f3a5f',
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            🚗 {lang === 'ar' ? item.make : (translateMake[item.make] || item.make)}
          </span>
          <span
            style={{
              backgroundColor: '#eafaf1',
              color: '#1f7a4d',
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            🚘 {item.model}
          </span>
          {item.engine && (
            <span
              style={{
                backgroundColor: '#fff4e6',
                color: '#b25e14',
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '8px',
                width: '100%',
                boxSizing: 'border-box',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              🔌 {item.engine}
            </span>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 'auto',
            borderTop: '1px solid #f0f2f5',
            paddingTop: '12px'
          }}
        >
          <span style={{ fontSize: '12px', color: '#8a94a3', fontWeight: 500 }}>
            {t[lang]?.expectedPrice || (lang === 'ar' ? 'السعر المتوقع' : 'Expected Price')}:
          </span>
          <strong style={{ fontSize: '19px', color: '#e0872a', fontWeight: 800, letterSpacing: '-0.2px' }}>
            {item.price} <span style={{ fontSize: '12px', color: '#e0872a', fontWeight: 700 }}>{t[lang]?.currency || (lang === 'ar' ? 'ر.ق' : 'QAR')}</span>
          </strong>
        </div>

        {/* 🛠️ أزرار التفاعل المقسمة بوضوح */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>

          {/* 🛒 1. زر إضافة مباشرة للسلة */}
          <button
            type="button"
            onClick={handleDirectCart}
            style={{
              flex: 1,
              padding: '11px 8px',
              background: 'linear-gradient(135deg, #24466f 0%, #1f3a5f 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              boxShadow: '0 4px 12px rgba(31,58,95,0.28)',
              transform: cartPressed ? 'scale(0.96)' : 'scale(1)',
              transition: 'transform 0.15s ease, box-shadow 0.25s ease, opacity 0.2s ease'
            }}
          >
            🛒 {lang === 'ar' ? 'أضف للسلة' : 'Add to Cart'}
          </button>

          {/* 🔍 2. زر اسأل البائع / فحص الشاصي */}
          <button
            type="button"
            onClick={() => handleInquire(item)}
            onMouseEnter={() => setInquireHover(true)}
            onMouseLeave={() => setInquireHover(false)}
            style={{
              padding: '11px 12px',
              backgroundColor: inquireHover ? '#e8edf3' : '#f4f6f9',
              color: '#1f3a5f',
              border: '1px solid #dbe2ea',
              borderRadius: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'background-color 0.2s ease, border-color 0.2s ease'
            }}
          >
            🔍 {lang === 'ar' ? 'فحص' : 'Inquire'}
          </button>

          {/* 🔗 3. زر المشاركة */}
          <button
            type="button"
            onClick={() => handleShare(item)}
            onMouseEnter={() => setShareHover(true)}
            onMouseLeave={() => setShareHover(false)}
            style={{
              padding: '11px 12px',
              backgroundColor: shareHover ? '#e4e9f0' : '#eef1f5',
              color: '#4a5568',
              border: '1px solid transparent',
              borderRadius: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'background-color 0.2s ease'
            }}
          >
            🔗 {t[lang]?.share || (lang === 'ar' ? 'مشاركة' : 'Share')}
          </button>

        </div>
      </div>
    </div>
  );
};

export default PartCard;
