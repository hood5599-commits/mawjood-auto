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

const SYNONYMS: Record<string, string[]> = {
  name: ['اسم القطعة', 'اسم قطعة الغيار', 'القطعة', 'الاسم', 'اسم السلعة', 'الوصف', 'بيان القطعة', 'part name', 'name', 'item', 'description', 'part', 'title', 'سلعة', 'اسم الغيار'],
  vehicle: ['طراز السيارة المتوافق', 'السيارة المتوافقة', 'طراز السيارة', 'توافق السيارة', 'السيارة والموديل', 'الموديل المتوافق', 'vehicle', 'fitment', 'car fitment', 'compatible vehicle'],
  make: ['ماركة السيارة', 'نوع السيارة', 'الشركة الصانعة', 'الماركه', 'make', 'brand', 'car make'],
  model: ['موديل السيارة', 'طراز السيارة', 'طراز', 'model', 'car model', 'فئة السيارة'],
  year: ['السنة', 'سنة الصنع', 'الموديل (السنة)', 'سنه الصنع', 'الموديل/السنة', 'year', 'make year', 'prod year', 'عام'],
  category: ['الفئة', 'القسم', 'التصنيف', 'قسم القطعة', 'التصنيف الرئيسي', 'نوع القطعة', 'category', 'cat', 'type'],
  part_brand: ['الماركة / المصنع', 'المصنع', 'الماركة', 'ماركة القطعة', 'الشركة المصنعة', 'manufacturer', 'part brand', 'brand'],
  price: ['سعر البيع للوحدة', 'السعر', 'سعر البيع', 'المبلغ', 'القيمة', 'سعر التجزئة', 'سعر القطعة', 'price', 'unit price', 'selling price', 'cost', 'amount', 'qar', 'qr'],
  stock: ['الكمية المتاحة', 'الكمية', 'المخزون', 'العدد', 'المتوفر', 'stock', 'qty', 'quantity', 'count'],
  part_number: ['رمز القطعة (SKU)', 'رقم القطعة', 'الرمز', 'كود القطعة', 'رقم الغيار', 'oem', 'sku', 'part number', 'part no', 'code'],
  part_condition: ['حالة المخزون', 'الحالة', 'حالة القطعة', 'جديد/مستعمل', 'condition', 'part_condition', 'state'],
  engine: ['المحرك', 'سعة المحرك', 'نوع المحرك', 'حجم المحرك', 'engine', 'motor', 'displacement', 'fuel']
};

const CATEGORY_MAP_AR: Record<string, string> = {
  'المحرك وملحقاته': 'Engine',
  'نظام التعليق والتوجيه': 'Suspension',
  'الكهرباء والإلكترونيات': 'Electrical',
  'التكييف والتبريد': 'Heat & Air Conditioning',
  'الفلاتر والزيوت': 'Fuel & Air',
  'الهيكل والخارجية': 'Body & Lamp Assembly',
  'الإضاءة والعدسات': 'Body & Lamp Assembly',
  'نظام العادم والوقود': 'Exhaust & Emission',
  'الإطارات والجنوط': 'Wheel',
  'نظام الفرامل': 'Brake & Wheel Hub'
};

const KNOWN_MAKES = [
  { make: 'تويوتا', patterns: [/تويوتا|تويوتتا|تويتا|toyota/i] },
  { make: 'لكزس', patterns: [/لكزس|lexus/i] },
  { make: 'نيسان', patterns: [/نيسان|نيصان|nissan/i] },
  { make: 'هيونداي', patterns: [/هيونداي|هونداي|hyundai/i] },
  { make: 'كيا', patterns: [/كيا|kia/i] },
  { make: 'مرسيدس', patterns: [/مرسيدس|mercedes|benz/i] },
  { make: 'بي إم دبليو', patterns: [/بي إم دبليو|بي ام دبليو|bmw/i] },
  { make: 'فورد', patterns: [/فورد|ford/i] },
  { make: 'شفروليه', patterns: [/شفروليه|شيفروليه|شفروليت|chevrolet|chevy/i] },
  { make: 'جي إم سي', patterns: [/جي إم سي|جمس|gmc/i] },
  { make: 'هوندا', patterns: [/هوندا|honda/i] },
  { make: 'مازدا', patterns: [/مازدا|mazda/i] },
  { make: 'ميتسوبيشي', patterns: [/ميتسوبيشي|mitsubishi/i] },
  { make: 'لاند روفر', patterns: [/لاند روفر|رينج روفر|land rover|range rover/i] },
  { make: 'أودي', patterns: [/أودي|audi/i] },
  { make: 'فولكس فاجن', patterns: [/فولكس فاجن|vw|volkswagen/i] }
];

// 🧠 دالة تفكيك واستخراج التوافق (الماركة + الموديل + السنة) من النص المدمج
const parseVehicleFitment = (rawText: string): { make: string; model: string; year: string } => {
  if (!rawText) return { make: 'عام / متعدد', model: 'عام', year: '2022' };

  let text = String(rawText).trim();

  // 1. استخراج سنة الصنع (سواء 2017-2023 أو 12-15 أو 2020)
  let extractedYear = '2022';
  const yearMatchFull = text.match(/\(?\b(19\d\d|20\d\d)\s*[-/]\s*(19\d\d|20\d\d)\b\)?/);
  const yearMatchShort = text.match(/\(?\b(\d{2})\s*[-/]\s*(\d{2})\b\)?/);
  const yearMatchSingle = text.match(/\(?\b(19\d\d|20\d\d)\b\)?/);

  if (yearMatchFull) {
    extractedYear = `${yearMatchFull[1]}-${yearMatchFull[2]}`;
    text = text.replace(yearMatchFull[0], '').trim();
  } else if (yearMatchShort) {
    const y1 = Number(yearMatchShort[1]);
    const y2 = Number(yearMatchShort[2]);
    const f1 = y1 >= 70 ? `19${y1}` : `20${y1 < 10 ? '0' + y1 : y1}`;
    const f2 = y2 >= 70 ? `19${y2}` : `20${y2 < 10 ? '0' + y2 : y2}`;
    extractedYear = `${f1}-${f2}`;
    text = text.replace(yearMatchShort[0], '').trim();
  } else if (yearMatchSingle) {
    extractedYear = yearMatchSingle[1];
    text = text.replace(yearMatchSingle[0], '').trim();
  }

  // 2. استخراج ماركة وموديل السيارة
  let detectedMake = 'عام / متعدد';
  let detectedModel = text;

  for (const item of KNOWN_MAKES) {
    for (const pattern of item.patterns) {
      if (pattern.test(text)) {
        detectedMake = item.make;
        detectedModel = text.replace(pattern, '').replace(/[-/:()]/g, '').trim();
        break;
      }
    }
    if (detectedMake !== 'عام / متعدد') break;
  }

  return {
    make: detectedMake,
    model: detectedModel || 'عام',
    year: extractedYear
  };
};

const extractEngineDetails = (text: string): string => {
  const t = (text || '').toLowerCase();
  if (/ديزل|diesel/.test(t)) {
    const dMatch = t.match(/(\d+\.\d+)\s*(l|لتر)?\s*ديزل|diesel/i);
    return dMatch ? `${dMatch[1]}L ديزل (Diesel)` : 'ديزل (Diesel)';
  }
  if (/هايبرد|hybrid/.test(t)) return 'هايبرد (Hybrid)';
  if (/تيربو|توربو|turbo/.test(t)) {
    const tMatch = t.match(/(\d+\.\d+)\s*(l|لتر)?\s*(turbo|تيربو|توربو)/i);
    return tMatch ? `${tMatch[1]}L تيربو` : 'توربو (Turbo)';
  }

  const lMatch = t.match(/\b(\d\.\d)\s*(l|لتر)?\b/i);
  const vMatch = t.match(/\b(v6|v8|v4|v12|l4|6\s*سلندر|8\s*سلندر|4\s*سلندر)\b/i);

  if (lMatch && vMatch) return `${lMatch[1]}L ${vMatch[1].toUpperCase()}`;
  if (lMatch) return `${lMatch[1]}L`;
  if (vMatch) return vMatch[1].toUpperCase();

  return 'جميع المحركات (بنزين / ديزل)';
};

const isSummaryOrJunkRow = (name: string, price: any): boolean => {
  const n = String(name || '').trim().toLowerCase();
  if (!n || n === 'nan') return true;
  if (/إجمالي|اجمالي|المجموع|الإجمالي الكلي|المجموع الكلي|grand total|total|sum|مجموع المخزون/.test(n)) return true;
  if (n.startsWith('---') || n.startsWith('===') || n === 'name' || n === 'اسم القطعة') return true;
  if (price === 0 && (/إجمالي|total|مجموع/.test(n))) return true;
  return false;
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
    vehicle: '',
    make: '',
    model: '',
    year: '',
    category: '',
    part_brand: '',
    price: '',
    stock: '',
    part_number: '',
    part_condition: '',
    engine: ''
  });

  const [progress, setProgress] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [filteredJunkCount, setFilteredJunkCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        const rawGrid: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!rawGrid || rawGrid.length === 0) {
          setErrorMsg(isRtl ? 'الملف المرفوع فارغ تماماً.' : 'File is empty.');
          return;
        }

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
          .map((h: any, idx: number) => String(h || '').trim() || `عمود_${idx + 1}`)
          .filter((h: string) => !h.startsWith('EMPTY_') && h.trim() !== '');

        const dataRows = rawGrid.slice(bestHeaderRowIndex + 1);
        const structuredData: any[] = [];
        let ignoredJunk = 0;

        dataRows.forEach(row => {
          const rowObj: Record<string, any> = {};
          let hasContent = false;

          rawHeaderRow.forEach((h: any, idx: number) => {
            const colName = String(h || '').trim() || `عمود_${idx + 1}`;
            const val = row[idx] ?? '';
            if (String(val).trim() !== '') hasContent = true;
            rowObj[colName] = val;
          });

          if (!hasContent) return;

          const firstCell = String(Object.values(rowObj)[0] || '');
          if (isSummaryOrJunkRow(firstCell, 0)) {
            ignoredJunk++;
            return;
          }

          structuredData.push(rowObj);
        });

        if (structuredData.length === 0) {
          setErrorMsg(isRtl ? 'لم يتم العثور على صفوف بيانات صالحة في الملف.' : 'No valid data rows found.');
          return;
        }

        setHeaders(detectedHeaders);
        setRawData(structuredData);
        setTotalCount(structuredData.length);
        setFilteredJunkCount(ignoredJunk);

        autoDetectMapping(detectedHeaders);
        setStep('map');

      } catch (err) {
        setErrorMsg(isRtl ? 'حدث خطأ أثناء قراءة ملف الإكسل.' : 'Failed to parse Excel file.');
      }
    };

    reader.readAsBinaryString(file);
  };

  const autoDetectMapping = (detectedHeaders: string[]) => {
    const newMapping: Record<string, string> = {
      name: '', vehicle: '', make: '', model: '', year: '', category: '', part_brand: '', price: '', stock: '', part_number: '', part_condition: '', engine: ''
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

  const cleanPriceValue = (val: any): number => {
    if (typeof val === 'number') return Math.max(0, val);
    const cleaned = String(val || '').replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : Math.max(0, num);
  };

  const startBatchUpload = async () => {
    if (!mapping.name || !mapping.price) {
      setErrorMsg(isRtl ? 'يرجى ربط حقلي "اسم القطعة" و "السعر" على الأقل.' : 'Please map at least Name and Price.');
      return;
    }

    setStep('uploading');
    setProgress(0);
    setUploadedCount(0);

    const BATCH_SIZE = 50;
    const cleanBaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');

    const validRows = rawData.filter(row => {
      const pName = String(row[mapping.name] || '');
      const pPrice = cleanPriceValue(row[mapping.price]);
      return !isSummaryOrJunkRow(pName, pPrice);
    });

    const total = validRows.length;

    for (let i = 0; i < total; i += BATCH_SIZE) {
      const chunk = validRows.slice(i, i + BATCH_SIZE);
      
      const batchPayload = chunk.map(row => {
        const rawName = String(row[mapping.name] || 'قطعة غيار').trim();
        const rawVehicle = mapping.vehicle ? String(row[mapping.vehicle] || '').trim() : '';
        const rawPartBrand = mapping.part_brand ? String(row[mapping.part_brand] || '').trim() : 'تجاري';
        
        // استخراج الماركة والموديل وسنة الصنع
        let make = mapping.make ? String(row[mapping.make] || '').trim() : '';
        let model = mapping.model ? String(row[mapping.model] || '').trim() : '';
        let year = mapping.year ? String(row[mapping.year] || '').trim() : '';

        if (rawVehicle || (!make && !model)) {
          const parsed = parseVehicleFitment(rawVehicle || rawName);
          make = parsed.make;
          model = parsed.model;
          if (!year || year === '2022') year = parsed.year;
        }

        // تحويل القسم إلى المعرف الإنجليزي القياسي
        const rawCat = mapping.category ? String(row[mapping.category] || '').trim() : '';
        const category = CATEGORY_MAP_AR[rawCat] || rawCat || 'Engine';

        // استخراج تفاصيل المحرك
        const engine = mapping.engine ? String(row[mapping.engine] || '').trim() : extractEngineDetails(rawName);

        return {
          name: rawName,
          make: make || 'عام / متعدد',
          model: model || 'عام',
          year: year || '2022',
          engine: engine || 'جميع المحركات (بنزين / ديزل)',
          category: category,
          price: cleanPriceValue(row[mapping.price]),
          stock: mapping.stock && row[mapping.stock] ? parseInt(String(row[mapping.stock]).replace(/[^0-9]/g, '')) || 1 : 1,
          part_number: mapping.part_number && row[mapping.part_number] ? String(row[mapping.part_number]).trim() : null,
          part_type: rawPartBrand || 'تجاري',
          part_condition: 'جديد',
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
          console.error("Upload Error:", await res.text());
        }

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
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '780px', backgroundColor: '#ffffff', borderRadius: '24px', padding: '28px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)', direction: isRtl ? 'rtl' : 'ltr', maxHeight: '90vh', overflowY: 'auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '30px' }}>📊</span>
            <div>
              <h3 style={{ margin: 0, color: '#1f3a5f', fontSize: '19px', fontWeight: 'bold' }}>
                {isRtl ? 'الرفع الذكي وفلترة المخزون' : 'Smart Excel Bulk Upload'}
              </h3>
              <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                {isRtl ? 'تفكيك طراز السيارة المتوافق واستخراج الماركة والموديل والسنة تلقائياً' : 'Auto-extracts Vehicle Fitment, Makes, Models & Years'}
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

        {step === 'select' && (
          <div style={{ border: '2.5px dashed #cbd5e0', borderRadius: '18px', padding: '45px 20px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
            <span style={{ fontSize: '50px', display: 'block', marginBottom: '12px' }}>📁</span>
            <h4 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '17px' }}>
              {isRtl ? 'اختر ملف إكسل من جهازك' : 'Choose your Excel File'}
            </h4>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
              {isRtl ? 'يدعم (.xlsx, .xls, .csv). سيتم تفكيك وتصنيف التوافق والموديلات وسنوات الصنع بدقة 100%.' : 'Supports .xlsx, .xls, .csv files.'}
            </p>

            <label style={{ padding: '13px 32px', backgroundColor: '#1f3a5f', color: '#ffffff', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14.5px', display: 'inline-block' }}>
              <span>{isRtl ? 'تصفح الملفات 📄' : 'Browse File'}</span>
              <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>
        )}

        {step === 'map' && (
          <div>
            <div style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1.5px solid #bbf7d0', padding: '12px 18px', borderRadius: '14px', marginBottom: '18px', fontSize: '13.5px', fontWeight: 'bold' }}>
              <span>✅ {isRtl ? `تم فحص الملف: (${totalCount}) قطعة صالحة للرفع` : `Ready to upload ${totalCount} items`}</span>
              {filteredJunkCount > 0 && <span style={{ color: '#c2410c', marginRight: '8px' }}>({isRtl ? `تم استبعاد ${filteredJunkCount} صف مجاميع` : `Excluded ${filteredJunkCount} summary rows`})</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', maxHeight: '280px', overflowY: 'auto', paddingInlineEnd: '6px' }}>
              {[
                { key: 'name', label: isRtl ? 'اسم القطعة (مطلوب) *' : 'Part Name *', req: true },
                { key: 'price', label: isRtl ? 'السعر (مطلوب) *' : 'Price *', req: true },
                { key: 'vehicle', label: isRtl ? 'طراز السيارة المتوافق (شامل الماركة والموديل)' : 'Compatible Vehicle' },
                { key: 'category', label: isRtl ? 'الفئة / القسم' : 'Category' },
                { key: 'part_brand', label: isRtl ? 'الماركة / المصنع (ماركة القطعة)' : 'Part Manufacturer' },
                { key: 'part_number', label: isRtl ? 'رمز القطعة (SKU / OEM)' : 'Part Number / SKU' },
                { key: 'stock', label: isRtl ? 'الكمية المتاحة' : 'Stock Qty' },
                { key: 'engine', label: isRtl ? 'المحرك (اختياري)' : 'Engine' }
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
                    <option value="">-- {isRtl ? 'استنتاج ذكي تلقائي' : 'Auto-Detect'} --</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '22px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <button onClick={() => setStep('select')} style={{ padding: '11px 20px', borderRadius: '10px', border: '1px solid #cbd5e0', background: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                {isRtl ? 'إلغاء' : 'Back'}
              </button>
              <button onClick={startBatchUpload} style={{ padding: '11px 28px', borderRadius: '10px', border: 'none', backgroundColor: '#16a34a', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 4px 14px rgba(22,163,74,0.3)' }}>
                🚀 {isRtl ? `تأكيد ورفع الـ (${totalCount}) قطعة الآن` : 'Start Bulk Upload'}
              </button>
            </div>
          </div>
        )}

        {step === 'uploading' && (
          <div style={{ textAlign: 'center', padding: '35px 10px' }}>
            <h4 style={{ color: '#1f3a5f', marginBottom: '8px', fontSize: '17px' }}>
              {isRtl ? 'جاري تفكيك ورفع القطع وتوزيعها على سياراتها...' : 'Processing & Uploading Parts...'}
            </h4>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '22px' }}>
              {isRtl ? `تم رفع ${uploadedCount} من أصل ${totalCount} قطعة` : `Uploaded ${uploadedCount} of ${totalCount}`}
            </p>
            <div style={{ width: '100%', height: '14px', backgroundColor: '#e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
              <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#16a34a', transition: 'width 0.3s ease' }} />
            </div>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#16a34a' }}>{progress}%</span>
          </div>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <span style={{ fontSize: '56px' }}>🎉</span>
            <h3 style={{ color: '#16a34a', margin: '14px 0 6px 0', fontSize: '20px' }}>
              {isRtl ? 'تم رفع وإعادة توزيع المخزون بنجاح!' : 'Bulk Upload Completed!'}
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '20px' }}>
              {isRtl ? `تمت إضافة ${uploadedCount} قطعة جديدة وتوزيعها بدقة على ماركاتها (كيا، هيونداي، تويوتا، مرسيدس...) وأقسامها الصحيحة.` : `Successfully added ${uploadedCount} parts to catalog.`}
            </p>
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
