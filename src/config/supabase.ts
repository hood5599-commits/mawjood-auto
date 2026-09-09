// src/config/supabase.ts
declare const process: any;

/** Hardcoded fallbacks keep local/dev builds alive if .env is absent. */
const defaultUrl = 'https://shszpcjmhkemqwborfwy.supabase.co';
const defaultKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoc3pwY2ptaGtlbXF3Ym9yZnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMDcxNzMsImV4cCI6MjA5OTY4MzE3M30.QycaUsYnhXX-uyeq3LVht_b1HVR0V0Tp72yMZUkdz2k';

const viteEnv =
  typeof import.meta !== 'undefined'
    ? ((import.meta as ImportMeta & { env?: Record<string, string | undefined> })
        .env ?? {})
    : {};

const processEnv =
  typeof process !== 'undefined' && process?.env ? process.env : {};

const rawUrl =
  viteEnv.VITE_SUPABASE_URL ||
  processEnv.REACT_APP_SUPABASE_URL ||
  processEnv.VITE_SUPABASE_URL ||
  defaultUrl;

export const SUPABASE_URL =
  rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '') + '/rest/v1';

export const API_KEY =
  viteEnv.VITE_SUPABASE_ANON_KEY ||
  processEnv.REACT_APP_SUPABASE_ANON_KEY ||
  processEnv.VITE_SUPABASE_ANON_KEY ||
  defaultKey;
