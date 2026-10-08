import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { emitCatalogRefresh } from '../utils/partsLiveQuery';

interface ExcelPartUploaderProps {
  lang: 'ar' | 'en';
  supabaseUrl: string;
  apiKey: string;
  session: any;
  onClose: () => void;
  onSuccess: () => void;
}

// 🧠 محرك التصنيف الذكي - الأولوية الأولى للإنجليزية القياسية (TecDoc / OEM / Aftermarket)
const resolveFullCategoryTree = (partName: string, rawCategory: string = ''): string => {
  const name = (partName || '').toLowerCase();
  const rawCat = (rawCategory || '').toLowerCase();

  // 1. Brake & Wheel Hub (الفرامل والدرامات والسفايف)
  if (/\b(brake pad|brake pads|brake shoe|disc pad|pad set)\b/.test(name) || /سفايف|سفيفة|فحمات|قماشات|تيل فرامل/.test(name)) 
    return 'Brake & Wheel Hub > Brake Pad';
  if (/\b(brake rotor|rotor|brake disc|disc rotor)\b/.test(name) || /درام ويل|درامات|درام|هوب|هوبات|دسك فرامل/.test(name)) 
    return 'Brake & Wheel Hub > Rotor';
  if (/\b(brake caliper|caliper assembly|caliper)\b/.test(name) || /كليبر|كاليبر/.test(name)) 
    return 'Brake & Wheel Hub > Caliper';
  if (/\b(abs module|abs sensor|wheel speed sensor|abs control)\b/.test(name) || /abs|مانع انزلاق|حساس سرعة عجل/.test(name)) 
    return 'Brake & Wheel Hub > ABS Control Module';
  if (/\b(brake fluid|dot 3|dot 4|dot 5.1)\b/.test(name) || /زيت فرامل|زيت بريك/.test(name)) 
    return 'Brake & Wheel Hub > Brake Fluid';
  if (/\b(wheel bearing|wheel hub|hub bearing|bearing & hub)\b/.test(name) || /رمان|بيرنج|bearing|فلنجة/.test(name)) 
    return 'Brake & Wheel Hub > Wheel Bearing & Hub';
  if (/\b(parking brake|handbrake shoe|emergency brake)\b/.test(name) || /هاند بريك|بريك يد|جلنط/.test(name)) 
    return 'Brake & Wheel Hub > Parking Brake Shoe';

  // 2. Suspension (المساعدات والمقصات والشيالات)
  if (/\b(shock absorber|strut|strut assembly|shocks|struts|damper)\b/.test(name) || /جامبين|جامبينات|جمبينات|كمبين|مساعد|مساعدات|شكلس/.test(name)) 
    return 'Suspension > Shock / Strut';
  if (/\b(control arm|wishbone|trailing arm|track control)\b/.test(name) || /شيال|شيالات|مقص|مقصات|ذراع تحكم/.test(name)) 
    return 'Suspension > Control Arm';
  if (/\b(coil spring|suspension spring|leaf spring)\b/.test(name) || /سبرنغ|سبرنغات|ياي|يايات|سوستة/.test(name)) 
    return 'Suspension > Coil Spring';
  if (/\b(sway bar link|stabilizer link|sway bar|anti roll bar link)\b/.test(name) || /رود توازن|رودات توازن|لينك توازن|لينكات|مسمار توازن/.test(name)) 
    return 'Suspension > Sway Bar Link';
  if (/\b(control arm bushing|bushing|bushings|suspension bushing)\b/.test(name) || /بوش|بوشات|بوشينج|جلبة|جلب/.test(name)) 
    return 'Suspension > Control Arm Bushing';

  // 3. Steering (الدركسون والدودة والستيرنج)
  if (/\b(rack and pinion|steering rack|steering gear|power steering rack)\b/.test(name) || /استيرنج راك|مجمع ستيرنج|دودة سكان|دودة دركسون|دودة/.test(name)) 
    return 'Steering > Rack and Pinion';
  if (/\b(tie rod end|tie rod|track rod end|outer tie rod|inner tie rod)\b/.test(name) || /رود سكان|رودات سكان|رود دركسون|تاي رود/.test(name)) 
    return 'Steering > Tie Rod End';

  // 4. Cooling System (التبريد والرديتر والمضخات)
  if (/\b(coolant|antifreeze|radiator fluid)\b/.test(name) || /سائل تبريد|ماي رديتر|ماء رديتر/.test(name)) 
    return 'Cooling System > Coolant / Antifreeze';
  if (/\b(water pump|engine water pump|coolant pump)\b/.test(name) || /واتر بمب|ووتر بمب|طرمبة ماي|طرمبة ماء|مضخة ماء/.test(name)) 
    return 'Cooling System > Water Pump';
  if ((/\b(radiator|engine radiator)\b/.test(name) && !name.includes('a/c') && !name.includes('ac')) || /رديتر مكينة|رديتر ماي|رديتر ماء/.test(name)) 
    return 'Cooling System > Radiator';
  if (/\b(thermostat|thermostat housing|water outlet)\b/.test(name) || /ثرموستات|كوع حرارة|بلف حرارة|بلف ماي/.test(name)) 
    return 'Cooling System > Thermostat';
  if (/\b(radiator fan|cooling fan|fan assembly)\b/.test(name) || /مروحة رديتر|مروحة/.test(name)) 
    return 'Cooling System > Radiator Fan Assembly';
  if (/\b(coolant reservoir|expansion tank|overflow tank)\b/.test(name) || /قربة ماي|قربة ماء|خرطوش/.test(name)) 
    return 'Cooling System > Coolant Reservoir';

  // 5. Heat & Air Conditioning (المكيف والكمبروسر والفلتر)
  if (/\b(a\/c condenser|ac condenser|air conditioning condenser)\b/.test(name) || /رديتر مكيف|مكثف/.test(name)) 
    return 'Heat & Air Conditioning > A/C Condenser';
  if (/\b(a\/c compressor|ac compressor|air conditioning compressor)\b/.test(name) || /كمبريسر|كمبروسر|ضاغط/.test(name)) 
    return 'Heat & Air Conditioning > A/C Compressor';
  if (/\b(a\/c evaporator|evaporator core)\b/.test(name) || /ثلاجة مكيف|ثلاجة/.test(name)) 
    return 'Heat & Air Conditioning > A/C Evaporator Core';
  if (/\b(cabin air filter|cabin filter|pollen filter|a\/c filter)\b/.test(name) || /فلتر مكيف/.test(name)) 
    return 'Heat & Air Conditioning > Cabin Air Filter';
  if (/\b(expansion valve|a\/c expansion valve)\b/.test(name) || /بلف مكيف/.test(name)) 
    return 'Heat & Air Conditioning > A/C Expansion Valve';

  // 6. Ignition (البواجي والبلاكات والكويلات)
  if (/\b(spark plug|spark plugs|glow plug|glow plugs)\b/.test(name) || /بلاك|بلاكات|بلكات|بواجي|شمعات احتراق/.test(name)) 
    return 'Ignition > Spark Plug';
  if (/\b(ignition coil|ignition coils|coil pack)\b/.test(name) || /كويل|كويلات|ملف اشعال/.test(name)) 
    return 'Ignition > Ignition Coil';

  // 7. Fuel & Air (فلاتر الهواء والبترول والفيول بمب)
  if (/\b(air filter|engine air filter|air cleaner element)\b/.test(name) || /فلتر هواء|فلتر مكينة/.test(name)) 
    return 'Fuel & Air > Air Filter';
  if (/\b(fuel pump|fuel pump module|fuel pump assembly)\b/.test(name) || /فيول بمب|بمب بترول|طرمبة بترول|طرمبة بنزين|مضخة وقود/.test(name)) 
    return 'Fuel & Air > Fuel Pump & Housing Assembly';
  if (/\b(fuel injector|fuel injectors|injector nozzle)\b/.test(name) || /بخاخ|بخاخات|نوزل/.test(name)) 
    return 'Fuel & Air > Fuel Injector';
  if (/\b(fuel filter|fuel line|fuel hose)\b/.test(name) || /فلتر بترول|فلتر بنزين|هوز بترول/.test(name)) 
    return 'Fuel & Air > Fuel Line / Hose';
  if (/\b(throttle body|throttle actuator)\b/.test(name) || /ثروتل|بوابة هواء/.test(name)) 
    return 'Fuel & Air > Throttle Body';

  // 8. Transmission & Drivetrain (القير والاكسلات والشفتات)
  if (/\b(transmission filter|trans filter|atf filter)\b/.test(name) || /فلتر جير|فلتر قير/.test(name)) 
    return 'Transmission-Automatic > Filter';
  if (/\b(transmission fluid|atf|gear oil|cvt fluid)\b/.test(name) || /آيل جير|زيت جير|زيت قير/.test(name)) 
    return 'Transmission-Automatic > Transmission Fluid';
  if (/\b(clutch kit|clutch disc|pressure plate)\b/.test(name) || /كلتش|صحن كلتش/.test(name)) 
    return 'Transmission-Manual > Clutch Kit';
  if (/\b(cv axle|axle shaft|drive axle|half shaft)\b/.test(name) || /اكسل|أكسلات|اكسلات|عكس|عكوس/.test(name)) 
    return 'Drivetrain > CV Axle';
  if (/\b(drive shaft|driveshaft|propeller shaft)\b/.test(name) || /درايف شفت|شفت|عمود كردان/.test(name)) 
    return 'Drivetrain > Drive Shaft';

  // 9. Electrical (الدينامو والسلف والبطارية)
  if (/\b(alternator|generator)\b/.test(name) || /دينمة|دينمو|دينمو شحن/.test(name)) 
    return 'Electrical > Alternator / Generator';
  if (/\b(starter motor|starter)\b/.test(name) || /سلف|ستارتر|مارش/.test(name)) 
    return 'Electrical > Starter Motor';
  if (/\b(car battery|12v battery|battery)\b/.test(name) || /بتري|بطارية/.test(name)) 
    return 'Electrical > Battery';
  if (/\b(ecm|ecu|pcm|engine control module)\b/.test(name) || /كمبيوتر مكينة|كمبيوتر/.test(name)) 
    return 'Electrical > Engine Control Module (ECM Computer)';

  // 10. Exhaust & Emission (العادم وحساسات الأكسجين)
  if (/\b(oxygen sensor|o2 sensor|lambda sensor)\b/.test(name) || /حساس قزوز|حساس شكمان|حساس اكسجين/.test(name)) 
    return 'Exhaust & Emission > Oxygen (O2) Sensor';
  if (/\b(mass air flow|maf sensor|air flow meter)\b/.test(name) || /حساس هواء|maf/.test(name)) 
    return 'Exhaust & Emission > Mass Air Flow (MAF) Sensor';
  if (/\b(catalytic converter|exhaust manifold|muffler)\b/.test(name) || /قزوز|صالنصة|دبة بيئة|كربونة|شكمان/.test(name)) 
    return 'Exhaust & Emission > Catalytic Converter';

  // 11. Body & Lamp (البدي والإضاءة والصدامات)
  if (/\b(hood|bonnet)\b/.test(name) || /بانيت|بونت|كبوت/.test(name)) 
    return 'Body & Lamp Assembly > Hood';
  if (/\b(fender|mudguard|wing)\b/.test(name) || /مدقار|مدقارات|رفرف/.test(name)) 
    return 'Body & Lamp Assembly > Fender';
  if (/\b(bumper cover|front bumper|rear bumper|bumper)\b/.test(name) || /دعامية|دعاميات|بمبر|صدام/.test(name)) 
    return 'Body & Lamp Assembly > Bumper Cover';
  if (/\b(side mirror|door mirror|outside mirror)\b/.test(name) || /منظرة|مناظر|مراية جانبية|مراية/.test(name)) 
    return 'Body & Lamp Assembly > Outside Mirror Glass';
  if (/\b(headlamp|headlight|front lamp)\b/.test(name) || /ليت قدام|ليت أمامي|شمعة/.test(name)) 
    return 'Body & Lamp Assembly > Headlamp Assembly';
  if (/\b(tail lamp|taillight|tail light|rear lamp)\b/.test(name) || /ليت ورا|ليت خلفي|اسطب/.test(name)) 
    return 'Body & Lamp Assembly > Tail Lamp Assembly';
  if (/\b(fog lamp|fog light)\b/.test(name) || /كشاف|كشافات ضباب/.test(name)) 
    return 'Body & Lamp Assembly > Fog / Driving Lamp Assembly';
  if (/\b(grille|front grille)\b/.test(name) || /جريل|شبك/.test(name)) 
    return 'Body & Lamp Assembly > Grille';

  // 12. Wheel (الرنجات وبراغي العجلات)
  if (/\b(wheel|alloy rim|wheel rim|lug nut|lug stud)\b/.test(name) || /رنج|رنجات|جنط|براغي رنج/.test(name)) 
    return 'Wheel > Wheel';
  if (/\b(tpms|tire pressure sensor)\b/.test(name) || /حساس تواير|حساس ضغط/.test(name)) 
    return 'Wheel > Tire Pressure Monitoring System (TPMS) Sensor';

  // 13. Belt Drive & Engine Parts (السيور وكراسي المكينة وفلاتر الزيت)
  if (/\b(serpentine belt|drive belt|fan belt|v-belt)\b/.test(name) || /قايش|سير|سيور/.test(name)) 
    return 'Belt Drive > Belt';
  if (/\b(belt tensioner|tensioner pulley|idler pulley)\b/.test(name) || /شداد قايش|بكرة/.test(name)) 
    return 'Belt Drive > Belt Tensioner';
  if (/\b(engine mount|motor mount)\b/.test(name) || /كرسي مكينة|كرسي محرك/.test(name)) 
    return 'Engine > Motor Mount';
  if (/\b(oil filter|engine oil filter)\b/.test(name) || /فلتر آيل|فلتر زيت/.test(name)) 
    return 'Engine > Oil Filter';
  if (/\b(cylinder head gasket|head gasket)\b/.test(name) || /قزقيت|وجه راس/.test(name)) 
    return 'Engine > Cylinder Head Gasket';

  // Fallbacks عامة بحسب العمود rawCategory لو وجد
  if (/brake|wheel/.test(rawCat)) return 'Brake & Wheel Hub > Brake Pad';
  if (/suspension|strut|shock/.test(rawCat)) return 'Suspension > Shock / Strut';
  if (/steering/.test(rawCat)) return 'Steering > Rack and Pinion';
  if (/cooling|water/.test(rawCat)) return 'Cooling System > Radiator';
  if (/hvac|a\/c|air condition/.test(rawCat)) return 'Heat & Air Conditioning > A/C Compressor';
  if (/electrical|ignition/.test(rawCat)) return 'Electrical > Starter Motor';
  if (/fuel|intake|air filter/.test(rawCat)) return 'Fuel & Air > Air Filter';
  if (/body|lamp|light/.test(rawCat)) return 'Body & Lamp Assembly > Headlamp Assembly';
  if (/engine|belt/.test(rawCat)) return 'Engine > Oil Filter';

  return 'Engine > Motor Mount';
};

// 🚗 التعرف على الماركات العالمية وتوحيدها بالاسم الإنجليزي القياسي
const KNOWN_MAKES = [
  { make: 'Toyota', patterns: [/\btoyota\b/i, /تويوتا|تويتا/] },
  { make: 'Lexus', patterns: [/\blexus\b/i, /لكزس/] },
  { make: 'Nissan', patterns: [/\bnissan\b/i, /نيسان/] },
  { make: 'Hyundai', patterns: [/\bhyundai\b/i, /هيونداي|هونداي/] },
  { make: 'Kia', patterns: [/\bkia\b/i, /كيا/] },
  { make: 'Mercedes-Benz', patterns: [/\b(mercedes|benz|mb)\b/i, /مرسيدس/] },
  { make: 'BMW', patterns: [/\bbmw\b/i, /بي إم دبليو|بي ام دبليو/] },
  { make: 'Ford', patterns: [/\bford\b/i, /فورد/] },
  { make: 'Chevrolet', patterns: [/\b(chevrolet|chevy)\b/i, /شفروليه|شيفروليه/] },
  { make: 'GMC', patterns: [/\bgmc\b/i, /جي إم سي|جمس/] },
  { make: 'Honda', patterns: [/\bhonda\b/i, /هوندا/] },
  { make: 'Mazda', patterns: [/\bmazda\b/i, /مازدا/] },
  { make: 'Mitsubishi', patterns: [/\bmitsubishi\b/i, /ميتسوبيشي/] },
  { make: 'Land Rover', patterns: [/\b(land\s*rover|range\s*rover)\b/i, /لاند روفر|رينج روفر/] },
  { make: 'Audi', patterns: [/\baudi\b/i, /أودي/] },
  { make: 'Volkswagen', patterns: [/\b(volkswagen|vw)\b/i, /فولكس فاجن/] },
  { make: 'Porsche', patterns: [/\bporsche\b/i, /بورش|بورشه/] }
];

const parseVehicleFitment = (rawText: string): { make: string; model: string; year: string } => {
  if (!rawText) return { make: 'Universal', model: 'All Models', year: '2023' };

  let text = String(rawText).trim();

  // 1. استخراج سنة الصنع (سواء 2018-2022 أو 18-22 أو سنة مفردة)
  let extractedYear = '2023';
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

  // 2. استخراج الماركة والموديل
  let detectedMake = 'Universal';
  let detectedModel = text;

  for (const item of KNOWN_MAKES) {
    for (const pattern of item.patterns) {
      if (pattern.test(text)) {
        detectedMake = item.make;
        detectedModel = text.replace(pattern, '').replace(/[-/:()]/g, '').trim();
        break;
      }
    }
    if (detectedMake !== 'Universal') break;
  }

  return {
    make: detectedMake,
    model: detectedModel || 'All Models',
    year: extractedYear
  };
};

const extractEngineDetails = (text: string): string => {
  const t = (text || '').toLowerCase();
  if (/diesel|ديزل/.test(t)) {
    const dMatch = t.match(/(\d+\.\d+)\s*(l|liter)?\s*diesel/i);
    return dMatch ? `${dMatch[1]}L Diesel` : 'Diesel';
  }
  if (/hybrid|هايبرد/.test(t)) return 'Hybrid';
  if (/turbo|تيربو/.test(t)) {
    const tMatch = t.match(/(\d+\.\d+)\s*(l|liter)?\s*turbo/i);
    return tMatch ? `${tMatch[1]}L Turbo` : 'Turbo';
  }

  const lMatch = t.match(/\b(\d\.\d)\s*(l|liter)?\b/i);
  const vMatch = t.match(/\b(v6|v8|v4|v12|l4|inline-4|inline-6)\b/i);

  if (lMatch && vMatch) return `${lMatch[1]}L ${vMatch[1].toUpperCase()}`;
  if (lMatch) return `${lMatch[1]}L`;
  if (vMatch) return vMatch[1].toUpperCase();

  return 'All Engines (Gasoline / Diesel)';
};

const isSummaryOrJunkRow = (name: string, price: any): boolean => {
  const n = String(name || '').trim().toLowerCase();
  if (!n || n === 'nan' || n === 'null') return true;
  if (/total|grand total|sum|subtotal|summary|إجمالي|اجمالي|المجموع/.test(n)) return true;
  if (n.startsWith('---') || n.startsWith('===') || n === 'name' || n === 'item description' || n === 'part name' || n === 'sku') return true;
  if (price === 0 && (/total|sum|مجموع/.test(n))) return true;
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
          setErrorMsg(isRtl ? 'الملف المرفوع فارغ تماماً.' : 'Uploaded file is completely empty.');
          return;
        }

        // كشف صف العناوين (Header Row) مع إعطاء الأولوية القصوى للمصطلحات الإنجليزية
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

            // مصطلحات فهارس الإكسل الإنجليزية
            if (/part name|item name|description|item description|part number|part no|part #|sku|oem|unit price|selling price|price|qty|quantity|stock|category|vehicle|fitment|model|make|brand|mfr/.test(cellStr)) {
              score += 10;
            } else if (/اسم قطعة الغيار|طراز السيارة|رمز القطعة|سعر البيع|الكمية المتاحة|الفئة/.test(cellStr)) {
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
          .map((h: any, idx: number) => String(h || '').trim() || `Col_${idx + 1}`)
          .filter((h: string) => !h.startsWith('EMPTY_') && h.trim() !== '');

        const dataRows = rawGrid.slice(bestHeaderRowIndex + 1);
        const structuredData: any[] = [];
        let ignoredJunk = 0;

        dataRows.forEach(row => {
          const rowObj: Record<string, any> = {};
          let hasContent = false;

          rawHeaderRow.forEach((h: any, idx: number) => {
            const colName = String(h || '').trim() || `Col_${idx + 1}`;
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
          setErrorMsg(isRtl ? 'لم يتم العثور على صفوف بيانات صالحة في الملف.' : 'No valid item rows found.');
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

  // 🎯 ربط الأعمدة الذكي - الأولوية الأولى للغة الإنجليزية
  const autoDetectMapping = (detectedHeaders: string[]) => {
    const newMapping: Record<string, string> = {
      name: '', vehicle: '', category: '', part_brand: '', price: '', stock: '', part_number: '', part_condition: '', warranty: '', engine: ''
    };

    detectedHeaders.forEach(h => {
      const clean = h.trim().toLowerCase();

      // Part Number / SKU / OEM
      if (/^(part\s*#|part\s*no|part\s*number|sku|item\s*code|oem|oem\s*no|code)$/.test(clean) || (/sku|part no|part number|رمز القطعة|رقم القطعة|كود/.test(clean) && !clean.includes('name'))) {
        if (!newMapping.part_number) newMapping.part_number = h;
      }
      // Part Name / Description
      else if (/^(part\s*name|item\s*name|description|item\s*description|product\s*name|title)$/.test(clean) || /part name|item name|description|اسم القطعة|اسم السلعة|بيان القطعة/.test(clean)) {
        if (!newMapping.name && !/sku|code|number|رقم|كود/.test(clean)) newMapping.name = h;
      }
      // Vehicle / Application / Fitment
      else if (/^(vehicle|fitment|application|car\s*model|compatible\s*car|model)$/.test(clean) || /compatible car|car model|vehicle|fitment|طراز السيارة|السيارة المتوافقة/.test(clean)) {
        if (!newMapping.vehicle) newMapping.vehicle = h;
      }
      // Category / Group
      else if (/^(category|group|subgroup|dept|department)$/.test(clean) || /category|cat|الفئة|القسم|التصنيف/.test(clean)) {
        if (!newMapping.category) newMapping.category = h;
      }
      // Brand / Manufacturer
      else if (/^(brand|manufacturer|mfr|make)$/.test(clean) || /brand|manufacturer|mfr|المصنع|الماركة/.test(clean)) {
        if (!newMapping.part_brand) newMapping.part_brand = h;
      }
      // Selling Price / Unit Price
      else if (/^(unit\s*price|selling\s*price|price|retail\s*price|msrp|cost)$/.test(clean) || /unit price|selling price|price|cost|سعر البيع|السعر/.test(clean)) {
        if (!newMapping.price && !/total|إجمالي/.test(clean)) newMapping.price = h;
      }
      // Stock / Quantity
      else if (/^(qty|quantity|stock|available\s*qty|inventory|count)$/.test(clean) || /quantity|stock|qty|الكمية|المخزون/.test(clean)) {
        if (!newMapping.stock && !/total|إجمالي/.test(clean)) newMapping.stock = h;
      }
      // Warranty
      else if (/^(warranty|guarantee)$/.test(clean) || /warranty|الضمان/.test(clean)) {
        if (!newMapping.warranty) newMapping.warranty = h;
      }
      // Condition
      else if (/^(condition|status)$/.test(clean) || /condition|حالة القطعة/.test(clean)) {
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
      setErrorMsg(isRtl ? 'يرجى ربط حقلي "اسم القطعة" و "السعر" على الأقل.' : 'Please map at least Part Name and Price fields.');
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
        const rawName = String(row[mapping.name] || 'Auto Spare Part').trim();
        const rawVehicle = mapping.vehicle ? String(row[mapping.vehicle] || '').trim() : '';
        const rawPartBrand = mapping.part_brand ? String(row[mapping.part_brand] || '').trim() : 'Aftermarket';
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
          make: parsed.make || 'Universal',
          model: parsed.model || 'All Models',
          year: parsed.year || '2023',
          engine: engine || 'All Engines (Gasoline / Diesel)',
          category: fullCategory,
          price: cleanPriceValue(row[mapping.price]),
          stock: mapping.stock && row[mapping.stock] ? parseInt(String(row[mapping.stock]).replace(/[^0-9]/g, '')) || 1 : 1,
          part_number: mapping.part_number && row[mapping.part_number] ? String(row[mapping.part_number]).trim() : null,
          part_type: rawPartBrand || 'Aftermarket',
          part_condition: 'New',
          warranty: finalWarranty,
          user_id: session?.user?.id || session?.id || session?.phone || 'garage',
          is_active: true,
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
    emitCatalogRefresh('excel-upload');
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
                {isRtl ? 'الرفع والمعالجة الذكية للمخزون (English-First Catalog)' : 'Smart Excel Bulk Upload (English Catalog Priority)'}
              </h3>
              <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                {isRtl ? 'متوافق بالكامل مع فهارس الوكالات باللغة الإنجليزية وقوائم الورش الخليجية' : 'Full OEM, TecDoc English catalogs & local Arabic dialect support'}
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
              {isRtl ? 'يدعم (.xlsx, .xls, .csv) بفهارس الموردين باللغة الإنجليزية مع استخراج الأسماء والأقسام تلقائياً.' : 'Supports .xlsx, .xls, .csv files with auto-detection of OEM & aftermarket parts.'}
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
                <option value="7 Days Testing Warranty">⚡ 7 {isRtl ? 'أيام (ضمان تشغيل وتجربة)' : 'Days (Testing Warranty)'}</option>
                <option value="14 Days Replacement">✅ 14 {isRtl ? 'يوماً (ضمان استبدال)' : 'Days (Replacement Warranty)'}</option>
                <option value="1 Month">📅 {isRtl ? 'شهر كامل (30 يوماً)' : '1 Month (30 Days)'}</option>
                <option value="3 Months">🛡️ 3 {isRtl ? 'أشهر' : 'Months'}</option>
                <option value="6 Months">⭐ 6 {isRtl ? 'أشهر' : 'Months'}</option>
                <option value="1 Year Full Warranty">🏆 {isRtl ? 'سنة كاملة' : '1 Year'}</option>
              </select>
            </div>

            {/* شبكة تعيين الأعمدة */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', maxHeight: '250px', overflowY: 'auto', paddingInlineEnd: '6px' }}>
              {[
                { key: 'name', label: isRtl ? 'اسم القطعة (Part Name) *' : 'Part Name *', req: true },
                { key: 'price', label: isRtl ? 'سعر البيع (Unit Price) *' : 'Price *', req: true },
                { key: 'vehicle', label: isRtl ? 'طراز وتوافق السيارة (Fitment)' : 'Compatible Vehicle' },
                { key: 'category', label: isRtl ? 'الفئة / القسم (Category)' : 'Category' },
                { key: 'part_brand', label: isRtl ? 'المصنع / الماركة (Brand)' : 'Part Manufacturer' },
                { key: 'part_number', label: isRtl ? 'رمز القطعة (Part # / SKU)' : 'Part Number / SKU' },
                { key: 'stock', label: isRtl ? 'الكمية المتاحة (Qty In Stock)' : 'Stock Qty' }
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