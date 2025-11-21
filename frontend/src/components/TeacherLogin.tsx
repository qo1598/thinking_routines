import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface LoginForm {
  email: string;
  password: string;
}

interface SignupForm extends LoginForm {
  name: string;
  confirmPassword: string;
}

const TeacherLogin: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginForm, setLoginForm] = useState<LoginForm>({
    email: '',
    password: ''
  });
  const [signupForm, setSignupForm] = useState<SignupForm>({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });

  const navigate = useNavigate();

  // 인증 상태 확인
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    // URL 해시에서 access_token 확인 (Google OAuth 리다이렉트 처리)
    const handleAuthCallback = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token=') && supabase) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            // 먼저 teachers 테이블에 사용자 추가 (upsert 사용)
            const { error: upsertError } = await supabase
              .from('teachers')
              .upsert([
                {
                  id: data.session.user.id,
                  email: data.session.user.email,
                  name: data.session.user.user_metadata?.name || data.session.user.email?.split('@')[0],
                  created_at: new Date().toISOString()
                }
              ], {
                onConflict: 'id'
              });

            if (upsertError) {
              console.error('Teacher upsert error:', upsertError);
            }

            // URL 해시 제거하고 대시보드로 이동
            window.history.replaceState({}, document.title, window.location.pathname);
            navigate('/teacher/dashboard');
            return;
          }
        } catch (error) {
          console.error('Auth callback error:', error);
        }
      }
    };

    handleAuthCallback();

    // 현재 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/teacher/dashboard');
      }
    });

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session && supabase) {
          // 사용자 정보를 teachers 테이블에 저장/업데이트 (upsert 사용)
          const { error: upsertError } = await supabase
            .from('teachers')
            .upsert([
              {
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
                created_at: new Date().toISOString()
              }
            ], {
              onConflict: 'id'
            });

          if (upsertError) {
            console.error('Teacher upsert error:', upsertError);
          }

          navigate('/teacher/dashboard');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured() || !supabase) {
      setError('Google 로그인이 설정되지 않았습니다.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 프로덕션 URL 강제 사용
      const redirectUrl = window.location.hostname === 'localhost'
        ? 'https://thinking-routines.vercel.app/teacher/dashboard'
        : `${window.location.origin}/teacher/dashboard`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('Google OAuth error:', error);
        setError('Google 로그인에 실패했습니다. 관리자에게 문의하세요.');
      }
      // 성공 시 리다이렉트가 자동으로 발생하므로 추가 처리 불필요
    } catch (err) {
      console.error('Google login error:', err);
      setError('Google 로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSupabaseConfigured() || !supabase) {
      setError('시스템 설정이 완료되지 않았습니다.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password
      });

      if (error) {
        console.error('Login error:', error);
        setError(error.message === 'Invalid login credentials'
          ? '이메일 또는 비밀번호가 올바르지 않습니다.'
          : '로그인에 실패했습니다.');
        return;
      }

      // 성공 시 useEffect의 onAuthStateChange에서 처리됨
    } catch (err: any) {
      console.error('Login error:', err);
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSupabaseConfigured() || !supabase) {
      setError('시스템 설정이 완료되지 않았습니다.');
      return;
    }

    setLoading(true);
    setError('');

    if (signupForm.password !== signupForm.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    if (signupForm.password.length < 6) {
      setError('비밀번호는 최소 6자리 이상이어야 합니다.');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupForm.email,
        password: signupForm.password,
        options: {
          data: {
            name: signupForm.name
          }
        }
      });

      if (error) {
        console.error('Signup error:', error);
        if (error.message.includes('User already registered')) {
          setError('이미 등록된 이메일입니다.');
        } else {
          setError('회원가입에 실패했습니다. 다시 시도해주세요.');
        }
        return;
      }

      // 이메일 확인이 필요한 경우
      if (data.user && !data.session) {
        alert('회원가입이 완료되었습니다. 이메일을 확인하여 계정을 활성화해주세요.');
        setIsLogin(true);
      } else {
        // 즉시 로그인된 경우 (이메일 확인 불필요)
        alert('회원가입이 완료되었습니다!');
        // onAuthStateChange에서 자동으로 대시보드로 이동
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isLogin ? '교사 로그인' : '교사 회원가입'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isLogin ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="font-medium text-primary-600 hover:text-primary-500 ml-1"
            >
              {isLogin ? '회원가입' : '로그인'}
            </button>
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* 시스템 설정 상태 표시 */}
          {!isSupabaseConfigured() && (
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
              시스템 설정이 완료되지 않았습니다. 관리자에게 문의하세요.
            </div>
          )}

          {/* Google 로그인 버튼 - Supabase 설정이 있을 때만 표시 */}
          {isSupabaseConfigured() && (
            <>
              <div className="mb-6">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google로 로그인
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">또는</span>
                </div>
              </div>
            </>
          )}

          {isLogin ? (
            <form onSubmit={handleLoginSubmit} className={`space-y-6 ${isSupabaseConfigured() ? 'mt-6' : ''}`}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  이메일
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="이메일을 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  비밀번호
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="비밀번호를 입력하세요"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? '로그인 중...' : '로그인'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className={`space-y-6 ${isSupabaseConfigured() ? 'mt-6' : ''}`}>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  이름
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={signupForm.name}
                  onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="이름을 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700">
                  이메일
                </label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  required
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="이메일을 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700">
                  비밀번호
                </label>
                <input
                  id="signup-password"
                  name="password"
                  type="password"
                  required
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="비밀번호를 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                  비밀번호 확인
                </label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  required
                  value={signupForm.confirmPassword}
                  onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="비밀번호를 다시 입력하세요"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? '회원가입 중...' : '회원가입'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherLogin;