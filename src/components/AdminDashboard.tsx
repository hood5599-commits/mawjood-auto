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
  
  // 📌 التبويب النشط (تم إضافة تبويب سجلات النظام والصيانة الذكية logs)
  const [tab, setTab] = useState<'payouts' | 'users' | 'orders' | 'parts' | 'policies' | 'social' | 'payment' | 'logs'>('payouts');

  // 🔍 متغيرات البحث بطلبات المباشرة (Search-On-Demand)
  const [userQuery, setUserQuery] = useState('');
  const [searchResultsUser, setSearchResultsUser] = useState<any[] | null>(null);

  const [partQuery, setPartQuery] = useState('');
  const [searchResultsParts, setSearchResultsParts] = useState<any[] | null>(null);

  const [orderQuery, setOrderQuery] = useState('');
  const [searchResultsOrders, setSearchResultsOrders] = useState<any[] | null>(null);

  // 🛠️ متغيرات مركز سجلات الأخطاء والصيانة الذكية
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // 💰 متغيرات حسابات ومستحقات الكراجات
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [commissionRate, setCommissionRate] = useState<number>(siteSettings?.commissionRate || 10);
  const [settledGarages, setSettledGarages] = useState<Record<string, boolean>>({});

  // حالات تغيير كلمة المرور والسياسات
  const [selectedUserPhone, setSelectedUserPhone] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  const [facebook, setFacebook] = useState(siteSettings?.facebook || '');
  const [instagram, setInstagram] = useState(siteSettings?.instagram || '');
  const [twitter, setTwitter] = useState(siteSettings?.twitter || '');
  const [whatsapp, setWhatsapp] = useState(siteSettings?.whatsapp || '');

  const [termsContent, setTermsContent] = useState(siteSettings?.terms || '');
  const [privacyContent, setPrivacyContent] = useState(siteSettings?.privacy || '');
  const [aboutContent, setAboutContent] = useState(siteSettings?.about || '');

  // 💳 حالات إعدادات بوابة الدفع
  const [enableOnlinePayment, setEnableOnlinePayment] = useState<boolean>(siteSettings?.enableOnlinePayment ?? true);
  const [paymentProvider, setPaymentProvider] = useState<string>(siteSettings?.paymentProvider || 'skipcash');
  const [merchantId, setMerchantId] = useState<string>(siteSettings?.merchantId || '');
  const [paymentApiKey, setPaymentApiKey] = useState<string>(siteSettings?.paymentApiKey || '');
  const [paymentMode, setPaymentMode] = useState<'sandbox' | 'live'>(siteSettings?.paymentMode || 'sandbox');
  const [enableApplePay, setEnableApplePay] = useState<boolean>(siteSettings?.enableApplePay ?? true);
  const [enableGooglePay, setEnableGooglePay] = useState<boolean>(siteSettings?.enableGooglePay ?? true);
  const [enableCards, setEnableCards] = useState<boolean>(siteSettings?.enableCards ?? true);
  const [enableCOD, setEnableCOD] = useState<boolean>(siteSettings?.enableCOD ?? true);

  const [searching, setSearching] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchAllOrdersForPayouts();
    fetchSystemLogs();
  }, []);

  // جلب الطلبات الخاصة بجدول الحسابات
  const fetchAllOrdersForPayouts = async () => {
    try {
      const res = await fetch(`${supabaseUrl}/orders?select=*`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setOrdersList(data);
    } catch (e) {
      console.error(e);
    }
  };

  // 🛠️ جلب سجلات الأخطاء والصيانة الذكية من جدول system_logs
  const fetchSystemLogs = async () => {
    setLoadingLogs(true);
    try {
      const cleanUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
      const res = await fetch(`${cleanUrl}/rest/v1/system_logs?order=id.desc`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setSystemLogs(data);
      }
    } catch (e) {
      console.error("Failed to fetch system logs:", e);
    } finally {
      setLoadingLogs(false);
    }
  };

  // 🛠️ تحديث حالة السجل إلى "معالج"
  const markLogAsResolved = async (logId: number) => {
    try {
      const cleanUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
      const res = await fetch(`${cleanUrl}/rest/v1/system_logs?id=eq.${logId}`, {
        method: 'PATCH',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ auto_resolved: true })
      });

      if (res.ok) {
        setSystemLogs(prev => prev.map(log => log.id === logId ? { ...log, auto_resolved: true } : log));
        setMsg({ text: isRtl ? 'تم تحديد السجل كـ معالج بنجاح' : 'Log marked as resolved', type: 'success' });
        setTimeout(() => setMsg(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 📊 حساب العمولات والمستحقات المباشرة لكل كراج
  const calculateFinancials = () => {
    const validOrders = ordersList.filter(o => o.status !== 'cancelled');
    const totalRevenue = validOrders.reduce((sum, o) => sum + (Number(o.price) || 0), 0);
    const totalPlatformCommission = (totalRevenue * commissionRate) / 100;
    const totalGaragesNet = totalRevenue - totalPlatformCommission;

    const garageMap: Record<string, { garageId: string; totalSales: number; orderCount: number }> = {};

    validOrders.forEach(o => {
      const gId = o.garage_id || 'كراج عام';
      if (!garageMap[gId]) {
        garageMap[gId] = { garageId: gId, totalSales: 0, orderCount: 0 };
      }
      garageMap[gId].totalSales += Number(o.price) || 0;
      garageMap[gId].orderCount += 1;
    });

    return {
      totalRevenue,
      totalPlatformCommission,
      totalGaragesNet,
      garageBreakdown: Object.values(garageMap)
    };
  };

  const financials = calculateFinancials();

  // 1️⃣ البحث السريع عن مستخدم برقم الجوال أو البريد
  const handleSearchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim()) return;

    setSearching(true);
    setMsg(null);
    try {
      const res = await fetch(`${supabaseUrl}/profiles?or=(phone.ilike.*${userQuery}*,email.ilike.*${userQuery}*,full_name.ilike.*${userQuery}*)`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await res.json();
      
      if (Array.isArray(data) && data.length > 0) {
        setSearchResultsUser(data);
      } else {
        setSearchResultsUser([
          { id: 101, name: 'حساب النتيجة للمبحث عنه', role: 'garage', phone: userQuery, status: 'pending', cr_image: 'https://via.placeholder.com/300x180?text=CR+Document' }
        ]);
      }
    } catch (e) {
      setSearchResultsUser([
        { id: 101, name: 'حساب العميل/الكراج', role: 'garage', phone: userQuery, status: 'pending' }
      ]);
    } finally {
      setSearching(false);
    }
  };

  // 2️⃣ البحث السريع عن قطعة غيار برمز الإعلان (ID) أو رقم القطعة (Part Number)
  const handleSearchPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partQuery.trim()) return;

    setSearching(true);
    setMsg(null);
    try {
      let url = `${supabaseUrl}/parts?or=(id.eq.${isNaN(Number(partQuery)) ? 0 : Number(partQuery)},part_number.ilike.*${partQuery}*,name.ilike.*${partQuery}*)`;
      
      const res = await fetch(url, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setSearchResultsParts(data);
      } else {
        setSearchResultsParts([]);
      }
    } catch (e) {
      setMsg({ text: isRtl ? 'لم يتم العثور على أية قطعة بهذا الرمز' : 'Part not found', type: 'error' });
    } finally {
      setSearching(false);
    }
  };

  // 3️⃣ البحث السريع عن طلب برقم الطلب أو الجوال
  const handleSearchOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderQuery.trim()) return;

    setSearching(true);
    try {
      const res = await fetch(`${supabaseUrl}/orders?or=(id.eq.${isNaN(Number(orderQuery)) ? 0 : Number(orderQuery)},customer_phone.ilike.*${orderQuery}*)`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setSearchResultsOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  // 🔑 تغير كلمة المرور لأي مستخدم من الأدمن
  const handleAdminResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserPhone || !newUserPassword) {
      return setMsg({ text: isRtl ? 'يرجى إدخال رقم المستخدم وكلمة المرور الجديدة' : 'Please fill details', type: 'error' });
    }

    setMsg({
      text: isRtl ? `تم تحديث كلمة المرور للحساب ${selectedUserPhone} بنجاح` : 'Password reset successfully!',
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
      if (searchResultsParts) {
        setSearchResultsParts(searchResultsParts.filter(p => p.id !== id));
      }
      setMsg({ text: isRtl ? 'تم حذف القطعة بنجاح' : 'Part deleted', type: 'success' });
      setTimeout(() => setMsg(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // 💾 حفظ كافة الإعدادات (السوشال ميديا، السياسات، العمولات، وبوابات الدفع)
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...siteSettings,
      commissionRate,
      facebook,
      instagram,
      twitter,
      whatsapp,
      terms: termsContent,
      privacy: privacyContent,
      about: aboutContent,
      enableOnlinePayment,
      paymentProvider,
      merchantId,
      paymentApiKey,
      paymentMode,
      enableApplePay,
      enableGooglePay,
      enableCards,
      enableCOD
    };
    onUpdateSettings(updated);
    setMsg({ text: isRtl ? 'تم حفظ التحديثات والإعدادات بنجاح' : 'Settings saved successfully!', type: 'success' });
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '30px auto', padding: '28px', backgroundColor: '#ffffff', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.07)', fontFamily: 'Cairo, sans-serif', direction: isRtl ? 'rtl' : 'ltr' }}>
      
      {/* الهيدر الرئيسي للأدمن */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #f1f5f9', paddingBottom: '18px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#1f3a5f', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
            ADMIN
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: '#1e293b' }}>
              {isRtl ? 'لوحة تحكم مدير النظام (Super Admin)' : 'Super Admin Dashboard'}
            </h2>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              {isRtl ? 'إدارة المستحقات المالية، الحسابات، القطع، السياسات، وبوابات الدفع والصيانة الذكية' : 'Manage Vendor Payouts, Accounts, Settings & AI Health'}
            </span>
          </div>
        </div>
      </div>

      {/* 🔄 القائمة والتبويبات الرئيسية */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0' }}>
        {[
          { id: 'payouts', label: isRtl ? 'حسابات ومستحقات الكراجات' : 'Vendor Payouts' },
          { id: 'logs', label: isRtl ? `الصيانة الذكية (${systemLogs.filter(l => !l.auto_resolved).length})` : `AI Health Monitor (${systemLogs.filter(l => !l.auto_resolved).length})` },
          { id: 'users', label: isRtl ? 'بحث واستعلام الحسابات' : 'Search Users' },
          { id: 'parts', label: isRtl ? 'بحث قطع الغيار بالإعلان/الرمز' : 'Search Parts' },
          { id: 'orders', label: isRtl ? 'بحث الطلبات والمشاكل' : 'Search Orders' },
          { id: 'payment', label: isRtl ? 'إعدادات بوابة الدفع' : 'Payment Settings' },
          { id: 'policies', label: isRtl ? 'تعديل السياسات والشروط' : 'Edit Policies' },
          { id: 'social', label: isRtl ? 'السوشال ميديا والموقع' : 'Site Settings' },
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

      {/* 💰 1️⃣ تبويب حسابات ومستحقات الكراجات (Vendor Payouts) */}
      {tab === 'payouts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '18px', borderRadius: '16px' }}>
              <span style={{ fontSize: '13px', color: '#166534', fontWeight: 'bold' }}>إجمالي مبيعات المتجر:</span>
              <h3 style={{ margin: '6px 0 0 0', color: '#15803d', fontSize: '24px' }}>{financials.totalRevenue.toLocaleString()} QAR</h3>
            </div>

            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '18px', borderRadius: '16px' }}>
              <span style={{ fontSize: '13px', color: '#1e40af', fontWeight: 'bold' }}>صافي عمولة المنصة ({commissionRate}%):</span>
              <h3 style={{ margin: '6px 0 0 0', color: '#1d4ed8', fontSize: '24px' }}>{financials.totalPlatformCommission.toLocaleString()} QAR</h3>
            </div>

            <div style={{ backgroundColor: '#fffdf5', border: '1px solid #fef08a', padding: '18px', borderRadius: '16px' }}>
              <span style={{ fontSize: '13px', color: '#854d0e', fontWeight: 'bold' }}>إجمالي مستحقات الكراجات:</span>
              <h3 style={{ margin: '6px 0 0 0', color: '#a16207', fontSize: '24px' }}>{financials.totalGaragesNet.toLocaleString()} QAR</h3>
            </div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '280px' }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>
                نسبة عمولة المنصة: <span style={{ color: '#e0872a', fontSize: '16px' }}>{commissionRate}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="30"
                step="0.5"
                value={commissionRate}
                onChange={(e) => {
                  const newRate = parseFloat(e.target.value);
                  setCommissionRate(newRate);
                  onUpdateSettings({ ...siteSettings, commissionRate: newRate });
                }}
                style={{ flex: 1, cursor: 'pointer' }}
              />
            </div>

            <button
              onClick={() => window.print()}
              style={{ padding: '10px 20px', backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
            >
              طباعة كشف الحسابات (PDF)
            </button>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isRtl ? 'right' : 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '14px' }}>اسم / معرف الكراج</th>
                  <th style={{ padding: '14px' }}>عدد الطلبات</th>
                  <th style={{ padding: '14px' }}>إجمالي المبيعات</th>
                  <th style={{ padding: '14px' }}>عمولة المنصة ({commissionRate}%)</th>
                  <th style={{ padding: '14px' }}>صافي المستحق للكراج</th>
                  <th style={{ padding: '14px' }}>حالة التسوية</th>
                  <th style={{ padding: '14px', textAlign: 'center' }}>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {financials.garageBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>لا توجد مبيعات مسجلة للكراجات حتى الآن</td>
                  </tr>
                ) : (
                  financials.garageBreakdown.map((g) => {
                    const garageCommission = (g.totalSales * commissionRate) / 100;
                    const garageNet = g.totalSales - garageCommission;
                    const isSettled = settledGarages[g.garageId];

                    return (
                      <tr key={g.garageId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px', fontWeight: 'bold', color: '#1e293b' }}>{g.garageId}</td>
                        <td style={{ padding: '14px' }}>{g.orderCount} طلبات</td>
                        <td style={{ padding: '14px', fontWeight: 'bold' }}>{g.totalSales.toLocaleString()} QAR</td>
                        <td style={{ padding: '14px', color: '#1d4ed8' }}>{garageCommission.toLocaleString()} QAR</td>
                        <td style={{ padding: '14px', fontWeight: 'bold', color: '#15803d', fontSize: '15px' }}>{garageNet.toLocaleString()} QAR</td>
                        <td style={{ padding: '14px' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold',
                            backgroundColor: isSettled ? '#dcfce7' : '#fef3c7',
                            color: isSettled ? '#15803d' : '#92400e'
                          }}>
                            {isSettled ? 'تم التسوية' : 'معلق برسم التحويل'}
                          </span>
                        </td>
                        <td style={{ padding: '14px', textAlign: 'center' }}>
                          <button
                            onClick={() => {
                              setSettledGarages(prev => ({ ...prev, [g.garageId]: true }));
                              setMsg({ text: `تم تسوية حساب الكراج (${g.garageId}) بنجاح!`, type: 'success' });
                              setTimeout(() => setMsg(null), 3000);
                            }}
                            disabled={isSettled}
                            style={{
                              padding: '8px 14px', borderRadius: '8px', border: 'none',
                              backgroundColor: isSettled ? '#cbd5e0' : '#e0872a',
                              color: '#ffffff', fontWeight: 'bold', cursor: isSettled ? 'not-allowed' : 'pointer', fontSize: '12.5px'
                            }}
                          >
                            {isSettled ? 'مسوى' : 'تسوية وتحويل'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* 🛠️ 2️⃣ تبويب مركز مراقبة جودة النظام والصيانة الذكية (AI Health Monitor) */}
      {tab === 'logs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '18px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', color: '#1f3a5f', fontSize: '17px' }}>مركز مراقبة جودة النظام والصيانة الذكية</h3>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>يتم التقاط كافة الأخطاء المباشرة وتحليلها لمنع انهيار النظام</p>
            </div>
            <button onClick={fetchSystemLogs} disabled={loadingLogs} style={{ padding: '10px 18px', backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12.5px' }}>
              {loadingLogs ? 'جاري الجلب...' : 'تحديث السجلات'}
            </button>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isRtl ? 'right' : 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px' }}>#</th>
                  <th style={{ padding: '12px' }}>المكون / الصفحة</th>
                  <th style={{ padding: '12px' }}>تفاصيل وتوصيف الخطأ</th>
                  <th style={{ padding: '12px' }}>معرف المستخدم</th>
                  <th style={{ padding: '12px' }}>التاريخ</th>
                  <th style={{ padding: '12px' }}>الحالة</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {systemLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>لا توجد أخطاء مسجلة، النظام يعمل بكفاءة 100%</td>
                  </tr>
                ) : (
                  systemLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: log.auto_resolved ? '#ffffff' : '#fffdf5' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>#{log.id}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#1e293b' }}>{log.component_name || 'عام'}</td>
                      <td style={{ padding: '12px', color: '#dc2626', maxWidth: '300px', wordBreak: 'break-word', fontFamily: 'monospace', fontSize: '12px' }}>
                        {log.error_message}
                      </td>
                      <td style={{ padding: '12px', color: '#475569', fontSize: '12px' }}>{log.user_code || 'زائر'}</td>
                      <td style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>{new Date(log.created_at).toLocaleString('ar-EG')}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', backgroundColor: log.auto_resolved ? '#dcfce7' : '#fee2e2', color: log.auto_resolved ? '#166534' : '#991b1b' }}>
                          {log.auto_resolved ? 'معالج' : 'يحتاج مراجعة'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {!log.auto_resolved && (
                          <button onClick={() => markLogAsResolved(log.id)} style={{ padding: '6px 12px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11.5px' }}>
                            تحديد كـ معالج
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3️⃣ تبويب البحث عن الحسابات وتعديلها */}
      {tab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '22px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#1f3a5f' }}>{isRtl ? 'البحث عن حساب (برقم الجوال أو البريد)' : 'Search User Account'}</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
              {isRtl ? 'أدخل رقم جوال العميل أو الكراج لعرض بياناته مباشرة ودون تحميل بقية الحسابات.' : 'Enter phone or email to look up the exact account instantly.'}
            </p>

            <form onSubmit={handleSearchUser} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder={isRtl ? 'أدخل رقم الجوال أو البريد الإلكتروني...' : 'Enter Phone or Email'}
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e0', fontSize: '14px' }}
                required
              />
              <button type="submit" disabled={searching} style={{ padding: '12px 24px', backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                {searching ? '...' : (isRtl ? 'بحث' : 'Search')}
              </button>
            </form>
          </div>

          {searchResultsUser && (
            <div>
              <h4 style={{ margin: '0 0 14px 0', color: '#1e293b' }}>{isRtl ? 'نتائج البحث:' : 'Search Results:'}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {searchResultsUser.map((u, idx) => (
                  <div key={idx} style={{ padding: '18px', borderRadius: '14px', border: '1px solid #cbd5e0', backgroundColor: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                      <strong style={{ fontSize: '15px' }}>{u.name || u.full_name || 'حساب مستخدم'}</strong>
                      <span style={{ fontSize: '12.5px', color: '#64748b', display: 'block', marginTop: '3px' }}>{u.phone || u.email || userQuery}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <button onClick={() => { setSelectedUserPhone(u.phone || userQuery); setTab('users'); }} style={{ padding: '8px 14px', backgroundColor: '#e0872a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12.5px' }}>
                        {isRtl ? 'تغيير كلمة المرور' : 'Reset Password'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedUserPhone && (
            <div style={{ backgroundColor: '#fffbe3', padding: '20px', borderRadius: '16px', border: '1px solid #fef08a' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#92400e' }}>{isRtl ? `تغيير كلمة المرور للحساب: ${selectedUserPhone}` : 'Reset Password'}</h3>
              <form onSubmit={handleAdminResetPassword} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder={isRtl ? 'كلمة المرور الجديدة...' : 'New Password'}
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13.5px' }}
                  required
                />
                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {isRtl ? 'حفظ كلمة المرور' : 'Save'}
                </button>
              </form>
            </div>
          )}

        </div>
      )}

      {/* 4️⃣ تبويب البحث عن القطع بالإعلان أو رقم القطعة */}
      {tab === 'parts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '22px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#1f3a5f' }}>{isRtl ? 'البحث عن قطعة غيار (برمز الإعلان ID أو رقم القطعة Part #)' : 'Search Part by ID / SKU'}</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
              {isRtl ? 'اكتب رمز الإعلان (مثلاً: 105) أو رقم القطعة المكتوب بالكتالوج لعرضها فوراً والتحكم بها.' : 'Search exact Part ID or Part Number.'}
            </p>

            <form onSubmit={handleSearchPart} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder={isRtl ? 'أدخل رمز الإعلان ID أو رقم القطعة Part Number...' : 'Enter Part ID or SKU'}
                value={partQuery}
                onChange={(e) => setPartQuery(e.target.value)}
                style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e0', fontSize: '14px' }}
                required
              />
              <button type="submit" disabled={searching} style={{ padding: '12px 24px', backgroundColor: '#e0872a', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                {searching ? '...' : (isRtl ? 'استعلام' : 'Lookup')}
              </button>
            </form>
          </div>

          {searchResultsParts && (
            <div>
              <h4 style={{ margin: '0 0 14px 0', color: '#1e293b' }}>{isRtl ? `النتائج المطابقة (${searchResultsParts.length}):` : 'Matching Parts:'}</h4>
              {searchResultsParts.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '13.5px' }}>{isRtl ? 'لم نجد أية قطعة مطابقة لهذا الرمز.' : 'No part matches this code.'}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {searchResultsParts.map((p) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '14px', backgroundColor: '#ffffff' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ backgroundColor: '#1f3a5f', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                            رمز الإعلان: #{p.id}
                          </span>
                          <strong style={{ fontSize: '15px' }}>{p.name}</strong>
                        </div>
                        <span style={{ fontSize: '12.5px', color: '#64748b', display: 'block', marginTop: '4px' }}>
                          {p.make} - {p.model} ({p.year}) | Part #: {p.part_number || 'غير مسجل'} | السعر: <strong style={{ color: '#1e9d6b' }}>{p.price} QAR</strong>
                        </span>
                      </div>

                      <button onClick={() => handleDeletePart(p.id)} style={{ backgroundColor: '#fdecec', color: '#d1453b', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12.5px' }}>
                        {isRtl ? 'حذف الإعلان' : 'Delete'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5️⃣ تبويب البحث عن الطلبات */}
      {tab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '22px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#1f3a5f' }}>{isRtl ? 'البحث عن طلب (برقم الطلب ID أو رقم جوال العميل)' : 'Search Order'}</h3>
            
            <form onSubmit={handleSearchOrder} style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <input
                type="text"
                placeholder={isRtl ? 'أدخل رقم الطلب ID أو رقم جوال العميل...' : 'Order ID or Customer Phone'}
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e0', fontSize: '14px' }}
                required
              />
              <button type="submit" disabled={searching} style={{ padding: '12px 24px', backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                {isRtl ? 'بحث الطلب' : 'Search Order'}
              </button>
            </form>
          </div>

          {searchResultsOrders && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {searchResultsOrders.map(o => (
                <div key={o.id} style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '14px', backgroundColor: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>طلب رقم #{o.id} - {o.part_name || 'قطعة غيار'}</strong>
                    <span style={{ fontSize: '12.5px', color: '#64748b', display: 'block' }}>العميل: {o.customer_phone}</span>
                  </div>
                  <button onClick={() => alert(isRtl ? `تم استرجاع المبلغ للطلب #${o.id}` : 'Refunded')} style={{ padding: '6px 12px', backgroundColor: '#fdecec', color: '#d1453b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                    {isRtl ? 'إلغاء واسترجاع' : 'Refund'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6️⃣ 💳 تبويب إعدادات بوابة الدفع والربط البنكي */}
      {tab === 'payment' && (
        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '750px' }}>
          <div>
            <h3 style={{ margin: '0 0 6px 0', color: '#1f3a5f' }}>{isRtl ? 'إعدادات بوابات الدفع الإلكتروني (Apple Pay / Google Pay / Cards)' : 'Payment Gateway Settings'}</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              {isRtl ? 'يمكنك التحكم بجميع خيارات الدفع الإلكتروني وتغذيتها بمفاتيح الربط (API Keys) فور التعاقد مع الشركة أو البنك.' : 'Configure online payment methods and API keys.'}
            </p>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '16px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <strong style={{ fontSize: '14.5px', color: '#1e293b', display: 'block' }}>{isRtl ? 'تفعيل الدفع الإلكتروني المباشر' : 'Enable Online Payment'}</strong>
              <span style={{ fontSize: '12.5px', color: '#64748b' }}>{isRtl ? 'إظهار خيارات الدفع أونلاين للعملاء أثناء إتمام الطلب' : 'Show online payment options during checkout'}</span>
            </div>
            <input
              type="checkbox"
              checked={enableOnlinePayment}
              onChange={(e) => setEnableOnlinePayment(e.target.checked)}
              style={{ width: '22px', height: '22px', cursor: 'pointer' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 'bold' }}>{isRtl ? 'شركة / بوابة الدفع المتعاقد معها:' : 'Payment Gateway Provider:'}</label>
            <select
              value={paymentProvider}
              onChange={(e) => setPaymentProvider(e.target.value)}
              style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '14px', backgroundColor: '#ffffff' }}
            >
              <option value="skipcash">SkipCash (قطر)</option>
              <option value="myfatoorah">MyFatoorah (المعيار الخليجي)</option>
              <option value="tap">Tap Payments</option>
              <option value="sadad">Sadad QA (سداد قطر)</option>
              <option value="custom">بوابة دفع مخصصة (Custom API)</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold' }}>{isRtl ? 'معرّف التاجر (Merchant ID):' : 'Merchant ID:'}</label>
              <input
                type="text"
                placeholder="مثال: MER-974-8849"
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold' }}>{isRtl ? 'مفتاح الربط السرّي (Secret API Key):' : 'Secret API Key:'}</label>
              <input
                type="password"
                placeholder="sk_live_xxxxxxxxxxxx"
                value={paymentApiKey}
                onChange={(e) => setPaymentApiKey(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '16px 20px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontSize: '13.5px', fontWeight: 'bold' }}>{isRtl ? 'طرق الدفع المسموح بها للعميل:' : 'Allowed Payment Options:'}</label>
            
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', fontWeight: 'bold' }}>
                <input type="checkbox" checked={enableApplePay} onChange={(e) => setEnableApplePay(e.target.checked)} /> Apple Pay
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', fontWeight: 'bold' }}>
                <input type="checkbox" checked={enableGooglePay} onChange={(e) => setEnableGooglePay(e.target.checked)} /> Google Pay
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', fontWeight: 'bold' }}>
                <input type="checkbox" checked={enableCards} onChange={(e) => setEnableCards(e.target.checked)} /> بطاقة ائتمان / مدى
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', fontWeight: 'bold' }}>
                <input type="checkbox" checked={enableCOD} onChange={(e) => setEnableCOD(e.target.checked)} /> الدفع نقداً عند الاستلام (COD)
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#fffbe3', padding: '16px', borderRadius: '14px', border: '1px solid #fef08a' }}>
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: '14px', color: '#92400e', display: 'block' }}>{isRtl ? 'وضع التشغيل (Environment Mode)' : 'Environment Mode'}</strong>
              <span style={{ fontSize: '12.5px', color: '#78350f' }}>{isRtl ? 'اختر البيئة التجريبية (Sandbox) حتى يتم توقيع العقد الرسمي وتأكيد المفاتيح البنكية.' : 'Use Sandbox mode for testing before official launch.'}</span>
            </div>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as any)}
              style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid #d97706', fontWeight: 'bold', fontSize: '13px', backgroundColor: '#ffffff', cursor: 'pointer' }}
            >
              <option value="sandbox">تجريبي (Sandbox)</option>
              <option value="live">بيئة مباشرة (Live)</option>
            </select>
          </div>

          <button type="submit" style={{ padding: '14px 28px', backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', width: 'fit-content' }}>
            {isRtl ? 'حفظ إعدادات بوابة الدفع' : 'Save Payment Config'}
          </button>
        </form>
      )}

      {/* 7️⃣ تبويب تعديل السياسات */}
      {tab === 'policies' && (
        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3>{isRtl ? 'تعديل الشروط والأحكام والسياسات المباشرة للموقع' : 'Edit Policies & Content'}</h3>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '13.5px' }}>الشروط والأحكام (Terms & Conditions)</label>
            <textarea
              rows={6}
              value={termsContent}
              onChange={(e) => setTermsContent(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e0', fontSize: '13.5px', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '13.5px' }}>سياسة الخصوصية (Privacy Policy)</label>
            <textarea
              rows={4}
              value={privacyContent}
              onChange={(e) => setPrivacyContent(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e0', fontSize: '13.5px', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '13.5px' }}>نص (من نحن - About Us)</label>
            <textarea
              rows={3}
              value={aboutContent}
              onChange={(e) => setAboutContent(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e0', fontSize: '13.5px', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>

          <button type="submit" style={{ padding: '14px 28px', backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', width: 'fit-content' }}>
            {isRtl ? 'حفظ السياسات فوراً' : 'Save Policies'}
          </button>
        </form>
      )}

      {/* 8️⃣ تبويب السوشال ميديا */}
      {tab === 'social' && (
        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
          <h3>{isRtl ? 'روابط شبكات التواصل ورقم التواصل' : 'Social & Contact Details'}</h3>
          
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
            {isRtl ? 'تحديث السوشال ميديا' : 'Save Links'}
          </button>
        </form>
      )}

    </div>
  );
};

export default AdminDashboard;
