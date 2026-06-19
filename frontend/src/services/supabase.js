import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export let supabase = null;
export const isConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-supabase-project-id.supabase.co' &&
  supabaseAnonKey !== 'your-actual-supabase-anon-public-key'
);

if (isConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error('Supabase initialization failed:', err);
  }
} else {
  console.warn('WARNING: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing or configured with placeholder values. Pookie AI is in Setup Mode.');
}
