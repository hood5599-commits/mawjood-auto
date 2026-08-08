import React from 'react';

interface HeaderProps {
  lang: 'ar' | 'en';
  setLang: (lang: 'ar' | 'en') => void;
  view: string;
  setView: (view: any) => void;
  session: any;
  cartCount: number;
  onOpenCart: () => void;
  onLogout: () => void;
  onRequestCustomPart?: () => void;
  onOpenOrdersTracker?: () => void; // 👈 إضافة الخاصية لفتح متابعة الطلبات
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  setLang,
  setView,
  session,
  cartCount,
  onOpenCart,
  onLogout,
  onRequestCustomPart,
  onOpenOrdersTracker
}) => {
  const isRtl = lang === 'ar';

  return (
    <header style={{
      backgroundColor: '#ffffff',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      padding: '14px 24px',
      position: 'sticky',
      top: 0,
      zIndex: 90,
      direction: isRtl ? 'rtl' : 'ltr',
      fontFamily: 'Cairo, sans-serif'
    }}>
      <div style={{
        maxWidth: '1240px',
        margin: '0 auto',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center'
      }}>
        
        {/* 1️⃣ الشعار النصي الفخم */}
        <div 
          onClick={() => setView('shop')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '24px', fontWeight: '900', color: '#1f3a5f', letterSpacing: '-0.5px', lineHeight: '1.1' }}>
              {lang === 'ar' ? 'موجود ' : 'Mawjood '} 
              <span style={{ color: '#e0872a' }}>{lang === 'ar' ? 'أوتو' : 'Auto'}</span>
            </span>
            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', letterSpacing: '1.5px', marginTop: '2px' }}>
              MAWJOOD AUTO
            </span>
          </div>
        </div>

        {/* 2️⃣ عناصر التحكم والأزرار */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          {/* 🛠️ زر طلب قطعة غير متوفرة */}
          {onRequestCustomPart && (
            <button
              onClick={onRequestCustomPart}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1px solid #e0872a',
                backgroundColor: '#fff7ed',
                color: '#c2410c',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(224,135,42,0.15)'
              }}
            >
              🛠️ {lang === 'ar' ? 'طلب قطعة غير متوفرة' : 'Request Part'}
            </button>
          )}

          {/* 📦 زر طلباتي السابقة والمتابعة (يظهر عندما يتم تمرير الدالة) */}
          {onOpenOrdersTracker && (
            <button
              onClick={onOpenOrdersTracker}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e0',
                backgroundColor: '#f1f5f9',
                color: '#1f3a5f',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              📦 {lang === 'ar' ? 'طلباتي السابقة' : 'My Orders'}
            </button>
          )}

          {/* زر تغيير اللغة */}
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '13px',
              color: '#475569'
            }}
          >
            🌐 {lang === 'ar' ? 'English' : 'عربي'}
          </button>

          {/* زر السلة الجانبية */}
          <button
            onClick={onOpenCart}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '13px',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🛒 {lang === 'ar' ? 'السلة' : 'Cart'}
            {cartCount > 0 && (
              <span style={{
                backgroundColor: '#e0872a',
                color: '#ffffff',
                borderRadius: '50%',
                padding: '2px 7px',
                fontSize: '11px',
                fontWeight: 'bold'
              }}>
                {cartCount}
              </span>
            )}
          </button>

          {/* زر الحساب وزر الخروج */}
          {session ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              
              <button
                onClick={() => {
                  if (session.role === 'admin' || session.email?.endsWith('@admin.mawjood.com')) setView('admin');
                  else if (session.role === 'driver' || session.email?.endsWith('@driver.mawjood.com')) setView('driver');
                  else if (session.role === 'garage') setView('dashboard');
                  else setView('profile');
                }}
                style={{
                  padding: '9px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#1f3a5f',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                👤 {lang === 'ar' ? 'حسابي' : 'Account'}
              </button>

              {/* 🚪 زر الخروج */}
              <button
                onClick={onLogout}
                title={lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                style={{
                  padding: '9px 14px',
                  borderRadius: '10px',
                  border: '1px solid #fecaca',
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                🚪 {lang === 'ar' ? 'خروج' : 'Logout'}
              </button>

            </div>
          ) : (
            <button
              onClick={() => setView('auth')}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#1f3a5f',
                color: '#ffffff',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px'
              }}
            >
              🔑 {lang === 'ar' ? 'دخول / تسجيل' : 'Login'}
            </button>
          )}

        </div>

      </div>
    </header>
  );
};

export default Header;
