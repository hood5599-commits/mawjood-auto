import React, { useState } from 'react';
import { t } from '../utils/translations.ts';

interface AuthModalProps {
  lang: 'ar' | 'en';
  authUrl: string;
  apiKey: string;
  onSuccess: (session: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ lang, authUrl, apiKey, onSuccess }) => {
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isGarageSignUp, setIsGarageSignUp] = useState(false);
  const [activationCode, setActivationCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const formatQatarPhone = (rawPhone: string) => {
    let cleaned = rawPhone.trim();
    if (cleaned.startsWith('00974')) cleaned = cleaned.substring(5);
    else if (cleaned.startsWith('+974')) cleaned = cleaned.substring(4);
    else if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
    return `+974${cleaned}`;
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    // 🔒 نظام التحقق الأمني المباشر من جدول الكراجات
    if (isSignUp && isGarageSignUp) {
      try {
        // الاتصال المباشر بجدول garage_activation_codes واستخدام ilike لتجاهل حالة الأحرف
        const checkUrl = `${authUrl.replace('/auth/v1', '/rest/v1')}/garage_activation_codes?select=id&code=ilike.${encodeURIComponent(activationCode.trim())}&is_active=eq.true`;
        const codeRes = await fetch(checkUrl, {
          method: 'GET',
          headers: { 
            'apikey': apiKey, 
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json' 
          }
        });
        
        const data = await codeRes.json();
        
        // إذا رجعت المصفوفة فارغة، يعني الرمز خطأ أو غير مفعل
        const isValid = Array.isArray(data) && data.length > 0;

        if (!isValid) {
          alert(lang === 'ar' ? 'الرمز السري غير صحيح أو تم إيقافه 🚫' : 'Invalid or inactive activation code 🚫');
          setAuthLoading(false);
          return;
        }
      } catch (err) {
        alert('Server Security Verification Error');
        setAuthLoading(false);
        return;
      }
    }

    const endpoint = isSignUp ? 'signup' : 'token?grant_type=password';
    const formattedPhone = authMethod === 'phone' ? formatQatarPhone(phone) : undefined;
    const bodyData: any = { password };

    if (authMethod === 'email') bodyData.email = email;
    else bodyData.phone = formattedPhone;

    if (isSignUp) {
      bodyData.data = { role: isGarageSignUp ? 'garage' : 'user' };
    }

    try {
      const response = await fetch(`${authUrl}/${endpoint}`, {
        method: 'POST',
        headers: { 'apikey': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      const data = await response.json();

      if (response.ok) {
        if (isSignUp) {
          alert(t[lang].alertSignupSuccess);
          setIsSignUp(false);
          setAuthLoading(false);
        } else {
          const userRole = data.user?.user_metadata?.role || 'user';
          onSuccess({
            email: data.user.email || undefined,
            phone: data.user.phone || undefined,
            role: userRole,
            token: data.access_token,
            user: data.user // حفظ بيانات المستخدم لاستخدام الـ ID في لوحة التحكم
          });
        }
      } else {
        alert(data.msg || data.error_description || 'Error');
      }
    } catch (error) {
      alert('Connection Error');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '450px', margin: '50px auto', backgroundColor: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
      <div style={{ padding: '35px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '45px' }}>🔑</span>
          <h2 style={{ margin: '10px 0 5px 0', color: '#1a365d' }}>{isSignUp ? t[lang].signUpTitle : t[lang].loginTitle}</h2>
          <p style={{ fontSize: '13px', color: '#718096', margin: 0 }}>{t[lang].welcomeAuth}</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', justifyContent: 'center' }}>
          <button type="button" onClick={() => setAuthMethod('email')} style={{ flex: 1, padding: '8px', borderRadius: '20px', border: authMethod === 'email' ? 'none' : '1px solid #cbd5e0', backgroundColor: authMethod === 'email' ? '#4a5568' : 'white', color: authMethod === 'email' ? 'white' : '#4a5568', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
            {t[lang].emailTab}
          </button>
          <button type="button" onClick={() => setAuthMethod('phone')} style={{ flex: 1, padding: '8px', borderRadius: '20px', border: authMethod === 'phone' ? 'none' : '1px solid #cbd5e0', backgroundColor: authMethod === 'phone' ? '#4a5568' : 'white', color: authMethod === 'phone' ? 'white' : '#4a5568', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
            {t[lang].phoneTab}
          </button>
        </div>

        <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {authMethod === 'email' ? (
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t[lang].emailLabel}</label>
              <input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required />
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t[lang].phoneLabel}</label>
              <div style={{ display: 'flex', direction: 'ltr', width: '100%' }}>
                <span style={{ padding: '11px 15px', backgroundColor: '#edf2f7', border: '1px solid #cbd5e0', borderRight: 'none', borderRadius: '8px 0 0 8px', fontWeight: 'bold', color: '#4a5568', fontSize: '14px', display: 'flex', alignItems: 'center' }}>+974 🇶🇦</span>
                <input type="tel" placeholder="55xxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ flex: 1, padding: '11px', borderRadius: '0 8px 8px 0', border: '1px solid #cbd5e0', boxSizing: 'border-box', textAlign: 'left', direction: 'ltr' }} required />
              </div>
              <span style={{ fontSize: '11px', color: '#718096', marginTop: '4px', display: 'block' }}>{t[lang].phoneHint}</span>
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>{t[lang].passwordLabel}</label>
            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required />
          </div>

          {isSignUp && (
            <div style={{ backgroundColor: '#fff5f5', padding: '12px', borderRadius: '10px', marginTop: '5px', border: '1px solid #fed7d7', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" id="isGarageCheckbox" checked={isGarageSignUp} onChange={(e) => { setIsGarageSignUp(e.target.checked); setActivationCode(''); }} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
              <label htmlFor="isGarageCheckbox" style={{ fontSize: '13px', fontWeight: 'bold', color: '#9b2c2c', cursor: 'pointer' }}>{t[lang].garageRegCheck}</label>
            </div>
          )}

          {isSignUp && isGarageSignUp && (
            <div style={{ backgroundColor: '#fff5f7', padding: '15px', borderRadius: '10px', border: '1px dashed #f687b3' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#97266d' }}>{t[lang].garageSecretLabel}</label>
              <input type="text" placeholder={t[lang].garageSecretPlaceholder} value={activationCode} onChange={(e) => setActivationCode(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required />
            </div>
          )}

          <button type="submit" disabled={authLoading} style={{ width: '100%', padding: '12px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '10px' }}>
            {authLoading ? t[lang].btnLoggingIn : (isSignUp ? (isGarageSignUp ? t[lang].btnCreateGarage : t[lang].btnCreateUser) : t[lang].btnLogin)}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button type="button" onClick={() => { setIsSignUp(!isSignUp); setIsGarageSignUp(false); }} style={{ background: 'none', border: 'none', color: '#3182ce', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
            {isSignUp ? t[lang].haveAccount : t[lang].noAccount}
          </button>
        </div>
      </div>
    </div>
  );
};
