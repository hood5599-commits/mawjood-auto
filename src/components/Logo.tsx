import React from 'react';

export const Logo: React.FC = () => {
  return (
    <svg width="34" height="34" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* الإطار السداسي الخارجي باللون البرتقالي (يرمز للميكانيكا وقطع الغيار) */}
      <path 
        d="M50 5 L90 27 L90 73 L50 95 L10 73 L10 27 Z" 
        stroke="#dd6b20" 
        strokeWidth="7" 
        strokeLinejoin="round"
      />
      {/* حرف M الداخلي باللون الأبيض */}
      <path 
        d="M28 70 L28 40 L50 58 L72 40 L72 70" 
        stroke="#FFFFFF" 
        strokeWidth="8" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
};
