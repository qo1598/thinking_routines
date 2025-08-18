import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';

// GSAP 플러그인 등록
gsap.registerPlugin(ScrollTrigger, TextPlugin);

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

  // 마우스 트래킹 (Apple스러운 마그네틱 효과)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
      ScrollTrigger.normalizeScroll(true);
      
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
      title: "음성 입력 지원",
      description: "STT 기술로 편리하게 답변을 입력할 수 있습니다",
      emoji: "🎤",
      color: "from-blue-500 to-indigo-600",
      details: "브라우저 마이크 권한으로 음성을 텍스트로 자동 변환"
    },
    {
      title: "AI 피드백",
      description: "Google Gemini API로 지능형 학습 분석을 제공합니다",
      emoji: "🤖",
      color: "from-purple-500 to-pink-600",
      details: "사고 깊이와 창의성을 분석하여 개선점 제안"
    },
    {
      title: "실시간 학습",
      description: "교사와 학생이 실시간으로 상호작용할 수 있습니다",
      emoji: "📱",
      color: "from-green-500 to-teal-600",
      details: "6자리 코드로 즉시 참여하여 협력적 학습 경험"
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
              Think
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Routines
            </span>
          </h1>

          {/* 서브타이틀 */}
          <p 
            ref={subtitleRef}
            className="text-xl md:text-2xl text-gray-300 mb-16 max-w-3xl mx-auto leading-relaxed"
          >
            하버드 대학교 Project Zero에서 개발한 사고루틴으로<br />
            <span className="text-blue-400 font-medium">비판적 사고력</span>, 
            <span className="text-purple-400 font-medium"> 창의적 문제해결능력</span>, 
            <span className="text-pink-400 font-medium"> 메타인지 능력</span>을<br />
            체계적으로 기를 수 있습니다.
          </p>

          {/* Apple 스타일 버튼들 */}
          <div ref={buttonsRef} className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              onClick={() => navigate('/teacher')}
              className="group relative px-12 py-6 bg-white text-black rounded-full text-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 group-hover:text-white transition-colors duration-300 flex items-center gap-3">
                <span className="text-2xl">👨‍🏫</span>
                교사로 시작하기
              </div>
            </button>
            
            <button
              onClick={() => navigate('/student')}
              className="group relative px-12 py-6 border-2 border-white/30 rounded-full text-xl font-medium text-white transition-all duration-300 hover:scale-105 hover:border-white/60 hover:bg-white/10 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">👨‍🎓</span>
                학생으로 참여하기
              </div>
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
              7가지 사고루틴
            </h2>
            <p className="animate-text text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              각각의 사고루틴은 다양한 교육 상황에서<br />
              학생들의 <span className="text-blue-400">깊이 있는 사고</span>와 
              <span className="text-purple-400"> 창의적 표현</span>을 이끌어냅니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {thinkingRoutines.map((routine, index) => (
              <div
                key={routine.id}
                ref={addToRefs}
                className="group relative bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl rounded-3xl border border-gray-700/50 overflow-hidden cursor-pointer transition-all duration-500 hover:border-gray-600/70"
                style={{ perspective: '1000px' }}
              >
                {/* 카드 그라데이션 배경 */}
                <div className={`card-gradient absolute inset-0 bg-gradient-to-br ${routine.color} opacity-0 transition-all duration-500`}></div>
                
                {/* 글래스모피즘 오버레이 */}
                <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
                
                {/* 카드 내용 */}
                <div className="relative p-8 h-full flex flex-col">
                  {/* 카드 번호 */}
                  <div className="absolute top-6 right-6 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                    <span className="text-sm font-bold text-white/80">{routine.id}</span>
                  </div>

                  {/* 이모지와 헤더 */}
                  <div className="text-center mb-6">
                    <div className="text-5xl mb-4 filter drop-shadow-lg">{routine.emoji}</div>
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

                  {/* 적용 분야 태그들 */}
                  <div className="flex flex-wrap gap-2 mb-6 justify-center">
                    {routine.subjects.slice(0, 3).map((subject, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs text-white/80 border border-white/20"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>

                  {/* 단계들 */}
                  <div className="space-y-3">
                    {routine.steps.map((step, stepIndex) => (
                      <div
                        key={stepIndex}
                        className="flex items-center p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
                      >
                        <div className="text-lg mr-3">{step.color}</div>
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
              혁신적인 학습 경험
            </h2>
            <p className="animate-text text-xl text-gray-400 max-w-2xl mx-auto">
              최신 기술과 교육학적 통찰이 만나 만들어낸<br />
              차세대 학습 플랫폼입니다.
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

      {/* CTA 섹션 */}
      <section className="relative py-32 px-4">
        <div className="max-w-4xl mx-auto">
          <div 
            ref={ctaRef}
            className="relative bg-gradient-to-br from-gray-900/60 to-gray-800/40 backdrop-blur-xl rounded-[3rem] border border-gray-700/50 p-12 text-center overflow-hidden"
          >
            {/* 배경 그라데이션 효과 */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
            
            {/* 내용 */}
            <div className="relative z-10">
              <h3 className="text-4xl md:text-5xl font-thin mb-6 bg-gradient-to-r from-white via-blue-400 to-purple-400 bg-clip-text text-transparent">
                지금 바로 시작하세요
              </h3>
              <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
                체계적 사고력 향상과 창의적 학습 경험을<br />
                <span className="text-blue-400">thinking-routines.vercel.app</span>에서 만나보세요
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button
                  onClick={() => navigate('/teacher')}
                  className="group relative px-10 py-4 bg-white text-black rounded-full text-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10 group-hover:text-white transition-colors duration-300 flex items-center gap-3">
                    <span className="text-xl">👨‍🏫</span>
                    교사로 시작하기
                  </div>
                </button>
                
                <button
                  onClick={() => navigate('/student')}
                  className="group relative px-10 py-4 border-2 border-white/30 rounded-full text-lg font-medium text-white transition-all duration-300 hover:scale-105 hover:border-white/60 hover:bg-white/10 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">👨‍🎓</span>
                    학생으로 참여하기
                  </div>
                </button>
              </div>

              {/* 추가 정보 */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="text-gray-400">
                  <div className="text-2xl font-bold text-blue-400 mb-2">7가지</div>
                  <div className="text-sm">사고루틴</div>
                </div>
                <div className="text-gray-400">
                  <div className="text-2xl font-bold text-purple-400 mb-2">실시간</div>
                  <div className="text-sm">AI 피드백</div>
                </div>
                <div className="text-gray-400">
                  <div className="text-2xl font-bold text-pink-400 mb-2">6자리</div>
                  <div className="text-sm">간편 참여</div>
                </div>
              </div>
            </div>

            {/* 테두리 효과 */}
            <div className="absolute inset-0 rounded-[3rem] border-2 border-transparent bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 bg-clip-border"></div>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="relative py-16 px-4 border-t border-gray-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h4 className="text-2xl font-thin text-white mb-2">Think Routines</h4>
            <p className="text-gray-400">하버드 Project Zero 기반 사고루틴 학습 플랫폼</p>
          </div>
          
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 mb-8">
            <a href="mailto:qo1598@dge.go.kr" className="text-gray-400 hover:text-white transition-colors duration-300">
              📧 qo1598@dge.go.kr
            </a>
            <div className="text-gray-400">
              🔗 thinking-routines.vercel.app
            </div>
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
