import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// 디버깅을 위한 로그
console.log('Environment variables:', {
  REACT_APP_SUPABASE_URL: supabaseUrl ? 'Set' : 'Not set',
  REACT_APP_SUPABASE_ANON_KEY: supabaseAnonKey ? 'Set' : 'Not set'
});

// Supabase 클라이언트 생성 (환경 변수가 없어도 오류 발생하지 않도록)
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// 설정 상태 확인 함수
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabase);
}; 