import React, { useState } from 'react';

interface CheckoutProps {
  lang: 'ar' | 'en';
  part: any;
  initialStep?: 'inquire' | 'checkout';
  customerPhone: string;
  supabaseUrl: string;
  apiKey: string;
  session: any;
  siteSettings?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const CustomerFitmentCheckout: React.FC<CheckoutProps> = ({
  lang,
  part,
  initialStep = 'inquire',
  customerPhone,
  supabaseUrl,
  apiKey,
  session,
  siteSettings,
  onClose,
  onSuccess
}) => {
  const isRtl = lang === 'ar';

  const [step, setStep] = useState<'inquire' | 'checkout' | 'success'>(initialStep);
  const [carMake] = useState(part?.make || '');
  const [carModel] = useState(part?.model || '');
  const [carYear] = useState(part?.year || '');
  const [vinNumber, setVinNumber] = useState('');
  const [notes, setNotes] = useState('');

  // إعدادات الشحن والدفع
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [addressDetails, setAddressDetails] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'apple_pay' | 'google_pay' | 'card' | 'cod'>('apple_pay');

  const [loading, setLoading] = useState(false);
  const [createdOrderCode, setCreatedOrderCode] = useState('');

  // قراءة صلاحيات الدفع المفعلة من الأدمن
  const isOnlinePaymentEnabled = siteSettings?.enableOnlinePayment ?? true;
  const showApplePay = siteSettings?.enableApplePay ?? true;
  const showGooglePay = siteSettings?.enableGooglePay ?? true;
  const showCards = siteSettings?.enableCards ?? true;
  const showCOD = siteSettings?.enableCOD ?? true;

  // حساب الإجمالي
  const deliveryFee = deliveryType === 'delivery' ? 35 : 0;
  const totalPrice = (Number(part?.price) || 0) + deliveryFee;

  // 1️⃣ إرسال استفسار فحص التوافق للكراج
  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const inqCode = `INQ-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const payload = {
        inquiry_code: inqCode,
        part_id: part.id,
        part_name: part.name,
        part_number: part.part_number,
        part_price: part.price,
        part_image: part.image_url,
        garage_id: part.user_id || 'garage',
        customer_phone: customerPhone,
        car_make: carMake,
        car_model: carModel,
        car_year: carYear,
        vin_number: vinNumber.trim().toUpperCase() || null,
        customer_notes: notes || null,
        status: 'pending_check'
      };

      await fetch(`${supabaseUrl}/fitment_inquiries`, {
        method: 'POST',
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      setCreatedOrderCode(inqCode);
      setStep('success');
    } catch (e) {
      alert(isRtl ? 'حدث خطأ أثناء تقديم الاستفسار' : 'Failed to send inquiry');
    } finally {
      setLoading(false);
    }
  };

  // 2️⃣ إتمام الدفع وإنشاء الطلب النهائي
  const handleFinalCheckout = async () => {
    setLoading(true);
    const ordCode = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();

    try {
      const payload = {
        order_code: ordCode,
        part_id: part.id,
        part_name: part.name,
        price: totalPrice,
        garage_id: part.user_id || 'garage',
        customer_phone: customerPhone,
        delivery_type: deliveryType,
        address_details: deliveryType === 'delivery' ? addressDetails : 'استلام من المقر',
        payment_method: paymentMethod,
        pickup_code: pickupCode,
        status: 'pending'
      };

      await fetch(`${supabaseUrl}/orders`, {
        method: 'POST',
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      setCreatedOrderCode(ordCode);
      setStep('success');
      onSuccess();
    } catch (e) {
      alert(isRtl ? 'حدث خطأ أثناء تنفيذ الدفع' : 'Payment process failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '580px', backgroundColor: '#ffffff', borderRadius: '24px', padding: '26px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)', direction: isRtl ? 'rtl' : 'ltr', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* هيدر المودال */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: '#1f3a5f', fontSize: '18px', fontWeight: 'bold' }}>
            {step === 'inquire' ? (isRtl ? '🔍 فحص مطابقة القطعة مع رقم الشاصي' : 'Check Fitment & VIN') : (isRtl ? '💳 إتمام الشراء والدفع الإلكتروني' : 'Checkout & Payment')}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✖</button>
        </div>

        {/* 1️⃣ مرحلة الاستفسار وفحص التوافق */}
        {step === 'inquire' && (
          <form onSubmit={handleSendInquiry} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <img src={part?.image_url || 'https://via.placeholder.com/60'} alt={part?.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
              <div>
                <strong style={{ fontSize: '15px', color: '#1e293b' }}>{part?.name}</strong>
                <span style={{ fontSize: '12.5px', color: '#64748b', display: 'block' }}>{part?.make} - {part?.model} ({part?.year})</span>
                <span style={{ fontSize: '14px', color: '#e0872a', fontWeight: 'bold' }}>{part?.price} QAR</span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>🔑 رقم الشاسي (VIN) لمطابقة القطعة 100%:</label>
              <input
                type="text"
                placeholder="أدخل 17 حرفاً ورقماً الموجودة في استمارة السيارة..."
                value={vinNumber}
                onChange={(e) => setVinNumber(e.target.value)}
                style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13.5px', fontFamily: 'monospace', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>💬 ملاحظات إضافية للكراج (اختياري):</label>
              <textarea
                rows={2}
                placeholder="مثلاً: هل توجد فتحات حساسات؟ هل هي الجهة اليمين أم اليسار؟"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" disabled={loading} style={{ flex: 1, padding: '12px', backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                {loading ? '...' : (isRtl ? '🔍 إرسال فحص التوافق للكراج' : 'Send Fitment Check')}
              </button>
              <button type="button" onClick={() => setStep('checkout')} style={{ padding: '12px 18px', backgroundColor: '#e0872a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                🚀 {isRtl ? 'تخطي والدفع فوراً' : 'Direct Pay'}
              </button>
            </div>
          </form>
        )}

        {/* 2️⃣ مرحلة الشراء والدفع أونلاين */}
        {step === 'checkout' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* خيارات الشحن والتوصيل */}
            <div>
              <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 'bold', marginBottom: '8px' }}>🚚 طريقة استلام القطعة:</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setDeliveryType('delivery')}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: deliveryType === 'delivery' ? '2px solid #1f3a5f' : '1px solid #cbd5e0', backgroundColor: deliveryType === 'delivery' ? '#e8f2fc' : '#ffffff', color: '#1f3a5f', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                >
                  🚚 توصيل لموقعي (35 QAR)
                </button>
                <button
                  onClick={() => setDeliveryType('pickup')}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: deliveryType === 'pickup' ? '2px solid #1f3a5f' : '1px solid #cbd5e0', backgroundColor: deliveryType === 'pickup' ? '#e8f2fc' : '#ffffff', color: '#1f3a5f', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                >
                  🏪 استلام من مقر المعرض (مجاناً)
                </button>
              </div>
            </div>

            {deliveryType === 'delivery' && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>📍 عنوان التوصيل بالتفصيل (المنطقة / الشارع / المبنى):</label>
                <input
                  type="text"
                  placeholder="مثال: الدوحة، منطقة السد، شارع 840، مبنى 12"
                  value={addressDetails}
                  onChange={(e) => setAddressDetails(e.target.value)}
                  style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13.5px', boxSizing: 'border-box' }}
                  required
                />
              </div>
            )}

            {/* 💳 خيارات وسائل الدفع الإلكتروني */}
            <div>
              <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 'bold', marginBottom: '8px' }}>💳 طريقة الدفع الأنسب لك:</label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                
                {/* 🍏 Apple Pay */}
                {isOnlinePaymentEnabled && showApplePay && (
                  <button
                    onClick={() => setPaymentMethod('apple_pay')}
                    style={{
                      padding: '14px', borderRadius: '12px', border: paymentMethod === 'apple_pay' ? '2px solid #000000' : '1px solid #cbd5e0',
                      backgroundColor: '#000000', color: '#ffffff', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                  >
                    <span>🍏 الدفع السريع بـ</span> <strong>Apple Pay</strong>
                  </button>
                )}

                {/* 🌐 Google Pay */}
                {isOnlinePaymentEnabled && showGooglePay && (
                  <button
                    onClick={() => setPaymentMethod('google_pay')}
                    style={{
                      padding: '13px', borderRadius: '12px', border: paymentMethod === 'google_pay' ? '2px solid #4285F4' : '1px solid #cbd5e0',
                      backgroundColor: '#ffffff', color: '#3c4043', fontWeight: 'bold', fontSize: '14.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                    }}
                  >
                    <span>🌐 الدفع بـ</span> <strong>Google Pay</strong>
                  </button>
                )}

                {/* 💳 بطاقة ائتمانية / مدى */}
                {isOnlinePaymentEnabled && showCards && (
                  <button
                    onClick={() => setPaymentMethod('card')}
                    style={{
                      padding: '12px 16px', borderRadius: '12px', border: paymentMethod === 'card' ? '2px solid #1f3a5f' : '1px solid #cbd5e0',
                      backgroundColor: paymentMethod === 'card' ? '#f0f7ff' : '#ffffff', color: '#1f3a5f', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}
                  >
                    <span>💳 البطاقة البنكية (Visa / MasterCard / Mada)</span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>آمن 100%</span>
                  </button>
                )}

                {/* 💵 الدفع عند الاستلام */}
                {showCOD && (
                  <button
                    onClick={() => setPaymentMethod('cod')}
                    style={{
                      padding: '12px 16px', borderRadius: '12px', border: paymentMethod === 'cod' ? '2px solid #e0872a' : '1px solid #cbd5e0',
                      backgroundColor: paymentMethod === 'cod' ? '#fffdf5' : '#ffffff', color: '#92400e', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}
                  >
                    <span>💵 الدفع نقداً عند استلام القطعة (COD)</span>
                    <span style={{ fontSize: '12px', color: '#e0872a' }}>نقدي</span>
                  </button>
                )}

              </div>
            </div>

            {/* تفاصيل الحساب والإجمالي */}
            <div style={{ backgroundColor: '#f8fafc', padding: '14px 18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', color: '#64748b', marginBottom: '6px' }}>
                <span>قيمة القطعة:</span>
                <span>{part?.price} QAR</span>
              </div>
              {deliveryType === 'delivery' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', color: '#64748b', marginBottom: '6px' }}>
                  <span>رسوم التوصيل:</span>
                  <span>35 QAR</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', color: '#1f3a5f', borderTop: '1px dashed #cbd5e0', paddingTop: '8px', marginTop: '6px' }}>
                <span>المبلغ الإجمالي المستحق:</span>
                <span style={{ color: '#e0872a' }}>{totalPrice} QAR</span>
              </div>
            </div>

            <button
              onClick={handleFinalCheckout}
              disabled={loading}
              style={{ padding: '14px', backgroundColor: '#1e9d6b', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', width: '100%' }}
            >
              {loading ? 'جاري تنفيذ العملية...' : `🚀 تأكيد وإتمام الشراء (${totalPrice} QAR)`}
            </button>

          </div>
        )}

        {/* 3️⃣ مرحلة النجاح وتأكيد الطلب */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '20px 10px' }}>
            <span style={{ fontSize: '54px' }}>🎉</span>
            <h3 style={{ color: '#1e9d6b', margin: '10px 0 6px 0' }}>
              {isRtl ? 'تم تسجيل الطلب بنجاح!' : 'Order Placed Successfully!'}
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '16px' }}>
              {isRtl ? `رمز العملية الخاص بك هو: ` : `Your order code is: `}
              <strong style={{ color: '#1f3a5f' }}>{createdOrderCode}</strong>
            </p>
            <p style={{ fontSize: '12.5px', color: '#94a3b8', marginBottom: '24px' }}>
              يمكنك متابعة حالة الطلب أو استفسار التوافق في أي وقت من زر "متابعة طلباتي" بالأعلى.
            </p>

            <button onClick={onClose} style={{ padding: '12px 32px', backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              {isRtl ? 'العودة للمتجر 🛒' : 'Back to Shop'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default CustomerFitmentCheckout;
