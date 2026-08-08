import React, { useState, useEffect } from 'react';

interface AdminErrorMonitorProps {
  supabaseUrl: string;
  apiKey: string;
}

export const AdminErrorMonitor: React.FC<AdminErrorMonitorProps> = ({ supabaseUrl, apiKey }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

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
      const res = await fetch(`${restUrl}/system_errors?order=id.desc&limit=100`, {
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

  // 🗑️ مسح جميع السجلات المباشرة من Supabase
  const clearLogs = async () => {
    if (!window.confirm('هل أنت متأكد من مسح جميع سجلات الأخطاء بشكل نهائي؟')) return;

    setLoading(true);
    try {
      const res = await fetch(`${restUrl}/system_errors?id=gt.0`, {
        method: 'DELETE',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        }
      });

      if (res.ok || res.status === 204) {
        alert('🎉 تم مسح جميع سجلات الأخطاء بنجاح!');
        setLogs([]); // تفريغ القائمة فوراً بالواجهة
      } else {
        const errText = await res.text();
        console.error("Delete Error:", errText);
        alert('حدث خطأ أثناء محاولة مسح السجلات من قاعدة البيانات. تأكد من تفعيل RLS أو إيقافه لجدول system_errors');
        fetchLogs();
      }
    } catch (e) {
      console.error("Error clearing logs:", e);
      alert('خطأ في الاتصال أثناء مسح السجلات');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    filterSeverity === 'ALL' ? true : log.severity === filterSeverity
  );

  return (
    <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', color: '#1f3a5f', fontSize: '18px', fontWeight: 'bold' }}>
            🛡️ كاشف الأخطاء الذكي والمراقبة الحية ({filteredLogs.length} / {logs.length})
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>مراقبة تلقائية للأخطاء البرمجية وانقطاعات الشبكة وفشل الاستجابات</span>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select 
            value={filterSeverity} 
            onChange={(e) => setFilterSeverity(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#f8fafc' }}
          >
            <option value="ALL">جميع الدرجات</option>
            <option value="CRITICAL">🔴 خطيرة (CRITICAL)</option>
            <option value="HIGH">🟠 عالية (HIGH)</option>
            <option value="MEDIUM">🟡 متوسطة (MEDIUM)</option>
            <option value="LOW">🔵 منخفضة (LOW)</option>
          </select>

          <button onClick={fetchLogs} style={{ padding: '8px 14px', backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
            🔄 تحديث الفحص
          </button>
          
          <button onClick={clearLogs} style={{ padding: '8px 14px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
            🗑️ مسح السجلات
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#64748b', padding: '30px 0' }}>🔄 جاري فحص ومراجع مع السجلات...</p>
      ) : filteredLogs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '35px', backgroundColor: '#f0fff4', color: '#166534', borderRadius: '12px', border: '1px solid #bbf7d0', fontWeight: 'bold' }}>
          ✅ ممتاز! لا توجد أخطاء مسجلة تطابق الشروط الحالية، المنصة تعمل بكفاءة.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', color: '#475569', borderBottom: '2px solid #cbd5e0' }}>
                <th style={{ padding: '12px 10px' }}>نوع الخطأ / الخطورة</th>
                <th style={{ padding: '12px 10px' }}>تفاصيل الرسالة والموقع</th>
                <th style={{ padding: '12px 10px' }}>رابط الصفحة والمستخدم</th>
                <th style={{ padding: '12px 10px' }}>التاريخ والوقت</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: log.severity === 'CRITICAL' ? '#fff5f5' : '#ffffff' }}>
                  <td style={{ padding: '10px' }}>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', display: 'inline-block',
                      backgroundColor: log.severity === 'CRITICAL' ? '#fef2f2' : log.severity === 'HIGH' ? '#fff7ed' : '#f0f9ff',
                      color: log.severity === 'CRITICAL' ? '#dc2626' : log.severity === 'HIGH' ? '#c2410c' : '#0369a1',
                      border: log.severity === 'CRITICAL' ? '1px solid #fecaca' : '1px solid #fed7aa'
                    }}>
                      {log.error_type} ({log.severity})
                    </span>
                  </td>
                  
                  <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e293b', maxWidth: '320px', wordBreak: 'break-word' }}>
                    <div>{log.message}</div>
                    {log.stack_trace && (
                      <details style={{ marginTop: '4px', cursor: 'pointer', color: '#64748b', fontSize: '11px' }}>
                        <summary>عرض تفاصيل الـ Stack Trace</summary>
                        <pre style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '8px', borderRadius: '6px', fontSize: '10.5px', overflowX: 'auto', marginTop: '4px', textAlign: 'left', direction: 'ltr' }}>
                          {log.stack_trace}
                        </pre>
                      </details>
                    )}
                  </td>

                  <td style={{ padding: '10px', color: '#2563eb', fontSize: '11.5px' }}>
                    <div style={{ direction: 'ltr', textAlign: 'left', fontFamily: 'monospace' }}>{log.page_url}</div>
                    <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>👤 {log.user_info || 'زائر'}</div>
                  </td>

                  <td style={{ padding: '10px', color: '#64748b', fontSize: '11.5px', whiteSpace: 'nowrap' }}>
                    {log.created_at ? new Date(log.created_at).toLocaleString('ar-QA') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminErrorMonitor;
