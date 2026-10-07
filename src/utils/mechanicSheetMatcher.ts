import { API_KEY, SUPABASE_URL } from '../config/supabase';

export interface OcrSheetItem {
  id: string;
  nameEn: string;
  nameAr: string;
  rawLine: string;
  qty: number;
  unitPrice: number | null;
  searchTerms: string[];
}

export interface CatalogPartRow {
  id: number | string;
  name: string;
  make?: string;
  model?: string;
  year?: string;
  price?: number;
  stock?: number;
  part_number?: string;
  part_type?: string;
  part_condition?: string;
  warranty?: string;
  image_url?: string;
  category?: string;
}

export interface MatchedQualityOption {
  available: boolean;
  price: number;
  partNumber?: string;
  warranty?: string;
  catalogId?: string;
  catalogName?: string;
  stock: number;
  partType?: string;
}

export interface MatchedSheetPart {
  id: string;
  nameAr: string;
  nameEn: string;
  rawLine: string;
  qty: number;
  category: string;
  available: boolean;
  original: MatchedQualityOption;
  aftermarket: MatchedQualityOption;
  selectedType: 'original' | 'aftermarket' | null;
}

export interface MechanicSheetScanResult {
  success: boolean;
  error?: string;
  parts: MatchedSheetPart[];
  unrecognized: string[];
  exclusions: string[];
  notes?: string;
}

const STOP = new Set([
  'the', 'and', 'for', 'with', 'kit', 'set', 'part', 'parts', 'auto', 'car',
  'من', 'على', 'في', 'الى', 'إلى', 'قطع', 'قطعة', 'طقم',
]);

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(s: string): string[] {
  return normalize(s)
    .split(' ')
    .filter((t) => t.length > 1 && !STOP.has(t));
}

function yearMatches(partYear: string, targetYear: string): boolean {
  if (!partYear || !targetYear) return true;
  const y = String(targetYear).trim();
  const py = String(partYear).trim();
  if (py.includes(y)) return true;
  if (py.includes('-')) {
    const [a, b] = py.split('-').map(Number);
    const t = Number(y);
    if (!Number.isNaN(a) && !Number.isNaN(b) && !Number.isNaN(t)) {
      return t >= Math.min(a, b) && t <= Math.max(a, b);
    }
  }
  return py === y;
}

const MODEL_ALIASES: Record<string, string[]> = {
  باترول: ['patrol', 'باترول', 'فتك'],
  كامري: ['camry', 'كامري'],
  كورولا: ['corolla', 'كورولا'],
  لاندكروزر: ['land cruiser', 'landcruiser', 'لاندكروزر', 'لاند كروزر'],
  النترا: ['elantra', 'النترا', 'إلنترا'],
  سوناتا: ['sonata', 'سوناتا'],
  اوبتيما: ['optima', 'k5', 'أوبتيما', 'اوبتيما'],
  تورس: ['taurus', 'تورس', 'توروس'],
  تاهو: ['tahoe', 'تاهو'],
  التيما: ['altima', 'التيما', 'ألتيما'],
  اكورد: ['accord', 'اكورد', 'أكورد'],
  '6': ['6', 'مازدا 6', 'mazda 6'],
};

function modelMatches(partModel: string, targetModel: string): boolean {
  if (!partModel || !targetModel) return true;
  const a = normalize(partModel);
  const b = normalize(targetModel);
  if (a.includes(b) || b.includes(a)) return true;
  for (const list of Object.values(MODEL_ALIASES)) {
    if (list.some((x) => b.includes(normalize(x))) && list.some((x) => a.includes(normalize(x)))) {
      return true;
    }
  }
  return false;
}

function isOemType(partType?: string, partCondition?: string): boolean {
  const blob = `${partType || ''} ${partCondition || ''}`.toLowerCase();
  return /genuine|oem|original|أصلي|وكالة|وكالة/.test(blob);
}

function scorePart(part: CatalogPartRow, item: OcrSheetItem): number {
  const hay = normalize(
    [part.name, part.category, part.part_number, part.part_type]
      .filter(Boolean)
      .join(' '),
  );
  const needle = tokens(
    [item.nameEn, item.nameAr, item.rawLine, ...(item.searchTerms || [])].join(' '),
  );
  if (!needle.length) return 0;
  let hits = 0;
  for (const t of needle) {
    if (hay.includes(t)) hits += 1;
  }
  // Prefer multi-token hits
  return hits / needle.length + (hits >= 2 ? 0.15 : 0);
}

function toOption(
  part: CatalogPartRow | null,
  fallbackPrice: number | null,
): MatchedQualityOption {
  if (!part) {
    return {
      available: false,
      price: fallbackPrice ?? 0,
      stock: 0,
    };
  }
  const stock = Number(part.stock ?? 0);
  const price = Number(part.price ?? 0);
  return {
    available: stock > 0,
    price: price > 0 ? price : fallbackPrice ?? 0,
    partNumber: part.part_number || undefined,
    warranty: part.warranty || undefined,
    catalogId: String(part.id),
    catalogName: part.name,
    stock,
    partType: part.part_type || undefined,
  };
}

export async function fetchVehicleParts(
  make: string,
  model: string,
  year: string,
  makeEn?: string,
): Promise<CatalogPartRow[]> {
  const makes = Array.from(
    new Set([make, makeEn, makeEn?.toLowerCase()].filter(Boolean) as string[]),
  );
  const orMake = makes
    .map((m) => `make.ilike.*${encodeURIComponent(m)}*`)
    .join(',');

  const url = `${SUPABASE_URL}/parts?or=(${orMake})&select=id,name,make,model,year,price,stock,part_number,part_type,part_condition,warranty,image_url,category&limit=800`;
  const res = await fetch(url, {
    headers: {
      apikey: API_KEY,
      Authorization: `Bearer ${API_KEY}`,
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data)) return [];

  return data.filter((p: CatalogPartRow) => {
    const okModel = modelMatches(p.model || '', model);
    const okYear = yearMatches(p.year || '', year);
    return okModel && okYear;
  });
}

export function matchItemsToInventory(
  items: OcrSheetItem[],
  catalog: CatalogPartRow[],
): MatchedSheetPart[] {
  return items.map((item) => {
    const ranked = catalog
      .map((p) => ({ p, score: scorePart(p, item) }))
      .filter((x) => x.score >= 0.28)
      .sort((a, b) => b.score - a.score);

    const oemCandidates = ranked.filter((x) => isOemType(x.p.part_type, x.p.part_condition));
    const afterCandidates = ranked.filter((x) => !isOemType(x.p.part_type, x.p.part_condition));

    let oem = oemCandidates[0]?.p ?? null;
    let after = afterCandidates[0]?.p ?? null;

    // If only one quality found, keep it in its bucket; don't fake the other.
    if (!oem && !after && ranked[0]) {
      const top = ranked[0].p;
      if (isOemType(top.part_type, top.part_condition)) oem = top;
      else after = top;
    }

    const original = toOption(oem, item.unitPrice);
    const aftermarket = toOption(after, item.unitPrice);
    const available = original.available || aftermarket.available;

    let selectedType: 'original' | 'aftermarket' | null = null;
    if (original.available) selectedType = 'original';
    else if (aftermarket.available) selectedType = 'aftermarket';

    return {
      id: item.id,
      nameAr: item.nameAr,
      nameEn: (oem || after)?.name || item.nameEn,
      rawLine: item.rawLine,
      qty: item.qty,
      category: (oem || after)?.category || 'mechanic_sheet',
      available,
      original,
      aftermarket,
      selectedType,
    };
  });
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
  });
}

export async function scanMechanicSheet(params: {
  file: File;
  make: string;
  model: string;
  year: string;
  makeEn?: string;
}): Promise<MechanicSheetScanResult> {
  try {
    const base64Data = await fileToBase64(params.file);
    const mimeType = params.file.type || 'image/jpeg';
    const payload = JSON.stringify({ imageBase64: base64Data, mimeType });

    const supabaseFn =
      'https://shszpcjmhkemqwborfwy.supabase.co/functions/v1/scan-mechanic-sheet';

    let parsed: any = null;
    let responseOk = false;

    // 1) Prefer Supabase Edge Function (CORS-ready for localhost / Flutter web)
    try {
      const edgeRes = await fetch(supabaseFn, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: API_KEY,
          Authorization: `Bearer ${API_KEY}`,
        },
        body: payload,
      });
      parsed = await edgeRes.json();
      responseOk = edgeRes.ok;
    } catch (_) {}

    // 2) Fallback: same-origin Vercel API
    if (!responseOk) {
      try {
        const response = await fetch('/api/scan-mechanic-sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
        });
        parsed = await response.json();
        responseOk = response.ok;
      } catch (_) {}
    }

    if (!responseOk || !parsed) {
      return {
        success: false,
        error: parsed?.error || 'AI scan error',
        parts: [],
        unrecognized: [],
        exclusions: [],
      };
    }

    const items: OcrSheetItem[] = Array.isArray(parsed.items) ? parsed.items : [];
    const exclusions: string[] = Array.isArray(parsed.exclusions) ? parsed.exclusions : [];
    const unrecognized: string[] = Array.isArray(parsed.unrecognized)
      ? parsed.unrecognized
      : [];

    if (items.length === 0) {
      return {
        success: false,
        error: 'No parts detected on sheet',
        parts: [],
        unrecognized,
        exclusions,
        notes: parsed.notes,
      };
    }

    const catalog = await fetchVehicleParts(
      params.make,
      params.model,
      params.year,
      params.makeEn,
    );
    const parts = matchItemsToInventory(items, catalog);

    // Surface unmatched / OOS clearly in unrecognized banner
    const unavailableNotes = parts
      .filter((p) => !p.available)
      .map((p) => `${p.nameAr} — غير متوفرة`);

    return {
      success: true,
      parts,
      unrecognized: [...unrecognized, ...unavailableNotes],
      exclusions,
      notes: parsed.notes,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Server connection error',
      parts: [],
      unrecognized: [],
      exclusions: [],
    };
  }
}
