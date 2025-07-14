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
          

        </div>
        
        {/* Call to Action Buttons */}
        <div className="max-w-2xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Teacher Button */}
            <button
              onClick={() => navigate('/teacher')}
              className="group relative overflow-hidden bg-gradient-to-r from-blue-300 to-blue-400 hover:from-blue-400 hover:to-blue-500 text-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="relative z-10">
                <div className="text-4xl mb-4">👨‍🏫</div>
                <h4 className="text-2xl font-bold">교사용</h4>
              </div>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            </button>
            
            {/* Student Button */}
            <button
              onClick={() => navigate('/student')}
              className="group relative overflow-hidden bg-gradient-to-r from-green-300 to-green-400 hover:from-green-400 hover:to-green-500 text-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="relative z-10">
                <div className="text-4xl mb-4">👨‍🎓</div>
                <h4 className="text-2xl font-bold">학생용</h4>
              </div>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            </button>
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