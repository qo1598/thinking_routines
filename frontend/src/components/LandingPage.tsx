import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// GSAP 플러그인 등록
gsap.registerPlugin(ScrollTrigger);

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const guideRef = useRef<HTMLDivElement>(null);
  const routinesRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 가이드 섹션 페이드인
      gsap.fromTo(guideRef.current, 
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          scrollTrigger: {
            trigger: guideRef.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // 사고루틴 카드들 순차 애니메이션
      cardsRef.current.forEach((card, index) => {
        gsap.fromTo(card,
          { 
            opacity: 0, 
            y: 30,
            scale: 0.9,
            rotationY: 15
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotationY: 0,
            duration: 0.8,
            delay: index * 0.1,
            ease: "back.out(1.7)",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              toggleActions: "play none none reverse"
            }
          }
        );

        // 호버 애니메이션
        card.addEventListener('mouseenter', () => {
          gsap.to(card, {
            scale: 1.05,
            y: -5,
            duration: 0.3,
            ease: "power2.out"
          });
        });

        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            scale: 1,
            y: 0,
            duration: 0.3,
            ease: "power2.out"
          });
        });
      });

      // 텍스트 애니메이션
      const titles = document.querySelectorAll('.animate-title');
      titles.forEach((title, index) => {
        gsap.fromTo(title,
          { opacity: 0, x: -30 },
          {
            opacity: 1,
            x: 0,
            duration: 0.8,
            delay: index * 0.2,
            scrollTrigger: {
              trigger: title,
              start: "top 90%",
              toggleActions: "play none none reverse"
            }
          }
        );
      });

    }, guideRef);

    return () => ctx.revert();
  }, []);

  const addToRefs = (el: HTMLDivElement) => {
    if (el && !cardsRef.current.includes(el)) {
      cardsRef.current.push(el);
    }
  };

  const thinkingRoutines = [
    {
      id: 1,
      title: "See-Think-Wonder",
      subtitle: "보기-생각하기-궁금하기",
      description: "새로운 주제 탐색과 관찰 능력 향상",
      emoji: "👁️",
      color: "from-blue-500 to-indigo-600",
      steps: ["SEE 객관적 관찰", "THINK 해석과 분석", "WONDER 호기심 개발"]
    },
    {
      id: 2,
      title: "4C",
      subtitle: "연결-도전-개념-변화",
      description: "깊이 있는 분석과 비판적 사고",
      emoji: "🔗",
      color: "from-purple-500 to-pink-600",
      steps: ["CONNECT 연결하기", "CHALLENGE 도전하기", "CONCEPTS 개념파악", "CHANGES 변화제안"]
    },
    {
      id: 3,
      title: "Circle of Viewpoints",
      subtitle: "관점의 원",
      description: "다양한 관점 이해와 공감 능력 개발",
      emoji: "🔄",
      color: "from-green-500 to-teal-600",
      steps: ["VIEWPOINTS 관점탐색", "PERSPECTIVE 관점선택", "QUESTIONS 관점별질문"]
    },
    {
      id: 4,
      title: "Connect-Extend-Challenge",
      subtitle: "연결-확장-도전",
      description: "학습 내용 정리와 사고 확장",
      emoji: "🚀",
      color: "from-orange-500 to-red-600",
      steps: ["CONNECT 기존지식연결", "EXTEND 새로운관점", "CHALLENGE 의문제기"]
    },
    {
      id: 5,
      title: "Frayer Model",
      subtitle: "프레이어 모델",
      description: "개념 학습과 어휘 이해",
      emoji: "📚",
      color: "from-cyan-500 to-blue-600",
      steps: ["DEFINITION 명확한정의", "CHARACTERISTICS 주요특징", "EXAMPLES 예시와반례"]
    },
    {
      id: 6,
      title: "I Used to Think... Now I Think...",
      subtitle: "이전 생각 - 현재 생각",
      description: "학습 전후 변화 확인과 성찰",
      emoji: "🧠",
      color: "from-rose-500 to-pink-600",
      steps: ["USED TO THINK 이전생각", "NOW THINK 현재생각", "WHY CHANGED 변화이유"]
    },
    {
      id: 7,
      title: "Think-Puzzle-Explore",
      subtitle: "생각-퍼즐-탐구",
      description: "탐구 활동 시작과 연구 계획",
      emoji: "🧩",
      color: "from-violet-500 to-purple-600",
      steps: ["THINK 기존지식", "PUZZLE 의문점파악", "EXPLORE 탐구계획"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-10 leading-tight">
            사고루틴 학습 플랫폼
          </h1>
        </div>
        <div className="max-w-md mx-auto"> 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-center items-center">
            {/* Teacher Button */}
            <button
              onClick={() => navigate('/teacher')}
              className="group w-full aspect-square max-w-[160px] mx-auto relative overflow-hidden bg-gradient-to-br from-[#4e5d78] to-[#a3b8d8] hover:from-[#3a4660] hover:to-[#b5c6e0] text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center"
            >
              <div className="relative z-10 flex flex-col items-center justify-center h-full">
                <div className="text-3xl mb-2">👨‍🏫</div>
                <h4 className="text-2xl font-bold">교사용</h4>
              </div>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            </button>
            {/* Student Button */}
            <button
              onClick={() => navigate('/student')}
              className="group w-full aspect-square max-w-[160px] mx-auto relative overflow-hidden bg-gradient-to-br from-[#6dd5c7] to-[#b7e2df] hover:from-[#4ecdc4] hover:to-[#d0f5ef] text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center"
            >
              <div className="relative z-10 flex flex-col items-center justify-center h-full">
                <div className="text-3xl mb-2">👨‍🎓</div>
                <h4 className="text-2xl font-bold">학생용</h4>
              </div>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>

        {/* 사고루틴 가이드 섹션 */}
        <div ref={guideRef} className="mt-24 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="animate-title text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              🧠 7가지 사고루틴 완전 가이드
            </h2>
            <p className="animate-title text-lg text-gray-600 max-w-2xl mx-auto">
              하버드 대학교 Project Zero에서 개발한 사고루틴으로 
              <span className="font-semibold text-indigo-600"> 비판적 사고력</span>, 
              <span className="font-semibold text-purple-600"> 창의적 문제해결능력</span>, 
              <span className="font-semibold text-pink-600"> 메타인지 능력</span>을 체계적으로 기를 수 있습니다.
            </p>
          </div>

          <div ref={routinesRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {thinkingRoutines.map((routine, index) => (
              <div
                key={routine.id}
                ref={addToRefs}
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer border border-gray-100"
              >
                {/* 그라데이션 배경 */}
                <div className={`absolute inset-0 bg-gradient-to-br ${routine.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                {/* 카드 내용 */}
                <div className="relative p-6">
                  {/* 헤더 */}
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-3">{routine.emoji}</div>
                    <h3 className="font-bold text-lg text-gray-800 mb-1">
                      {routine.title}
                    </h3>
                    <p className="text-sm text-gray-500 font-medium">
                      {routine.subtitle}
                    </p>
                  </div>

                  {/* 설명 */}
                  <p className="text-center text-gray-600 text-sm mb-4 leading-relaxed">
                    {routine.description}
                  </p>

                  {/* 단계들 */}
                  <div className="space-y-2">
                    {routine.steps.map((step, stepIndex) => (
                      <div
                        key={stepIndex}
                        className="flex items-center text-xs"
                      >
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${routine.color} mr-2 flex-shrink-0`}></div>
                        <span className="text-gray-600 font-medium">{step}</span>
                      </div>
                    ))}
                  </div>

                  {/* 호버시 나타나는 더보기 버튼 */}
                  <div className="absolute inset-x-0 bottom-0 bg-white bg-opacity-95 backdrop-blur-sm p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <button className={`w-full py-2 px-4 rounded-lg bg-gradient-to-r ${routine.color} text-white text-sm font-medium hover:shadow-lg transition-all duration-200`}>
                      자세히 보기
                    </button>
                  </div>
                </div>

                {/* 카드 번호 */}
                <div className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-600">{routine.id}</span>
                </div>
              </div>
            ))}
          </div>

          {/* 추가 정보 섹션 */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center animate-title">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎤</span>
              </div>
              <h3 className="font-bold text-lg mb-2">음성 입력 지원</h3>
              <p className="text-gray-600 text-sm">STT 기술로 편리하게 답변을 입력할 수 있습니다</p>
            </div>
            
            <div className="text-center animate-title">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="font-bold text-lg mb-2">AI 피드백</h3>
              <p className="text-gray-600 text-sm">Google Gemini API로 지능형 학습 분석을 제공합니다</p>
            </div>
            
            <div className="text-center animate-title">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="font-bold text-lg mb-2">실시간 학습</h3>
              <p className="text-gray-600 text-sm">교사와 학생이 실시간으로 상호작용할 수 있습니다</p>
            </div>
          </div>

          {/* 시작하기 CTA */}
          <div className="mt-16 text-center animate-title">
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">🎊 지금 바로 시작해보세요!</h3>
              <p className="text-lg mb-6 opacity-90">
                체계적 사고력 향상과 창의적 학습 경험을 만나보세요
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/teacher')}
                  className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
                >
                  교사로 시작하기 👨‍🏫
                </button>
                <button
                  onClick={() => navigate('/student')}
                  className="bg-white bg-opacity-20 text-white border-2 border-white border-opacity-30 px-6 py-3 rounded-lg font-semibold hover:bg-opacity-30 transition-all duration-200"
                >
                  학생으로 참여하기 👨‍🎓
                </button>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-20 pt-8 border-t border-gray-200">
          <p className="text-center text-gray-500">
            © 2025 사고루틴 학습 플랫폼. (개발자: Bae.T 문의사항은 qo1598@dge.go.kr.)
          </p>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
