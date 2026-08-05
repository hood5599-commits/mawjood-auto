import React, { useState } from 'react';
import { createWorker } from 'tesseract.js';

interface RequestPartModalProps {
  isOpen: boolean;
  onClose: () => void;
  supabaseUrl: string;
  supabaseKey: string;
  customerPhone: string;
  initialPartName?: string;
}

export const RequestPartModal: React.FC<RequestPartModalProps> = ({
  isOpen,
  onClose,
  supabaseUrl,
  supabaseKey,
  customerPhone,
  initialPartName = ''
}) => {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [engineSize, setEngineSize] = useState('');
  const [vinNumber, setVinNumber] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [notes, setNotes] = useState(initialPartName);

  const [oldPartImgUrl, setOldPartImgUrl] = useState('');
  const [vinImgUrl, setVinImgUrl] = useState('');
  const [uploadingOldPart, setUploadingOldPart] = useState(false);
  const [uploadingVinImg, setUploadingVinImg] = useState(false);

  const [scanningVin, setScanningVin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const cleanUrl = supabaseUrl?.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '') || "https://shszpcjmhkemqwborfwy.supabase.co";

  const uploadImageToStorage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    try {
      const uploadUrl = `${cleanUrl}/storage/v1/object/part-images/${fileName}`;
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': file.type
        },
        body: file
      });

      if (response.ok) {
        return `${cleanUrl}/storage/v1/object/public/part-images/${fileName}`;
      }
    } catch (err) {
      console.error("Image Upload Error:", err);
    }
    return null;
  };

  const handleVinImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVinImg(true);
    setScanningVin(true);

    try {
      const publicUrl = await uploadImageToStorage(file);
      if (publicUrl) setVinImgUrl(publicUrl);

      const worker = await createWorker('eng');
      const ret = await worker.recognize(file);
      await worker.terminate();

      const rawText = ret.data.text;
      const cleanedText = rawText.replace(/[\s\-_]/g, '').toUpperCase();
      const standardVinRegex = /[A-HJ-NPR-Z0-9]{17}/i;
      const match = cleanedText.match(standardVinRegex);

      if (match) {
        setVinNumber(match[0].toUpperCase());
      } else {
        const lines = rawText.split('\n');
        for (const line of lines) {
          if (line.toLowerCase().includes('chassis') || line.toLowerCase().includes('engine') || line.includes('القاعدة')) {
            const extracted = line.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
            const subMatch = extracted.match(/[A-Z0-9]{11,17}/);
            if (subMatch) {
              setVinNumber(subMatch[0]);
              break;
            }
          }
        }
      }
    } catch (err) {
      console.error("OCR Read error:", err);
    } finally {
      setScanningVin(false);
      setUploadingVinImg(false);
    }
  };

  const handleOldPartUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingOldPart(true);
    const publicUrl = await uploadImageToStorage(file);
    if (publicUrl) {
      setOldPartImgUrl(publicUrl);
    }
    setUploadingOldPart(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // إنشاء معرف مشفر وخاص بالعميل لحماية الخصوصية
    const anonymousCustomerCode = customerPhone && customerPhone !== 'زائر'
      ? `CUST-${Math.abs(customerPhone.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0) % 89999 + 10000)}`
      : 'CUST-GUEST';

    try {
      const response = await fetch(`${cleanUrl}/rest/v1/custom_part_requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          customer_phone: anonymousCustomerCode,
          make,
          model,
          year,
          engine_size: engineSize,
          vin_number: vinNumber,
          part_number: partNumber,
          notes,
          part_image_url: oldPartImgUrl || null,
          vin_image_url: vinImgUrl || null,
          status: 'pending'
        })
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2000);
      } else {
        alert("حدث خطأ أثناء إرسال الطلب، يرجى المحاولة لاحقاً.");
      }
    } catch (err) {
      console.error(err);
      alert("انقطاع في الاتصال بالسيرفر.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
        
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', left: '16px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>✕</button>

        <h3 style={{ margin: '0 0 16px 0', color: '#1f3a5f', fontSize: '18px', fontWeight: 'bold' }}>
          طلب تسعير قطعة غير متوفرة
        </h3>

        {success ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#16a34a' }}>
            <h4 style={{ margin: 0, fontSize: '18px' }}>تم إرسال طلبك بنجاح</h4>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>ستصلك عروض الأسعار والتنبيهات فور توفرها.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '4px' }}>الشركة المصنعة *</label>
                <input required type="text" placeholder="مثال: تويوتا" value={make} onChange={(e) => setMake(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '4px' }}>الموديل *</label>
                <input required type="text" placeholder="مثال: كامري" value={model} onChange={(e) => setModel(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '4px' }}>سنة الصنع *</label>
                <input required type="text" placeholder="مثال: 2006" value={year} onChange={(e) => setYear(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '4px' }}>حجم المحرك (اختياري)</label>
                <input type="text" placeholder="مثال: 2.4L" value={engineSize} onChange={(e) => setEngineSize(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px dashed #94a3b8' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#1f3a5f', display: 'block', marginBottom: '6px' }}>
                صورة الاستمارة (لقراءة رقم الشاصي تلقائياً)
              </label>
              <input type="file" accept="image/*" onChange={handleVinImageUpload} disabled={uploadingVinImg} style={{ fontSize: '12px', width: '100%' }} />
              {scanningVin && <p style={{ fontSize: '11px', color: '#e0872a', margin: '4px 0 0 0', fontWeight: 'bold' }}>جاري فحص وقراءة رقم الشاصي تلقائياً من الصورة...</p>}
              {vinImgUrl && <span style={{ fontSize: '11px', color: '#16a34a', display: 'block', marginTop: '4px', fontWeight: 'bold' }}>تم رفع صورة الاستمارة</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '4px' }}>رقم الشاصي (VIN)</label>
                <input type="text" placeholder="17 رقم" value={vinNumber} onChange={(e) => setVinNumber(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px', textTransform: 'uppercase', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '4px' }}>رقم القطعة (Part Number)</label>
                <input type="text" placeholder="اختياري" value={partNumber} onChange={(e) => setPartNumber(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '4px' }}>صورة القطعة القديمة (اختياري)</label>
              <input type="file" accept="image/*" onChange={handleOldPartUpload} disabled={uploadingOldPart} style={{ fontSize: '12px', width: '100%' }} />
              {uploadingOldPart && <p style={{ fontSize: '11px', color: '#e0872a', margin: '4px 0 0 0' }}>جاري رفع الصورة...</p>}
              {oldPartImgUrl && <span style={{ fontSize: '11px', color: '#16a34a', display: 'block', marginTop: '2px', fontWeight: 'bold' }}>تم رفع صورة القطعة القديمة</span>}
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '4px' }}>تفاصيل القطعة وملاحظاتك *</label>
              <textarea required rows={3} placeholder="اكتب اسم القطعة بالتفصيل (مثال: مروحة رديتر جهة السائق)..." value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>

            <button type="submit" disabled={submitting} style={{ backgroundColor: '#e0872a', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', marginTop: '8px', boxShadow: '0 4px 12px rgba(224,135,42,0.3)' }}>
              {submitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
