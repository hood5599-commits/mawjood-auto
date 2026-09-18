import React, { useState, useRef } from 'react';
import { TRANSLATE_MAKE, TRANSLATE_MODEL, type CarBrand } from '../data/carData';

interface MechanicSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
  carData: Record<string, CarBrand>;
  years: string[];
  activeVehicle: { make: string; model: string; year: string };
  onSetActiveVehicle: (vehicle: { make: string; model: string; year: string }) => void;
  onAddMultipleToCart: (parts: any[]) => void;
  siteSettings?: any;
}

interface RecognizedPart {
  id: string;
  nameAr: string;
  nameEn: string;
  category: string;
  originalPrice: number;
  aftermarketPrice: number;
  selectedType: 'original' | 'aftermarket' | null;
}

export const MechanicSheetModal: React.FC<MechanicSheetModalProps> = ({
  isOpen,
  onClose,
  lang,
  carData,
  years,
  activeVehicle,
  onSetActiveVehicle,
  onAddMultipleToCart,
}) => {
  const isRtl = lang === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // خطوات الرحلة: gate (التحقق من السيارة) -> upload (رفع الصورة) -> scanning (الفحص) -> wizard (الشيك ليست) -> quotation (الكوتيشن)
  const [step, setStep] = useState<'gate' | 'upload' | 'scanning' | 'wizard' | 'quotation'>('upload');
  const [sheetImage, setSheetImage] = useState<string | null>(null);
  
  // بيانات اختيار السيارة في حال لم تكن محددة
  const [tempMake, setTempMake] = useState(activeVehicle.make || '');
  const [tempModel, setTempModel] = useState(activeVehicle.model || '');
  const [tempYear, setTempYear] = useState(activeVehicle.year || '');

  // خطوة المعالج الحالية
  const [currentPartIndex, setCurrentPartIndex] = useState(0);

  // الكلمات التي لم يتم التعرف عليها من خط اليد
  const [unrecognizedLines, setUnrecognizedLines] = useState<string[]>([]);

  // القطع المستخرجة
  const [parts, setParts] = useState<RecognizedPart[]>([]);

  // إعادة التعيين عند الفتح
  React.useEffect(() => {
    if (isOpen) {
      if (!activeVehicle.make || !activeVehicle.model) {
        setStep('gate');
      } else {
        setStep('upload');
      }
      setSheetImage(null);
      setCurrentPartIndex(0);
    }
  }, [isOpen, activeVehicle]);

  if (!isOpen) return null;

  // 1. تأكيد السيارة
  const handleConfirmVehicle = () => {
    if (!tempMake || !tempModel) {
      alert(isRtl ? 'يرجى اختيار الماركة والموديل أولاً' : 'Please select Make and Model first');
      return;
    }
    onSetActiveVehicle({ make: tempMake, model: tempModel, year: tempYear || '2023' });
    setStep('upload');
  };

  // 2. معالجة رفع ورقة الورشة
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSheetImage(url);
      startAIScanning();
    }
  };

  // 3. محاكاة المسح الذكي لخط اليد (OCR & AI Parsing)
  const startAIScanning = () => {
    setStep('scanning');
    setTimeout(() => {
      // نتائج نموذجية مستخرجة من ورقة الميكانيكي
      setParts([
        {
          id: 'part_1',
          nameAr: 'طقم سفايف فرامل أمامية',
          nameEn: 'Front Brake Pads Set',
          category: 'Brake & Wheel Hub',
          originalPrice: 380,
          aftermarketPrice: 195,
          selectedType: 'original',
        },
        {
          id: 'part_2',
          nameAr: 'فلتر زيت مكينة أصلي',
          nameEn: 'Engine Oil Filter',
          category: 'Engine',
          originalPrice: 55,
          aftermarketPrice: 30,
          selectedType: 'original',
        },
        {
          id: 'part_3',
          nameAr: 'سير محرك خارجي (سير مجموعة)',
          nameEn: 'Serpentine Drive Belt',
          category: 'Belt Drive',
          originalPrice: 140,
          aftermarketPrice: 85,
          selectedType: 'aftermarket',
        },
      ]);

      // سطر لم يتم التعرف عليه ليرجع به العميل للميكانيكي
      setUnrecognizedLines([
        'كرسي ... يمين (كتابة غير واضحة)',
        'بوشات ميزانية سفلية (رقم القطعة ممحي جزئياً)',
      ]);

      setStep('wizard');
    }, 2400);
  };

  // تغيير نوع الجودة لقطعة معينة
  const handleSelectQuality = (index: number, type: 'original' | 'aftermarket') => {
    setParts((prev) => {
      const updated = [...prev];
      updated[index].selectedType = type;
      return updated;
    });
  };

  // إجمالي الكوتيشن
  const totalQuotationPrice = parts.reduce((sum, p) => {
    const price = p.selectedType === 'aftermarket' ? p.aftermarketPrice : p.originalPrice;
    return sum + price;
  }, 0);

  // إرسال الكوتيشن للميكانيكي عبر واتساب
  const handleSendToWhatsApp = () => {
    const carText = `${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model}`;
    let message = `*كوتيشن قطع غيار - موجود أوتو*%0A`;
    message += `🚗 *السيارة:* ${carText}%0A`;
    message += `--------------------------------%0A`;
    parts.forEach((p, idx) => {
      const quality = p.selectedType === 'aftermarket' ? 'تجاري معتمد' : 'أصلي وكالة';
      const price = p.selectedType === 'aftermarket' ? p.aftermarketPrice : p.originalPrice;
      message += `${idx + 1}. *${p.nameAr}* (${quality}) - ${price} ر.ق%0A`;
    });
    message += `--------------------------------%0A`;
    message += `💰 *المجموع:* ${totalQuotationPrice} ر.ق%0A`;
    if (unrecognizedLines.length > 0) {
      message += `%0A⚠️ *بنود غير واضحة بالورقة تحتاج تأكيدك:*%0A`;
      unrecognizedLines.forEach((u) => {
        message += `- ${u}%0A`;
      });
    }
    message += `%0Aيرجى التأكيد للمتابعة في إتمام الطلب.`;
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  // طباعة / حفظ الكوتيشن
  const handlePrintQuotation = () => {
    window.print();
  };

  // إضافة جميع القطع المعتمدة إلى السلة
  const handleAddAllToCart = () => {
    const cartPayload = parts.map((p) => {
      const isAftermarket = p.selectedType === 'aftermarket';
      return {
        id: `${p.id}_${p.selectedType}`,
        name: `${p.nameAr} (${isAftermarket ? 'تجاري معتمد' : 'أصلي وكالة'})`,
        price: isAftermarket ? p.aftermarketPrice : p.originalPrice,
        image_url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80',
        quantity: 1,
      };
    });

    onAddMultipleToCart(cartPayload);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(11, 25, 44, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          direction: isRtl ? 'rtl' : 'ltr',
          fontFamily: "'Cairo', sans-serif",
        }}
      >
        {/* الهيدر العلوي للمودال */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#0B192C',
            color: '#FFFFFF',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>📋</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900' }}>
                {isRtl ? 'مسح ورقة الميكانيكي والطلب الذكي' : 'Mechanic Sheet Scanner'}
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8' }}>
                {activeVehicle.make ? `🚗 ${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model}` : (isRtl ? 'تحويل خط اليد إلى طلب رسمي' : 'Handwriting to Verified Order')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: 'none',
              color: '#FFF',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ✕
          </button>
        </div>

        {/* جسم المودال المتغير حسب المرحلة */}
        <div style={{ padding: '24px' }}>

          {/* ---------------- 1. بوابة التحقق من السيارة ---------------- */}
          {step === 'gate' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '42px', marginBottom: '8px' }}>🚗</div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '900', color: '#0B192C' }}>
                {isRtl ? 'فضلاً حدد سيارتك أولاً' : 'Please select your vehicle first'}
              </h4>
              <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748B' }}>
                {isRtl
                  ? 'لمطابقة القطع الموجودة في ورقة الميكانيكي بنسبة 100% مع القطع الأصلية والبديلة المناسبة لسيارتك.'
                  : 'To guarantee 100% accurate parts fitment and pricing for your specific car.'}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px', textAlign: 'right' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>{isRtl ? 'الماركة' : 'Make'}</label>
                  <select
                    value={tempMake}
                    onChange={(e) => { setTempMake(e.target.value); setTempModel(''); }}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1', marginTop: '4px', fontWeight: 'bold' }}
                  >
                    <option value="">{isRtl ? '-- اختر الماركة --' : '-- Select Make --'}</option>
                    {Object.keys(carData).map((m) => (
                      <option key={m} value={m}>{TRANSLATE_MAKE[m] || m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>{isRtl ? 'الموديل' : 'Model'}</label>
                  <select
                    value={tempModel}
                    onChange={(e) => setTempModel(e.target.value)}
                    disabled={!tempMake}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1', marginTop: '4px', fontWeight: 'bold' }}
                  >
                    <option value="">{isRtl ? '-- اختر الموديل --' : '-- Select Model --'}</option>
                    {(carData[tempMake]?.models || []).map((mod) => (
                      <option key={mod} value={mod}>{TRANSLATE_MODEL[mod] || mod}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '20px', textAlign: 'right' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>{isRtl ? 'سنة الصنع' : 'Year'}</label>
                <select
                  value={tempYear}
                  onChange={(e) => setTempYear(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1', marginTop: '4px', fontWeight: 'bold' }}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleConfirmVehicle}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#FF6B00',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(255, 107, 0, 0.3)',
                }}
              >
                {isRtl ? 'تأكيد السيارة والمتابعة لتصوير الورقة ←' : 'Confirm Vehicle & Proceed ←'}
              </button>
            </div>
          )}

          {/* ---------------- 2. رفع أو تصوير ورقة الورشة ---------------- */}
          {step === 'upload' && (
            <div>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed #FF6B00',
                  borderRadius: '18px',
                  padding: '36px 20px',
                  textAlign: 'center',
                  backgroundColor: '#FFF9F5',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>📸</div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '900', color: '#0B192C' }}>
                  {isRtl ? 'التقط صورة لورقة الميكانيكي أو ارفعها من الاستوديو' : 'Take a photo or upload mechanic sheet'}
                </h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
                  {isRtl ? 'يدعم الصور المكتوبة بخط اليد وفواتير الكراجات ومحادثات الواتساب' : 'Supports handwritten workshop notes, invoices & WhatsApp images'}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#F8FAFC',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: 'pointer',
                    color: '#0F172A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <span>🖼️</span>
                  <span>{isRtl ? 'اختيار من الاستوديو' : 'Upload Image'}</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: '#0B192C',
                    color: '#FFF',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <span>📷</span>
                  <span>{isRtl ? 'فتح الكاميرا' : 'Take Photo'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ---------------- 3. المسح الذكي لخط اليد ---------------- */}
          {step === 'scanning' && (
            <div style={{ textAlign: 'center', padding: '30px 10px' }}>
              {sheetImage && (
                <img
                  src={sheetImage}
                  alt="Mechanic sheet"
                  style={{
                    width: '100%',
                    maxHeight: '160px',
                    objectFit: 'cover',
                    borderRadius: '14px',
                    marginBottom: '16px',
                    border: '1px solid #E2E8F0',
                  }}
                />
              )}
              <div
                style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  border: '4px solid #F1F5F9',
                  borderTopColor: '#FF6B00',
                  margin: '0 auto 18px',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: '900', color: '#0B192C' }}>
                {isRtl ? 'جاري قراءة خط يد الميكانيكي ومطابقة القطع...' : 'Reading handwriting & matching parts...'}
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                {isRtl ? 'نقوم بتحليل القطع وفحص توفرها بالأسعار الأصلية والبديلة' : 'Analyzing items and checking genuine & aftermarket stock'}
              </p>
            </div>
          )}

          {/* ---------------- 4. معالج الشيك ليست واختيار القطع ---------------- */}
          {step === 'wizard' && parts.length > 0 && (
            <div>
              {/* شريط تقدم الشيك ليست */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: '900', color: '#FF6B00' }}>
                  {isRtl ? `القطعة ${currentPartIndex + 1} من ${parts.length}` : `Item ${currentPartIndex + 1} of ${parts.length}`}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>
                  {isRtl ? 'اختر الجودة المناسبة لميزانيتك' : 'Select preferred quality'}
                </span>
              </div>

              {/* القطعة الحالية النشطة */}
              {(() => {
                const currentPart = parts[currentPartIndex];
                return (
                  <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '900', color: '#0B192C' }}>
                      {currentPart.nameAr}
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {/* خيار: أصلي وكالة */}
                      <div
                        onClick={() => handleSelectQuality(currentPartIndex, 'original')}
                        style={{
                          border: currentPart.selectedType === 'original' ? '2px solid #0B192C' : '1px solid #E2E8F0',
                          backgroundColor: currentPart.selectedType === 'original' ? '#F0F7FF' : '#FFFFFF',
                          padding: '12px',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          textAlign: 'center',
                        }}
                      >
                        <span style={{ fontSize: '10px', fontWeight: '900', backgroundColor: '#0B192C', color: '#FFF', padding: '2px 8px', borderRadius: '6px' }}>
                          {isRtl ? 'أصلي وكالة' : 'Genuine OEM'}
                        </span>
                        <div style={{ fontSize: '18px', fontWeight: '900', color: '#0B192C', margin: '8px 0 2px' }}>
                          {currentPart.originalPrice} {isRtl ? 'ر.ق' : 'QAR'}
                        </div>
                        <span style={{ fontSize: '10px', color: '#16A34A', fontWeight: 'bold' }}>✓ {isRtl ? 'ضمان شامل' : 'Full Warranty'}</span>
                      </div>

                      {/* خيار: تجاري معتمد / بديل أصلي */}
                      <div
                        onClick={() => handleSelectQuality(currentPartIndex, 'aftermarket')}
                        style={{
                          border: currentPart.selectedType === 'aftermarket' ? '2px solid #FF6B00' : '1px solid #E2E8F0',
                          backgroundColor: currentPart.selectedType === 'aftermarket' ? '#FFF9F5' : '#FFFFFF',
                          padding: '12px',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          textAlign: 'center',
                        }}
                      >
                        <span style={{ fontSize: '10px', fontWeight: '900', backgroundColor: '#FF6B00', color: '#FFF', padding: '2px 8px', borderRadius: '6px' }}>
                          {isRtl ? 'تجاري معتمد' : 'Aftermarket'}
                        </span>
                        <div style={{ fontSize: '18px', fontWeight: '900', color: '#FF6B00', margin: '8px 0 2px' }}>
                          {currentPart.aftermarketPrice} {isRtl ? 'ر.ق' : 'QAR'}
                        </div>
                        <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 'bold' }}>
                          {isRtl ? `وفر ${currentPart.originalPrice - currentPart.aftermarketPrice} ر.ق` : `Save ${currentPart.originalPrice - currentPart.aftermarketPrice} QAR`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* تنبيه الكلمات غير المقروءة */}
              {unrecognizedLines.length > 0 && (
                <div style={{ backgroundColor: '#FEF2F2', border: '1px dashed #EF4444', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '900', color: '#DC2626', marginBottom: '4px' }}>
                    ⚠️ {isRtl ? 'كلمات لم نتمكن من قراءتها بدقة (راجع الميكانيكي):' : 'Unrecognized handwriting (check with mechanic):'}
                  </div>
                  {unrecognizedLines.map((line, idx) => (
                    <div key={idx} style={{ fontSize: '11px', color: '#7F1D1D', marginRight: '6px' }}>
                      • {line}
                    </div>
                  ))}
                </div>
              )}

              {/* أزرار التنقل في المعالج */}
              <div style={{ display: 'flex', gap: '10px' }}>
                {currentPartIndex > 0 && (
                  <button
                    onClick={() => setCurrentPartIndex((prev) => prev - 1)}
                    style={{
                      padding: '12px 18px',
                      borderRadius: '12px',
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      fontWeight: '800',
                      cursor: 'pointer',
                    }}
                  >
                    {isRtl ? 'السابق' : 'Previous'}
                  </button>
                )}

                {currentPartIndex < parts.length - 1 ? (
                  <button
                    onClick={() => setCurrentPartIndex((prev) => prev + 1)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: '#0B192C',
                      color: '#FFF',
                      fontWeight: '900',
                      cursor: 'pointer',
                    }}
                  >
                    {isRtl ? 'تأكيد والانتقال للقطعة التالية ←' : 'Confirm & Next Piece ←'}
                  </button>
                ) : (
                  <button
                    onClick={() => setStep('quotation')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: '#FF6B00',
                      color: '#FFF',
                      fontWeight: '900',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(255, 107, 0, 0.3)',
                    }}
                  >
                    {isRtl ? 'إنشاء وتوليد الكوتيشن الرسمي 📑' : 'Generate Official Quotation 📑'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ---------------- 5. عرض الكوتيشن الرسمي + واتساب وحفظ والسلة ---------------- */}
          {step === 'quotation' && (
            <div>
              {/* بطاقة الكوتيشن الرسمية */}
              <div
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '16px',
                  padding: '18px',
                  backgroundColor: '#FFFFFF',
                  marginBottom: '16px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0B192C', paddingBottom: '10px', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#0B192C' }}>موجود أوتو | Mawjood Auto</h3>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>عرض تسعير قطع غيار معتمد</span>
                  </div>
                  <div style={{ textAlign: 'left', fontSize: '11px', color: '#64748B' }}>
                    <div>التاريخ: {new Date().toLocaleDateString('ar-QA')}</div>
                    <div style={{ color: '#FF6B00', fontWeight: 'bold' }}>🚗 {activeVehicle.year} {activeVehicle.make} {activeVehicle.model}</div>
                  </div>
                </div>

                {/* جدول بنود الكوتيشن */}
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', marginBottom: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'right' }}>
                      <th style={{ padding: '8px' }}>القطعة</th>
                      <th style={{ padding: '8px' }}>النوع</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>السعر</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parts.map((p, idx) => {
                      const isAftermarket = p.selectedType === 'aftermarket';
                      const price = isAftermarket ? p.aftermarketPrice : p.originalPrice;
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '8px', fontWeight: 'bold', color: '#0F172A' }}>{p.nameAr}</td>
                          <td style={{ padding: '8px', color: isAftermarket ? '#FF6B00' : '#0B192C', fontWeight: 'bold' }}>
                            {isAftermarket ? 'تجاري معتمد' : 'أصلي وكالة'}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'left', fontWeight: '900' }}>{price} ر.ق</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* الإجمالي */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #F1F5F9', paddingTop: '10px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#64748B' }}>المبلغ الإجمالي للكوتيشن:</span>
                  <span style={{ fontSize: '20px', fontWeight: '900', color: '#FF6B00' }}>{totalQuotationPrice} ر.ق</span>
                </div>
              </div>

              {/* أزرار الإجراءات الثلاثة */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleSendToWhatsApp}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: '#25D366',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: '900',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>📲</span>
                    <span>{isRtl ? 'إرسال للميكانيكي عبر واتساب' : 'Send via WhatsApp'}</span>
                  </button>

                  <button
                    onClick={handlePrintQuotation}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#F8FAFC',
                      fontSize: '13px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>💾</span>
                    <span>{isRtl ? 'حفظ / طباعة' : 'Save / Print'}</span>
                  </button>
                </div>

                <button
                  onClick={handleAddAllToCart}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: '#0B192C',
                    color: '#FFFFFF',
                    fontSize: '15px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(11, 25, 44, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <span>🛒</span>
                  <span>{isRtl ? `إضافة جميع القطع إلى السلة (${totalQuotationPrice} ر.ق)` : `Add All to Cart (${totalQuotationPrice} QAR)`}</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};