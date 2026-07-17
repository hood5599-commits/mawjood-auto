import React, { useState } from 'react';
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
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': file.type
        },
        body: file
      });

      if (response.ok) {
        const publicUrl = `${supabaseUrl.replace('/rest/v1', '/storage/v1')}/object/public/part-images/${fileName}`;
        setPartImg(publicUrl);
        alert(t[lang].alertUploadSuccess);
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
    try {
      const response = await fetch(`${supabaseUrl}/parts`, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          name: partName,
          price: parseFloat(partPrice),
          make: partMake,
          model: partModel,
          year: partYear,
          engine: partEngine,
          image_url: partImg || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80'
        })
      });

      if (response.ok) {
        alert(t[lang].alertSaveSuccess);
        setPartName(''); setPartPrice(''); setPartMake(''); setPartModel(''); setPartYear(''); setPartEngine(''); setPartImg('');
        onSuccess();
      }
    } catch (error) {
      alert('Error saving part');
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', backgroundColor: 'white', padding: '35px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
      <h2 style={{ color: '#1a365d', marginBottom: '10px' }}>{t[lang].dashboardTitle}</h2>
      <p style={{ color: '#4a5568', fontSize: '14px', marginBottom: '30px' }}>{t[lang].dashboardDesc}</p>

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
                <option key={make} value={make}>{lang === 'ar' ? make : make}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>{t[lang].modelLabel}</label>
            <select value={partModel} onChange={(e) => setPartModel(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} required disabled={!partMake}>
              <option value="">{t[lang].selectModel}</option>
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
              <option value="">{t[lang].selectEngine}</option>
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
              <p style={{ fontSize: '13px', color: '#2f855a', fontWeight: 'bold', marginBottom: '8px' }}>{t[lang].uploadPreview}</p>
              <img src={partImg} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }} />
            </div>
          )}
        </div>

        <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#38a169', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 12px rgba(56, 161, 105, 0.2)' }}>
          {t[lang].publishBtn}
        </button>
      </form>
    </div>
  );
};