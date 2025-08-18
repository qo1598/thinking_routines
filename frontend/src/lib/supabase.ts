import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// 디버깅을 위한 로그
console.log('Environment variables:', {
  REACT_APP_SUPABASE_URL: supabaseUrl ? 'Set' : 'Not set',
  REACT_APP_SUPABASE_ANON_KEY: supabaseAnonKey ? 'Set' : 'Not set'
});

// Supabase 클라이언트 생성 (빌드 시에는 더미 값 사용)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);

// 설정 상태 확인 함수
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabase);
}; 