import React, { useState } from 'react';

interface AuthModalProps {
  lang: 'ar' | 'en';
  authUrl: string;
  apiKey: string;
  onSuccess: (newSession: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ lang, authUrl, apiKey, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register_garage'>('login');
  
  // الحقول العامة
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [garageName, setGarageName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isRtl = lang === 'ar';

  // 🔐 1. تسجيل الدخول (للكل)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    let formattedEmail = identifier.trim();

    // تنسيق تلقائي إذا تم إدخال أرقام فقط
    if (/^\d+$/.test(formattedEmail)) {
      formattedEmail = `${formattedEmail}@driver.mawjood.com`;
    }

    try {
      const response = await fetch(`${authUrl}/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formattedEmail,
          password: password
        })
      });

      const data = await response.json();

      if (response.ok) {
        const userRole = formattedEmail.endsWith('@driver.mawjood.com') 
          ? 'driver' 
          : (data.user?.user_metadata?.role || 'customer');
        
        const sessionData = {
          token: data.access_token,
          user: data.user,
          email: data.user?.email || formattedEmail,
          role: userRole
        };

        onSuccess(sessionData);
      } else {
        setErrorMsg(isRtl ? 'بيانات الدخول غير صحيحة، يرجى التأكد من البيانات' : 'Invalid credentials');
      }
    } catch (err) {
      setErrorMsg(isRtl ? 'حدث خطأ أثناء الاتصال بالخادم' : 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  // ⚙️ 2. تسجيل كراج جديد
  const handleGarageRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    let formattedEmail = identifier.trim();

    // إذا أدخل الكراج رقم هاتف، يتم صياغته بنطاق الكراجات
    if (/^\d+$/.test(formattedEmail)) {
      formattedEmail = `${formattedEmail}@garage.mawjood.com`;
    }

    try {
      const response = await fetch(`${authUrl}/signup`, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formattedEmail,
          password: password,
          data: {
            role: 'garage',
            garage_name: garageName
          }
        })
      });

      const data = await response.json();

      if (response.ok) {
        const sessionData = {
          token: data.access_token || data.session?.access_token,
          user: data.user,
          email: data.user?.email || formattedEmail,
          role: 'garage',
          garageName: garageName
        };

        alert(isRtl ? 'تم إنشاء حساب الكراج بنجاح! ⚙️' : 'Garage account created successfully!');
        onSuccess(sessionData);
      } else {
        setErrorMsg(data.msg || data.error_description || (isRtl ? 'تعذر إنشاء الحساب، ربما الحساب مضاف مسبقاً' : 'Failed to register garage'));
      }
    } catch (err) {
      setErrorMsg(isRtl ? 'حدث خطأ أثناء الاتصال بالخادم' : 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '40px auto', padding: '30px', backgroundColor: 'white', borderRadius: '22px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', direction: isRtl ? 'rtl' : 'ltr', fontFamily: 'sans-serif' }}>
      
      {/* 🔄 أزرار التبديل بين التسجيل والدخول */}
      <div style={{ display: 'flex', gap: '8px', backgroundColor: '#f1f5f9', padding: '6px', borderRadius: '14px', marginBottom: '24px' }}>
        <button
          onClick={() => { setMode('login'); setErrorMsg(''); }}
          style={{
            flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13.5px',
            backgroundColor: mode === 'login' ? '#1a365d' : 'transparent',
            color: mode === 'login' ? 'white' : '#64748b'
          }}
        >
          🔐 {isRtl ? 'تسجيل الدخول' : 'Sign In'}
        </button>

        <button
          onClick={() => { setMode('register_garage'); setErrorMsg(''); }}
          style={{
            flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13.5px',
            backgroundColor: mode === 'register_garage' ? '#dd6b20' : 'transparent',
            color: mode === 'register_garage' ? 'white' : '#64748b'
          }}
        >
          ⚙️ {isRtl ? 'تسجيل كراج جديد' : 'Register Garage'}
        </button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#1a365d', fontSize: '20px', fontWeight: 'bold' }}>
          {mode === 'login' 
            ? (isRtl ? 'مرحباً بك مجدداً' : 'Welcome Back') 
            : (isRtl ? 'إنشاء حساب كراج جديد' : 'New Garage Registration')}
        </h3>
        <p style={{ margin: '6px 0 0 0', fontSize: '12.5px', color: '#718096' }}>
          {mode === 'login'
            ? (isRtl ? 'أدخل رقم الهاتف أو البريد الإلكتروني للدخول' : 'Enter your credentials to continue')
            : (isRtl ? 'سجل كراجك للبدء بعرض وبيع قطع الغيار' : 'Register your garage to sell spare parts')}
        </p>
      </div>

      {errorMsg && (
        <div style={{ backgroundColor: '#fff5f5', color: '#e53e3e', padding: '12px', borderRadius: '10px', fontSize: '13px', marginBottom: '18px', border: '1px solid #fed7d7', textAlign: 'center' }}>
          {errorMsg}
        </div>
      )}

      {/* 1️⃣ نموذج تسجيل الدخول */}
      {mode === 'login' ? (
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>
              {isRtl ? 'رقم الهاتف / البريد الإلكتروني' : 'Phone Number / Email'}
            </label>
            <input
              type="text"
              placeholder={isRtl ? 'مثال: 5XXXXXXXX' : 'e.g., 5XXXXXXXX'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>
              {isRtl ? 'كلمة المرور' : 'Password'}
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '14px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '8px' }}
          >
            {loading ? (isRtl ? 'جاري التحقق...' : 'Signing in...') : (isRtl ? 'تسجيل الدخول 🚀' : 'Sign In')}
          </button>
        </form>
      ) : (

        /* 2️⃣ نموذج تسجيل كراج جديد */
        <form onSubmit={handleGarageRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>
              {isRtl ? 'اسم الكراج / المحل' : 'Garage Name'}
            </label>
            <input
              type="text"
              placeholder={isRtl ? 'مثال: كراج الأمانة لقطع الغيار' : 'e.g., Al-Amana Auto Parts'}
              value={garageName}
              onChange={(e) => setGarageName(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>
              {isRtl ? 'رقم الهاتف للتواصل' : 'Phone Number'}
            </label>
            <input
              type="text"
              placeholder={isRtl ? 'مثال: 5XXXXXXXX' : 'e.g., 5XXXXXXXX'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>
              {isRtl ? 'كلمة المرور' : 'Password'}
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '14px', backgroundColor: '#dd6b20', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '8px' }}
          >
            {loading ? (isRtl ? 'جاري إنشاء حساب الكراج...' : 'Creating Garage...') : (isRtl ? 'تأكيد تسجيل الكراج ⚙️' : 'Register Garage')}
          </button>
        </form>
      )}

    </div>
  );
};
