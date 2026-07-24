import React, { useState, useEffect } from 'react';

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
  const [activeTab, setActiveTab] = useState<'add_part' | 'my_parts' | 'orders'>('add_part');

  // بيانات نموذج القطعة
  const [partName, setPartName] = useState('');
  const [partNumber, setPartNumber] = useState(''); // حقل اختياري يدوي
  const [partPrice, setPartPrice] = useState('');
  const [partStock, setPartStock] = useState('1');
  const [partType, setPartType] = useState('مستعمل أصلي');
  const [partMake, setPartMake] = useState('');
  const [partModel, setPartModel] = useState('');
  const [partYear, setPartYear] = useState('');
  const [partEngine, setPartEngine] = useState('');
  const [partImg, setPartImg] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // القوائم والبيانات
  const [myParts, setMyParts] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [orderNotes, setOrderNotes] = useState<Record<number, string>>({});
  const [editingId, setEditingId] = useState<number | null>(null);

  const userId = session?.user?.id || session?.id || session?.phone || session?.email || session?.code || 'garage_unknown';

  useEffect(() => {
    fetchMyParts();
    fetchMyOrders();
  }, [session]);

  const fetchMyParts = async () => {
    if (!userId || userId === 'garage_unknown') return;
    try {
      const response = await fetch(`${supabaseUrl}/parts?user_id=eq.${userId}&order=id.desc`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` }
      });
      if (response.ok) setMyParts(await response.json());
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMyOrders = async () => {
    if (!userId || userId === 'garage_unknown') return;
    try {
      const response = await fetch(`${supabaseUrl}/orders?garage_id=eq.${userId}&order=id.desc`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` }
      });
      if (response.ok) setMyOrders(await response.json());
    } catch (error) {
      console.error(error);
    }
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
    } catch (error) {
      alert('Upload error');
    } finally {
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
        part_number: partNumber.trim() || null, // اختياري يدوي
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
    } catch (error) {
      alert('Error saving part');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذه القطعة؟' : 'Are you sure?')) return;
    try {
      const response = await fetch(`${supabaseUrl}/parts?id=eq.${id}`, {
        method: 'DELETE',
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` }
      });
      if (response.ok) {
        fetchMyParts();
        onSuccess();
      }
    } catch (error) {}
  };

  const handleEdit = (part: any) => {
    setPartName(part.name); 
    setPartNumber(part.part_number || ''); 
    setPartPrice(part.price ? part.price.toString() : ''); 
    setPartStock((part.stock ?? 1).toString());
    setPartType(part.part_type || 'مستعمل أصلي');
    setPartMake(part.make); 
    setPartModel(part.model || ''); 
    setPartYear(part.year); 
    setPartEngine(part.engine || ''); 
    setPartImg(part.image_url); 
    setEditingId(part.id);
    setActiveTab('add_part');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => { 
    setPartName(''); 
    setPartNumber(''); 
    setPartPrice(''); 
    setPartStock('1'); 
    setPartType('مستعمل أصلي'); 
    setPartMake(''); 
    setPartModel(''); 
    setPartYear(''); 
    setPartEngine(''); 
    setPartImg(''); 
    setEditingId(null); 
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const noteToSave = orderNotes[orderId] || '';
      const response = await fetch(`${supabaseUrl}/orders?id=eq.${orderId}`, {
        method: 'PATCH',
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes: noteToSave })
      });
      if (response.ok) {
        alert(lang === 'ar' ? 'تم تحديث حالة الطلب' : 'Status updated');
        fetchMyOrders();
      }
    } catch (error) {}
  };

  return (
    <div style={{ maxWidth: '850px', margin: '30px auto', display: 'flex', flexDirection: 'column', gap: '25px', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
      
      {/* أزرار التنقل الرئيسية */}
      <div style={{ display: 'flex', gap: '10px', backgroundColor: 'white', padding: '10px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <button 
          onClick={() => { resetForm(); setActiveTab('add_part'); }} 
          style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: activeTab === 'add_part' ? '#3182ce' : 'transparent', color: activeTab === 'add_part' ? 'white' : '#4a5568', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
        >
          ➕ {lang === 'ar' ? 'إضافة قطعة غيار' : 'Add New Part'}
        </button>
        <button 
          onClick={() => setActiveTab('my_parts')} 
          style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: activeTab === 'my_parts' ? '#38a169' : 'transparent', color: activeTab === 'my_parts' ? 'white' : '#4a5568', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
        >
          📦 {lang === 'ar' ? `إعلاناتي (${myParts.length})` : `My Ads (${myParts.length})`}
        </button>
        <button 
          onClick={() => setActiveTab('orders')} 
          style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: activeTab === 'orders' ? '#dd6b20' : 'transparent', color: activeTab === 'orders' ? 'white' : '#4a5568', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', position: 'relative' }}
        >
          📥 {lang === 'ar' ? `الطلبات الواردة (${myOrders.length})` : `Orders (${myOrders.length})`}
        </button>
      </div>

      {/* 1. نموذج إضافة أو تعديل قطعة */}
      {activeTab === 'add_part' && (
        <div style={{ backgroundColor: 'white', padding: '35px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: '#1a365d', margin: '0 0 20px 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
            {editingId ? (lang === 'ar' ? '✏️ تعديل بيانات القطعة' : '✏️ Edit Part') : (lang === 'ar' ? '➕ إضافة قطعة غيار جديدة' : '➕ Add New Part')}
          </h2>

          <form onSubmit={handlePublishSingle} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* اختيار الماركة والموديل */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>{lang === 'ar' ? 'شركة تصنيع السيارة (الماركة):' : 'Make:'}</label>
                <select value={partMake} onChange={(e) => { setPartMake(e.target.value); setPartModel(''); setPartEngine(''); }} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required>
                  <option value="">{lang === 'ar' ? 'اختر الماركة (مثل: تويوتا)' : 'Select Make'}</option>
                  {Object.keys(carData).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>{lang === 'ar' ? 'موديل السيارة:' : 'Model:'}</label>
                <select value={partModel} onChange={(e) => setPartModel(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required disabled={!partMake}>
                  <option value="">{lang === 'ar' ? 'اختر الموديل (مثل: كامري)' : 'Select Model'}</option>
                  {partMake && carData[partMake]?.models.map((m: string) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            {/* سنة الصنع وحجم المحرك */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>{lang === 'ar' ? 'سنة الصنع:' : 'Year:'}</label>
                <select value={partYear} onChange={(e) => setPartYear(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required>
                  <option value="">{lang === 'ar' ? 'اختر السنة' : 'Select Year'}</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>{lang === 'ar' ? 'حجم المحرك / الفئة (اختياري):' : 'Engine (Optional):'}</label>
                <select value={partEngine} onChange={(e) => setPartEngine(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} disabled={!partMake}>
                  <option value="">{lang === 'ar' ? 'اختر المحرك (إن وجد)' : 'Select Engine'}</option>
                  {partMake && carData[partMake]?.engines.map((eng: string) => <option key={eng} value={eng}>{eng}</option>)}
                </select>
              </div>
            </div>

            {/* اسم القطعة ورقم القطعة اليدوي */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>{lang === 'ar' ? 'اسم قطعة الغيار:' : 'Part Name:'}</label>
                <input 
                  type="text" 
                  placeholder={lang === 'ar' ? 'مثال: دينمو، كمبروسر، سلف، رفرف' : 'e.g. Alternator'} 
                  value={partName} 
                  onChange={(e) => setPartName(e.target.value)} 
                  style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} 
                  required 
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>{lang === 'ar' ? 'رقم القطعة / البارت نمبر (اختياري):' : 'Part Number (Optional):'}</label>
                <input 
                  type="text" 
                  placeholder="مثال: 27060-0H110" 
                  value={partNumber} 
                  onChange={(e) => setPartNumber(e.target.value)} 
                  style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} 
                />
              </div>
            </div>

            {/* اختيار حالة القطعة */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#2d3748' }}>
                {lang === 'ar' ? 'نوع / حالة القطعة:' : 'Condition / Type:'}
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {[
                  { label: lang === 'ar' ? '🚗 مستعمل أصلي (تشليح)' : 'Used Original', val: 'مستعمل أصلي', color: '#38a169', bg: '#f0fff4' },
                  { label: lang === 'ar' ? '💎 جديد أصلي (OEM)' : 'New Original', val: 'أصلي (OEM)', color: '#2b6cb0', bg: '#ebf8ff' },
                  { label: lang === 'ar' ? '⚙️ تجاري / كوبي' : 'Aftermarket / Copy', val: 'تجاري / كوبي', color: '#dd6b20', bg: '#fffaf0' }
                ].map(item => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setPartType(item.val)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: partType === item.val ? `2px solid ${item.color}` : '1px solid #cbd5e0',
                      backgroundColor: partType === item.val ? item.bg : '#f7fafc',
                      color: partType === item.val ? item.color : '#4a5568',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* السعر والكمية */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>{lang === 'ar' ? 'السعر (ر.ق / QAR):' : 'Price (QAR):'}</label>
                <input 
                  type="number" 
                  placeholder="مثال: 350" 
                  value={partPrice} 
                  onChange={(e) => setPartPrice(e.target.value)} 
                  style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} 
                  required 
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>{lang === 'ar' ? 'الكمية المتوفرة:' : 'Stock Quantity:'}</label>
                <input 
                  type="number" 
                  min="1" 
                  value={partStock} 
                  onChange={(e) => setPartStock(e.target.value)} 
                  style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} 
                  required 
                />
              </div>
            </div>

            {/* رفع الصورة */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>{lang === 'ar' ? 'صورة القطعة:' : 'Part Image:'}</label>
              <div style={{ border: '2px dashed #cbd5e0', padding: '20px', borderRadius: '10px', textAlign: 'center', backgroundColor: '#f7fafc', position: 'relative' }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} 
                  disabled={uploadingImage} 
                />
                <p style={{ margin: 0, color: '#4a5568', fontWeight: '600' }}>
                  {uploadingImage ? (lang === 'ar' ? 'جاري رفع الصورة...' : 'Uploading...') : (lang === 'ar' ? '📸 اضغط هنا لاختيار صورة للقطعة' : 'Upload Part Photo')}
                </p>
              </div>
              {partImg && (
                <div style={{ marginTop: '15px', textAlign: 'center' }}>
                  <img src={partImg} alt="Preview" style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                </div>
              )}
            </div>

            {/* زر الحفظ */}
            <button 
              type="submit" 
              style={{ width: '100%', padding: '14px', backgroundColor: editingId ? '#3182ce' : '#38a169', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
            >
              {editingId ? (lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes') : (lang === 'ar' ? '🚀 نشر القطعة للبيع' : 'Publish Part')}
            </button>

          </form>
        </div>
      )}

      {/* 2. قائمة إعلانات الكراج */}
      {activeTab === 'my_parts' && (
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1a365d' }}>
            📦 {lang === 'ar' ? `جميع القطع المعروضة (${myParts.length})` : `My Published Parts (${myParts.length})`}
          </h3>

          {myParts.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#a0aec0', padding: '30px 0' }}>{lang === 'ar' ? 'لا توجد قطع معروضة حالياً.' : 'No parts listed yet.'}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {myParts.map(part => (
                <div key={part.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: '#f8fafc' }}>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <img src={part.image_url || 'https://via.placeholder.com/60'} alt={part.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', color: '#2d3748', fontSize: '16px' }}>
                        {part.name} {part.part_number && <span style={{ fontSize: '12px', color: '#718096', fontWeight: 'normal' }}>[PN: {part.part_number}]</span>}
                      </h4>
                      <div style={{ fontSize: '12.5px', color: '#718096', marginBottom: '4px' }}>
                        🚘 {part.make} - {part.model} ({part.year})
                      </div>
                      <div>
                        <span style={{ color: '#dd6b20', fontWeight: 'bold' }}>{part.price} QAR</span>
                        <span style={{ margin: '0 8px', color: '#cbd5e0' }}>|</span>
                        <span style={{ fontSize: '12px', color: '#2b6cb0', fontWeight: 'bold' }}>{part.part_type || 'مستعمل'}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEdit(part)} style={{ padding: '8px 14px', backgroundColor: '#ebf8ff', color: '#3182ce', border: '1px solid #bee3f8', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                      ✏️ {lang === 'ar' ? 'تعديل' : 'Edit'}
                    </button>
                    <button onClick={() => handleDelete(part.id)} style={{ padding: '8px 14px', backgroundColor: '#fff5f5', color: '#e53e3e', border: '1px solid #fed7d7', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                      🗑️ {lang === 'ar' ? 'حذف' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. الطلبات الواردة */}
      {activeTab === 'orders' && (
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1a365d' }}>
            📥 {lang === 'ar' ? 'الطلبات الواردة من العملاء' : 'Incoming Orders'}
          </h3>

          {myOrders.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#a0aec0', padding: '30px 0' }}>{lang === 'ar' ? 'لا توجد طلبات جديدة حالياً.' : 'No orders received yet.'}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {myOrders.map(order => (
                <div key={order.id} style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '15px', backgroundColor: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '17px', color: '#2d3748' }}>{order.part_name}</h4>
                      <p style={{ margin: 0, fontSize: '13.5px', color: '#718096' }}>📞 {lang === 'ar' ? 'هاتف العميل:' : 'Phone:'} <strong>{order.customer_phone}</strong></p>
                    </div>
                    <span style={{ fontWeight: 'bold', color: '#dd6b20', fontSize: '18px' }}>{order.price} QAR</span>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <input 
                      type="text" 
                      placeholder={lang === 'ar' ? 'ملاحظات الطلب (اختياري)...' : 'Order Notes...'} 
                      value={orderNotes[order.id] !== undefined ? orderNotes[order.id] : (order.notes || '')} 
                      onChange={(e) => setOrderNotes({ ...orderNotes, [order.id]: e.target.value })} 
                      style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box', fontSize: '13px' }} 
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => updateOrderStatus(order.id, 'confirmed')} style={{ flex: 1, padding: '10px', backgroundColor: '#38a169', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                      ✅ {lang === 'ar' ? 'تأكيد الطلب (متوفر)' : 'Confirm Order'}
                    </button>
                    <button onClick={() => updateOrderStatus(order.id, 'rejected')} style={{ flex: 1, padding: '10px', backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                      ❌ {lang === 'ar' ? 'رفض (غير متوفر)' : 'Reject'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
