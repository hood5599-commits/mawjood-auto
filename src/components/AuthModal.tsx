import React, { useState } from 'react';

interface AuthModalProps {
  lang: 'ar' | 'en';
  authUrl: string;
  apiKey: string;
  onSuccess: (newSession: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ lang, authUrl, apiKey, onSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isRtl = lang === 'ar';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    let formattedEmail = identifier.trim();

    // 💡 التنسيق الذكي: إذا أدخل المستخدم أرقاماً فقط (مثل رقم المندوب)، يضاف النطاق تلقائياً
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
        // تحديد دور المندوب أوتوماتيكياً
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
        setErrorMsg(isRtl ? 'بيانات الدخول غير صحيحة، يرجى التأكد من الرقم/الإيميل وكلمة المرور' : 'Invalid login credentials');
      }
    } catch (err) {
      setErrorMsg(isRtl ? 'حدث خطأ أثناء الاتصال بالخادم' : 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '420px', margin: '50px auto', padding: '30px', backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', direction: isRtl ? 'rtl' : 'ltr', fontFamily: 'sans-serif' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '25px' }}>
        <span style={{ fontSize: '45px', display: 'block', marginBottom: '10px' }}>🔐</span>
        <h2 style={{ margin: 0, color: '#1a365d', fontSize: '22px', fontWeight: 'bold' }}>
          {isRtl ? 'تسجيل الدخول' : 'Sign In'}
        </h2>
        <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#718096' }}>
          {isRtl ? 'أدخل رقم هاتفك أو البريد الإلكتروني للدخول' : 'Enter phone number or email to login'}
        </p>
      </div>

      {errorMsg && (
        <div style={{ backgroundColor: '#fff5f5', color: '#e53e3e', padding: '12px', borderRadius: '10px', fontSize: '13px', marginBottom: '18px', border: '1px solid #fed7d7', textAlign: 'center' }}>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>
            {isRtl ? 'رقم الهاتف / البريد الإلكتروني' : 'Phone Number / Email'}
          </label>
          <input
            type="text"
            placeholder={isRtl ? 'مثال: رقم الهاتف او الايميل' : 'e.g., 00000000'}
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
          style={{ width: '100%', padding: '14px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '10px' }}
        >
          {loading ? (isRtl ? 'جاري التحقق...' : 'Signing in...') : (isRtl ? 'تسجيل الدخول 🚀' : 'Sign In')}
        </button>
      </form>

    </div>
  );
};
