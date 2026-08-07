import React, { useState } from 'react';

interface PartFormModalProps {
  isRtl: boolean;
  editingPart: any | null;
  FULL_CATEGORY_TREE: Record<string, string[]>;
  CATEGORY_TRANSLATIONS: Record<string, { ar: string; en: string }>;
  carData: any;
  years: string[];
  onSubmit: (formData: any) => void;
  onCancel: () => void;
  uploadingImages: boolean;
  onUploadImages: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PartFormModal: React.FC<PartFormModalProps> = ({
  isRtl,
  editingPart,
  FULL_CATEGORY_TREE,
  CATEGORY_TRANSLATIONS,
  carData,
  years,
  onSubmit,
  onCancel
}) => {
  const [partName, setPartName] = useState(editingPart?.name || '');
  const [partNumber, setPartNumber] = useState(editingPart?.part_number || '');
  const [partPrice, setPartPrice] = useState(editingPart?.price ? String(editingPart.price) : '');
  const [partStock, setPartStock] = useState(editingPart ? String(editingPart.stock ?? 1) : '1');
  const [partType, setPartType] = useState(editingPart?.part_type || 'مستعمل أصلي');
  const [partCondition, setPartCondition] = useState(editingPart?.part_condition || 'نظيف');
  const [partMake, setPartMake] = useState(editingPart?.make || '');
  const [partModel, setPartModel] = useState(editingPart?.model || '');

  const [partYearFrom, setPartYearFrom] = useState(
    editingPart?.year?.includes('-') ? editingPart.year.split('-')[0] : editingPart?.year || ''
  );
  const [partYearTo, setPartYearTo] = useState(
    editingPart?.year?.includes('-') ? editingPart.year.split('-')[1] : editingPart?.year || ''
  );

  const [partEngine, setPartEngine] = useState(editingPart?.engine || '');

  const [mainCategory, setMainCategory] = useState(
    editingPart?.category?.includes('>') ? editingPart.category.split('>')[0].trim() : editingPart?.category || ''
  );
  const [subCategory, setSubCategory] = useState(
    editingPart?.category?.includes('>') ? editingPart.category.split('>')[1].trim() : ''
  );

  const [partImages] = useState<string[]>(
    editingPart?.additional_images || (editingPart?.image_url ? [editingPart.image_url] : [])
  );

  // حقول More Info الاختيارية
  const [showMoreInfoForm, setShowMoreInfoForm] = useState(
    !!(editingPart?.description || editingPart?.warranty || editingPart?.interchange_numbers || editingPart?.position || editingPart?.weight_kg || editingPart?.pin_count)
  );
  const [partDescription, setPartDescription] = useState(editingPart?.description || '');
  const [partWarranty, setPartWarranty] = useState(editingPart?.warranty || '');
  const [interchangeNumbers, setInterchangeNumbers] = useState(editingPart?.interchange_numbers || '');
  const [partPosition, setPartPosition] = useState(editingPart?.position || '');
  const [partWeight, setPartWeight] = useState(editingPart?.weight_kg ? String(editingPart.weight_kg) : '');
  const [partPinCount, setPartPinCount] = useState(editingPart?.pin_count ? String(editingPart.pin_count) : '');

  const handlePartNameChange = (name: string) => {
    setPartName(name);
    const lower = name.toLowerCase().trim();
    if (!lower) return;

    for (const [mainCat, subCats] of Object.entries(FULL_CATEGORY_TREE)) {
      for (const subCat of subCats) {
        if (lower.includes(subCat.toLowerCase())) {
          setMainCategory(mainCat);
          setSubCategory(subCat);
          return;
        }
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCategoryPath = [mainCategory, subCategory].filter(Boolean).join(' > ');
    const computedYear = (partYearFrom && partYearTo && partYearFrom !== partYearTo)
      ? `${Math.min(Number(partYearFrom), Number(partYearTo))}-${Math.max(Number(partYearFrom), Number(partYearTo))}`
      : (partYearFrom || '');

    onSubmit({
      partName,
      partNumber,
      partPrice,
      partStock,
      partType,
      partCondition,
      partMake,
      partModel,
      computedYear,
      partEngine,
      fullCategoryPath,
      partImages,
      partDescription,
      partWarranty,
      interchangeNumbers,
      partPosition,
      partWeight,
      partPinCount
    });
  };

  return (
    <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px', direction: isRtl ? 'rtl' : 'ltr' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#1f3a5f' }}>
            {isRtl ? 'اسم قطعة الغيار *' : 'Part Name *'}
          </label>
          <input
            type="text"
            placeholder={isRtl ? "مثال: مساعدات أمامية..." : "E.g., Oil Filter..."}
            value={partName}
            onChange={(e) => handlePartNameChange(e.target.value)}
            style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#1f3a5f' }}>
            {isRtl ? 'رقم القطعة الأصلي OEM:' : 'Part Number OEM:'}
          </label>
          <input
            type="text"
            placeholder="مثال: 90915-YZZD1"
            value={partNumber}
            onChange={(e) => setPartNumber(e.target.value)}
            style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box', fontFamily: 'monospace' }}
          />
        </div>
      </div>

      <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>الفرع الرئيسي</label>
            <select value={mainCategory} onChange={(e) => { setMainCategory(e.target.value); setSubCategory(''); }} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0' }}>
              <option value="">-- اختر الفرع الرئيسي --</option>
              {Object.keys(FULL_CATEGORY_TREE).map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_TRANSLATIONS[cat] ? `${CATEGORY_TRANSLATIONS[cat].ar} — ${cat}` : cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>الفرع الفرعي</label>
            <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)} disabled={!mainCategory} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e0' }}>
              <option value="">-- اختر الفرع الفرعي --</option>
              {mainCategory && FULL_CATEGORY_TREE[mainCategory]?.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr 1fr', gap: '10px', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>الماركة *</label>
          <select value={partMake} onChange={(e) => { setPartMake(e.target.value); setPartModel(''); }} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0' }} required>
            <option value="">اختر الماركة</option>
            {Object.keys(carData).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>الموديل *</label>
          <select value={partModel} onChange={(e) => setPartModel(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0' }} required disabled={!partMake}>
            <option value="">اختر الموديل</option>
            {partMake && carData[partMake]?.models.map((m: string) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold', color: '#1f3a5f' }}>سنوات التوافق (من - إلى) *</label>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <select value={partYearFrom} onChange={(e) => { setPartYearFrom(e.target.value); if (!partYearTo) setPartYearTo(e.target.value); }} style={{ flex: 1, padding: '10px 4px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '12px' }} required>
              <option value="">من</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <span>-</span>
            <select value={partYearTo} onChange={(e) => setPartYearTo(e.target.value)} style={{ flex: 1, padding: '10px 4px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '12px' }}>
              <option value="">إلى</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>المحرك</label>
          <select value={partEngine} onChange={(e) => setPartEngine(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0' }} disabled={!partMake}>
            <option value="">المحرك</option>
            {partMake && carData[partMake]?.engines.map((eng: string) => <option key={eng} value={eng}>{eng}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12.5px', fontWeight: 'bold' }}>حالة المنتج *</label>
          <select value={partCondition} onChange={(e) => setPartCondition(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0' }}>
            <option value="جديد">جديد</option>
            <option value="شبه جديد">شبه جديد</option>
            <option value="نظيف">نظيف</option>
            <option value="وسط">وسط</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12.5px', fontWeight: 'bold' }}>السعر (QAR) *</label>
          <input type="number" placeholder="350" value={partPrice} onChange={(e) => setPartPrice(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0' }} required />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12.5px', fontWeight: 'bold' }}>الكمية *</label>
          <input type="number" min="1" value={partStock} onChange={(e) => setPartStock(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0' }} required />
        </div>
      </div>

      {/* 🚀 الزر الاختياري المنبثق لـ More Info */}
      <div style={{ borderTop: '1px dashed #cbd5e0', paddingTop: '15px' }}>
        <button
          type="button"
          onClick={() => setShowMoreInfoForm(!showMoreInfoForm)}
          style={{ width: '100%', padding: '12px', backgroundColor: showMoreInfoForm ? '#f8fafc' : '#eff6ff', color: '#1d4ed8', border: '1px dashed #bfdbfe', borderRadius: '10px', fontWeight: 'bold', fontSize: '13.5px', cursor: 'pointer' }}
        >
          {showMoreInfoForm ? '🔼 إخفاء البيانات الإضافية' : '➕ إضافة مواصفات ومعلومات إضافية (More Info - اختياري)'}
        </button>

        {showMoreInfoForm && (
          <div style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '12px', marginTop: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold', color: '#1f3a5f' }}>📝 وصف حقيقي تفصيلي للقطعة:</label>
              <textarea placeholder="اكتب وصفاً حقيقياً..." value={partDescription} onChange={(e) => setPartDescription(e.target.value)} rows={3} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold', color: '#1f3a5f' }}>🛡️ شروط الضمان المخصصة:</label>
                <input type="text" placeholder="مثال: ضمان تجربة 14 يوم" value={partWarranty} onChange={(e) => setPartWarranty(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '12.5px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold', color: '#1f3a5f' }}>🔗 أرقام بديلة (Interchange OEM):</label>
                <input type="text" placeholder="مثال: 15780789, TO3115169" value={interchangeNumbers} onChange={(e) => setInterchangeNumbers(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '12.5px', fontFamily: 'monospace' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '11.5px', fontWeight: 'bold' }}>📍 الجهة / الموضع:</label>
                <select value={partPosition} onChange={(e) => setPartPosition(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '12px' }}>
                  <option value="">غير محدد</option>
                  <option value="أمامي يمين">أمامي يمين</option>
                  <option value="أمامي يسار">أمامي يسار</option>
                  <option value="خلفي يمين">خلفي يمين</option>
                  <option value="خلفي يسار">خلفي يسار</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '11.5px', fontWeight: 'bold' }}>⚖️ الوزن التقديري (كجم):</label>
                <input type="number" step="0.1" placeholder="2.5" value={partWeight} onChange={(e) => setPartWeight(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '12px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '11.5px', fontWeight: 'bold' }}>🔌 عدد أسنان الفيشة:</label>
                <input type="number" placeholder="6" value={partPinCount} onChange={(e) => setPartPinCount(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '12px' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        <button type="submit" style={{ flex: 1, padding: '14px', backgroundColor: editingPart ? '#1f3a5f' : '#16a34a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
          {editingPart ? 'حفظ التعديلات' : 'نشر القطعة للبيع الآن'}
        </button>
        <button type="button" onClick={onCancel} style={{ padding: '14px 20px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
          إلغاء
        </button>
      </div>
    </form>
  );
};
