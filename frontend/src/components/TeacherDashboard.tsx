import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import TeacherRoomManagement from './TeacherRoomManagement';

interface Teacher {
  id: string;
  name: string;
  email: string;
}

type DashboardView = 'main' | 'room-management' | 'analysis' | 'portfolio';

const TeacherDashboard: React.FC = () => {
  const [user, setUser] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<DashboardView>('main');
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, [navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkAuth = async () => {
    if (!isSupabaseConfigured() || !supabase) {
      navigate('/teacher');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/teacher');
        return;
      }

      // 사용자 정보 upsert (없으면 생성, 있으면 업데이트)
      const { data: teacherData, error: upsertError } = await supabase
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
        })
        .select()
        .single();

      if (upsertError) {
        console.error('Teacher upsert error:', upsertError);
        navigate('/teacher');
        return;
      }

      setUser(teacherData);
      setLoading(false);
    } catch (error) {
      console.error('Auth check error:', error);
      navigate('/teacher');
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;

    try {
      await supabase.auth.signOut();
      navigate('/teacher');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const renderMainDashboard = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">사고루틴 학습 플랫폼</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                안녕하세요, {user?.name}님
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            교사 대시보드
          </h2>
          <p className="text-lg text-gray-600">
            사고루틴 학습을 위한 다양한 기능을 선택하세요
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 사고루틴 생성 및 적용하기 */}
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                사고루틴
              </h3>
              <h4 className="text-lg font-semibold text-gray-700 mb-4">
                생성 및 적용하기
              </h4>
              <p className="text-gray-600 mb-6">
                다양한 사고루틴을 생성하고 학생들과 함께 활동할 수 있습니다.
              </p>
              <button
                onClick={() => setCurrentView('room-management')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200"
              >
                시작하기
              </button>
            </div>
          </div>

          {/* 사고루틴 분석 및 평가하기 */}
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                사고루틴
              </h3>
              <h4 className="text-lg font-semibold text-gray-700 mb-4">
                분석 및 평가하기
              </h4>
              <p className="text-gray-600 mb-6">
                학생들의 사고루틴 활동 결과를 분석하고 평가할 수 있습니다.
              </p>
              <button
                onClick={() => setCurrentView('analysis')}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200"
              >
                시작하기
              </button>
            </div>
          </div>

          {/* 학생별 사고루틴 포트폴리오 */}
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                학생별 사고루틴
              </h3>
              <h4 className="text-lg font-semibold text-gray-700 mb-4">
                포트폴리오
              </h4>
              <p className="text-gray-600 mb-6">
                각 학생의 사고루틴 학습 과정과 성장을 추적할 수 있습니다.
              </p>
              <button
                onClick={() => setCurrentView('portfolio')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200"
              >
                시작하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalysisView = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentView('main')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← 대시보드로 돌아가기
              </button>
              <h1 className="text-2xl font-bold text-gray-900">사고루틴 분석 및 평가하기</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                안녕하세요, {user?.name}님
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              사고루틴 분석 및 평가 기능
            </h2>
            <p className="text-gray-600 mb-6">
              이 기능은 현재 개발 중입니다. 곧 제공될 예정입니다.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-yellow-800">
                🚧 개발 예정 기능: 학생 응답 분석, 사고 패턴 시각화, 평가 도구 등
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPortfolioView = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentView('main')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← 대시보드로 돌아가기
              </button>
              <h1 className="text-2xl font-bold text-gray-900">학생별 사고루틴 포트폴리오</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                안녕하세요, {user?.name}님
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              학생별 사고루틴 포트폴리오
            </h2>
            <p className="text-gray-600 mb-6">
              이 기능은 현재 개발 중입니다. 곧 제공될 예정입니다.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-blue-800">
                📚 개발 예정 기능: 개별 학생 진도 추적, 성장 기록, 포트폴리오 관리 등
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">인증 중...</p>
        </div>
      </div>
    );
  }

  switch (currentView) {
    case 'room-management':
      return <TeacherRoomManagement onBack={() => setCurrentView('main')} />;
    case 'analysis':
      return renderAnalysisView();
    case 'portfolio':
      return renderPortfolioView();
    default:
      return renderMainDashboard();
  }
};

export default TeacherDashboard; 