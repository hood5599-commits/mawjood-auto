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

// 🧠 محرك ذكي مدمج باللهجة القطرية والخليجية والعربية والإنجليزية
const resolveFullCategoryTree = (partName: string, rawCategory: string = ''): string => {
  const name = (partName || '').toLowerCase();
  const rawCat = (rawCategory || '').toLowerCase();

  // 1. الفرامل - Brake & Wheel Hub (سفايف / درامات / هاند بريك)
  if (/سفايف|سفيفة|فحمات|قماشات|تيل فرامل|brake pad|brake pads|brake shoe/.test(name)) return 'Brake & Wheel Hub > Brake Pad';
  if (/درام ويل|درامات|درام|هوب|هوبات|دسك فرامل|rotor|brake rotor|brake disc/.test(name)) return 'Brake & Wheel Hub > Rotor';
  if (/كليبر|caliper/.test(name)) return 'Brake & Wheel Hub > Caliper';
  if (/abs|مانع انزلاق|wheel speed/.test(name)) return 'Brake & Wheel Hub > ABS Control Module';
  if (/زيت فرامل|زيت بريك|brake fluid/.test(name)) return 'Brake & Wheel Hub > Brake Fluid';
  if (/رمان|بيرنج|bearing|فلنجة|wheel bearing|hub/.test(name)) return 'Brake & Wheel Hub > Wheel Bearing & Hub';
  if (/هاند بريك|بريك يد|جلنط/.test(name)) return 'Brake & Wheel Hub > Parking Brake Shoe';

  // 2. المساعدات والتعليق - Suspension (جامبينات / سبرنغات / شيالات / بوشات)
  if (/جامبين|جامبينات|جمبينات|كمبين|مساعد|مساعدات|strut|shock|shock absorber|شكلس/.test(name)) return 'Suspension > Shock / Strut';
  if (/شيال|شيالات|مقص|مقصات|control arm|ذراع تحكم/.test(name)) return 'Suspension > Control Arm';
  if (/سبرنغ|سبرنغات|ياي|يايات|spring|coil spring|سوستة/.test(name)) return 'Suspension > Coil Spring';
  if (/رود توازن|رودات توازن|لينك توازن|لينكات|مسمار توازن|مسامير توازن|sway bar link|sway bar/.test(name)) return 'Suspension > Sway Bar Link';
  if (/بوش|بوشات|بوشينج|جلبة|جلب|كرسي مساعد|bushings|bushing/.test(name)) return 'Suspension > Control Arm Bushing';

  // 3. التوجيه والدركسون - Steering (سكان / استيرنج راك / رودات)
  if (/استيرنج راك|مجمع ستيرنج|دودة سكان|دودة دركسون|دودة|rack and pinion|power steering|steering rack/.test(name)) return 'Steering > Rack and Pinion';
  if (/رود سكان|رودات سكان|رود دركسون|رودات دركسون|تاي رود|tie rod|tie rod end|ذراع دركسون/.test(name)) return 'Steering > Tie Rod End';

  // 4. التبريد والرديتر - Cooling System (رديتر ماي / واتر بمب / ماي رديتر)
  if (/سائل تبريد|ماي رديتر|ماء رديتر|coolant|antifreeze/.test(name)) return 'Cooling System > Coolant / Antifreeze';
  if (/واتر بمب|ووتر بمب|طرمبة ماي|طرمبة ماء|water pump|مضخة ماء/.test(name)) return 'Cooling System > Water Pump';
  if (/رديتر مكينة|رديتر ماي|رديتر ماء|engine radiator/.test(name) || (name.includes('radiator') && !name.includes('a/c') && !name.includes('مكيف'))) return 'Cooling System > Radiator';
  if (/ثرموستات|thermostat|كوع حرارة|بلف حرارة|بلف ماي/.test(name)) return 'Cooling System > Thermostat';
  if (/مروحة رديتر|مروحة|fan assembly|radiator fan/.test(name)) return 'Cooling System > Radiator Fan Assembly';
  if (/قربة ماي|قربة ماء|coolant reservoir|خرطوش|expansion tank|غطا رديتر/.test(name)) return 'Cooling System > Coolant Reservoir';

  // 5. التكييف والتدفئة - Heat & Air Conditioning (كمبريسر / رديتر مكيف)
  if (/رديتر مكيف|مكثف|condenser|a\/c condenser/.test(name)) return 'Heat & Air Conditioning > A/C Condenser';
  if (/كمبريسر|كمبروسر|compressor|ضاغط|a\/c compressor/.test(name)) return 'Heat & Air Conditioning > A/C Compressor';
  if (/ثلاجة مكيف|ثلاجة|evaporator|a\/c evaporator/.test(name)) return 'Heat & Air Conditioning > A/C Evaporator Core';
  if (/فلتر مكيف|cabin filter|cabin air filter|cabin air/.test(name)) return 'Heat & Air Conditioning > Cabin Air Filter';
  if (/بلف مكيف|expansion valve/.test(name)) return 'Heat & Air Conditioning > A/C Expansion Valve';

  // 6. نظام الاشتعال - Ignition (بلاكات / كويلات)
  if (/بلاك|بلاكات|بلكات|بواجي|شمعات احتراق|spark plug|spark plugs|glow plug/.test(name)) return 'Ignition > Spark Plug';
  if (/كويل|كويلات|ignition coil|ملف اشعال|ignition coils/.test(name)) return 'Ignition > Ignition Coil';

  // 7. الوقود والهواء - Fuel & Air (فيول بمب / فلتر مكينة / بترول)
  if (/فلتر هواء|فلتر مكينة|air filter|engine air filter/.test(name)) return 'Fuel & Air > Air Filter';
  if (/فيول بمب|بمب بترول|طرمبة بترول|طرمبة بنزين|fuel pump|مضخة وقود/.test(name)) return 'Fuel & Air > Fuel Pump & Housing Assembly';
  if (/بخاخ|بخاخات|injector|fuel injector|نوزل/.test(name)) return 'Fuel & Air > Fuel Injector';
  if (/فلتر بترول|فلتر بنزين|fuel filter|هوز بترول|fuel line/.test(name)) return 'Fuel & Air > Fuel Line / Hose';
  if (/ثروتل|throttle|بوابة هواء|throttle body/.test(name)) return 'Fuel & Air > Throttle Body';

  // 8. القير والمحاور - Transmission & Drivetrain (شفتات / اكسلات / كلتش)
  if (/فلتر جير|فلتر قير|transmission filter/.test(name)) return 'Transmission-Automatic > Filter';
  if (/آيل جير|زيت جير|زيت قير|transmission fluid|atf/.test(name)) return 'Transmission-Automatic > Transmission Fluid';
  if (/كلتش|صحن كلتش|clutch kit/.test(name)) return 'Transmission-Manual > Clutch Kit';
  if (/اكسل|أكسلات|اكسلات|عكس|عكوس|cv axle|axle shaft/.test(name)) return 'Drivetrain > CV Axle';
  if (/درايف شفت|شفت|عمود كردان|drive shaft/.test(name)) return 'Drivetrain > Drive Shaft';

  // 9. الكهرباء - Electrical (دينمة / سلف / بتري)
  if (/دينمة|دينمو|دينمو شحن|alternator|generator/.test(name)) return 'Electrical > Alternator / Generator';
  if (/سلف|ستارتر|starter motor|starter|مارش/.test(name)) return 'Electrical > Starter Motor';
  if (/بتري|بطارية|battery/.test(name)) return 'Electrical > Battery';
  if (/كمبيوتر|ecm|ecu|control module/.test(name)) return 'Electrical > Engine Control Module (ECM Computer)';
  if (/حساس سرعة|speed sensor/.test(name)) return 'Electrical > Speed Sensor';

  // 10. العادم - Exhaust (قزوز / صالنصة / دبة بيئة / كربونة)
  if (/حساس قزوز|حساس شكمان|حساس اكسجين|oxygen sensor|o2 sensor/.test(name)) return 'Exhaust & Emission > Oxygen (O2) Sensor';
  if (/حساس هواء|maf sensor|mass air flow/.test(name)) return 'Exhaust & Emission > Mass Air Flow (MAF) Sensor';
  if (/قزوز|صالنصة|دبة قزوز|دبة بيئة|كربونة|شكمان|دبة تلوث|catalytic converter|exhaust manifold/.test(name)) return 'Exhaust & Emission > Catalytic Converter';
  if (/بلف تبخير|pcv|purge valve|pcv valve/.test(name)) return 'Exhaust & Emission > Vapor Canister Purge Valve / Solenoid';

  // 11. الهيكل والإضاءة - Body & Lighting (بانيت / دبة / مدقار / دعامية / منظرة / ليتات)
  if (/بانيت|بونت|كبوت|hood|bonnet/.test(name)) return 'Body & Lamp Assembly > Hood';
  if (/دبة خلفية|دبة ورا|شنطة|trunk|boot/.test(name)) return 'Body & Lamp Assembly > Trunk';
  if (/مدقار|مدقارات|رفرف|fender|mudguard/.test(name)) return 'Body & Lamp Assembly > Fender';
  if (/دعامية|دعاميات|بمبر|صدمية|صدام|bumper|bumper cover/.test(name)) return 'Body & Lamp Assembly > Bumper Cover';
  if (/منظرة|مناظر|مراية جانبية|مراية|side mirror|mirror/.test(name)) return 'Body & Lamp Assembly > Outside Mirror Glass';
  if (/جام|جامات|زجاج|windshield|glass/.test(name)) return 'Body & Lamp Assembly > Glass';
  if (/ليت قدام|ليت أمامي|شمعة|headlamp|headlight/.test(name)) return 'Body & Lamp Assembly > Headlamp Assembly';
  if (/ليت ورا|ليت خلفي|اسطب|إسطب|tail lamp|tail light|taillight/.test(name)) return 'Body & Lamp Assembly > Tail Lamp Assembly';
  if (/كشاف|كشافات ضباب|fog lamp|fog light/.test(name)) return 'Body & Lamp Assembly > Fog / Driving Lamp Assembly';
  if (/جريل|شبك نيكل|شبك قدام|شبك|grille/.test(name)) return 'Body & Lamp Assembly > Grille';

  // 12. الإطارات والرنجات - Wheel & Tires (رنجات / تواير / براغي رنج)
  if (/رنج|رنجات|رنق|رنقات|جنط|جنوط|wheel|rim|rims/.test(name)) return 'Wheel > Wheel';
  if (/تاير|تواير|كفر|كفرات|إطار|إطارات|tire|tires/.test(name)) return 'Wheel > Wheel';
  if (/براغي رنج|نوتات رنج|صامولة جنط|مسمار جنط|lug nut|lug stud/.test(name)) return 'Wheel > Lug Nut';
  if (/حساس تواير|حساس كفرات|حساس ضغط|tpms|tpms sensor/.test(name)) return 'Wheel > Tire Pressure Monitoring System (TPMS) Sensor';

  // 13. المحرك والسيور - Engine & Belts (قايش / كراسي مكينة)
  if (/قايش|قوايش|سير|سيور|belt|drive belt|serpentine belt/.test(name)) return 'Belt Drive > Belt';
  if (/شداد قايش|بكرة|بكرات|pulley|tensioner|belt tensioner/.test(name)) return 'Belt Drive > Belt Tensioner';
  if (/كرسي مكينة|كراسي مكينة|كرسي محرك|motor mount|engine mount/.test(name)) return 'Engine > Motor Mount';
  if (/آيل مكينة|زيت مكينة|زيت محرك|فلتر آيل|فلتر زيت|oil filter|engine oil/.test(name)) return 'Engine > Oil Filter';
  if (/طرمبة آيل|طرمبة زيت|oil pump/.test(name)) return 'Engine > Oil Pump';
  if (/بستم|بساتم|شنبر|piston/.test(name)) return 'Engine > Piston';
  if (/جنزير صدر|timing chain/.test(name)) return 'Engine > Timing Chain';
  if (/قزقيت|قازقيت|وجه راس|gasket|cylinder head gasket/.test(name)) return 'Engine > Cylinder Head Gasket';

  // Fallbacks عامة
  if (/بريك|فرامل|brake/.test(rawCat)) return 'Brake & Wheel Hub > Brake Pad';
  if (/جامبين|تعليق|suspension|steering/.test(rawCat)) return 'Suspension > Shock / Strut';
  if (/مكيف|تبريد|hvac|cooling/.test(rawCat)) return 'Heat & Air Conditioning > A/C Compressor';
  if (/كهربا|electrical/.test(rawCat)) return 'Electrical > Starter Motor';
  if (/فلتر|آيل|filter|oil/.test(rawCat)) return 'Fuel & Air > Air Filter';
  if (/ليت|بدي|هيكل|lighting|body/.test(rawCat)) return 'Body & Lamp Assembly > Headlamp Assembly';
  if (/قزوز|عادم|exhaust/.test(rawCat)) return 'Exhaust & Emission > Catalytic Converter';
  if (/رنج|تاير|wheel|tire/.test(rawCat)) return 'Wheel > Wheel';

  return 'Engine > Motor Mount';
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
  { make: 'لاند روفر', patterns: [/لاند روفر|رينج روفر|land\s*rover|range\s*rover/i] },
  { make: 'أودي', patterns: [/أودي|audi/i] },
  { make: 'فولكس فاجن', patterns: [/فولكس فاجن|vw|volkswagen/i] }
];

const parseVehicleFitment = (rawText: string): { make: string; model: string; year: string } => {
  if (!rawText) return { make: 'عام / متعدد', model: 'عام', year: '2022' };

  let text = String(rawText).trim();

  // 1. استخراج سنة الصنع
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
  if (n.startsWith('---') || n.startsWith('===') || n === 'name' || n === 'اسم القطعة' || n === 'sku' || n === 'part name') return true;
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
    category: '',
    part_brand: '',
    price: '',
    stock: '',
    part_number: '',
    part_condition: '',
    warranty: '',
    engine: ''
  });

  const [defaultWarrantyOption, setDefaultWarrantyOption] = useState<string>('ask_seller');

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
            if (/اسم قطعة الغيار|طراز السيارة|رمز القطعة|سعر البيع|الكمية المتاحة|الفئة|part name|compatible car|brand|sku|unit selling price|category|available quantity/.test(cellStr)) {
              score += 5;
            }
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
      name: '', vehicle: '', category: '', part_brand: '', price: '', stock: '', part_number: '', part_condition: '', warranty: '', engine: ''
    };

    detectedHeaders.forEach(h => {
      const clean = h.trim().toLowerCase();

      if (/sku|رمز القطعة|رقم القطعة|كود القطعة|part number|part no\b|رمز/.test(clean) && !clean.includes('part name')) {
        if (!newMapping.part_number) newMapping.part_number = h;
      }
      else if (/part name|item name|اسم قطعة الغيار|اسم القطعة|اسم السلعة|اسم الغيار|بيان القطعة|description|اسم/.test(clean)) {
        if (!newMapping.name && !/رمز|رقم|sku|كود/.test(clean)) newMapping.name = h;
      }
      else if (/compatible car|car model|vehicle|fitment|طراز السيارة|طراز|السيارة المتوافقة|موديل السيارة/.test(clean)) {
        if (!newMapping.vehicle) newMapping.vehicle = h;
      }
      else if (/category|cat|الفئة|القسم|التصنيف/.test(clean)) {
        if (!newMapping.category) newMapping.category = h;
      }
      else if (/brand|manufacturer|المصنع|الماركة \/ المصنع|ماركة القطعة|الشركة المصنعة/.test(clean) && !clean.includes('car model')) {
        if (!newMapping.part_brand) newMapping.part_brand = h;
      }
      else if (/unit selling price|selling price|unit price|price|cost|سعر البيع للوحدة|سعر البيع|سعر|السعر/.test(clean)) {
        if (!newMapping.price && !/total cost|إجمالي|تكلفة/.test(clean)) newMapping.price = h;
      }
      else if (/available quantity|quantity|stock|qty|الكمية المتاحة|الكمية|المخزون|العدد/.test(clean)) {
        if (!newMapping.stock && !/total|إجمالي|حد/.test(clean)) newMapping.stock = h;
      }
      else if (/warranty|الضمان|فترة الضمان|ضمان/.test(clean)) {
        if (!newMapping.warranty) newMapping.warranty = h;
      }
      else if (/stock status|condition|حالة المخزون|حالة القطعة|الحالة/.test(clean)) {
        if (!newMapping.part_condition) newMapping.part_condition = h;
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
        const rawCat = mapping.category ? String(row[mapping.category] || '').trim() : '';
        
        const parsed = parseVehicleFitment(rawVehicle || rawName);
        const fullCategory = resolveFullCategoryTree(rawName, rawCat);
        const engine = mapping.engine ? String(row[mapping.engine] || '').trim() : extractEngineDetails(rawName);

        let finalWarranty: string | null = null;
        if (mapping.warranty && row[mapping.warranty]) {
          finalWarranty = String(row[mapping.warranty]).trim();
        } else if (defaultWarrantyOption !== 'ask_seller') {
          finalWarranty = defaultWarrantyOption;
        }

        return {
          name: rawName,
          make: parsed.make || 'عام / متعدد',
          model: parsed.model || 'عام',
          year: parsed.year || '2022',
          engine: engine || 'جميع المحركات (بنزين / ديزل)',
          category: fullCategory,
          price: cleanPriceValue(row[mapping.price]),
          stock: mapping.stock && row[mapping.stock] ? parseInt(String(row[mapping.stock]).replace(/[^0-9]/g, '')) || 1 : 1,
          part_number: mapping.part_number && row[mapping.part_number] ? String(row[mapping.part_number]).trim() : null,
          part_type: rawPartBrand || 'تجاري',
          part_condition: 'جديد',
          warranty: finalWarranty,
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
                {isRtl ? 'الرفع والمعالجة الذكية للمخزون' : 'Smart Excel Bulk Upload'}
              </h3>
              <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                {isRtl ? 'دعم كامل للهجة القطرية (سفايف، جمبينات، رنجات، مدقار...) والعربية والإنجليزية' : 'Full Qatari/Gulf dialect, Arabic & English support'}
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
              {isRtl ? 'يدعم (.xlsx, .xls, .csv) بالمصطلحات القطرية أو الفصحى أو الإنجليزية مع استخراج الأسماء والأقسام تلقائياً.' : 'Supports .xlsx, .xls, .csv files.'}
            </p>

            <label style={{ padding: '13px 32px', backgroundColor: '#1f3a5f', color: '#ffffff', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14.5px', display: 'inline-block' }}>
              <span>{isRtl ? 'تصفح الملفات 📄' : 'Browse File'}</span>
              <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>
        )}

        {step === 'map' && (
          <div>
            <div style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1.5px solid #bbf7d0', padding: '12px 18px', borderRadius: '14px', marginBottom: '16px', fontSize: '13.5px', fontWeight: 'bold' }}>
              <span>✅ {isRtl ? `تم فحص الملف: (${totalCount}) قطعة صالحة للرفع` : `Ready to upload ${totalCount} items`}</span>
              {filteredJunkCount > 0 && <span style={{ color: '#c2410c', marginRight: '8px' }}>({isRtl ? `تم استبعاد ${filteredJunkCount} صف مجاميع` : `Excluded ${filteredJunkCount} summary rows`})</span>}
            </div>

            {/* 🛡️ خيار الضمان */}
            <div style={{ backgroundColor: '#fff7ed', border: '1.5px solid #fed7aa', padding: '14px', borderRadius: '14px', marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#c2410c', marginBottom: '6px' }}>
                🛡️ {isRtl ? 'فترة ضمان القطع المرفوعة (إذا لم تكن محددة بالإكسل):' : 'Default Warranty Policy:'}
              </label>
              <select
                value={defaultWarrantyOption}
                onChange={(e) => setDefaultWarrantyOption(e.target.value)}
                style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px', fontWeight: 'bold' }}
              >
                <option value="ask_seller">❓ {isRtl ? 'بدون ضمان محدد (يسأل المشتري الكراج عند الفحص)' : 'No fixed warranty (Ask Garage upon inquiry)'}</option>
                <option value="7 أيام (ضمان تشغيل وتجربة)">⚡ 7 {isRtl ? 'أيام (ضمان تشغيل وتجربة)' : 'Days (Testing Warranty)'}</option>
                <option value="14 يوماً (ضمان استبدال)">✅ 14 {isRtl ? 'يوماً (ضمان استبدال)' : 'Days (Replacement Warranty)'}</option>
                <option value="شهر كامل (30 يوماً)">📅 {isRtl ? 'شهر كامل (30 يوماً)' : '1 Month (30 Days)'}</option>
                <option value="3 أشهر">🛡️ 3 {isRtl ? 'أشهر' : 'Months'}</option>
                <option value="6 أشهر">⭐ 6 {isRtl ? 'أشهر' : 'Months'}</option>
                <option value="سنة كاملة">🏆 {isRtl ? 'سنة كاملة' : '1 Year'}</option>
              </select>
            </div>

            {/* شبكة تعيين الأعمدة */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', maxHeight: '250px', overflowY: 'auto', paddingInlineEnd: '6px' }}>
              {[
                { key: 'name', label: isRtl ? 'اسم القطعة (مطلوب) *' : 'Part Name *', req: true },
                { key: 'price', label: isRtl ? 'سعر البيع (مطلوب) *' : 'Price *', req: true },
                { key: 'vehicle', label: isRtl ? 'طراز وتوافق السيارة' : 'Compatible Vehicle' },
                { key: 'category', label: isRtl ? 'الفئة / القسم' : 'Category' },
                { key: 'part_brand', label: isRtl ? 'الماركة / المصنع (ماركة القطعة)' : 'Part Manufacturer' },
                { key: 'part_number', label: isRtl ? 'رمز القطعة (SKU)' : 'Part Number / SKU' },
                { key: 'stock', label: isRtl ? 'الكمية المتاحة' : 'Stock Qty' }
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
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
              {isRtl ? 'جاري تصنيف وتوليد الأقسام الفرعية ورفع القطع...' : 'Processing & Uploading Parts...'}
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
              {isRtl ? `تمت إضافة ${uploadedCount} قطعة جديدة بأسمائها وأقسامها الفرعية بدقة.` : `Successfully added ${uploadedCount} parts.`}
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
