import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// 디버깅을 위한 로그
console.log('Environment variables:', {
  REACT_APP_SUPABASE_URL: supabaseUrl ? 'Set' : 'Not set',
  REACT_APP_SUPABASE_ANON_KEY: supabaseAnonKey ? 'Set' : 'Not set'
});

if (!supabaseUrl) {
  throw new Error('REACT_APP_SUPABASE_URL is required but not set');
}

if (!supabaseAnonKey) {
  throw new Error('REACT_APP_SUPABASE_ANON_KEY is required but not set');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 