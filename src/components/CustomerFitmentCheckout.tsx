import React, { useState } from 'react';

interface PartItem {
  id: number;
  inquiry_id?: number;
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

  const isRtl = lang === 'ar';

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
        // 🔥 تحويل حالة الاستفسار إلى تم الشراء ليختفي تلقائياً من قائمة الاستفسارات المعلقة
        if (part.inquiry_id) {
          await fetch(`${supabaseUrl}/fitment_inquiries?id=eq.${part.inquiry_id}`, {
            method: 'PATCH',
            headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'ordered' })
          }).catch(() => {});
        }

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
    <>
      <style>{`
        .mwj-fc-overlay {
          position: fixed; inset: 0;
          background: rgba(15,23,32,0.72);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex; justify-content: center; align-items: center;
          z-index: 1000; padding: 20px;
          animation: mwj-fc-fade 0.18s ease;
          font-family: 'Cairo', 'Segoe UI', sans-serif;
        }
        @keyframes mwj-fc-fade { from { opacity: 0; } to { opacity: 1; } }

        .mwj-fc-modal {
          background: white; border-radius: 22px; padding: 28px;
          max-width: 600px; width: 92%; max-height: 90vh; overflow-y: auto;
          box-shadow: 0 24px 60px rgba(0,0,0,0.32);
          position: relative;
          animation: mwj-fc-in 0.22s ease;
        }
        @keyframes mwj-fc-in { from { opacity: 0; transform: translateY(14px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }

        .mwj-fc-close {
          position: absolute; top: 16px; border: none;
          background: #f1f5f9; border-radius: 50%; width: 34px; height: 34px;
          cursor: pointer; font-weight: 800; color: #64748b;
          transition: all 0.18s ease;
        }
        .mwj-fc-close:hover { background: #e2e8f0; color: #1F3A5F; transform: rotate(90deg); }

        .mwj-fc-part-card {
          display: flex; gap: 16px; padding: 14px;
          background: linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%);
          border-radius: 14px; border: 1px solid #e2e8f0;
          margin-bottom: 22px; align-items: center;
        }
        .mwj-fc-part-img { width: 72px; height: 72px; object-fit: cover; border-radius: 10px; flex-shrink: 0; }
        .mwj-fc-part-name { margin: 0 0 4px 0; font-size: 16px; color: #16304f; font-weight: 800; }
        .mwj-fc-part-vehicle { font-size: 12.5px; color: #718096; }
        .mwj-fc-part-price { font-size: 16px; font-weight: 800; color: #E0872A; margin-top: 5px; }

        .mwj-fc-tabs {
          display: flex; gap: 8px; margin-bottom: 22px;
          border-bottom: 2px solid #f1f5f9; padding-bottom: 14px;
        }
        .mwj-fc-tab {
          flex: 1; padding: 12px; border-radius: 12px; border: none;
          font-weight: 800; cursor: pointer; font-size: 13.5px;
          transition: all 0.2s ease; background: #f7fafc; color: #4a5568;
        }
        .mwj-fc-tab:hover { transform: translateY(-1px); }
        .mwj-fc-tab-inquire-active {
          background: linear-gradient(135deg, #7c5fd0 0%, #6947b8 100%) !important;
          color: white !important;
          box-shadow: 0 6px 16px rgba(107,70,193,0.3);
        }
        .mwj-fc-tab-checkout-active {
          background: linear-gradient(135deg, #22a35a 0%, #1c8a4a 100%) !important;
          color: white !important;
          box-shadow: 0 6px 16px rgba(34,163,90,0.3);
        }

        .mwj-fc-intro { margin: 0 0 4px 0; font-size: 13px; color: #64748b; line-height: 1.6; }

        .mwj-fc-form { display: flex; flex-direction: column; gap: 16px; }
        .mwj-fc-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        .mwj-fc-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

        .mwj-fc-label { display: block; font-size: 12.5px; font-weight: 700; color: #334155; margin-bottom: 6px; }

        .mwj-fc-input, .mwj-fc-textarea {
          width: 100%; padding: 10px 12px; border-radius: 9px;
          border: 1.5px solid #e2e8f0; box-sizing: border-box; font-size: 13.5px;
          font-family: inherit; transition: border-color 0.18s ease, box-shadow 0.18s ease;
          color: #1F3A5F;
        }
        .mwj-fc-input:focus, .mwj-fc-textarea:focus {
          outline: none; border-color: #E0872A; box-shadow: 0 0 0 3px rgba(224,135,42,0.14);
        }
        .mwj-fc-input-mono { font-family: 'Courier New', monospace; }
        .mwj-fc-textarea { height: 64px; resize: vertical; }

        .mwj-fc-upload-box {
          border: 1.5px dashed #cbd5e0; border-radius: 10px; padding: 10px;
          transition: border-color 0.18s ease, background-color 0.18s ease;
        }
        .mwj-fc-upload-box:hover { border-color: #E0872A; background: #fffaf3; }
        .mwj-fc-upload-ok { color: #22a35a; font-size: 11.5px; font-weight: 700; display: block; margin-top: 5px; }

        .mwj-fc-submit-purple {
          width: 100%; padding: 13px; border: none; border-radius: 12px;
          font-weight: 800; font-size: 15px; cursor: pointer; color: white;
          background: linear-gradient(135deg, #7c5fd0 0%, #6947b8 100%);
          box-shadow: 0 8px 20px rgba(107,70,193,0.3);
          transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
        }
        .mwj-fc-submit-purple:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.05); }
        .mwj-fc-submit-purple:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .mwj-fc-submit-green {
          width: 100%; padding: 15px; border: none; border-radius: 13px;
          font-weight: 800; font-size: 16px; cursor: pointer; color: white;
          background: linear-gradient(135deg, #22a35a 0%, #1c8a4a 100%);
          box-shadow: 0 8px 20px rgba(34,163,90,0.32);
          transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
        }
        .mwj-fc-submit-green:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.05); }
        .mwj-fc-submit-green:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .mwj-fc-option-row { display: flex; gap: 10px; }
        .mwj-fc-option-btn {
          flex: 1; padding: 12px; border-radius: 12px; font-weight: 800; font-size: 13px;
          cursor: pointer; transition: all 0.2s ease; background: #f7fafc;
          color: #4a5568; border: 1.5px solid #e2e8f0;
        }
        .mwj-fc-option-btn:hover { transform: translateY(-1px); }
        .mwj-fc-option-blue-active {
          border-color: #3182ce !important; background: #ebf8ff !important; color: #2b6cb0 !important;
          box-shadow: 0 4px 14px rgba(49,130,206,0.18);
        }
        .mwj-fc-option-green-active {
          border-color: #22a35a !important; background: #f0fff4 !important; color: #276749 !important;
          box-shadow: 0 4px 14px rgba(34,163,90,0.18);
        }
        .mwj-fc-option-orange-active {
          border-color: #E0872A !important; background: #fffaf0 !important; color: #c05621 !important;
          box-shadow: 0 4px 14px rgba(224,135,42,0.18);
        }

        .mwj-fc-address-panel {
          background: linear-gradient(135deg, #ebf8ff 0%, #e1f0fc 100%);
          padding: 14px; border-radius: 12px; border: 1px solid #bee3f8;
        }
        .mwj-fc-gps-btn {
          background: linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%);
          color: white; border: none; border-radius: 8px; padding: 6px 12px;
          font-size: 11px; font-weight: 800; cursor: pointer;
          transition: transform 0.18s ease, filter 0.18s ease;
        }
        .mwj-fc-gps-btn:hover { transform: translateY(-1px); filter: brightness(1.08); }
        .mwj-fc-gps-ok { color: #2b6cb0; font-size: 11.5px; margin-top: 6px; display: block; font-weight: 700; }

        .mwj-fc-summary {
          padding: 14px; background: #f7fafc; border-radius: 12px;
          border: 1px solid #e2e8f0; font-size: 13.5px;
        }
        .mwj-fc-summary-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
        .mwj-fc-summary-protect { display: flex; justify-content: space-between; color: #22a35a; font-weight: 800; }

        @media (max-width: 560px) {
          .mwj-fc-modal { padding: 18px; border-radius: 18px; }
          .mwj-fc-grid-3 { grid-template-columns: 1fr; }
          .mwj-fc-grid-2 { grid-template-columns: 1fr; }
          .mwj-fc-tabs { flex-direction: column; }
          .mwj-fc-option-row { flex-direction: column; }
        }
      `}</style>

      <div className="mwj-fc-overlay" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
        <div className="mwj-fc-modal">

          <button
            onClick={onClose}
            className="mwj-fc-close"
            style={{ [isRtl ? 'left' : 'right']: '16px' }}
          >✕</button>

          <div className="mwj-fc-part-card">
            <img src={part.image_url || 'https://via.placeholder.com/80'} alt={part.name} className="mwj-fc-part-img" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 className="mwj-fc-part-name">{part.name}</h4>
              <div className="mwj-fc-part-vehicle">🚘 {part.make} {part.model} ({part.year})</div>
              <div className="mwj-fc-part-price">{part.price} QAR</div>
            </div>
          </div>

          <div className="mwj-fc-tabs">
            <button
              type="button"
              onClick={() => setActiveStep('inquire')}
              className={`mwj-fc-tab ${activeStep === 'inquire' ? 'mwj-fc-tab-inquire-active' : ''}`}
            >
              ❓ {lang === 'ar' ? 'أسأل البائع هل تركب؟' : 'Ask Seller Fitment'}
            </button>
            <button
              type="button"
              onClick={() => setActiveStep('checkout')}
              className={`mwj-fc-tab ${activeStep === 'checkout' ? 'mwj-fc-tab-checkout-active' : ''}`}
            >
              🛒 {lang === 'ar' ? 'إتمام الشراء والدفع' : 'Buy Now'}
            </button>
          </div>

          {activeStep === 'inquire' && (
            <form onSubmit={handleSendFitmentInquiry} className="mwj-fc-form">
              <p className="mwj-fc-intro">
                أرسل تفاصيل سيارتك للكراج. سيفحص الصور ويؤكد لك التوافق مع تحديد فترة الضمان قبل أن تدفع أي ريال!
              </p>

              <div className="mwj-fc-grid-3">
                <div>
                  <label className="mwj-fc-label">الماركة:</label>
                  <input type="text" value={carMake} onChange={(e) => setCarMake(e.target.value)} className="mwj-fc-input" required />
                </div>
                <div>
                  <label className="mwj-fc-label">الموديل:</label>
                  <input type="text" value={carModel} onChange={(e) => setCarModel(e.target.value)} className="mwj-fc-input" required />
                </div>
                <div>
                  <label className="mwj-fc-label">السنة:</label>
                  <input type="text" value={carYear} onChange={(e) => setCarYear(e.target.value)} className="mwj-fc-input" required />
                </div>
              </div>

              <div>
                <label className="mwj-fc-label">رقم الشاصي VIN (اختياري لزيادة الدقة):</label>
                <input
                  type="text"
                  placeholder="مثال: JTDKN3DU123456789"
                  value={vinNumber}
                  onChange={(e) => setVinNumber(e.target.value.toUpperCase())}
                  className="mwj-fc-input mwj-fc-input-mono"
                />
              </div>

              <div className="mwj-fc-grid-2">
                <div className="mwj-fc-upload-box">
                  <label className="mwj-fc-label">📸 صورة استمارة السيارة:</label>
                  <input type="file" accept="image/*" onChange={(e) => handleUploadImage(e, setEstimaraImg)} style={{ width: '100%', fontSize: '11px' }} disabled={uploadingImg} />
                  {estimaraImg && <span className="mwj-fc-upload-ok">✓ تم الرفع</span>}
                </div>

                <div className="mwj-fc-upload-box">
                  <label className="mwj-fc-label">📸 صورة القطعة القديمة:</label>
                  <input type="file" accept="image/*" onChange={(e) => handleUploadImage(e, setOldPartImg)} style={{ width: '100%', fontSize: '11px' }} disabled={uploadingImg} />
                  {oldPartImg && <span className="mwj-fc-upload-ok">✓ تم الرفع</span>}
                </div>
              </div>

              <div>
                <label className="mwj-fc-label">ملاحظات إضافية للبائع (اختياري):</label>
                <textarea
                  placeholder="مثال: السيارة 4 سلندر وارد الخليج..."
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="mwj-fc-textarea"
                />
              </div>

              <button type="submit" disabled={loading || uploadingImg} className="mwj-fc-submit-purple">
                {loading ? 'جاري إرسال الاستفسار...' : '🚀 إرسال طلب التوافق للكراج'}
              </button>
            </form>
          )}

          {activeStep === 'checkout' && (
            <form onSubmit={handleCompleteOrder} className="mwj-fc-form">

              <div>
                <label className="mwj-fc-label" style={{ fontSize: '13.5px', marginBottom: '10px' }}>
                  🚚 خيار الاستلام والتوصيل:
                </label>
                <div className="mwj-fc-option-row">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('delivery')}
                    className={`mwj-fc-option-btn ${deliveryType === 'delivery' ? 'mwj-fc-option-blue-active' : ''}`}
                  >
                    🚚 توصيل لموقعي (مندوب)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryType('pickup_hq')}
                    className={`mwj-fc-option-btn ${deliveryType === 'pickup_hq' ? 'mwj-fc-option-green-active' : ''}`}
                  >
                    🏪 استلام من مقر موجود أووتو
                  </button>
                </div>
              </div>

              {deliveryType === 'delivery' && (
                <div className="mwj-fc-address-panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '12.5px', fontWeight: 800, color: '#2b6cb0' }}>تفاصيل عنوانك بالتفصيل:</label>
                    <button type="button" onClick={handleGetLocation} className="mwj-fc-gps-btn">
                      📍 تحديد موقعي الحالي GPS
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="المدينة، المنطقة، الشارع، رقم المبنى..."
                    value={addressDetails}
                    onChange={(e) => setAddressDetails(e.target.value)}
                    className="mwj-fc-input"
                    style={{ background: 'white' }}
                    required
                  />
                  {locationLat && <span className="mwj-fc-gps-ok">✓ تم التقاط إحداثيات الموقع (GPS)</span>}
                </div>
              )}

              <div>
                <label className="mwj-fc-label" style={{ fontSize: '13.5px', marginBottom: '10px' }}>
                  💳 طريقة الدفع:
                </label>
                <div className="mwj-fc-option-row">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`mwj-fc-option-btn ${paymentMethod === 'cash' ? 'mwj-fc-option-orange-active' : ''}`}
                  >
                    💵 كاش عند الاستلام
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`mwj-fc-option-btn ${paymentMethod === 'card' ? 'mwj-fc-option-blue-active' : ''}`}
                  >
                    💳 بطاقة بنكية / Apple Pay
                  </button>
                </div>
              </div>

              <div className="mwj-fc-summary">
                <div className="mwj-fc-summary-row">
                  <span>سعر القطعة:</span>
                  <strong style={{ color: '#16304f' }}>{part.price} QAR</strong>
                </div>
                <div className="mwj-fc-summary-protect">
                  <span>🛡️ حماية العميل (ضمان تجربة واسترجاع):</span>
                  <span>مشمول مجاناً</span>
                </div>
              </div>

              <button type="submit" disabled={loading} className="mwj-fc-submit-green">
                {loading ? 'جاري إتمام الطلب...' : '🚀 تأكيد وإتمام طلب الشراء'}
              </button>

            </form>
          )}

        </div>
      </div>
    </>
  );
};
