/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';

interface AdminErrorMonitorProps {
  supabaseUrl: string;
  apiKey: string;
}

export const AdminErrorMonitor: React.FC<AdminErrorMonitorProps> = ({ supabaseUrl, apiKey }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterPlatform, setFilterPlatform] = useState<'ALL' | 'MOBILE' | 'WEB' | 'IOS' | 'ANDROID'>('ALL');

  // 🛡️ تنظيف وتوحيد رابط Supabase لضمان دقة مسار REST API
  const cleanBaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const restUrl = `${cleanBaseUrl}/rest/v1`;

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line
  }, []);

  // 🔄 جلب الأخطاء من قاعدة البيانات
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${restUrl}/system_errors?order=id.desc&limit=150`, {
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Error fetching logs:", e);
    } finally {
      setLoading(false);
    }
  };

  // 📱 فحص وتحديد ما إذا كان السجل يخص تطبيق الموبايل أم الموقع
  const detectPlatform = (log: any): 'IOS' | 'ANDROID' | 'MOBILE' | 'WEB' => {
    const rawPlatform = String(log.platform || '').toUpperCase();
    const os = String(log.device_os || '').toUpperCase();
    const stack = String(log.stack_trace || '');
    const url = String(log.page_url || '').toLowerCase();
    const msg = String(log.message || '');

    if (rawPlatform.includes('IOS') || os.includes('IOS') || url.includes('ios')) return 'IOS';
    if (rawPlatform.includes('ANDROID') || os.includes('ANDROID') || url.includes('android')) return 'ANDROID';
    if (
      rawPlatform.includes('MOBILE') ||
      rawPlatform.includes('FLUTTER') ||
      Boolean(log.app_version) ||
      msg.includes('FlutterError') ||
      msg.includes('PlatformException') ||
      stack.includes('package:flutter')
    ) {
      return 'MOBILE';
    }
    return 'WEB';
  };

  // 🗑️ حذف سجل فردي محدد
  const deleteSingleLog = async (id: number) => {
    if (!window.confirm(`هل أنت متأكد من حذف السجل #${id}؟`)) return;
    try {
      const res = await fetch(`${restUrl}/system_errors?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`
        }
      });
      if (res.ok || res.status === 204) {
        setLogs(prev => prev.filter(l => l.id !== id));
      }
    } catch (e) {
      console.error("Delete Error:", e);
    }
  };

  // 🗑️ مسح السجلات (إما مسح الكل أو مسح أخطاء الموبايل فقط)
  const clearLogs = async (target: 'ALL' | 'MOBILE_ONLY' = 'ALL') => {
    const confirmMsg = target === 'MOBILE_ONLY'
      ? 'هل أنت متأكد من مسح جميع أخطاء تطبيق الموبايل فقط؟'
      : 'هل أنت متأكد من مسح جميع سجلات الأخطاء بالكامل بشكل نهائي؟';

    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    try {
      let deleteQuery = `${restUrl}/system_errors?id=gt.0`;
      if (target === 'MOBILE_ONLY') {
        deleteQuery = `${restUrl}/system_errors?or=(platform.ilike.*mobile*,platform.ilike.*ios*,platform.ilike.*android*)`;
      }

      const res = await fetch(deleteQuery, {
        method: 'DELETE',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        }
      });

      if (res.ok || res.status === 204) {
        alert(target === 'MOBILE_ONLY' ? '📱 تم مسح أخطاء الموبايل بنجاح!' : '🎉 تم مسح جميع السجلات بنجاح!');
        fetchLogs();
      } else {
        const errText = await res.text();
        console.error("Delete Error:", errText);
        alert('تعذر مسح السجلات، تأكد من صلاحيات قاعدة البيانات RLS');
        fetchLogs();
      }
    } catch (e) {
      console.error("Error clearing logs:", e);
      alert('خطأ في الاتصال أثناء مسح السجلات');
    } finally {
      setLoading(false);
    }
  };

  // 🔍 تطبيق الفلاتر (الخطورة + المنصة)
  const filteredLogs = logs.filter(log => {
    const matchesSeverity = filterSeverity === 'ALL' || log.severity === filterSeverity;
    const plat = detectPlatform(log);

    let matchesPlatform = true;
    if (filterPlatform === 'MOBILE') {
      matchesPlatform = plat === 'MOBILE' || plat === 'IOS' || plat === 'ANDROID';
    } else if (filterPlatform === 'IOS') {
      matchesPlatform = plat === 'IOS';
    } else if (filterPlatform === 'ANDROID') {
      matchesPlatform = plat === 'ANDROID';
    } else if (filterPlatform === 'WEB') {
      matchesPlatform = plat === 'WEB';
    }

    return matchesSeverity && matchesPlatform;
  });

  const mobileErrorsCount = logs.filter(l => {
    const p = detectPlatform(l);
    return p === 'MOBILE' || p === 'IOS' || p === 'ANDROID';
  }).length;

  const webErrorsCount = logs.filter(l => detectPlatform(l) === 'WEB').length;

  return (
    <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
      
      {/* 🏷️ الهيدر وأزرار التحديث والمسح */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', color: '#1f3a5f', fontSize: '18px', fontWeight: 'bold' }}>
            🛡️ كاشف الأخطاء الشامل والمراقبة الحية ({filteredLogs.length} / {logs.length})
          </h3>
          <span style={{ fontSize: '12.5px', color: '#64748b' }}>
            مراقبة مستقلة لانهيارات تطبيق الهواتف (Flutter) وأعطال الويب وانقطاعات الـ API
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select 
            value={filterSeverity} 
            onChange={(e) => setFilterSeverity(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#f8fafc' }}
          >
            <option value="ALL">جميع مستويات الخطورة</option>
            <option value="CRITICAL">🔴 خطيرة (CRITICAL)</option>
            <option value="HIGH">🟠 عالية (HIGH)</option>
            <option value="MEDIUM">🟡 متوسطة (MEDIUM)</option>
            <option value="LOW">🔵 منخفضة (LOW)</option>
          </select>

          <button onClick={fetchLogs} style={{ padding: '8px 14px', backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
            🔄 تحديث
          </button>
          
          <button onClick={() => clearLogs('MOBILE_ONLY')} style={{ padding: '8px 12px', backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
            📱 مسح أخطاء الموبايل
          </button>

          <button onClick={() => clearLogs('ALL')} style={{ padding: '8px 12px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
            🗑️ مسح الكل
          </button>
        </div>
      </div>

      {/* 📱💻 شريط التصفية السريع للمنصات */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '6px' }}>
        {[
          { id: 'ALL', label: `عرض الكل (${logs.length})` },
          { id: 'MOBILE', label: `📱 أخطاء الموبايل فقط (${mobileErrorsCount})`, color: '#0369a1', bg: '#f0f9ff' },
          { id: 'IOS', label: `🍏 iOS (${logs.filter(l => detectPlatform(l) === 'IOS').length})` },
          { id: 'ANDROID', label: `🤖 Android (${logs.filter(l => detectPlatform(l) === 'ANDROID').length})` },
          { id: 'WEB', label: `💻 أخطاء الموقع فقط (${webErrorsCount})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterPlatform(tab.id as any)}
            style={{
              padding: '7px 14px',
              borderRadius: '20px',
              border: filterPlatform === tab.id ? '2px solid #1f3a5f' : '1px solid #e2e8f0',
              backgroundColor: filterPlatform === tab.id ? '#1f3a5f' : (tab.bg || '#ffffff'),
              color: filterPlatform === tab.id ? '#ffffff' : (tab.color || '#475569'),
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#64748b', padding: '30px 0' }}>🔄 جاري فحص وتحديث السجلات...</p>
      ) : filteredLogs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '35px', backgroundColor: '#f0fff4', color: '#166534', borderRadius: '12px', border: '1px solid #bbf7d0', fontWeight: 'bold' }}>
          ✅ لا توجد أخطاء مسجلة تطابق الشروط المحددة، التطبيق والنظام يعملان بكفاءة.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', color: '#475569', borderBottom: '2px solid #cbd5e0' }}>
                <th style={{ padding: '12px 10px' }}>المنصة والخطورة</th>
                <th style={{ padding: '12px 10px' }}>تفاصيل العطل والرد الصريح</th>
                <th style={{ padding: '12px 10px' }}>الشاشة / الجهاز / المستخدم</th>
                <th style={{ padding: '12px 10px' }}>التاريخ</th>
                <th style={{ padding: '12px 10px', textAlign: 'center' }}>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => {
                const plat = detectPlatform(log);
                const hasServerResponse = log.stack_trace && log.stack_trace.includes('[تفاصيل الرد الصريح من السيرفر]');
                const isMobile = plat !== 'WEB';

                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: log.severity === 'CRITICAL' ? '#fff5f5' : (isMobile ? '#fbfcfe' : '#ffffff') }}>
                    
                    {/* عمود المنصة والخطورة */}
                    <td style={{ padding: '10px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-start' }}>
                        {/* وسام المنصة */}
                        <span style={{
                          padding: '2px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 'bold',
                          backgroundColor: plat === 'IOS' ? '#f3e8ff' : plat === 'ANDROID' ? '#ecfdf5' : plat === 'MOBILE' ? '#e0f2fe' : '#f1f5f9',
                          color: plat === 'IOS' ? '#7e22ce' : plat === 'ANDROID' ? '#047857' : plat === 'MOBILE' ? '#0369a1' : '#475569',
                          border: '1px solid rgba(0,0,0,0.06)'
                        }}>
                          {plat === 'IOS' ? '🍏 iOS' : plat === 'ANDROID' ? '🤖 Android' : plat === 'MOBILE' ? '📱 Mobile' : '💻 Web'}
                        </span>

                        {/* وسام الخطورة */}
                        <span style={{ 
                          padding: '2px 8px', borderRadius: '5px', fontSize: '10.5px', fontWeight: 'bold',
                          backgroundColor: log.severity === 'CRITICAL' ? '#fef2f2' : log.severity === 'HIGH' ? '#fff7ed' : '#f0f9ff',
                          color: log.severity === 'CRITICAL' ? '#dc2626' : log.severity === 'HIGH' ? '#c2410c' : '#0369a1',
                          border: log.severity === 'CRITICAL' ? '1px solid #fecaca' : '1px solid #fed7aa'
                        }}>
                          {log.error_type || 'ERROR'} ({log.severity})
                        </span>
                      </div>
                    </td>
                    
                    {/* عمود رسالة العطل ورد السيرفر */}
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e293b', maxWidth: '380px', wordBreak: 'break-word', verticalAlign: 'top' }}>
                      <div style={{ marginBottom: '4px', fontSize: '13px' }}>{log.message}</div>
                      
                      {log.stack_trace && (
                        <div style={{ marginTop: '6px' }}>
                          {hasServerResponse ? (
                            <div style={{ backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '8px', padding: '8px 10px' }}>
                              <span style={{ fontSize: '11px', color: '#991b1b', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
                                🔍 السبب التقني ورد السيرفر من Supabase:
                              </span>
                              <pre style={{ margin: 0, color: '#be123c', fontSize: '11px', overflowX: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'monospace', direction: 'ltr', textAlign: 'left' }}>
                                {log.stack_trace.replace('🔍 [تفاصيل الرد الصريح من السيرفر]:\n', '')}
                              </pre>
                            </div>
                          ) : (
                            <details style={{ cursor: 'pointer', color: '#64748b', fontSize: '11px' }}>
                              <summary>عرض تفاصيل الـ Stack Trace {isMobile && '(Flutter)'}</summary>
                              <pre style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '8px', borderRadius: '6px', fontSize: '10.5px', overflowX: 'auto', marginTop: '4px', textAlign: 'left', direction: 'ltr' }}>
                                {log.stack_trace}
                              </pre>
                            </details>
                          )}
                        </div>
                      )}
                    </td>

                    {/* عمود الشاشة / الجهاز */}
                    <td style={{ padding: '10px', fontSize: '11.5px', verticalAlign: 'top' }}>
                      <div style={{ direction: 'ltr', textAlign: 'left', fontFamily: 'monospace', color: '#2563eb', fontWeight: 'bold' }}>
                        {log.component_name || log.page_url || 'Unknown Screen'}
                      </div>
                      
                      {/* معلومات خاصة بالموبايل إذا توفرت */}
                      {(log.device_os || log.app_version) && (
                        <div style={{ color: '#0369a1', fontSize: '10.5px', marginTop: '3px', direction: 'ltr', textAlign: 'left' }}>
                          📱 {log.device_os || ''} {log.app_version ? `| v${log.app_version}` : ''}
                        </div>
                      )}

                      <div style={{ color: '#64748b', fontSize: '11px', marginTop: '3px' }}>
                        👤 {log.user_info || log.user_code || 'زائر'}
                      </div>
                    </td>

                    {/* التاريخ */}
                    <td style={{ padding: '10px', color: '#64748b', fontSize: '11.5px', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                      {log.created_at ? new Date(log.created_at).toLocaleString('ar-QA') : '-'}
                    </td>

                    {/* إجراء الحذف الفردي */}
                    <td style={{ padding: '10px', textAlign: 'center', verticalAlign: 'top' }}>
                      <button
                        onClick={() => deleteSingleLog(log.id)}
                        title="حذف هذا السجل"
                        style={{ padding: '4px 8px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminErrorMonitor;