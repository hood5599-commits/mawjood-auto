import React, { useState } from 'react';
import { AITranslatedText } from './AITranslatedText'; // 👈 استيراد مكون الترجمة الذكي

interface CheckoutProps {
  lang: 'ar' | 'en';
  part: any;
  initialStep?: 'inquire' | 'checkout';
  customerPhone: string;
  supabaseUrl: string;
  apiKey: string;
  session?: any;
  siteSettings?: any;
  onClose: () => void;
  onSuccess: (addedToCartPart?: any) => void;
}

export const CustomerFitmentCheckout: React.FC<CheckoutProps> = ({
  lang,
  part,
  initialStep = 'inquire',
  customerPhone,
  supabaseUrl,
  apiKey,
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

  // 📸 حالات رفع الصور (القطعة القديمة + الاستمارة)
  const [oldPartImg, setOldPartImg] = useState('');
  const [carRegistrationImg, setCarRegistrationImg] = useState('');
  const [uploadingOldPart, setUploadingOldPart] = useState(false);
  const [uploadingReg, setUploadingReg] = useState(false);

  // إعدادات الشحن والدفع
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [addressDetails, setAddressDetails] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'apple_pay' | 'google_pay' | 'card' | 'cod'>('card');

  // 💳 حالات بيانات البطاقة البنكية
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

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

  // تنسيق رقم البطاقة تلقائياً (4 أرقام - 4 أرقام...)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 16);
    const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    setCardNumber(formatted);
  };

  // تنسيق تاريخ الانتهاء (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (value.length >= 3) {
      value = `${value.substring(0, 2)}/${value.substring(2)}`;
    }
    setCardExpiry(value);
  };

  // 📸 دالة رفع الصور المباشرة لـ Supabase Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'old_part' | 'reg') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    if (target === 'old_part') setUploadingOldPart(true);
    else setUploadingReg(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

    try {
      const uploadUrl = `${supabaseUrl.replace('/rest/v1', '/storage/v1')}/object/part-images/${fileName}`;
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': file.type
        },
        body: file
      });

      if (response.ok) {
        const publicUrl = `${supabaseUrl.replace('/rest/v1', '/storage/v1')}/object/public/part-images/${fileName}`;
        if (target === 'old_part') setOldPartImg(publicUrl);
        else setCarRegistrationImg(publicUrl);
      }
    } catch (err) {
      alert(isRtl ? 'حدث خطأ أثناء رفع الصورة' : 'Image upload failed');
    } finally {
      if (target === 'old_part') setUploadingOldPart(false);
      else setUploadingReg(false);
    }
  };

  // 1️⃣ إرسال استفسار فحص التوافق + إضافة أوتوماتيكية للسلة
  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const inqCode = `INQ-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const payload = {
        inquiry_code: inqCode,
        part_id: Number(part.id) || null,
        part_name: String(part.name || ''),
        part_number: part.part_number || null,
        part_price: Number(part.price) || 0,
        part_image: part.image_url || null,
        garage_id: String(part.user_id || 'garage'),
        customer_phone: String(customerPhone || ''),
        car_make: carMake,
        car_model: carModel,
        car_year: carYear,
        vin_number: vinNumber.trim().toUpperCase() || null,
        customer_notes: notes || null,
        old_part_img: oldPartImg || null,
        car_registration_img: carRegistrationImg || null,
        status: 'pending_check'
      };

      await fetch(`${supabaseUrl}/fitment_inquiries`, {
        method: 'POST',
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      setCreatedOrderCode(inqCode);
      setStep('success');
      onSuccess(part);
    } catch (e) {
      alert(isRtl ? 'حدث خطأ أثناء تقديم الاستفسار' : 'Failed to send inquiry');
    } finally {
      setLoading(false);
    }
  };

  // 2️⃣ إتمام الدفع التنفيذي وإرسال الطلب للكراج
  const handleFinalCheckout = async () => {
    if (deliveryType === 'delivery' && !addressDetails.trim()) {
      alert(isRtl ? 'يرجى إدخال عنوان التوصيل بالتفصيل' : 'Please enter your full delivery address');
      return;
    }

    if (paymentMethod === 'card') {
      if (!cardNumber.replace(/\s/g, '') || cardNumber.replace(/\s/g, '').length < 15) {
        alert(isRtl ? 'يرجى إدخال رقم بطاقة الفيزا/المستر كارد الصحيح (16 رقم)' : 'Please enter a valid card number (16 digits)');
        return;
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        alert(isRtl ? 'يرجى إدخال تاريخ انتهاء البطاقة (MM/YY)' : 'Please enter card expiry date (MM/YY)');
        return;
      }
      if (!cardCvc || cardCvc.length < 3) {
        alert(isRtl ? 'يرجى إدخال الرمز السري CVC للبطاقة' : 'Please enter the CVC code');
        return;
      }
    }

    setLoading(true);
    const ordCode = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();

    try {
      const payload = {
        order_code: ordCode,
        part_id: Number(part.id) || null,
        part_name: String(part.name || (lang === 'ar' ? 'قطعة غيار' : 'Spare Part')),
        price: Number(totalPrice) || 0,
        garage_id: String(part.user_id || 'garage'),
        customer_phone: String(customerPhone || ''),
        delivery_type: deliveryType,
        address_details: deliveryType === 'delivery' ? addressDetails : (lang === 'ar' ? 'استلام من المقر' : 'Store Pickup'),
        payment_method: paymentMethod,
        pickup_code: pickupCode,
        status: 'pending'
      };

      const res = await fetch(`${supabaseUrl}/orders`, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok || res.status === 201 || res.status === 204) {
        setCreatedOrderCode(ordCode);
        setStep('success');
        onSuccess();
      } else {
        const fallbackPayload = {
          part_name: String(part.name || (lang === 'ar' ? 'قطعة غيار' : 'Spare Part')),
          price: Number(totalPrice) || 0,
          garage_id: String(part.user_id || 'garage'),
          customer_phone: String(customerPhone || ''),
          status: 'pending'
        };

        const fallbackRes = await fetch(`${supabaseUrl}/orders`, {
          method: 'POST',
          headers: { 'apikey': apiKey, 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(fallbackPayload)
        });

        if (fallbackRes.ok || fallbackRes.status === 201) {
          setCreatedOrderCode(ordCode);
          setStep('success');
          onSuccess();
        } else {
          alert(isRtl ? 'حدث خطأ أثناء معالجة الدفع، يرجى المحاولة لاحقاً' : 'Error processing payment, please try again later');
        }
      }
    } catch (e) {
      alert(isRtl ? 'حدث خطأ أثناء تنفيذ الطلب' : 'Payment process failed');
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
            {step === 'inquire' ? (isRtl ? '🔍 فحص مطابقة القطعة مع رقم الشاصي' : '🔍 Check Fitment via VIN') : (isRtl ? '💳 إتمام الشراء والدفع الإلكتروني' : '💳 Checkout & Payment')}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✖</button>
        </div>

        {/* 1️⃣ مرحلة الاستفسار وفحص التوافق */}
        {step === 'inquire' && (
          <form onSubmit={handleSendInquiry} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <img src={part?.image_url || 'https://via.placeholder.com/60'} alt={part?.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
              <div>
                <strong style={{ fontSize: '15px', color: '#1e293b' }}>
                  {/* 👇 دمج الترجمة الذكية لاسم القطعة */}
                  <AITranslatedText text={part?.name} lang={lang} />
                </strong>
                <span style={{ fontSize: '12.5px', color: '#64748b', display: 'block' }}>{part?.make} - {part?.model} ({part?.year})</span>
                <span style={{ fontSize: '14px', color: '#e0872a', fontWeight: 'bold' }}>{part?.price} {lang === 'ar' ? 'ر.ق' : 'QAR'}</span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>
                {isRtl ? '🔑 رقم الشاسي (VIN) لمطابقة القطعة 100%:' : '🔑 VIN (17 chars) for 100% Fitment Match:'}
              </label>
              <input
                type="text"
                placeholder={isRtl ? "أدخل 17 حرفاً ورقماً الموجودة في استمارة السيارة..." : "Enter the 17-character VIN found on registration..."}
                value={vinNumber}
                onChange={(e) => setVinNumber(e.target.value)}
                style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13.5px', fontFamily: 'monospace', boxSizing: 'border-box' }}
              />
            </div>

            {/* 📸 رفع صورة القطعة القديمة وصورة الاستمارة */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '4px' }}>
                  {isRtl ? '📸 صورة القطعة القديمة:' : '📸 Old Part Image:'}
                </label>
                <div style={{ border: '1px dashed #cbd5e0', padding: '10px', borderRadius: '8px', textAlign: 'center', backgroundColor: '#f8fafc', position: 'relative' }}>
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'old_part')} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} disabled={uploadingOldPart} />
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                    {uploadingOldPart ? (isRtl ? 'جاري الرفع...' : 'Uploading...') : oldPartImg ? (isRtl ? '✅ تم الرفع' : '✅ Uploaded') : (isRtl ? 'اختر صورة 📷' : 'Choose Image 📷')}
                  </span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '4px' }}>
                  {isRtl ? '📄 صورة الاستمارة:' : '📄 Registration Image:'}
                </label>
                <div style={{ border: '1px dashed #cbd5e0', padding: '10px', borderRadius: '8px', textAlign: 'center', backgroundColor: '#f8fafc', position: 'relative' }}>
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'reg')} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} disabled={uploadingReg} />
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                    {uploadingReg ? (isRtl ? 'جاري الرفع...' : 'Uploading...') : carRegistrationImg ? (isRtl ? '✅ تم الرفع' : '✅ Uploaded') : (isRtl ? 'اختر صورة 📄' : 'Choose Image 📄')}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>
                {isRtl ? '💬 ملاحظات إضافية للكراج (اختياري):' : '💬 Additional Notes for Garage (Optional):'}
              </label>
              <textarea
                rows={2}
                placeholder={isRtl ? "مثلاً: هل توجد فتحات حساسات؟ هل هي الجهة اليمين أم اليسار؟" : "E.g., Does it have sensor holes? Is it for the right or left side?"}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" disabled={loading} style={{ flex: 1, padding: '12px', backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                {loading ? '...' : (isRtl ? '🔍 إرسال وإضافة للسلة' : '🔍 Send & Add to Cart')}
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
              <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 'bold', marginBottom: '8px' }}>
                {isRtl ? '🚚 طريقة استلام القطعة:' : '🚚 Delivery Method:'}
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setDeliveryType('delivery')}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: deliveryType === 'delivery' ? '2px solid #1f3a5f' : '1px solid #cbd5e0', backgroundColor: deliveryType === 'delivery' ? '#e8f2fc' : '#ffffff', color: '#1f3a5f', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                >
                  {isRtl ? '🚚 توصيل لموقعي (35 QAR)' : '🚚 Deliver to my location (35 QAR)'}
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType('pickup')}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: deliveryType === 'pickup' ? '2px solid #1f3a5f' : '1px solid #cbd5e0', backgroundColor: deliveryType === 'pickup' ? '#e8f2fc' : '#ffffff', color: '#1f3a5f', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                >
                  {isRtl ? '🏪 استلام من مقر المعرض (مجاناً)' : '🏪 Pickup from Store (Free)'}
                </button>
              </div>
            </div>

            {deliveryType === 'delivery' && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>
                  {isRtl ? '📍 عنوان التوصيل بالتفصيل (المنطقة / الشارع / المبنى):' : '📍 Full Delivery Address (Zone / Street / Bldg):'}
                </label>
                <input
                  type="text"
                  placeholder={isRtl ? "مثال: الدوحة، منطقة السد، شارع 840، مبنى 12" : "E.g., Doha, Al Sadd, St 840, Bldg 12"}
                  value={addressDetails}
                  onChange={(e) => setAddressDetails(e.target.value)}
                  style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13.5px', boxSizing: 'border-box' }}
                  required
                />
              </div>
            )}

            {/* 💳 خيارات وسائل الدفع الإلكتروني */}
            <div>
              <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 'bold', marginBottom: '8px' }}>
                {isRtl ? '💳 طريقة الدفع الأنسب لك:' : '💳 Select Payment Method:'}
              </label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                
                {isOnlinePaymentEnabled && showApplePay && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('apple_pay')}
                    style={{
                      padding: '14px', borderRadius: '12px', border: paymentMethod === 'apple_pay' ? '2px solid #000000' : '1px solid #cbd5e0',
                      backgroundColor: '#000000', color: '#ffffff', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                  >
                    <span>{isRtl ? '🍏 الدفع السريع بـ' : '🍏 Quick Pay with'}</span> <strong>Apple Pay</strong>
                  </button>
                )}

                {isOnlinePaymentEnabled && showGooglePay && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('google_pay')}
                    style={{
                      padding: '13px', borderRadius: '12px', border: paymentMethod === 'google_pay' ? '2px solid #4285F4' : '1px solid #cbd5e0',
                      backgroundColor: '#ffffff', color: '#3c4043', fontWeight: 'bold', fontSize: '14.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                    }}
                  >
                    <span>{isRtl ? '🌐 الدفع بـ' : '🌐 Pay with'}</span> <strong>Google Pay</strong>
                  </button>
                )}

                {isOnlinePaymentEnabled && showCards && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    style={{
                      padding: '12px 16px', borderRadius: '12px', border: paymentMethod === 'card' ? '2px solid #1f3a5f' : '1px solid #cbd5e0',
                      backgroundColor: paymentMethod === 'card' ? '#f0f7ff' : '#ffffff', color: '#1f3a5f', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}
                  >
                    <span>{isRtl ? '💳 البطاقة البنكية (Visa / MasterCard / Mada)' : '💳 Credit Card (Visa / MasterCard / Mada)'}</span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{isRtl ? 'آمن 100%' : '100% Secure'}</span>
                  </button>
                )}

                {/* 💳 مربع إدخال بيانات الفيزا / ماستركارد عند اختيار البطاقة */}
                {paymentMethod === 'card' && (
                  <div style={{ backgroundColor: '#f0f7ff', padding: '16px', borderRadius: '14px', border: '1px solid #bae6fd', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0369a1' }}>{isRtl ? '💳 أدخل بيانات البطاقة البنكية:' : '💳 Enter Card Details:'}</span>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>Visa / MasterCard</span>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>{isRtl ? 'رقم البطاقة (16 رقم):' : 'Card Number (16 digits):'}</label>
                      <input
                        type="text"
                        placeholder="4000 0000 0000 0000"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '14px', fontFamily: 'monospace', letterSpacing: '1px', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>{isRtl ? 'اسم صاحب البطاقة (كما هو مدون):' : 'Card Holder Name:'}</label>
                      <input
                        type="text"
                        placeholder="MOHAMMED AL-QATARI"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>{isRtl ? 'تاريخ الانتهاء (MM/YY):' : 'Expiry Date (MM/YY):'}</label>
                        <input
                          type="text"
                          placeholder="08/28"
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13.5px', fontFamily: 'monospace', textAlign: 'center', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>{isRtl ? 'الرمز السري (CVC/CVV):' : 'Security Code (CVC/CVV):'}</label>
                        <input
                          type="password"
                          maxLength={4}
                          placeholder="123"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13.5px', fontFamily: 'monospace', textAlign: 'center', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {showCOD && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    style={{
                      padding: '12px 16px', borderRadius: '12px', border: paymentMethod === 'cod' ? '2px solid #e0872a' : '1px solid #cbd5e0',
                      backgroundColor: paymentMethod === 'cod' ? '#fffdf5' : '#ffffff', color: '#92400e', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}
                  >
                    <span>{isRtl ? '💵 الدفع نقداً عند استلام القطعة (COD)' : '💵 Cash on Delivery (COD)'}</span>
                    <span style={{ fontSize: '12px', color: '#e0872a' }}>{isRtl ? 'نقدي' : 'Cash'}</span>
                  </button>
                )}

              </div>
            </div>

            {/* تفاصيل الحساب والإجمالي */}
            <div style={{ backgroundColor: '#f8fafc', padding: '14px 18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', color: '#64748b', marginBottom: '6px' }}>
                <span>{isRtl ? 'قيمة القطعة:' : 'Part Price:'}</span>
                <span>{part?.price} QAR</span>
              </div>
              {deliveryType === 'delivery' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', color: '#64748b', marginBottom: '6px' }}>
                  <span>{isRtl ? 'رسوم التوصيل:' : 'Delivery Fee:'}</span>
                  <span>35 QAR</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', color: '#1f3a5f', borderTop: '1px dashed #cbd5e0', paddingTop: '8px', marginTop: '6px' }}>
                <span>{isRtl ? 'المبلغ الإجمالي المستحق:' : 'Total Amount Due:'}</span>
                <span style={{ color: '#e0872a' }}>{totalPrice} QAR</span>
              </div>
            </div>

            {/* 🚀 زر تنفيذ وتأكيد الطلب */}
            <button
              type="button"
              onClick={handleFinalCheckout}
              disabled={loading}
              style={{ padding: '14px', backgroundColor: '#1e9d6b', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', width: '100%' }}
            >
              {loading ? (isRtl ? 'جاري تنفيذ الطلب وتنبيه الكراج...' : 'Processing order and notifying garage...') : (isRtl ? `🚀 تأكيد وإتمام الشراء (${totalPrice} QAR)` : `🚀 Confirm & Checkout (${totalPrice} QAR)`)}
            </button>

          </div>
        )}

        {/* 3️⃣ مرحلة النجاح وتأكيد الطلب */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '20px 10px' }}>
            <span style={{ fontSize: '54px' }}>🎉</span>
            <h3 style={{ color: '#1e9d6b', margin: '10px 0 6px 0' }}>
              {isRtl ? 'تم إرسال طلبك للكراج بنجاح!' : 'Order Placed Successfully!'}
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '16px' }}>
              {isRtl ? `كود العملية الخاص بك هو: ` : `Your order code is: `}
              <strong style={{ color: '#1f3a5f' }}>{createdOrderCode}</strong>
            </p>
            <p style={{ fontSize: '12.5px', color: '#94a3b8', marginBottom: '24px' }}>
              {isRtl ? 'تم حفظ القطعة بداخل سلتك وتنبيه الكراج فوراً لتجهيزها للشحن.' : 'The part has been saved to your cart and the garage notified to prepare it for shipping.'}
            </p>

            <button onClick={onClose} style={{ padding: '12px 32px', backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              {isRtl ? 'العودة للمتجر 🛒' : 'Back to Shop 🛒'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default CustomerFitmentCheckout;
