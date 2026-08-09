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

  // حالة تقييم الكراج الفعالة
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<any | null>(null);
  const [garageRating, setGarageRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [websiteRating, setWebsiteRating] = useState(5);
  const [asDescribed, setAsDescribed] = useState(true);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const isRtl = lang === 'ar';

  useEffect(() => {
    fetchData();
  }, [customerPhone, session]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const email = (session?.email || session?.user?.email || '').trim();
      const phone = (customerPhone || session?.phone || session?.user?.phone || session?.user?.user_metadata?.phone || '').trim();

      console.log("🕵️ جاري الفحص - الإيميل:", email, "| الهاتف:", phone);

      // بناء مصفوفة الشروط المقبولة فقط (غير الفارغة)
      const queryParts: string[] = [];
      if (email) {
        queryParts.push(`customer_email.eq.${encodeURIComponent(email)}`);
      }
      if (phone) {
        queryParts.push(`customer_phone.eq.${encodeURIComponent(phone)}`);
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone && cleanPhone !== phone) {
          queryParts.push(`customer_phone.eq.${encodeURIComponent(cleanPhone)}`);
        }
      }

      // إذا لم يكن هناك إيميل أو هاتف، لا ترسل طلبات خطأ
      if (queryParts.length === 0) {
        console.warn("⚠️ لا يوجد بريد أو رقم هاتف للجلسة الحالية.");
        setLoading(false);
        return;
      }

      // الصيغة المعتمدة لـ Supabase REST API هي or=(cond1,cond2)
      const filterParam = `or=(${queryParts.join(',')})`;

      const [resOrders, resInquiries, resCustom] = await Promise.all([
        fetch(`${supabaseUrl}/orders?${filterParam}&order=id.desc`, {
          headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` }
        }),
        fetch(`${supabaseUrl}/fitment_inquiries?${filterParam}&order=id.desc`, {
          headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` }
        }),
        fetch(`${supabaseUrl}/custom_part_requests?${filterParam}&order=id.desc`, {
          headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` }
        })
      ]);

      if (resOrders.ok) {
        const ordersData = await resOrders.json();
        console.log("✅ تم جلب الطلبات بنجاح:", ordersData);
        setOrders(ordersData);
      } else {
        console.error("❌ فشل طلب الطلبات:", await resOrders.text());
      }

      if (resInquiries.ok) setInquiries(await resInquiries.json());
      if (resCustom.ok) setCustomRequests(await resCustom.json());

    } catch (e) {
      console.error("❌ خطأ غير متوقع:", e);
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

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForReview) return;
    setSubmittingReview(true);

    try {
      const payload = {
        garage_id: selectedOrderForReview.garage_id,
        order_id: selectedOrderForReview.id,
        customer_phone: customerPhone || session?.phone || session?.email || '',
        garage_rating: garageRating,
        delivery_rating: deliveryRating,
        website_rating: websiteRating,
        as_described: asDescribed,
        comment: reviewComment.trim() || null
      };

      await fetch(`${supabaseUrl}/garage_reviews`, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${session?.token || apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

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

      alert(lang === 'ar' ? 'شكراً لك! تم تسجيل تقييمك ونقل الطلب لـ "طلباتي السابقة" ⭐' : 'Thank you! Your feedback has been submitted.');
      setSelectedOrderForReview(null);
      setReviewComment('');
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

        .mwj-ot-inq-card { padding: 18px; border-radius: 16px; transition: all 0.2s ease; margin-bottom: 15px; border: 1px solid #e2e8f0; background: #f8fafc; }
        .mwj-ot-order-card { padding: 18px; border: 1px solid #eef1f5; border-radius: 16px; background: #f8fafc; margin-bottom: 15px; }
        
        .mwj-ot-review-btn {
          width: 100%; padding: 11px; border: none; border-radius: 10px; font-weight: 800;
          cursor: pointer; font-size: 13.5px; color: white;
          background: linear-gradient(135deg, #7c5fd0 0%, #6947b8 100%);
          box-shadow: 0 6px 16px rgba(107,70,193,0.28);
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
        .mwj-ot-star { font-size: 22px; background: none; border: none; cursor: pointer; padding: 2px; }
        .mwj-ot-review-save { flex: 1; padding: 11px; border: none; border-radius: 10px; font-weight: 800; cursor: pointer; color: white; background: #22a35a; }
        .mwj-ot-review-cancel { padding: 11px 18px; background: #f1f5f9; border: none; border-radius: 10px; cursor: pointer; font-weight: 700; color: #4a5568; }
        
        .mwj-ot-choice-row { display: flex; gap: 10px; }
        .mwj-ot-choice-btn { flex: 1; padding: 10px; border-radius: 9px; cursor: pointer; font-weight: 800; background: white; border: 1.5px solid #e2e8f0; font-size: 13px; }
        .mwj-ot-choice-yes-active { border-color: #22a35a !important; background: #f0fff4 !important; color: #276749 !important; }
        .mwj-ot-choice-no-active { border-color: #e53e3e !important; background: #fff5f5 !important; color: #c53030 !important; }
        .mwj-ot-review-textarea { width: 100%; padding: 10px 12px; border-radius: 9px; border: 1.5px solid #e2e8f0; height: 64px; resize: vertical; }
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
                  <div key={inq.id} className="mwj-ot-inq-card">
                    <strong style={{ fontSize: '15px', color: '#16304f' }}><AITranslatedText text={inq.part_name} lang={lang} /></strong>
                    <div style={{ fontSize: '13px', color: '#E0872A', fontWeight: 800 }}>{inq.part_price || 0} {lang === 'ar' ? 'ر.ق' : 'QAR'}</div>
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
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#2d3748', marginBottom: '10px' }}>
                      <AITranslatedText text={order.part_name} lang={lang} />
                    </div>
                    {(order.status === 'delivered' || order.status === 'completed') && (
                      <button onClick={() => setSelectedOrderForReview(order)} className="mwj-ot-review-btn">
                        ⭐ {lang === 'ar' ? 'قيّم التجربة لإنهاء الطلب' : 'Rate to complete order'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : (
            previousOrders.length === 0 ? (
              <p className="mwj-ot-empty">{lang === 'ar' ? 'لا توجد طلبات سابقة مُقيّمة.' : 'No reviewed past orders found.'}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {previousOrders.map(order => (
                  <div key={order.id} className="mwj-ot-order-card" style={{ opacity: 0.88 }}>
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

          {selectedOrderForReview && (
            <div className="mwj-ot-review-overlay">
              <div className="mwj-ot-review-modal">
                <h4 style={{ margin: '0 0 14px 0', color: '#16304f', fontWeight: 800 }}>⭐ تقييم التجربة</h4>
                <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '5px' }}>🏪 تقييم الكراج:</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} type="button" onClick={() => setGarageRating(star)} className="mwj-ot-star" style={{ opacity: star <= garageRating ? 1 : 0.3 }}>⭐</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '5px' }}>🚚 تقييم التوصيل:</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} type="button" onClick={() => setDeliveryRating(star)} className="mwj-ot-star" style={{ opacity: star <= deliveryRating ? 1 : 0.3 }}>⭐</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '5px' }}>🌐 تقييم الموقع:</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} type="button" onClick={() => setWebsiteRating(star)} className="mwj-ot-star" style={{ opacity: star <= websiteRating ? 1 : 0.3 }}>⭐</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '7px' }}>هل طابقت القطعة الوصف تماماً؟</label>
                    <div className="mwj-ot-choice-row">
                      <button type="button" onClick={() => setAsDescribed(true)} className={`mwj-ot-choice-btn ${asDescribed ? 'mwj-ot-choice-yes-active' : ''}`}>✅ نعم، مطابقة</button>
                      <button type="button" onClick={() => setAsDescribed(false)} className={`mwj-ot-choice-btn ${!asDescribed ? 'mwj-ot-choice-no-active' : ''}`}>❌ بها اختلاف</button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '7px' }}>ملاحظات أو تعليق إضافي:</label>
                    <textarea placeholder="اكتب رأيك لتطوير خدمتنا..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} className="mwj-ot-review-textarea" />
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="submit" disabled={submittingReview} className="mwj-ot-review-save">حفظ التقييم 🚀</button>
                    <button type="button" onClick={() => setSelectedOrderForReview(null)} className="mwj-ot-review-cancel">إلغاء</button>
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
