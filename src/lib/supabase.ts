import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || (typeof process !== 'undefined' ? process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL : '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY : '');

export const isValidHttpUrl = (urlStr: string): boolean => {
  if (!urlStr || typeof urlStr !== 'string') return false;
  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isSupabaseConfigured = (): boolean => {
  return isValidHttpUrl(rawSupabaseUrl) &&
         Boolean(supabaseAnonKey) &&
         !rawSupabaseUrl.includes('your-supabase-project') &&
         !rawSupabaseUrl.includes('YOUR_SUPABASE_URL');
};

let clientInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (!clientInstance) {
    const targetUrl = isValidHttpUrl(rawSupabaseUrl) ? rawSupabaseUrl : 'https://placeholder-project.supabase.co';
    const targetKey = supabaseAnonKey || 'placeholder-anon-key';

    try {
      clientInstance = createClient(targetUrl, targetKey);
    } catch (err) {
      console.warn("Failed to create Supabase client with provided URL. Using safe fallback.", err);
      clientInstance = createClient('https://placeholder-project.supabase.co', 'placeholder-anon-key');
    }
  }
  return clientInstance;
};

export const supabase = getSupabase();

