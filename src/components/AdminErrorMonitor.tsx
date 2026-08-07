import React, { useState, useEffect } from 'react';

interface AdminErrorMonitorProps {
  supabaseUrl: string;
  apiKey: string;
}

export const AdminErrorMonitor: React.FC<AdminErrorMonitorProps> = ({ supabaseUrl, apiKey }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${supabaseUrl}/system_errors?order=id.desc&limit=50`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${apiKey}` }
      });
      if (res.ok) setLogs(await res.json());
    } catch (e) {} finally { setLoading(false); }
  };

  const clearLogs = async () => {
    if (!window.confirm('هل أنت متأكد من مسح سجّلات الأخطاء؟')) return;
    try {
      await fetch(`${supabaseUrl}/system_errors?id=gt.0`, {
        method: 'DELETE',
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${apiKey}` }
      });
      fetchLogs();
    } catch (e) {}
  };

  return (
    <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#1f3a5f', fontSize: '18px', fontWeight: 'bold' }}>
          🛡️ كاشف الأخطاء التلقائي وتأمين النظام ({logs.length})
        </h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchLogs} style={{ padding: '8px 14px', backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>🔄 تحديث</button>
          <button onClick={clearLogs} style={{ padding: '8px 14px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>🗑️ تنظيف السجل</button>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#64748b' }}>جاري فحص السجلات...</p>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', backgroundColor: '#f0fff4', color: '#166534', borderRadius: '12px', border: '1px solid #bbf7d0', fontWeight: 'bold' }}>
          ✅ النظام يعمل بنجاح 100% بدون أي أخطاء مسجلة!
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', color: '#475569', borderBottom: '2px solid #cbd5e0' }}>
                <th style={{ padding: '10px' }}>النوع / الخطورة</th>
                <th style={{ padding: '10px' }}>رسالة الخطأ</th>
                <th style={{ padding: '10px' }}>رابط الصفحة</th>
                <th style={{ padding: '10px' }}>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px' }}>
                    <span style={{ 
                      padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold',
                      backgroundColor: log.severity === 'CRITICAL' ? '#fef2f2' : log.severity === 'HIGH' ? '#fff7ed' : '#f0f9ff',
                      color: log.severity === 'CRITICAL' ? '#dc2626' : log.severity === 'HIGH' ? '#c2410c' : '#0369a1'
                    }}>
                      {log.error_type} ({log.severity})
                    </span>
                  </td>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e293b', maxWidth: '300px', wordBreak: 'break-word' }}>
                    {log.message}
                  </td>
                  <td style={{ padding: '10px', color: '#2563eb', direction: 'ltr', textAlign: 'left', fontSize: '11px' }}>
                    {log.page_url}
                  </td>
                  <td style={{ padding: '10px', color: '#64748b', fontSize: '11px' }}>
                    {new Date(log.created_at).toLocaleString('ar-QA')}
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
