// src/utils/vinMatcher.ts

export interface VehicleProfile {
  vin?: string;
  make: string;
  model: string;
  year: string;
  engine?: string;
}

// 🧠 مطابقة وتوحيد أسماء السيارات (عربي / إنجليزي)
export const normalizeVehicleText = (str: string): string => {
  return (str || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\u0621-\u064A0-9]/g, '');
};

// 🚗 قاموس المرادفات والموديلات المتوافقة
const MODEL_ALIASES: Record<string, string[]> = {
  'landcruiser': ['landcruiser', 'land cruiser', 'لاندكروزر', 'لاند كروزر', 'lc', 'lc200', 'lc300', 'v8', 'gxr', 'vxr'],
  'patrol': ['patrol', 'باترول', 'فتك', 'safari', 'nismo', 'y61', 'y62'],
  'camry': ['camry', 'كامري', 'كامري هايبرد'],
  'corolla': ['corolla', 'كورولا', 'كرولا'],
  'hilux': ['hilux', 'هايلوكس', 'هايلكس'],
  'elantra': ['elantra', 'النترا', 'إلنترا', 'avante'],
  'sonata': ['sonata', 'سوناتا'],
  'tahoe': ['tahoe', 'تاهو'],
  'yukon': ['yukon', 'يوكن', 'يوكون'],
  'prado': ['prado', 'برادو', 'لاندكروزر برادو']
};

export const isModelMatched = (dbModel: string, targetModel: string): boolean => {
  if (!dbModel || !targetModel) return true;
  const d = normalizeVehicleText(dbModel);
  const t = normalizeVehicleText(targetModel);

  if (d === t || d.includes(t) || t.includes(d)) return true;

  for (const key of Object.keys(MODEL_ALIASES)) {
    const list = MODEL_ALIASES[key].map(normalizeVehicleText);
    if (list.some(alias => t.includes(alias)) && list.some(alias => d.includes(alias))) {
      return true;
    }
  }
  return false;
};

// 📅 فحص مدى السنوات (مثال: 2018-2023 أو 2020)
export const isYearMatched = (dbYear: string | number, targetYear: string | number): boolean => {
  if (!dbYear || !targetYear) return true;
  const dbStr = String(dbYear).trim();
  const target = Number(targetYear);

  if (isNaN(target)) return true;

  if (dbStr.includes('-')) {
    const [start, end] = dbStr.split('-').map(y => Number(y.trim()));
    if (!isNaN(start) && !isNaN(end)) {
      return target >= Math.min(start, end) && target <= Math.max(start, end);
    }
  }
  return dbStr === String(targetYear) || dbStr.includes(String(targetYear));
};

/**
 * 🎯 محرك المطابقة الشامل (يدعم المطابقة التقليدية ومطابقة الإكسل برقم الشاصي)
 */
export const isPartExactFit = (part: any, vehicle: VehicleProfile): boolean => {
  if (!vehicle || (!vehicle.make && !vehicle.vin)) return true;

  // 1️⃣ [نظام الإكسل المستقبلي]: فحص عمود أرقام الشواصي المتوافقة (compatible_vins / vin_codes)
  const excelVins = part.compatible_vins || part.vin_numbers || part.vins || part.chassis_code;
  if (excelVins && vehicle.vin) {
    const cleanVin = vehicle.vin.toUpperCase().trim();
    const vinList = String(excelVins)
      .toUpperCase()
      .split(/[,;\s\n/]+/)
      .map(v => v.trim())
      .filter(Boolean);

    // مطابقة برقم الشاصي الكامل (17 حرف) أو بكود هيكل الشاصي (WMI/VDS أول 8-11 حرف)
    const hasVinMatch = vinList.some(v => cleanVin === v || cleanVin.startsWith(v) || v.startsWith(cleanVin.substring(0, 8)));
    if (hasVinMatch) return true;
  }

  // 2️⃣ مطابقة الشركة الصانعة (Make)
  const partMake = normalizeVehicleText(part.make || '');
  const vehicleMake = normalizeVehicleText(vehicle.make || '');
  const makeMatch = !partMake || !vehicleMake || partMake.includes(vehicleMake) || vehicleMake.includes(partMake);

  if (!makeMatch) return false;

  // 3️⃣ مطابقة الموديل (Model)
  const modelMatch = isModelMatched(part.model || '', vehicle.model || '');
  if (!modelMatch) return false;

  // 4️⃣ مطابقة سنة الصنع (Year)
  const yearMatch = isYearMatched(part.year || '', vehicle.year || '');
  if (!yearMatch) return false;

  // 5️⃣ مطابقة سعة المحرك (Engine) إذا توفرت
  if (vehicle.engine && part.engine && !part.engine.includes('All') && !part.engine.includes('جميع')) {
    const pEng = normalizeVehicleText(part.engine);
    const vEng = normalizeVehicleText(vehicle.engine);
    if (!pEng.includes(vEng) && !vEng.includes(pEng)) {
      return false;
    }
  }

  return true;
};
