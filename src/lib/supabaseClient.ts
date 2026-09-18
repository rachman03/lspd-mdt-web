import { createClient } from '@supabase/supabase-js';

// Setup environment variables:
// In your .env file, add the following variables:
// VITE_SUPABASE_URL=https://your-project-id.supabase.co
// VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

const cleanValue = (val: string): string => {
  if (!val) return '';
  let cleaned = val.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.substring(1, cleaned.length - 1).trim();
  }
  return cleaned;
};

const rawUrl = cleanValue(import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '');
const rawKey = cleanValue(import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '');

const sanitizeUrl = (url: string): string => {
  if (!url) return 'https://placeholder.supabase.co';
  const trimmed = url.trim();
  if (
    trimmed === '' ||
    trimmed === 'undefined' ||
    trimmed === 'null' ||
    trimmed === 'placeholder' ||
    trimmed.includes('YOUR_SUPABASE')
  ) {
    return 'https://placeholder.supabase.co';
  }
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return 'https://placeholder.supabase.co';
  }
  return trimmed;
};

const sanitizeKey = (key: string): string => {
  if (!key) return 'placeholder';
  const trimmed = key.trim();
  if (
    trimmed === '' ||
    trimmed === 'undefined' ||
    trimmed === 'null' ||
    trimmed === 'placeholder' ||
    trimmed.includes('YOUR_SUPABASE')
  ) {
    return 'placeholder';
  }
  return trimmed;
};

const supabaseUrl = sanitizeUrl(rawUrl);
const supabaseAnonKey = sanitizeKey(rawKey);

export const isSupabaseConfigured = (): boolean => {
  return (
    supabaseUrl !== 'https://placeholder.supabase.co' &&
    supabaseAnonKey !== 'placeholder'
  );
};

if (!isSupabaseConfigured()) {
  console.warn(
    'PERINGATAN KONEKSI SUPABASE: VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY belum diatur dengan benar di file .env Anda. Aplikasi akan menggunakan data lokal (localStorage) sebagai fallback.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

