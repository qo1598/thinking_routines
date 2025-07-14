import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Title */}
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6 leading-tight">
            <span className="text-blue-600">사고루틴</span>
            <span className="block text-4xl md:text-5xl mt-2">학습 플랫폼</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
            개념기반 탐구 학습과 사고루틴을 연계한<br />
            깊이 있는 사고력 향상 플랫폼
          </p>
          
          {/* Description */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12 text-left">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
              🧠 사고루틴(Thinking Routines)이란?
            </h2>
            <div className="space-y-4 text-gray-700">
              <p className="text-lg leading-relaxed">
                사고루틴은 학생들의 <strong>깊이 있는 사고</strong>를 지원하는 체계적인 교수학습 방법입니다.
              </p>
              <div className="grid md:grid-cols-3 gap-6 mt-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl mb-2">🔍</div>
                  <h3 className="font-semibold text-blue-800 mb-2">관찰하기</h3>
                  <p className="text-sm text-gray-600">See-Think-Wonder 등을 통한 체계적 관찰</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl mb-2">💭</div>
                  <h3 className="font-semibold text-green-800 mb-2">생각하기</h3>
                  <p className="text-sm text-gray-600">Connect-Extend-Challenge로 사고 확장</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl mb-2">🌟</div>
                  <h3 className="font-semibold text-purple-800 mb-2">탐구하기</h3>
                  <p className="text-sm text-gray-600">Think-Puzzle-Explore로 깊이 있는 탐구</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Call to Action Buttons */}
        <div className="max-w-2xl mx-auto">
          <h3 className="text-2xl font-semibold text-gray-800 mb-8 text-center">
            시작하기
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Teacher Button */}
            <button
              onClick={() => navigate('/teacher')}
              className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="relative z-10">
                <div className="text-4xl mb-4">👨‍🏫</div>
                <h4 className="text-2xl font-bold mb-2">교사용</h4>
                <p className="text-blue-100 leading-relaxed">
                  수업 계획, 학생 활동 관리<br />
                  실시간 피드백 및 분석
                </p>
              </div>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            </button>
            
            {/* Student Button */}
            <button
              onClick={() => navigate('/student')}
              className="group relative overflow-hidden bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="relative z-10">
                <div className="text-4xl mb-4">👨‍🎓</div>
                <h4 className="text-2xl font-bold mb-2">학생용</h4>
                <p className="text-green-100 leading-relaxed">
                  사고루틴 활동 참여<br />
                  창의적 사고력 개발
                </p>
              </div>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
        
        {/* Features Section */}
        <div className="mt-16 max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-gray-800 mb-12 text-center">
            주요 기능
          </h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-3 text-center">📚</div>
              <h4 className="font-semibold text-gray-800 mb-2 text-center">다양한 사고루틴</h4>
              <p className="text-sm text-gray-600 text-center">See-Think-Wonder, 4C, Frayer Model 등 다양한 루틴 제공</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-3 text-center">📊</div>
              <h4 className="font-semibold text-gray-800 mb-2 text-center">실시간 분석</h4>
              <p className="text-sm text-gray-600 text-center">AI 기반 학생 응답 분석 및 즉시 피드백</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-3 text-center">👥</div>
              <h4 className="font-semibold text-gray-800 mb-2 text-center">협력 학습</h4>
              <p className="text-sm text-gray-600 text-center">학급 단위 활동 관리 및 공유</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-3 text-center">📱</div>
              <h4 className="font-semibold text-gray-800 mb-2 text-center">반응형 디자인</h4>
              <p className="text-sm text-gray-600 text-center">PC, 태블릿, 모바일 모든 기기 지원</p>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-gray-200">
          <p className="text-center text-gray-500">
            © 2025 사고루틴 학습 플랫폼. 개념기반 탐구 학습과 사고루틴의 연계적 적용.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage; 