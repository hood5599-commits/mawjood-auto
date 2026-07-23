import React, { useState, useEffect } from 'react';
import { t } from '../utils/translations.ts';

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
  const [activeTab, setActiveTab] = useState<'parts' | 'orders'>('parts');

  const [partName, setPartName] = useState('');
  const [partPrice, setPartPrice] = useState('');
  const [partMake, setPartMake] = useState('');
  const [partModel, setPartModel] = useState('');
  const [partYear, setPartYear] = useState('');
  const [partEngine, setPartEngine] = useState('');
  const [partImg, setPartImg] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [myParts, setMyParts] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [orderNotes, setOrderNotes] = useState<Record<number, string>>({});
  const [editingId, setEditingId] = useState<number | null>(null);

  const userId = session?.user?.id || session?.id || session?.phone || session?.email || session?.code || 'garage_unknown';

  const fetchMyParts = async () => {
    if (!userId || userId === 'garage_unknown') return;
    try {
      const response = await fetch(`${supabaseUrl}/parts?user_id=eq.${userId}&order=id.desc`, { headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` } });
      if (response.ok) setMyParts(await response.json());
    } catch (error) { console.error(error); }
  };

  const fetchMyOrders = async () => {
    if (!userId || userId === 'garage_unknown') return;
    try {
      const response = await fetch(`${supabaseUrl}/orders?garage_id=eq.${userId}&order=id.desc`, { headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` } });
      if (response.ok) setMyOrders(await response.json());
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    fetchMyParts();
    fetchMyOrders();
  }, [session]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploadingImage(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    try {
      const uploadUrl = `${supabaseUrl.replace('/rest/v1', '/storage/v1')}/object/part-images/${fileName}`;
      const response = await fetch(uploadUrl, { method: 'POST', headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}`, 'Content-Type': file.type }, body: file });
      if (response.ok) {
        setPartImg(`${supabaseUrl.replace('/rest/v1', '/storage/v1')}/object/public/part-images/${fileName}`);
        alert(lang === 'ar' ? 'تم رفع الصورة بنجاح!' : 'Image uploaded!');
      }
    } catch (error) {} finally { setUploadingImage(false); }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || userId === 'garage_unknown') return alert('Please login again');
    try {
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId ? `${supabaseUrl}/parts?id=eq.${editingId}` : `${supabaseUrl}/parts`;
      const payload = { name: partName, price: parseFloat(partPrice), make: partMake, model: partModel, year: partYear, engine: partEngine, image_url: partImg || 'https://via.placeholder.com/400', user_id: userId };
      const response = await fetch(url, { method, headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' }, body: JSON.stringify(payload) });
      if (response.ok) { alert(lang === 'ar' ? 'تم الحفظ!' : 'Saved!'); resetForm(); fetchMyParts(); onSuccess(); }
    } catch (error: any) { alert('Error saving'); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure?')) return;
    try {
      const response = await fetch(`${supabaseUrl}/parts?id=eq.${id}`, { method: 'DELETE', headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` } });
      if (response.ok) { fetchMyParts(); onSuccess(); }
    } catch (error) {}
  };

  const handleEdit = (part: any) => {
    setPartName(part.name); setPartPrice(part.price.toString()); setPartMake(part.make); setPartModel(part.model || ''); setPartYear(part.year); setPartEngine(part.engine || ''); setPartImg(part.image_url); setEditingId(part.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => { setPartName(''); setPartPrice(''); setPartMake(''); setPartModel(''); setPartYear(''); setPartEngine(''); setPartImg(''); setEditingId(null); };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const noteToSave = orderNotes[orderId] || '';
      const response = await fetch(`${supabaseUrl}/orders?id=eq.${orderId}`, {
        method: 'PATCH',
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes: noteToSave })
      });
      if (response.ok) {
        alert(lang === 'ar' ? 'تم تحديث حالة الطلب بنجاح' : 'Order status updated');
        fetchMyOrders();
      }
    } catch (error) { alert('Error updating order'); }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      <div style={{ display: 'flex', gap: '10px', backgroundColor: 'white', padding: '10px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
        <button onClick={() => setActiveTab('parts')} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: activeTab === 'parts' ? '#3182ce' : 'transparent', color: activeTab === 'parts' ? 'white' : '#4a5568', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
          📦 {lang === 'ar' ? 'إدارة الإعلانات' : 'Manage Ads'}
        </button>
        <button onClick={() => setActiveTab('orders')} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: activeTab === 'orders' ? '#dd6b20' : 'transparent', color: activeTab === 'orders' ? 'white' : '#4a5568', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', position: 'relative' }}>
          📥 {lang === 'ar' ? 'الطلبات الواردة' : 'Incoming Orders'}
          {myOrders.filter(o => o.status === 'pending').length > 0 && (
            <span style={{ position: 'absolute', top: '5px', right: '10px', backgroundColor: '#e53e3e', color: 'white', fontSize: '11px', padding: '2px 6px', borderRadius: '10px' }}>
              {myOrders.filter(o => o.status === 'pending').length} جديد
            </span>
          )}
        </button>
      </div>

      {activeTab === 'parts' && (
        <>
          <div style={{ backgroundColor: 'white', padding: '35px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
            <h2 style={{ color: '#1a365d', margin: '0 0 20px 0' }}>{editingId ? '✏️ تعديل' : '➕ إضافة'}</h2>
            <form onSubmit={handlePublish} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>{t[lang].partNameLabel}</label><input type="text" placeholder={t[lang].partNamePlaceholder} value={partName} onChange={(e) => setPartName(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required /></div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>{t[lang].priceLabel}</label><input type="number" placeholder={t[lang].pricePlaceholder} value={partPrice} onChange={(e) => setPartPrice(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>{t[lang].makeLabel}</label><select value={partMake} onChange={(e) => { setPartMake(e.target.value); setPartModel(''); setPartEngine(''); }} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required><option value="">{t[lang].selectMake}</option>{Object.keys(carData).map(make => <option key={make} value={make}>{make}</option>)}</select></div>
                <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>{t[lang].modelLabel}</label><select value={partModel} onChange={(e) => setPartModel(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required disabled={!partMake}><option value="">{t[lang].selectModel}</option>{partMake && carData[partMake]?.models.map((model: string) => <option key={model} value={model}>{model}</option>)}</select></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>{t[lang].yearLabel}</label><select value={partYear} onChange={(e) => setPartYear(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required><option value="">{t[lang].selectYear}</option>{years.map(year => <option key={year} value={year}>{year}</option>)}</select></div>
                <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>{t[lang].engineLabel}</label><select value={partEngine} onChange={(e) => setPartEngine(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required disabled={!partMake}><option value="">{t[lang].selectEngine}</option>{partMake && carData[partMake]?.engines.map((engine: string) => <option key={engine} value={engine}>{engine}</option>)}</select></div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>{t[lang].uploadLabel}</label>
                <div style={{ border: '2px dashed #cbd5e0', padding: '20px', borderRadius: '10px', textAlign: 'center', backgroundColor: '#f7fafc', cursor: 'pointer', position: 'relative' }}><input type="file" accept="image/*" onChange={handleImageUpload} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} disabled={uploadingImage} /><p style={{ margin: 0, color: '#4a5568', fontWeight: '600' }}>{uploadingImage ? 'جاري الرفع...' : 'اضغط هنا لاختيار صورة'}</p></div>
                {partImg && <div style={{ marginTop: '15px', textAlign: 'center' }}><img src={partImg} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '10px' }} /></div>}
              </div>
              <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: editingId ? '#3182ce' : '#38a169', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>{editingId ? 'حفظ التعديلات' : 'نشر القطعة'}</button>
            </form>
          </div>

          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1a365d' }}>📦 إعلاناتي ({myParts.length})</h3>
            {myParts.map(part => (
              <div key={part.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '10px' }}>
                <div><h4 style={{ margin: '0 0 5px 0' }}>{part.name}</h4><span style={{ color: '#dd6b20', fontWeight: 'bold' }}>{part.price} QAR</span></div>
                <div style={{ display: 'flex', gap: '10px' }}><button onClick={() => handleEdit(part)} style={{ padding: '8px 12px', backgroundColor: '#ebf8ff', color: '#3182ce', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>تعديل</button><button onClick={() => handleDelete(part.id)} style={{ padding: '8px 12px', backgroundColor: '#fff5f5', color: '#e53e3e', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>حذف</button></div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'orders' && (
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1a365d' }}>📥 الطلبات الواردة من العملاء</h3>
          
          {myOrders.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#a0aec0', padding: '30px 0' }}>لا توجد طلبات جديدة.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {myOrders.map(order => (
                <div key={order.id} style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '15px', backgroundColor: order.status === 'pending' ? '#fffff0' : '#f8fafc' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <div>
                      {/* 🔥 تم إخفاء رقم/إيميل العميل، وعرض رقم الطلب فقط للحفاظ على الخصوصية وحماية أرباحك */}
                      <span style={{ fontSize: '13px', backgroundColor: '#edf2f7', color: '#2b6cb0', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold' }}>
                        📦 رقم الطلب: #{order.id}
                      </span>
                      <h4 style={{ margin: '8px 0 5px 0', fontSize: '18px', color: '#2d3748' }}>{order.part_name}</h4>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#dd6b20' }}>{order.price} QAR</span>
                      <div style={{ marginTop: '5px' }}>
                        {order.status === 'pending' && <span style={{ backgroundColor: '#fefcbf', color: '#b7791f', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>قيد الانتظار ⏳</span>}
                        {order.status === 'confirmed' && <span style={{ backgroundColor: '#c6f6d5', color: '#2f855a', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>تم التأكيد والتجهيز ✅</span>}
                        {order.status === 'rejected' && <span style={{ backgroundColor: '#fed7d7', color: '#c53030', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>مرفوض / غير متوفر ❌</span>}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '13px', color: '#718096', fontWeight: 'bold' }}>ملاحظات للإدارة / سبب الرفض:</label>
                    <input type="text" placeholder="اكتب ملاحظة (اختياري)..." value={orderNotes[order.id] !== undefined ? orderNotes[order.id] : (order.notes || '')} onChange={(e) => setOrderNotes({ ...orderNotes, [order.id]: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box', marginTop: '5px' }} />
                  </div>

                  {order.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => updateOrderStatus(order.id, 'confirmed')} style={{ flex: 1, padding: '10px', backgroundColor: '#38a169', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>تأكيد الطلب (متاح) ✅</button>
                      <button onClick={() => updateOrderStatus(order.id, 'rejected')} style={{ flex: 1, padding: '10px', backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>رفض / غير متوفر ❌</button>
                    </div>
                  )}
                  {order.status !== 'pending' && (
                    <button onClick={() => updateOrderStatus(order.id, 'pending')} style={{ padding: '8px 15px', backgroundColor: '#edf2f7', color: '#4a5568', border: '1px solid #cbd5e0', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>تراجع (إعادة الطلب لقيد الانتظار) 🔄</button>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
