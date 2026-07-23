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
  const [partName, setPartName] = useState('');
  const [partPrice, setPartPrice] = useState('');
  const [partMake, setPartMake] = useState('');
  const [partModel, setPartModel] = useState('');
  const [partYear, setPartYear] = useState('');
  const [partEngine, setPartEngine] = useState('');
  const [partImg, setPartImg] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [myParts, setMyParts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  // السحر هنا: سيسحب الكود رقم الهاتف، أو الإيميل، أو المعرف ليكون هو الـ ID الخاص بالكراج
  const userId = session?.user?.id || session?.id || session?.phone || session?.email || session?.code || 'garage_unknown';

  const fetchMyParts = async () => {
    if (!userId || userId === 'garage_unknown') return;
    try {
      const response = await fetch(`${supabaseUrl}/parts?user_id=eq.${userId}&order=id.desc`, {
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${session?.token || apiKey}` // استخدمنا apiKey كبديل لو لم يكن هناك توكن
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMyParts(data);
      }
    } catch (error) {
      console.error("Error fetching my parts", error);
    }
  };

  useEffect(() => {
    fetchMyParts();
  }, [session]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.size > 5 * 1024 * 1024) {
      alert(t[lang].alertSize);
      return;
    }

    setUploadingImage(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

    try {
      const uploadUrl = `${supabaseUrl.replace('/rest/v1', '/storage/v1')}/object/part-images/${fileName}`;
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${session?.token || apiKey}`,
          'Content-Type': file.type
        },
        body: file
      });

      if (response.ok) {
        const publicUrl = `${supabaseUrl.replace('/rest/v1', '/storage/v1')}/object/public/part-images/${fileName}`;
        setPartImg(publicUrl);
        alert(t[lang].alertUploadSuccess || (lang === 'ar' ? 'تم رفع الصورة بنجاح!' : 'Image uploaded successfully!'));
      } else {
        alert('Upload failed');
      }
    } catch (error) {
      alert('Error uploading');
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId || userId === 'garage_unknown') {
      alert(lang === 'ar' ? '⚠️ يرجى تسجيل الدخول مجدداً لإضافة القطعة.' : 'Please login again to add a part.');
      return;
    }

    try {
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId ? `${supabaseUrl}/parts?id=eq.${editingId}` : `${supabaseUrl}/parts`;

      const payload = {
        name: partName,
        price: parseFloat(partPrice),
        make: partMake,
        model: partModel,
        year: partYear,
        engine: partEngine,
        image_url: partImg || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80',
        user_id: userId // هذا هو رقم أو إيميل الكراج
      };

      const response = await fetch(url, {
        method: method,
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${session?.token || apiKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert(lang === 'ar' ? 'تم حفظ القطعة بنجاح! 🚀' : 'Part saved successfully! 🚀');
        resetForm();
        fetchMyParts();
        onSuccess();
      } else {
        const errorData = await response.json();
        alert(`رفضت قاعدة البيانات الحفظ ⚠️\nالسبب: ${errorData.message || errorData.details}`);
      }
    } catch (error: any) {
      alert(`حدث خطأ برمجي ⚠️\nالسبب: ${error.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذه القطعة؟' : 'Are you sure you want to delete this part?')) return;
    
    try {
      const response = await fetch(`${supabaseUrl}/parts?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${session?.token || apiKey}`
        }
      });
      if (response.ok) {
        fetchMyParts();
        onSuccess();
      }
    } catch (error) {
      alert('Error deleting part');
    }
  };

  const handleEdit = (part: any) => {
    setPartName(part.name);
    setPartPrice(part.price.toString());
    setPartMake(part.make);
    setPartModel(part.model || '');
    setPartYear(part.year);
    setPartEngine(part.engine || '');
    setPartImg(part.image_url === 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80' ? '' : part.image_url);
    setEditingId(part.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setPartName(''); setPartPrice(''); setPartMake(''); setPartModel(''); setPartYear(''); setPartEngine(''); setPartImg('');
    setEditingId(null);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      <div style={{ backgroundColor: 'white', padding: '35px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: '#1a365d', margin: 0 }}>
            {editingId 
              ? (lang === 'ar' ? '✏️ تعديل بيانات القطعة' : '✏️ Edit Part') 
              : (lang === 'ar' ? '➕ إضافة قطعة جديدة' : '➕ Add New Part')}
          </h2>
          {editingId && (
            <button onClick={resetForm} style={{ padding: '8px 16px', backgroundColor: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              {lang === 'ar' ? 'إلغاء التعديل' : 'Cancel Edit'}
            </button>
          )}
        </div>

        <form onSubmit={handlePublish} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>{t[lang].partNameLabel}</label>
            <input type="text" placeholder={t[lang].partNamePlaceholder} value={partName} onChange={(e) => setPartName(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>{t[lang].priceLabel}</label>
            <input type="number" placeholder={t[lang].pricePlaceholder} value={partPrice} onChange={(e) => setPartPrice(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>{t[lang].makeLabel}</label>
              <select value={partMake} onChange={(e) => { setPartMake(e.target.value); setPartModel(''); setPartEngine(''); }} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required>
                <option value="">{t[lang].selectMake}</option>
                {Object.keys(carData).map(make => (
                  <option key={make} value={make}>{make}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>{t[lang].modelLabel}</label>
              <select value={partModel} onChange={(e) => setPartModel(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required disabled={!partMake}>
                <option value="">{t[lang].selectModel || (lang === 'ar' ? 'اختر الموديل' : 'Select Model')}</option>
                {partMake && carData[partMake]?.models.map((model: string) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>{t[lang].yearLabel}</label>
              <select value={partYear} onChange={(e) => setPartYear(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required>
                <option value="">{t[lang].selectYear}</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>{t[lang].engineLabel}</label>
              <select value={partEngine} onChange={(e) => setPartEngine(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required disabled={!partMake}>
                <option value="">{t[lang].selectEngine || (lang === 'ar' ? 'اختر المحرك' : 'Select Engine')}</option>
                {partMake && carData[partMake]?.engines.map((engine: string) => (
                  <option key={engine} value={engine}>{engine}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>{t[lang].uploadLabel}</label>
            <div style={{ border: '2px dashed #cbd5e0', padding: '20px', borderRadius: '10px', textAlign: 'center', backgroundColor: '#f7fafc', cursor: 'pointer', position: 'relative' }}>
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} disabled={uploadingImage} />
              <p style={{ margin: 0, color: '#4a5568', fontWeight: '600' }}>
                {uploadingImage ? t[lang].uploadBtnUploading : t[lang].uploadBtnIdle}
              </p>
            </div>
            
            <div style={{ marginTop: '15px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#718096' }}>{t[lang].uploadOrLink}</label>
              <input type="text" placeholder={t[lang].uploadLinkPlaceholder} value={partImg} onChange={(e) => setPartImg(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} />
            </div>

            {partImg && (
              <div style={{ marginTop: '15px', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: '#2f855a', fontWeight: 'bold', marginBottom: '8px' }}>{t[lang].uploadPreview || (lang === 'ar' ? 'معاينة الصورة' : 'Preview')}</p>
                <img src={partImg} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }} />
              </div>
            )}
          </div>

          <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: editingId ? '#3182ce' : '#38a169', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
            {editingId 
              ? (lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes') 
              : (lang === 'ar' ? 'نشر القطعة' : 'Publish Part')}
          </button>
        </form>
      </div>

      {/* قسم إدارة إعلانات الكراج */}
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#1a365d', borderBottom: '2px solid #edf2f7', paddingBottom: '15px' }}>
          📦 {lang === 'ar' ? 'إعلاناتي' : 'My Listings'} <span style={{ fontSize: '14px', color: '#718096' }}>({myParts.length})</span>
        </h3>
        
        {myParts.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#a0aec0', padding: '30px 0' }}>
            {lang === 'ar' ? 'لم تقم بإضافة أي قطع حتى الآن.' : 'You have not added any parts yet.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {myParts.map(part => (
              <div key={part.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: '#f8fafc' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <img src={part.image_url} alt={part.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e0' }} />
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', color: '#2d3748', fontSize: '15px' }}>{part.name}</h4>
                    <div style={{ fontSize: '13px', color: '#718096', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ backgroundColor: '#edf2f7', padding: '2px 8px', borderRadius: '4px' }}>{part.make} {part.model}</span>
                      <span style={{ backgroundColor: '#edf2f7', padding: '2px 8px', borderRadius: '4px' }}>📅 {part.year}</span>
                      <span style={{ color: '#dd6b20', fontWeight: 'bold' }}>💰 {part.price} {lang === 'ar' ? 'ر.ق' : 'QAR'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleEdit(part)} style={{ padding: '8px 12px', backgroundColor: '#ebf8ff', color: '#3182ce', border: '1px solid #bee3f8', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                    {lang === 'ar' ? 'تعديل' : 'Edit'}
                  </button>
                  <button onClick={() => handleDelete(part.id)} style={{ padding: '8px 12px', backgroundColor: '#fff5f5', color: '#e53e3e', border: '1px solid #fed7d7', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                    {lang === 'ar' ? 'حذف' : 'Delete'}
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
