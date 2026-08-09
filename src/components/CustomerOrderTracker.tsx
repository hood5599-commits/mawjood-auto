/* eslint-disable @typescript-eslint/no-unused-vars */
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
  const [activeTab, setActiveTab] = useState<'inquiries' | 'orders' | 'previous_orders' | 'custom_requests'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [customRequests, setCustomRequests] = useState<any[]>([]);
  const [selectedRequestQuotes, setSelectedRequestQuotes] = useState<{ request: any; quotes: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  // حالة التقييم المحدثة والجديدة
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<any | null>(null);
  const [garageRating, setGarageRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [platformRating, setPlatformRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const isRtl = lang === 'ar';
  const targetIdentifier = customerPhone || session?.email || session?.user?.email || '';

  useEffect(() => {
    fetchData();
  }, [customerPhone, session]);

  const fetchData = async () => {
    if (!targetIdentifier) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const encodedId = encodeURIComponent(targetIdentifier);
      const ordersUrl = `${supabaseUrl}/orders?or=(customer_phone.ilike.${encodedId},customer_phone.eq.${encodedId})&order=id.desc`;
      const inqUrl = `${supabaseUrl}/fitment_inquiries?or=(customer_phone.ilike.${encodedId},customer_phone.eq.${encodedId})&order=id.desc`;
      const customUrl = `${supabaseUrl}/custom_part_requests?or=(customer_phone.ilike.${encodedId},customer_phone.eq.${encodedId})&order=id.desc`;

      const [resOrders, resInquiries, resCustom] = await Promise.all([
        fetch(ordersUrl, { headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` } }),
        fetch(inqUrl, { headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` } }),
        fetch(customUrl, { headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` } })
      ]);

      if (resOrders.ok) setOrders(await resOrders.json());
      if (resInquiries.ok) setInquiries(await resInquiries.json());
      if (resCustom.ok) setCustomRequests(await resCustom.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleViewQuotes = async (request: any) => {
    try {
      const res = await fetch(`${supabaseUrl}/garage_quotes?request_id=eq.${request.id}&order=id.desc`, {
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

  // دالة تقديم التقييم المدمجة والجديدة
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForReview) return;
    setSubmittingReview(true);

    try {
      const payload = {
        order_id: selectedOrderForReview.id,
        garage_id: selectedOrderForReview.garage_id || 'garage_unknown',
        customer_phone: targetIdentifier,
        garage_rating: garageRating,
        delivery_rating: deliveryRating,
        platform_rating: platformRating,
        comment: reviewComment.trim() || null,
        created_at: new Date().toISOString()
      };

      // 1. حفظ التقييم في جدول التقييمات الشامل
      await fetch(`${supabaseUrl}/order_reviews`, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${session?.token || apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      // 2. تحديث الطلب كـ "تم تقييمه"
      await fetch(`${supabaseUrl}/orders?id=eq.${selectedOrderForReview.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${session?.token || apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rating: garageRating,
          is_reviewed: true
        })
      });

      alert(lang === 'ar' ? 'شكراً لك! تم تسليم تقييمك ونقل الطلب للأرشيف ⭐' : 'Feedback submitted successfully!');
      setSelectedOrderForReview(null);
      setReviewComment('');
      setGarageRating(5);
      setDeliveryRating(5);
      setPlatformRating(5);
      fetchData();
      setActiveTab('previous_orders');
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingReview(false);
    }
  };

  const activeInquiries = inquiries.filter(i => i.status !== 'ordered');
  const activeOrders = orders.filter(o => !o.is_reviewed && o.status !== 'cancelled');
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

        .mwj-ot-loading, .mwj-ot-empty { text-align: center; color: #94a3b8; padding: 36px 0; font-size: 14px; }

        .mwj-ot-order-card { padding: 18px; border: 1px solid #eef1f5; border-radius: 16px; background: #f8fafc; margin-bottom: 15px; }
        .mwj-ot-order-code { font-size: 11.5px; font-weight: 800; background: #ebf8ff; color: #2b6cb0; padding: 3px 9px; border-radius: 7px; }
        .mwj-ot-order-status { font-size: 13px; font-weight: 800; }

        .mwj-ot-delivery-code-box {
          background: linear-gradient(135deg, #fffaf3 0%, #fff3e2 100%); padding: 12px 14px; border-radius: 12px;
          border: 1px solid #feebc8; display: flex; justify-content: space-between;
          align-items: center; margin: 10px 0; gap: 10px; flex-wrap: wrap;
        }
        .mwj-ot-delivery-code { font-size: 18px; font-weight: 800; font-family: 'Courier New', monospace; color: #c9701c; letter-spacing: 0.5px; }
        
        .mwj-ot-review-btn {
          width: 100%; padding: 11px; border: none; border-radius: 10px; font-weight: 800;
          cursor: pointer; font-size: 13.5px; color: white;
          background: linear-gradient(135deg, #7c5fd0 0%, #6947b8 100%);
          box-shadow: 0 6px 16px rgba(107,70,193,0.28); margin-top: 6px;
        }
        .mwj-ot-review-btn-secondary { background: linear-gradient(135deg, #64748b 0%, #475569 100%); }

        .mwj-ot-review-overlay {
          position: fixed; inset: 0; background: rgba(15,23,32,0.65); backdrop-filter: blur(3px);
          display: flex; justify-content: center; align-items: center; z-index: 1100; padding: 20px;
        }
        .mwj-ot-review-modal {
          background: white; padding: 26px; border-radius: 18px; max-width: 480px; width: 92%;
          box-shadow: 0 20px 50px rgba(0,0,0,0.28); max-height: 85vh; overflow-y: auto;
        }
        .mwj-ot-star { font-size: 24px; background: none; border: none; cursor: pointer; padding: 2px; }
      `}</style>

      <div className="mwj-ot-overlay" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
        <div className="mwj-ot-modal">

          <button onClick={onClose} className="mwj-ot-close" style={{ [isRtl ? 'left' : 'right']: '16px' }}>✕</button>

          <h3 className="mwj-ot-title">
            📦 {lang === 'ar' ? 'متابعة استفساراتي وطلباتي' : 'My Inquiries & Orders'}
          </h3>

          <div className="mwj-ot-tabs">
            <button onClick={() => setActiveTab('orders')} className={`mwj-ot-tab ${activeTab === 'orders' ? 'mwj-ot-tab-ord-active' : ''}`}>
              🛒 {lang === 'ar' ? 'طلبات الشراء' : 'Active Orders'} ({activeOrders.length})
            </button>
            <button onClick={() => setActiveTab('previous_orders')} className={`mwj-ot-tab ${activeTab === 'previous_orders' ? 'mwj-ot-tab-prev-active' : ''}`}>
              📜 {lang === 'ar' ? 'طلباتي السابقة' : 'Past Orders'} ({previousOrders.length})
            </button>
            <button onClick={() => setActiveTab('custom_requests')} className={`mwj-ot-tab ${activeTab === 'custom_requests' ? 'mwj-ot-tab-custom-active' : ''}`}>
              🛠️ {lang === 'ar' ? 'طلباتي المخصصة' : 'Custom Requests'} ({customRequests.length})
            </button>
            <button onClick={() => setActiveTab('inquiries')} className={`mwj-ot-tab ${activeTab === 'inquiries' ? 'mwj-ot-tab-inq-active' : ''}`}>
              ❓ {lang === 'ar' ? 'الاستفسارات' : 'Inquiries'} ({activeInquiries.length})
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
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#c2410c', marginBottom: '6px' }}>#{req.id} - {req.make} {req.model} ({req.year})</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f3a5f', marginBottom: '8px' }}>🛠️ {req.notes}</div>
                    <button onClick={() => handleViewQuotes(req)} style={{ width: '100%', padding: '10px', backgroundColor: '#e0872a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                      🔍 {lang === 'ar' ? 'عرض عروض الأسعار' : 'View Quotes'}
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
                  <div key={inq.id} className="mwj-ot-order-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span className="mwj-ot-order-code">#{inq.inquiry_code || `INQ-${inq.id}`}</span>
                      <span className="mwj-ot-order-status" style={{ color: inq.status === 'confirmed_compatible' ? '#22a35a' : '#c05621' }}>
                        {inq.status === 'confirmed_compatible' ? '✅ متوافق 100%' : '⏳ بانتظار التأكيد'}
                      </span>
                    </div>
                    <strong style={{ fontSize: '15px', color: '#16304f', display: 'block' }}><AITranslatedText text={inq.part_name} lang={lang} /></strong>
                    <div style={{ fontSize: '13px', color: '#E0872A', fontWeight: 800, marginTop: '4px' }}>{inq.part_price || 0} {lang === 'ar' ? 'ر.ق' : 'QAR'}</div>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span className="mwj-ot-order-code">{order.order_code || `#ORD-${order.id}`}</span>
                      <span className="mwj-ot-order-status" style={{ color: order.status === 'delivered' ? '#22a35a' : '#c05621' }}>
                        {order.status === 'delivered' ? (lang === 'ar' ? '✅ تم التسليم' : '✅ Delivered') : (lang === 'ar' ? '⏳ جاري التجهيز/التوصيل' : '⏳ Processing')}
                      </span>
                    </div>

                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#2d3748', marginBottom: '8px' }}>
                      <AITranslatedText text={order.part_name} lang={lang} />
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#e0872a', marginBottom: '8px' }}>
                      {order.price} QAR
                    </div>

                    {order.delivery_code && (
                      <div className="mwj-ot-delivery-code-box">
                        <div>
                          <span style={{ display: 'block', fontSize: '11px', color: '#c05621', fontWeight: 800 }}>
                            🔑 {lang === 'ar' ? 'كود التسليم للمندوب:' : 'Delivery Code:'}
                          </span>
                          <span className="mwj-ot-delivery-code">{order.delivery_code}</span>
                        </div>
                      </div>
                    )}

                    {(order.status === 'delivered' || order.status === 'completed') && (
                      <button onClick={() => setSelectedOrderForReview(order)} className="mwj-ot-review-btn">
                        ⭐ {lang === 'ar' ? 'قيّم التجربة لإنهاء الطلب' : 'Rate to complete order'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'previous_orders' ? (
            previousOrders.length === 0 ? (
              <p className="mwj-ot-empty">{lang === 'ar' ? 'لا توجد طلبات سابقة مُقيّمة.' : 'No reviewed past orders found.'}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {previousOrders.map(order => (
                  <div key={order.id} className="mwj-ot-order-card" style={{ opacity: 0.95 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span className="mwj-ot-order-code" style={{ backgroundColor: '#e2e8f0', color: '#475569' }}>
                        {order.order_code || `#ORD-${order.id}`}
                      </span>
                      <span className="mwj-ot-order-status" style={{ color: '#22a35a' }}>
                        ✅ {lang === 'ar' ? 'مكـتمل ومُقيّم' : 'Completed'}
                      </span>
                    </div>

                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#1f3a5f', marginBottom: '6px' }}>
                      <AITranslatedText text={order.part_name} lang={lang} />
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#e0872a', marginBottom: '10px' }}>
                      {order.price} QAR
                    </div>

                    <button onClick={() => setSelectedOrderForReview(order)} className="mwj-ot-review-btn mwj-ot-review-btn-secondary" style={{ padding: '8px' }}>
                      ⭐ {lang === 'ar' ? 'تحديث التقييم' : 'Update Review'}
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : null}

          {/* مودال عروض الأسعار للطلبات المخصصة */}
          {selectedRequestQuotes && (
            <div className="mwj-ot-review-overlay">
              <div className="mwj-ot-review-modal" style={{ maxWidth: '600px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h4 style={{ margin: 0, color: '#1f3a5f', fontWeight: 'bold' }}>🏷️ عروض الأسعار</h4>
                  <button onClick={() => setSelectedRequestQuotes(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✖</button>
                </div>
                {selectedRequestQuotes.quotes.map((q) => (
                  <div key={q.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '14px', marginBottom: '10px' }}>
                    <strong>{q.garage_name || 'كراج معتمد'}</strong> - <span style={{ color: '#e0872a', fontWeight: 'bold' }}>{q.price} QAR</span>
                    {onSelectPartForCheckout && (
                      <button
                        onClick={() => {
                          setSelectedRequestQuotes(null);
                          onClose();
                          onSelectPartForCheckout({
                            id: `custom-${q.id}`,
                            name: `${selectedRequestQuotes.request.notes} (${q.part_type || 'قطعة مخصصة'})`,
                            price: q.price,
                            user_id: q.garage_id
                          });
                        }}
                        style={{ width: '100%', marginTop: '8px', padding: '8px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        🛒 قبول العرض والشراء
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* مودال التقييم الشامل المدمج */}
          {selectedOrderForReview && (
            <div className="mwj-ot-review-overlay">
              <div className="mwj-ot-review-modal" style={{ maxWidth: '480px', padding: '24px', borderRadius: '18px', backgroundColor: 'white' }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#16304f', fontSize: '18px', fontWeight: 'bold', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
                  ⭐ {lang === 'ar' ? 'تقييم التجربة والخدمة' : 'Rate Experience & Service'}
                </h3>

                <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* 1. تقييم الكراج والقطعة */}
                  <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#1e293b', marginBottom: '6px' }}>
                      🏪 {lang === 'ar' ? '1. تقييم الكراج وجودة القطعة:' : '1. Garage & Part Quality:'}
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} type="button" onClick={() => setGarageRating(star)} className="mwj-ot-star" style={{ opacity: star <= garageRating ? 1 : 0.25 }}>⭐</button>
                      ))}
                    </div>
                  </div>

                  {/* 2. تقييم التوصيل والدليفري */}
                  <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#1e293b', marginBottom: '6px' }}>
                      🚚 {lang === 'ar' ? '2. تقييم سرعة وسلوك مندوب التوصيل:' : '2. Delivery Speed & Driver:'}
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} type="button" onClick={() => setDeliveryRating(star)} className="mwj-ot-star" style={{ opacity: star <= deliveryRating ? 1 : 0.25 }}>⭐</button>
                      ))}
                    </div>
                  </div>

                  {/* 3. تقييم الموقع والتطبيق */}
                  <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#1e293b', marginBottom: '6px' }}>
                      🌐 {lang === 'ar' ? '3. تقييم سهولة استخدام تطبيق موجود أوتو:' : '3. Mawjood Auto App Experience:'}
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} type="button" onClick={() => setPlatformRating(star)} className="mwj-ot-star" style={{ opacity: star <= platformRating ? 1 : 0.25 }}>⭐</button>
                      ))}
                    </div>
                  </div>

                  {/* 4. حقل كتابة الملاحظة */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#1e293b', marginBottom: '6px' }}>
                      📝 {lang === 'ar' ? 'ملاحظات أو مقترحات إضافية (اختياري):' : 'Additional Comments (Optional):'}
                    </label>
                    <textarea
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder={lang === 'ar' ? 'اكتب انطباعك أو أي ملاحظة تود مشاركتها معنا...' : 'Share your feedback...'}
                      style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button type="submit" disabled={submittingReview} style={{ flex: 1, padding: '12px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>
                      {submittingReview ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (lang === 'ar' ? 'حفظ التقييم 🚀' : 'Submit Review 🚀')}
                    </button>
                    <button type="button" onClick={() => setSelectedOrderForReview(null)} style={{ padding: '12px 18px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>
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
