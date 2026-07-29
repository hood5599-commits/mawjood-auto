import React, { useState } from 'react';

interface AuthModalProps {
  lang: 'ar' | 'en';
  authUrl: string;
  apiKey: string;
  onSuccess: (newSession: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ lang, authUrl, apiKey, onSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register_user' | 'register_garage'>('login');
  
  // بيانات الإدخال
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [garageName, setGarageName] = useState('');
  const [secretCode, setSecretCode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isRtl = lang === 'ar';

  // تنسيق المعرف (إيميل أو رقم هاتف)
  const formatInput = (input: string, domain: string = 'customer.mawjood.com') => {
    const trimmed = input.trim();
    if (/^\d+$/.test(trimmed)) {
      return `${trimmed}@${domain}`;
    }
    return trimmed;
  };

  // 🔑 1. تسجيل الدخول
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const inputVal = identifier.trim();
    const formattedEmail = formatInput(inputVal);

    try {
      let response = await fetch(`${authUrl}/token?grant_type=password`, {
        method: 'POST',
        headers: { 'apikey': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formattedEmail, password: password })
      });

      let data = await response.json();

      // محاولة فحص حسابات المناديب أو الكراجات إذا كان الإدخال رقماً
      if (!response.ok && /^\d+$/.test(inputVal)) {
        for (const dom of ['driver.mawjood.com', 'garage.mawjood.com']) {
          const altEmail = `${inputVal}@${dom}`;
          const altRes = await fetch(`${authUrl}/token?grant_type=password`, {
            method: 'POST',
            headers: { 'apikey': apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: altEmail, password: password })
          });
          if (altRes.ok) {
            response = altRes;
            data = await altRes.json();
            break;
          }
        }
      }

      if (response.ok) {
        let role = data.user?.user_metadata?.role || 'customer';
        if (data.user?.email?.endsWith('@driver.mawjood.com')) role = 'driver';
        if (data.user?.email?.endsWith('@garage.mawjood.com')) role = 'garage';

        onSuccess({
          token: data.access_token,
          user: data.user,
          email: data.user?.email,
          phone: inputVal,
          role: role
        });
      } else {
        setErrorMsg(isRtl ? 'بيانات الدخول غير صحيحة' : 'Invalid login credentials');
      }
    } catch (err) {
      setErrorMsg(isRtl ? 'حدث خطأ في الاتصال بالشبكة' : 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  // 👤 2. إنشاء حساب عميل
  const handleUserRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const formattedEmail = formatInput(identifier);

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
        onSuccess({
          token: data.access_token || data.session?.access_token,
          user: data.user,
          email: formattedEmail,
          phone: identifier.trim(),
          role: 'customer'
        });
      } else {
        setErrorMsg(data.msg || data.error_description || (isRtl ? 'تعذر إنشاء الحساب' : 'Registration failed'));
      }
    } catch (err) {
      setErrorMsg(isRtl ? 'حدث خطأ في الاتصال' : 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  // ⚙️ 3. إنشاء حساب كراج
  const handleGarageRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (secretCode.trim() !== 'doha2026') {
      return setErrorMsg(isRtl ? 'رمز تفعيل الكراج غير صحيح' : 'Invalid Garage Code');
    }

    setLoading(true);

    const formattedEmail = formatInput(identifier, 'garage.mawjood.com');

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
        onSuccess({
          token: data.access_token || data.session?.access_token,
          user: data.user,
          email: formattedEmail,
          phone: identifier.trim(),
          role: 'garage',
          garageName: garageName
        });
      } else {
        setErrorMsg(data.msg || (isRtl ? 'تعذر إنشاء حساب الكراج' : 'Registration failed'));
      }
    } catch (err) {
      setErrorMsg(isRtl ? 'حدث خطأ في الاتصال' : 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '420px', margin: '40px auto', padding: '28px', backgroundColor: '#ffffff', borderRadius: '20px', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', direction: isRtl ? 'rtl' : 'ltr', fontFamily: 'Cairo, sans-serif' }}>
      
      {/* التبويبات البسيطة */}
      <div style={{ display: 'flex', gap: '6px', backgroundColor: '#f8fafc', padding: '6px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
        <button
          onClick={() => { setTab('login'); setErrorMsg(''); }}
          style={{
            flex: 1, padding: '10px 4px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
            backgroundColor: tab === 'login' ? '#1f3a5f' : 'transparent',
            color: tab === 'login' ? '#ffffff' : '#64748b',
            transition: 'all 0.2s'
          }}
        >
          {isRtl ? 'دخول' : 'Sign In'}
        </button>

        <button
          onClick={() => { setTab('register_user'); setErrorMsg(''); }}
          style={{
            flex: 1, padding: '10px 4px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
            backgroundColor: tab === 'register_user' ? '#1f3a5f' : 'transparent',
            color: tab === 'register_user' ? '#ffffff' : '#64748b',
            transition: 'all 0.2s'
          }}
        >
          {isRtl ? 'انشاء حساب' : 'Register'}
        </button>

        <button
          onClick={() => { setTab('register_garage'); setErrorMsg(''); }}
          style={{
            flex: 1, padding: '10px 4px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
            backgroundColor: tab === 'register_garage' ? '#e0872a' : 'transparent',
            color: tab === 'register_garage' ? '#ffffff' : '#64748b',
            transition: 'all 0.2s'
          }}
        >
          {isRtl ? 'كراج جديد' : 'Garage'}
        </button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#131c26', fontSize: '20px', fontWeight: 'bold' }}>
          {tab === 'login' && (isRtl ? 'تسجيل الدخول' : 'Welcome Back')}
          {tab === 'register_user' && (isRtl ? 'إنشاء حساب جديد' : 'Create Account')}
          {tab === 'register_garage' && (isRtl ? 'تسجيل كراج جديد' : 'Register Garage')}
        </h3>
      </div>

      {errorMsg && (
        <div style={{ backgroundColor: '#fdecec', color: '#d1453b', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '18px', border: '1px solid #f8b4b4', textAlign: 'center' }}>
          {errorMsg}
        </div>
      )}

      {/* 1️⃣ نموذج تسجيل الدخول */}
      {tab === 'login' && (
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>
              {isRtl ? 'رقم الهاتف أو البريد الإلكتروني' : 'Phone or Email'}
            </label>
            <input
              type="text"
              placeholder={isRtl ? 'أدخل الرقم أو الإيميل' : 'Enter phone or email'}
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

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', backgroundColor: '#1f3a5f', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '6px' }}>
            {loading ? (isRtl ? 'جاري التحقق...' : 'Signing in...') : (isRtl ? 'تسجيل الدخول' : 'Sign In')}
          </button>
        </form>
      )}

      {/* 2️⃣ نموذج إنشاء حساب مستخدم */}
      {tab === 'register_user' && (
        <form onSubmit={handleUserRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>
              {isRtl ? 'الاسم الكامل' : 'Full Name'}
            </label>
            <input
              type="text"
              placeholder={isRtl ? 'الاسم الثلاثي' : 'Full name'}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>
              {isRtl ? 'رقم الهاتف أو البريد الإلكتروني' : 'Phone or Email'}
            </label>
            <input
              type="text"
              placeholder={isRtl ? 'أدخل الرقم أو الإيميل' : 'Enter phone or email'}
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

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', backgroundColor: '#1f3a5f', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '6px' }}>
            {loading ? (isRtl ? 'جاري التسجيل...' : 'Creating...') : (isRtl ? 'إنشاء الحساب' : 'Create Account')}
          </button>
        </form>
      )}

      {/* 3️⃣ نموذج تسجيل كراج */}
      {tab === 'register_garage' && (
        <form onSubmit={handleGarageRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>
              {isRtl ? 'اسم الكراج' : 'Garage Name'}
            </label>
            <input
              type="text"
              placeholder={isRtl ? 'اسم الكراج / المحل' : 'Garage name'}
              value={garageName}
              onChange={(e) => setGarageName(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>
              {isRtl ? 'رقم الهاتف أو البريد' : 'Phone or Email'}
            </label>
            <input
              type="text"
              placeholder={isRtl ? 'أدخل الرقم أو الإيميل' : 'Enter phone or email'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#e0872a' }}>
              🔑 {isRtl ? 'رمز تفعيل الكراج' : 'Activation Code'}
            </label>
            <input
              type="text"
              placeholder={isRtl ? 'رمز التفعيل' : 'Enter code'}
              value={secretCode}
              onChange={(e) => setSecretCode(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #fed7aa', backgroundColor: '#fffaf0', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
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

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', backgroundColor: '#e0872a', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '6px' }}>
            {loading ? (isRtl ? 'جاري التسجيل...' : 'Creating...') : (isRtl ? 'تأكيد تسجيل الكراج' : 'Register Garage')}
          </button>
        </form>
      )}

    </div>
  );
};
