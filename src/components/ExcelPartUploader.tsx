import React, { useState } from 'react';
import * as XLSX from 'xlsx';

interface ExcelPartUploaderProps {
  lang: 'ar' | 'en';
  supabaseUrl: string;
  apiKey: string;
  session: any;
  onClose: () => void;
  onSuccess: () => void;
}

// 🧠 القاموس الذكي للمرادفات (Auto-Detect Dictionary)
const SYNONYMS: Record<string, string[]> = {
  name: ['اسم القطعة', 'القطعة', 'الاسم', 'اسم السلعة', 'الوصف', 'part name', 'name', 'item', 'description', 'part', 'title', 'سلعة'],
  make: ['الماركة', 'الشركة', 'نوع السيارة', 'المصنع', 'الماركه', 'make', 'brand', 'car make', 'manufacturer'],
  model: ['الموديل', 'موديل السيارة', 'الموديل/الفئة', 'الموديل ', 'model', 'car model'],
  year: ['السنة', 'سنة الصنع', 'الموديل (السنة)', 'سنه الصنع', 'year', 'make year', 'prod year'],
  category: ['القسم', 'الفئة', 'التصنيف', 'قسم القطعة', 'category', 'cat', 'type'],
  price: ['السعر', 'سعر البيع', 'المبلغ', 'القيمة', 'سعر التجزئة', 'price', 'unit price', 'selling price', 'cost', 'amount'],
  part_number: ['رقم القطعة', 'الرمز', 'كود القطعة', 'رقم الغيار', 'oem', 'part number', 'part no', 'sku', 'part_number', 'code'],
  condition: ['الحالة', 'حالة القطعة', 'جديد/مستعمل', 'condition', 'state']
};

export const ExcelPartUploader: React.FC<ExcelPartUploaderProps> = ({
  lang,
  supabaseUrl,
  apiKey,
  session,
  onClose,
  onSuccess
}) => {
  const isRtl = lang === 'ar';

  const [step, setStep] = useState<'select' | 'map' | 'uploading' | 'done'>('select');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);
  
  // خريطة الربط الذكية
  const [mapping, setMapping] = useState<Record<string, string>>({
    name: '',
    make: '',
    model: '',
    year: '',
    category: '',
    price: '',
    part_number: '',
    condition: ''
  });

  // حالات تقدم الرفع
  const [progress, setProgress] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  // 1️⃣ قراءة ملف الإكسل والتوليد التلقائي للربط
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // تحويل الصفوف إلى كائنات JSON
        const data: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!data || data.length === 0) {
          setErrorMsg(isRtl ? 'الملف المرفوع فارغ أو غير صالح.' : 'File is empty.');
          return;
        }

        // استخراج أسماء الأعمدة من الصف الأول
        const detectedHeaders = Object.keys(data[0]);
        setHeaders(detectedHeaders);
        setRawData(data);
        setTotalCount(data.length);

        // إجراء التعرّف التلقائي للمرادفات
        autoDetectMapping(detectedHeaders);
        setStep('map');

      } catch (err) {
        setErrorMsg(isRtl ? 'حدث خطأ أثناء قراءة ملف الإكسل.' : 'Failed to parse Excel file.');
      }
    };

    reader.readAsBinaryString(file);
  };

  // 🧠 دالة التعرّف التلقائي
  const autoDetectMapping = (detectedHeaders: string[]) => {
    const newMapping: Record<string, string> = {
      name: '', make: '', model: '', year: '', category: '', price: '', part_number: '', condition: ''
    };

    Object.keys(SYNONYMS).forEach(fieldKey => {
      const synonyms = SYNONYMS[fieldKey];
      
      // نبحث عن أقرب عمود يطابق أحد المرادفات
      const matchedHeader = detectedHeaders.find(header => {
        const cleanHeader = header.toString().trim().toLowerCase();
        return synonyms.some(syn => cleanHeader === syn.toLowerCase() || cleanHeader.includes(syn.toLowerCase()));
      });

      if (matchedHeader) {
        newMapping[fieldKey] = matchedHeader;
      }
    });

    setMapping(newMapping);
  };

  // 3️⃣ بدء عملية الرفع الذكية على دفعات (Batch Processing)
  const startBatchUpload = async () => {
    if (!mapping.name || !mapping.price) {
      setErrorMsg(isRtl ? 'يرجى ربط حُقول "اسم القطعة" و "السعر" على الأقل.' : 'Please map at least Name and Price.');
      return;
    }

    setStep('uploading');
    setProgress(0);
    setUploadedCount(0);

    const BATCH_SIZE = 50; // رفع 50 قطعة في كل دفعة
    const total = rawData.length;

    // تصفية المعرفات المربوطة لمعرفة الأعمدة الإضافية غير المربوطة (لتخزينها بـ extra_specifications)
    const mappedHeaderValues = Object.values(mapping).filter(Boolean);
    const unmappedHeaders = headers.filter(h => !mappedHeaderValues.includes(h));

    for (let i = 0; i < total; i += BATCH_SIZE) {
      const chunk = rawData.slice(i, i + BATCH_SIZE);
      
      // تجهيز الدفعة الحالية بالشكل المطلق للداتابيز
      const batchPayload = chunk.map(row => {
        // جمع كل الأعمدة الغريبة في كائن جانبي
        const extraSpecs: Record<string, any> = {};
        unmappedHeaders.forEach(h => {
          if (row[h] !== '' && row[h] !== null && row[h] !== undefined) {
            extraSpecs[h] = row[h];
          }
        });

        return {
          name: String(row[mapping.name] || 'قطعة بدون اسم').trim(),
          make: String(row[mapping.make] || 'عام').trim(),
          model: String(row[mapping.model] || 'جميع الموديلات').trim(),
          year: String(row[mapping.year] || new Date().getFullYear()).trim(),
          category: String(row[mapping.category] || 'Engine').trim(),
          price: parseFloat(row[mapping.price]) || 0,
          part_number: mapping.part_number && row[mapping.part_number] ? String(row[mapping.part_number]).trim() : null,
          condition: mapping.condition && row[mapping.condition] ? String(row[mapping.condition]).trim() : 'جديد',
          garage_id: session?.user?.id || session?.phone || 'garage',
          extra_specifications: Object.keys(extraSpecs).length > 0 ? extraSpecs : null
        };
      });

      try {
        // إرسال الدفعة إلى Supabase
        await fetch(`${supabaseUrl}/parts`, {
          method: 'POST',
          headers: {
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(batchPayload)
        });

        const currentUploaded = Math.min(i + BATCH_SIZE, total);
        setUploadedCount(currentUploaded);
        setProgress(Math.round((currentUploaded / total) * 100));

      } catch (err) {
        console.error('Batch Upload Error:', err);
      }
    }

    setStep('done');
    onSuccess();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '750px', backgroundColor: '#ffffff', borderRadius: '24px', padding: '28px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', direction: isRtl ? 'rtl' : 'ltr' }}>
        
        {/* هيدر المودال */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>📊</span>
            <div>
              <h3 style={{ margin: 0, color: '#1f3a5f', fontSize: '19px', fontWeight: 'bold' }}>
                {isRtl ? 'الرفع الذكي لقطع الغيار من الإكسل' : 'Smart Excel Bulk Upload'}
              </h3>
              <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                {isRtl ? 'رفع آلاف القطع وتصفيتها أوتوماتيكياً دون الحاجة لتعديل الملف' : 'Auto-maps columns & handles 1000+ items'}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✖</button>
        </div>

        {errorMsg && (
          <div style={{ backgroundColor: '#fdecec', color: '#d1453b', padding: '12px', borderRadius: '10px', marginBottom: '16px', fontWeight: 'bold', fontSize: '13px', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}

        {/* 1️⃣ المرحلة الأولى: اختيار الملف */}
        {step === 'select' && (
          <div style={{ border: '2px dashed #cbd5e0', borderRadius: '16px', padding: '40px 20px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>📁</span>
            <h4 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>{isRtl ? 'اختر ملف إكسل من جهازك' : 'Choose your Excel File'}</h4>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
              {isRtl ? 'يدعم الملفات بنوع (.xlsx, .xls, .csv) حتى لو احتوت على أكثر من 1,000 قطعة' : 'Supports .xlsx, .xls, .csv files'}
            </p>

            <label style={{ padding: '12px 28px', backgroundColor: '#1f3a5f', color: '#ffffff', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', display: 'inline-block' }}>
              <span>{isRtl ? 'تصفح الملفات 📄' : 'Browse File'}</span>
              <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>
        )}

        {/* 2️⃣ المرحلة الثانية: مراجعة وتعديل الربط الذكي */}
        {step === 'map' && (
          <div>
            <div style={{ backgroundColor: '#e8f9f1', color: '#1e9d6b', padding: '12px 16px', borderRadius: '12px', marginBottom: '18px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>✅ {isRtl ? `تم التعرف على الملف بنجاح! تم ربط الأعمدة أوتوماتيكياً (` : `File loaded! (${totalCount} items found)`}{totalCount} قطعة)</span>
            </div>

            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '14px' }}>
              {isRtl ? 'راجع مطابقة الأعمدة أدناه أو عدلها إن لزم، وسيقوم النظام بتجاهل بقية الأعمدة غير الضرورية:' : 'Review how your columns were matched:'}
            </p>

            {/* شبكة الربط */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px', maxHeight: '300px', overflowY: 'auto', paddingInlineEnd: '6px' }}>
              {[
                { key: 'name', label: isRtl ? 'اسم القطعة (مطلوب)' : 'Part Name', req: true },
                { key: 'price', label: isRtl ? 'السعر QAR (مطلوب)' : 'Price', req: true },
                { key: 'make', label: isRtl ? 'الماركة (تويوتا/نيسان...)' : 'Make' },
                { key: 'model', label: isRtl ? 'الموديل (كامري/باترول...)' : 'Model' },
                { key: 'year', label: isRtl ? 'السنة (2022)' : 'Year' },
                { key: 'category', label: isRtl ? 'القسم / التصنيف' : 'Category' },
                { key: 'part_number', label: isRtl ? 'رقم القطعة / Part #' : 'Part Number' },
                { key: 'condition', label: isRtl ? 'الحالة (جديد/مستعمل)' : 'Condition' },
              ].map(field => (
                <div key={field.key} style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: field.req ? '#1f3a5f' : '#64748b', marginBottom: '4px' }}>
                    {field.label}
                  </label>
                  <select
                    value={mapping[field.key] || ''}
                    onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px', backgroundColor: '#ffffff' }}
                  >
                    <option value="">-- {isRtl ? 'اختر العمود المناسب' : 'Select Column'} --</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* أزرار التحكم */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '22px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <button onClick={() => setStep('select')} style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #cbd5e0', background: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                {isRtl ? 'إلغاء واختيار ملف آخر' : 'Back'}
              </button>
              <button onClick={startBatchUpload} style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', backgroundColor: '#e0872a', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '13.5px' }}>
                🚀 {isRtl ? `تأكيد ورفع الـ (${totalCount}) قطعة` : 'Start Bulk Upload'}
              </button>
            </div>
          </div>
        )}

        {/* 3️⃣ المرحلة الثالثة: شريط التقدم أثناء الرفع */}
        {step === 'uploading' && (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <h4 style={{ color: '#1f3a5f', marginBottom: '8px' }}>
              {isRtl ? 'جاري إضافة القطع لقاعدة البيانات...' : 'Uploading Parts to Database...'}
            </h4>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
              {isRtl ? `تم رفع ${uploadedCount} من أصل ${totalCount} قطعة` : `Uploaded ${uploadedCount} of ${totalCount}`}
            </p>

            {/* شريط التقدم */}
            <div style={{ width: '100%', height: '14px', backgroundColor: '#e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#1e9d6b', transition: 'width 0.3s ease' }} />
            </div>

            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e9d6b' }}>{progress}%</span>
          </div>
        )}

        {/* 4️⃣ المرحلة الأخيرة: النجاح والإنهاء */}
        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <span style={{ fontSize: '54px' }}>🎉</span>
            <h3 style={{ color: '#1e9d6b', margin: '12px 0 6px 0' }}>{isRtl ? 'تم رفع إكسل القطع بنجاح!' : 'Bulk Upload Completed!'}</h3>
            <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '24px' }}>
              {isRtl ? `تمت إضافة ${uploadedCount} قطعة جديدة متوفرة للبيع فوراً للعملاء.` : `Successfully added ${uploadedCount} parts.`}
            </p>

            <button onClick={onClose} style={{ padding: '12px 32px', backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
              {isRtl ? 'العودة للوحة الكراج ⚙️' : 'Done'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
