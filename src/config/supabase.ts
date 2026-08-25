// src/config/supabase.ts
declare const process: any;

// 1. رابط قاعدة البيانات مع قيمة احتياطية تمنع ظهور خطأ 404
const defaultUrl = "https://shszpcjmhkemqwborfwy.supabase.co";
const rawUrl = 
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process?.env?.REACT_APP_SUPABASE_URL) ||
  defaultUrl;

export const SUPABASE_URL = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '') + '/rest/v1';

// 2. المفتاح العام مع قيمة احتياطية تضمن عمل التطبيق فوراً
const defaultKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoc3pwY2ptaGtlbXF3Ym9yZnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMDcxNzMsImV4cCI6MjA5OTY4MzE3M30.QycaUsYnhXX-uyeq3LVht_b1HVR0V0Tp72yMZUkdz2k";

export const API_KEY = 
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process?.env?.REACT_APP_SUPABASE_ANON_KEY) ||
  defaultKey;
