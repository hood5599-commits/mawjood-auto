/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useCallback, useEffect, useState } from 'react';

interface AdminNotificationsConsoleProps {
  supabaseUrl: string;
  apiKey: string;
  lang?: 'ar' | 'en';
}

type NotifType = 'order_update' | 'promotion' | 'system_alert';

type HistoryRow = {
  id: number | string;
  title: string;
  body?: string | null;
  message?: string | null;
  type?: string | null;
  user_id?: string | null;
  target?: string | null;
  target_user?: string | null;
  data?: Record<string, unknown> | null;
  created_at?: string | null;
  source?: string | null;
};

export const AdminNotificationsConsole: React.FC<AdminNotificationsConsoleProps> = ({
  supabaseUrl,
  apiKey,
  lang = 'ar',
}) => {
  const isRtl = lang === 'ar';
  const cleanBaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const restUrl = `${cleanBaseUrl}/rest/v1`;

  const [mode, setMode] = useState<'broadcast' | 'targeted'>('broadcast');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<NotifType>('system_alert');
  const [targetPhoneOrId, setTargetPhoneOrId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const headers = {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(
        `${restUrl}/notifications?select=*&order=created_at.desc&limit=80`,
        { headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setHistory(Array.isArray(data) ? data : []);
      }
    } catch (_) {
      // keep previous
    } finally {
      setLoadingHistory(false);
    }
  }, [apiKey, restUrl]);

  useEffect(() => {
    fetchHistory();
    const t = setInterval(fetchHistory, 12000);
    return () => clearInterval(t);
  }, [fetchHistory]);

  const resolveUserId = async (input: string): Promise<string | null> => {
    const trimmed = input.trim();
    if (!trimmed) return null;
    // UUID-looking value
    if (/^[0-9a-f-]{36}$/i.test(trimmed)) return trimmed;

    // Lookup profiles by phone if available
    try {
      const res = await fetch(
        `${restUrl}/profiles?select=id,phone&phone=eq.${encodeURIComponent(trimmed)}&limit=1`,
        { headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` } }
      );
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows[0]?.id) return String(rows[0].id);
      }
    } catch (_) {}
    return null;
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setStatus(isRtl ? 'يرجى تعبئة العنوان والرسالة' : 'Title and body are required');
      return;
    }
    if (mode === 'targeted' && !targetPhoneOrId.trim()) {
      setStatus(isRtl ? 'أدخل رقم الجوال أو معرّف المستخدم' : 'Enter phone or user ID');
      return;
    }

    setSending(true);
    setStatus(null);
    try {
      // Admin console uses anon key → keep user_id NULL so history remains readable
      // under RLS (anon SELECT broadcasts). Mobile matches via `target` phone/UUID.
      const target = mode === 'broadcast' ? 'all' : targetPhoneOrId.trim().toLowerCase();
      const resolvedUserId =
          mode === 'targeted' ? await resolveUserId(targetPhoneOrId) : null;

      const dataPayload: Record<string, unknown> = {};
      if (orderId.trim()) dataPayload.order_id = orderId.trim();
      if (mode === 'targeted' && targetPhoneOrId.trim()) {
        dataPayload.target_ref = targetPhoneOrId.trim();
      }
      if (resolvedUserId) dataPayload.resolved_user_id = resolvedUserId;

      const payload = {
        title: title.trim(),
        body: body.trim(),
        message: body.trim(),
        type,
        user_id: null as string | null,
        target,
        target_user: target,
        data: dataPayload,
        is_read: false,
        source: 'admin_notifications_console',
        created_at: new Date().toISOString(),
      };

      const res = await fetch(`${restUrl}/notifications`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok || res.status === 201) {
        setStatus(
          mode === 'broadcast'
            ? (isRtl ? 'تم بث الإشعار لجميع المستخدمين' : 'Broadcast sent to all users')
            : (isRtl ? 'تم إرسال الإشعار المستهدف' : 'Targeted notification sent')
        );
        setTitle('');
        setBody('');
        setOrderId('');
        if (mode === 'targeted') setTargetPhoneOrId('');
        fetchHistory();
      } else {
        const errText = await res.text();
        setStatus(`${isRtl ? 'فشل الإرسال' : 'Send failed'}: ${errText || res.status}`);
      }
    } catch (err: any) {
      setStatus(`${isRtl ? 'خطأ اتصال' : 'Connection error'}: ${err?.message || 'unknown'}`);
    } finally {
      setSending(false);
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

  const typeLabel = (t?: string | null) => {
    switch (t) {
      case 'order_update':
        return isRtl ? 'تحديث طلب' : 'Order update';
      case 'promotion':
        return isRtl ? 'عرض ترويجي' : 'Promotion';
      default:
        return isRtl ? 'تنبيه نظام' : 'System alert';
    }
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h3 style={{ margin: 0, color: '#1f3a5f', fontSize: 18 }}>
          {isRtl ? 'وحدة تحكم الإشعارات' : 'Notifications Console'}
        </h3>
        <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 12.5 }}>
          {isRtl
            ? 'بث لجميع المستخدمين أو إشعار موجّه لمستخدم / طلب محدد'
            : 'Broadcast to all users or target a specific user / order'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setMode('broadcast')}
          style={{
            padding: '9px 16px',
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 12.5,
            backgroundColor: mode === 'broadcast' ? '#1f3a5f' : '#f1f5f9',
            color: mode === 'broadcast' ? '#fff' : '#64748b',
          }}
        >
          {isRtl ? 'بث للجميع' : 'Broadcast'}
        </button>
        <button
          type="button"
          onClick={() => setMode('targeted')}
          style={{
            padding: '9px 16px',
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 12.5,
            backgroundColor: mode === 'targeted' ? '#ea580c' : '#f1f5f9',
            color: mode === 'targeted' ? '#fff' : '#64748b',
          }}
        >
          {isRtl ? 'إشعار موجّه' : 'Targeted'}
        </button>
      </div>

      <form
        onSubmit={send}
        style={{
          backgroundColor: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          padding: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          maxWidth: 640,
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
            {isRtl ? 'العنوان' : 'Title'}
          </label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
            {isRtl ? 'الرسالة' : 'Body'}
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
            {isRtl ? 'النوع' : 'Type'}
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as NotifType)}
            style={inputStyle}
          >
            <option value="system_alert">{isRtl ? 'تنبيه نظام' : 'System alert'}</option>
            <option value="order_update">{isRtl ? 'تحديث طلب' : 'Order update'}</option>
            <option value="promotion">{isRtl ? 'عرض ترويجي' : 'Promotion'}</option>
          </select>
        </div>
        {mode === 'targeted' && (
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
              {isRtl ? 'رقم الجوال أو معرّف المستخدم (UUID)' : 'Phone or user UUID'}
            </label>
            <input
              value={targetPhoneOrId}
              onChange={(e) => setTargetPhoneOrId(e.target.value)}
              placeholder={isRtl ? '974xxxxxxxx أو UUID' : '974xxxxxxxx or UUID'}
              style={inputStyle}
            />
          </div>
        )}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
            {isRtl ? 'رقم الطلب (اختياري — للتوجيه)' : 'Order ID (optional — routing)'}
          </label>
          <input
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="order_id"
            style={inputStyle}
          />
        </div>
        <button
          type="submit"
          disabled={sending}
          style={{
            padding: '12px 16px',
            backgroundColor: mode === 'broadcast' ? '#1f3a5f' : '#ea580c',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 13,
            cursor: sending ? 'wait' : 'pointer',
          }}
        >
          {sending
            ? (isRtl ? 'جاري الإرسال...' : 'Sending...')
            : mode === 'broadcast'
              ? (isRtl ? 'بث الإشعار للجميع' : 'Broadcast to all')
              : (isRtl ? 'إرسال للمستخدم' : 'Send to user')}
        </button>
        {status && (
          <div
            style={{
              padding: 10,
              borderRadius: 10,
              backgroundColor: status.includes('فشل') || status.toLowerCase().includes('fail') || status.includes('خطأ')
                ? '#fef2f2'
                : '#ecfdf5',
              color: status.includes('فشل') || status.toLowerCase().includes('fail') || status.includes('خطأ')
                ? '#b91c1c'
                : '#047857',
              fontWeight: 700,
              fontSize: 12.5,
            }}
          >
            {status}
          </div>
        )}
      </form>

      <div
        style={{
          backgroundColor: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          padding: 18,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h4 style={{ margin: 0, color: '#1f3a5f', fontSize: 15 }}>
            {isRtl ? 'سجل الإشعارات المرسلة' : 'Notification history'}
          </h4>
          <button
            type="button"
            onClick={fetchHistory}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: '#f1f5f9',
              color: '#475569',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {isRtl ? 'تحديث' : 'Refresh'}
          </button>
        </div>

        {loadingHistory && history.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
            {isRtl ? 'جاري التحميل...' : 'Loading...'}
          </div>
        ) : history.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
            {isRtl ? 'لا توجد إشعارات بعد' : 'No notifications yet'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', color: '#64748b', textAlign: isRtl ? 'right' : 'left' }}>
                  <th style={{ padding: 10 }}>ID</th>
                  <th style={{ padding: 10 }}>{isRtl ? 'العنوان' : 'Title'}</th>
                  <th style={{ padding: 10 }}>{isRtl ? 'النوع' : 'Type'}</th>
                  <th style={{ padding: 10 }}>{isRtl ? 'الهدف' : 'Audience'}</th>
                  <th style={{ padding: 10 }}>{isRtl ? 'الوقت' : 'Created'}</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => {
                  const audience = row.user_id
                    ? `${isRtl ? 'مستخدم' : 'User'}: ${row.user_id.slice(0, 8)}…`
                    : (row.target || row.target_user || 'all') === 'all'
                      ? (isRtl ? 'الجميع (بث)' : 'Broadcast')
                      : `${isRtl ? 'هدف' : 'Target'}: ${row.target || row.target_user}`;
                  return (
                    <tr key={String(row.id)} style={{ borderTop: '1px solid #e2e8f0' }}>
                      <td style={{ padding: 10, color: '#94a3b8' }}>#{row.id}</td>
                      <td style={{ padding: 10 }}>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{row.title}</div>
                        <div style={{ color: '#64748b', marginTop: 2 }}>
                          {(row.body || row.message || '').toString().slice(0, 80)}
                        </div>
                      </td>
                      <td style={{ padding: 10 }}>{typeLabel(row.type)}</td>
                      <td style={{ padding: 10, color: '#475569' }}>{audience}</td>
                      <td style={{ padding: 10, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {row.created_at
                          ? new Date(row.created_at).toLocaleString(isRtl ? 'ar-QA' : 'en-GB')
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
