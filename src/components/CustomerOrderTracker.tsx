import React, { useState, useEffect } from 'react';
import { AITranslatedText } from './AITranslatedText';

interface Props {
  lang: 'ar' | 'en';
  customerPhone: string;
  supabaseUrl: string;
  apiKey: string;
  session: any;
  onClose: () => void;
  onSelectPartForCheckout?: (part: any) => void;
}

export const CustomerOrderTracker: React.FC<Props> = ({
  lang,
  customerPhone,
  supabaseUrl,
  apiKey,
  session,
  onClose,
  onSelectPartForCheckout
}) => {
  // ⭐️ تم إضافة تبويب الطلبات السابقة 'previous_orders'
  const [activeTab, setActiveTab] = useState<'inquiries' | 'orders' | 'previous_orders' | 'custom_requests'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [customRequests, setCustomRequests] = useState<any[]>([]);
  const [selectedRequestQuotes, setSelectedRequestQuotes] = useState<{ request: any; quotes: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  // ⭐️ حالات التقييم الثلاثي
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<any | null>(null);
  const [garageRating, setGarageRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [websiteRating, setWebsiteRating] = useState(5);
  const [asDescribed, setAsDescribed] = useState(true);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const isRtl = lang === 'ar';

  // 🛡️ توحيد وتنظيف رابط Supabase
  const cleanBaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const restUrl = `${cleanBaseUrl}/rest/v1`;

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [customerPhone, session]);

  // 🚀 دالة جلب البيانات الشاملة والمرنة على كل الأجهزة
  const fetchData = async () => {
    setLoading(true);
    try {
      const userEmail = session?.email || session?.user?.email || '';
      const rawPhone = customerPhone || session?.phone || session?.user?.phone || session?.user?.user_metadata?.phone || '';
      
      const cleanPhone = rawPhone.replace(/\D/g, '');
      const localPhone = cleanPhone.startsWith('974') ? cleanPhone.slice(3) : cleanPhone;
      const intlPhone = cleanPhone.startsWith('974') ? cleanPhone : `974${cleanPhone}`;

      const targets = Array.from(new Set([rawPhone, cleanPhone, localPhone, intlPhone, userEmail].filter(Boolean)));

      if (targets.length === 0) {
        setLoading(false);
        return;
      }

      const phoneFilter = `customer_phone=in.(${targets.map(t => `"${encodeURIComponent(t)}"`).join(',')})`;

      const [resOrders, resInquiries, resCustom] = await Promise.all([
        fetch(`${restUrl}/orders?${phoneFilter}&order=id.desc`, { headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` } }),
        fetch(`${restUrl}/fitment_inquiries?${phoneFilter}&order=id.desc`, { headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` } }),
        fetch(`${restUrl}/custom_part_requests?${phoneFilter}&order=id.desc`, { headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` } })
      ]);

      if (resOrders.ok) setOrders(await resOrders.json());
      if (resInquiries.ok) setInquiries(await resInquiries.json());
      if (resCustom.ok) setCustomRequests(await resCustom.json());
    } catch (e) {
      console.error("Error fetching tracker data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleViewQuotes = async (request: any) => {
    try {
      const res = await fetch(`${restUrl}/garage_quotes?request_id=eq.${request.id}&order=id.desc`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` }
      });
      if (res.ok) {
        const quotes = await res.json();
        setSelectedRequestQuotes({ request, quotes });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForReview) return;
    setSubmittingReview(true);

    try {
      const payload = {
        garage_id: selectedOrderForReview.garage_id || 'unknown_garage',
        order_id: selectedOrderForReview.id,
        customer_phone: customerPhone || session?.phone || session?.user?.phone || '',
        garage_rating: garageRating,
        delivery_rating: deliveryRating,
        website_rating: websiteRating,
        as_described: asDescribed,
        comment: reviewComment.trim() || null
      };

      await fetch(`${restUrl}/garage_reviews`, {
        method: 'POST',
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify(payload)
      });

      await fetch(`${restUrl}/orders?id=eq.${selectedOrderForReview.id}`, {
        method: 'PATCH',
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: garageRating, is_reviewed: true })
      });

      alert(isRtl ? 'شكراً لك! تم تسجيل تقييمك بنجاح ونقل الطلب للسجل السابق ⭐' : 'Thank you! Your feedback has been submitted and order moved to history.');
      
      setSelectedOrderForReview(null);
      setReviewComment('');
      
      // التحديث ينقل الطلب فوراً من "طلبات الشراء" إلى "طلباتي السابقة"
      fetchData();
      setActiveTab('previous_orders'); // الانتقال التلقائي للتبويب السابق بعد التقييم

    } catch (e) {
      console.error("Error submitting review:", e);
      alert(isRtl ? 'خطأ في الاتصال' : 'Connection error');
    } finally {
      setSubmittingReview(false);
    }
  };

  // ⭐️ فلترة الطلبات لتوزيعها على التبويبات الجديدة
  const activeInquiries = inquiries.filter(i => i.status !== 'ordered');
  const confirmedInquiries = activeInquiries.filter(i => i.status === 'confirmed_compatible');
  
  // الطلبات التي لم تُقيّم بعد (طلبات نشطة)
  const activeOrders = orders.filter(o => !o.is_reviewed && o.status !== 'cancelled');
  // الطلبات التي تم تقييمها أو إلغاؤها (طلبات سابقة)
  const previousOrders = orders.filter(o => o.is_reviewed || o.status === 'cancelled');

  return (
    <>
      <style>{`
        .mwj-ot-overlay {
          position: fixed; inset: 0; background: rgba(15,23,32,0.72);
          backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
          display: flex; justify-content: center; align-items: center;
          z-index: 1000; padding: 20px; animation: mwj-ot-fade 0.18s ease;
          font-family: 'Cairo', 'Segoe UI', sans-serif;
        }
        @keyframes mwj-ot-fade { from { opacity: 0; } to { opacity: 1; } }

        .mwj-ot-modal {
          background: white; border-radius: 22px; padding: 28px;
          max-width: 680px; width: 92%; max-height: 90vh; overflow-y: auto;
          box-shadow: 0 24px 60px rgba(0,0,0,0.32); position: relative;
          animation: mwj-ot-in 0.22s ease;
        }
        @keyframes mwj-ot-in { from { opacity: 0; transform: translateY(14px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }

        .mwj-ot-close {
          position: absolute; top: 16px; border: none; background: #f1f5f9;
          border-radius: 50%; width: 34px; height: 34px; cursor: pointer;
          font-weight: 800; color: #64748b; transition: all 0.18s ease;
        }
        .mwj-ot-close:hover { background: #e2e8f0; color: #1F3A5F; transform: rotate(90deg); }

        .mwj-ot-title { margin: 0 0 18px 0; color: #16304f; font-weight: 800; font-size: 18px; }

        .mwj-ot-tabs { display: flex; gap: 8px; margin-bottom: 22px; border-bottom: 2px solid #f1f5f9; padding-bottom: 14px; flex-wrap: wrap; }
        .mwj-ot-tab {
          flex: 1; min-width: 100px; padding: 10px; border-radius: 12px; border: none; font-weight: 800;
          cursor: pointer; font-size: 12px; position: relative; background: #f7fafc;
          color: #4a5568; transition: all 0.2s ease; text-align: center;
        }
        .mwj-ot-tab:hover { transform: translateY(-1px); }
        .mwj-ot-tab-inq-active { background: linear-gradient(135deg, #7c5fd0 0%, #6947b8 100%) !important; color: white !important; box-shadow: 0 6px 16px rgba(107,70,193,0.3); }
        .mwj-ot-tab-ord-active { background: linear-gradient(135deg, #22a35a 0%, #1c8a4a 100%) !important; color: white !important; box-shadow: 0 6px 16px rgba(34,163,90,0.3); }
        .mwj-ot-tab-prev-active { background: linear-gradient(135deg, #475569 0%, #334155 100%) !important; color: white !important; box-shadow: 0 6px 16px rgba(71,85,105,0.3); }
        .mwj-ot-tab-custom-active { background: linear-gradient(135deg, #e0872a 0%, #c2410c 100%) !important; color: white !important; box-shadow: 0 6px 16px rgba(224,135,42,0.3); }
        
        .mwj-ot-tab-count {
          position: absolute; top: -6px; background: #E0872A; color: #0F1720;
          border-radius: 50%; padding: 2px 6px; font-size: 10px; font-weight: 800;
          border: 2px solid white; box-shadow: 0 2px 6px rgba(224,135,42,0.4);
        }

        .mwj-ot-loading, .mwj-ot-empty { text-align: center; color: #94a3b8; padding: 36px 0; font-size: 14px; }

        .mwj-ot-inq-card { padding: 18px; border-radius: 16px; transition: all 0.2s ease; margin-bottom: 15px; }
        .mwj-ot-inq-confirmed { border: 2px solid #22a35a; background: linear-gradient(135deg, #f0fff4 0%, #e6faec 100%); }
        .mwj-ot-inq-default { border: 1px solid #e2e8f0; background: #f8fafc; }

        .mwj-ot-inq-code { font-size: 11.5px; font-weight: 800; background: #e9d8fd; color: #553c9a; padding: 3px 9px; border-radius: 7px; }
        .mwj-ot-inq-status { font-size: 13px; font-weight: 800; }

        .mwj-ot-part-row {
          display: flex; gap: 12px; align-items: center; background: white; padding: 11px;
          border-radius: 12px; border: 1px solid #edf2f7; margin-bottom: 11px;
        }
        .mwj-ot-part-row img { width: 56px; height: 56px; object-fit: cover; border-radius: 9px; flex-shrink: 0; }

        .mwj-ot-vehicle-line { font-size: 12.5px; color: #718096; margin-bottom: 9px; }

        .mwj-ot-confirmed-box {
          background: white; padding: 14px; border-radius: 12px; border: 1px solid #c6f6d5;
          color: #22543d; font-size: 13px; margin-top: 10px;
        }
        .mwj-ot-checkout-btn {
          width: 100%; padding: 12px; border: none; border-radius: 10px; font-weight: 800;
          font-size: 14.5px; cursor: pointer; color: white; margin-top: 6px;
          background: linear-gradient(135deg, #22a35a 0%, #1c8a4a 100%);
          box-shadow: 0 8px 20px rgba(34,163,90,0.3);
          transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
        }
        .mwj-ot-checkout-btn:hover { transform: translateY(-2px); filter: brightness(1.05); }

        .mwj-ot-order-card {
          padding: 18px; border: 1px solid #eef1f5; border-radius: 16px; background: #f8fafc;
          transition: all 0.2s ease; margin-bottom: 15px;
        }
        .mwj-ot-order-card:hover { box-shadow: 0 6px 20px rgba(15,23,32,0.06); }
        .mwj-ot-order-code { font-size: 11.5px; font-weight: 800; background: #ebf8ff; color: #2b6cb0; padding: 3px 9px; border-radius: 7px; }
        .mwj-ot-order-status { font-size: 13px; font-weight: 800; }

        .mwj-ot-delivery-code-box {
          background: linear-gradient(135deg, #fffaf3 0%, #fff3e2 100%); padding: 14px; border-radius: 12px;
          border: 1px solid #feebc8; display: flex; justify-content: space-between;
          align-items: center; margin-bottom: 12px; gap: 10px; flex-wrap: wrap;
        }
        .mwj-ot-delivery-code { font-size: 19px; font-weight: 800; font-family: 'Courier New', monospace; color: #c9701c; letter-spacing: 0.5px; }
        
        .mwj-ot-review-btn {
          width: 100%; padding: 11px; border: none; border-radius: 10px; font-weight: 800;
          cursor: pointer; font-size: 13.5px; color: white;
          background: linear-gradient(135deg, #7c5fd0 0%, #6947b8 100%);
          box-shadow: 0 6px 16px rgba(107,70,193,0.28); transition: all 0.2s ease;
        }
        .mwj-ot-review-btn:hover { transform: translateY(-2px); filter: brightness(1.05); }
        .mwj-ot-review-btn-secondary {
          background: linear-gradient(135deg, #64748b 0%, #475569 100%); box-shadow: 0 6px 16px rgba(100,116,139,0.28);
        }

        .mwj-ot-review-overlay {
          position: fixed; inset: 0; background: rgba(15,23,32,0.65); backdrop-filter: blur(3px);
          display: flex; justify-content: center; align-items: center; z-index: 1100; padding: 20px;
          animation: mwj-ot-fade 0.18s ease;
        }
        .mwj-ot-review-modal {
          background: white; padding: 26px; border-radius: 18px; max-width: 480px; width: 92%;
          box-shadow: 0 20px 50px rgba(0,0,0,0.28); animation: mwj-ot-in 0.2s ease;
          max-height: 85vh; overflow-y: auto;
        }
        .mwj-ot-star {
          font-size: 22px; background: none; border: none; cursor: pointer;
          transition: transform 0.15s ease, opacity 0.15s ease; padding: 2px;
        }
        .mwj-ot-star:hover { transform: scale(1.2); }

        .mwj-ot-choice-row { display: flex; gap: 10px; }
        .mwj-ot-choice-btn {
          flex: 1; padding: 10px; border-radius: 9px; cursor: pointer; font-weight: 800;
          background: white; border: 1.5px solid #e2e8f0; transition: all 0.18s ease; font-size: 13px;
        }
        .mwj-ot-choice-btn:hover { transform: translateY(-1px); }
        .mwj-ot-choice-yes-active { border-color: #22a35a !important; background: #f0fff4 !important; color: #276749 !important; }
        .mwj-ot-choice-no-active { border-color: #e53e3e !important; background: #fff5f5 !important; color: #c53030 !important; }

        .mwj-ot-review-textarea {
          width: 100%; padding: 10px 12px; border-radius: 9px; border: 1.5px solid #e2e8f0;
          height: 64px; box-sizing: border-box; font-family: inherit; font-size: 13.5px;
          transition: border-color 0.18s ease, box-shadow 0.18s ease; resize: vertical;
        }
        .mwj-ot-review-textarea:focus { outline: none; border-color: #E0872A; box-shadow: 0 0 0 3px rgba(224,135,42,0.14); }

        .mwj-ot-review-save {
          flex: 1; padding: 11px; border: none; border-radius: 10px; font-weight: 800;
          cursor: pointer; color: white; background: linear-gradient(135deg, #22a35a 0%, #1c8a4a 100%);
          box-shadow: 0 6px 16px rgba(34,163,90,0.28); transition: all 0.2s ease;
        }
        .mwj-ot-review-save:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.05); }
        .mwj-ot-review-save:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .mwj-ot-review-cancel {
          padding: 11px 18px; background: #f1f5f9; border: none; border-radius: 10px;
          cursor: pointer; font-weight: 700; color: #4a5568; transition: all 0.18s ease;
        }
        .mwj-ot-review-cancel:hover { background: #e2e8f0; }

        @media (max-width: 560px) {
          .mwj-ot-modal { padding: 18px; border-radius: 18px; }
          .mwj-ot-tabs { flex-direction: column; }
          .mwj-ot-delivery-code-box { flex-direction: column; align-items: flex-start; }
          .mwj-ot-choice-row { flex-direction: column; }
        }
      `}</style>

      <div className="mwj-ot-overlay" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
        <div className="mwj-ot-modal">

          <button onClick={onClose} className="mwj-ot-close" style={{ [isRtl ? 'left' : 'right']: '16px' }}>✕</button>

          <h3 className="mwj-ot-title">
            📦 {lang === 'ar' ? 'متابعة استفساراتي وطلباتي' : 'My Inquiries & Orders'}
          </h3>

          <div className="mwj-ot-tabs">
            {/* 1. طلبات الشراء النشطة */}
            <button
              onClick={() => setActiveTab('orders')}
              className={`mwj-ot-tab ${activeTab === 'orders' ? 'mwj-ot-tab-ord-active' : ''}`}
            >
              🛒 {lang === 'ar' ? 'طلبات الشراء' : 'Active Orders'} ({activeOrders.length})
            </button>

            {/* 2. طلباتي السابقة (بعد التقييم) */}
            <button
              onClick={() => setActiveTab('previous_orders')}
              className={`mwj-ot-tab ${activeTab === 'previous_orders' ? 'mwj-ot-tab-prev-active' : ''}`}
            >
              📜 {lang === 'ar' ? 'طلباتي السابقة' : 'Past Orders'} ({previousOrders.length})
            </button>

            {/* 3. طلباتي المخصصة */}
            <button
              onClick={() => setActiveTab('custom_requests')}
              className={`mwj-ot-tab ${activeTab === 'custom_requests' ? 'mwj-ot-tab-custom-active' : ''}`}
            >
              🛠️ {lang === 'ar' ? 'طلباتي المخصصة' : 'Custom Requests'} ({customRequests.length})
            </button>

            {/* 4. الاستفسارات */}
            <button
              onClick={() => setActiveTab('inquiries')}
              className={`mwj-ot-tab ${activeTab === 'inquiries' ? 'mwj-ot-tab-inq-active' : ''}`}
            >
              ❓ {lang === 'ar' ? 'الاستفسارات' : 'Inquiries'} ({activeInquiries.length})
              {confirmedInquiries.length > 0 && (
                <span className="mwj-ot-tab-count" style={{ [isRtl ? 'left' : 'right']: '-4px' }}>{confirmedInquiries.length}</span>
              )}
            </button>
          </div>

          {loading ? (
            <p className="mwj-ot-loading">⏳ {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
          ) : activeTab === 'custom_requests' ? (
            customRequests.length === 0 ? (
              <p className="mwj-ot-empty">{lang === 'ar' ? 'لا توجد طلبات قطع مخصصة حالياً.' : 'No custom requests found.'}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {customRequests.map(req => (
                  <div key={req.id} style={{ padding: '18px', border: '1px solid #e0872a', borderRadius: '16px', backgroundColor: '#fffdfa', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, backgroundColor: '#fff7ed', color: '#c2410c', padding: '3px 8px', borderRadius: '6px' }}>
                        #{req.id} - {req.make} {req.model} ({req.year})
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: req.status === 'pending' ? '#d97706' : '#16a34a' }}>
                        {req.status === 'pending' ? (isRtl ? '⏳ في انتظار التسعير' : '⏳ Pending Quotes') : (isRtl ? '🎉 وصلت عروض أسعار!' : '🎉 Quotes Received!')}
                      </span>
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f3a5f', marginBottom: '8px' }}>
                      🛠️ {req.notes}
                    </div>

                    <button
                      onClick={() => handleViewQuotes(req)}
                      style={{ width: '100%', padding: '10px', backgroundColor: '#e0872a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '13.5px', cursor: 'pointer', marginTop: '6px' }}
                    >
                      🔍 {isRtl ? 'عرض عروض أسعار الكراجات والمقارنة' : 'View Garage Quotes'}
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'inquiries' ? (
            activeInquiries.length === 0 ? (
              <p className="mwj-ot-empty">{lang === 'ar' ? 'لا توجد استفسارات متوافقة حالياً.' : 'No active inquiries found.'}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {activeInquiries.map(inq => (
                  <div key={inq.id} className={`mwj-ot-inq-card ${inq.status === 'confirmed_compatible' ? 'mwj-ot-inq-confirmed' : 'mwj-ot-inq-default'}`}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '11px', flexWrap: 'wrap', gap: '8px' }}>
                      <span className="mwj-ot-inq-code">{lang === 'ar' ? 'كود الاستفسار:' : 'Inquiry Code:'} {inq.inquiry_code || `#INQ-${inq.id}`}</span>
                      <span className="mwj-ot-inq-status" style={{ color: inq.status === 'pending_check' ? '#c05621' : inq.status === 'confirmed_compatible' ? '#22a35a' : '#e53e3e' }}>
                        {inq.status === 'pending_check' ? (lang === 'ar' ? '⏳ بانتظار فحص الكراج' : '⏳ Pending Check') : 
                         inq.status === 'confirmed_compatible' ? (lang === 'ar' ? '✅ تم تأكيد التوافق!' : '✅ Compatible!') : 
                         (lang === 'ar' ? '❌ لا تركب' : '❌ Not Compatible')}
                      </span>
                    </div>

                    <div className="mwj-ot-part-row">
                      <img src={inq.part_image || inq.image_url || 'https://via.placeholder.com/60'} alt={inq.part_name} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ fontSize: '15px', color: '#16304f' }}>
                          <AITranslatedText text={inq.part_name} lang={lang} />
                        </strong>
                        <div style={{ fontSize: '13px', color: '#E0872A', fontWeight: 800 }}>{inq.part_price || 0} {lang === 'ar' ? 'ر.ق' : 'QAR'}</div>
                      </div>
                    </div>

                    <div className="mwj-ot-vehicle-line">
                      🚘 {lang === 'ar' ? 'سيارتك:' : 'Your Car:'} {inq.car_make} {inq.car_model} ({inq.car_year})
                    </div>

                    {inq.status === 'confirmed_compatible' && (
                      <div className="mwj-ot-confirmed-box">
                        <div style={{ fontWeight: 800, color: '#276749', marginBottom: '4px' }}>
                          {lang === 'ar' ? '🎉 الكراج يؤكد: القطعة متوافقة 100% مع سيارتك!' : '🎉 Garage confirms: Part is 100% compatible!'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#4a5568', marginBottom: '4px' }}>
                          {lang === 'ar' ? `🛡️ مهلة الإرجاع: ${inq.return_days || 3} أيام | ضمان التشغيل: ${inq.warranty_days || 14} يوماً` : `🛡️ Return Window: ${inq.return_days || 3} days | Warranty: ${inq.warranty_days || 14} days`}
                        </div>

                        <button
                          onClick={() => {
                            onClose();
                            if (onSelectPartForCheckout) {
                              onSelectPartForCheckout({
                                id: inq.part_id,
                                inquiry_id: inq.id,
                                name: inq.part_name,
                                price: inq.part_price,
                                image_url: inq.part_image || inq.image_url,
                                image: inq.part_image || inq.image_url,
                                user_id: inq.garage_id,
                                make: inq.car_make,
                                model: inq.car_model,
                                year: inq.car_year
                              });
                            }
                          }}
                          className="mwj-ot-checkout-btn"
                        >
                          🛒 {lang === 'ar' ? 'إتمام الشراء والتوصيل الآن' : 'Complete Checkout & Delivery Now'}
                        </button>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'orders' ? (
            activeOrders.length === 0 ? (
              <p className="mwj-ot-empty">{lang === 'ar' ? 'لا توجد طلبات شراء نشطة حالياً.' : 'No active purchase orders found.'}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {activeOrders.map(order => (
                  <div key={order.id} className="mwj-ot-order-card">

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <span className="mwj-ot-order-code">{lang === 'ar' ? 'رمز الطلب:' : 'Order Code:'} {order.order_code || `#ORD-${order.id}`}</span>
                      <span className="mwj-ot-order-status" style={{ color: (order.status === 'delivered' || order.status === 'completed') ? '#22a35a' : '#c05621' }}>
                        {order.status === 'ready_for_pickup' ? (lang === 'ar' ? '📦 القطعة جاهزة وفي انتظار المندوب' : '📦 Ready, waiting for driver') : 
                         order.status === 'handed_to_driver' ? (lang === 'ar' ? '🚚 القطعة مع المندوب وفي الطريق إليك' : '🚚 Out for delivery') : 
                         (order.status === 'delivered' || order.status === 'completed') ? (lang === 'ar' ? '✅ تم التسليم (بانتظار التقييم)' : '✅ Delivered (Pending Review)') : 
                         (lang === 'ar' ? '⏳ جاري التجهيز' : '⏳ Processing')}
                      </span>
                    </div>

                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#2d3748', marginBottom: '10px' }}>
                      <AITranslatedText text={order.part_name} lang={lang} />
                    </div>

                    {order.status !== 'delivered' && order.status !== 'completed' && (
                      <div className="mwj-ot-delivery-code-box">
                        <div>
                          <span style={{ display: 'block', fontSize: '11px', color: '#c05621', fontWeight: 800 }}>
                            {lang === 'ar' ? '🔑 كود التسليم الخاص بك:' : '🔑 Your Delivery Code:'}
                          </span>
                          <span className="mwj-ot-delivery-code">{order.delivery_code || 'DEL-882'}</span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#718096', maxWidth: '180px' }}>
                          {lang === 'ar' ? 'أبرز هذا الكود للمندوب أو موظف المقر عند استلام القطعة.' : 'Show this code to the driver upon receiving.'}
                        </span>
                      </div>
                    )}

                    {/* زر التقييم يظهر عند اكتمال الطلب - بمجرد الضغط عليه وحفظه سيختفي الطلب من هنا */}
                    {(order.status === 'delivered' || order.status === 'completed') && (
                      <button onClick={() => setSelectedOrderForReview(order)} className="mwj-ot-review-btn">
                        ⭐ {lang === 'ar' ? 'قيّم التجربة لإنهاء الطلب' : 'Rate to complete order'}
                      </button>
                    )}

                  </div>
                ))}
              </div>
            )
          ) : ( // التبويب الأخير: previous_orders (الطلبات السابقة المقيمة)
            previousOrders.length === 0 ? (
              <p className="mwj-ot-empty">{lang === 'ar' ? 'لا توجد طلبات سابقة مُقيّمة.' : 'No reviewed past orders found.'}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {previousOrders.map(order => (
                  <div key={order.id} className="mwj-ot-order-card" style={{ opacity: 0.85 }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <span className="mwj-ot-order-code" style={{ backgroundColor: '#e2e8f0', color: '#475569' }}>
                        {lang === 'ar' ? 'طلب مكتمل:' : 'Completed Order:'} {order.order_code || `#ORD-${order.id}`}
                      </span>
                      <span className="mwj-ot-order-status" style={{ color: '#475569' }}>
                        ✅ {lang === 'ar' ? 'مكتمل ومُقيّم' : 'Completed & Reviewed'}
                      </span>
                    </div>

                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#475569', marginBottom: '10px' }}>
                      <AITranslatedText text={order.part_name} lang={lang} />
                    </div>

                    <button onClick={() => setSelectedOrderForReview(order)} className="mwj-ot-review-btn mwj-ot-review-btn-secondary" style={{ padding: '8px' }}>
                      ⭐ {lang === 'ar' ? 'تحديث التقييم' : 'Update Review'}
                    </button>

                  </div>
                ))}
              </div>
            )
          )}

          {/* 🏷️ نافذة عرض عروض الأسعار والمقارنة بين الكراجات */}
          {selectedRequestQuotes && (
            <div className="mwj-ot-review-overlay">
              <div className="mwj-ot-review-modal" style={{ maxWidth: '600px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h4 style={{ margin: 0, color: '#1f3a5f', fontWeight: 'bold' }}>
                    🏷️ عروض أسعار الكراجات لطلب #{selectedRequestQuotes.request.id}
                  </h4>
                  <button onClick={() => setSelectedRequestQuotes(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✖</button>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px' }}>
                  <strong>السيارة:</strong> {selectedRequestQuotes.request.make} {selectedRequestQuotes.request.model} ({selectedRequestQuotes.request.year})<br />
                  <strong>القطعة المطلوبة:</strong> {selectedRequestQuotes.request.notes}
                </div>

                {selectedRequestQuotes.quotes.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0' }}>لم تقم الكراجات بتقديم عروض أسعار حتى الآن. يرجى الانتظار قليلاً ⏳</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedRequestQuotes.quotes.map((q) => (
                      <div key={q.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '14px', backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <strong style={{ fontSize: '15px', color: '#1f3a5f' }}>🏬 {q.garage_name || 'كراج معتمد'}</strong>
                          <span style={{ fontSize: '18px', fontWeight: '900', color: '#e0872a' }}>{q.price} QAR</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12.5px', color: '#475569', marginBottom: '10px' }}>
                          <div>⚙️ <strong>نوع القطعة:</strong> {q.part_type}</div>
                          <div>✨ <strong>الحالة:</strong> {q.part_condition}</div>
                          <div>🛡️ <strong>الضمان:</strong> {q.warranty || 'بدون ضمان'}</div>
                          {q.garage_notes && <div>💬 <strong>ملاحظة:</strong> {q.garage_notes}</div>}
                        </div>

                        <button
                          onClick={() => {
                            setSelectedRequestQuotes(null);
                            onClose();
                            if (onSelectPartForCheckout) {
                              onSelectPartForCheckout({
                                id: `custom-${q.id}`,
                                name: `${selectedRequestQuotes.request.notes} (${q.part_type})`,
                                price: q.price,
                                image_url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80',
                                image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80',
                                user_id: q.garage_id,
                                make: selectedRequestQuotes.request.make,
                                model: selectedRequestQuotes.request.model,
                                year: selectedRequestQuotes.request.year
                              });
                            }
                          }}
                          style={{ width: '100%', padding: '11px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13.5px' }}
                        >
                          🛒 قبول العرض والشراء فوراً
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ⭐️ شاشة التقييم المنبثقة الفعالة */}
          {selectedOrderForReview && (
            <div className="mwj-ot-review-overlay">
              <div className="mwj-ot-review-modal">
                <h4 style={{ margin: '0 0 14px 0', color: '#16304f', fontWeight: 800 }}>
                  ⭐ {lang === 'ar' ? 'تقييم التجربة لطلب:' : 'Rate Experience for:'} <AITranslatedText text={selectedOrderForReview.part_name} lang={lang} />
                </h4>

                <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* 1. تقييم الكراج والجودة */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '5px', color: '#334155' }}>
                      🏪 {lang === 'ar' ? 'تقييم جودة القطعة وتجاوب الكراج:' : 'Rate part quality & garage response:'}
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} type="button" onClick={() => setGarageRating(star)} className="mwj-ot-star" style={{ opacity: star <= garageRating ? 1 : 0.3 }}>⭐</button>
                      ))}
                    </div>
                  </div>

                  {/* 2. تقييم المندوب والتوصيل */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '5px', color: '#334155' }}>
                      🚚 {lang === 'ar' ? 'تقييم سرعة وأسلوب مندوب التوصيل:' : 'Rate delivery speed & driver behavior:'}
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} type="button" onClick={() => setDeliveryRating(star)} className="mwj-ot-star" style={{ opacity: star <= deliveryRating ? 1 : 0.3 }}>⭐</button>
                      ))}
                    </div>
                  </div>

                  {/* 3. تقييم تجربة الموقع ورضا العميل */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '5px', color: '#334155' }}>
                      🌐 {lang === 'ar' ? 'تقييم موقع موجود أوتو وسهولة الطلب:' : 'Rate Mawjood Auto & ordering ease:'}
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} type="button" onClick={() => setWebsiteRating(star)} className="mwj-ot-star" style={{ opacity: star <= websiteRating ? 1 : 0.3 }}>⭐</button>
                      ))}
                    </div>
                  </div>

                  {/* مطابقة الوصف */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '7px', color: '#334155' }}>
                      {lang === 'ar' ? 'هل طابقت القطعة الوصف تماماً؟' : 'Did the part perfectly match the description?'}
                    </label>
                    <div className="mwj-ot-choice-row">
                      <button type="button" onClick={() => setAsDescribed(true)} className={`mwj-ot-choice-btn ${asDescribed ? 'mwj-ot-choice-yes-active' : ''}`}>✅ {lang === 'ar' ? 'نعم، مطابقة' : 'Yes, matches'}</button>
                      <button type="button" onClick={() => setAsDescribed(false)} className={`mwj-ot-choice-btn ${!asDescribed ? 'mwj-ot-choice-no-active' : ''}`}>❌ {lang === 'ar' ? 'بها اختلاف' : 'No, different'}</button>
                    </div>
                  </div>

                  {/* تعليق إضافي */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '7px', color: '#334155' }}>
                      {lang === 'ar' ? 'ملاحظات أو تعليق إضافي (اختياري):' : 'Additional comments (Optional):'}
                    </label>
                    <textarea placeholder={lang === 'ar' ? 'اكتب رأيك لتطوير خدمتنا...' : 'Write your feedback...'} value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} className="mwj-ot-review-textarea" />
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="submit" disabled={submittingReview} className="mwj-ot-review-save">
                      {submittingReview ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (lang === 'ar' ? 'حفظ التقييم 🚀' : 'Submit Review 🚀')}
                    </button>
                    <button type="button" onClick={() => setSelectedOrderForReview(null)} className="mwj-ot-review-cancel">
                      {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                </form>

              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};
