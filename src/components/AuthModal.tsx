import React, { useState } from 'react';

interface AuthModalProps {
  lang: 'ar' | 'en';
  authUrl: string;
  apiKey: string;
  onSuccess: (newSession: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ lang, authUrl, apiKey, onSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register_user' | 'register_garage'>('login');
  
  // الحقول
  const [identifier, setIdentifier] = useState(''); // بريد أو رقم هاتف
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [garageName, setGarageName] = useState('');
  const [secretCode, setSecretCode] = useState(''); // رمز تفعيل الكراج
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isRtl = lang === 'ar';

  // 🔐 1. تسجيل الدخول العام (عميل / كراج / مندوب)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    let formattedEmail = identifier.trim();

    // إذا أدخل أرقاماً فقط، نتحقق من التنسيقات المتوقعة
    if (/^\d+$/.test(formattedEmail)) {
      // تجربة البريد المنسق
      formattedEmail = `${formattedEmail}@customer.mawjood.com`;
    }

    try {
      // المحاولة الأولى بالبريد أو النطاق التلقائي
      let response = await fetch(`${authUrl}/token?grant_type=password`, {
        method: 'POST',
        headers: { 'apikey': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formattedEmail, password: password })
      });

      let data = await response.json();

      // تجربة النطاقات الأخرى إذا كان الحساب كراج أو مندوب
      if (!response.ok && /^\d+$/.test(identifier.trim())) {
        const rawPhone = identifier.trim();
        const altDomains = [`${rawPhone}@driver.mawjood.com`, `${rawPhone}@garage.mawjood.com`];
        
        for (const altEmail of altDomains) {
          const altRes = await fetch(`${authUrl}/token?grant_type=password`, {
            method: 'POST',
            headers: { 'apikey': apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: altEmail, password: password })
          });
          if (altRes.ok) {
            response = altRes;
            data = await altRes.json();
            formattedEmail = altEmail;
            break;
          }
        }
      }

      if (response.ok) {
        let userRole = data.user?.user_metadata?.role || 'customer';
        if (formattedEmail.endsWith('@driver.mawjood.com')) userRole = 'driver';
        if (formattedEmail.endsWith('@garage.mawjood.com')) userRole = 'garage';
        
        const sessionData = {
          token: data.access_token,
          user: data.user,
          email: data.user?.email || formattedEmail,
          phone: identifier.trim(),
          role: userRole
        };

        onSuccess(sessionData);
      } else {
        setErrorMsg(isRtl ? 'بيانات الدخول غير صحيحة، يرجى التأكد من الرقم/الإيميل وكلمة المرور' : 'Invalid credentials');
      }
    } catch (err) {
      setErrorMsg(isRtl ? 'حدث خطأ أثناء الاتصال بالخادم' : 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  // 👤 2. إنشاء حساب عميل جديد (بالهاتف أو الإيميل)
  const handleUserRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    let formattedEmail = identifier.trim();
    if (/^\d+$/.test(formattedEmail)) {
      formattedEmail = `${formattedEmail}@customer.mawjood.com`;
    }

    try {
      const response = await fetch(`${authUrl}/signup`, {
        method: 'POST',
        headers: { 'apikey': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formattedEmail,
          password: password,
          data: { role: 'customer', full_name: fullName, phone: identifier.trim() }
        })
      });

      const data = await response.json();

      if (response.ok) {
        const sessionData = {
          token: data.access_token || data.session?.access_token,
          user: data.user,
          email: data.user?.email || formattedEmail,
          phone: identifier.trim(),
          role: 'customer'
        };

        alert(isRtl ? 'تم إنشاء حسابك بنجاح! مرحباً بك 🚀' : 'Account created successfully!');
        onSuccess(sessionData);
      } else {
        setErrorMsg(data.msg || data.error_description || (isRtl ? 'تعذر إنشاء الحساب، قد يكون مستخدماً مسبقاً' : 'Failed to register'));
      }
    } catch (err) {
      setErrorMsg(isRtl ? 'حدث خطأ في الاتصال' : 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  // ⚙️ 3. تسجيل كراج جديد (يتطلب الرمز السري doha2026)
  const handleGarageRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // 🔒 التحقق من الرمز السري الكراج
    if (secretCode.trim() !== 'doha2026') {
      return setErrorMsg(isRtl ? '❌ رمز تفعيل الكراج غير صحيح! يرجى التواصل مع إدارة موجود أوتو للحصول عليه.' : 'Invalid Garage Secret Code!');
    }

    setLoading(true);

    let formattedEmail = identifier.trim();
    if (/^\d+$/.test(formattedEmail)) {
      formattedEmail = `${formattedEmail}@garage.mawjood.com`;
    }

    try {
      const response = await fetch(`${authUrl}/signup`, {
        method: 'POST',
        headers: { 'apikey': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formattedEmail,
          password: password,
          data: { role: 'garage', garage_name: garageName, phone: identifier.trim() }
        })
      });

      const data = await response.json();

      if (response.ok) {
        const sessionData = {
          token: data.access_token || data.session?.access_token,
          user: data.user,
          email: data.user?.email || formattedEmail,
          phone: identifier.trim(),
          role: 'garage',
          garageName: garageName
        };

        alert(isRtl ? '🎉 تم تفعيل وتسجيل حساب الكراج بنجاح!' : 'Garage account registered successfully!');
        onSuccess(sessionData);
      } else {
        setErrorMsg(data.msg || data.error_description || (isRtl ? 'تعذر إنشاء حساب الكراج' : 'Failed to register garage'));
      }
    } catch (err) {
      setErrorMsg(isRtl ? 'حدث خطأ في الاتصال' : 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '460px', margin: '40px auto', padding: '28px', backgroundColor: 'white', borderRadius: '22px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', direction: isRtl ? 'rtl' : 'ltr', fontFamily: 'sans-serif' }}>
      
      {/* 🔄 تبويبات الشاشة */}
      <div style={{ display: 'flex', gap: '6px', backgroundColor: '#f1f5f9', padding: '5px', borderRadius: '14px', marginBottom: '22px' }}>
        <button
          onClick={() => { setTab('login'); setErrorMsg(''); }}
          style={{
            flex: 1, padding: '9px 4px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12.5px',
            backgroundColor: tab === 'login' ? '#1a365d' : 'transparent',
            color: tab === 'login' ? 'white' : '#64748b'
          }}
        >
          🔑 {isRtl ? 'دخول' : 'Login'}
        </button>

        <button
          onClick={() => { setTab('register_user'); setErrorMsg(''); }}
          style={{
            flex: 1, padding: '9px 4px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12.5px',
            backgroundColor: tab === 'register_user' ? '#3182ce' : 'transparent',
            color: tab === 'register_user' ? 'white' : '#64748b'
          }}
        >
          👤 {isRtl ? 'انشاء حساب' : 'New User'}
        </button>

        <button
          onClick={() => { setTab('register_garage'); setErrorMsg(''); }}
          style={{
            flex: 1, padding: '9px 4px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12.5px',
            backgroundColor: tab === 'register_garage' ? '#dd6b20' : 'transparent',
            color: tab === 'register_garage' ? 'white' : '#64748b'
          }}
        >
          ⚙️ {isRtl ? 'حساب كراج' : 'New Garage'}
        </button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '18px' }}>
        <h3 style={{ margin: 0, color: '#1a365d', fontSize: '19px', fontWeight: 'bold' }}>
          {tab === 'login' && (isRtl ? 'تسجيل الدخول' : 'Sign In')}
          {tab === 'register_user' && (isRtl ? 'إنشاء حساب عميل جديد' : 'Create Customer Account')}
          {tab === 'register_garage' && (isRtl ? 'تسجيل كراج جديد' : 'Register New Garage')}
        </h3>
      </div>

      {errorMsg && (
        <div style={{ backgroundColor: '#fff5f5', color: '#e53e3e', padding: '10px 14px', borderRadius: '10px', fontSize: '12.5px', marginBottom: '16px', border: '1px solid #fed7d7', textAlign: 'center' }}>
          {errorMsg}
        </div>
      )}

      {/* 1️⃣ تسجيل الدخول العامة */}
      {tab === 'login' && (
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12.5px', fontWeight: 'bold', color: '#4a5568' }}>
              {isRtl ? 'رقم الهاتف أو البريد الإلكتروني' : 'Phone Number or Email'}
            </label>
            <input
              type="text"
              placeholder={isRtl ? 'مثال: 5XXXXXXXX أو الإيميل' : 'e.g., 5XXXXXXXX or Email'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13.5px', boxSizing: 'border-box' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12.5px', fontWeight: 'bold', color: '#4a5568' }}>
              {isRtl ? 'كلمة المرور' : 'Password'}
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13.5px', boxSizing: 'border-box' }}
              required
            />
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', backgroundColor: '#1a365d', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', marginTop: '6px' }}>
            {loading ? (isRtl ? 'جاري التحقق...' : 'Signing in...') : (isRtl ? 'تسجيل الدخول 🚀' : 'Sign In')}
          </button>
        </form>
      )}

      {/* 2️⃣ إنشاء حساب عميل جديد */}
      {tab === 'register_user' && (
        <form onSubmit={handleUserRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12.5px', fontWeight: 'bold', color: '#4a5568' }}>
              {isRtl ? 'الاسم الكامل' : 'Full Name'}
            </label>
            <input
              type="text"
              placeholder={isRtl ? 'أدخل اسمك الكريم' : 'Enter your name'}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13.5px', boxSizing: 'border-box' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12.5px', fontWeight: 'bold', color: '#4a5568' }}>
              {isRtl ? 'رقم الهاتف أو البريد الإلكتروني' : 'Phone Number or Email'}
            </label>
            <input
              type="text"
              placeholder={isRtl ? 'مثال: 5XXXXXXXX أو user@domain.com' : 'e.g. 5XXXXXXXX or email'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13.5px', boxSizing: 'border-box' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12.5px', fontWeight: 'bold', color: '#4a5568' }}>
              {isRtl ? 'كلمة المرور' : 'Password'}
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13.5px', boxSizing: 'border-box' }}
              required
            />
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', marginTop: '6px' }}>
            {loading ? (isRtl ? 'جاري التنسيق والتسجيل...' : 'Creating Account...') : (isRtl ? 'إنشاء حساب العميل 👤' : 'Create Account')}
          </button>
        </form>
      )}

      {/* 3️⃣ تسجيل كراج جديد بالتأكيد والرمز السري doha2026 */}
      {tab === 'register_garage' && (
        <form onSubmit={handleGarageRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12.5px', fontWeight: 'bold', color: '#4a5568' }}>
              {isRtl ? 'اسم الكراج' : 'Garage Name'}
            </label>
            <input
              type="text"
              placeholder={isRtl ? 'مثال: كراج الريان لقطع الغيار' : 'Garage name'}
              value={garageName}
              onChange={(e) => setGarageName(e.target.value)}
              style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13.5px', boxSizing: 'border-box' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12.5px', fontWeight: 'bold', color: '#4a5568' }}>
              {isRtl ? 'رقم الهاتف أو البريد للكراج' : 'Garage Phone or Email'}
            </label>
            <input
              type="text"
              placeholder={isRtl ? 'مثال: 5XXXXXXXX أو garage@domain.com' : 'Phone or Email'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13.5px', boxSizing: 'border-box' }}
              required
            />
          </div>

          {/* 🔑 خانة الرمز السري doha2026 */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12.5px', fontWeight: 'bold', color: '#c53030' }}>
              🔑 {isRtl ? 'رمز تفعيل الكراج (خاص بالإدارة)' : 'Garage Activation Code'}
            </label>
            <input
              type="text"
              placeholder={isRtl ? 'أدخل رمز تفعيل الكراج' : 'Enter secret code'}
              value={secretCode}
              onChange={(e) => setSecretCode(e.target.value)}
              style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '2px solid #feb2b2', backgroundColor: '#fff5f5', fontSize: '13.5px', boxSizing: 'border-box', fontWeight: 'bold' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12.5px', fontWeight: 'bold', color: '#4a5568' }}>
              {isRtl ? 'كلمة المرور' : 'Password'}
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13.5px', boxSizing: 'border-box' }}
              required
            />
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', backgroundColor: '#dd6b20', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', marginTop: '6px' }}>
            {loading ? (isRtl ? 'جاري تفعيل الحساب...' : 'Creating Garage...') : (isRtl ? 'تأكيد تسجيل الكراج ⚙️' : 'Register Garage')}
          </button>
        </form>
      )}

    </div>
  );
};
