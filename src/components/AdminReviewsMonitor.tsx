/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';

interface AdminReviewsMonitorProps {
  supabaseUrl: string;
  apiKey: string;
  lang?: 'ar' | 'en';
}

type ReviewRow = {
  id: number | string;
  order_id?: number | null;
  garage_id?: string | null;
  customer_id?: string | null;
  user_id?: string | null;
  garage_rating?: number | null;
  delivery_rating?: number | null;
  platform_rating?: number | null;
  rating?: number | null;
  comment?: string | null;
  created_at?: string | null;
};

type FilterTab = 'all' | 'garage' | 'delivery' | 'platform' | 'priority';

export const AdminReviewsMonitor: React.FC<AdminReviewsMonitorProps> = ({
  supabaseUrl,
  apiKey,
  lang = 'ar',
}) => {
  const isRtl = lang === 'ar';
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [error, setError] = useState<string | null>(null);

  const cleanBaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const restUrl = `${cleanBaseUrl}/rest/v1`;

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(
        `${restUrl}/order_reviews?select=*&order=created_at.desc&limit=200`,
        {
          headers: {
            apikey: apiKey,
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'fetch failed');
    } finally {
      setLoading(false);
    }
  }, [apiKey, restUrl]);

  useEffect(() => {
    fetchReviews();
    const timer = setInterval(fetchReviews, 8000);
    return () => clearInterval(timer);
  }, [fetchReviews]);

  const num = (v: unknown) => {
    if (typeof v === 'number') return v;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const isPriority = (r: ReviewRow) =>
    (num(r.garage_rating) > 0 && num(r.garage_rating) < 3) ||
    (num(r.delivery_rating) > 0 && num(r.delivery_rating) < 3) ||
    (num(r.platform_rating) > 0 && num(r.platform_rating) < 3) ||
    (num(r.rating) > 0 && num(r.rating) < 3);

  const filtered = reviews.filter((r) => {
    if (filter === 'priority') return isPriority(r);
    if (filter === 'garage') return num(r.garage_rating) > 0;
    if (filter === 'delivery') return num(r.delivery_rating) > 0;
    if (filter === 'platform') return num(r.platform_rating) > 0;
    return true;
  });

  const priorityCount = reviews.filter(isPriority).length;

  const stars = (v: number) => {
    const n = Math.max(0, Math.min(5, Math.round(v)));
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  };

  const ratingPill = (label: string, value: number) => {
    const low = value > 0 && value < 3;
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 10px',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 700,
          backgroundColor: low ? '#fef2f2' : '#f8fafc',
          color: low ? '#b91c1c' : '#334155',
          border: `1px solid ${low ? '#fecaca' : '#e2e8f0'}`,
        }}
      >
        <span style={{ color: '#64748b' }}>{label}</span>
        <span style={{ color: low ? '#dc2626' : '#d97706' }}>{stars(value)}</span>
        <strong>{value || '—'}</strong>
      </span>
    );
  };

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: isRtl ? `الكل (${reviews.length})` : `All (${reviews.length})` },
    { id: 'priority', label: isRtl ? `⚠ أولوية عالية (${priorityCount})` : `⚠ High Priority (${priorityCount})` },
    { id: 'garage', label: isRtl ? 'تقييم الكراج' : 'Garage Rating' },
    { id: 'delivery', label: isRtl ? 'تقييم التوصيل' : 'Delivery Rating' },
    { id: 'platform', label: isRtl ? 'تقييم المنصة' : 'Platform Rating' },
  ];

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: 0, color: '#1f3a5f', fontSize: 18 }}>
            {isRtl ? 'تقييمات وشكاوى واقتراحات العملاء' : 'Customer Reviews, Complaints & Suggestions'}
          </h3>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 12.5 }}>
            {isRtl
              ? 'تحديث تلقائي كل 8 ثوانٍ · التقييمات أقل من 3 نجوم تُبرز كشكاوى ذات أولوية'
              : 'Auto-refreshes every 8s · ratings under 3★ are highlighted as high-priority complaints'}
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            fetchReviews();
          }}
          style={{
            padding: '8px 14px',
            borderRadius: 10,
            border: 'none',
            backgroundColor: '#1f3a5f',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: 12.5,
          }}
        >
          {isRtl ? 'تحديث الآن' : 'Refresh'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 12.5,
              backgroundColor: filter === t.id
                ? (t.id === 'priority' ? '#b91c1c' : '#1f3a5f')
                : '#f1f5f9',
              color: filter === t.id ? '#fff' : '#64748b',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ padding: 12, borderRadius: 10, backgroundColor: '#fef2f2', color: '#b91c1c', fontWeight: 700, fontSize: 13 }}>
          {isRtl ? 'تعذر جلب التقييمات: ' : 'Failed to load reviews: '}{error}
        </div>
      )}

      {loading && reviews.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
          {isRtl ? 'جاري التحميل...' : 'Loading...'}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b', backgroundColor: '#f8fafc', borderRadius: 14, border: '1px dashed #cbd5e1' }}>
          {isRtl ? 'لا توجد تقييمات في هذا التصنيف حالياً.' : 'No reviews in this category yet.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((r) => {
            const priority = isPriority(r);
            return (
              <div
                key={String(r.id)}
                style={{
                  backgroundColor: priority ? '#fff1f2' : '#ffffff',
                  border: `1.5px solid ${priority ? '#fecaca' : '#e2e8f0'}`,
                  borderRadius: 14,
                  padding: 16,
                  boxShadow: priority ? '0 0 0 2px rgba(185,28,28,0.08)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {priority && (
                      <span style={{ backgroundColor: '#b91c1c', color: '#fff', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6 }}>
                        {isRtl ? 'أولوية عالية' : 'HIGH PRIORITY'}
                      </span>
                    )}
                    <strong style={{ color: '#1f3a5f', fontSize: 13.5 }}>
                      #{r.id} · {isRtl ? 'طلب' : 'Order'} {r.order_id ?? '—'}
                    </strong>
                    <span style={{ color: '#64748b', fontSize: 12 }}>
                      {r.garage_id ? `${isRtl ? 'كراج' : 'Garage'}: ${r.garage_id}` : ''}
                    </span>
                  </div>
                  <span style={{ color: '#94a3b8', fontSize: 11.5 }}>
                    {r.created_at ? new Date(r.created_at).toLocaleString(isRtl ? 'ar-QA' : 'en-GB') : ''}
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  {ratingPill(isRtl ? 'كراج/قطعة' : 'Garage/Part', num(r.garage_rating))}
                  {ratingPill(isRtl ? 'توصيل' : 'Delivery', num(r.delivery_rating))}
                  {ratingPill(isRtl ? 'منصة' : 'Platform', num(r.platform_rating))}
                </div>

                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>
                  {isRtl ? 'العميل' : 'Customer'}: {r.customer_id || r.user_id || '—'}
                </div>

                {r.comment ? (
                  <div
                    style={{
                      marginTop: 4,
                      padding: 12,
                      borderRadius: 10,
                      backgroundColor: priority ? '#fff' : '#f8fafc',
                      border: `1px solid ${priority ? '#fecaca' : '#e2e8f0'}`,
                      color: '#1e293b',
                      fontSize: 13.5,
                      lineHeight: 1.55,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {r.comment}
                  </div>
                ) : (
                  <div style={{ color: '#94a3b8', fontSize: 12.5, fontStyle: 'italic' }}>
                    {isRtl ? 'بدون تعليق نصي' : 'No written comment'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
