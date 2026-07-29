import React from 'react';

type ViewType = 'shop' | 'dashboard' | 'auth' | 'profile' | 'driver' | 'admin';

interface HeaderProps {
  lang: 'ar' | 'en';
  setLang: (lang: 'ar' | 'en') => void;
  view: ViewType;
  setView: (view: ViewType) => void;
  session: any;
  cartCount: number;
  onOpenCart: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  setLang,
  setView,
  session,
  cartCount,
  onOpenCart,
  onLogout
}) => {
  const isRtl = lang === 'ar';

  return (
    <header style={{ backgroundColor: 'var(--mw-surface, #ffffff)', borderBottom: '1px solid var(--mw-border, #e2e8f0)', padding: '14px 20px', position: 'sticky', top: 0, zIndex: 90 }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* اللوجو */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setView('shop')}>
          <span style={{ fontSize: '26px' }}>🚗</span>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: 'var(--mw-primary, #1f3a5f)' }}>
            موجود أوتو <span style={{ fontSize: '12px', color: '#e0872a' }}>MAWJOOD</span>
          </h1>
        </div>

        {/* أزرار التنقل بالهيدر */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e0', background: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
          >
            🌐 {lang === 'ar' ? 'English' : 'عربي'}
          </button>

          {/* زر السلة */}
          <button
            onClick={onOpenCart}
            style={{ padding: '8px 14px', borderRadius: '10px', border: 'none', backgroundColor: '#f1f5f9', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            🛒 {isRtl ? 'السلة' : 'Cart'}
            {cartCount > 0 && (
              <span style={{ backgroundColor: '#e0872a', color: 'white', borderRadius: '50%', padding: '2px 7px', fontSize: '11px' }}>
                {cartCount}
              </span>
            )}
          </button>

          {/* حالة الحساب والزر المناسب لكل دور */}
          {session ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              
              {/* إذا كان الحساب أدمن */}
              {(session.role === 'admin' || session.email?.endsWith('@admin.mawjood.com')) && (
                <button
                  onClick={() => setView('admin')}
                  style={{ padding: '8px 14px', borderRadius: '10px', border: 'none', backgroundColor: '#1f3a5f', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '12.5px' }}
                >
                  👑 {isRtl ? 'لوحة الأدمن' : 'Admin'}
                </button>
              )}

              {/* إذا كان الحساب كراج */}
              {session.role === 'garage' && (
                <button
                  onClick={() => setView('dashboard')}
                  style={{ padding: '8px 14px', borderRadius: '10px', border: 'none', backgroundColor: '#e0872a', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '12.5px' }}
                >
                  ⚙️ {isRtl ? 'لوحة الكراج' : 'Dashboard'}
                </button>
              )}

              {/* إذا كان الحساب مندوب */}
              {(session.role === 'driver' || session.email?.endsWith('@driver.mawjood.com')) && (
                <button
                  onClick={() => setView('driver')}
                  style={{ padding: '8px 14px', borderRadius: '10px', border: 'none', backgroundColor: '#3182ce', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '12.5px' }}
                >
                  🛵 {isRtl ? 'لوحة التوصيل' : 'Delivery'}
                </button>
              )}

              {/* زر الملف الشخصي للجميع */}
              <button
                onClick={() => setView('profile')}
                style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid #cbd5e0', background: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '12.5px' }}
              >
                👤 {isRtl ? 'حسابي' : 'Profile'}
              </button>

              {/* زر خروج */}
              <button
                onClick={onLogout}
                style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', backgroundColor: '#fdecec', color: '#d1453b', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
              >
                🚪
              </button>
            </div>
          ) : (
            <button
              onClick={() => setView('auth')}
              style={{ padding: '9px 18px', borderRadius: '10px', border: 'none', backgroundColor: '#1f3a5f', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
            >
              🔑 {isRtl ? 'دخول / تسجيل' : 'Login / Register'}
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
