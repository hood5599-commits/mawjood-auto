// src/config/supabase.ts
declare const process: any;

const rawUrl = 
  (typeof process !== 'undefined' && process?.env?.REACT_APP_SUPABASE_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_SUPABASE_URL) ||
  "";

export const SUPABASE_URL = rawUrl 
  ? rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '') + '/rest/v1'
  : "";

export const API_KEY = 
  (typeof process !== 'undefined' && process?.env?.REACT_APP_SUPABASE_ANON_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY) ||
  "";
