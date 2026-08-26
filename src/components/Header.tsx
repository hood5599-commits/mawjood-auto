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
  onOpenOrdersTracker?: () => void;
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
      backgroundColor: 'rgba(255, 255, 255, 0.94)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)',
      borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
      padding: '12px 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      direction: isRtl ? 'rtl' : 'ltr',
      fontFamily: 'Cairo, sans-serif',
      transition: 'all 0.3s ease'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '14px',
        flexWrap: 'wrap'
      }}>
        
        {/* 🚘 الشعار وهوية المنصة */}
        <div 
          onClick={() => setView('shop')}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            cursor: 'pointer', 
            userSelect: 'none' 
          }}
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
            border: '1px solid rgba(234, 88, 12, 0.4)'
          }}>
            🚗
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '23px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.5px', lineHeight: '1.1' }}>
                {lang === 'ar' ? 'موجود ' : 'Mawjood '}
              </span>
              <span style={{ fontSize: '23px', fontWeight: '900', color: '#ea580c', letterSpacing: '-0.5px', lineHeight: '1.1' }}>
                {lang === 'ar' ? 'أوتو' : 'Auto'}
              </span>
            </div>
            
            <span style={{ 
              fontSize: '10.5px', 
              color: '#64748b', 
              fontWeight: '700', 
              letterSpacing: isRtl ? '0px' : '0.8px', 
              marginTop: '2px' 
            }}>
              {lang === 'ar' ? 'منصتك الأولى لقطع غيار السيارات 🇶🇦' : 'Qatar\'s #1 Auto Spare Parts Hub'}
            </span>
          </div>
        </div>

        {/* 🛠️ أزرار التحكم والقائمة العلوية */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          
          {/* زر طلب قطعة غير متوفرة */}
          {onRequestCustomPart && (
            <button
              onClick={onRequestCustomPart}
              style={{
                padding: '8px 14px',
                borderRadius: '12px',
                border: '1px solid #fed7aa',
                backgroundColor: '#fff7ed',
                color: '#ea580c',
                cursor: 'pointer',
                fontWeight: '800',
                fontSize: '12.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(234, 88, 12, 0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              <span>🛠️</span>
              <span>{lang === 'ar' ? 'طلب قطعة خاصة' : 'Custom Request'}</span>
            </button>
          )}

          {/* زر طلباتي السابقة */}
          {onOpenOrdersTracker && (
            <button
              onClick={onOpenOrdersTracker}
              style={{
                padding: '8px 14px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: '#334155',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '12.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                transition: 'all 0.2s ease'
              }}
            >
              <span>📦</span>
              <span>{lang === 'ar' ? 'طلباتي' : 'Orders'}</span>
            </button>
          )}

          {/* زر تغيير اللغة */}
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            style={{
              padding: '8px 14px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              fontWeight: '800',
              fontSize: '12.5px',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              transition: 'all 0.2s ease'
            }}
          >
            <span>🌐</span>
            <span>{lang === 'ar' ? 'English' : 'عربي'}</span>
          </button>

          {/* زر سلة المشتريات */}
          <button
            onClick={onOpenCart}
            style={{
              padding: '8px 15px',
              borderRadius: '12px',
              border: '1.5px solid #e2e8f0',
              backgroundColor: cartCount > 0 ? '#f0fdf4' : '#ffffff',
              cursor: 'pointer',
              fontWeight: '800',
              fontSize: '12.5px',
              color: cartCount > 0 ? '#166534' : '#0f172a',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              transition: 'all 0.2s ease'
            }}
          >
            <span>🛒</span>
            <span>{lang === 'ar' ? 'السلة' : 'Cart'}</span>
            {cartCount > 0 && (
              <span style={{
                backgroundColor: '#ea580c',
                color: '#ffffff',
                borderRadius: '50%',
                padding: '2px 7px',
                fontSize: '11px',
                fontWeight: '900',
                boxShadow: '0 2px 6px rgba(234, 88, 12, 0.4)'
              }}>
                {cartCount}
              </span>
            )}
          </button>

          {/* حالة المستخدم وتوثيق الحساب */}
          {session ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => {
                  if (session.role === 'admin' || session.email?.endsWith('@admin.mawjood.com')) setView('admin');
                  else if (session.role === 'driver' || session.email?.endsWith('@driver.mawjood.com')) setView('driver');
                  else if (session.role === 'garage') setView('dashboard');
                  else setView('profile');
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: '800',
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>👤</span>
                <span>{lang === 'ar' ? 'حسابي' : 'Account'}</span>
              </button>

              <button
                onClick={onLogout}
                title={lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                style={{
                  padding: '8px 12px',
                  borderRadius: '12px',
                  border: '1px solid #fecaca',
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  cursor: 'pointer',
                  fontWeight: '800',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                🚪
              </button>
            </div>
          ) : (
            <button
              onClick={() => setView('auth')}
              style={{
                padding: '8px 18px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                cursor: 'pointer',
                fontWeight: '800',
                fontSize: '12.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.2)',
                transition: 'all 0.2s ease'
              }}
            >
              <span>🔑</span>
              <span>{lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};

export default Header;
