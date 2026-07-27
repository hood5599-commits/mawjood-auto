import React, { useState } from 'react';

interface PartItem {
  id: number;
  name: string;
  price: number;
  make: string;
  model: string;
  year: string;
  engine?: string;
  image_url?: string;
  user_id: string;
  part_number?: string;
}

interface Props {
  lang: 'ar' | 'en';
  part: PartItem;
  customerPhone: string;
  supabaseUrl: string;
  apiKey: string;
  session: any;
  onClose: () => void;
  onSuccess: () => void;
  initialStep?: 'inquire' | 'checkout';
}

export const CustomerFitmentCheckout: React.FC<Props> = ({
  lang,
  part,
  customerPhone,
  supabaseUrl,
  apiKey,
  session,
  onClose,
  onSuccess,
  initialStep = 'inquire'
}) => {
  const [activeStep, setActiveStep] = useState<'inquire' | 'checkout'>(initialStep);

  const [carMake, setCarMake] = useState(part.make || '');
  const [carModel, setCarModel] = useState(part.model || '');
  const [carYear, setCarYear] = useState(part.year || '');
  const [vinNumber, setVinNumber] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [estimaraImg, setEstimaraImg] = useState('');
  const [oldPartImg, setOldPartImg] = useState('');
  const [uploadingImg, setUploadingImg] = useState(false);
  const [loading, setLoading] = useState(false);

  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup_hq'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [addressDetails, setAddressDetails] = useState('');
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, setImgFn: (url: string) => void) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploadingImg(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `fitment-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${fileExt}`;
    try {
      const uploadUrl = `${supabaseUrl.replace('/rest/v1', '/storage/v1')}/object/part-images/${fileName}`;
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}`, 'Content-Type': file.type },
        body: file
      });
      if (response.ok) {
        setImgFn(`${supabaseUrl.replace('/rest/v1', '/storage/v1')}/object/public/part-images/${fileName}`);
        alert(lang === 'ar' ? 'تم رفع الصورة بنجاح!' : 'Image uploaded!');
      }
    } catch (err) {
      alert('Error uploading image');
    } finally {
      setUploadingImg(false);
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationLat(position.coords.latitude);
          setLocationLng(position.coords.longitude);
          alert(lang === 'ar' ? 'تم تحديد موقعك الجغرافي بنجاح! 📍' : 'Location captured!');
        },
        () => {
          alert(lang === 'ar' ? 'تعذر الحصول على الموقع أوتوماتيكياً، يرجى كتابة العنوان نصياً' : 'Please type address details');
        }
      );
    }
  };

  const handleSendFitmentInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const inquiryCode = `INQ-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const payload = {
        inquiry_code: inquiryCode,
        part_id: Number(part.id),
        garage_id: String(part.user_id || 'unknown_garage'),
        customer_phone: customerPhone || '55000000',
        part_name: part.name,
        part_image: part.image_url || '',
        part_price: part.price || 0,
        part_number: part.part_number || '',
        car_make: carMake,
        car_model: carModel,
        car_year: carYear,
        vin_number: vinNumber.trim() || null,
        car_registration_img: estimaraImg || null,
        old_part_img: oldPartImg || null,
        customer_notes: customerNotes.trim() || null,
        status: 'pending_check'
      };

      const response = await fetch(`${supabaseUrl}/fitment_inquiries`, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${session?.token || apiKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert(lang === 'ar' ? `تم إرسال طلب التوافق للبائع بنجاح! 🚀\nكود الاستفسار: ${inquiryCode}\nتجد استفسارك في "متابعة طلباتي"` : 'Inquiry sent successfully!');
        onSuccess();
        onClose();
      } else {
        const errJson = await response.json().catch(() => ({}));
        alert(`خطأ: ${errJson.message || 'فشل الإرسال'}`);
      }
    } catch (err: any) {
      alert('خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const orderCode = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const pickupCode = `PK-${Math.floor(100 + Math.random() * 900)}`;
    const deliveryCode = `DEL-${Math.floor(100 + Math.random() * 900)}`;

    try {
      const payload = {
        order_code: orderCode,
        pickup_code: pickupCode,
        delivery_code: deliveryCode,
        part_name: part.name,
        price: part.price,
        garage_id: part.user_id,
        customer_phone: customerPhone,
        delivery_type: deliveryType,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'cash' ? 'pending' : 'paid',
        escrow_status: 'held',
        location_lat: locationLat,
        location_lng: locationLng,
        address_details: addressDetails || (deliveryType === 'pickup_hq' ? 'استلام من مقر موجود أووتو' : 'توصيل للموقع'),
        status: 'pending'
      };

      const response = await fetch(`${supabaseUrl}/orders`, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${session?.token || apiKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert(
          lang === 'ar' 
            ? `مبروك! تم إتمام طلبك بنجاح 🎉\nرمز الطلب: ${orderCode}\nرمز كود التسليم الخاص بك: ${deliveryCode}` 
            : 'Order placed successfully!'
        );
        onSuccess();
        onClose();
      } else {
        const errJson = await response.json().catch(() => ({}));
        alert(`خطأ: ${errJson.message || 'فشل إتمام الطلب'}`);
      }
    } catch (err) {
      alert('Error placing order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '30px', maxWidth: '600px', width: '92%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', position: 'relative' }}>
        
        <button onClick={onClose} style={{ position: 'absolute', top: '15px', left: lang === 'ar' ? '15px' : 'auto', right: lang === 'ar' ? 'auto' : '15px', border: 'none', background: '#edf2f7', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>

        <div style={{ display: 'flex', gap: '15px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', alignItems: 'center' }}>
          <img src={part.image_url || 'https://via.placeholder.com/80'} alt={part.name} style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px' }} />
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#1a365d' }}>{part.name}</h4>
            <div style={{ fontSize: '12.5px', color: '#718096' }}>🚘 {part.make} {part.model} ({part.year})</div>
            <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#dd6b20', marginTop: '4px' }}>{part.price} QAR</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid #edf2f7', paddingBottom: '10px' }}>
          <button 
            type="button"
            onClick={() => setActiveStep('inquire')} 
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: activeStep === 'inquire' ? '#805ad5' : '#f7fafc', color: activeStep === 'inquire' ? 'white' : '#4a5568', fontWeight: 'bold', cursor: 'pointer', fontSize: '13.5px' }}
          >
            ❓ {lang === 'ar' ? 'أسأل البائع هل تركب؟' : 'Ask Seller Fitment'}
          </button>
          <button 
            type="button"
            onClick={() => setActiveStep('checkout')} 
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: activeStep === 'checkout' ? '#38a169' : '#f7fafc', color: activeStep === 'checkout' ? 'white' : '#4a5568', fontWeight: 'bold', cursor: 'pointer', fontSize: '13.5px' }}
          >
            🛒 {lang === 'ar' ? 'إتمام الشراء والدفع' : 'Buy Now'}
          </button>
        </div>

        {activeStep === 'inquire' && (
          <form onSubmit={handleSendFitmentInquiry} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#4a5568', lineHeight: '1.5' }}>
              أرسل تفاصيل سيارتك للكراج. سيفحص الصور ويؤكد لك التوافق مع تحديد فترة الضمان قبل أن تدفع أي ريال!
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>الماركة:</label>
                <input type="text" value={carMake} onChange={(e) => setCarMake(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>الموديل:</label>
                <input type="text" value={carModel} onChange={(e) => setCarModel(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>السنة:</label>
                <input type="text" value={carYear} onChange={(e) => setCarYear(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '4px' }}>رقم الشاصي VIN (اختياري لزيادة الدقة):</label>
              <input type="text" placeholder="مثال: JTDKN3DU123456789" value={vinNumber} onChange={(e) => setVinNumber(e.target.value.toUpperCase())} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box', fontFamily: 'monospace' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>📸 صورة استمارة السيارة:</label>
                <input type="file" accept="image/*" onChange={(e) => handleUploadImage(e, setEstimaraImg)} style={{ width: '100%', fontSize: '11px' }} disabled={uploadingImg} />
                {estimaraImg && <span style={{ color: '#38a169', fontSize: '11px', display: 'block', marginTop: '2px' }}>✓ تم الرفع</span>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>📸 صورة القطعة القديمة:</label>
                <input type="file" accept="image/*" onChange={(e) => handleUploadImage(e, setOldPartImg)} style={{ width: '100%', fontSize: '11px' }} disabled={uploadingImg} />
                {oldPartImg && <span style={{ color: '#38a169', fontSize: '11px', display: 'block', marginTop: '2px' }}>✓ تم الرفع</span>}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '4px' }}>ملاحظات إضافية للبائع (اختياري):</label>
              <textarea placeholder="مثال: السيارة 4 سلندر وارد الخليج..." value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box', height: '60px' }} />
            </div>

            <button type="submit" disabled={loading || uploadingImg} style={{ width: '100%', padding: '12px', backgroundColor: '#805ad5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>
              {loading ? 'جاري إرسال الاستفسار...' : '🚀 إرسال طلب التوافق للكراج'}
            </button>
          </form>
        )}

        {activeStep === 'checkout' && (
          <form onSubmit={handleCompleteOrder} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 'bold', color: '#2d3748', marginBottom: '8px' }}>
                🚚 خيار الاستلام والتوصيل:
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setDeliveryType('delivery')}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: deliveryType === 'delivery' ? '2px solid #3182ce' : '1px solid #cbd5e0', backgroundColor: deliveryType === 'delivery' ? '#ebf8ff' : '#f7fafc', color: deliveryType === 'delivery' ? '#2b6cb0' : '#4a5568', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                >
                  🚚 توصيل لموقعي (مندوب)
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType('pickup_hq')}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: deliveryType === 'pickup_hq' ? '2px solid #38a169' : '1px solid #cbd5e0', backgroundColor: deliveryType === 'pickup_hq' ? '#f0fff4' : '#f7fafc', color: deliveryType === 'pickup_hq' ? '#276749' : '#4a5568', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                >
                  🏪 استلام من مقر موجود أووتو
                </button>
              </div>
            </div>

            {deliveryType === 'delivery' && (
              <div style={{ backgroundColor: '#ebf8ff', padding: '12px', borderRadius: '10px', border: '1px solid #bee3f8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#2b6cb0' }}>تفاصيل عنوانك بالتفصيل:</label>
                  <button type="button" onClick={handleGetLocation} style={{ backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                    📍 تحديد موقعي الحالي GPS
                  </button>
                </div>
                <input 
                  type="text" 
                  placeholder="المدينة، المنطقة، الشارع، رقم المبنى..." 
                  value={addressDetails} 
                  onChange={(e) => setAddressDetails(e.target.value)} 
                  style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box', fontSize: '13px' }} 
                  required 
                />
                {locationLat && <span style={{ color: '#2b6cb0', fontSize: '11px', marginTop: '4px', display: 'block' }}>✓ تم التقاط إحداثيات الموقع (GPS)</span>}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 'bold', color: '#2d3748', marginBottom: '8px' }}>
                💳 طريقة الدفع:
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: paymentMethod === 'cash' ? '2px solid #dd6b20' : '1px solid #cbd5e0', backgroundColor: paymentMethod === 'cash' ? '#fffaf0' : '#f7fafc', color: paymentMethod === 'cash' ? '#c05621' : '#4a5568', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                >
                  💵 كاش عند الاستلام
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: paymentMethod === 'card' ? '2px solid #3182ce' : '1px solid #cbd5e0', backgroundColor: paymentMethod === 'card' ? '#ebf8ff' : '#f7fafc', color: paymentMethod === 'card' ? '#2b6cb0' : '#4a5568', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                >
                  💳 بطاقة بنكية / Apple Pay
                </button>
              </div>
            </div>

            <div style={{ padding: '12px', backgroundColor: '#f7fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>سعر القطعة:</span>
                <strong>{part.price} QAR</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#38a169', fontWeight: 'bold' }}>
                <span>🛡️ حماية العميل (ضمان تجربة واسترجاع):</span>
                <span>مشمول مجاناً</span>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', backgroundColor: '#38a169', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
              {loading ? 'جاري إتمام الطلب...' : '🚀 تأكيد وإتمام طلب الشراء'}
            </button>

          </form>
        )}

      </div>
    </div>
  );
};
