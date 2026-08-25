// src/components/SmartVinScanner.tsx
import React, { useState, useRef } from 'react';
import type { VehicleProfile } from '../utils/vinMatcher';
import { CAR_DATA } from '../data/carData';

declare const process: any;

interface SmartVinScannerProps {
  lang: 'ar' | 'en';
  activeVehicle: VehicleProfile | null;
  onVehicleIdentified: (vehicle: VehicleProfile) => void;
  onReset: () => void;
}

export const SmartVinScanner: React.FC<SmartVinScannerProps> = ({
  lang,
  activeVehicle,
  onVehicleIdentified,
  onReset
}) => {
  const isRtl = lang === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [vinText, setVinText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // 🧠 فك التشفير عبر قاعدة بيانات NHTSA الدولية
  const decodeVinNumber = async (vin: string) => {
    const cleanVin = vin.trim().toUpperCase();
    if (cleanVin.length !== 17) {
      alert(isRtl ? 'رقم الشاصي يجب أن يتكون من 17 حرفاً ورقم تماماً' : 'VIN must be exactly 17 characters');
      return;
    }

    setIsProcessing(true);
    setStatusMsg(isRtl ? 'جاري فك تشفير رقم الشاصي والتحقق من التوافق...' : 'Decoding VIN & verifying vehicle fitment...');

    try {
      const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${encodeURIComponent(cleanVin)}?format=json`);
      if (res.ok) {
        const json = await res.json();
        const result = json.Results?.[0];

        if (result && result.Make) {
          const rawMake = result.Make;
          const detectedModel = result.Model || '';
          const detectedYear = result.ModelYear || '';
          const detectedEngine = result.DisplacementL ? `${result.DisplacementL}L` : (result.EngineConfiguration || '');

          let matchedMakeKey = Object.keys(CAR_DATA).find(
            m => m.toLowerCase() === rawMake.toLowerCase() || CAR_DATA[m]?.en?.toLowerCase() === rawMake.toLowerCase()
          ) || rawMake;

          onVehicleIdentified({
            vin: cleanVin,
            make: matchedMakeKey,
            model: detectedModel,
            year: detectedYear,
            engine: detectedEngine
          });
          setStatusMsg('');
          return;
        }
      }
      throw new Error('Could not decode VIN directly');
    } catch (err) {
      onVehicleIdentified({
        vin: cleanVin,
        make: '',
        model: '',
        year: ''
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 📷 قراءة صورة الاستمارة بالذكاء الاصطناعي (Gemini Vision OCR)
  const handleIstemaraUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMsg(isRtl ? 'جاري قراءة بيانات استمارة السيارة واستخراج رقم الشاصي بالذكاء الاصطناعي...' : 'AI is scanning vehicle registration card (Istemara)...');

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const geminiApiKey = 
          (typeof process !== 'undefined' && (process?.env?.REACT_APP_GEMINI_API_KEY || process?.env?.VITE_GEMINI_API_KEY)) || 
          (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_GEMINI_API_KEY) || 
          "";

        if (!geminiApiKey) {
          alert(isRtl ? 'يرجى إدخال رقم الشاصي يدوياً أو تفعيل مفتاح الذكاء الاصطناعي.' : 'Please enter VIN manually or enable AI Key.');
          setIsProcessing(false);
          return;
        }

        const promptText = `Analyze this Qatari / GCC vehicle registration card (Istemara) image carefully. 
Extract: 
1. 17-character Chassis/VIN number (رقم الشاصي / الهيكل).
2. Vehicle Make (الشركة / الماركة).
3. Vehicle Model (الموديل / الطراز).
4. Model Year (سنة الصنع).
5. Engine info (المحرك / السلندر).
Return ONLY a valid JSON object matching this structure:
{"vin": "17_CHAR_VIN", "make": "Toyota", "model": "Land Cruiser", "year": "2022", "engine": "4.0L"}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: promptText },
                { inline_data: { mime_type: file.type || 'image/jpeg', data: base64Data } }
              ]
            }]
          })
        });

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.vin && parsed.vin.length === 17) {
            decodeVinNumber(parsed.vin);
            return;
          } else if (parsed.make || parsed.model) {
            onVehicleIdentified({
              vin: parsed.vin || '',
              make: parsed.make || '',
              model: parsed.model || '',
              year: parsed.year || '',
              engine: parsed.engine || ''
            });
            setIsProcessing(false);
            return;
          }
        }
        alert(isRtl ? 'تعذر التعرف على رقم الشاصي بوضوح، يرجى كتابته في الحقل بالأسفل.' : 'Could not detect VIN clearly. Please type it below.');
        setIsProcessing(false);
      };
    } catch (error) {
      console.error(error);
      alert(isRtl ? 'حدث خطأ أثناء فحص الصورة.' : 'Error reading image.');
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '20px',
      padding: '24px',
      border: '2px solid #1f3a5f',
      boxShadow: '0 10px 30px rgba(31,58,95,0.08)',
      marginBottom: '24px',
      direction: isRtl ? 'rtl' : 'ltr'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#1f3a5f', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📸</span> {isRtl ? 'الفحص الذكي برقم الشاصي وصورة الاستمارة (100% تطابق)' : 'Smart VIN & Registration Card Scanner (100% Match)'}
          </h2>
          <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
            {isRtl 
              ? 'صوّر استمارة سيارتك أو أدخل رقم الشاصي (17 حرف) ليقوم النظام بعرض القطع المتوافقة مع سيارتك فقط.'
              : 'Upload vehicle Istemara or enter 17-digit VIN to filter 100% compatible parts.'}
          </p>
        </div>

        {activeVehicle && (
          <button
            onClick={onReset}
            style={{
              padding: '8px 16px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fca5a5',
              borderRadius: '10px',
              fontWeight: 'bold',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            🔄 {isRtl ? 'إلغاء التحديد وعرض كل القطع' : 'Clear Vehicle Filter'}
          </button>
        )}
      </div>

      {activeVehicle ? (
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1.5px solid #86efac',
          borderRadius: '14px',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '18px' }}>✅</span>
              <strong style={{ color: '#166534', fontSize: '16px' }}>
                {activeVehicle.make} {activeVehicle.model} {activeVehicle.year}
              </strong>
              {activeVehicle.engine && (
                <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 'bold' }}>
                  ⚡ {activeVehicle.engine}
                </span>
              )}
            </div>
            {activeVehicle.vin && (
              <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#166534', fontWeight: 'bold', letterSpacing: '1px' }}>
                VIN: {activeVehicle.vin}
              </span>
            )}
          </div>

          <div style={{ backgroundColor: '#166534', color: '#ffffff', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>
            🎯 {isRtl ? 'الموقع الآن يعرض قطع هذه السيارة فقط' : 'Filtered to this vehicle'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          
          <div
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            style={{
              border: '2px dashed #0284c7',
              backgroundColor: '#f0f9ff',
              borderRadius: '14px',
              padding: '18px',
              textAlign: 'center',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleIstemaraUpload}
              style={{ display: 'none' }}
              disabled={isProcessing}
            />
            <div style={{ fontSize: '32px', marginBottom: '6px' }}>📷</div>
            <strong style={{ color: '#0369a1', fontSize: '14px', display: 'block', marginBottom: '3px' }}>
              {isRtl ? 'اضغط لتصوير أو رفع الاستمارة' : 'Take Photo / Upload Istemara'}
            </strong>
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>
              {isRtl ? 'استخراج تلقائي فوري للمواصفات والشاصي' : 'Instant AI OCR Extraction'}
            </span>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); decodeVinNumber(vinText); }}
            style={{
              border: '1.5px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '10px'
            }}
          >
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#1f3a5f' }}>
              {isRtl ? 'أو أدخل رقم الشاصي يدوياً (17 حرف ورقم):' : 'Or enter 17-character VIN manually:'}
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                maxLength={17}
                placeholder="JTEBU5JR8K5..."
                value={vinText}
                onChange={(e) => setVinText(e.target.value.toUpperCase())}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e0',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  fontSize: '13.5px',
                  letterSpacing: '1px'
                }}
              />
              <button
                type="submit"
                disabled={isProcessing || vinText.trim().length !== 17}
                style={{
                  padding: '10px 18px',
                  backgroundColor: '#e0872a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: (vinText.trim().length === 17) ? 'pointer' : 'not-allowed',
                  opacity: (vinText.trim().length === 17) ? 1 : 0.6
                }}
              >
                {isRtl ? 'فحص 🚀' : 'Match 🚀'}
              </button>
            </div>
          </form>

        </div>
      )}

      {isProcessing && (
        <div style={{ marginTop: '14px', textAlign: 'center', color: '#0369a1', fontWeight: 'bold', fontSize: '13px' }}>
          🔄 {statusMsg}
        </div>
      )}
    </div>
  );
};
