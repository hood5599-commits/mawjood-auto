import React, { useState, useEffect, useRef } from 'react';

interface GarageProps {
  lang: 'ar' | 'en';
  carData: any;
  years: string[];
  supabaseUrl: string;
  apiKey: string;
  session: any;
  onSuccess: () => void;
}

export const GarageDashboard: React.FC<GarageProps> = ({ lang, carData, years, supabaseUrl, apiKey, session, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'add_part' | 'my_parts' | 'inquiries' | 'orders'>('add_part');

  const [partName, setPartName] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [partPrice, setPartPrice] = useState('');
  const [partStock, setPartStock] = useState('1');
  const [partType, setPartType] = useState('مستعمل أصلي');
  const [partMake, setPartMake] = useState('');
  const [partModel, setPartModel] = useState('');
  const [partYear, setPartYear] = useState('');
  const [partEngine, setPartEngine] = useState('');
  const [partImg, setPartImg] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [myParts, setMyParts] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [myInquiries, setMyInquiries] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  // مودال معاينة القطعة المكبرة للكراج
  const [previewPartDetails, setPreviewPartDetails] = useState<any | null>(null);

  // مودال تحديد الضمان
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  const [returnDays, setReturnDays] = useState<number>(3);
  const [warrantyDays, setWarrantyDays] = useState<number>(14);

  const previousInquiriesCount = useRef<number>(0);

  const userId = session?.user?.id || session?.id || session?.phone || session?.email || session?.code || 'garage_unknown';

  const playChimeSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  };

  useEffect(() => {
    fetchMyParts();
    fetchMyOrders();
    fetchMyInquiries();

    const interval = setInterval(() => {
      fetchMyInquiries();
      fetchMyOrders();
    }, 15000);

    return () => clearInterval(interval);
  }, [session]);

  const fetchMyParts = async () => {
    if (!userId || userId === 'garage_unknown') return;
    try {
      const response = await fetch(`${supabaseUrl}/parts?user_id=eq.${userId}&order=id.desc`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` }
      });
      if (response.ok) setMyParts(await response.json());
    } catch (error) {}
  };

  const fetchMyOrders = async () => {
    if (!userId || userId === 'garage_unknown') return;
    try {
      const response = await fetch(`${supabaseUrl}/orders?garage_id=eq.${userId}&order=id.desc`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` }
      });
      if (response.ok) setMyOrders(await response.json());
    } catch (error) {}
  };

  const fetchMyInquiries = async () => {
    if (!userId || userId === 'garage_unknown') return;
    try {
      const response = await fetch(`${supabaseUrl}/fitment_inquiries?garage_id=eq.${userId}&order=id.desc`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` }
      });
      if (response.ok) {
        const data = await response.json();
        const pendingCount = data.filter((item: any) => item.status === 'pending_check').length;
        if (pendingCount > previousInquiriesCount.current && previousInquiriesCount.current !== 0) {
          playChimeSound();
        }
        previousInquiriesCount.current = pendingCount;
        setMyInquiries(data);
      }
    } catch (error) {}
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploadingImage(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    try {
      const uploadUrl = `${supabaseUrl.replace('/rest/v1', '/storage/v1')}/object/part-images/${fileName}`;
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}`, 'Content-Type': file.type },
        body: file
      });
      if (response.ok) {
        setPartImg(`${supabaseUrl.replace('/rest/v1', '/storage/v1')}/object/public/part-images/${fileName}`);
        alert(lang === 'ar' ? 'تم رفع الصورة بنجاح!' : 'Image uploaded!');
      }
    } catch (error) {} finally {
      setUploadingImage(false);
    }
  };

  const handlePublishSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || userId === 'garage_unknown') return alert('Please login again');
    
    try {
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId ? `${supabaseUrl}/parts?id=eq.${editingId}` : `${supabaseUrl}/parts`;
      
      const payload = { 
        name: partName, 
        part_number: partNumber.trim() || null, 
        price: parseFloat(partPrice), 
        stock: parseInt(partStock) || 1, 
        part_type: partType,
        make: partMake, 
        model: partModel, 
        year: partYear, 
        engine: partEngine || 'عام', 
        image_url: partImg || 'https://via.placeholder.com/400', 
        user_id: userId 
      };

      const response = await fetch(url, {
        method,
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${session?.token || apiKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert(lang === 'ar' ? 'تم حفظ القطعة بنجاح! 🎉' : 'Part saved successfully!');
        resetForm();
        fetchMyParts();
        onSuccess();
        setActiveTab('my_parts');
      }
    } catch (error) {}
  };

  const handleConfirmFitment = async () => {
    if (!selectedInquiry) return;
    try {
      const response = await fetch(`${supabaseUrl}/fitment_inquiries?id=eq.${selectedInquiry.id}`, {
        method: 'PATCH',
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'confirmed_compatible',
          return_days: returnDays,
          warranty_days: warrantyDays
        })
      });

      if (response.ok) {
        alert(lang === 'ar' ? 'تم تأكيد التوافق وإرسال مهلة الضمان للعميل بنجاح! ✅' : 'Fitment confirmed!');
        setSelectedInquiry(null);
        fetchMyInquiries();
      }
    } catch (error) {}
  };

  const handleRejectFitment = async (inquiryId: number) => {
    if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد أن القطعة لا تركب على سيارة العميل؟' : 'Are you sure?')) return;
    try {
      const response = await fetch(`${supabaseUrl}/fitment_inquiries?id=eq.${inquiryId}`, {
        method: 'PATCH',
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' })
      });

      if (response.ok) fetchMyInquiries();
    } catch (error) {}
  };

  // 📦 تحديث حالة الطلب من قبل الكراج
  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch(`${supabaseUrl}/orders?id=eq.${orderId}`, {
        method: 'PATCH',
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        alert(lang === 'ar' ? 'تم تحديث حالة الطلب بنجاح! 🚀' : 'Status updated!');
        fetchMyOrders();
      }
    } catch (error) {}
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذه القطعة؟' : 'Are you sure?')) return;
    try {
      const response = await fetch(`${supabaseUrl}/parts?id=eq.${id}`, {
        method: 'DELETE',
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` }
      });
      if (response.ok) { fetchMyParts(); onSuccess(); }
    } catch (error) {}
  };

  const handleEdit = (part: any) => {
    setPartName(part.name); setPartNumber(part.part_number || ''); setPartPrice(part.price ? part.price.toString() : ''); 
    setPartStock((part.stock ?? 1).toString()); setPartType(part.part_type || 'مستعمل أصلي'); setPartMake(part.make); 
    setPartModel(part.model || ''); setPartYear(part.year); setPartEngine(part.engine || ''); setPartImg(part.image_url); 
    setEditingId(part.id); setActiveTab('add_part'); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => { 
    setPartName(''); setPartNumber(''); setPartPrice(''); setPartStock('1'); setPartType('مستعمل أصلي'); 
    setPartMake(''); setPartModel(''); setPartYear(''); setPartEngine(''); setPartImg(''); setEditingId(null); 
  };

  const pendingInquiries = myInquiries.filter(i => i.status === 'pending_check');

  return (
    <div style={{ maxWidth: '900px', margin: '30px auto', display: 'flex', flexDirection: 'column', gap: '25px', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
      
      <div style={{ display: 'flex', gap: '10px', backgroundColor: 'white', padding: '10px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <button onClick={() => { resetForm(); setActiveTab('add_part'); }} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: activeTab === 'add_part' ? '#3182ce' : 'transparent', color: activeTab === 'add_part' ? 'white' : '#4a5568', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>➕ {lang === 'ar' ? 'إضافة قطعة غيار' : 'Add New Part'}</button>

        <button onClick={() => setActiveTab('inquiries')} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: activeTab === 'inquiries' ? '#805ad5' : 'transparent', color: activeTab === 'inquiries' ? 'white' : '#4a5568', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', position: 'relative' }}>
          ❓ {lang === 'ar' ? 'فحص التوافق' : 'Fitment Check'}
          {pendingInquiries.length > 0 && (
            <span style={{ position: 'absolute', top: '5px', right: '10px', backgroundColor: '#e53e3e', color: 'white', fontSize: '11px', padding: '2px 7px', borderRadius: '10px', fontWeight: 'bold' }}>🔴 {pendingInquiries.length}</span>
          )}
        </button>

        <button onClick={() => setActiveTab('my_parts')} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: activeTab === 'my_parts' ? '#38a169' : 'transparent', color: activeTab === 'my_parts' ? 'white' : '#4a5568', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>📦 {lang === 'ar' ? `إعلاناتي (${myParts.length})` : `My Ads (${myParts.length})`}</button>

        <button onClick={() => setActiveTab('orders')} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: activeTab === 'orders' ? '#dd6b20' : 'transparent', color: activeTab === 'orders' ? 'white' : '#4a5568', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>📥 {lang === 'ar' ? `الطلبات (${myOrders.length})` : `Orders (${myOrders.length})`}</button>
      </div>

      {/* 1. نموذج إضافة قطعة */}
      {activeTab === 'add_part' && (
        <div style={{ backgroundColor: 'white', padding: '35px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: '#1a365d', margin: '0 0 20px 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>{editingId ? (lang === 'ar' ? '✏️ تعديل بيانات القطعة' : '✏️ Edit Part') : (lang === 'ar' ? '➕ إضافة قطعة غيار جديدة' : '➕ Add New Part')}</h2>

          <form onSubmit={handlePublishSingle} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>الماركة:</label><select value={partMake} onChange={(e) => { setPartMake(e.target.value); setPartModel(''); setPartEngine(''); }} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required><option value="">اختر الماركة</option>{Object.keys(carData).map(m => <option key={m} value={m}>{m}</option>)}</select></div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>الموديل:</label><select value={partModel} onChange={(e) => setPartModel(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required disabled={!partMake}><option value="">اختر الموديل</option>{partMake && carData[partMake]?.models.map((m: string) => <option key={m} value={m}>{m}</option>)}</select></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>سنة الصنع:</label><select value={partYear} onChange={(e) => setPartYear(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required><option value="">اختر السنة</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>المحرك (اختياري):</label><select value={partEngine} onChange={(e) => setPartEngine(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} disabled={!partMake}><option value="">اختر المحرك</option>{partMake && carData[partMake]?.engines.map((eng: string) => <option key={eng} value={eng}>{eng}</option>)}</select></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>اسم قطعة الغيار:</label><input type="text" placeholder="مثال: دينمو، كمبروسر..." value={partName} onChange={(e) => setPartName(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required /></div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>رقم القطعة (اختياري):</label><input type="text" placeholder="مثال: 27060-0H110" value={partNumber} onChange={(e) => setPartNumber(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} /></div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>نوع / حالة القطعة:</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {[{ label: '🚗 مستعمل أصلي', val: 'مستعمل أصلي', color: '#38a169', bg: '#f0fff4' }, { label: '💎 جديد أصلي (OEM)', val: 'أصلي (OEM)', color: '#2b6cb0', bg: '#ebf8ff' }, { label: '⚙️ تجاري / كوبي', val: 'تجاري / كوبي', color: '#dd6b20', bg: '#fffaf0' }].map(item => (
                  <button key={item.val} type="button" onClick={() => setPartType(item.val)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: partType === item.val ? `2px solid ${item.color}` : '1px solid #cbd5e0', backgroundColor: partType === item.val ? item.bg : '#f7fafc', color: partType === item.val ? item.color : '#4a5568', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>{item.label}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>السعر (ر.ق):</label><input type="number" value={partPrice} onChange={(e) => setPartPrice(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required /></div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>الكمية المتوفرة:</label><input type="number" min="1" value={partStock} onChange={(e) => setPartStock(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required /></div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>صورة القطعة:</label>
              <div style={{ border: '2px dashed #cbd5e0', padding: '20px', borderRadius: '10px', textAlign: 'center', backgroundColor: '#f7fafc', position: 'relative' }}>
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} disabled={uploadingImage} />
                <p style={{ margin: 0, color: '#4a5568', fontWeight: '600' }}>{uploadingImage ? 'جاري الرفع...' : '📸 اضغط هنا لاختيار صورة للقطعة'}</p>
              </div>
              {partImg && <div style={{ marginTop: '15px', textAlign: 'center' }}><img src={partImg} alt="Preview" style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '10px', border: '1px solid #e2e8f0' }} /></div>}
            </div>

            <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: editingId ? '#3182ce' : '#38a169', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>{editingId ? 'حفظ التعديلات' : '🚀 نشر القطعة للبيع'}</button>
          </form>
        </div>
      )}

      {/* 2. استفسارات التوافق الواردة */}
      {activeTab === 'inquiries' && (
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1a365d', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>❓ استفسارات مطابقة التوافق الواردة</h3>

          {myInquiries.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#a0aec0', padding: '30px 0' }}>لا توجد استفسارات جديدة حالياً.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {myInquiries.map(inquiry => (
                <div key={inquiry.id} style={{ padding: '20px', border: inquiry.status === 'pending_check' ? '2px solid #805ad5' : '1px solid #e2e8f0', borderRadius: '15px', backgroundColor: inquiry.status === 'pending_check' ? '#faf5ff' : '#f8fafc' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: '#e9d8fd', color: '#553c9a', padding: '4px 10px', borderRadius: '6px' }}>كود الاستفسار: {inquiry.inquiry_code || `#INQ-${inquiry.id}`}</span>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: inquiry.status === 'pending_check' ? '#dd6b20' : inquiry.status === 'confirmed_compatible' ? '#38a169' : '#e53e3e' }}>
                      {inquiry.status === 'pending_check' ? '⏳ بانتظار ردك' : inquiry.status === 'confirmed_compatible' ? '✅ تم تأكيد التوافق' : '❌ لا تركب'}
                    </span>
                  </div>

                  {/* 📦 كرت تفاصيل القطعة المطلوب الاستفسار عنها (مع إمكانية النقر للمعااينة المكبرة) */}
                  <div 
                    onClick={() => setPreviewPartDetails(inquiry)}
                    style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e0', marginBottom: '12px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                    title="اضغط هنا لمشاهدة القطعة وتفاصيلها بحجم مكبر"
                  >
                    <img src={inquiry.part_image || 'https://via.placeholder.com/60'} alt={inquiry.part_name} style={{ width: '65px', height: '65px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '15px', color: '#1a365d' }}>📦 {inquiry.part_name || 'قطعة من معروضاتك'}</strong>
                        <span style={{ fontSize: '11px', color: '#3182ce', backgroundColor: '#ebf8ff', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>🔍 اضغط للمعاينة</span>
                      </div>
                      {inquiry.part_number && <span style={{ fontSize: '12px', color: '#718096', display: 'block' }}>Part #: {inquiry.part_number}</span>}
                      <span style={{ fontSize: '13.5px', color: '#dd6b20', fontWeight: 'bold' }}>{inquiry.part_price || 0} QAR</span>
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '10px', border: '1px solid #edf2f7', marginBottom: '12px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2d3748', marginBottom: '6px' }}>🚘 سيارة العميل: {inquiry.car_make} - {inquiry.car_model} ({inquiry.car_year}) {inquiry.car_engine && `[${inquiry.car_engine}]`}</div>
                    {inquiry.vin_number && <div style={{ fontSize: '13px', color: '#4a5568', fontFamily: 'monospace' }}>🔑 رقم الشاصي (VIN): <strong>{inquiry.vin_number}</strong></div>}
                    {inquiry.customer_notes && <div style={{ fontSize: '13px', color: '#718096', marginTop: '6px', fontStyle: 'italic' }}>💬 ملاحظات العميل: "{inquiry.customer_notes}"</div>}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    {inquiry.car_registration_img && (
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '11px', color: '#718096', marginBottom: '3px' }}>صورة الاستمارة</span>
                        <a href={inquiry.car_registration_img} target="_blank" rel="noreferrer"><img src={inquiry.car_registration_img} alt="Estimara" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e0' }} /></a>
                      </div>
                    )}
                    {inquiry.old_part_img && (
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '11px', color: '#718096', marginBottom: '3px' }}>القطعة القديمة</span>
                        <a href={inquiry.old_part_img} target="_blank" rel="noreferrer"><img src={inquiry.old_part_img} alt="Old Part" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e0' }} /></a>
                      </div>
                    )}
                  </div>

                  {inquiry.status === 'pending_check' && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => setSelectedInquiry(inquiry)} style={{ flex: 1, padding: '10px', backgroundColor: '#38a169', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>✅ تركب (تأكيد التوافق والضمان)</button>
                      <button onClick={() => handleRejectFitment(inquiry.id)} style={{ flex: 1, padding: '10px', backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>❌ لا تركب (رفض الطلب)</button>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 🔍 نافذة المعاينة المكبرة للقطعة عند ضغط الكراج عليها */}
      {previewPartDetails && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '20px', maxWidth: '500px', width: '90%', textAlign: 'center', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <button onClick={() => setPreviewPartDetails(null)} style={{ position: 'absolute', top: '15px', right: '15px', border: 'none', background: '#edf2f7', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
            <h3 style={{ margin: '0 0 15px 0', color: '#1a365d' }}>🔍 تفاصيل قطعة المعرض</h3>
            <img src={previewPartDetails.part_image || 'https://via.placeholder.com/300'} alt={previewPartDetails.part_name} style={{ width: '100%', maxHeight: '250px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #cbd5e0', marginBottom: '15px' }} />
            <h4 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#2d3748' }}>{previewPartDetails.part_name}</h4>
            {previewPartDetails.part_number && <div style={{ fontSize: '13px', color: '#718096', marginBottom: '8px' }}>رقم القطعة: <strong>{previewPartDetails.part_number}</strong></div>}
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#dd6b20', marginBottom: '15px' }}>{previewPartDetails.part_price || 0} QAR</div>
            <button onClick={() => setPreviewPartDetails(null)} style={{ width: '100%', padding: '10px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>إغلاق المعاينة</button>
          </div>
        </div>
      )}

      {/* 🛡️ نافذة تحديد الضمان */}
      {selectedInquiry && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', maxWidth: '500px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#2b6cb0' }}>🛡️ تحديد شروط ضمان القطعة للعميل</h3>
            <p style={{ fontSize: '13.5px', color: '#4a5568', marginBottom: '20px' }}>أكد أن القطعة <strong>({selectedInquiry.part_name})</strong> تطابق سيارة العميل <strong>({selectedInquiry.car_make} {selectedInquiry.car_model})</strong> وحدد مهلة الضمان:</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 'bold', marginBottom: '6px' }}>1️⃣ مهلة الإرجاع قبل/عند التركيب (أيام):</label>
                <select value={returnDays} onChange={(e) => setReturnDays(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0' }}>
                  <option value={1}>يوم واحد</option>
                  <option value={3}>3 أيام (موصى به)</option>
                  <option value={5}>5 أيام</option>
                  <option value={7}>7 أيام</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 'bold', marginBottom: '6px' }}>2️⃣ فترة ضمان التشغيل بعد التركيب (أيام):</label>
                <select value={warrantyDays} onChange={(e) => setWarrantyDays(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0' }}>
                  <option value={7}>7 أيام</option>
                  <option value={14}>14 يوماً (موصى به)</option>
                  <option value={30}>شهر كامل (30 يوماً)</option>
                  <option value={90}>3 أشهر</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleConfirmFitment} style={{ flex: 1, padding: '12px', backgroundColor: '#38a169', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>🚀 تأكيد وإرسال للعميل</button>
              <button onClick={() => setSelectedInquiry(null)} style={{ padding: '12px 20px', backgroundColor: '#edf2f7', color: '#4a5568', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. إعلانات الكراج */}
      {activeTab === 'my_parts' && (
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1a365d' }}>📦 جميع القطع المعروضة ({myParts.length})</h3>
          {myParts.map(part => (
            <div key={part.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '10px', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <img src={part.image_url || 'https://via.placeholder.com/60'} alt={part.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: '#2d3748', fontSize: '16px' }}>{part.name} {part.part_number && <span style={{ fontSize: '12px', color: '#718096' }}>[PN: {part.part_number}]</span>}</h4>
                  <div style={{ fontSize: '12.5px', color: '#718096', marginBottom: '4px' }}>🚘 {part.make} - {part.model} ({part.year})</div>
                  <div><span style={{ color: '#dd6b20', fontWeight: 'bold' }}>{part.price} QAR</span> | <span style={{ fontSize: '12px', color: '#2b6cb0', fontWeight: 'bold' }}>{part.part_type || 'مستعمل'}</span></div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleEdit(part)} style={{ padding: '8px 14px', backgroundColor: '#ebf8ff', color: '#3182ce', border: '1px solid #bee3f8', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>✏️ تعديل</button>
                <button onClick={() => handleDelete(part.id)} style={{ padding: '8px 14px', backgroundColor: '#fff5f5', color: '#e53e3e', border: '1px solid #fed7d7', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>🗑️ حذف</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. الطلبات الواردة من العملاء مع توضيح الموقع وأزرار المتابعة */}
      {activeTab === 'orders' && (
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1a365d' }}>📥 الطلبات الواردة للشحن والاستلام</h3>
          {myOrders.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#a0aec0', padding: '30px 0' }}>لا توجد طلبات جديدة حالياً.</p>
          ) : (
            myOrders.map(order => (
              <div key={order.id} style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '15px', marginBottom: '15px', backgroundColor: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#3182ce', backgroundColor: '#ebf8ff', padding: '3px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '6px' }}>كود الطلب: {order.order_code || `#ORD-${order.id}`}</span>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '17px', color: '#2d3748' }}>{order.part_name}</h4>
                  </div>
                  <span style={{ fontWeight: 'bold', color: '#dd6b20', fontSize: '18px' }}>{order.price} QAR</span>
                </div>

                {/* تفاصيل الموقع والاستلام للكراج */}
                <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #edf2f7', fontSize: '13px', color: '#4a5568', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    🚚 طريقة التسليم: {order.delivery_type === 'delivery' ? 'توصيل لموقع العميل' : '🏪 استلام من مقر موجود أووتو'}
                  </div>
                  {order.delivery_type === 'delivery' && (
                    <div style={{ marginTop: '6px' }}>
                      📍 العنوان: <strong>{order.address_details || 'غير محدد'}</strong>
                      {order.location_lat && order.location_lng && (
                        <a 
                          href={`https://www.google.com/maps?q=${order.location_lat},${order.location_lng}`} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{ display: 'inline-block', marginRight: '10px', backgroundColor: '#3182ce', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', textDecoration: 'none' }}
                        >
                          🗺️ فتح موقع العميل في Google Maps
                        </a>
                      )}
                    </div>
                  )}
                  {order.pickup_code && <div style={{ color: '#2f855a', fontWeight: 'bold', marginTop: '6px' }}>🔑 كود تسليم المندوب: {order.pickup_code}</div>}
                </div>

                {/* أزرار تحديث حالة الطلب من قبل الكراج */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'ready_for_pickup')} 
                    style={{ flex: 1, padding: '9px', backgroundColor: '#38a169', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12.5px' }}
                  >
                    ✅ تأكيد توفر القطعة وتجهيزها
                  </button>
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'handed_to_driver')} 
                    style={{ flex: 1, padding: '9px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12.5px' }}
                  >
                    🚚 تم تسليم القطعة للمندوب
                  </button>
                </div>

              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};
