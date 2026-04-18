import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rklsgurirjpnrycqgytc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_gPlOkZSOf99AHeHEbEF1yw_75uAkAFH';

if (!import.meta.env.VITE_SUPABASE_URL) {
  console.log('Using hardcoded Supabase credentials as fallback.');
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
