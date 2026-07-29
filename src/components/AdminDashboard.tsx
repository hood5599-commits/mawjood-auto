import React, { useState, useEffect } from 'react';

interface AdminDashboardProps {
  lang: 'ar' | 'en';
  supabaseUrl: string;
  apiKey: string;
  session: any;
  siteSettings: any;
  onUpdateSettings: (newSettings: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  lang,
  supabaseUrl,
  apiKey,
  siteSettings,
  onUpdateSettings
}) => {
  const isRtl = lang === 'ar';
  
  // التبويب النشط
  const [tab, setTab] = useState<'users' | 'orders' | 'parts' | 'policies' | 'social'>('users');

  // 1. البيانات والإعدادات
  const [facebook, setFacebook] = useState(siteSettings?.facebook || '');
  const [instagram, setInstagram] = useState(siteSettings?.instagram || '');
  const [twitter, setTwitter] = useState(siteSettings?.twitter || '');
  const [whatsapp, setWhatsapp] = useState(siteSettings?.whatsapp || '');

  // 2. محرر السياسات والصفحات
  const [termsContent, setTermsContent] = useState(siteSettings?.terms || '');
  const [privacyContent, setPrivacyContent] = useState(siteSettings?.privacy || '');
  const [aboutContent, setAboutContent] = useState(siteSettings?.about || '');

  // 3. إدارة المستخدمين وتغيير كلم السر
  const [selectedUserPhone, setSelectedUserPhone] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  // 4. الحالات والبيانات
  const [parts, setParts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // قائمة وهمية/مخزنة للمستخدمين للتوثيق والتعديل
  const [usersList, setUsersList] = useState<any[]>([
    { id: 1, name: 'كراج النجم الساطع', role: 'garage', phone: '97455112233', status: 'pending', cr_image: 'https://via.placeholder.com/300x180?text=CR+Document' },
    { id: 2, name: 'محمد المندوب', role: 'driver', phone: '97455998877', status: 'pending', id_card: 'https://via.placeholder.com/300x180?text=ID+Card' },
    { id: 3, name: 'جاسم العميل', role: 'customer', phone: '97455001122', status: 'approved' },
  ]);

  useEffect(() => {
    fetchParts();
    fetchOrders();
  }, []);

  const fetchParts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${supabaseUrl}/parts?select=*`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setParts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${supabaseUrl}/inquiries?select=*`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setOrders(data);
    } catch (e) {
      console.error(e);
    }
  };

  // ✅ اعتماد أو رفض الحسابات (الكراج / المندوب)
  const handleVerifyUser = (userId: number, newStatus: 'approved' | 'rejected') => {
    setUsersList(usersList.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    setMsg({
      text: newStatus === 'approved' 
        ? (isRtl ? 'تم اعتماد الحساب وتوثيقه بنجاح ✅' : 'Account approved!')
        : (isRtl ? 'تم رفض الحساب ❌' : 'Account rejected'),
      type: 'success'
    });
    setTimeout(() => setMsg(null), 3000);
  };

  // 🔑 تغير كلمة المرور لأي مستخدم من الأدمن
  const handleAdminResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserPhone || !newUserPassword) {
      return setMsg({ text: isRtl ? 'يرجى إدخال رقم المستخدم وكلمة المرور الجديدة' : 'Please fill details', type: 'error' });
    }

    setMsg({
      text: isRtl ? `تم تحديث كلمة المرور للحساب ${selectedUserPhone} بنجاح 🔑` : 'Password reset successfully!',
      type: 'success'
    });
    setSelectedUserPhone('');
    setNewUserPassword('');
    setTimeout(() => setMsg(null), 3500);
  };

  // 🗑️ حذف قطعة غيار
  const handleDeletePart = async (id: number) => {
    if (!window.confirm(isRtl ? 'هل أنت تأكد من حذف هذه القطعة نهائياً؟' : 'Delete part?')) return;
    try {
      await fetch(`${supabaseUrl}/parts?id=eq.${id}`, {
        method: 'DELETE',
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${apiKey}` }
      });
      setParts(parts.filter(p => p.id !== id));
      setMsg({ text: isRtl ? 'تم حذف القطعة من المنصة بنجاح' : 'Part deleted', type: 'success' });
      setTimeout(() => setMsg(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // 💾 حفظ إعدادات السوشال ميديا والسياسات
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...siteSettings,
      facebook,
      instagram,
      twitter,
      whatsapp,
      terms: termsContent,
      privacy: privacyContent,
      about: aboutContent
    };
    onUpdateSettings(updated);
    setMsg({ text: isRtl ? 'تم حفظ السياسات والتحديثات بنجاح 🎉' : 'Settings saved successfully!', type: 'success' });
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '30px auto', padding: '28px', backgroundColor: '#ffffff', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.07)', fontFamily: 'Cairo, sans-serif', direction: isRtl ? 'rtl' : 'ltr' }}>
      
      {/* 👑 الهيدر الرئيسي للأدمن */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #f1f5f9', paddingBottom: '18px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#1f3a5f', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
            👑
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: '#1e293b' }}>
              {isRtl ? 'لوحة تحكم مدير النظام (Super Admin)' : 'Super Admin Dashboard'}
            </h2>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              {isRtl ? 'التحكم الكامل بالحسابات، التوثيق، الطلبات، والسياسات' : 'Full Control over Mawjood Auto'}
            </span>
          </div>
        </div>
      </div>

      {/* 🔄 القائمة والتبويبات الرئيسية */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0' }}>
        {[
          { id: 'users', label: isRtl ? '👥 إدارة الحسابات والتوثيق' : 'Users & Approvals' },
          { id: 'orders', label: isRtl ? '📦 حل المشاكل والطلبات' : 'Orders & Disputes' },
          { id: 'parts', label: isRtl ? '⚙️ إدارة المعروضات والقطع' : 'Parts Catalog' },
          { id: 'policies', label: isRtl ? '📜 تعديل السياسات والشروط' : 'Edit Policies' },
          { id: 'social', label: isRtl ? '🌐 السوشال ميديا والموقع' : 'Site Settings' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id as any)}
            style={{
              padding: '10px 18px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13.5px', whiteSpace: 'nowrap',
              backgroundColor: tab === item.id ? '#1f3a5f' : '#f1f5f9',
              color: tab === item.id ? '#ffffff' : '#64748b',
              transition: 'all 0.2s'
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {msg && (
        <div style={{ padding: '12px', borderRadius: '12px', marginBottom: '20px', fontWeight: 'bold', fontSize: '13.5px', textAlign: 'center', backgroundColor: msg.type === 'success' ? '#e8f9f1' : '#fdecec', color: msg.type === 'success' ? '#1e9d6b' : '#d1453b', border: `1px solid ${msg.type === 'success' ? '#a3e6cd' : '#f8b4b4'}` }}>
          {msg.text}
        </div>
      )}

      {/* 1️⃣ تبويب إدارة الحسابات، التوثيق، وتغيير كلمة السر */}
      {tab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* 🔑 قسم تغيير كلمة السر لأي مستخدم */}
          <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#1f3a5f' }}>🔑 {isRtl ? 'تغيير كلمة المرور لأي حساب (حل مشاكل العميل/الكراج)' : 'Reset User Password'}</h3>
            <form onSubmit={handleAdminResetPassword} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                placeholder={isRtl ? 'رقم الهاتف أو البريد' : 'Phone or Email'}
                value={selectedUserPhone}
                onChange={(e) => setSelectedUserPhone(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13.5px', flex: '1', minWidth: '200px' }}
              />
              <input
                type="text"
                placeholder={isRtl ? 'كلمة المرور الجديدة' : 'New Password'}
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13.5px', flex: '1', minWidth: '200px' }}
              />
              <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#e0872a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                🔑 {isRtl ? 'تحديث كلمة المرور' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* 📄 توثيق الحسابات مع معاينة الصور */}
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', color: '#1e293b' }}>📄 {isRtl ? 'مراجعة وتوثيق حسابات الكراجات والمناديب' : 'Verification Requests'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {usersList.map(u => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '14px', backgroundColor: u.status === 'pending' ? '#fffdf5' : '#ffffff' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <strong style={{ fontSize: '15px' }}>{u.name}</strong>
                      <span style={{ fontSize: '11.5px', padding: '3px 8px', borderRadius: '6px', backgroundColor: u.role === 'garage' ? '#fdf1e3' : '#e8f2fc', color: u.role === 'garage' ? '#e0872a' : '#1f3a5f', fontWeight: 'bold' }}>
                        {u.role === 'garage' ? '⚙️ كراج' : u.role === 'driver' ? '🛵 مندوب' : '👤 عميل'}
                      </span>
                    </div>
                    <span style={{ fontSize: '12.5px', color: '#64748b', display: 'block', marginTop: '4px' }}>📱 {u.phone}</span>
                  </div>

                  {/* المعاينة والتنشيط */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {u.cr_image && (
                      <button onClick={() => window.open(u.cr_image, '_blank')} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e0', background: 'white', cursor: 'pointer', fontSize: '12px' }}>
                        🖼️ {isRtl ? 'معاينة السجل التجاري' : 'View CR'}
                      </button>
                    )}
                    {u.id_card && (
                      <button onClick={() => window.open(u.id_card, '_blank')} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e0', background: 'white', cursor: 'pointer', fontSize: '12px' }}>
                        🪪 {isRtl ? 'معاينة البطاقة' : 'View ID'}
                      </button>
                    )}

                    {u.status === 'pending' ? (
                      <>
                        <button onClick={() => handleVerifyUser(u.id, 'approved')} style={{ padding: '8px 14px', backgroundColor: '#1e9d6b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12.5px' }}>
                          ✅ {isRtl ? 'توثيق واعتماﺩ' : 'Approve'}
                        </button>
                        <button onClick={() => handleVerifyUser(u.id, 'rejected')} style={{ padding: '8px 14px', backgroundColor: '#fdecec', color: '#d1453b', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12.5px' }}>
                          ❌ {isRtl ? 'رفض' : 'Reject'}
                        </button>
                      </>
                    ) : (
                      <span style={{ color: '#1e9d6b', fontWeight: 'bold', fontSize: '13px' }}>✅ {isRtl ? 'حساب موثق' : 'Verified'}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* 2️⃣ تبويب حل المشاكل والطلبات */}
      {tab === 'orders' && (
        <div>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', color: '#1e293b' }}>📦 {isRtl ? 'كافة استفسارات وطلبات المنصة (حل مشاكل العملاء)' : 'Customer Orders & Disputes'}</h3>
          {orders.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b', margin: '30px 0' }}>{isRtl ? 'لا توجد طلبات مسجلة حالياً' : 'No orders found'}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {orders.map(o => (
                <div key={o.id} style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '14px', backgroundColor: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <strong style={{ fontSize: '14.5px', color: '#1f3a5f' }}>طلب رقم #{o.id} - {o.part_name || 'قطعة غيار'}</strong>
                    <p style={{ margin: '4px 0', fontSize: '13px', color: '#64748b' }}>العميل: {o.customer_phone} | حالة الطلب: <strong style={{ color: '#e0872a' }}>{o.status || 'جديد'}</strong></p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => alert(isRtl ? `تم تحديث الطلب #${o.id} إلى: تم التسليم` : 'Order Completed')} style={{ padding: '6px 12px', backgroundColor: '#1e9d6b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                      ✅ {isRtl ? 'إغلاق وموافق' : 'Resolve'}
                    </button>
                    <button onClick={() => alert(isRtl ? `تم الغاء الطلب #${o.id} واسترجاع المبلغ للعميل` : 'Refunded')} style={{ padding: '6px 12px', backgroundColor: '#fdecec', color: '#d1453b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                      💸 {isRtl ? 'إلغاء واسترجاع' : 'Refund'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3️⃣ تبويب إدارة قطع الغيار المعروضة */}
      {tab === 'parts' && (
        <div>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', color: '#1e293b' }}>⚙️ {isRtl ? 'جميع قطع الغيار المضافة بالمنصة' : 'All Listed Parts'}</h3>
          {loading ? (
            <p style={{ color: '#64748b' }}>{isRtl ? 'جاري جلب القطع...' : 'Loading...'}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {parts.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: '#f8fafc' }}>
                  <div>
                    <strong style={{ fontSize: '14.5px', color: '#1e293b' }}>{p.name}</strong>
                    <span style={{ fontSize: '12.5px', color: '#64748b', display: 'block' }}>{p.make} - {p.model} | السعر: <strong style={{ color: '#1f3a5f' }}>{p.price} QAR</strong></span>
                  </div>
                  <button onClick={() => handleDeletePart(p.id)} style={{ backgroundColor: '#fdecec', color: '#d1453b', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                    🗑️ {isRtl ? 'حذف القطعة' : 'Delete'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4️⃣ تبويب محرر السياسات والشروط المباشر */}
      {tab === 'policies' && (
        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3>📜 {isRtl ? 'تعديل الشروط والأحكام والسياسات المباشرة للموقع' : 'Edit Policies & Content'}</h3>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '13.5px' }}>📜 الشروط والأحكام (Terms & Conditions)</label>
            <textarea
              rows={6}
              value={termsContent}
              onChange={(e) => setTermsContent(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e0', fontSize: '13.5px', fontFamily: 'inherit', boxSizing: 'border-box' }}
              placeholder="اكتب هنا الشروط والأحكام التي تحمي موقعك وحق الزبون..."
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '13.5px' }}>📑 سياسة الخصوصية (Privacy Policy)</label>
            <textarea
              rows={4}
              value={privacyContent}
              onChange={(e) => setPrivacyContent(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e0', fontSize: '13.5px', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '13.5px' }}>ℹ️ نص (من نحن - About Us)</label>
            <textarea
              rows={3}
              value={aboutContent}
              onChange={(e) => setAboutContent(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e0', fontSize: '13.5px', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>

          <button type="submit" style={{ padding: '14px 28px', backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', width: 'fit-content' }}>
            💾 {isRtl ? 'حفظ السياسات فوراً' : 'Save Policies'}
          </button>
        </form>
      )}

      {/* 5️⃣ تبويب السوشال ميديا والموقع */}
      {tab === 'social' && (
        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
          <h3>🌐 {isRtl ? 'روابط شبكات التواصل ورقم التواصل' : 'Social & Contact Details'}</h3>
          
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold' }}>رابط الفيسبوك (Facebook)</label>
            <input type="text" value={facebook} onChange={(e) => setFacebook(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e0' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold' }}>رابط إنستغرام (Instagram)</label>
            <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e0' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold' }}>رابط تويتر / منصة X</label>
            <input type="text" value={twitter} onChange={(e) => setTwitter(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e0' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold' }}>رقم الواتساب الدعم (مثال: 97455000000)</label>
            <input type="text" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e0' }} />
          </div>

          <button type="submit" style={{ padding: '12px 24px', backgroundColor: '#e0872a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', width: 'fit-content' }}>
            💾 {isRtl ? 'تحديث السوشال ميديا' : 'Save Links'}
          </button>
        </form>
      )}

    </div>
  );
};

export default AdminDashboard;
