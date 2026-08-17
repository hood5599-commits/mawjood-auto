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
  name: ['اسم القطعة', 'القطعة', 'الاسم', 'اسم السلعة', 'الوصف', 'بيان القطعة', 'part name', 'name', 'item', 'description', 'part', 'title', 'سلعة', 'اسم الغيار'],
  make: ['الماركة', 'الشركة', 'نوع السيارة', 'المصنع', 'الماركه', 'الشركة الصانعة', 'make', 'brand', 'car make', 'manufacturer'],
  model: ['الموديل', 'موديل السيارة', 'الموديل/الفئة', 'الفئة', 'طراز السيارة', 'model', 'car model', 'فئة السيارة'],
  year: ['السنة', 'سنة الصنع', 'الموديل (السنة)', 'سنه الصنع', 'الموديل/السنة', 'year', 'make year', 'prod year', 'عام'],
  engine: ['المحرك', 'سعة المحرك', 'نوع المحرك', 'حجم المحرك', 'engine', 'motor', 'displacement', 'fuel'],
  category: ['القسم', 'الفئة', 'التصنيف', 'قسم القطعة', 'التصنيف الرئيسي', 'نوع القطعة', 'category', 'cat', 'type'],
  price: ['السعر', 'سعر البيع', 'المبلغ', 'القيمة', 'سعر التجزئة', 'سعر القطعة', 'price', 'unit price', 'selling price', 'cost', 'amount', 'qar', 'qr'],
  part_number: ['رقم القطعة', 'الرمز', 'كود القطعة', 'رقم الغيار', 'oem', 'part number', 'part no', 'sku', 'part_number', 'code', 'الرقم الأصلي'],
  part_condition: ['الحالة', 'حالة القطعة', 'جديد/مستعمل', 'حالة الغيار', 'condition', 'part_condition', 'state'],
  stock: ['الكمية', 'المخزون', 'العدد', 'المتوفر', 'stock', 'qty', 'quantity', 'count']
};

// 🚗 قاموس شامل لاستخراج الماركات والموديلات من النصوص
const BRAND_RULES: { make: string; patterns: RegExp[]; models?: Record<string, RegExp[]> }[] = [
  {
    make: 'تويوتا',
    patterns: [/تويوتا|تويوتتا|تويتا|toyota/i],
    models: {
      'كامري': [/كامري|camry/i],
      'كورولا': [/كورولا|corolla/i],
      'لاندكروزر': [/لاندكروزر|لاند كروزر|land cruiser|vxr|gxr/i],
      'هايلوكس': [/هايلوكس|hilux/i],
      'افالون': [/افالون|avalon/i],
      'راف فور': [/راف فور|rav4|rav 4/i],
      'برادو': [/برادو|prado/i],
      'يارس': [/يارس|yaris/i],
      'فورتشنر': [/فورتشنر|fortuner/i]
    }
  },
  {
    make: 'لكزس',
    patterns: [/لكزس|lexus/i],
    models: {
      'LX': [/lx570|lx600|lx470|lx/i],
      'ES': [/es350|es300|es/i],
      'LS': [/ls460|ls500|ls400|ls/i],
      'RX': [/rx350|rx/i],
      'IS': [/is300|is250|is350|is/i],
      'GX': [/gx460|gx/i]
    }
  },
  {
    make: 'نيسان',
    patterns: [/نيسان|نيصان|nissan/i],
    models: {
      'باترول': [/باترول|patrol|فتك|vtec/i],
      'التيما': [/التيما|altima/i],
      'مكسيما': [/مكسيما|maxima/i],
      'صني': [/صني|sunny/i],
      'نافارا': [/نافارا|navara/i],
      'باثفندر': [/باثفندر|pathfinder/i],
      'اكستيرا': [/اكستيرا|xterra/i]
    }
  },
  {
    make: 'كيا',
    patterns: [/كيا|kia/i],
    models: {
      'اوبتيما / K5': [/اوبتيما|أوبتيما|optima|k5/i],
      'سبورتاج': [/سبورتاج|sportage/i],
      'سورينتو': [/سورينتو|sorento/i],
      'كادينزا / K8': [/كادينزا|cadenza|k8/i],
      'سيراتو': [/سيراتو|cerato|forte/i],
      'كرنفال': [/كرنفال|carnival|sedona/i]
    }
  },
  {
    make: 'هيونداي',
    patterns: [/هيونداي|هونداي|hyundai/i],
    models: {
      'سوناتا': [/سوناتا|sonata/i],
      'النترا': [/النترا|elantra/i],
      'اكسنت': [/اكسنت|accent/i],
      'توسان': [/توسان|tucson/i],
      'سنتافي': [/سنتافي|santa fe/i],
      'ازيرا': [/ازيرا|azera/i]
    }
  },
  {
    make: 'مرسيدس',
    patterns: [/مرسيدس|mercedes|mercedes-benz|benz/i],
    models: {
      'E-Class': [/e-class|e class|e300|e350|e200|e63/i],
      'S-Class': [/s-class|s class|s500|s550|s560|s63/i],
      'C-Class': [/c-class|c class|c200|c300|c250|c63/i],
      'G-Class': [/g-class|g class|g63|g500|g55/i]
    }
  },
  {
    make: 'بي إم دبليو',
    patterns: [/بي إم دبليو|بي ام دبليو|bmw/i],
    models: {
      'الفئة الخامسة (5-Series)': [/5-series|5 series|520|528|530|535|540|550|m5/i],
      'الفئة السابعة (7-Series)': [/7-series|7 series|730|740|750|760/i],
      'الفئة الثالثة (3-Series)': [/3-series|3 series|320|328|330|335|m3/i],
      'X5': [/x5/i],
      'X6': [/x6/i]
    }
  },
  {
    make: 'فورد',
    patterns: [/فورد|ford/i],
    models: {
      'F-150': [/f-150|f150|f 150|raptor|رابتر/i],
      'اكسبلورر': [/اكسبلورر|explorer/i],
      'اكسبدشن': [/اكسبدشن|expedition/i],
      'تورس': [/تورس|taurus/i],
      'موستنج': [/موستنج|mustang/i]
    }
  },
  {
    make: 'شفروليه',
    patterns: [/شفروليه|شفروليت|شيفروليه|chevrolet|chevy/i],
    models: {
      'تاهو': [/تاهو|tahoe/i],
      'سلفرادو': [/سلفرادو|silverado/i],
      'كابرس': [/كابرس|caprice/i],
      'لومينا': [/لومينا|lumina/i],
      'ماليبو': [/ماليبو|malibu/i],
      'ترافيرس': [/ترافيرس|traverse/i]
    }
  },
  {
    make: 'جي إم سي',
    patterns: [/جي إم سي|جمس|gmc/i],
    models: {
      'يوكن': [/يوكن|yukon|denali|دينالي/i],
      'سييرا': [/سييرا|sierra/i],
      'اكاديا': [/اكاديا|acadia/i]
    }
  },
  {
    make: 'هوندا',
    patterns: [/هوندا|honda/i],
    models: {
      'اكورد': [/اكورد|accord/i],
      'سيفيك': [/سيفيك|civic/i],
      'سي ار في': [/cr-v|crv/i],
      'بايلوت': [/بايلوت|pilot/i]
    }
  }
];

// 🧠 استخراج المحرك ونوع الوقود بدقة من النص
const extractEngineDetails = (text: string): string => {
  const t = (text || '').toLowerCase();
  
  // فحص نوع الوقود الخاص أولاً
  if (/ديزل|diesel/.test(t)) {
    const dMatch = t.match(/(\d+\.\d+)\s*(l|لتر)?\s*ديزل|diesel/i);
    return dMatch ? `${dMatch[1]}L ديزل (Diesel)` : 'ديزل (Diesel)';
  }
  if (/هايبرد|hybrid/.test(t)) return 'هايبرد (Hybrid)';
  if (/تيربو|توربو|turbo/.test(t)) {
    const tMatch = t.match(/(\d+\.\d+)\s*(l|لتر)?\s*(turbo|تيربو|توربو)/i);
    return tMatch ? `${tMatch[1]}L تيربو` : 'توربو (Turbo)';
  }

  // فحص سعة المحرك اللترية وشكل السلندرات
  const lMatch = t.match(/\b(\d\.\d)\s*(l|لتر)?\b/i);
  const vMatch = t.match(/\b(v6|v8|v4|v12|l4|6\s*سلندر|8\s*سلندر|4\s*سلندر)\b/i);

  if (lMatch && vMatch) return `${lMatch[1]}L ${vMatch[1].toUpperCase()}`;
  if (lMatch) return `${lMatch[1]}L`;
  if (vMatch) return vMatch[1].toUpperCase();

  return 'جميع المحركات (بنزين / ديزل)';
};

// 🧭 استنتاج القسم الرئيسي
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

// 🔍 استخراج سنة الصنع
const extractYearFromText = (text: string): string => {
  const matchRange = text.match(/\b(19\d\d|20\d\d)\s*[-/]\s*(19\d\d|20\d\d)\b/);
  if (matchRange) return `${matchRange[1]}-${matchRange[2]}`;
  const matchSingle = text.match(/\b(19\d\d|20\d\d)\b/);
  if (matchSingle) return matchSingle[1];
  return '2022';
};

// 🚫 فحص واستبعاد صفوف المجاميع والترويسات
const isSummaryOrJunkRow = (name: string, price: any): boolean => {
  const n = String(name || '').trim().toLowerCase();
  if (!n) return true;
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
    make: '',
    model: '',
    year: '',
    engine: '',
    category: '',
    price: '',
    part_number: '',
    part_condition: '',
    stock: ''
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

          // استبعاد صفوف المجاميع فوراً
          const firstCell = Object.values(rowObj)[0] || '';
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
      name: '', make: '', model: '', year: '', engine: '', category: '', price: '', part_number: '', part_condition: '', stock: ''
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

    // تنقية الصفوف واستبعاد المجاميع
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
        let detectedMake = mapping.make ? String(row[mapping.make] || '').trim() : '';
        let detectedModel = mapping.model ? String(row[mapping.model] || '').trim() : '';
        let detectedYear = mapping.year ? String(row[mapping.year] || '').trim() : '';
        let detectedEngine = mapping.engine ? String(row[mapping.engine] || '').trim() : '';
        let detectedCat = mapping.category ? String(row[mapping.category] || '').trim() : '';

        // استخراج الماركة والموديل الذكي إذا لم يتوفر عمود منفصل
        if (!detectedMake) {
          for (const brand of BRAND_RULES) {
            if (brand.patterns.some(p => p.test(rawName))) {
              detectedMake = brand.make;
              if (!detectedModel && brand.models) {
                for (const [mName, mPatterns] of Object.entries(brand.models)) {
                  if (mPatterns.some(mp => mp.test(rawName))) {
                    detectedModel = mName;
                    break;
                  }
                }
              }
              break;
            }
          }
        }

        // استخراج المحرك والوقود وسنة الصنع والتصنيف
        if (!detectedEngine) detectedEngine = extractEngineDetails(rawName);
        if (!detectedYear) detectedYear = extractYearFromText(rawName);
        if (!detectedCat || detectedCat === 'عام') detectedCat = inferCategoryFromName(rawName);

        return {
          name: rawName,
          make: detectedMake || 'عام / متعدد',
          model: detectedModel || 'عام',
          year: detectedYear || '2022',
          engine: detectedEngine || 'جميع المحركات (بنزين / ديزل)',
          category: detectedCat || 'Engine',
          price: cleanPriceValue(row[mapping.price]),
          stock: mapping.stock && row[mapping.stock] ? parseInt(String(row[mapping.stock]).replace(/[^0-9]/g, '')) || 1 : 1,
          part_number: mapping.part_number && row[mapping.part_number] ? String(row[mapping.part_number]).trim() : null,
          part_type: 'تجاري',
          part_condition: mapping.part_condition && row[mapping.part_condition] ? String(row[mapping.part_condition]).trim() : 'جديد',
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
                {isRtl ? 'استخراج الماركات والمحركات (بنزين/ديزل) واستبعاد صفوف المجاميع تلقائياً' : 'Auto-extracts Brands, Fuel/Engine types & excludes summary rows'}
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
              {isRtl ? 'يدعم (.xlsx, .xls, .csv). سيتم تصنيف كل قطعة حسب ماركتها ومحركها الحقيقي تلقائياً.' : 'Supports .xlsx, .xls, .csv files.'}
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
                { key: 'make', label: isRtl ? 'الماركة (اختياري/تلقائي)' : 'Make' },
                { key: 'model', label: isRtl ? 'الموديل (اختياري/تلقائي)' : 'Model' },
                { key: 'year', label: isRtl ? 'سنة الصنع (اختياري/تلقائي)' : 'Year' },
                { key: 'engine', label: isRtl ? 'المحرك/الوقود (اختياري/تلقائي)' : 'Engine' },
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
              {isRtl ? 'جاري تصنيف ورفع القطع إلى قاعدة البيانات...' : 'Processing & Uploading Parts...'}
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
              {isRtl ? 'تم رفع وإعادة تصنيف المخزون بنجاح!' : 'Bulk Upload Completed!'}
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '20px' }}>
              {isRtl ? `تمت إضافة ${uploadedCount} قطعة جديدة لكتالوج معروضاتك ومطابقة ماركاتها ومحركاتها بدقة.` : `Successfully added ${uploadedCount} parts to catalog.`}
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
