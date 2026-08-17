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

// 🧠 القاموس الذكي الشامل للتعرف على مسميات الأعمدة
const SYNONYMS: Record<string, string[]> = {
  name: ['اسم القطعة', 'القطعة', 'الاسم', 'اسم السلعة', 'الوصف', 'بيان القطعة', 'part name', 'name', 'item', 'description', 'part', 'title', 'سلعة', 'اسم الغيار'],
  make: ['الماركة', 'الشركة', 'نوع السيارة', 'المصنع', 'الماركه', 'الشركة الصانعة', 'make', 'brand', 'car make', 'manufacturer'],
  model: ['الموديل', 'موديل السيارة', 'الموديل/الفئة', 'الفئة', 'طراز السيارة', 'model', 'car model', 'فئة السيارة'],
  year: ['السنة', 'سنة الصنع', 'الموديل (السنة)', 'سنه الصنع', 'الموديل/السنة', 'year', 'make year', 'prod year', 'عام'],
  category: ['القسم', 'الفئة', 'التصنيف', 'قسم القطعة', 'التصنيف الرئيسي', 'نوع القطعة', 'category', 'cat', 'type'],
  price: ['السعر', 'سعر البيع', 'المبلغ', 'القيمة', 'سعر التجزئة', 'سعر القطعة', 'price', 'unit price', 'selling price', 'cost', 'amount', 'qar', 'qr'],
  part_number: ['رقم القطعة', 'الرمز', 'كود القطعة', 'رقم الغيار', 'oem', 'part number', 'part no', 'sku', 'part_number', 'code', 'رقم الشاصي', 'الرقم الأصلي'],
  part_condition: ['الحالة', 'حالة القطعة', 'جديد/مستعمل', 'حالة الغيار', 'condition', 'part_condition', 'state'],
  stock: ['الكمية', 'المخزون', 'العدد', 'المتوفر', 'stock', 'qty', 'quantity', 'count']
};

// 🛠️ خريطة لتصحيح أسماء الماركات
const MAKE_CORRECTIONS: Record<string, string> = {
  'تويوتتا': 'تويوتا', 'تويتا': 'تويوتا', 'toyota': 'تويوتا',
  'نيصان': 'نيسان', 'nissan': 'نيسان',
  'هونداي': 'هيونداي', 'hyundai': 'هيونداي',
  'شيفروليه': 'شفروليه', 'شفروليت': 'شفروليه', 'chevrolet': 'شفروليه',
  'فورد': 'فورد', 'ford': 'فورد',
  'لكزس': 'لكزس', 'lexus': 'لكزس',
  'مرسيدس': 'مرسيدس', 'mercedes': 'مرسيدس', 'mercedes-benz': 'مرسيدس',
  'كيا': 'كيا', 'kia': 'كيا',
  'هوندا': 'هوندا', 'honda': 'هوندا',
  'ميتسوبيشي': 'ميتسوبيشي', 'mitsubishi': 'ميتسوبيشي'
};

// 🧭 استنتاج القسم الرئيسي آلياً من اسم القطعة إذا كان العمود مفقوداً
const inferCategoryFromName = (partName: string): string => {
  const n = (partName || '').toLowerCase();
  if (/فرامل|فحمات|قماشات|هوب|كليبر|abs|brake|rotor|caliper|pad/.test(n)) return 'Brake & Wheel Hub';
  if (/مساعد|مساعدات|كمر|مقص|ياي|سبرنق|ركبة|suspension|shock|strut|arm|spring/.test(n)) return 'Suspension';
  if (/رديتر|راديتر|طرمبة ماء|ثرموستات|حرارة|ماء|مروحة رديتر|radiator|coolant|water pump|thermostat/.test(n)) return 'Cooling System';
  if (/كمبروسر|مكيف|ثلاجة|كوندنسر|بلف مكيف|تكييف|compressor|a\/c|condenser|evaporator/.test(n)) return 'Heat & Air Conditioning';
  if (/مكينة|محرك|بستم|صباب|راس|كارتير|زيت|طرمبة زيت|بواجي|كويل|engine|piston|valve|spark plug|coil/.test(n)) return 'Engine';
  if (/قير|جير|طنجرة|كلتش|مخ القير|فلتر قير|transmission|clutch|gearbox/.test(n)) return 'Transmission-Automatic';
  if (/صدام|كبوت|رفرف|باب|شمعة|اسطب|مراية|شبك|bumper|fender|hood|headlamp|door|mirror/.test(n)) return 'Body & Lamp Assembly';
  if (/بخاخ|طرمبة بنزين|فلتر هواء|فلتر بنزين|وقود|fuel|injector|air filter/.test(n)) return 'Fuel & Air';
  if (/دركسون|دودة|طرمبة دركسون|steering|rack|pinion/.test(n)) return 'Steering';
  if (/دينمو|سلف|بطارية|فيوز|حساس|سنسر|starter|alternator|battery|sensor/.test(n)) return 'Electrical';
  if (/مساحات|مساحة|قربة موية|wiper|washer/.test(n)) return 'Wiper & Washer';
  if (/جنط|كفر|تاير|wheel|tire|rim/.test(n)) return 'Wheel';
  return 'Engine';
};

// 🔍 استنتاج سنة الصنع من النص
const extractYearFromText = (text: string): string => {
  const matchRange = text.match(/\b(19\d\d|20\d\d)\s*[-/]\s*(19\d\d|20\d\d)\b/);
  if (matchRange) return `${matchRange[1]}-${matchRange[2]}`;
  const matchSingle = text.match(/\b(19\d\d|20\d\d)\b/);
  if (matchSingle) return matchSingle[1];
  return '2022';
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
  
  const [mapping, setMapping] = useState<Record<string, string>>({
    name: '',
    make: '',
    model: '',
    year: '',
    category: '',
    price: '',
    part_number: '',
    part_condition: '',
    stock: ''
  });

  const [progress, setProgress] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [correctedCount, setCorrectedCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  // 1️⃣ قراءة ملف الإكسل مع البحث الذكي عن سطر العناوين الحقيقي
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

        // قراءة الملف كمصفوفة ثنائية الأبعاد لفحص الصفوف بدقة
        const rawGrid: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!rawGrid || rawGrid.length === 0) {
          setErrorMsg(isRtl ? 'الملف المرفوع فارغ تماماً.' : 'File is empty.');
          return;
        }

        // 🧠 البحث عن السطر الحقيقي للعناوين (تجاوز الترويسات والأسطر المدمجة)
        let bestHeaderRowIndex = 0;
        let highestScore = -1;

        const maxScanRows = Math.min(rawGrid.length, 12);
        for (let r = 0; r < maxScanRows; r++) {
          const row = rawGrid[r];
          if (!Array.isArray(row)) continue;

          let score = 0;
          row.forEach(cell => {
            const cellStr = String(cell || '').trim().toLowerCase();
            if (!cellStr) return;
            // فحص مطابقة الكلمات المفتاحية الشائعة
            Object.values(SYNONYMS).forEach(synList => {
              if (synList.some(syn => cellStr === syn || cellStr.includes(syn))) {
                score += 3;
              }
            });
            score += 1;
          });

          if (score > highestScore) {
            highestScore = score;
            bestHeaderRowIndex = r;
          }
        }

        const rawHeaderRow = rawGrid[bestHeaderRowIndex] || [];
        const detectedHeaders: string[] = rawHeaderRow
          .map((h: any, idx: number) => {
            const val = String(h || '').trim();
            return val ? val : `عمود_${idx + 1}`;
          })
          .filter((h: string) => !h.startsWith('EMPTY_') && h.trim() !== '');

        // استخراج صفوف البيانات التي تلي سطر العناوين
        const dataRows = rawGrid.slice(bestHeaderRowIndex + 1);
        const structuredData: any[] = [];

        dataRows.forEach(row => {
          // التحقق من أن الصف ليس فارغاً
          const hasContent = row.some((cell: any) => String(cell || '').trim() !== '');
          if (!hasContent) return;

          const rowObj: Record<string, any> = {};
          rawHeaderRow.forEach((h: any, idx: number) => {
            const colName = String(h || '').trim() || `عمود_${idx + 1}`;
            rowObj[colName] = row[idx] ?? '';
          });
          structuredData.push(rowObj);
        });

        if (structuredData.length === 0) {
          setErrorMsg(isRtl ? 'لم يتم العثور على صفوف بيانات صالحة في الملف.' : 'No valid data rows found.');
          return;
        }

        setHeaders(detectedHeaders);
        setRawData(structuredData);
        setTotalCount(structuredData.length);

        // التعرّف التلقائي والمطابقة الذكية للأعمدة
        autoDetectMapping(detectedHeaders);
        setStep('map');

      } catch (err) {
        console.error(err);
        setErrorMsg(isRtl ? 'حدث خطأ أثناء قراءة ومعالجة ملف الإكسل.' : 'Failed to parse Excel file.');
      }
    };

    reader.readAsBinaryString(file);
  };

  // 🧠 دالة التعرّف التلقائي والمطابقة
  const autoDetectMapping = (detectedHeaders: string[]) => {
    const newMapping: Record<string, string> = {
      name: '', make: '', model: '', year: '', category: '', price: '', part_number: '', part_condition: '', stock: ''
    };

    Object.keys(SYNONYMS).forEach(fieldKey => {
      const synonyms = SYNONYMS[fieldKey];
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

  // 🧹 تنظيف الأرقام والأسعار من النصوص والعملات
  const cleanPriceValue = (val: any): number => {
    if (typeof val === 'number') return Math.max(0, val);
    const cleaned = String(val || '').replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : Math.max(0, num);
  };

  // 🚀 بدء الرفع الذكي على دفعات وتصحيح الحقول لقاعدة البيانات
  const startBatchUpload = async () => {
    if (!mapping.name || !mapping.price) {
      setErrorMsg(isRtl ? 'يرجى ربط حقلي "اسم القطعة" و "السعر" على الأقل.' : 'Please map at least Name and Price.');
      return;
    }

    setStep('uploading');
    setProgress(0);
    setUploadedCount(0);
    let autoCorrections = 0;

    const BATCH_SIZE = 50;
    const total = rawData.length;
    const cleanBaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');

    for (let i = 0; i < total; i += BATCH_SIZE) {
      const chunk = rawData.slice(i, i + BATCH_SIZE);
      
      const batchPayload = chunk.map(row => {
        const rawName = String(row[mapping.name] || 'قطعة غيار').trim();
        let rawMake = mapping.make ? String(row[mapping.make] || '').trim() : '';
        let rawModel = mapping.model ? String(row[mapping.model] || '').trim() : '';
        let rawYear = mapping.year ? String(row[mapping.year] || '').trim() : '';
        let rawCat = mapping.category ? String(row[mapping.category] || '').trim() : '';

        // تصحيح الماركة
        if (MAKE_CORRECTIONS[rawMake]) {
          rawMake = MAKE_CORRECTIONS[rawMake];
          autoCorrections++;
        }

        // استنتاج البيانات المفقودة تلقائياً من اسم القطعة
        if (!rawMake) {
          Object.keys(MAKE_CORRECTIONS).forEach(k => {
            if (rawName.includes(k)) { rawMake = MAKE_CORRECTIONS[k]; autoCorrections++; }
          });
        }
        if (!rawYear) rawYear = extractYearFromText(rawName);
        if (!rawCat || rawCat === 'عام') rawCat = inferCategoryFromName(rawName);

        return {
          name: rawName,
          make: rawMake || 'تويوتا',
          model: rawModel || 'عام',
          year: rawYear || '2022',
          category: rawCat || 'Engine',
          price: cleanPriceValue(row[mapping.price]),
          stock: mapping.stock && row[mapping.stock] ? parseInt(String(row[mapping.stock]).replace(/[^0-9]/g, '')) || 1 : 1,
          part_number: mapping.part_number && row[mapping.part_number] ? String(row[mapping.part_number]).trim() : null,
          part_type: 'تجاري',
          part_condition: mapping.part_condition && row[mapping.part_condition] ? String(row[mapping.part_condition]).trim() : 'جديد',
          engine: 'عام',
          user_id: session?.user?.id || session?.id || session?.phone || 'garage',
          image_url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80'
        };
      });

      try {
        const res = await fetch(`${cleanBaseUrl}/rest/v1/parts`, {
          method: 'POST',
          headers: {
            'apikey': apiKey,
            'Authorization': `Bearer ${session?.access_token || session?.token || apiKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(batchPayload)
        });

        if (!res.ok) {
          const errBody = await res.text();
          console.error("Supabase Excel Upload Error:", errBody);
        }

        const currentUploaded = Math.min(i + BATCH_SIZE, total);
        setUploadedCount(currentUploaded);
        setCorrectedCount(autoCorrections);
        setProgress(Math.round((currentUploaded / total) * 100));

      } catch (err) {
        console.error('Batch Upload Error:', err);
      }
    }

    setStep('done');
    onSuccess();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '780px', backgroundColor: '#ffffff', borderRadius: '24px', padding: '28px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)', direction: isRtl ? 'rtl' : 'ltr', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* هيدر المودال */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '30px' }}>📊</span>
            <div>
              <h3 style={{ margin: 0, color: '#1f3a5f', fontSize: '19px', fontWeight: 'bold' }}>
                {isRtl ? 'الرفع والمعالجة الذكية لملفات الإكسل' : 'Smart Excel Bulk Upload'}
              </h3>
              <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                {isRtl ? 'كشف العناوين وتصحيح المسميات والاستنتاج التلقائي للأقسام' : 'Auto-detects header row & infers missing categories'}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✖</button>
        </div>

        {errorMsg && (
          <div style={{ backgroundColor: '#fdecec', color: '#d1453b', padding: '12px 16px', borderRadius: '12px', marginBottom: '16px', fontWeight: 'bold', fontSize: '13px', textAlign: 'center', border: '1px solid #fecaca' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* 1️⃣ المرحلة الأولى: اختيار الملف */}
        {step === 'select' && (
          <div style={{ border: '2.5px dashed #cbd5e0', borderRadius: '18px', padding: '45px 20px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
            <span style={{ fontSize: '50px', display: 'block', marginBottom: '12px' }}>📁</span>
            <h4 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '17px' }}>
              {isRtl ? 'اختر ملف إكسل من جهازك' : 'Choose your Excel File'}
            </h4>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px', lineHeight: '1.5' }}>
              {isRtl ? 'يدعم الملفات بنوع (.xlsx, .xls, .csv). النظام سيتعرف تلقائياً على سطر العناوين ويتجاوز الترويسات الفارغة.' : 'Supports .xlsx, .xls, .csv files with auto-header detection.'}
            </p>

            <label style={{ padding: '13px 32px', backgroundColor: '#1f3a5f', color: '#ffffff', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14.5px', display: 'inline-block', boxShadow: '0 4px 14px rgba(31,58,95,0.25)' }}>
              <span>{isRtl ? 'تصفح الملفات 📄' : 'Browse File'}</span>
              <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>
        )}

        {/* 2️⃣ المرحلة الثانية: مراجعة وتعديل الربط الذكي */}
        {step === 'map' && (
          <div>
            <div style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1.5px solid #bbf7d0', padding: '12px 18px', borderRadius: '14px', marginBottom: '18px', fontSize: '13.5px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>✅ {isRtl ? `تم فحص الملف بنجاح والتعرف على (${totalCount}) قطعة جاهزة للرفع` : `File analyzed! (${totalCount} parts ready)`}</span>
            </div>

            {/* معاينة ذكية لأول صف */}
            {rawData.length > 0 && (
              <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', padding: '12px 16px', borderRadius: '12px', marginBottom: '18px', fontSize: '12.5px' }}>
                <strong style={{ color: '#c2410c', display: 'block', marginBottom: '4px' }}>
                  🔍 {isRtl ? 'معاينة عينة من الصف الأول المكتشف:' : 'First row sample preview:'}
                </strong>
                <span style={{ color: '#9a3412', wordBreak: 'break-word' }}>
                  {Object.entries(rawData[0]).slice(0, 5).map(([k, v]) => `${k}: "${v}"`).join(' | ')}
                </span>
              </div>
            )}

            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '14px' }}>
              {isRtl ? 'تمت مطابقة الحقول تلقائياً. تأكد من صحة الربط قبل البدء:' : 'Confirm column mappings:'}
            </p>

            {/* شبكة الربط */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', maxHeight: '280px', overflowY: 'auto', paddingInlineEnd: '6px' }}>
              {[
                { key: 'name', label: isRtl ? 'اسم القطعة (مطلوب) *' : 'Part Name *', req: true },
                { key: 'price', label: isRtl ? 'السعر (مطلوب) *' : 'Price *', req: true },
                { key: 'make', label: isRtl ? 'الماركة (تويوتا/نيسان...)' : 'Make' },
                { key: 'model', label: isRtl ? 'الموديل (كامري/باترول...)' : 'Model' },
                { key: 'year', label: isRtl ? 'سنة الصنع (2022)' : 'Year' },
                { key: 'category', label: isRtl ? 'القسم / التصنيف' : 'Category' },
                { key: 'part_number', label: isRtl ? 'رقم القطعة OEM / Part #' : 'Part Number' },
                { key: 'part_condition', label: isRtl ? 'الحالة (جديد/مستعمل)' : 'Condition' },
                { key: 'stock', label: isRtl ? 'الكمية المتوفرة' : 'Stock Qty' }
              ].map(field => (
                <div key={field.key} style={{ padding: '10px 12px', borderRadius: '12px', backgroundColor: '#f8fafc', border: field.req ? '1.5px solid #cbd5e0' : '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: field.req ? '#1f3a5f' : '#64748b', marginBottom: '4px' }}>
                    {field.label}
                  </label>
                  <select
                    value={mapping[field.key] || ''}
                    onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '12.5px', backgroundColor: '#ffffff', fontWeight: 'bold' }}
                  >
                    <option value="">-- {isRtl ? 'تحديد العمود' : 'Select Column'} --</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* أزرار التحكم */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '22px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <button onClick={() => setStep('select')} style={{ padding: '11px 20px', borderRadius: '10px', border: '1px solid #cbd5e0', background: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                {isRtl ? 'إلغاء واختيار ملف آخر' : 'Back'}
              </button>
              <button onClick={startBatchUpload} style={{ padding: '11px 28px', borderRadius: '10px', border: 'none', backgroundColor: '#16a34a', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 4px 14px rgba(22,163,74,0.3)' }}>
                🚀 {isRtl ? `تأكيد ورفع الـ (${totalCount}) قطعة الآن` : 'Start Bulk Upload'}
              </button>
            </div>
          </div>
        )}

        {/* 3️⃣ المرحلة الثالثة: شريط التقدم أثناء الرفع */}
        {step === 'uploading' && (
          <div style={{ textAlign: 'center', padding: '35px 10px' }}>
            <h4 style={{ color: '#1f3a5f', marginBottom: '8px', fontSize: '17px' }}>
              {isRtl ? 'جاري معالجة ورفع القطع إلى قاعدة البيانات...' : 'Processing & Uploading Parts...'}
            </h4>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '22px' }}>
              {isRtl ? `تم رفع ${uploadedCount} من أصل ${totalCount} قطعة` : `Uploaded ${uploadedCount} of ${totalCount}`}
            </p>

            {/* شريط التقدم */}
            <div style={{ width: '100%', height: '14px', backgroundColor: '#e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
              <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#16a34a', transition: 'width 0.3s ease' }} />
            </div>

            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#16a34a' }}>{progress}%</span>
          </div>
        )}

        {/* 4️⃣ المرحلة الأخيرة: تقرير النجاح */}
        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <span style={{ fontSize: '56px' }}>🎉</span>
            <h3 style={{ color: '#16a34a', margin: '14px 0 6px 0', fontSize: '20px' }}>
              {isRtl ? 'تم رفع وإضافة القطع بنجاح!' : 'Bulk Upload Completed!'}
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '16px' }}>
              {isRtl ? `تمت إضافة ${uploadedCount} قطعة جديدة لكتالوج معروضاتك وجاهزة للبيع فوراً.` : `Successfully added ${uploadedCount} parts to catalog.`}
            </p>

            {correctedCount > 0 && (
              <p style={{ fontSize: '13px', color: '#c2410c', fontWeight: 'bold', marginBottom: '22px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', padding: '10px', borderRadius: '10px', maxWidth: '450px', margin: '0 auto 22px auto' }}>
                ✨ {isRtl ? `تم التعرف والتصحيح الإملائي التلقائي لـ ${correctedCount} معلومة بنجاح!` : `Auto-corrected ${correctedCount} entries!`}
              </p>
            )}

            <button onClick={onClose} style={{ padding: '12px 34px', backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
              {isRtl ? 'العودة للوحة المعروضات ⚙️' : 'Done'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default ExcelPartUploader;
