/**
 * Live on-demand parts catalog queries (no stale client cache).
 * Uses Supabase RPC `search_parts_catalog` with limit/offset pagination.
 */
import { API_KEY, SUPABASE_URL } from '../config/supabase';
import { CAR_DATA } from '../data/carData';

export const PARTS_PAGE_SIZE = 20;
export const CATALOG_REFRESH_EVENT = 'mawjood:catalog-refresh';

export type PartsSearchParams = {
  make: string;
  makeEn?: string;
  model?: string;
  year?: string;
  mainCategory?: string;
  subCategory?: string;
  offset?: number;
  limit?: number;
};

export type PartsSearchResult = {
  items: any[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
};

const restBase = SUPABASE_URL.replace(/\/$/, '');

function authHeaders(): HeadersInit {
  return {
    apikey: API_KEY,
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  };
}

export function resolveMakeEn(make: string): string {
  return CAR_DATA[make]?.en || make;
}

export function resolveMakeAr(make: string): string {
  return CAR_DATA[make]?.ar || make;
}

/** Broadcast after Excel upload / garage mutations so shop + tree refetch. */
export function emitCatalogRefresh(reason = 'manual') {
  try {
    window.dispatchEvent(
      new CustomEvent(CATALOG_REFRESH_EVENT, { detail: { reason, at: Date.now() } })
    );
  } catch (_) {}
}

export async function searchPartsCatalog(
  params: PartsSearchParams
): Promise<PartsSearchResult> {
  const make = params.make || '';
  const makeEn = params.makeEn || resolveMakeEn(make);
  const limit = Math.min(Math.max(params.limit ?? PARTS_PAGE_SIZE, 1), 50);
  const offset = Math.max(params.offset ?? 0, 0);

  const body = {
    p_make: make,
    p_make_en: makeEn,
    p_model: params.model || null,
    p_year: params.year || null,
    p_main_category: params.mainCategory || null,
    p_sub_category: params.subCategory || null,
    p_offset: offset,
    p_limit: limit,
  };

  try {
    const res = await fetch(`${restBase}/rpc/search_parts_catalog`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      const items = Array.isArray(data?.items) ? data.items : [];
      return {
        items,
        total: Number(data?.total ?? items.length) || 0,
        offset: Number(data?.offset ?? offset) || offset,
        limit: Number(data?.limit ?? limit) || limit,
        hasMore: Boolean(data?.hasMore),
      };
    }
  } catch (_) {}

  // Fallback: PostgREST ilike + client slice (still capped)
  return searchPartsCatalogFallback(params, offset, limit);
}

async function searchPartsCatalogFallback(
  params: PartsSearchParams,
  offset: number,
  limit: number
): Promise<PartsSearchResult> {
  const make = params.make || '';
  const makeEn = params.makeEn || resolveMakeEn(make);
  const makes = Array.from(new Set([make, makeEn, resolveMakeAr(make)].filter(Boolean)));
  const or = makes.map((m) => `make.ilike.*${encodeURIComponent(m)}*`).join(',');
  const url = `${restBase}/parts?or=(${or})&is_active=eq.true&select=*&order=id.desc&limit=400`;

  try {
    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) {
      return { items: [], total: 0, offset, limit, hasMore: false };
    }
    let rows: any[] = await res.json();
    if (!Array.isArray(rows)) rows = [];

    const year = params.year || '';
    const model = params.model || '';
    const main = (params.mainCategory || '').trim().toLowerCase();
    const sub = (params.subCategory || '').trim().toLowerCase();

    const filtered = rows.filter((p) => {
      if (year && !yearMatches(String(p.year || ''), year)) return false;
      if (model && !modelLooseMatch(String(p.model || ''), model)) return false;
      const cat = String(p.category || '');
      const pMain = (cat.includes('>') ? cat.split('>')[0] : cat).trim().toLowerCase();
      const pSub = (cat.includes('>') ? cat.split('>')[1] : '').trim().toLowerCase();
      if (main && !pMain.includes(main) && !cat.toLowerCase().includes(main)) return false;
      if (sub && !pSub.includes(sub) && !cat.toLowerCase().includes(sub)) return false;
      return true;
    });

    const slice = filtered.slice(offset, offset + limit);
    return {
      items: slice,
      total: filtered.length,
      offset,
      limit,
      hasMore: offset + limit < filtered.length,
    };
  } catch (_) {
    return { items: [], total: 0, offset, limit, hasMore: false };
  }
}

export function yearMatches(partYear: string, targetYear: string): boolean {
  if (!partYear || !targetYear) return true;
  const yStr = String(partYear).trim();
  const target = Number(targetYear);
  if (yStr.includes('-')) {
    const [a, b] = yStr.split('-').map(Number);
    if (!Number.isNaN(a) && !Number.isNaN(b) && !Number.isNaN(target)) {
      return target >= Math.min(a, b) && target <= Math.max(a, b);
    }
  }
  return yStr === String(targetYear).trim() || yStr.includes(String(targetYear).trim());
}

export function modelLooseMatch(partModel: string, targetModel: string): boolean {
  if (!partModel || !targetModel) return true;
  const a = partModel.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g, '');
  const b = targetModel.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g, '');
  return a.includes(b) || b.includes(a) || partModel.toLowerCase().includes(targetModel.toLowerCase());
}

/** Lightweight vehicle index for building category facets (not full card payloads). */
export async function fetchVehicleFacetIndex(make: string, model: string, year: string) {
  const makeEn = resolveMakeEn(make);
  const makes = Array.from(new Set([make, makeEn, resolveMakeAr(make)].filter(Boolean)));
  const or = makes.map((m) => `make.ilike.*${encodeURIComponent(m)}*`).join(',');
  const url = `${restBase}/parts?or=(${or})&is_active=eq.true&select=id,category,engine,year,model&order=id.desc&limit=600`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) return [] as any[];
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.filter(
    (p) => yearMatches(String(p.year || ''), year) && modelLooseMatch(String(p.model || ''), model)
  );
}

export async function fetchYearsForMakeLive(make: string): Promise<string[]> {
  const makeEn = resolveMakeEn(make);
  try {
    const res = await fetch(`${restBase}/rpc/parts_facet_years`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ p_make: make, p_make_en: makeEn }),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data.map(String);
    }
  } catch (_) {}

  const makes = Array.from(new Set([make, makeEn].filter(Boolean)));
  const or = makes.map((m) => `make.ilike.*${encodeURIComponent(m)}*`).join(',');
  const url = `${restBase}/parts?or=(${or})&is_active=eq.true&select=year&limit=600`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) return [];
  const data = await res.json();
  const set = new Set<string>();
  (Array.isArray(data) ? data : []).forEach((item: any) => {
    const yStr = String(item.year || '').trim();
    if (yStr.includes('-')) {
      const [a, b] = yStr.split('-').map(Number);
      if (!Number.isNaN(a) && !Number.isNaN(b)) {
        for (let y = Math.min(a, b); y <= Math.max(a, b); y++) set.add(String(y));
      }
    } else if (yStr) set.add(yStr);
  });
  return Array.from(set).sort((a, b) => Number(b) - Number(a));
}
