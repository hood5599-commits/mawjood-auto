import React, { useState, useEffect } from 'react';

interface AdminDashboardProps {
  lang: 'ar' | 'en';
  supabaseUrl: string;
  apiKey: string;
  session: any;
  siteSettings: any;
  onUpdateSettings: (newSettings: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ lang, supabaseUrl, apiKey, siteSettings, onUpdateSettings }) => {
  const isRtl = lang === 'ar';
  const [activeTab, setActiveTab] = useState<'social' | 'parts' | 'users'>('social');

  // بيانات السوشيال ميديا والإعدادات
  const [facebook, setFacebook] = useState(siteSettings?.facebook || '');
  const [instagram, setInstagram] = useState(siteSettings?.instagram || '');
  const [twitter, setTwitter] = useState(siteSettings?.twitter || '');
  const [whatsapp, setWhatsapp] = useState(siteSettings?.whatsapp || '');

  // قوائم القطع والمستخدمين
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchParts();
  }, []);

  const fetchParts = async () => {
    try {
      const res = await fetch(`${supabaseUrl}/parts?select=*`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setParts(data);
    } catch (e) {}
  };

  const handleDeletePart = async (id: number) => {
    if (!window.confirm(isRtl ? 'هل أنت تأكد من حذف هذه القطعة نهائياً؟' : 'Delete this part?')) return;
    try {
      await fetch(`${supabaseUrl}/parts?id=eq.${id}`, {
        method: 'DELETE',
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${apiKey}` }
      });
      setParts(parts.filter(p => p.id !== id));
      alert(isRtl ? 'تم حذف القطعة بنجاح' : 'Part deleted');
    } catch (e) {}
  };

  const handleSaveSocial = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = { facebook, instagram, twitter, whatsapp };
    onUpdateSettings(updated);
    setMsg(isRtl ? 'تم حفظ روابط السوشال ميديا بنجاح! 🎉' : 'Social links saved!');
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '30px auto', padding: '24px', backgroundColor: '#ffffff', borderRadius: '22px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', fontFamily: 'Cairo, sans-serif', direction: isRtl ? 'rtl' : 'ltr' }}>
      
      {/* 👑 الهيدر الرئيسي للأدمن */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #f1f5f9', paddingBottom: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '32px' }}>👑</span>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>
              {isRtl ? 'لوحة تحكم مدير النظام (الأدمن)' : 'Admin Dashboard'}
            </h2>
            <span style={{ fontSize: '12.5px', color: '#64748b' }}>
              {isRtl ? 'التحكم الكامل في منصة موجود أوتو والروابط والمستخدمين' : 'Full Control over Mawjood Auto'}
            </span>
          </div>
        </div>
      </div>

      {/* 🔄 تبويبات الإدارة */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
        <button
          onClick={() => setActiveTab('social')}
          style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13.5px', backgroundColor: activeTab === 'social' ? '#1f3a5f' : '#f1f5f9', color: activeTab === 'social' ? 'white' : '#64748b' }}
        >
          🌐 {isRtl ? 'إدارة السوشال ميديا' : 'Social Links'}
        </button>

        <button
          onClick={() => setActiveTab('parts')}
          style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13.5px', backgroundColor: activeTab === 'parts' ? '#1f3a5f' : '#f1f5f9', color: activeTab === 'parts' ? 'white' : '#64748b' }}
        >
          📦 {isRtl ? 'إدارة قطع الغيار' : 'Manage Parts'} ({parts.length})
        </button>
      </div>

      {msg && (
        <div style={{ backgroundColor: '#e8f9f1', color: '#1e9d6b', padding: '12px', borderRadius: '10px', marginBottom: '20px', fontWeight: 'bold', textAlign: 'center' }}>
          {msg}
        </div>
      )}

      {/* 1️⃣ تعديل روابط السوشال ميديا */}
      {activeTab === 'social' && (
        <form onSubmit={handleSaveSocial} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
          <h3>🌐 {isRtl ? 'تعديل روابط شبكات التواصل الاجتماعي' : 'Edit Social Media Links'}</h3>
          
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold' }}>رابط الفيسبوك (Facebook)</label>
            <input type="text" value={facebook} onChange={(e) => setFacebook(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e0' }} placeholder="https://facebook.com/yourpage" />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold' }}>رابط إنستغرام (Instagram)</label>
            <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e0' }} placeholder="https://instagram.com/yourprofile" />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold' }}>رابط تويتر / X</label>
            <input type="text" value={twitter} onChange={(e) => setTwitter(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e0' }} placeholder="https://twitter.com/yourprofile" />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold' }}>رقم الواتساب (بدون +)</label>
            <input type="text" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e0' }} placeholder="97455000000" />
          </div>

          <button type="submit" style={{ padding: '12px 24px', backgroundColor: '#e0872a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', width: 'fit-content' }}>
            💾 {isRtl ? 'حفظ التحديثات' : 'Save Social Links'}
          </button>
        </form>
      )}

      {/* 2️⃣ إدارة وقائمة القطع */}
      {activeTab === 'parts' && (
        <div>
          <h3>📦 {isRtl ? 'جميع قطع الغيار المعروضة بالموقع' : 'All Listed Parts'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
            {parts.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: '#f8fafc' }}>
                <div>
                  <strong style={{ fontSize: '14px', color: '#1e293b' }}>{p.name}</strong>
                  <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>{p.make} - {p.model} | السعر: {p.price} QAR</span>
                </div>
                <button onClick={() => handleDeletePart(p.id)} style={{ backgroundColor: '#fdecec', color: '#d1453b', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                  🗑️ {isRtl ? 'حذف القطعة' : 'Delete'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
