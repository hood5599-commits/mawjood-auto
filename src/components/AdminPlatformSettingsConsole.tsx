/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useCallback, useEffect, useState } from 'react';

interface AdminPlatformSettingsConsoleProps {
  supabaseUrl: string;
  apiKey: string;
  lang?: 'ar' | 'en';
}

type SettingsRow = {
  id: number;
  support_phone: string;
  support_whatsapp: string;
  support_email: string;
  social_links: Record<string, string>;
  payment_methods: Record<string, boolean>;
  maintenance_mode: boolean;
};

const defaultPayments = {
  cod_enabled: true,
  card_enabled: true,
  apple_pay_enabled: true,
  google_pay_enabled: true,
  pay_later_enabled: false,
};

const defaultSocial = {
  instagram: '',
  x: '',
  tiktok: '',
  facebook: '',
};

export const AdminPlatformSettingsConsole: React.FC<AdminPlatformSettingsConsoleProps> = ({
  supabaseUrl,
  apiKey,
  lang = 'ar',
}) => {
  const isRtl = lang === 'ar';
  const cleanBaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const restUrl = `${cleanBaseUrl}/rest/v1`;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);

  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [instagram, setInstagram] = useState('');
  const [xLink, setXLink] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [facebook, setFacebook] = useState('');
  const [maintenance, setMaintenance] = useState(false);
  const [payments, setPayments] = useState({ ...defaultPayments });

  const headers = {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${restUrl}/platform_settings?id=eq.1&select=*&limit=1`, {
        headers,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();
      const row: SettingsRow | undefined = Array.isArray(rows) ? rows[0] : undefined;
      if (row) {
        setPhone(row.support_phone || '');
        setWhatsapp(row.support_whatsapp || '');
        setEmail(row.support_email || '');
        const social = { ...defaultSocial, ...(row.social_links || {}) };
        setInstagram(social.instagram || '');
        setXLink(social.x || '');
        setTiktok(social.tiktok || '');
        setFacebook(social.facebook || '');
        setPayments({ ...defaultPayments, ...(row.payment_methods || {}) });
        setMaintenance(!!row.maintenance_mode);
      }
    } catch (e: any) {
      setStatus({ text: e?.message || 'Load failed', ok: false });
    } finally {
      setLoading(false);
    }
  }, [apiKey, restUrl]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const payload = {
        support_phone: phone.trim(),
        support_whatsapp: whatsapp.trim(),
        support_email: email.trim(),
        social_links: {
          instagram: instagram.trim(),
          x: xLink.trim(),
          tiktok: tiktok.trim(),
          facebook: facebook.trim(),
        },
        payment_methods: payments,
        maintenance_mode: maintenance,
        updated_at: new Date().toISOString(),
      };
      const res = await fetch(`${restUrl}/platform_settings?id=eq.1`, {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify(payload),
      });
      if (!res.ok && res.status !== 204) {
        const err = await res.text();
        throw new Error(err || `HTTP ${res.status}`);
      }
      setStatus({
        text: isRtl ? 'تم حفظ إعدادات المنصة بنجاح' : 'Platform settings saved successfully',
        ok: true,
      });
    } catch (err: any) {
      setStatus({
        text: `${isRtl ? 'فشل الحفظ' : 'Save failed'}: ${err?.message || 'unknown'}`,
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid #cbd5e0',
    fontSize: 13,
    fontFamily: 'Cairo, sans-serif',
    boxSizing: 'border-box',
    backgroundColor: '#f8fafc',
  };

  const toggle = (key: keyof typeof defaultPayments) => {
    setPayments((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
        {isRtl ? 'جاري تحميل إعدادات المنصة...' : 'Loading platform settings...'}
      </div>
    );
  }

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 720 }}>
      <div>
        <h3 style={{ margin: 0, color: '#1f3a5f', fontSize: 18 }}>
          {isRtl ? 'إعدادات المنصة العامة' : 'General Platform Settings'}
        </h3>
        <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 12.5 }}>
          {isRtl
            ? 'تحديث بيانات التواصل وبوابات الدفع ينعكس فوراً على تطبيق الموبايل'
            : 'Contact and payment updates reflect instantly in the mobile app'}
        </p>
      </div>

      <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16 }}>
          <h4 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: 14 }}>
            {isRtl ? 'التواصل والدعم' : 'Contact & Support'}
          </h4>
          <div style={{ display: 'grid', gap: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
              {isRtl ? 'هاتف الدعم' : 'Support phone'}
              <input value={phone} onChange={(e) => setPhone(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />
            </label>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
              WhatsApp
              <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />
            </label>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
              Email
              <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />
            </label>
          </div>
        </section>

        <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16 }}>
          <h4 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: 14 }}>
            {isRtl ? 'وسائل التواصل' : 'Social Media'}
          </h4>
          <div style={{ display: 'grid', gap: 10 }}>
            <input placeholder="Instagram URL" value={instagram} onChange={(e) => setInstagram(e.target.value)} style={inputStyle} />
            <input placeholder="X / Twitter URL" value={xLink} onChange={(e) => setXLink(e.target.value)} style={inputStyle} />
            <input placeholder="TikTok URL" value={tiktok} onChange={(e) => setTiktok(e.target.value)} style={inputStyle} />
            <input placeholder="Facebook URL" value={facebook} onChange={(e) => setFacebook(e.target.value)} style={inputStyle} />
          </div>
        </section>

        <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16 }}>
          <h4 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: 14 }}>
            {isRtl ? 'بوابات الدفع' : 'Payment Gateways'}
          </h4>
          {(
            [
              ['cod_enabled', isRtl ? 'الدفع عند الاستلام (COD)' : 'Cash on Delivery'],
              ['card_enabled', isRtl ? 'بطاقات مدى / فيزا / ماستركارد' : 'Debit / Credit Cards'],
              ['apple_pay_enabled', 'Apple Pay'],
              ['google_pay_enabled', 'Google Pay'],
              ['pay_later_enabled', isRtl ? 'قسّطها لاحقاً (Pay Later)' : 'Pay Later / Installments'],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '10px 0',
                borderBottom: '1px solid #f1f5f9',
                fontSize: 13,
                color: '#334155',
                fontWeight: 700,
              }}
            >
              <span>{label}</span>
              <input
                type="checkbox"
                checked={!!payments[key]}
                onChange={() => toggle(key)}
                style={{ width: 18, height: 18 }}
              />
            </label>
          ))}
        </section>

        <section style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 14, padding: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 800, color: '#9a3412' }}>
            <span>{isRtl ? 'وضع الصيانة للتطبيق' : 'App maintenance mode'}</span>
            <input
              type="checkbox"
              checked={maintenance}
              onChange={(e) => setMaintenance(e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
          </label>
        </section>

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '12px 16px',
            border: 'none',
            borderRadius: 10,
            background: '#1f3a5f',
            color: '#fff',
            fontWeight: 800,
            fontSize: 13.5,
            cursor: saving ? 'wait' : 'pointer',
          }}
        >
          {saving ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ الإعدادات' : 'Save Settings')}
        </button>

        {status && (
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 13,
              background: status.ok ? '#ecfdf5' : '#fef2f2',
              color: status.ok ? '#047857' : '#b91c1c',
              border: `1px solid ${status.ok ? '#a7f3d0' : '#fecaca'}`,
            }}
          >
            {status.text}
          </div>
        )}
      </form>
    </div>
  );
};
