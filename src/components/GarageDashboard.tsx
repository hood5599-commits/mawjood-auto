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

const STANDARD_CAR_PARTS = [
  { name: 'محرك كامل (ماكينة)', code: 'ENG', price: 3500, stock: 1 },
  { name: 'ناقل حركة (جيربكس)', code: 'TRN', price: 2200, stock: 1 },
  { name: 'سلف (Starter)', code: 'STR', price: 350, stock: 1 },
  { name: 'دينمو كهرباء (Alternator)', code: 'ALT', price: 400, stock: 1 },
  { name: 'كمبروسر تكييف (AC Compressor)', code: 'CMP', price: 650, stock: 1 },
  { name: 'راديتر ماء (Radiator)', code: 'RAD', price: 300, stock: 1 },
  { name: 'شمعة إضاءة أمامية (يمين)', code: 'HL-R', price: 450, stock: 1 },
  { name: 'شمعة إضاءة أمامية (يسار)', code: 'HL-L', price: 450, stock: 1 },
  { name: 'إسطب خلفي (يمين)', code: 'TL-R', price: 250, stock: 1 },
  { name: 'إسطب خلفي (يسار)', code: 'TL-L', price: 250, stock: 1 },
  { name: 'مساعدات أمامية (طقم)', code: 'SHK-F', price: 500, stock: 1 },
  { name: 'مساعدات خلفية (طقم)', code: 'SHK-R', price: 400, stock: 1 },
  { name: 'مضخة وقود (طلمبة بنزين)', code: 'FP', price: 300, stock: 1 },
  { name: 'باب أمامي (يمين)', code: 'DR-FR', price: 600, stock: 1 },
  { name: 'باب أمامي (يسار)', code: 'DR-FL', price: 600, stock: 1 },
  { name: 'كابوت / غطاء محرك (Hood)', code: 'HD', price: 700, stock: 1 },
];

export const GarageDashboard: React.FC<GarageProps> = ({ lang, carData, years, supabaseUrl, apiKey, session, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'parts' | 'orders' | 'bulk_car'>('parts');

  // إضافة قطعة واحدة
  const [partName, setPartName] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [partPrice, setPartPrice] = useState('');
  const [partStock, setPartStock] = useState('5');
  const [partType, setPartType] = useState('أصلي (OEM)');
  const [partMake, setPartMake] = useState('');
  const [partModel, setPartModel] = useState('');
  const [partYear, setPartYear] = useState('');
  const [partEngine, setPartEngine] = useState('');
  const [partImg, setPartImg] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // إضافة سيارة كاملة
  const [bulkMake, setBulkMake] = useState('');
  const [bulkModel, setBulkModel] = useState('');
  const [bulkYear, setBulkYear] = useState('');
  const [bulkEngine, setBulkEngine] = useState('');
  const [bulkImage, setBulkImage] = useState('');
  const [bulkPartType, setBulkPartType] = useState('مستعمل أصلي');
  const [selectedParts, setSelectedParts] = useState<Record<string, { enabled: boolean; price: number; stock: number }>>({});
  const [isBulkPublishing, setIsBulkPublishing] = useState(false);

  const [myParts, setMyParts] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [orderNotes, setOrderNotes] = useState<Record<number, string>>({});
  const [editingId, setEditingId] = useState<number | null>(null);

  const userId = session?.user?.id || session?.id || session?.phone || session?.email || session?.code || 'garage_unknown';

  useEffect(() => {
    const initialPartsState: Record<string, { enabled: boolean; price: number; stock: number }> = {};
    STANDARD_CAR_PARTS.forEach(p => {
      initialPartsState[p.code] = { enabled: true, price: p.price, stock: p.stock };
    });
    setSelectedParts(initialPartsState);

    fetchMyParts();
    fetchMyOrders();
  }, [session]);

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

  // 🔥 دالة الذكاء الاصطناعي المحدثة والمضمونة لتوليد رقم القطعة
  const fetchAiPartNumber = async () => {
    if (!partMake || !partModel || !partName) {
      alert(lang === 'ar' ? 'يرجى اختيار الماركة والموديل وكتابة اسم القطعة أولاً' : 'Please select Make, Model, and Part Name first');
      return;
    }

    setIsAiLoading(true);
    try {
      const prompt = `Give me a standard OEM part number for a ${partMake} ${partModel} ${partName}. Return ONLY the part number code, nothing else.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      );

      const data = await response.json();
      const aiNumber = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (aiNumber) {
        const cleanNum = aiNumber.replace(/[`*'"\n]/g, '').trim();
        setPartNumber(cleanNum);
      } else {
        const fallbackNum = `${partMake.substring(0,3).toUpperCase()}-${partModel.substring(0,3).toUpperCase()}-${Date.now().toString().slice(-5)}`;
        setPartNumber(fallbackNum);
      }
    } catch (e) {
      const fallbackNum = `OEM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      setPartNumber(fallbackNum);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setImgFn: (url: string) => void) => {
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
        setImgFn(`${supabaseUrl.replace('/rest/v1', '/storage/v1')}/object/public/part-images/${fileName}`);
        alert(lang === 'ar' ? 'تم رفع الصورة بنجاح!' : 'Image uploaded!');
      }
    } catch (error) {} finally { setUploadingImage(false); }
  };

  const handlePublishSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || userId === 'garage_unknown') return alert('Please login again');
    try {
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId ? `${supabaseUrl}/parts?id=eq.${editingId}` : `${supabaseUrl}/parts`;
      const payload = { 
        name: partName, 
        part_number: partNumber || `OEM-${Date.now().toString().slice(-6)}`,
        price: parseFloat(partPrice), 
        stock: parseInt(partStock) || 1, 
        part_type: partType,
        make: partMake, 
        model: partModel, 
        year: partYear, 
        engine: partEngine, 
        image_url: partImg || 'https://via.placeholder.com/400', 
        user_id: userId 
      };
      const response = await fetch(url, { method, headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' }, body: JSON.stringify(payload) });
      if (response.ok) { alert(lang === 'ar' ? 'تم الحفظ!' : 'Saved!'); resetForm(); fetchMyParts(); onSuccess(); }
    } catch (error: any) { alert('Error saving'); }
  };

  const handlePublishBulkCar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkMake || !bulkModel || !bulkYear) {
      return alert(lang === 'ar' ? 'يرجى اختيار الماركة والموديل والسنة أولاً' : 'Please select Make, Model, and Year');
    }

    setIsBulkPublishing(true);

    try {
      const payloadBatch = STANDARD_CAR_PARTS
        .filter(p => selectedParts[p.code]?.enabled)
        .map(p => {
          const makeClean = bulkMake.trim().substring(0, 3).toUpperCase();
          const modelClean = bulkModel.trim().substring(0, 3).toUpperCase();
          const generatedPartNumber = `${makeClean}-${modelClean}-${bulkYear}-${p.code}`;

          return {
            name: p.name,
            part_number: generatedPartNumber,
            price: selectedParts[p.code]?.price || p.price,
            stock: selectedParts[p.code]?.stock || 1,
            part_type: bulkPartType,
            make: bulkMake,
            model: bulkModel,
            year: bulkYear,
            engine: bulkEngine || 'عام',
            image_url: bulkImage || 'https://via.placeholder.com/400',
            user_id: userId
          };
        });

      if (payloadBatch.length === 0) {
        setIsBulkPublishing(false);
        return alert('Please select at least one part');
      }

      const response = await fetch(`${supabaseUrl}/parts`, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${session?.token || apiKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payloadBatch)
      });

      if (response.ok) {
        alert(lang === 'ar' ? `تم نشر (${payloadBatch.length}) قطعة غيار بنجاح! 🎉` : `Added (${payloadBatch.length}) parts! 🎉`);
        setBulkMake(''); setBulkModel(''); setBulkYear(''); setBulkEngine(''); setBulkImage('');
        fetchMyParts();
        onSuccess();
        setActiveTab('parts');
      }
    } catch (err) { alert('Error publishing batch'); } finally { setIsBulkPublishing(false); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure?')) return;
    try {
      const response = await fetch(`${supabaseUrl}/parts?id=eq.${id}`, { method: 'DELETE', headers: { 'apikey': apiKey, 'Authorization': `Bearer ${session?.token || apiKey}` } });
      if (response.ok) { fetchMyParts(); onSuccess(); }
    } catch (error) {}
  };

  const handleEdit = (part: any) => {
    setPartName(part.name); 
    setPartNumber(part.part_number || ''); 
    setPartPrice(part.price.toString()); 
    setPartStock((part.stock ?? 5).toString());
    setPartType(part.part_type || 'أصلي (OEM)');
    setPartMake(part.make); 
    setPartModel(part.model || ''); 
    setPartYear(part.year); 
    setPartEngine(part.engine || ''); 
    setPartImg(part.image_url); 
    setEditingId(part.id);
    setActiveTab('parts');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => { setPartName(''); setPartNumber(''); setPartPrice(''); setPartStock('5'); setPartType('أصلي (OEM)'); setPartMake(''); setPartModel(''); setPartYear(''); setPartEngine(''); setPartImg(''); setEditingId(null); };

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
    <div style={{ maxWidth: '850px', margin: '30px auto', display: 'flex', flexDirection: 'column', gap: '25px' }}>
      
      <div style={{ display: 'flex', gap: '10px', backgroundColor: 'white', padding: '10px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <button onClick={() => setActiveTab('parts')} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: activeTab === 'parts' ? '#3182ce' : 'transparent', color: activeTab === 'parts' ? 'white' : '#4a5568', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
          📦 {lang === 'ar' ? 'إضافة قطعة مفردة' : 'Single Part'}
        </button>
        <button onClick={() => setActiveTab('bulk_car')} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: activeTab === 'bulk_car' ? '#38a169' : 'transparent', color: activeTab === 'bulk_car' ? 'white' : '#4a5568', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
          🚗 {lang === 'ar' ? 'تفكيك وإضافة سيارة كاملة تلقائياً' : 'Dismantle Whole Car'}
        </button>
        <button onClick={() => setActiveTab('orders')} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: activeTab === 'orders' ? '#dd6b20' : 'transparent', color: activeTab === 'orders' ? 'white' : '#4a5568', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', position: 'relative' }}>
          📥 {lang === 'ar' ? 'الطلبات الواردة' : 'Orders'}
          {myOrders.filter(o => o.status === 'pending').length > 0 && (
            <span style={{ position: 'absolute', top: '5px', right: '10px', backgroundColor: '#e53e3e', color: 'white', fontSize: '11px', padding: '2px 6px', borderRadius: '10px' }}>
              {myOrders.filter(o => o.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'bulk_car' && (
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px' }}>
            <h2 style={{ color: '#2f855a', margin: '0 0 6px 0', fontSize: '20px' }}>
              🚗 {lang === 'ar' ? 'إضافة جميع قطع سيارة تشليح تلقائياً' : 'Auto Dismantle & Bulk List'}
            </h2>
          </div>

          <form onSubmit={handlePublishBulkCar} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 'bold' }}>{t[lang].makeLabel}</label>
                <select value={bulkMake} onChange={(e) => { setBulkMake(e.target.value); setBulkModel(''); setBulkEngine(''); }} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0' }} required>
                  <option value="">{t[lang].selectMake}</option>
                  {Object.keys(carData).map(make => <option key={make} value={make}>{make}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 'bold' }}>{t[lang].modelLabel}</label>
                <select value={bulkModel} onChange={(e) => setBulkModel(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0' }} required disabled={!bulkMake}>
                  <option value="">{t[lang].selectModel}</option>
                  {bulkMake && carData[bulkMake]?.models.map((model: string) => <option key={model} value={model}>{model}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 'bold' }}>{t[lang].yearLabel}</label>
                <select value={bulkYear} onChange={(e) => setBulkYear(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0' }} required>
                  <option value="">{t[lang].selectYear}</option>
                  {years.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 'bold' }}>{t[lang].engineLabel}</label>
                <select value={bulkEngine} onChange={(e) => setBulkEngine(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0' }} disabled={!bulkMake}>
                  <option value="">{t[lang].selectEngine}</option>
                  {bulkMake && carData[bulkMake]?.engines.map((engine: string) => <option key={engine} value={engine}>{engine}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 'bold' }}>جودة قطع السيارة:</label>
                <select value={bulkPartType} onChange={(e) => setBulkPartType(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0' }}>
                  <option value="مستعمل أصلي">مستعمل أصلي (تشليح)</option>
                  <option value="أصلي (OEM)">جديد أصلي (OEM)</option>
                  <option value="تجاري / كوبي">تجاري / كوبي (Aftermarket)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 'bold' }}>صورة السيارة (تُطبق على جميع القطع):</label>
              <div style={{ border: '2px dashed #cbd5e0', padding: '15px', borderRadius: '10px', textAlign: 'center', backgroundColor: '#f8fafc', position: 'relative' }}>
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setBulkImage)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} disabled={uploadingImage} />
                <p style={{ margin: 0, color: '#4a5568', fontWeight: 'bold', fontSize: '13px' }}>{uploadingImage ? 'جاري الرفع...' : 'اضغط لاختيار صورة السيارة'}</p>
              </div>
              {bulkImage && <img src={bulkImage} alt="Bulk preview" style={{ height: '80px', marginTop: '10px', borderRadius: '8px', objectFit: 'cover' }} />}
            </div>

            <div>
              <h3 style={{ margin: '15px 0 10px 0', fontSize: '15px', color: '#1a365d' }}>📋 تحديد القطع المتوفرة بالسيارة وأسعارها:</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '10px', backgroundColor: '#f7fafc' }}>
                {STANDARD_CAR_PARTS.map(part => {
                  const state = selectedParts[part.code] || { enabled: true, price: part.price, stock: 1 };
                  const makeCode = bulkMake ? bulkMake.substring(0, 3).toUpperCase() : 'MAKE';
                  const modelCode = bulkModel ? bulkModel.substring(0, 3).toUpperCase() : 'MOD';
                  const autoPN = `${makeCode}-${modelCode}-${bulkYear || 'YYYY'}-${part.code}`;

                  return (
                    <div key={part.code} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', backgroundColor: state.enabled ? 'white' : '#edf2f7', borderRadius: '8px', border: '1px solid #cbd5e0' }}>
                      <input type="checkbox" checked={state.enabled} onChange={(e) => setSelectedParts({ ...selectedParts, [part.code]: { ...state, enabled: e.target.checked } })} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: '13.5px', color: state.enabled ? '#2d3748' : '#a0aec0' }}>{part.name}</strong>
                        <span style={{ fontSize: '11px', color: '#718096', display: 'block' }}>Part #: {autoPN}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input type="number" value={state.price} disabled={!state.enabled} onChange={(e) => setSelectedParts({ ...selectedParts, [part.code]: { ...state, price: Number(e.target.value) } })} style={{ width: '80px', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '13px' }} />
                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>QAR</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button type="submit" disabled={isBulkPublishing} style={{ width: '100%', padding: '15px', backgroundColor: '#38a169', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', opacity: isBulkPublishing ? 0.7 : 1 }}>
              {isBulkPublishing ? 'جاري رفع جميع القطع...' : '🚀 نشر جميع قطع السيارة بنقرة واحدة'}
            </button>

          </form>
        </div>
      )}

      {activeTab === 'parts' && (
        <>
          <div style={{ backgroundColor: 'white', padding: '35px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
            <h2 style={{ color: '#1a365d', margin: '0 0 20px 0' }}>{editingId ? '✏️ تعديل إعلان' : '➕ إضافة قطعة مفردة'}</h2>
            <form onSubmit={handlePublishSingle} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>{t[lang].partNameLabel}</label>
                  <input type="text" placeholder={t[lang].partNamePlaceholder} value={partName} onChange={(e) => setPartName(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>رقم القطعة (Part Number):</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" placeholder="مثال: 13505369" value={partNumber} onChange={(e) => setPartNumber(e.target.value)} style={{ flex: 1, padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0' }} />
                    <button
                      type="button"
                      onClick={fetchAiPartNumber}
                      disabled={isAiLoading}
                      style={{
                        backgroundColor: '#805ad5', color: 'white', border: 'none', borderRadius: '8px', padding: '0 12px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap'
                      }}
                    >
                      {isAiLoading ? '⏳ جاري...' : '🤖 ذكاء اصطناعي'}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#2d3748' }}>
                  نوع / جودة القطعة:
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {[
                    { label: '💎 أصلي (OEM)', val: 'أصلي (OEM)', color: '#2b6cb0', bg: '#ebf8ff' },
                    { label: '⚙️ تجاري / كوبي', val: 'تجاري / كوبي', color: '#dd6b20', bg: '#fffaf0' },
                    { label: '🚗 مستعمل أصلي', val: 'مستعمل أصلي', color: '#38a169', bg: '#f0fff4' }
                  ].map(tItem => (
                    <button
                      key={tItem.val}
                      type="button"
                      onClick={() => setPartType(tItem.val)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        border: partType === tItem.val ? `2px solid ${tItem.color}` : '1px solid #cbd5e0',
                        backgroundColor: partType === tItem.val ? tItem.bg : '#f7fafc',
                        color: partType === tItem.val ? tItem.color : '#4a5568',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      {tItem.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>{t[lang].priceLabel}</label>
                  <input type="number" placeholder={t[lang].pricePlaceholder} value={partPrice} onChange={(e) => setPartPrice(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>الكمية المتوفرة (Stock):</label>
                  <input type="number" min="1" placeholder="مثال: 2" value={partStock} onChange={(e) => setPartStock(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required />
                </div>
              </div>
              
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
                <div style={{ border: '2px dashed #cbd5e0', padding: '20px', borderRadius: '10px', textAlign: 'center', backgroundColor: '#f7fafc', position: 'relative' }}><input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setPartImg)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} disabled={uploadingImage} /><p style={{ margin: 0, color: '#4a5568', fontWeight: '600' }}>{uploadingImage ? 'جاري الرفع...' : 'اضغط هنا لاختيار صورة'}</p></div>
                {partImg && <div style={{ marginTop: '15px', textAlign: 'center' }}><img src={partImg} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '10px' }} /></div>}
              </div>
              
              <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: editingId ? '#3182ce' : '#38a169', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>{editingId ? 'حفظ التعديلات' : 'نشر القطعة'}</button>
            </form>
          </div>

          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1a365d' }}>📦 إعلاناتي ({myParts.length})</h3>
            {myParts.map(part => (
              <div key={part.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '10px' }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0' }}>{part.name} {part.part_number && <span style={{ fontSize: '12px', color: '#718096' }}>[PN: {part.part_number}]</span>}</h4>
                  <span style={{ color: '#dd6b20', fontWeight: 'bold' }}>{part.price} QAR</span> | <span style={{ fontSize: '12px', color: '#2b6cb0', fontWeight: 'bold' }}>{part.part_type || 'أصلي'}</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleEdit(part)} style={{ padding: '8px 12px', backgroundColor: '#ebf8ff', color: '#3182ce', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>تعديل</button>
                  <button onClick={() => handleDelete(part.id)} style={{ padding: '8px 12px', backgroundColor: '#fff5f5', color: '#e53e3e', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>حذف</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'orders' && (
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1a365d' }}>📥 الطلبات الواردة من العملاء</h3>
          {myOrders.map(order => (
            <div key={order.id} style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '15px', marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0' }}>{order.part_name}</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#718096' }}>📞 هاتف العميل: <strong>{order.customer_phone}</strong></p>
                </div>
                <span style={{ fontWeight: 'bold', color: '#dd6b20', fontSize: '16px' }}>{order.price} QAR</span>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <input 
                  type="text" 
                  placeholder="ملاحظات الطلب..." 
                  value={orderNotes[order.id] !== undefined ? orderNotes[order.id] : (order.notes || '')} 
                  onChange={(e) => setOrderNotes({ ...orderNotes, [order.id]: e.target.value })} 
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => updateOrderStatus(order.id, 'confirmed')} style={{ flex: 1, padding: '8px', backgroundColor: '#38a169', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>تأكيد</button>
                <button onClick={() => updateOrderStatus(order.id, 'rejected')} style={{ flex: 1, padding: '8px', backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>رفض</button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
