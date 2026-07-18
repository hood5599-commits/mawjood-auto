import React from 'react';
import { t } from '../utils/translations.ts';
import { Logo } from './Logo'; // تم استدعاء الشعار هنا

interface HeaderProps {
  lang: 'ar' | 'en';
  setLang: (lang: 'ar' | 'en') => void;
  view: 'shop' | 'dashboard' | 'auth';
  setView: (view: 'shop' | 'dashboard' | 'auth') => void;
  session: any;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ lang, setLang, view, setView, session, onLogout }) => {
  return (
    <header style={{ backgroundColor: '#1a365d', color: 'white', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', flexWrap: 'wrap', gap: '15px' }}>
      
      {/* تم تغيير الإيموجي ووضع الشعار الجديد هنا */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setView('shop')}>
        <Logo />
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{t[lang].title}</h1>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} 
          style={{ padding: '8px 16px', backgroundColor: '#2a4365', color: '#90cdf4', border: '1px solid #4299e1', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
        >
          {lang === 'ar' ? '🇬🇧 English' : '🇶🇦 العربية'}
        </button>

        <button onClick={() => setView('shop')} style={{ padding: '10px 20px', backgroundColor: view === 'shop' ? '#3182ce' : 'transparent', color: 'white', border: view === 'shop' ? 'none' : '1px solid #4a5568', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
          {t[lang].browseParts}
        </button>
        
        {session && session.role === 'garage' && (
          <button onClick={() => setView('dashboard')} style={{ padding: '10px 20px', backgroundColor: view === 'dashboard' ? '#dd6b20' : 'transparent', color: 'white', border: view === 'dashboard' ? 'none' : '1px solid #4a5568', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
            {t[lang].garagePanel}
          </button>
        )}

        {session ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#2a4365', padding: '6px 15px', borderRadius: '30px' }}>
            <span style={{ fontSize: '13px', color: '#e2e8f0' }}>
              {session.role === 'garage' ? t[lang].certifiedGarage : t[lang].client} <strong style={{ color: 'white' }}>{session.email ? session.email.split('@')[0] : session.phone}</strong>
            </span>
            <button onClick={onLogout} style={{ backgroundColor: 'transparent', border: 'none', color: '#fc8181', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
              {t[lang].logout}
            </button>
          </div>
        ) : (
          <button onClick={() => setView('auth')} style={{ padding: '10px 20px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
            {t[lang].loginRegister}
          </button>
        )}
      </div>
    </header>
  );
};
