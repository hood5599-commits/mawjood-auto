import React from 'react';

export const Logo: React.FC = () => {
  return (
    <svg width="42" height="42" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* التدرج اللوني الأزرق الفخم للدرع */}
        <linearGradient id="mwBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1F3A5F" />
          <stop offset="100%" stopColor="#152840" />
        </linearGradient>
        {/* التدرج اللوني البرتقالي لحرف M */}
        <linearGradient id="mwOrange" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E0872A" />
          <stop offset="100%" stopColor="#F2A24E" />
        </linearGradient>
      </defs>

      {/* خلفية الشعار (شكل سداسي يرمز للدرع ولقطع الغيار) */}
      <polygon points="100,10 180,50 180,140 100,190 20,140 20,50" fill="url(#mwBlue)" />
      
      {/* الخطوط الهندسية لحرف M وشكل السيارة */}
      <path 
        d="M50,110 L80,60 L100,90 L120,60 L150,110" 
        fill="none" 
        stroke="url(#mwOrange)" 
        strokeWidth="16" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* إطارات السيارة */}
      <circle cx="75" cy="140" r="14" fill="#FFFFFF" />
      <circle cx="125" cy="140" r="14" fill="#FFFFFF" />
    </svg>
  );
};
