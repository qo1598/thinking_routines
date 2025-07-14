import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-10 leading-tight">
            <span className="text-blue-600">사고루틴</span>
            <span className="block text-4xl md:text-5xl mt-2">학습 플랫폼</span>
          </h1>
        </div>
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-center items-center">
            {/* Teacher Button */}
            <button
              onClick={() => navigate('/teacher')}
              className="group w-full aspect-square max-w-xs mx-auto relative overflow-hidden bg-gradient-to-br from-[#4e5d78] to-[#a3b8d8] hover:from-[#3a4660] hover:to-[#b5c6e0] text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center"
            >
              <div className="relative z-10 flex flex-col items-center justify-center h-full">
                <div className="text-5xl mb-4">👨‍🏫</div>
                <h4 className="text-2xl font-bold">교사용</h4>
              </div>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            </button>
            {/* Student Button */}
            <button
              onClick={() => navigate('/student')}
              className="group w-full aspect-square max-w-xs mx-auto relative overflow-hidden bg-gradient-to-br from-[#6dd5c7] to-[#b7e2df] hover:from-[#4ecdc4] hover:to-[#d0f5ef] text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center"
            >
              <div className="relative z-10 flex flex-col items-center justify-center h-full">
                <div className="text-5xl mb-4">👨‍🎓</div>
                <h4 className="text-2xl font-bold">학생용</h4>
              </div>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
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