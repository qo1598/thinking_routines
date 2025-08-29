import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';

// GSAP 기본 설정

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const guideRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const featuresRef = useRef<HTMLDivElement[]>([]);
  const ctaRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedRoutine, setSelectedRoutine] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 마우스 트래킹 (Apple스러운 마그네틱 효과)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isModalOpen]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 페이지 로딩 애니메이션 - Apple 스타일
      const loadingTimeline = gsap.timeline();

      // 히어로 섹션 극적인 입장
      loadingTimeline
        .set([titleRef.current, subtitleRef.current, buttonsRef.current], {
          opacity: 0,
          y: 60,
          scale: 0.8
        })
        .to(titleRef.current, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.2,
          ease: "power3.out"
        })
        .to(subtitleRef.current, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1,
          ease: "power3.out"
        }, "-=0.8")
        .to(buttonsRef.current, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "power3.out"
        }, "-=0.6");

      // 패럴랙스 배경 효과
      gsap.to(heroRef.current, {
        yPercent: -20,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1
        }
      });

      // 가이드 섹션 - 웨이브 애니메이션
      gsap.fromTo(guideRef.current, 
        { 
          opacity: 0, 
          y: 100,
          rotationX: 15,
          transformOrigin: "center bottom"
        },
        {
          opacity: 1,
          y: 0,
          rotationX: 0,
          duration: 1.5,
          ease: "power4.out",
          scrollTrigger: {
            trigger: guideRef.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // 사고루틴 카드들 - Apple 스타일 3D 플립 애니메이션
      cardsRef.current.forEach((card, index) => {
        // 카드 입장 애니메이션
        gsap.fromTo(card,
          { 
            opacity: 0, 
            y: 80,
            rotationY: 45,
            transformOrigin: "center center",
            transformPerspective: 1000
          },
          {
            opacity: 1,
            y: 0,
            rotationY: 0,
            duration: 1.2,
            delay: index * 0.15,
            ease: "power4.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              toggleActions: "play none none reverse"
            }
          }
        );

        // 스크롤 패럴랙스 효과
        gsap.to(card, {
          y: -30,
          ease: "none",
          scrollTrigger: {
            trigger: card,
            start: "top bottom",
            end: "bottom top",
            scrub: 2
          }
        });

        // 마그네틱 호버 효과 (Apple 스타일)
        let magneticTimeline: gsap.core.Timeline;
        
        card.addEventListener('mouseenter', () => {
          magneticTimeline = gsap.timeline();
          magneticTimeline
            .to(card, {
              scale: 1.08,
              y: -15,
              rotationY: 5,
              rotationX: 5,
              transformOrigin: "center center",
              duration: 0.4,
              ease: "power2.out"
            })
            .to(card.querySelector('.card-gradient'), {
              opacity: 0.15,
              scale: 1.1,
              duration: 0.3,
              ease: "power2.out"
            }, 0);
        });

        card.addEventListener('mouseleave', () => {
          if (magneticTimeline) magneticTimeline.kill();
          gsap.to(card, {
            scale: 1,
            y: 0,
            rotationY: 0,
            rotationX: 0,
            duration: 0.5,
            ease: "power2.out"
          });
          gsap.to(card.querySelector('.card-gradient'), {
            opacity: 0,
            scale: 1,
            duration: 0.3,
            ease: "power2.out"
          });
        });

        // 마우스 따라가는 미묘한 움직임
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          
          gsap.to(card, {
            rotationY: x / 10,
            rotationX: -y / 10,
            duration: 0.3,
            ease: "power2.out"
          });
        });
      });

      // 기능 섹션들 - 스테거 애니메이션
      featuresRef.current.forEach((feature, index) => {
        gsap.fromTo(feature,
          { 
            opacity: 0, 
            y: 60,
            scale: 0.8
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1,
            delay: index * 0.2,
            ease: "elastic.out(1, 0.7)",
            scrollTrigger: {
              trigger: feature,
              start: "top 85%",
              toggleActions: "play none none reverse"
            }
          }
        );
      });

      // CTA 섹션 - 극적인 등장
      gsap.fromTo(ctaRef.current,
        { 
          opacity: 0, 
          scale: 0.5,
          rotationY: 180
        },
        {
          opacity: 1,
          scale: 1,
          rotationY: 0,
          duration: 1.5,
          ease: "power4.out",
          scrollTrigger: {
            trigger: ctaRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // 텍스트 애니메이션 - 타이핑 효과
      const animatedTexts = document.querySelectorAll('.animate-text');
      animatedTexts.forEach((text, index) => {
        gsap.fromTo(text,
          { 
            opacity: 0, 
            y: 30,
            clipPath: "inset(0 100% 0 0)"
          },
          {
            opacity: 1,
            y: 0,
            clipPath: "inset(0 0% 0 0)",
            duration: 1.2,
            delay: index * 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: text,
              start: "top 90%",
              toggleActions: "play none none reverse"
            }
          }
        );
      });

      // 부드러운 스크롤 효과 (Smooth Scrolling)
      // 스크롤 정규화는 기본 브라우저 동작 사용
      
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const addToRefs = (el: HTMLDivElement) => {
    if (el && !cardsRef.current.includes(el)) {
      cardsRef.current.push(el);
    }
  };

  const addToFeatureRefs = (el: HTMLDivElement) => {
    if (el && !featuresRef.current.includes(el)) {
      featuresRef.current.push(el);
    }
  };

  const thinkingRoutines = [
    {
      id: 1,
      title: "See-Think-Wonder",
      subtitle: "보기-생각하기-궁금하기",
      description: "새로운 주제 탐색, 관찰 능력 향상, 호기심 개발",
      longDescription: "객관적 관찰로 시작해서 개인적 해석과 탐구 의지로 발전시키는 사고루틴",
      emoji: "👁️",
      color: "from-blue-500 to-indigo-600",
      darkColor: "from-blue-600 to-indigo-700",
      steps: [
        { name: "SEE", description: "객관적 관찰과 구체적 묘사", color: "💙" },
        { name: "THINK", description: "관찰 기반 해석과 분석", color: "💚" },
        { name: "WONDER", description: "호기심과 탐구 의지 개발", color: "💜" }
      ],
      usage: "새로운 주제 탐색, 관찰 능력 향상, 호기심 개발",
      subjects: ["미술", "과학", "사회", "국어"]
    },
    {
      id: 2,
      title: "4C",
      subtitle: "연결-도전-개념-변화",
      description: "깊이 있는 분석, 비판적 사고, 개념적 이해",
      longDescription: "기존 지식과 연결하고, 도전하며, 핵심 개념을 파악해 변화를 제안하는 사고루틴",
      emoji: "🔗",
      color: "from-purple-500 to-pink-600",
      darkColor: "from-purple-600 to-pink-700",
      steps: [
        { name: "CONNECT", description: "기존 지식과의 연결고리 찾기", color: "💙" },
        { name: "CHALLENGE", description: "비판적 사고와 의문 제기", color: "❤️" },
        { name: "CONCEPTS", description: "핵심 개념과 아이디어 추출", color: "💚" },
        { name: "CHANGES", description: "실천적 적용과 행동 변화", color: "💜" }
      ],
      usage: "깊이 있는 분석, 비판적 사고, 개념적 이해",
      subjects: ["철학", "사회", "과학", "역사"]
    },
    {
      id: 3,
      title: "Circle of Viewpoints",
      subtitle: "관점의 원",
      description: "다양한 관점 이해, 공감 능력 개발, 갈등 상황 분석",
      longDescription: "다양한 이해관계자의 관점에서 상황을 바라보며 공감 능력을 기르는 사고루틴",
      emoji: "🔄",
      color: "from-green-500 to-teal-600",
      darkColor: "from-green-600 to-teal-700",
      steps: [
        { name: "VIEWPOINTS", description: "다양한 이해관계자 파악", color: "💙" },
        { name: "PERSPECTIVE", description: "특정 관점에서의 깊이 있는 이해", color: "💚" },
        { name: "QUESTIONS", description: "각 관점에서 제기할 수 있는 질문 발견", color: "💜" }
      ],
      usage: "다양한 관점 이해, 공감 능력 개발, 갈등 상황 분석",
      subjects: ["국어", "사회", "윤리", "역사"]
    },
    {
      id: 4,
      title: "Connect-Extend-Challenge",
      subtitle: "연결-확장-도전",
      description: "학습 내용 정리, 사고 확장, 비판적 검토",
      longDescription: "기존 지식과 연결하고 새로운 관점으로 확장하며 도전적으로 사고하는 루틴",
      emoji: "🚀",
      color: "from-orange-500 to-red-600",
      darkColor: "from-orange-600 to-red-700",
      steps: [
        { name: "CONNECT", description: "기존 지식과의 연결", color: "💙" },
        { name: "EXTEND", description: "새로운 아이디어나 관점 발견", color: "💚" },
        { name: "CHALLENGE", description: "비판적 사고와 의문 제기", color: "❤️" }
      ],
      usage: "학습 내용 정리, 사고 확장, 비판적 검토",
      subjects: ["수학", "과학", "기술", "예술"]
    },
    {
      id: 5,
      title: "Frayer Model",
      subtitle: "프레이어 모델",
      description: "개념 학습, 어휘 이해, 개념 구조화",
      longDescription: "정의, 특징, 예시를 통해 개념을 체계적으로 이해하는 사고루틴",
      emoji: "📚",
      color: "from-cyan-500 to-blue-600",
      darkColor: "from-cyan-600 to-blue-700",
      steps: [
        { name: "DEFINITION", description: "개념의 명확한 정의", color: "💙" },
        { name: "CHARACTERISTICS", description: "개념의 주요 특성 파악", color: "💚" },
        { name: "EXAMPLES", description: "구체적 사례를 통한 개념 이해", color: "💜" }
      ],
      usage: "개념 학습, 어휘 이해, 개념 구조화",
      subjects: ["국어", "영어", "과학", "수학"]
    },
    {
      id: 6,
      title: "I Used to Think... Now I Think...",
      subtitle: "이전 생각 - 현재 생각",
      description: "학습 전후 변화 확인, 메타인지 개발, 성찰 활동",
      longDescription: "학습 전후의 생각 변화를 돌아보며 메타인지 능력을 기르는 성찰적 사고루틴",
      emoji: "🧠",
      color: "from-rose-500 to-pink-600",
      darkColor: "from-rose-600 to-pink-700",
      steps: [
        { name: "USED TO THINK", description: "학습 전 생각이나 선입견 확인", color: "💙" },
        { name: "NOW THINK", description: "학습 후 변화된 생각 정리", color: "💚" },
        { name: "WHY CHANGED", description: "사고 변화의 근거와 과정 분석", color: "💜" }
      ],
      usage: "학습 전후 변화 확인, 메타인지 개발, 성찰 활동",
      subjects: ["모든 교과", "성찰", "메타인지"]
    },
    {
      id: 7,
      title: "Think-Puzzle-Explore",
      subtitle: "생각-퍼즐-탐구",
      description: "탐구 활동 시작, 문제 인식, 연구 계획 수립",
      longDescription: "기존 지식을 확인하고 의문점을 찾아 구체적인 탐구 계획을 세우는 사고루틴",
      emoji: "🧩",
      color: "from-violet-500 to-purple-600",
      darkColor: "from-violet-600 to-purple-700",
      steps: [
        { name: "THINK", description: "주제에 대한 기존 지식 확인", color: "💙" },
        { name: "PUZZLE", description: "의문점과 궁금한 점 파악", color: "💛" },
        { name: "EXPLORE", description: "구체적인 탐구 계획 수립", color: "💚" }
      ],
      usage: "탐구 활동 시작, 문제 인식, 연구 계획 수립",
      subjects: ["과학", "사회", "프로젝트", "연구"]
    }
  ];

  const features = [
    {
      title: "활동방 생성 및 관리",
      description: "다양한 사고루틴으로 활동방을 쉽게 만들고 관리할 수 있습니다",
      emoji: "🏠",
      color: "from-blue-500 to-indigo-600",
      details: "6자리 코드 생성으로 학생들의 간편한 참여 유도"
    },
    {
      title: "실시간 학생 응답 확인",
      description: "학생들의 사고루틴 진행 상황을 실시간으로 모니터링합니다",
      emoji: "👀",
      color: "from-purple-500 to-pink-600",
      details: "각 단계별 응답 내용과 진행률을 즉시 확인"
    },
    {
      title: "AI 기반 분석 및 피드백",
      description: "Google Gemini API로 학생 응답을 자동 분석하고 피드백을 제공합니다",
      emoji: "🤖",
      color: "from-green-500 to-teal-600",
      details: "사고 깊이와 창의성을 분석하여 맞춤형 개선점 제안"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Apple 스타일 배경 그라데이션 */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800"></div>
      <div className="fixed inset-0 bg-gradient-to-t from-transparent via-black/20 to-transparent"></div>
      
      {/* 마우스 따라다니는 광원 효과 */}
      <div 
        className="fixed w-96 h-96 bg-gradient-radial from-blue-500/20 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none transition-all duration-300"
        style={{
          left: mousePosition.x - 192,
          top: mousePosition.y - 192,
        }}
      ></div>

      {/* 히어로 섹션 */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-6xl mx-auto">
          {/* 메인 타이틀 */}
          <h1 
            ref={titleRef}
            className="text-6xl md:text-8xl lg:text-9xl font-thin mb-8 leading-none"
            style={{ fontFamily: 'SF Pro Display, -apple-system, sans-serif' }}
          >
            <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
              사고루틴
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              학습 플랫폼
            </span>
          </h1>

          {/* 서브타이틀 */}
          <p 
            ref={subtitleRef}
            className="text-xl md:text-2xl text-gray-300 mb-16 max-w-3xl mx-auto leading-relaxed"
          >
            사고루틴은 다양한 교육 상황에서<br />
            학생들의 <span className="text-blue-400">깊이 있는 사고</span>와 
            <span className="text-purple-400"> 창의적 표현</span>을 이끌어냅니다.
          </p>

          {/* Apple 스타일 버튼들 */}
          <div ref={buttonsRef} className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              onClick={() => navigate('/teacher')}
              className="group relative px-12 py-6 bg-white text-black rounded-full text-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 group-hover:text-white transition-colors duration-300">
                교사로 시작하기
              </div>
            </button>
            
            <button
              onClick={() => navigate('/student')}
              className="group relative px-12 py-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              학생으로 참여하기
            </button>
          </div>

          {/* 스크롤 인디케이터 */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-gray-400 animate-bounce">
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm">더 알아보기</span>
              <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
                <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 사고루틴 가이드 섹션 */}
      <section ref={guideRef} className="relative py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="animate-text text-5xl md:text-6xl font-thin mb-8 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              사고루틴이란?
            </h2>
            <p className="animate-text text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              하버드 대학교 Project Zero에서 개발한 사고루틴으로<br />
              <span className="text-blue-400 font-medium">비판적 사고력</span>, 
              <span className="text-purple-400 font-medium"> 창의적 문제해결능력</span>, 
              <span className="text-pink-400 font-medium"> 메타인지 능력</span>을<br />
              체계적으로 기를 수 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {thinkingRoutines.map((routine, index) => (
              <div
                key={routine.id}
                ref={addToRefs}
                className="group relative bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl rounded-3xl border border-gray-700/50 overflow-hidden cursor-pointer transition-all duration-500 hover:border-gray-600/70"
                style={{ perspective: '1000px' }}
                onClick={() => {
                  setSelectedRoutine(routine);
                  setIsModalOpen(true);
                }}
              >
                {/* 카드 그라데이션 배경 */}
                <div className={`card-gradient absolute inset-0 bg-gradient-to-br ${routine.color} opacity-0 transition-all duration-500`}></div>
                
                {/* 글래스모피즘 오버레이 */}
                <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
                
                {/* 카드 내용 */}
                <div className="relative p-8 h-full flex flex-col">
                  {/* 헤더 */}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-semibold text-white mb-2 leading-tight">
                      {routine.title}
                    </h3>
                    <p className="text-gray-300 font-medium">
                      {routine.subtitle}
                    </p>
                  </div>

                  {/* 설명 */}
                  <p className="text-gray-400 text-center mb-6 leading-relaxed flex-grow">
                    {routine.longDescription}
                  </p>

                  {/* 단계들 */}
                  <div className="space-y-3">
                    {routine.steps.map((step, stepIndex) => (
                      <div
                        key={stepIndex}
                        className="flex items-center p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
                      >
                        <div className="flex-1">
                          <div className="text-white font-medium text-sm">{step.name}</div>
                          <div className="text-gray-400 text-xs">{step.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 호버시 나타나는 상세 정보 */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                    <div className="text-center">
                      <p className="text-sm text-gray-300 mb-4">활용 상황</p>
                      <p className="text-white font-medium">{routine.usage}</p>
                    </div>
                  </div>
                </div>

                {/* 호버 시 빛나는 테두리 효과 */}
                <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-white/20 transition-all duration-500 pointer-events-none"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 기능 섹션 */}
      <section className="relative py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="animate-text text-4xl md:text-5xl font-thin mb-8 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              주요 기능
            </h2>
            <p className="animate-text text-xl text-gray-400 max-w-2xl mx-auto">
              교사와 학생 모두를 위한<br />
              강력하고 직관적인 기능들입니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                ref={addToFeatureRefs}
                className="group relative bg-gradient-to-br from-gray-900/40 to-gray-800/20 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8 text-center transition-all duration-500 hover:border-gray-600/70 hover:bg-gray-800/30"
              >
                {/* 아이콘 */}
                <div className={`w-20 h-20 bg-gradient-to-r ${feature.color} rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-3xl filter drop-shadow-lg">{feature.emoji}</span>
                </div>

                {/* 제목 */}
                <h3 className="text-2xl font-semibold text-white mb-4 group-hover:text-blue-400 transition-colors duration-300">
                  {feature.title}
                </h3>

                {/* 설명 */}
                <p className="text-gray-400 mb-4 leading-relaxed">
                  {feature.description}
                </p>

                {/* 세부사항 */}
                <p className="text-sm text-gray-500 group-hover:text-gray-300 transition-colors duration-300">
                  {feature.details}
                </p>

                {/* 호버 효과 */}
                <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-white/10 transition-all duration-500 pointer-events-none"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 빠른 시작 가이드 섹션 */}
      <section className="relative py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="animate-text text-4xl md:text-5xl font-thin mb-8 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              빠른 시작 가이드
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* 교사용 가이드 */}
            <div className="bg-gradient-to-br from-gray-900/60 to-gray-800/40 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-white font-bold">교</span>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">교사는 이렇게!</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-1">1</div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-left">접속</p>
                    <p className="text-gray-400 text-sm text-left">thinking-routines.vercel.app → 교사용 클릭</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-1">2</div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-left">회원가입/로그인</p>
                    <p className="text-gray-400 text-sm text-left">이메일과 비밀번호로 간편 가입</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-1">3</div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-left">활동방 생성</p>
                    <p className="text-gray-400 text-sm text-left">"새 활동방 만들기" → 사고루틴 선택 → 6자리 코드 생성</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-1">4</div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-left">학생 참여</p>
                    <p className="text-gray-400 text-sm text-left">생성된 코드를 학생들에게 공유</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-1">5</div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-left">실시간 모니터링</p>
                    <p className="text-gray-400 text-sm text-left">학생 응답을 실시간으로 확인하고 AI 피드백 받기</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 학생용 가이드 */}
            <div className="bg-gradient-to-br from-gray-900/60 to-gray-800/40 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-white font-bold">학</span>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">학생은 이렇게!</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-1">1</div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-left">접속</p>
                    <p className="text-gray-400 text-sm text-left">thinking-routines.vercel.app → 학생용 클릭</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-1">2</div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-left">코드 입력</p>
                    <p className="text-gray-400 text-sm text-left">교사가 제공한 6자리 코드 입력</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-1">3</div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-left">이름 입력</p>
                    <p className="text-gray-400 text-sm text-left">본인 이름 입력 후 활동 시작</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-1">4</div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-left">사고루틴 수행</p>
                    <p className="text-gray-400 text-sm text-left">3단계를 순서대로 진행 (🎤 음성 입력 지원!)</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-1">5</div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-left">제출 완료</p>
                    <p className="text-gray-400 text-sm text-left">모든 단계 완료 후 제출하면 포트폴리오에 자동 저장</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 시작 버튼들 */}
          <div className="text-center mt-16">
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button
                onClick={() => navigate('/teacher')}
                className="group relative px-12 py-6 bg-white text-black rounded-full text-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 group-hover:text-white transition-colors duration-300">
                  교사로 시작하기
                </div>
              </button>
              
              <button
                onClick={() => navigate('/student')}
                className="group relative px-12 py-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                학생으로 참여하기
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 사고루틴 상세 모달 */}
      {isModalOpen && selectedRoutine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8">
            {/* 닫기 버튼 */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors duration-200"
            >
              ✕
            </button>

            {/* 모달 헤더 */}
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-white mb-2">{selectedRoutine.title}</h2>
              <p className="text-xl text-gray-300">{selectedRoutine.subtitle}</p>
              <p className="text-gray-400 mt-4 leading-relaxed">{selectedRoutine.longDescription}</p>
            </div>

            {/* 단계별 상세 설명 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {selectedRoutine.steps.map((step: any, index: number) => (
                <div key={index} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-semibold text-white mb-2">{step.name}</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-blue-400 font-medium mb-2">💡 목표</h4>
                      <p className="text-gray-300 text-sm">{step.description}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-purple-400 font-medium mb-2">❓ 질문 예시</h4>
                      <p className="text-gray-300 text-sm">
                        {step.name === 'SEE' && '"이 자료에서 무엇을 보았나요?"'}
                        {step.name === 'THINK' && '"이것에 대해 어떻게 생각하나요?"'}
                        {step.name === 'WONDER' && '"이것에 대해 무엇이 궁금한가요?"'}
                        {step.name === 'CONNECT' && '"이 내용이 이미 알고 있는 것과 어떻게 연결되나요?"'}
                        {step.name === 'CHALLENGE' && '"이 내용에서 어떤 아이디어나 가정에 도전하고 싶나요?"'}
                        {step.name === 'CONCEPTS' && '"이 내용에서 중요하다고 생각하는 핵심 개념은 무엇인가요?"'}
                        {step.name === 'CHANGES' && '"이 내용이 당신이나 다른 사람들에게 어떤 변화를 제안하나요?"'}
                        {step.name === 'VIEWPOINTS' && '"이 주제에 대해 다양한 관점을 가질 수 있는 사람들은 누구인가요?"'}
                        {step.name === 'PERSPECTIVE' && '"선택한 관점에서 이 주제를 어떻게 바라볼까요?"'}
                        {step.name === 'QUESTIONS' && '"이 관점에서 가질 수 있는 질문은 무엇인가요?"'}
                        {step.name === 'EXTEND' && '"이 내용이 당신의 생각을 어떻게 확장시켰나요?"'}
                        {step.name === 'DEFINITION' && '"이 개념을 어떻게 정의하겠나요?"'}
                        {step.name === 'CHARACTERISTICS' && '"이 개념의 주요 특징은 무엇인가요?"'}
                        {step.name === 'EXAMPLES' && '"이 개념의 예시와 반례는 무엇인가요?"'}
                        {step.name === 'USED TO THINK' && '"이 주제에 대해 이전에 어떻게 생각했나요?"'}
                        {step.name === 'NOW THINK' && '"지금은 어떻게 생각하나요?"'}
                        {step.name === 'WHY CHANGED' && '"생각이 바뀐 이유는 무엇인가요?"'}
                        {step.name === 'PUZZLE' && '"무엇이 퍼즐이나 의문점인가요?"'}
                        {step.name === 'EXPLORE' && '"이 퍼즐을 어떻게 탐구해보고 싶나요?"'}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-pink-400 font-medium mb-2">✍️ 작성 팁</h4>
                      <p className="text-gray-300 text-sm">
                        {step.name === 'SEE' && '"~이 보입니다", "~가 있습니다" 형태로 사실만 기술하세요.'}
                        {step.name === 'THINK' && '"~라고 생각합니다" 형태로 관찰한 근거를 바탕으로 추론하세요.'}
                        {step.name === 'WONDER' && '"~가 궁금합니다" 형태로 탐구하고 싶은 주제를 표현하세요.'}
                        {step.name === 'CONNECT' && '이전 학습, 경험, 지식과의 공통점이나 연관성을 찾아보세요.'}
                        {step.name === 'CHALLENGE' && '당연하다고 여겨지는 것에 대해 의문을 제기해보세요.'}
                        {step.name === 'CONCEPTS' && '가장 중요한 개념이나 원리를 명확히 표현하세요.'}
                        {step.name === 'CHANGES' && '구체적이고 실행 가능한 변화 방안을 제시하세요.'}
                        {step.name === 'VIEWPOINTS' && '학생, 교사, 부모, 정부 등 다양한 입장의 사람들을 나열하세요.'}
                        {step.name === 'PERSPECTIVE' && '선택한 관점의 입장에서 생각하고 느낄 수 있는 내용을 표현하세요.'}
                        {step.name === 'QUESTIONS' && '해당 관점에서 중요하게 여길 만한 궁금증이나 우려사항을 작성하세요.'}
                        {step.name === 'EXTEND' && '새롭게 알게 된 점, 확장된 관점, 깊어진 이해를 표현하세요.'}
                        {step.name === 'DEFINITION' && '핵심적이고 정확한 정의를 간결하게 표현하세요.'}
                        {step.name === 'CHARACTERISTICS' && '해당 개념을 다른 개념과 구별하는 고유한 특성들을 나열하세요.'}
                        {step.name === 'EXAMPLES' && '긍정적 예시와 부정적 예시(반례)를 균형 있게 제시하세요.'}
                        {step.name === 'USED TO THINK' && '솔직하고 구체적으로 이전 생각이나 오해를 기술하세요.'}
                        {step.name === 'NOW THINK' && '새롭게 알게 된 내용, 바뀐 관점, 깊어진 이해를 표현하세요.'}
                        {step.name === 'WHY CHANGED' && '어떤 정보나 경험이 생각의 변화를 가져왔는지 구체적으로 설명하세요.'}
                        {step.name === 'PUZZLE' && '이해하기 어려운 부분, 모순되는 점, 더 알고 싶은 내용을 작성하세요.'}
                        {step.name === 'EXPLORE' && '실행 가능한 구체적인 탐구 방법이나 활동을 제안하세요.'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 교과별 활용 예시 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-2xl font-semibold text-white mb-4 text-center">📚 교과별 활용 예시</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedRoutine.title === 'See-Think-Wonder' && (
                  <>
                    <div>
                      <h4 className="text-blue-400 font-medium mb-2">🎨 미술 - 명화 감상</h4>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>• <strong>보기:</strong> 색채, 구도, 인물의 표정 등 객관적 관찰</li>
                        <li>• <strong>생각하기:</strong> 화가의 의도, 시대적 배경 추론</li>
                        <li>• <strong>궁금하기:</strong> 제작 기법, 영감의 원천에 대한 궁금증</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-green-400 font-medium mb-2">🧪 과학 - 실험 관찰</h4>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>• <strong>보기:</strong> 실험 현상의 구체적 관찰</li>
                        <li>• <strong>생각하기:</strong> 현상의 원리와 원인 추론</li>
                        <li>• <strong>궁금하기:</strong> 추가 실험이나 응용에 대한 호기심</li>
                      </ul>
                    </div>
                  </>
                )}
                
                {selectedRoutine.title === '4C' && (
                  <>
                    <div>
                      <h4 className="text-purple-400 font-medium mb-2">🏛️ 사회 - 역사 사건</h4>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>• <strong>연결:</strong> 현재 사회 문제와의 연관성</li>
                        <li>• <strong>도전:</strong> 기존 역사 해석에 대한 의문</li>
                        <li>• <strong>개념:</strong> 핵심 역사적 개념 파악</li>
                        <li>• <strong>변화:</strong> 현재에 적용할 수 있는 교훈</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-orange-400 font-medium mb-2">🧬 과학 - 생명과학</h4>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>• <strong>연결:</strong> 일상생활 속 생명현상</li>
                        <li>• <strong>도전:</strong> 과학적 가설에 대한 비판적 검토</li>
                        <li>• <strong>개념:</strong> 핵심 생물학적 원리</li>
                        <li>• <strong>변화:</strong> 건강한 생활습관 제안</li>
                      </ul>
                    </div>
                  </>
                )}
                
                {(selectedRoutine.title === 'Circle of Viewpoints') && (
                  <>
                    <div>
                      <h4 className="text-green-400 font-medium mb-2">📖 국어 - 소설 등장인물 분석</h4>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>• <strong>관점 탐색:</strong> 주인공, 조연, 작가, 독자의 관점</li>
                        <li>• <strong>관점 선택:</strong> 주인공의 입장에서 사건 바라보기</li>
                        <li>• <strong>관점별 질문:</strong> "주인공이라면 어떤 선택을 했을까?"</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-red-400 font-medium mb-2">⚖️ 윤리 - 도덕적 딜레마</h4>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>• <strong>관점 탐색:</strong> 당사자, 가족, 사회의 관점</li>
                        <li>• <strong>관점 선택:</strong> 특정 이해관계자 입장</li>
                        <li>• <strong>관점별 질문:</strong> 각 입장에서의 윤리적 고민</li>
                      </ul>
                    </div>
                  </>
                )}
                
                {/* 다른 사고루틴들도 비슷하게 추가 */}
                {!['See-Think-Wonder', '4C', 'Circle of Viewpoints'].includes(selectedRoutine.title) && (
                  <div className="col-span-full text-center">
                    <p className="text-gray-400">다양한 교과에서 활용 가능한 사고루틴입니다.</p>
                    <p className="text-gray-300 mt-2">상황에 맞게 적용해보세요!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 푸터 */}
      <footer className="relative py-16 px-4 border-t border-gray-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h4 className="text-2xl font-thin text-white mb-2">사고루틴<br />학습 플랫폼</h4>
            <p className="text-gray-400">하버드 Project Zero 기반 사고루틴 학습 플랫폼</p>
          </div>
          
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 mb-8">
            <a href="mailto:qo1598@dge.go.kr" className="text-gray-400 hover:text-white transition-colors duration-300">
              📧 qo1598@dge.go.kr
            </a>
          </div>

          <div className="text-gray-500 text-sm">
            © 2025 사고루틴 학습 플랫폼. 개발자: Bae.T
            <br />
            모든 사고루틴은 하버드 대학교 Project Zero의 연구 성과를 기반으로 합니다.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
