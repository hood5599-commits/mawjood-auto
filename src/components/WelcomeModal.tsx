import React from 'react';
import { t } from '../utils/translations';

interface WelcomeProps {
  lang: 'ar' | 'en';
  onStart: () => void;
}

export const WelcomeModal: React.FC<WelcomeProps> = ({ lang, onStart }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, width: '100%', height: '100%',
      background: 'linear-gradient(135deg, #1a5f7a, #22a6b3)',
      color: 'white',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      zIndex: 9999,
      direction: lang === 'ar' ? 'rtl' : 'ltr',
      fontFamily: 'Segoe UI, Tahoma, Geneva, sans-serif'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '10px', textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>
        {t[lang].welcomeTitle}
      </h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '35px', opacity: 0.9 }}>
        {t[lang].welcomeDesc}
      </p>
      <button
        onClick={onStart}
        style={{
          padding: '15px 40px', fontSize: '1.2rem',
          backgroundColor: 'white', color: '#1a5f7a',
          border: 'none', borderRadius: '30px',
          cursor: 'pointer', fontWeight: 'bold',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          transition: 'transform 0.3s'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        {t[lang].startShopping}
      </button>
    </div>
  );
};