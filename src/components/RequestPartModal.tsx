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

  const [scanningVin, setScanningVin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  // دالة قراءة رقم الشاصي VIN تلقائياً من صورة الاستمارة
  const handleVinImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanningVin(true);
    try {
      const worker = await createWorker('eng');
      const ret = await worker.recognize(file);
      await worker.terminate();

      // البحث عن نمط رقم الشاصي (17 حرف/رقم)
      const vinRegex = /[A-HJ-NPR-Z0-9]{17}/i;
      const match = ret.data.text.match(vinRegex);

      if (match) {
        setVinNumber(match[0].toUpperCase());
      }
    } catch (err) {
      console.error("OCR Read error:", err);
    } finally {
      setScanningVin(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const cleanUrl = supabaseUrl?.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '') || "https://shszpcjmhkemqwborfwy.supabase.co";

    try {
      // حفظ طلب القطعة المخصصة في جدول custom_part_requests
      const response = await fetch(`${cleanUrl}/rest/v1/custom_part_requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          customer_phone: customerPhone || 'زائر',
          make,
          model,
          year,
          engine_size: engineSize,
          vin_number: vinNumber,
          part_number: partNumber,
          notes,
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

        <h3 style={{ margin: '0 0 16px 0', color: '#1f3a5f', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🛠️</span> طلب تسعير قطعة غير متوفرة
        </h3>

        {success ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#16a34a' }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>✅</div>
            <h4 style={{ margin: 0, fontSize: '18px' }}>تم إرسال طلبك لكل الكراجات بنجاح!</h4>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>ستصلك عروض الأسعار والتنبيهات فور توفرها.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* بيانات السيارة */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '4px' }}>الشركة المصنعة *</label>
                <input required type="text" placeholder="مثال: تويوتا" value={make} onChange={(e) => setMake(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '4px' }}>الموديل *</label>
                <input required type="text" placeholder="مثال: كامري" value={model} onChange={(e) => setModel(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '4px' }}>سنة الصنع *</label>
                <input required type="text" placeholder="مثال: 2006" value={year} onChange={(e) => setYear(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '4px' }}>حجم المحرك (اختياري)</label>
                <input type="text" placeholder="مثال: 2.4L" value={engineSize} onChange={(e) => setEngineSize(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px' }} />
              </div>
            </div>

            {/* صورة الاستمارة + قرأة رقم الشاصي */}
            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px dashed #94a3b8' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#1f3a5f', display: 'block', marginBottom: '6px' }}>
                📄 صورة الاستمارة (لقراءة رقم الشاصي تلقائياً)
              </label>
              <input type="file" accept="image/*" onChange={handleVinImageUpload} style={{ fontSize: '12px', width: '100%' }} />
              {scanningVin && <p style={{ fontSize: '11px', color: '#e0872a', margin: '4px 0 0 0' }}>⏳ جاري فحص وقراءة رقم الشاصي تلقائياً...</p>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '4px' }}>رقم الشاصي (VIN)</label>
                <input type="text" placeholder="17 رقم" value={vinNumber} onChange={(e) => setVinNumber(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px', textTransform: 'uppercase' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '4px' }}>رقم القطعة (Part Number)</label>
                <input type="text" placeholder="اختياري" value={partNumber} onChange={(e) => setPartNumber(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px' }} />
              </div>
            </div>

            {/* صورة القطعة القديمة */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '4px' }}>صورة القطعة القديمة (اختياري)</label>
              <input type="file" accept="image/*" style={{ fontSize: '12px', width: '100%' }} />
            </div>

            {/* تفاصيل وملاحظات */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '4px' }}>تفاصيل القطعة وملاحظاتك *</label>
              <textarea required rows={3} placeholder="اكتب اسم القطعة بالتفصيل (مثال: مروحة رديتر جهة السائق)..." value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px', resize: 'vertical' }} />
            </div>

            <button type="submit" disabled={submitting} style={{ backgroundColor: '#e0872a', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', marginTop: '8px', boxShadow: '0 4px 12px rgba(224,135,42,0.3)' }}>
              {submitting ? 'جاري الإرسال لكل الكراجات...' : '🚀 إرسال الطلب لجميع الكراجات'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
