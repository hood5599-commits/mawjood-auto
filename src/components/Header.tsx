import React from 'react';
import { t } from '../utils/translations.ts';
import { Logo } from './Logo';

interface HeaderProps {
  lang: 'ar' | 'en';
  setLang: (lang: 'ar' | 'en') => void;
  view: 'shop' | 'dashboard' | 'auth' | 'profile';
  setView: (view: 'shop' | 'dashboard' | 'auth' | 'profile') => void;
  session: any;
  onLogout: () => void;
  cartCount: number;      // 👈 جديد: لمعرفة عدد القطع في السلة
  onOpenCart: () => void; // 👈 جديد: لفتح نافذة السلة
}

export const Header: React.FC<HeaderProps> = ({ lang, setLang, view, setView, session, onLogout, cartCount, onOpenCart }) => {
  return (
    <header style={{ backgroundColor: '#1a365d', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.15)', flexWrap: 'wrap', gap: '15px', position: 'sticky', top: 0, zIndex: 50 }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setView('shop')}>
        <Logo />
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', letterSpacing: '0.5px' }}>{t[lang]?.title || (lang === 'ar' ? 'موجود أوتو' : 'Mawjood Auto')}</h1>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        
        {/* 🛒 أيقونة سلة المشتريات */}
        <button onClick={onOpenCart} style={{ position: 'relative', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '22px', padding: '5px', marginRight: '10px' }}>
          🛒
          {cartCount > 0 && (
            <span style={{ position: 'absolute', top: '-5px', right: '-8px', backgroundColor: '#e53e3e', color: 'white', fontSize: '12px', fontWeight: 'bold', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              {cartCount}
            </span>
          )}
        </button>

        <button 
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} 
          style={{ padding: '6px 12px', backgroundColor: '#2a4365', color: '#90cdf4', border: '1px solid #4299e1', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
        >
          {lang === 'ar' ? '🇬🇧 English' : '🇶🇦 العربية'}
        </button>

        <button onClick={() => setView('shop')} style={{ padding: '8px 15px', backgroundColor: view === 'shop' ? '#3182ce' : 'transparent', color: 'white', border: view === 'shop' ? 'none' : '1px solid #4a5568', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
          {t[lang]?.browseParts || (lang === 'ar' ? 'تصفح القطع' : 'Browse Parts')}
        </button>
        
        {session && session.role === 'garage' && (
          <button onClick={() => setView('dashboard')} style={{ padding: '8px 15px', backgroundColor: view === 'dashboard' ? '#dd6b20' : 'transparent', color: 'white', border: view === 'dashboard' ? 'none' : '1px solid #4a5568', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
            {t[lang]?.garagePanel || (lang === 'ar' ? 'لوحة الكراج' : 'Garage Panel')}
          </button>
        )}

        {session ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#2a4365', padding: '6px 15px', borderRadius: '30px' }}>
            {/* 👤 زر الملف الشخصي */}
            <button onClick={() => setView('profile')} style={{ backgroundColor: 'transparent', border: 'none', color: view === 'profile' ? '#63b3ed' : '#e2e8f0', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
              👤 {lang === 'ar' ? 'حسابي' : 'Profile'}
            </button>
            <span style={{ color: '#4a5568' }}>|</span>
            <button onClick={onLogout} style={{ backgroundColor: 'transparent', border: 'none', color: '#fc8181', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
              {t[lang]?.logout || (lang === 'ar' ? 'تسجيل خروج' : 'Logout')}
            </button>
          </div>
        ) : (
          <button onClick={() => setView('auth')} style={{ padding: '8px 15px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
            {t[lang]?.loginRegister || (lang === 'ar' ? 'دخول / تسجيل' : 'Login / Register')}
          </button>
        )}
      </div>
    </header>
  );
};
