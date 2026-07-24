import React, { useState, useEffect } from 'react';

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
  const [activeTab, setActiveTab] = useState<'inquiries' | 'orders'>('inquiries');
  const [orders, setOrders] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedOrderForReview, setSelectedOrderForReview] = useState<any | null>(null);
  const [starRating, setStarRating] = useState(5);
  const [asDescribed, setAsDescribed] = useState(true);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchData();
  }, [customerPhone]);

  const fetchData = async () => {
    if (!customerPhone) return;
    setLoading(true);
    try {
      const [resOrders, resInquiries] = await Promise.all([
        fetch(`${supabaseUrl}/orders?customer_phone=eq.${customerPhone}&order=id.desc`, { headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` } }),
        fetch(`${supabaseUrl}/fitment_inquiries?customer_phone=eq.${customerPhone}&order=id.desc`, { headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` } })
      ]);

      if (resOrders.ok) setOrders(await resOrders.json());
      if (resInquiries.ok) setInquiries(await resInquiries.json());
    } catch (e) {
    } finally {
      setLoading(false);
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
        customer_phone: customerPhone,
        rating: starRating,
        as_described: asDescribed,
        comment: reviewComment.trim() || null
      };

      const response = await fetch(`${supabaseUrl}/garage_reviews`, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${session?.token || apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert(lang === 'ar' ? 'شكراً لك! تم تسجيل تقييمك بنجاح ⭐' : 'Thank you for your review!');
        setSelectedOrderForReview(null);
        fetchData();
      }
    } catch (e) {
    } finally {
      setSubmittingReview(false);
    }
  };

  const confirmedInquiries = inquiries.filter(i => i.status === 'confirmed_compatible');

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '30px', maxWidth: '650px', width: '92%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', position: 'relative' }}>
        
        <button onClick={onClose} style={{ position: 'absolute', top: '15px', left: lang === 'ar' ? '15px' : 'auto', right: lang === 'ar' ? 'auto' : '15px', border: 'none', background: '#edf2f7', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>

        <h3 style={{ margin: '0 0 15px 0', color: '#1a365d' }}>
          📦 {lang === 'ar' ? 'متابعة استفساراتي وطلباتي' : 'My Inquiries & Orders'}
        </h3>

        {/* أزرار التنقل بين الاستفسارات والطلبات */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #edf2f7', paddingBottom: '10px' }}>
          <button 
            onClick={() => setActiveTab('inquiries')}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'inquiries' ? '#805ad5' : '#f7fafc', color: activeTab === 'inquiries' ? 'white' : '#4a5568', fontWeight: 'bold', cursor: 'pointer', fontSize: '13.5px', position: 'relative' }}
          >
            ❓ استفسارات التوافق ({inquiries.length})
            {confirmedInquiries.length > 0 && (
              <span style={{ position: 'absolute', top: '-5px', right: '-5px', backgroundColor: '#38a169', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold' }}>
                {confirmedInquiries.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'orders' ? '#38a169' : '#f7fafc', color: activeTab === 'orders' ? 'white' : '#4a5568', fontWeight: 'bold', cursor: 'pointer', fontSize: '13.5px' }}
          >
            🛒 طلباتي الشراء ({orders.length})
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#718096' }}>جاري التحميل...</p>
        ) : activeTab === 'inquiries' ? (
          inquiries.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#a0aec0', padding: '30px 0' }}>لا توجد استفسارات متوافقة حالياً.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {inquiries.map(inq => (
                <div key={inq.id} style={{ padding: '18px', border: inq.status === 'confirmed_compatible' ? '2px solid #38a169' : '1px solid #e2e8f0', borderRadius: '15px', backgroundColor: inq.status === 'confirmed_compatible' ? '#f0fff4' : '#f8fafc' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: '#e9d8fd', color: '#553c9a', padding: '3px 8px', borderRadius: '6px' }}>
                      كود الاستفسار: {inq.inquiry_code || `#INQ-${inq.id}`}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: inq.status === 'pending_check' ? '#dd6b20' : inq.status === 'confirmed_compatible' ? '#38a169' : '#e53e3e' }}>
                      {inq.status === 'pending_check' ? '⏳ بانتظار فحص الكراج' : inq.status === 'confirmed_compatible' ? '✅ تم تأكيد التوافق!' : '❌ لا تركب'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: 'white', padding: '10px', borderRadius: '10px', border: '1px solid #edf2f7', marginBottom: '10px' }}>
                    <img src={inq.part_image || 'https://via.placeholder.com/60'} alt={inq.part_name} style={{ width: '55px', height: '55px', objectFit: 'cover', borderRadius: '8px' }} />
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '15px', color: '#1a365d' }}>{inq.part_name}</strong>
                      <div style={{ fontSize: '13px', color: '#dd6b20', fontWeight: 'bold' }}>{inq.part_price || 0} QAR</div>
                    </div>
                  </div>

                  <div style={{ fontSize: '12.5px', color: '#718096', marginBottom: '8px' }}>
                    🚘 سيارتك: {inq.car_make} {inq.car_model} ({inq.car_year})
                  </div>

                  {/* إذا تم تأكيد التوافق: إظهار الضمان وزر الشراء المباشر للعميل */}
                  {inq.status === 'confirmed_compatible' && (
                    <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #c6f6d5', color: '#22543d', fontSize: '13px', marginTop: '10px' }}>
                      <div style={{ fontWeight: 'bold', color: '#276749', marginBottom: '4px' }}>🎉 الكراج يؤكد: القطعة متوافقة 100% مع سيارتك!</div>
                      <div style={{ fontSize: '12px', color: '#4a5568', marginBottom: '10px' }}>🛡️ مهلة الإرجاع: {inq.return_days || 3} أيام | ضمان التشغيل: {inq.warranty_days || 14} يوماً</div>
                      
                      <button
                        onClick={() => {
                          onClose();
                          if (onSelectPartForCheckout) {
                            onSelectPartForCheckout({
                              id: inq.part_id,
                              name: inq.part_name,
                              price: inq.part_price,
                              image_url: inq.part_image,
                              user_id: inq.garage_id,
                              make: inq.car_make,
                              model: inq.car_model,
                              year: inq.car_year
                            });
                          }
                        }}
                        style={{ width: '100%', padding: '11px', backgroundColor: '#38a169', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
                      >
                        🛒 إتمام الشراء والتوصيل الآن
                      </button>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )
        ) : (
          orders.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#a0aec0', padding: '30px 0' }}>لا توجد لديك طلبات سابقة.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {orders.map(order => (
                <div key={order.id} style={{ padding: '18px', border: '1px solid #e2e8f0', borderRadius: '15px', backgroundColor: '#f8fafc' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: '#ebf8ff', color: '#2b6cb0', padding: '3px 8px', borderRadius: '6px' }}>
                      رمز الطلب: {order.order_code || `#ORD-${order.id}`}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: order.status === 'delivered' ? '#38a169' : '#dd6b20' }}>
                      {order.status === 'ready_for_pickup' ? '📦 القطعة جاهزة للطلب' : order.status === 'handed_to_driver' ? '🚚 القطعة مع المندوب وفي الطريق إليك' : order.status === 'delivered' ? '✅ تم التسليم' : '⏳ جاري التجهيز'}
                    </span>
                  </div>

                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2d3748', marginBottom: '8px' }}>
                    {order.part_name}
                  </div>

                  <div style={{ backgroundColor: '#fffaf0', padding: '12px', borderRadius: '10px', border: '1px solid #feebc8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '11px', color: '#c05621', fontWeight: 'bold' }}>🔑 كود التسليم الخاص بك:</span>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'monospace', color: '#dd6b20' }}>
                        {order.delivery_code || 'DEL-882'}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#718096', maxWidth: '180px', textAlign: 'left' }}>
                      أبرز هذا الكود للمندوب أو موظف المقر عند استلام القطعة.
                    </span>
                  </div>

                  {order.status === 'delivered' && (
                    <button onClick={() => setSelectedOrderForReview(order)} style={{ width: '100%', padding: '10px', backgroundColor: '#805ad5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                      ⭐ تقييم جودة القطعة والبائع
                    </button>
                  )}

                </div>
              ))}
            </div>
          )
        )}

        {/* مودال التقييم */}
        {selectedOrderForReview && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '15px', maxWidth: '450px', width: '90%', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#1a365d' }}>⭐ تقييم طلب: {selectedOrderForReview.part_name}</h4>
              
              <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>عدد النجوم:</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} type="button" onClick={() => setStarRating(star)} style={{ fontSize: '20px', background: 'none', border: 'none', cursor: 'pointer', opacity: star <= starRating ? 1 : 0.3 }}>⭐</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>هل طابقت القطعة الوصف تماماً؟</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" onClick={() => setAsDescribed(true)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: asDescribed ? '2px solid #38a169' : '1px solid #cbd5e0', backgroundColor: asDescribed ? '#f0fff4' : 'white', cursor: 'pointer', fontWeight: 'bold' }}>✅ نعم، مطابقة</button>
                    <button type="button" onClick={() => setAsDescribed(false)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: !asDescribed ? '2px solid #e53e3e' : '1px solid #cbd5e0', backgroundColor: !asDescribed ? '#fff5f5' : 'white', cursor: 'pointer', fontWeight: 'bold' }}>❌ بها اختلاف</button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>تعليق إضافي (اختياري):</label>
                  <textarea placeholder="اكتب رأيك بالقطعة والتعامل..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e0', height: '60px', boxSizing: 'border-box' }} />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="submit" disabled={submittingReview} style={{ flex: 1, padding: '10px', backgroundColor: '#38a169', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>حفظ التقييم</button>
                  <button type="button" onClick={() => setSelectedOrderForReview(null)} style={{ padding: '10px 15px', backgroundColor: '#edf2f7', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>إلغاء</button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
