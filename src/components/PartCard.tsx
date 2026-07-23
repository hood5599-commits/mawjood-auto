import React from 'react';
import { t } from '../utils/translations';

interface PartCardProps {
  lang: 'ar' | 'en';
  item: any;
  translateMake?: any;
  onBuy?: (item: any) => void;
  onBuyClick?: (item: any) => void;
  onShare?: (item: any) => void;
  // 👈 إضافة دعم Promise<void> لحل مشكلة Vercel بشكل نهائي
  onShareClick?: (item: any) => Promise<void> | void; 
}

export const PartCard: React.FC<PartCardProps> = ({ 
  lang, 
  item, 
  translateMake = {}, 
  onBuy, 
  onBuyClick, 
  onShare,
  onShareClick 
}) => {
  const handleBuy = onBuyClick || onBuy || (() => {});
  const handleShare = onShareClick || onShare || (() => {});

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
          src={item.image_url} 
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
          backgroundColor: '#1a365d', 
          color: 'white', 
          fontSize: '11px', 
          fontWeight: 'bold', 
          padding: '4px 10px', 
          borderRadius: '12px' 
        }}>
          {item.year}
        </span>
      </div>

      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '16px', color: '#1a365d', fontWeight: 'bold', lineHeight: '1.4' }}>{item.name}</h4>
        
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid #edf2f7', paddingTop: '12px' }}>
          <span style={{ fontSize: '12px', color: '#718096' }}>{t[lang]?.expectedPrice || (lang === 'ar' ? 'السعر المتوقع' : 'Expected Price')}:</span>
          <strong style={{ fontSize: '18px', color: '#e53e3e' }}>
            {item.price} <span style={{ fontSize: '13px' }}>{t[lang]?.currency || (lang === 'ar' ? 'ر.ق' : 'QAR')}</span>
          </strong>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
          <button 
            onClick={() => handleBuy(item)} 
            style={{ flex: 1, padding: '10px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            🛒 {lang === 'ar' ? 'أضف للسلة' : 'Add to Cart'}
          </button>
          
          <button 
            onClick={() => handleShare(item)} 
            style={{ padding: '10px 12px', backgroundColor: '#edf2f7', color: '#4a5568', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
          >
            {t[lang]?.share || (lang === 'ar' ? 'مشاركة' : 'Share')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartCard;
