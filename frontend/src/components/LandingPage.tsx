import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';

// GSAP 湲곕낯 ?ㅼ젙

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

  // 留덉슦???몃옒??(Apple?ㅻ윭??留덇렇?ㅽ떛 ?④낵)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // ESC ?ㅻ줈 紐⑤떖 ?リ린
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
      // ?섏씠吏 濡쒕뵫 ?좊땲硫붿씠??- Apple ?ㅽ???
      const loadingTimeline = gsap.timeline();

      // ?덉뼱濡??뱀뀡 洹뱀쟻???낆옣
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

      // ?⑤윺?숈뒪 諛곌꼍 ?④낵
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

      // 媛?대뱶 ?뱀뀡 - ?⑥씠釉??좊땲硫붿씠??
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

      // ?ш퀬猷⑦떞 移대뱶??- Apple ?ㅽ???3D ?뚮┰ ?좊땲硫붿씠??
      cardsRef.current.forEach((card, index) => {
        // 移대뱶 ?낆옣 ?좊땲硫붿씠??
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

        // ?ㅽ겕濡??⑤윺?숈뒪 ?④낵
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

        // 留덇렇?ㅽ떛 ?몃쾭 ?④낵 (Apple ?ㅽ???
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

        // 留덉슦???곕씪媛??誘몃쵖???吏곸엫
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

      // 湲곕뒫 ?뱀뀡??- ?ㅽ뀒嫄??좊땲硫붿씠??
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

      // CTA ?뱀뀡 - 洹뱀쟻???깆옣
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

      // ?띿뒪???좊땲硫붿씠??- ??댄븨 ?④낵
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

      // 遺?쒕윭???ㅽ겕濡??④낵 (Smooth Scrolling)
      // ?ㅽ겕濡??뺢퇋?붾뒗 湲곕낯 釉뚮씪?곗? ?숈옉 ?ъ슜
      
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
      subtitle: "蹂닿린-?앷컖?섍린-沅곴툑?섍린",
      description: "?덈줈??二쇱젣 ?먯깋, 愿李??λ젰 ?μ긽, ?멸린??媛쒕컻",
      longDescription: "媛앷???愿李곕줈 ?쒖옉?댁꽌 媛쒖씤???댁꽍怨??먭뎄 ?섏?濡?諛쒖쟾?쒗궎???ш퀬猷⑦떞",
      emoji: "?몓截?,
      color: "from-blue-500 to-indigo-600",
      darkColor: "from-blue-600 to-indigo-700",
      steps: [
        { name: "SEE", description: "媛앷???愿李곌낵 援ъ껜??臾섏궗", color: "?뮋" },
        { name: "THINK", description: "愿李?湲곕컲 ?댁꽍怨?遺꾩꽍", color: "?뮍" },
        { name: "WONDER", description: "?멸린?ш낵 ?먭뎄 ?섏? 媛쒕컻", color: "?뮏" }
      ],
      usage: "?덈줈??二쇱젣 ?먯깋, 愿李??λ젰 ?μ긽, ?멸린??媛쒕컻",
      subjects: ["誘몄닠", "怨쇳븰", "?ы쉶", "援?뼱"]
    },
    {
      id: 2,
      title: "4C",
      subtitle: "?곌껐-?꾩쟾-媛쒕뀗-蹂??,
      description: "源딆씠 ?덈뒗 遺꾩꽍, 鍮꾪뙋???ш퀬, 媛쒕뀗???댄빐",
      longDescription: "湲곗〈 吏?앷낵 ?곌껐?섍퀬, ?꾩쟾?섎ŉ, ?듭떖 媛쒕뀗???뚯븙??蹂?붾? ?쒖븞?섎뒗 ?ш퀬猷⑦떞",
      emoji: "?뵕",
      color: "from-purple-500 to-pink-600",
      darkColor: "from-purple-600 to-pink-700",
      steps: [
        { name: "CONNECT", description: "湲곗〈 吏?앷낵???곌껐怨좊━ 李얘린", color: "?뮋" },
        { name: "CHALLENGE", description: "鍮꾪뙋???ш퀬? ?섎Ц ?쒓린", color: "?ㅿ툘" },
        { name: "CONCEPTS", description: "?듭떖 媛쒕뀗怨??꾩씠?붿뼱 異붿텧", color: "?뮍" },
        { name: "CHANGES", description: "?ㅼ쿇???곸슜怨??됰룞 蹂??, color: "?뮏" }
      ],
      usage: "源딆씠 ?덈뒗 遺꾩꽍, 鍮꾪뙋???ш퀬, 媛쒕뀗???댄빐",
      subjects: ["泥좏븰", "?ы쉶", "怨쇳븰", "??궗"]
    },
    {
      id: 3,
      title: "Circle of Viewpoints",
      subtitle: "愿?먯쓽 ??,
      description: "?ㅼ뼇??愿???댄빐, 怨듦컧 ?λ젰 媛쒕컻, 媛덈벑 ?곹솴 遺꾩꽍",
      longDescription: "?ㅼ뼇???댄빐愿怨꾩옄??愿?먯뿉???곹솴??諛붾씪蹂대ŉ 怨듦컧 ?λ젰??湲곕Ⅴ???ш퀬猷⑦떞",
      emoji: "?봽",
      color: "from-green-500 to-teal-600",
      darkColor: "from-green-600 to-teal-700",
      steps: [
        { name: "VIEWPOINTS", description: "?ㅼ뼇???댄빐愿怨꾩옄 ?뚯븙", color: "?뮋" },
        { name: "PERSPECTIVE", description: "?뱀젙 愿?먯뿉?쒖쓽 源딆씠 ?덈뒗 ?댄빐", color: "?뮍" },
        { name: "QUESTIONS", description: "媛?愿?먯뿉???쒓린?????덈뒗 吏덈Ц 諛쒓껄", color: "?뮏" }
      ],
      usage: "?ㅼ뼇??愿???댄빐, 怨듦컧 ?λ젰 媛쒕컻, 媛덈벑 ?곹솴 遺꾩꽍",
      subjects: ["援?뼱", "?ы쉶", "?ㅻ━", "??궗"]
    },
    {
      id: 4,
      title: "Connect-Extend-Challenge",
      subtitle: "?곌껐-?뺤옣-?꾩쟾",
      description: "?숈뒿 ?댁슜 ?뺣━, ?ш퀬 ?뺤옣, 鍮꾪뙋??寃??,
      longDescription: "湲곗〈 吏?앷낵 ?곌껐?섍퀬 ?덈줈??愿?먯쑝濡??뺤옣?섎ŉ ?꾩쟾?곸쑝濡??ш퀬?섎뒗 猷⑦떞",
      emoji: "??",
      color: "from-orange-500 to-red-600",
      darkColor: "from-orange-600 to-red-700",
      steps: [
        { name: "CONNECT", description: "湲곗〈 吏?앷낵???곌껐", color: "?뮋" },
        { name: "EXTEND", description: "?덈줈???꾩씠?붿뼱??愿??諛쒓껄", color: "?뮍" },
        { name: "CHALLENGE", description: "鍮꾪뙋???ш퀬? ?섎Ц ?쒓린", color: "?ㅿ툘" }
      ],
      usage: "?숈뒿 ?댁슜 ?뺣━, ?ш퀬 ?뺤옣, 鍮꾪뙋??寃??,
      subjects: ["?섑븰", "怨쇳븰", "湲곗닠", "?덉닠"]
    },
    {
      id: 5,
      title: "Frayer Model",
      subtitle: "?꾨젅?댁뼱 紐⑤뜽",
      description: "媛쒕뀗 ?숈뒿, ?댄쐶 ?댄빐, 媛쒕뀗 援ъ“??,
      longDescription: "?뺤쓽, ?뱀쭠, ?덉떆瑜??듯빐 媛쒕뀗??泥닿퀎?곸쑝濡??댄빐?섎뒗 ?ш퀬猷⑦떞",
      emoji: "?뱴",
      color: "from-cyan-500 to-blue-600",
      darkColor: "from-cyan-600 to-blue-700",
      steps: [
        { name: "DEFINITION", description: "媛쒕뀗??紐낇솗???뺤쓽", color: "?뮋" },
        { name: "CHARACTERISTICS", description: "媛쒕뀗??二쇱슂 ?뱀꽦 ?뚯븙", color: "?뮍" },
        { name: "EXAMPLES", description: "援ъ껜???щ?瑜??듯븳 媛쒕뀗 ?댄빐", color: "?뮏" }
      ],
      usage: "媛쒕뀗 ?숈뒿, ?댄쐶 ?댄빐, 媛쒕뀗 援ъ“??,
      subjects: ["援?뼱", "?곸뼱", "怨쇳븰", "?섑븰"]
    },
    {
      id: 6,
      title: "I Used to Think... Now I Think...",
      subtitle: "?댁쟾 ?앷컖 - ?꾩옱 ?앷컖",
      description: "?숈뒿 ?꾪썑 蹂???뺤씤, 硫뷀??몄? 媛쒕컻, ?깆같 ?쒕룞",
      longDescription: "?숈뒿 ?꾪썑???앷컖 蹂?붾? ?뚯븘蹂대ŉ 硫뷀??몄? ?λ젰??湲곕Ⅴ???깆같???ш퀬猷⑦떞",
      emoji: "?쭬",
      color: "from-rose-500 to-pink-600",
      darkColor: "from-rose-600 to-pink-700",
      steps: [
        { name: "USED TO THINK", description: "?숈뒿 ???앷컖?대굹 ?좎엯寃??뺤씤", color: "?뮋" },
        { name: "NOW THINK", description: "?숈뒿 ??蹂?붾맂 ?앷컖 ?뺣━", color: "?뮍" },
        { name: "WHY CHANGED", description: "?ш퀬 蹂?붿쓽 洹쇨굅? 怨쇱젙 遺꾩꽍", color: "?뮏" }
      ],
      usage: "?숈뒿 ?꾪썑 蹂???뺤씤, 硫뷀??몄? 媛쒕컻, ?깆같 ?쒕룞",
      subjects: ["紐⑤뱺 援먭낵", "?깆같", "硫뷀??몄?"]
    },
    {
      id: 7,
      title: "Think-Puzzle-Explore",
      subtitle: "?앷컖-?쇱쫹-?먭뎄",
      description: "?먭뎄 ?쒕룞 ?쒖옉, 臾몄젣 ?몄떇, ?곌뎄 怨꾪쉷 ?섎┰",
      longDescription: "湲곗〈 吏?앹쓣 ?뺤씤?섍퀬 ?섎Ц?먯쓣 李얠븘 援ъ껜?곸씤 ?먭뎄 怨꾪쉷???몄슦???ш퀬猷⑦떞",
      emoji: "?㎥",
      color: "from-violet-500 to-purple-600",
      darkColor: "from-violet-600 to-purple-700",
      steps: [
        { name: "THINK", description: "二쇱젣?????湲곗〈 吏???뺤씤", color: "?뮋" },
        { name: "PUZZLE", description: "?섎Ц?먭낵 沅곴툑?????뚯븙", color: "?뮎" },
        { name: "EXPLORE", description: "援ъ껜?곸씤 ?먭뎄 怨꾪쉷 ?섎┰", color: "?뮍" }
      ],
      usage: "?먭뎄 ?쒕룞 ?쒖옉, 臾몄젣 ?몄떇, ?곌뎄 怨꾪쉷 ?섎┰",
      subjects: ["怨쇳븰", "?ы쉶", "?꾨줈?앺듃", "?곌뎄"]
    }
  ];

  const features = [
    {
      title: "?쒕룞諛??앹꽦 諛?愿由?,
      description: "?ㅼ뼇???ш퀬猷⑦떞?쇰줈 ?쒕룞諛⑹쓣 ?쎄쾶 留뚮뱾怨?愿由ы븷 ???덉뒿?덈떎",
      emoji: "?룧",
      color: "from-blue-500 to-indigo-600",
      details: "6?먮━ 肄붾뱶 ?앹꽦?쇰줈 ?숈깮?ㅼ쓽 媛꾪렪??李몄뿬 ?좊룄"
    },
    {
      title: "?ㅼ떆媛??숈깮 ?묐떟 ?뺤씤",
      description: "?숈깮?ㅼ쓽 ?ш퀬猷⑦떞 吏꾪뻾 ?곹솴???ㅼ떆媛꾩쑝濡?紐⑤땲?곕쭅?⑸땲??,
      emoji: "??",
      color: "from-purple-500 to-pink-600",
      details: "媛??④퀎蹂??묐떟 ?댁슜怨?吏꾪뻾瑜좎쓣 利됱떆 ?뺤씤"
    },
    {
      title: "AI 湲곕컲 遺꾩꽍 諛??쇰뱶諛?,
      description: "Google Gemini API濡??숈깮 ?묐떟???먮룞 遺꾩꽍?섍퀬 ?쇰뱶諛깆쓣 ?쒓났?⑸땲??,
      emoji: "?쨼",
      color: "from-green-500 to-teal-600",
      details: "?ш퀬 源딆씠? 李쎌쓽?깆쓣 遺꾩꽍?섏뿬 留욎땄??媛쒖꽑???쒖븞"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Apple ?ㅽ???諛곌꼍 洹몃씪?곗씠??*/}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800"></div>
      <div className="fixed inset-0 bg-gradient-to-t from-transparent via-black/20 to-transparent"></div>
      
      {/* 留덉슦???곕씪?ㅻ땲??愿묒썝 ?④낵 */}
      <div 
        className="fixed w-96 h-96 bg-gradient-radial from-blue-500/20 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none transition-all duration-300"
        style={{
          left: mousePosition.x - 192,
          top: mousePosition.y - 192,
        }}
      ></div>

      {/* ?덉뼱濡??뱀뀡 */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-6xl mx-auto">
          {/* 硫붿씤 ??댄? */}
          <h1 
            ref={titleRef}
            className="text-6xl md:text-8xl lg:text-9xl font-thin mb-8 leading-none"
            style={{ fontFamily: 'SF Pro Display, -apple-system, sans-serif' }}
          >
            <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
              ?ш퀬猷⑦떞
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              ?숈뒿 ?뚮옯??
            </span>
          </h1>

          {/* ?쒕툕??댄? */}
          <p 
            ref={subtitleRef}
            className="text-xl md:text-2xl text-gray-300 mb-16 max-w-3xl mx-auto leading-relaxed"
          >
            ?ш퀬猷⑦떞? ?ㅼ뼇??援먯쑁 ?곹솴?먯꽌<br />
            ?숈깮?ㅼ쓽 <span className="text-blue-400">源딆씠 ?덈뒗 ?ш퀬</span>? 
            <span className="text-purple-400"> 李쎌쓽???쒗쁽</span>???대걣?대깄?덈떎.
          </p>

          {/* Apple ?ㅽ???踰꾪듉??*/}
          <div ref={buttonsRef} className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              onClick={() => navigate('/teacher')}
              className="group relative px-12 py-6 bg-white text-black rounded-full text-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 group-hover:text-white transition-colors duration-300">
                援먯궗濡??쒖옉?섍린
              </div>
            </button>
            
            <button
              onClick={() => navigate('/student')}
              className="group relative px-12 py-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              ?숈깮?쇰줈 李몄뿬?섍린
            </button>
          </div>

          {/* ?ㅽ겕濡??몃뵒耳?댄꽣 */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-gray-400 animate-bounce">
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm">???뚯븘蹂닿린</span>
              <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
                <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ?ш퀬猷⑦떞 媛?대뱶 ?뱀뀡 */}
      <section ref={guideRef} className="relative py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="animate-text text-5xl md:text-6xl font-thin mb-8 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              ?ш퀬猷⑦떞?대??
            </h2>
            <p className="animate-text text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              ?섎쾭????숆탳 Project Zero?먯꽌 媛쒕컻???ш퀬猷⑦떞?쇰줈<br />
              <span className="text-blue-400 font-medium">鍮꾪뙋???ш퀬??/span>, 
              <span className="text-purple-400 font-medium"> 李쎌쓽??臾몄젣?닿껐?λ젰</span>, 
              <span className="text-pink-400 font-medium"> 硫뷀??몄? ?λ젰</span>??br />
              泥닿퀎?곸쑝濡?湲곕? ???덉뒿?덈떎.
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
                {/* 移대뱶 洹몃씪?곗씠??諛곌꼍 */}
                <div className={`card-gradient absolute inset-0 bg-gradient-to-br ${routine.color} opacity-0 transition-all duration-500`}></div>
                
                {/* 湲?섏뒪紐⑦뵾利??ㅻ쾭?덉씠 */}
                <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
                
                {/* 移대뱶 ?댁슜 */}
                <div className="relative p-8 h-full flex flex-col">
                  {/* ?ㅻ뜑 */}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-semibold text-white mb-2 leading-tight">
                      {routine.title}
                    </h3>
                    <p className="text-gray-300 font-medium">
                      {routine.subtitle}
                    </p>
                  </div>

                  {/* ?ㅻ챸 */}
                  <p className="text-gray-400 text-center mb-6 leading-relaxed flex-grow">
                    {routine.longDescription}
                  </p>

                  {/* ?④퀎??*/}
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

                  {/* ?몃쾭???섑??섎뒗 ?곸꽭 ?뺣낫 */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                    <div className="text-center">
                      <p className="text-sm text-gray-300 mb-4">?쒖슜 ?곹솴</p>
                      <p className="text-white font-medium">{routine.usage}</p>
                    </div>
                  </div>
                </div>

                {/* ?몃쾭 ??鍮쏅굹???뚮몢由??④낵 */}
                <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-white/20 transition-all duration-500 pointer-events-none"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 湲곕뒫 ?뱀뀡 */}
      <section className="relative py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="animate-text text-4xl md:text-5xl font-thin mb-8 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              二쇱슂 湲곕뒫
            </h2>
            <p className="animate-text text-xl text-gray-400 max-w-2xl mx-auto">
              援먯궗? ?숈깮 紐⑤몢瑜??꾪븳<br />
              媛뺣젰?섍퀬 吏곴??곸씤 湲곕뒫?ㅼ엯?덈떎.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                ref={addToFeatureRefs}
                className="group relative bg-gradient-to-br from-gray-900/40 to-gray-800/20 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8 text-center transition-all duration-500 hover:border-gray-600/70 hover:bg-gray-800/30"
              >
                {/* ?꾩씠肄?*/}
                <div className={`w-20 h-20 bg-gradient-to-r ${feature.color} rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-3xl filter drop-shadow-lg">{feature.emoji}</span>
                </div>

                {/* ?쒕ぉ */}
                <h3 className="text-2xl font-semibold text-white mb-4 group-hover:text-blue-400 transition-colors duration-300">
                  {feature.title}
                </h3>

                {/* ?ㅻ챸 */}
                <p className="text-gray-400 mb-4 leading-relaxed">
                  {feature.description}
                </p>

                {/* ?몃??ы빆 */}
                <p className="text-sm text-gray-500 group-hover:text-gray-300 transition-colors duration-300">
                  {feature.details}
                </p>

                {/* ?몃쾭 ?④낵 */}
                <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-white/10 transition-all duration-500 pointer-events-none"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 鍮좊Ⅸ ?쒖옉 媛?대뱶 ?뱀뀡 */}
      <section className="relative py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="animate-text text-4xl md:text-5xl font-thin mb-8 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              鍮좊Ⅸ ?쒖옉 媛?대뱶
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* 援먯궗??媛?대뱶 */}
            <div className="bg-gradient-to-br from-gray-900/60 to-gray-800/40 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-white font-bold">援?/span>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">援먯궗???대젃寃?</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-1">1</div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-left">?묒냽</p>
                    <p className="text-gray-400 text-sm text-left">thinking-routines.vercel.app ??援먯궗???대┃</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-1">2</div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-left">?뚯썝媛??濡쒓렇??/p>
                    <p className="text-gray-400 text-sm text-left">?대찓?쇨낵 鍮꾨?踰덊샇濡?媛꾪렪 媛??/p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-1">3</div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-left">?쒕룞諛??앹꽦</p>
                    <p className="text-gray-400 text-sm text-left">"???쒕룞諛?留뚮뱾湲? ???ш퀬猷⑦떞 ?좏깮 ??6?먮━ 肄붾뱶 ?앹꽦</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-1">4</div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-left">?숈깮 李몄뿬</p>
                    <p className="text-gray-400 text-sm text-left">?앹꽦??肄붾뱶瑜??숈깮?ㅼ뿉寃?怨듭쑀</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-1">5</div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-left">?ㅼ떆媛?紐⑤땲?곕쭅</p>
                    <p className="text-gray-400 text-sm text-left">?숈깮 ?묐떟???ㅼ떆媛꾩쑝濡??뺤씤?섍퀬 AI ?쇰뱶諛?諛쏄린</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ?숈깮??媛?대뱶 */}
            <div className="bg-gradient-to-br from-gray-900/60 to-gray-800/40 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-white font-bold">??/span>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">?숈깮? ?대젃寃?</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-1">1</div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-left">?묒냽</p>
                    <p className="text-gray-400 text-sm text-left">thinking-routines.vercel.app ???숈깮???대┃</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-1">2</div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-left">肄붾뱶 ?낅젰</p>
                    <p className="text-gray-400 text-sm text-left">援먯궗媛 ?쒓났??6?먮━ 肄붾뱶 ?낅젰</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-1">3</div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-left">?대쫫 ?낅젰</p>
                    <p className="text-gray-400 text-sm text-left">蹂몄씤 ?대쫫 ?낅젰 ???쒕룞 ?쒖옉</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-1">4</div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-left">?ш퀬猷⑦떞 ?섑뻾</p>
                    <p className="text-gray-400 text-sm text-left">3?④퀎瑜??쒖꽌?濡?吏꾪뻾 (?렎 ?뚯꽦 ?낅젰 吏??)</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-1">5</div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-left">?쒖텧 ?꾨즺</p>
                    <p className="text-gray-400 text-sm text-left">紐⑤뱺 ?④퀎 ?꾨즺 ???쒖텧?섎㈃ ?ы듃?대━?ㅼ뿉 ?먮룞 ???/p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ?쒖옉 踰꾪듉??*/}
          <div className="text-center mt-16">
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button
                onClick={() => navigate('/teacher')}
                className="group relative px-12 py-6 bg-white text-black rounded-full text-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 group-hover:text-white transition-colors duration-300">
                  援먯궗濡??쒖옉?섍린
                </div>
              </button>
              
              <button
                onClick={() => navigate('/student')}
                className="group relative px-12 py-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                ?숈깮?쇰줈 李몄뿬?섍린
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ?ш퀬猷⑦떞 ?곸꽭 紐⑤떖 */}
      {isModalOpen && selectedRoutine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8">
            {/* ?リ린 踰꾪듉 */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors duration-200"
            >
              ??
            </button>

            {/* 紐⑤떖 ?ㅻ뜑 */}
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-white mb-2">{selectedRoutine.title}</h2>
              <p className="text-xl text-gray-300">{selectedRoutine.subtitle}</p>
              <p className="text-gray-400 mt-4 leading-relaxed">{selectedRoutine.longDescription}</p>
            </div>

            {/* ?④퀎蹂??곸꽭 ?ㅻ챸 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {selectedRoutine.steps.map((step: any, index: number) => (
                <div key={index} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-semibold text-white mb-2">{step.name}</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-blue-400 font-medium mb-2">?뮕 紐⑺몴</h4>
                      <p className="text-gray-300 text-sm">{step.description}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-purple-400 font-medium mb-2">??吏덈Ц ?덉떆</h4>
                      <p className="text-gray-300 text-sm">
                        {step.name === 'SEE' && '"???먮즺?먯꽌 臾댁뾿??蹂댁븯?섏슂?"'}
                        {step.name === 'THINK' && '"?닿쾬??????대뼸寃??앷컖?섎굹??"'}
                        {step.name === 'WONDER' && '"?닿쾬?????臾댁뾿??沅곴툑?쒓???"'}
                        {step.name === 'CONNECT' && '"???댁슜???대? ?뚭퀬 ?덈뒗 寃껉낵 ?대뼸寃??곌껐?섎굹??"'}
                        {step.name === 'CHALLENGE' && '"???댁슜?먯꽌 ?대뼡 ?꾩씠?붿뼱??媛?뺤뿉 ?꾩쟾?섍퀬 ?띕굹??"'}
                        {step.name === 'CONCEPTS' && '"???댁슜?먯꽌 以묒슂?섎떎怨??앷컖?섎뒗 ?듭떖 媛쒕뀗? 臾댁뾿?멸???"'}
                        {step.name === 'CHANGES' && '"???댁슜???뱀떊?대굹 ?ㅻⅨ ?щ엺?ㅼ뿉寃??대뼡 蹂?붾? ?쒖븞?섎굹??"'}
                        {step.name === 'VIEWPOINTS' && '"??二쇱젣??????ㅼ뼇??愿?먯쓣 媛吏????덈뒗 ?щ엺?ㅼ? ?꾧뎄?멸???"'}
                        {step.name === 'PERSPECTIVE' && '"?좏깮??愿?먯뿉????二쇱젣瑜??대뼸寃?諛붾씪蹂쇨퉴??"'}
                        {step.name === 'QUESTIONS' && '"??愿?먯뿉??媛吏????덈뒗 吏덈Ц? 臾댁뾿?멸???"'}
                        {step.name === 'EXTEND' && '"???댁슜???뱀떊???앷컖???대뼸寃??뺤옣?쒖섟?섏슂?"'}
                        {step.name === 'DEFINITION' && '"??媛쒕뀗???대뼸寃??뺤쓽?섍쿋?섏슂?"'}
                        {step.name === 'CHARACTERISTICS' && '"??媛쒕뀗??二쇱슂 ?뱀쭠? 臾댁뾿?멸???"'}
                        {step.name === 'EXAMPLES' && '"??媛쒕뀗???덉떆? 諛섎???臾댁뾿?멸???"'}
                        {step.name === 'USED TO THINK' && '"??二쇱젣??????댁쟾???대뼸寃??앷컖?덈굹??"'}
                        {step.name === 'NOW THINK' && '"吏湲덉? ?대뼸寃??앷컖?섎굹??"'}
                        {step.name === 'WHY CHANGED' && '"?앷컖??諛붾??댁쑀??臾댁뾿?멸???"'}
                        {step.name === 'PUZZLE' && '"臾댁뾿???쇱쫹?대굹 ?섎Ц?먯씤媛??"'}
                        {step.name === 'EXPLORE' && '"???쇱쫹???대뼸寃??먭뎄?대낫怨??띕굹??"'}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-pink-400 font-medium mb-2">?랃툘 ?묒꽦 ??/h4>
                      <p className="text-gray-300 text-sm">
                        {step.name === 'SEE' && '"~??蹂댁엯?덈떎", "~媛 ?덉뒿?덈떎" ?뺥깭濡??ъ떎留?湲곗닠?섏꽭??'}
                        {step.name === 'THINK' && '"~?쇨퀬 ?앷컖?⑸땲?? ?뺥깭濡?愿李고븳 洹쇨굅瑜?諛뷀깢?쇰줈 異붾줎?섏꽭??'}
                        {step.name === 'WONDER' && '"~媛 沅곴툑?⑸땲?? ?뺥깭濡??먭뎄?섍퀬 ?띠? 二쇱젣瑜??쒗쁽?섏꽭??'}
                        {step.name === 'CONNECT' && '?댁쟾 ?숈뒿, 寃쏀뿕, 吏?앷낵??怨듯넻?먯씠???곌??깆쓣 李얠븘蹂댁꽭??'}
                        {step.name === 'CHALLENGE' && '?뱀뿰?섎떎怨??ш꺼吏??寃껋뿉 ????섎Ц???쒓린?대낫?몄슂.'}
                        {step.name === 'CONCEPTS' && '媛??以묒슂??媛쒕뀗?대굹 ?먮━瑜?紐낇솗???쒗쁽?섏꽭??'}
                        {step.name === 'CHANGES' && '援ъ껜?곸씠怨??ㅽ뻾 媛?ν븳 蹂??諛⑹븞???쒖떆?섏꽭??'}
                        {step.name === 'VIEWPOINTS' && '?숈깮, 援먯궗, 遺紐? ?뺣? ???ㅼ뼇???낆옣???щ엺?ㅼ쓣 ?섏뿴?섏꽭??'}
                        {step.name === 'PERSPECTIVE' && '?좏깮??愿?먯쓽 ?낆옣?먯꽌 ?앷컖?섍퀬 ?먮굜 ???덈뒗 ?댁슜???쒗쁽?섏꽭??'}
                        {step.name === 'QUESTIONS' && '?대떦 愿?먯뿉??以묒슂?섍쾶 ?ш만 留뚰븳 沅곴툑利앹씠???곕젮?ы빆???묒꽦?섏꽭??'}
                        {step.name === 'EXTEND' && '?덈∼寃??뚭쾶 ???? ?뺤옣??愿?? 源딆뼱吏??댄빐瑜??쒗쁽?섏꽭??'}
                        {step.name === 'DEFINITION' && '?듭떖?곸씠怨??뺥솗???뺤쓽瑜?媛꾧껐?섍쾶 ?쒗쁽?섏꽭??'}
                        {step.name === 'CHARACTERISTICS' && '?대떦 媛쒕뀗???ㅻⅨ 媛쒕뀗怨?援щ퀎?섎뒗 怨좎쑀???뱀꽦?ㅼ쓣 ?섏뿴?섏꽭??'}
                        {step.name === 'EXAMPLES' && '湲띿젙???덉떆? 遺?뺤쟻 ?덉떆(諛섎?)瑜?洹좏삎 ?덇쾶 ?쒖떆?섏꽭??'}
                        {step.name === 'USED TO THINK' && '?붿쭅?섍퀬 援ъ껜?곸쑝濡??댁쟾 ?앷컖?대굹 ?ㅽ빐瑜?湲곗닠?섏꽭??'}
                        {step.name === 'NOW THINK' && '?덈∼寃??뚭쾶 ???댁슜, 諛붾?愿?? 源딆뼱吏??댄빐瑜??쒗쁽?섏꽭??'}
                        {step.name === 'WHY CHANGED' && '?대뼡 ?뺣낫??寃쏀뿕???앷컖??蹂?붾? 媛?몄솕?붿? 援ъ껜?곸쑝濡??ㅻ챸?섏꽭??'}
                        {step.name === 'PUZZLE' && '?댄빐?섍린 ?대젮??遺遺? 紐⑥닚?섎뒗 ?? ???뚭퀬 ?띠? ?댁슜???묒꽦?섏꽭??'}
                        {step.name === 'EXPLORE' && '?ㅽ뻾 媛?ν븳 援ъ껜?곸씤 ?먭뎄 諛⑸쾿?대굹 ?쒕룞???쒖븞?섏꽭??'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 援먭낵蹂??쒖슜 ?덉떆 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-2xl font-semibold text-white mb-4 text-center">?뱴 援먭낵蹂??쒖슜 ?덉떆</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedRoutine.title === 'See-Think-Wonder' && (
                  <>
                    <div>
                      <h4 className="text-blue-400 font-medium mb-2">?렓 誘몄닠 - 紐낇솕 媛먯긽</h4>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>??<strong>蹂닿린:</strong> ?됱콈, 援щ룄, ?몃Ъ???쒖젙 ??媛앷???愿李?/li>
                        <li>??<strong>?앷컖?섍린:</strong> ?붽????섎룄, ?쒕???諛곌꼍 異붾줎</li>
                        <li>??<strong>沅곴툑?섍린:</strong> ?쒖옉 湲곕쾿, ?곴컧???먯쿇?????沅곴툑利?/li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-green-400 font-medium mb-2">?㎦ 怨쇳븰 - ?ㅽ뿕 愿李?/h4>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>??<strong>蹂닿린:</strong> ?ㅽ뿕 ?꾩긽??援ъ껜??愿李?/li>
                        <li>??<strong>?앷컖?섍린:</strong> ?꾩긽???먮━? ?먯씤 異붾줎</li>
                        <li>??<strong>沅곴툑?섍린:</strong> 異붽? ?ㅽ뿕?대굹 ?묒슜??????멸린??/li>
                      </ul>
                    </div>
                  </>
                )}
                
                {selectedRoutine.title === '4C' && (
                  <>
                    <div>
                      <h4 className="text-purple-400 font-medium mb-2">?룢截??ы쉶 - ??궗 ?ш굔</h4>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>??<strong>?곌껐:</strong> ?꾩옱 ?ы쉶 臾몄젣????곌???/li>
                        <li>??<strong>?꾩쟾:</strong> 湲곗〈 ??궗 ?댁꽍??????섎Ц</li>
                        <li>??<strong>媛쒕뀗:</strong> ?듭떖 ??궗??媛쒕뀗 ?뚯븙</li>
                        <li>??<strong>蹂??</strong> ?꾩옱???곸슜?????덈뒗 援먰썕</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-orange-400 font-medium mb-2">?㎚ 怨쇳븰 - ?앸챸怨쇳븰</h4>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>??<strong>?곌껐:</strong> ?쇱긽?앺솢 ???앸챸?꾩긽</li>
                        <li>??<strong>?꾩쟾:</strong> 怨쇳븰??媛?ㅼ뿉 ???鍮꾪뙋??寃??/li>
                        <li>??<strong>媛쒕뀗:</strong> ?듭떖 ?앸Ъ?숈쟻 ?먮━</li>
                        <li>??<strong>蹂??</strong> 嫄닿컯???앺솢?듦? ?쒖븞</li>
                      </ul>
                    </div>
                  </>
                )}
                
                {(selectedRoutine.title === 'Circle of Viewpoints') && (
                  <>
                    <div>
                      <h4 className="text-green-400 font-medium mb-2">?뱰 援?뼱 - ?뚯꽕 ?깆옣?몃Ъ 遺꾩꽍</h4>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>??<strong>愿???먯깋:</strong> 二쇱씤怨? 議곗뿰, ?묎?, ?낆옄??愿??/li>
                        <li>??<strong>愿???좏깮:</strong> 二쇱씤怨듭쓽 ?낆옣?먯꽌 ?ш굔 諛붾씪蹂닿린</li>
                        <li>??<strong>愿?먮퀎 吏덈Ц:</strong> "二쇱씤怨듭씠?쇰㈃ ?대뼡 ?좏깮???덉쓣源?"</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-red-400 font-medium mb-2">?뽳툘 ?ㅻ━ - ?꾨뜒???쒕젅留?/h4>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>??<strong>愿???먯깋:</strong> ?뱀궗?? 媛議? ?ы쉶??愿??/li>
                        <li>??<strong>愿???좏깮:</strong> ?뱀젙 ?댄빐愿怨꾩옄 ?낆옣</li>
                        <li>??<strong>愿?먮퀎 吏덈Ц:</strong> 媛??낆옣?먯꽌???ㅻ━??怨좊?</li>
                      </ul>
                    </div>
                  </>
                )}
                
                {/* ?ㅻⅨ ?ш퀬猷⑦떞?ㅻ룄 鍮꾩듂?섍쾶 異붽? */}
                {!['See-Think-Wonder', '4C', 'Circle of Viewpoints'].includes(selectedRoutine.title) && (
                  <div className="col-span-full text-center">
                    <p className="text-gray-400">?ㅼ뼇??援먭낵?먯꽌 ?쒖슜 媛?ν븳 ?ш퀬猷⑦떞?낅땲??</p>
                    <p className="text-gray-300 mt-2">?곹솴??留욊쾶 ?곸슜?대낫?몄슂!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ?명꽣 */}
      <footer className="relative py-16 px-4 border-t border-gray-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h4 className="text-2xl font-thin text-white mb-2">?ш퀬猷⑦떞<br />?숈뒿 ?뚮옯??/h4>
            <p className="text-gray-400">?섎쾭??Project Zero 湲곕컲 ?ш퀬猷⑦떞 ?숈뒿 ?뚮옯??/p>
          </div>
          
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 mb-8">
            <a href="mailto:qo1598@dge.go.kr" className="text-gray-400 hover:text-white transition-colors duration-300">
              ?벁 qo1598@dge.go.kr
            </a>
          </div>

          <div className="text-gray-500 text-sm">
            짤 2025 ?ш퀬猷⑦떞 ?숈뒿 ?뚮옯?? 媛쒕컻?? Bae.T
            <br />
            紐⑤뱺 ?ш퀬猷⑦떞? ?섎쾭????숆탳 Project Zero???곌뎄 ?깃낵瑜?湲곕컲?쇰줈 ?⑸땲??
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
