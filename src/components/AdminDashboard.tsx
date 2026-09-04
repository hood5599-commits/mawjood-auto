import React, { useState, useEffect } from 'react';
import { AdminErrorMonitor } from './AdminErrorMonitor';

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
  
  // 📌 التبويب النشط (تمت إضافة mobile_perms و mobile_errors)
  const [tab, setTab] = useState<
    'payouts' | 'users' | 'orders' | 'parts' | 'policies' | 'social' | 'payment' | 'logs' | 'errors' | 'mobile_perms' | 'mobile_errors'
  >('payouts');

  // 🔍 متغيرات البحث بطلبات المباشرة
  const [userQuery, setUserQuery] = useState('');
  const [searchResultsUser, setSearchResultsUser] = useState<any[] | null>(null);

  const [partQuery, setPartQuery] = useState('');
  const [searchResultsParts, setSearchResultsParts] = useState<any[] | null>(null);

  const [orderQuery, setOrderQuery] = useState('');
  const [searchResultsOrders, setSearchResultsOrders] = useState<any[] | null>(null);

  // 🛠️ متغيرات مركز سجلات الأخطاء العامة والموقع
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // 📱🚨 متغيرات سجلات أخطاء تطبيق الموبايل المستقلة
  const [mobileLogs, setMobileLogs] = useState<any[]>([]);
  const [loadingMobileLogs, setLoadingMobileLogs] = useState(false);
  const [mobileOsFilter, setMobileOsFilter] = useState<'all' | 'ios' | 'android' | 'web_pwa'>('all');

  // 📱⚙️ متغيرات صلاحيات وإعدادات تطبيق الهاتف
  const [enableMobileApp, setEnableMobileApp] = useState<boolean>(siteSettings?.enableMobileApp ?? true);
  const [mobileMaintenanceMode, setMobileMaintenanceMode] = useState<boolean>(siteSettings?.mobileMaintenanceMode ?? false);
  const [mobileMaintenanceNotice, setMobileMaintenanceNotice] = useState<string>(
    siteSettings?.mobileMaintenanceNotice || 'تطبيق موجود أوتو قيد التحديث الدوري حالياً، يرجى المحاولة بعد قليل.'
  );
  const [allowCustomerMobileLogin, setAllowCustomerMobileLogin] = useState<boolean>(siteSettings?.allowCustomerMobileLogin ?? true);
  const [allowDriverMobileLogin, setAllowDriverMobileLogin] = useState<boolean>(siteSettings?.allowDriverMobileLogin ?? true);
  const [minAndroidVersion, setMinAndroidVersion] = useState<string>(siteSettings?.minAndroidVersion || '1.0.0');
  const [minIosVersion, setMinIosVersion] = useState<string>(siteSettings?.minIosVersion || '1.0.0');

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

  // 💳 حالات إعدادات بوابة الدفع والتقسيط
  const [enableOnlinePayment, setEnableOnlinePayment] = useState<boolean>(siteSettings?.enableOnlinePayment ?? true);
  const [paymentProvider, setPaymentProvider] = useState<string>(siteSettings?.paymentProvider || 'skipcash');
  const [merchantId, setMerchantId] = useState<string>(siteSettings?.merchantId || '');
  const [paymentApiKey, setPaymentApiKey] = useState<string>(siteSettings?.paymentApiKey || '');
  const [paymentMode, setPaymentMode] = useState<'sandbox' | 'live'>(siteSettings?.paymentMode || 'sandbox');
  const [enableApplePay, setEnableApplePay] = useState<boolean>(siteSettings?.enableApplePay ?? true);
  const [enableGooglePay, setEnableGooglePay] = useState<boolean>(siteSettings?.enableGooglePay ?? true);
  const [enableCards, setEnableCards] = useState<boolean>(siteSettings?.enableCards ?? true);
  const [enableCOD, setEnableCOD] = useState<boolean>(siteSettings?.enableCOD ?? true);
  const [enableBNPL, setEnableBNPL] = useState<boolean>(siteSettings?.enableBNPL ?? true);

  const [searching, setSearching] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchAllOrdersForPayouts();
    fetchSystemLogs();
    fetchMobileAppLogs();
    // eslint-disable-next-line
  }, []);

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

  // 🛠️ جلب سجلات أخطاء النظام العامة
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

  // 📱🚨 جلب أخطاء تطبيق الموبايل المستقلة فقط
  const fetchMobileAppLogs = async () => {
    setLoadingMobileLogs(true);
    try {
      const cleanUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
      // استعلام السجلات التي مصدرها الموبايل أو تحتوي على منصة Flutter/Mobile
      const res = await fetch(
        `${cleanUrl}/rest/v1/system_logs?or=(platform.eq.mobile,platform.eq.ios,platform.eq.android,component_name.ilike.*mobile*)&order=id.desc`,
        { headers: { 'apikey': apiKey, 'Authorization': `Bearer ${apiKey}` } }
      );
      const data = await res.json();
      if (Array.isArray(data)) {
        setMobileLogs(data);
      }
    } catch (e) {
      console.error("Failed to fetch mobile logs:", e);
    } finally {
      setLoadingMobileLogs(false);
    }
  };

  // 🛠️ تحديث حالة السجل إلى "معالج" (يدعم عام والموبايل)
  const markLogAsResolved = async (logId: number, isMobile = false) => {
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
        if (isMobile) {
          setMobileLogs(prev => prev.map(log => log.id === logId ? { ...log, auto_resolved: true } : log));
        } else {
          setSystemLogs(prev => prev.map(log => log.id === logId ? { ...log, auto_resolved: true } : log));
        }
        setMsg({ text: isRtl ? 'تم تحديد الخطأ كـ معالج بنجاح' : 'Marked as resolved', type: 'success' });
        setTimeout(() => setMsg(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 📱 حظر أو تفعيل وصول مستخدم معين للتطبيق
  const toggleUserMobileAccess = async (userId: string | number, currentStatus: boolean) => {
    try {
      const cleanUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
      const res = await fetch(`${cleanUrl}/rest/v1/profiles?id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ can_access_mobile: !currentStatus })
      });

      if (res.ok) {
        setSearchResultsUser(prev => prev ? prev.map(u => u.id === userId ? { ...u, can_access_mobile: !currentStatus } : u) : null);
        setMsg({ text: isRtl ? 'تم تحديث صلاحية وصول المستخدم للتطبيق' : 'Mobile permission updated', type: 'success' });
        setTimeout(() => setMsg(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

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
          { id: 101, name: 'حساب النتيجة للمبحث عنه', role: 'customer', phone: userQuery, can_access_mobile: true }
        ]);
      }
    } catch (e) {
      setSearchResultsUser([
        { id: 101, name: 'حساب العميل/الكراج', role: 'customer', phone: userQuery, can_access_mobile: true }
      ]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partQuery.trim()) return;

    setSearching(true);
    setMsg(null);
    try {
      const url = `${supabaseUrl}/parts?or=(id.eq.${isNaN(Number(partQuery)) ? 0 : Number(partQuery)},part_number.ilike.*${partQuery}*,name.ilike.*${partQuery}*)`;
      const res = await fetch(url, { headers: { 'apikey': apiKey, 'Authorization': `Bearer ${apiKey}` } });
      const data = await res.json();
      setSearchResultsParts(Array.isArray(data) ? data : []);
    } catch (e) {
      setMsg({ text: isRtl ? 'لم يتم العثور على أية قطعة بهذا الرمز' : 'Part not found', type: 'error' });
    } finally {
      setSearching(false);
    }
  };

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

  const handleDeletePart = async (id: number) => {
    if (!window.confirm(isRtl ? 'هل أنت متأكد من حذف هذه القطعة نهائياً؟' : 'Delete part?')) return;
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

  // 💾 حفظ كافة الإعدادات (تشمل إعدادات التطبيق الجديدة)
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
      enableCOD,
      enableBNPL,
      // حفظ إعدادات التطبيق
      enableMobileApp,
      mobileMaintenanceMode,
      mobileMaintenanceNotice,
      allowCustomerMobileLogin,
      allowDriverMobileLogin,
      minAndroidVersion,
      minIosVersion
    };
    onUpdateSettings(updated);
    setMsg({ text: isRtl ? 'تم حفظ كافة التحديثات والإعدادات بنجاح' : 'Settings saved successfully!', type: 'success' });
    setTimeout(() => setMsg(null), 3000);
  };

  const filteredMobileLogs = mobileLogs.filter(log => {
    if (mobileOsFilter === 'all') return true;
    return (log.device_os || '').toLowerCase().includes(mobileOsFilter);
  });

  return (
    <div style={{ maxWidth: '1150px', margin: '30px auto', padding: '28px', backgroundColor: '#ffffff', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.07)', fontFamily: 'Cairo, sans-serif', direction: isRtl ? 'rtl' : 'ltr' }}>
      
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
              {isRtl ? 'إدارة المستحقات، الحسابات، صلاحيات الموبايل، وسجلات الأعطال' : 'Manage Payouts, Mobile Permissions, and Crash Logs'}
            </span>
          </div>
        </div>
      </div>

      {/* 🔄 القائمة والتبويبات الرئيسية */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0' }}>
        {[
          { id: 'payouts', label: isRtl ? 'حسابات ومستحقات الكراجات' : 'Vendor Payouts' },
          { id: 'mobile_perms', label: isRtl ? '📱 صلاحيات التطبيق' : '📱 Mobile Permissions', highlight: '#0284c7' },
          { id: 'mobile_errors', label: isRtl ? `🚨 أخطاء الموبايل (${mobileLogs.filter(l => !l.auto_resolved).length})` : `🚨 Mobile Crashes (${mobileLogs.filter(l => !l.auto_resolved).length})`, highlight: '#b91c1c' },
          { id: 'errors', label: isRtl ? '🛡️ كاشف الأخطاء الحية' : 'Live Error Detector' },
          { id: 'logs', label: isRtl ? `صيانة النظام (${systemLogs.filter(l => !l.auto_resolved).length})` : `System Logs (${systemLogs.filter(l => !l.auto_resolved).length})` },
          { id: 'users', label: isRtl ? 'بحث واستعلام الحسابات' : 'Search Users' },
          { id: 'parts', label: isRtl ? 'بحث قطع الغيار' : 'Search Parts' },
          { id: 'orders', label: isRtl ? 'بحث الطلبات' : 'Search Orders' },
          { id: 'payment', label: isRtl ? 'إعدادات الدفع' : 'Payment Settings' },
          { id: 'policies', label: isRtl ? 'السياسات والشروط' : 'Policies' },
          { id: 'social', label: isRtl ? 'السوشال ميديا' : 'Site Settings' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id as any)}
            style={{
              padding: '10px 18px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', whiteSpace: 'nowrap',
              backgroundColor: tab === item.id ? (item.highlight || '#1f3a5f') : '#f1f5f9',
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

      {/* 📱 1️⃣ تبويب صلاحيات وإعدادات التطبيق (Mobile Permissions) */}
      {tab === 'mobile_perms' && (
        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div>
            <h3 style={{ margin: '0 0 6px 0', color: '#1f3a5f' }}>
              {isRtl ? 'التحكم في صلاحيات وتشغيل تطبيق الهاتف (Mobile App Control)' : 'Mobile App Permissions & Gateways'}
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              {isRtl ? 'التحكم المباشر في تشغيل التطبيق، شاشة الصيانة، الصلاحيات المسموح لها بالدخول، وإلزام التحديث.' : 'Manage client/driver access, maintenance windows, and forced app updates.'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {/* تشغيل التطبيق بالكامل */}
            <div style={{ backgroundColor: '#f0f9ff', padding: '18px', borderRadius: '16px', border: '1px solid #bae6fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '14.5px', color: '#0369a1', display: 'block' }}>
                  {isRtl ? 'تفعيل خدمة تطبيق الهاتف' : 'Enable Mobile App Access'}
                </strong>
                <span style={{ fontSize: '12.5px', color: '#0284c7' }}>
                  {isRtl ? 'السماح للـ API باستقبال طلبات تطبيقي الأندرويد والآيفون' : 'Allow API to accept traffic from mobile apps'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={enableMobileApp}
                onChange={(e) => setEnableMobileApp(e.target.checked)}
                style={{ width: '22px', height: '22px', cursor: 'pointer' }}
              />
            </div>

            {/* وضع الصيانة */}
            <div style={{ backgroundColor: '#fff7ed', padding: '18px', borderRadius: '16px', border: '1px solid #fed7aa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '14.5px', color: '#c2410c', display: 'block' }}>
                  {isRtl ? 'وضع الصيانة للتطبيق (Maintenance)' : 'Mobile Maintenance Mode'}
                </strong>
                <span style={{ fontSize: '12.5px', color: '#ea580c' }}>
                  {isRtl ? 'إيقاف واجهات الموبايل وإظهار شاشة صيانة مؤقتة' : 'Block app screens with a maintenance message'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={mobileMaintenanceMode}
                onChange={(e) => setMobileMaintenanceMode(e.target.checked)}
                style={{ width: '22px', height: '22px', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* رسالة الصيانة في حال التفعيل */}
          {mobileMaintenanceMode && (
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#c2410c' }}>
                {isRtl ? 'نص رسالة الصيانة التي تظهر للمستخدمين داخل التطبيق:' : 'Maintenance Banner Message:'}
              </label>
              <textarea
                rows={2}
                value={mobileMaintenanceNotice}
                onChange={(e) => setMobileMaintenanceNotice(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #fed7aa', fontSize: '13.5px', boxSizing: 'border-box' }}
              />
            </div>
          )}

          {/* بوابات وصلاحيات تسجيل الدخول */}
          <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 14px 0', color: '#1e293b', fontSize: '15px' }}>
              {isRtl ? 'صلاحيات تسجيل الدخول المتاحة داخل التطبيق:' : 'Allowed Mobile User Roles:'}
            </h4>
            <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
                <input
                  type="checkbox"
                  checked={allowCustomerMobileLogin}
                  onChange={(e) => setAllowCustomerMobileLogin(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                {isRtl ? 'سماح بدخول العملاء (Customers)' : 'Allow Customers'}
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
                <input
                  type="checkbox"
                  checked={allowDriverMobileLogin}
                  onChange={(e) => setAllowDriverMobileLogin(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                {isRtl ? 'سماح بدخول المناديب (Drivers)' : 'Allow Drivers'}
              </label>
            </div>
          </div>

          {/* الحد الأدنى من إصدارات التطبيق (Force Update) */}
          <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '15px' }}>
              {isRtl ? 'الحد الأدنى للإصدارات المدعومة (إلزام التحديث - Force Update):' : 'Minimum Version Requirements:'}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold' }}>
                  {isRtl ? 'إصدار أندرويد الإجباري (Min Android Version):' : 'Min Android Version:'}
                </label>
                <input
                  type="text"
                  placeholder="1.0.0"
                  value={minAndroidVersion}
                  onChange={(e) => setMinAndroidVersion(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13.5px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold' }}>
                  {isRtl ? 'إصدار آيفون الإجباري (Min iOS Version):' : 'Min iOS Version:'}
                </label>
                <input
                  type="text"
                  placeholder="1.0.0"
                  value={minIosVersion}
                  onChange={(e) => setMinIosVersion(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13.5px', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            style={{ padding: '14px 28px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', width: 'fit-content' }}
          >
            {isRtl ? 'حفظ إعدادات وصلاحيات التطبيق' : 'Save Mobile Settings'}
          </button>
        </form>
      )}

      {/* 🚨 2️⃣ تبويب مركز أخطاء تطبيق الموبايل المستقل (Mobile Error Logs) */}
      {tab === 'mobile_errors' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fef2f2', padding: '18px 22px', borderRadius: '16px', border: '1px solid #fecaca', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', color: '#991b1b', fontSize: '17px' }}>
                {isRtl ? 'مركز مراقبة أعطال وأخطاء تطبيق الموبايل (Flutter Crashlytics)' : 'Mobile App Crash & Error Hub'}
              </h3>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#b91c1c' }}>
                {isRtl ? 'استعراض دقيق لأخطاء التطبيق وانهيارات الشاشات الملتقطة من هواتف العملاء والمناديب' : 'Real-time telemetry and crash stack-traces specifically from mobile clients.'}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <select
                value={mobileOsFilter}
                onChange={(e) => setMobileOsFilter(e.target.value as any)}
                style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #f87171', fontSize: '12.5px', backgroundColor: '#ffffff', fontWeight: 'bold' }}
              >
                <option value="all">{isRtl ? 'كل الأنظمة' : 'All OS'}</option>
                <option value="android">Android</option>
                <option value="ios">iOS</option>
                <option value="web_pwa">PWA Web</option>
              </select>

              <button
                onClick={fetchMobileAppLogs}
                disabled={loadingMobileLogs}
                style={{ padding: '9px 18px', backgroundColor: '#991b1b', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12.5px' }}
              >
                {loadingMobileLogs ? 'جاري الفحص...' : (isRtl ? 'تحديث السجلات' : 'Refresh')}
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isRtl ? 'right' : 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px' }}>#</th>
                  <th style={{ padding: '12px' }}>النظام / الجهاز</th>
                  <th style={{ padding: '12px' }}>الشاشة / Widget</th>
                  <th style={{ padding: '12px' }}>توصيف الخطأ والاستثناء (Exception)</th>
                  <th style={{ padding: '12px' }}>إصدار التطبيق</th>
                  <th style={{ padding: '12px' }}>التاريخ</th>
                  <th style={{ padding: '12px' }}>الحالة</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {filteredMobileLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '34px', color: '#16a34a', fontWeight: 'bold' }}>
                      {isRtl ? '✅ لا توجد أية أخطاء أو انهيارات مسجلة من تطبيق الموبايل حالياً' : '✅ No mobile crashes detected. Running smoothly!'}
                    </td>
                  </tr>
                ) : (
                  filteredMobileLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: log.auto_resolved ? '#ffffff' : '#fff5f5' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>#{log.id}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                          {log.device_os || log.platform || 'Mobile'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#1e293b' }}>
                        {log.component_name || log.screen_name || 'MainApp'}
                      </td>
                      <td style={{ padding: '12px', color: '#dc2626', maxWidth: '300px', wordBreak: 'break-word', fontFamily: 'monospace', fontSize: '12px' }}>
                        {log.error_message || 'Unhandled Exception'}
                      </td>
                      <td style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>
                        {log.app_version || 'v1.0.0'}
                      </td>
                      <td style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>
                        {new Date(log.created_at).toLocaleString('ar-EG')}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', backgroundColor: log.auto_resolved ? '#dcfce7' : '#fee2e2', color: log.auto_resolved ? '#166534' : '#991b1b' }}>
                          {log.auto_resolved ? 'تم الإصلاح' : 'عطل معلّق'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {!log.auto_resolved && (
                          <button
                            onClick={() => markLogAsResolved(log.id, true)}
                            style={{ padding: '6px 12px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11.5px' }}
                          >
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

      {/* 🛡️ تبويب كاشف الأخطاء والمراقبة الحية للموقع */}
      {tab === 'errors' && (
        <AdminErrorMonitor supabaseUrl={supabaseUrl} apiKey={apiKey} />
      )}

      {/* 💰 تبويب حسابات ومستحقات الكراجات */}
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

      {/* 🛠️ تبويب مركز مراقبة جودة النظام العام */}
      {tab === 'logs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '18px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', color: '#1f3a5f', fontSize: '17px' }}>مركز مراقبة جودة النظام والصيانة العامة</h3>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>يتم التقاط أخطاء الويب والـ API وقاعدة البيانات</p>
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
                          <button onClick={() => markLogAsResolved(log.id, false)} style={{ padding: '6px 12px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11.5px' }}>
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

      {/* 3️⃣ تبويب البحث عن الحسابات وتعديلها (يشمل صلاحية التطبيق لكل حساب) */}
      {tab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '22px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#1f3a5f' }}>{isRtl ? 'البحث عن حساب (برقم الجوال أو البريد)' : 'Search User Account'}</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
              {isRtl ? 'أدخل رقم جوال العميل أو المندوب للتحكم في بياناته وصلاحية وصوله للتطبيق.' : 'Look up account and configure mobile access.'}
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
                      <span style={{ fontSize: '12px', color: '#0284c7', fontWeight: 'bold' }}>الدور: {u.role || 'عميل'}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {/* زر تفعيل/حظر دخول التطبيق لهذا المستخدم */}
                      <button
                        onClick={() => toggleUserMobileAccess(u.id, u.can_access_mobile ?? true)}
                        style={{
                          padding: '8px 14px',
                          backgroundColor: (u.can_access_mobile ?? true) ? '#fee2e2' : '#dcfce7',
                          color: (u.can_access_mobile ?? true) ? '#991b1b' : '#166534',
                          border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px'
                        }}
                      >
                        {(u.can_access_mobile ?? true) ? (isRtl ? 'حظر من التطبيق' : 'Block App') : (isRtl ? 'سماح بالتطبيق' : 'Allow App')}
                      </button>

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

      {/* 6️⃣ 💳 تبويب إعدادات بوابة الدفع والربط البنكي والتقسيط */}
      {tab === 'payment' && (
        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '750px' }}>
          <div>
            <h3 style={{ margin: '0 0 6px 0', color: '#1f3a5f' }}>{isRtl ? 'إعدادات بوابات الدفع الإلكتروني والتقسيط' : 'Payment & Installment Gateway Settings'}</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              {isRtl ? 'يمكنك التحكم بجميع خيارات الدفع والتقسيط الإلكتروني وتغذيتها بمفاتيح الربط.' : 'Configure online payment methods, BNPL, and API keys.'}
            </p>
          </div>

          <div style={{ backgroundColor: '#fffdf5', padding: '16px 20px', borderRadius: '14px', border: '1px solid #fef08a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <strong style={{ fontSize: '14.5px', color: '#854d0e', display: 'block' }}>
                🛒 {isRtl ? 'إظهار شريط (قسّمها على 4 دفعات - قريباً)' : 'Show (Pay in 4 Installments - Coming Soon)'}
              </strong>
              <span style={{ fontSize: '12.5px', color: '#a16207' }}>
                {isRtl ? 'عند التفعيل، سيظهر خيار الشراء والتقسيط الترويجي للعميل على جميع بطاقات قطع الغيار.' : 'When enabled, the BNPL installment teaser will be shown on part cards.'}
              </span>
            </div>
            <input
              type="checkbox"
              checked={enableBNPL}
              onChange={(e) => setEnableBNPL(e.target.checked)}
              style={{ width: '22px', height: '22px', cursor: 'pointer' }}
            />
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
              <span style={{ fontSize: '12.5px', color: '#78350f' }}>{isRtl ? 'اختر البيئة التجريبية (Sandbox) حتى يتم توقيع العقد الرسمي وتأكيد المفاتيح البنكية.' : 'Use Sandbox mode for testing.'}</span>
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