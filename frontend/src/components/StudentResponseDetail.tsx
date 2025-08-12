import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface ActivityRoom {
  id: string;
  title: string;
  description: string;
  thinking_routine_type: string;
  room_code: string;
  teacher_id: string;
  created_at: string;
  is_active: boolean;
}

interface RoutineTemplate {
  id: string;
  room_id: string;
  routine_type: string;
  content: {
    image_url: string;
    text_content: string;
    youtube_url: string;
    see_question: string;
    think_question: string;
    wonder_question: string;
    fourth_question?: string; // 4C의 Changes 단계용
  };
}

interface StudentResponse {
  id: string;
  student_grade?: string;
  student_name: string;
  student_class?: string;
  student_number?: number;
  team_name?: string;
  student_id: string;
  response_data: {
    see: string;
    think: string;
    wonder: string;
    fourth_step?: string; // 4C의 Changes 단계용
    [key: string]: string | undefined;
  };
  submitted_at: string;
  ai_analysis?: string;
  teacher_feedback?: string;
  teacher_score?: number;
}

const StudentResponseDetail: React.FC = () => {
  const { roomId, responseId } = useParams<{ roomId: string; responseId: string }>();
  const navigate = useNavigate();
  
  const [room, setRoom] = useState<ActivityRoom | null>(null);
  const [template, setTemplate] = useState<RoutineTemplate | null>(null);
  const [response, setResponse] = useState<StudentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  // Legacy fields - kept for backward compatibility but not used in new system
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [teacherFeedback, setTeacherFeedback] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [teacherScore, setTeacherScore] = useState<number | ''>('');
  const [savingFeedback, setSavingFeedback] = useState(false);

  // 새로운 교사 피드백 시스템을 위한 state
  const [currentAnalysisStep, setCurrentAnalysisStep] = useState(0);
  const [parsedAnalysis, setParsedAnalysis] = useState<{
    stepByStep: string;
    comprehensive: string;
    educational: string;
    individualSteps?: {[key: string]: string};
  } | null>(null);
  const [showTeacherFeedback, setShowTeacherFeedback] = useState(false);
  const [stepFeedbacks, setStepFeedbacks] = useState<{[key: string]: string}>({});
  const [stepScores, setStepScores] = useState<{[key: string]: number}>({});

  // 단계 네비게이션 함수들
  const nextAnalysisStep = () => {
    if (currentAnalysisStep < 2) {
      setCurrentAnalysisStep(currentAnalysisStep + 1);
    } else if (currentAnalysisStep === 2) {
      setShowTeacherFeedback(true);
    }
  };

  const prevAnalysisStep = () => {
    if (showTeacherFeedback) {
      setShowTeacherFeedback(false);
      setCurrentAnalysisStep(2);
    } else if (currentAnalysisStep > 0) {
      setCurrentAnalysisStep(currentAnalysisStep - 1);
    }
  };

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase || !roomId || !responseId) {
      setError('시스템 설정이 완료되지 않았습니다.');
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/teacher');
        return;
      }

      // 활동방 정보 조회
      const { data: roomData, error: roomError } = await supabase
        .from('activity_rooms')
        .select('*')
        .eq('id', roomId)
        .eq('teacher_id', session.user.id)
        .single();

      if (roomError) {
        console.error('Room fetch error:', roomError);
        setError('활동방을 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      setRoom(roomData);

      // 학생 응답 조회
      const { data: responseData, error: responseError } = await supabase
        .from('student_responses')
        .select('*')
        .eq('id', responseId)
        .eq('room_id', roomId)
        .single();

      if (responseError) {
        console.error('Response fetch error:', responseError);
        setError('학생 응답을 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      setResponse(responseData);
      // 기존 피드백과 점수를 입력창에 설정
      setTeacherFeedback(responseData.teacher_feedback || '');
      setTeacherScore(responseData.teacher_score !== null && responseData.teacher_score !== undefined ? responseData.teacher_score : '');

      // 기존 AI 분석 결과가 있으면 파싱
      if (responseData.ai_analysis) {
        try {
          const analysisData = JSON.parse(responseData.ai_analysis);
          if (analysisData.aiAnalysis) {
            // 새로운 JSON 형식인 경우
            setParsedAnalysis({
              stepByStep: analysisData.aiAnalysis.stepByStep || '',
              comprehensive: analysisData.aiAnalysis.comprehensive || '',
              educational: analysisData.aiAnalysis.educational || '',
              individualSteps: analysisData.aiAnalysis.individualSteps || {}
            });
            if (analysisData.teacherFeedback?.individualSteps) {
              // 기존 교사 피드백이 있으면 피드백 모드로, 없으면 분석 모드로
              const feedbacks: {[key: string]: string} = {};
              const scores: {[key: string]: number} = {};
              Object.entries(analysisData.teacherFeedback.individualSteps).forEach(([key, value]: [string, any]) => {
                feedbacks[key] = value.feedback || '';
                if (value.score) scores[key] = value.score;
              });
              setStepFeedbacks(feedbacks);
              setStepScores(scores);
              setShowTeacherFeedback(true);
            } else {
              // 교사 피드백이 없으면 분석 모드에서 시작
              setCurrentAnalysisStep(0);
              setShowTeacherFeedback(false);
            }
          } else {
            // 기존 텍스트 형식인 경우
            parseAnalysisResult(responseData.ai_analysis);
            setCurrentAnalysisStep(0);
            setShowTeacherFeedback(false);
          }
        } catch (error) {
          console.error('Failed to parse AI analysis:', error);
          // 파싱 실패 시 텍스트로 처리
          parseAnalysisResult(responseData.ai_analysis);
          setCurrentAnalysisStep(0);
          setShowTeacherFeedback(false);
        }
      }

      // 활동 템플릿 조회
      const { data: templateData, error: templateError } = await supabase
        .from('routine_templates')
        .select('*')
        .eq('room_id', roomId)
        .single();

      if (templateError && templateError.code !== 'PGRST116') {
        console.error('Template fetch error:', templateError);
      } else if (templateData) {
        setTemplate(templateData);
      }

      setLoading(false);
    } catch (err) {
      console.error('Fetch data error:', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  }, [roomId, responseId, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // AI 분석 결과를 단계별로 파싱 (ThinkingRoutineAnalysis와 동일)
  const parseAnalysisResult = (analysis: string) => {
    try {
      console.log('🔍 AI 분석 원본 텍스트:', analysis);
      console.log('🔍 AI 분석 타입:', typeof analysis);
      
      // JSON 형태인지 확인
      let parsedJson = null;
      try {
        parsedJson = typeof analysis === 'string' ? JSON.parse(analysis) : analysis;
        console.log('📦 JSON 파싱 결과:', parsedJson);
      } catch (e) {
        console.log('📝 JSON이 아닌 텍스트 형태로 처리');
      }
      
      // JSON 형태라면 JSON에서 추출
      if (parsedJson && parsedJson.analysis) {
        console.log('✅ JSON 형태의 분석 결과 감지');
        analysis = parsedJson.analysis;
        console.log('🔄 추출된 분석 텍스트:', analysis);
      }
      
      // 정규식을 사용하여 각 섹션을 추출 (ThinkingRoutineAnalysis와 동일)
      const stepByStepMatch = analysis.match(/## 1\. 각 단계별 분석([\s\S]*?)(?=## 2\.|$)/);
      const comprehensiveMatch = analysis.match(/## 2\. 종합 평가([\s\S]*?)(?=## 3\.|$)/);
      const educationalMatch = analysis.match(/## 3\. 교육적 권장사항([\s\S]*?)$/);
      const educationalMatch2 = analysis.match(/## 3\. 교육적 제안([\s\S]*?)$/);
      const finalEducationalMatch = educationalMatch || educationalMatch2;

      console.log('📝 각 섹션 매칭 결과:');
      console.log('- 1단계 매칭:', !!stepByStepMatch);
      console.log('- 2단계 매칭:', !!comprehensiveMatch);
      console.log('- 3단계 권장사항 매칭:', !!educationalMatch);
      console.log('- 3단계 제안 매칭:', !!educationalMatch2);
      console.log('- 최종 3단계 매칭:', !!finalEducationalMatch);
      console.log('- 교육적 제안/권장사항 텍스트:', finalEducationalMatch ? finalEducationalMatch[0] : 'null');

      // 개별 단계별 분석 추출 (ThinkingRoutineAnalysis와 동일)
      const individualSteps: {[key: string]: string} = {};
      
      if (stepByStepMatch) {
        const stepByStepContent = stepByStepMatch[1].trim();
        console.log('🔍 1단계 상세 내용:', stepByStepContent);
        console.log('🎯 현재 사고루틴 유형:', template?.routine_type || room?.thinking_routine_type);
        
        // 사고루틴 유형별 단계 정의
        const routineStepPatterns: {[key: string]: {[key: string]: RegExp[]}} = {
          'see-think-wonder': {
            'see': [
              /###\s*See\s*[\(（]?보기[\)）]?([\s\S]*?)(?=###|$)/i,
              /###\s*보기\s*([\s\S]*?)(?=###|$)/i
            ],
            'think': [
              /###\s*Think\s*[\(（]?생각하기[\)）]?([\s\S]*?)(?=###|$)/i,
              /###\s*생각하기\s*([\s\S]*?)(?=###|$)/i
            ],
            'wonder': [
              /###\s*Wonder\s*[\(（]?궁금하기[\)）]?([\s\S]*?)(?=###|$)/i,
              /###\s*궁금하기\s*([\s\S]*?)(?=###|$)/i
            ]
          },
          '4c': {
            'connect': [/###\s*Connect\s*[\(（]?연결[\)）]?([\s\S]*?)(?=###|$)/i],
            'challenge': [/###\s*Challenge\s*[\(（]?도전[\)）]?([\s\S]*?)(?=###|$)/i],
            'concepts': [/###\s*Concepts?\s*[\(（]?개념[\)）]?([\s\S]*?)(?=###|$)/i],
            'changes': [/###\s*Changes?\s*[\(（]?변화[\)）]?([\s\S]*?)(?=###|$)/i]
          },
          'frayer-model': {
            'definition': [
              /###\s*Definition\s*[\(（]?정의[\)）]?([\s\S]*?)(?=###|$)/i,
              /###\s*정의\s*([\s\S]*?)(?=###|$)/i
            ],
            'characteristics': [
              /###\s*Characteristics\s*[\(（]?특징[\)）]?([\s\S]*?)(?=###|$)/i,
              /###\s*특징\s*([\s\S]*?)(?=###|$)/i
            ],
            'examples': [
              /###\s*Examples?\s*&?\s*Non-Examples?\s*[\(（]?예시\s*와?\s*반례[\)）]?([\s\S]*?)(?=###|$)/i,
              /###\s*예시\s*와?\s*반례\s*([\s\S]*?)(?=###|$)/i
            ]
          },
          'circle-of-viewpoints': {
            'viewpoint': [/###\s*Viewpoint\s*[\(（]?관점[\)）]?([\s\S]*?)(?=###|$)/i],
            'perspective': [/###\s*Perspective\s*[\(（]?시각[\)）]?([\s\S]*?)(?=###|$)/i]
          },
          'connect-extend-challenge': {
            'connect': [/###\s*Connect\s*[\(（]?연결[\)）]?([\s\S]*?)(?=###|$)/i],
            'extend': [/###\s*Extend\s*[\(（]?확장[\)）]?([\s\S]*?)(?=###|$)/i],
            'challenge': [/###\s*Challenge\s*[\(（]?도전[\)）]?([\s\S]*?)(?=###|$)/i]
          },
          'used-to-think-now-think': {
            'used-to-think': [/###\s*Used\s*to\s*Think\s*[\(（]?이전\s*생각[\)）]?([\s\S]*?)(?=###|$)/i],
            'now-think': [/###\s*Now\s*Think\s*[\(（]?현재\s*생각[\)）]?([\s\S]*?)(?=###|$)/i]
          },
          'think-puzzle-explore': {
            'think': [/###\s*Think\s*[\(（]?생각[\)）]?([\s\S]*?)(?=###|$)/i],
            'puzzle': [/###\s*Puzzle\s*[\(（]?퍼즐[\)）]?([\s\S]*?)(?=###|$)/i],
            'explore': [/###\s*Explore\s*[\(（]?탐구[\)）]?([\s\S]*?)(?=###|$)/i]
          }
        };
        
        // 현재 활동방의 사고루틴 유형 확인
        const currentRoutineType = template?.routine_type || room?.thinking_routine_type || 'see-think-wonder';
        const stepPatterns = routineStepPatterns[currentRoutineType] || routineStepPatterns['see-think-wonder'];
        
        console.log('🎯 사용할 단계 패턴:', Object.keys(stepPatterns));
        
        // 해당 사고루틴 유형의 단계들만 파싱
        Object.entries(stepPatterns).forEach(([stepKey, patterns]) => {
          for (const pattern of patterns) {
            const match = stepByStepContent.match(pattern);
            if (match) {
              individualSteps[stepKey] = match[1].trim();
              console.log(`✅ ${stepKey} 단계 매칭 성공`);
              break;
            }
          }
        });
        
        console.log('🎯 최종 매칭된 단계들:', Object.keys(individualSteps));
      }

      const finalParsedData = {
        stepByStep: stepByStepMatch ? stepByStepMatch[1].trim() : '',
        comprehensive: comprehensiveMatch ? comprehensiveMatch[1].trim() : '',
        educational: finalEducationalMatch ? finalEducationalMatch[1].trim() : '',
        individualSteps
      };

      console.log('✅ 최종 파싱 결과:', finalParsedData);
      console.log('🎯 개별 단계 개수:', Object.keys(individualSteps).length);

      setParsedAnalysis(finalParsedData);

      // AI 분석이 완료되면 4단계 분석 결과부터 단계별로 시작
      setCurrentAnalysisStep(0);
      setShowTeacherFeedback(false);
    } catch (error) {
      console.error('Analysis parsing error:', error);
      // 파싱 실패 시 전체 텍스트를 첫 번째 단계로 표시
      setParsedAnalysis({
        stepByStep: analysis,
        comprehensive: '',
        educational: '',
        individualSteps: {}
      });
      setCurrentAnalysisStep(0);
      setShowTeacherFeedback(false);
    }
  };


  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : null;
  };

  // 마크다운 텍스트를 HTML로 변환하는 함수
  const formatMarkdownText = (text: string) => {
    // ## 숫자. 제목으로 섹션을 나누기
    const sections = text.split(/(?=## \d+\.)/);
    
    const formatSection = (section: string) => {
      return section
        // ## 숫자. 제목 형식 처리 (예: ## 1. 각 단계별 분석)
        .replace(/## (\d+)\. (.*?)(?=\n|$)/g, '<h3 class="text-xl font-bold text-purple-800 mb-4 pb-2 border-b-2 border-purple-200">$1. $2</h3>')
        // ### 제목 -> 중간 제목
        .replace(/### (.*?)(?=\n|$)/g, '<h4 class="text-lg font-semibold text-gray-900 mt-6 mb-3 text-purple-700">$1</h4>')
        // **강조:** 형식 처리 (콜론 제거)
        .replace(/\*\*(.*?):\*\*/g, '<div class="mt-4 mb-2"><span class="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">$1</span></div>')
        // **일반 강조** 처리
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
        // - 리스트 항목 처리 (더 예쁜 불릿 포인트)
        .replace(/^- (.*?)$/gm, '<div class="flex items-start mb-2"><span class="text-purple-500 mr-2 mt-1">•</span><span class="text-gray-700">$1</span></div>')
        // 빈 줄을 단락으로 처리
        .replace(/\n\n/g, '</p><p class="mb-4">')
        // 단일 줄바꿈을 <br>로 처리
        .replace(/\n/g, '<br/>')
        // 전체를 단락으로 감싸기
        .replace(/^/, '<p class="mb-4">')
        .replace(/$/, '</p>');
    };

    return sections.map((section, index) => {
      if (!section.trim()) return '';
      
      return `<div class="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
        ${formatSection(section)}
      </div>`;
    }).join('');
  };

  // 사고루틴별 AI 분석 프롬프트 생성
  const generateAIPrompt = (routineType: string, response: StudentResponse, template: RoutineTemplate) => {
    const basePrompt = `당신은 사고루틴(Thinking Routines) 교육 전문가입니다. 
교사의 평가 보조 수단으로 활용될 분석과 피드백을 제공하는 것이 당신의 핵심 역할입니다.

**교사 활용을 위한 중요 지침:**
1. 객관적이고 구체적인 분석 제공
2. 교사가 점수를 매길 때 참고할 수 있는 명확한 근거 제시
3. 학생 개별 지도를 위한 실용적 조언 포함
4. 긍정적이면서도 정확한 평가 유지

**응답 품질 평가 기준:**
1. **내용의 적절성**: 각 단계의 목적에 맞는 응답인가?
2. **구체성**: 추상적이지 않고 구체적인 내용인가?
3. **논리적 연결**: 단계들이 논리적으로 연결되는가?
4. **깊이**: 표면적이지 않고 깊이 있는 사고가 드러나는가?
5. **창의성**: 독창적이고 다양한 관점이 포함되어 있는가?`;

    const routineSpecificPrompts = {
      'see-think-wonder': `
**See-Think-Wonder 사고루틴 이해:**
- See(관찰): 학생이 주어진 자료에서 객관적으로 관찰한 내용
- Think(사고): 관찰한 내용을 바탕으로 한 학생의 해석, 추론, 연결
- Wonder(궁금증): 학생이 가지게 된 의문, 호기심, 탐구하고 싶은 점

**출력 형식:**
## 1. 각 단계별 분석
### See (관찰)
- [응답 품질 평가와 구체적 피드백 2-3줄]
### Think (사고)  
- [응답 품질 평가와 구체적 피드백 2-3줄]
### Wonder (궁금증)
- [응답 품질 평가와 구체적 피드백 2-3줄]`,

      '4c': `
**4C 사고루틴 이해:**
- Connect(연결): 새로운 정보를 기존 지식과 연결하는 능력
- Challenge(도전): 도전적이거나 논란이 될 수 있는 아이디어 식별
- Concepts(개념): 핵심 개념과 아이디어 파악
- Changes(변화): 태도나 사고, 행동의 변화 제안

**출력 형식:**
## 1. 각 단계별 분석
### Connect (연결)
- [연결 능력 평가와 구체적 피드백 2-3줄]
### Challenge (도전)
- [비판적 사고 능력 평가와 구체적 피드백 2-3줄]
### Concepts (개념)
- [핵심 개념 파악 능력 평가와 구체적 피드백 2-3줄]
### Changes (변화)
- [변화 제안 능력 평가와 구체적 피드백 2-3줄]`,

      'circle-of-viewpoints': `
**Circle of Viewpoints 사고루틴 이해:**
- Viewpoints(관점 탐색): 다양한 관점을 가질 수 있는 사람들 식별
- Perspective(관점 선택): 특정 관점에서 주제를 바라보기
- Questions(관점별 질문): 선택한 관점에서 제기할 수 있는 질문

**출력 형식:**
## 1. 각 단계별 분석
### Viewpoints (관점 탐색)
- [관점 다양성 평가와 구체적 피드백 2-3줄]
### Perspective (관점 선택)
- [관점 이해 능력 평가와 구체적 피드백 2-3줄]
### Questions (관점별 질문)
- [질문 생성 능력 평가와 구체적 피드백 2-3줄]`,

      'connect-extend-challenge': `
**Connect-Extend-Challenge 사고루틴 이해:**
- Connect(연결): 기존 지식과의 연결점 찾기
- Extend(확장): 생각을 확장하거나 발전시키기
- Challenge(도전): 의문점이나 도전적인 부분 제기

**출력 형식:**
## 1. 각 단계별 분석
### Connect (연결)
- [연결 능력 평가와 구체적 피드백 2-3줄]
### Extend (확장)
- [사고 확장 능력 평가와 구체적 피드백 2-3줄]
### Challenge (도전)
- [비판적 사고 능력 평가와 구체적 피드백 2-3줄]`,

      'frayer-model': `
**Frayer Model 사고루틴 이해:**
- Definition(정의): 개념의 명확한 정의
- Characteristics(특징): 개념의 핵심 특징들
- Examples & Non-Examples(예시와 반례): 구체적인 예시와 반례

**출력 형식:**
## 1. 각 단계별 분석
### Definition (정의)
- [정의 능력 평가와 구체적 피드백 2-3줄]
### Characteristics (특징)
- [특징 파악 능력 평가와 구체적 피드백 2-3줄]
### Examples & Non-Examples (예시와 반례)
- [예시 제시 능력 평가와 구체적 피드백 2-3줄]`,

      'used-to-think-now-think': `
**I Used to Think... Now I Think... 사고루틴 이해:**
- Used to Think(이전 생각): 학습 전 가지고 있던 생각
- Now Think(현재 생각): 학습 후 변화된 생각
- Why Changed(변화 이유): 생각이 변화한 이유와 과정

**출력 형식:**
## 1. 각 단계별 분석
### Used to Think (이전 생각)
- [이전 생각 표현 능력 평가와 구체적 피드백 2-3줄]
### Now Think (현재 생각)
- [현재 생각 표현 능력 평가와 구체적 피드백 2-3줄]
### Why Changed (변화 이유)
- [변화 성찰 능력 평가와 구체적 피드백 2-3줄]`,

      'think-puzzle-explore': `
**Think-Puzzle-Explore 사고루틴 이해:**
- Think(생각): 주제에 대해 알고 있다고 생각하는 내용
- Puzzle(퍼즐): 궁금하거나 의문스러운 점
- Explore(탐구): 퍼즐을 해결하기 위한 탐구 방법

**출력 형식:**
## 1. 각 단계별 분석
### Think (생각)
- [기존 지식 활용 능력 평가와 구체적 피드백 2-3줄]
### Puzzle (퍼즐)
- [의문 제기 능력 평가와 구체적 피드백 2-3줄]
### Explore (탐구)
- [탐구 계획 능력 평가와 구체적 피드백 2-3줄]`
    };

    const commonEnd = `
## 2. 종합 평가

**강점:**
- [구체적 강점과 근거 1-2개]

**개선점:**
- [명확한 개선점과 개선 방법 1-2개]

**교사 참고사항:**
- [점수 평가 시 고려할 요소들]

## 3. 교육적 권장사항

**다음 활동 제안:**
- [학생 수준에 맞는 구체적 제안 2-3개]

위 형식을 정확히 따라 작성해주세요.`;

    return basePrompt + (routineSpecificPrompts[routineType as keyof typeof routineSpecificPrompts] || routineSpecificPrompts['see-think-wonder']) + commonEnd;
  };

  const generateUserPrompt = (response: StudentResponse, template: RoutineTemplate) => {
    const routineType = template.routine_type;
    const baseInfo = `
**학생:** ${response.student_grade ? `${response.student_grade} ` : ''}${response.student_class ? `${response.student_class}반 ` : ''}${response.student_number ? `${response.student_number}번 ` : ''}${response.student_name}${response.team_name ? ` (${response.team_name})` : ''}

**교사 제공 자료:**
${template.content.image_url ? `- 이미지 자료 제공` : ''}
${template.content.text_content ? `- 텍스트: "${template.content.text_content}"` : ''}
${template.content.youtube_url ? `- 유튜브 영상 제공` : ''}

**학생 응답:**`;

    const responseFormats = {
      'see-think-wonder': `
- **See (관찰):** ${response.response_data.see}
- **Think (사고):** ${response.response_data.think}
- **Wonder (궁금증):** ${response.response_data.wonder}`,

      '4c': `
- **Connect (연결):** ${response.response_data.see}
- **Challenge (도전):** ${response.response_data.think}
- **Concepts (개념):** ${response.response_data.wonder}
- **Changes (변화):** ${response.response_data.fourth_step || ''}`,

      'circle-of-viewpoints': `
- **Viewpoints (관점 탐색):** ${response.response_data.see}
- **Perspective (관점 선택):** ${response.response_data.think}
- **Questions (관점별 질문):** ${response.response_data.wonder}`,

      'connect-extend-challenge': `
- **Connect (연결):** ${response.response_data.see}
- **Extend (확장):** ${response.response_data.think}
- **Challenge (도전):** ${response.response_data.wonder}`,

      'frayer-model': `
- **Definition (정의):** ${response.response_data.see}
- **Characteristics (특징):** ${response.response_data.think}
- **Examples & Non-Examples (예시와 반례):** ${response.response_data.wonder}`,

      'used-to-think-now-think': `
- **Used to Think (이전 생각):** ${response.response_data.see}
- **Now Think (현재 생각):** ${response.response_data.think}
- **Why Changed (변화 이유):** ${response.response_data.wonder}`,

      'think-puzzle-explore': `
- **Think (생각):** ${response.response_data.see}
- **Puzzle (퍼즐):** ${response.response_data.think}
- **Explore (탐구):** ${response.response_data.wonder}`
    };

    const responseFormat = responseFormats[routineType as keyof typeof responseFormats] || responseFormats['see-think-wonder'];
    
    return baseInfo + responseFormat + `

위 학생의 응답을 분석하고 교육적 피드백을 제공해주세요.`;
  };

  const handleAiAnalysis = async () => {
    if (!response || !template) return;

    // 응답 품질 검사
    const responseValues = [
      response.response_data.see?.trim() || '',
      response.response_data.think?.trim() || '',
      response.response_data.wonder?.trim() || ''
    ];

    // 4C의 경우 fourth_step도 포함
    if (template.routine_type === '4c' && response.response_data.fourth_step) {
      responseValues.push(response.response_data.fourth_step.trim());
    }
    
    // 극도로 성의 없는 응답 체크
    const isExtremelyLowQuality = 
      responseValues.every(r => r.length < 3) || // 모든 응답이 3글자 미만
      responseValues.some(r => /^\d+$/.test(r)) || // 숫자만 입력
      responseValues.some(r => /^[a-zA-Z]{1,2}$/.test(r)) || // 매우 짧은 영문자만
      responseValues.some(r => /^[ㄱ-ㅎㅏ-ㅣ]{1,2}$/.test(r)) || // 자음/모음만
      responseValues.some(r => /^[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]+$/.test(r)); // 특수문자만
    
    if (isExtremelyLowQuality) {
      alert('학생의 응답이 너무 간단합니다. 더 구체적인 응답을 작성하도록 안내해주세요.\n\nAI 분석은 의미 있는 응답에 대해서만 실행됩니다.');
      return;
    }

    setAiAnalyzing(true);
    try {
      // 사고루틴별 맞춤형 프롬프트 생성
      const systemPrompt = generateAIPrompt(template.routine_type, response, template);
      const userPrompt = generateUserPrompt(response, template);

      // Google Gemini API 호출
      console.log('AI 분석 요청 시작...');
      
      const apiResponse = await fetch('/api/gemini-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemPrompt,
          userPrompt,
          imageUrl: template.content.image_url,
          youtubeUrl: template.content.youtube_url
        })
      });

      console.log('API 응답 상태:', apiResponse.status);

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        console.error('API 오류 응답:', errorData);
        throw new Error(errorData.error || 'AI 분석 요청 실패');
      }

      const analysisResult = await apiResponse.json();
      console.log('분석 결과 수신:', analysisResult);
      
      if (!analysisResult.analysis) {
        throw new Error('AI 분석 결과가 없습니다');
      }
      
      const aiAnalysis = analysisResult.analysis;

      // 데이터베이스에 AI 분석 결과 저장
      const { error: updateError } = await supabase!
        .from('student_responses')
        .update({ ai_analysis: aiAnalysis })
        .eq('id', responseId);

      if (updateError) {
        console.error('AI analysis save error:', updateError);
        alert('AI 분석 결과 저장에 실패했습니다.');
        return;
      }

      setResponse(prev => prev ? { ...prev, ai_analysis: aiAnalysis } : null);
      
      // AI 분석 결과를 단계별로 파싱하고 즉시 단계별 모드로 전환
      parseAnalysisResult(aiAnalysis);
      setCurrentAnalysisStep(0);
      // 단계별 모드로 바로 전환하지 않고 parsedAnalysis가 설정되면 자동으로 단계별 모드가 활성화됨
      
      alert('AI 분석이 완료되었습니다!');
    } catch (err) {
      console.error('AI analysis error:', err);
      alert('AI 분석 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setAiAnalyzing(false);
    }
  };

  // 새로운 교사 피드백 저장 함수
  const handleFinalSave = async () => {
    if (!response || !parsedAnalysis) {
      alert('필수 정보가 없습니다.');
      return;
    }

    setSavingFeedback(true);
    try {
      // JSON 형식으로 분석 및 피드백 데이터 구조화
      const structuredAnalysis = {
        aiAnalysis: {
          stepByStep: parsedAnalysis?.stepByStep || '',
          comprehensive: parsedAnalysis?.comprehensive || '',
          educational: parsedAnalysis?.educational || '',
          individualSteps: parsedAnalysis?.individualSteps || {},
          analyzedAt: new Date().toISOString()
        },
        teacherFeedback: {
          // 개별 단계별 피드백 (새로운 방식)
          individualSteps: Object.keys(parsedAnalysis?.individualSteps || {}).reduce((acc, stepKey) => {
            acc[stepKey] = {
              feedback: stepFeedbacks[stepKey] || '',
              score: stepScores[stepKey] || null
            };
            return acc;
          }, {} as {[key: string]: {feedback: string, score: number | null}}),
          feedbackAt: new Date().toISOString()
        },
        routineInfo: {
          type: template?.routine_type || '',
          studentId: response.student_id
        }
      };

      const { error } = await supabase!
        .from('student_responses')
        .update({
          ai_analysis: JSON.stringify(structuredAnalysis),
          teacher_feedback: '', // 레거시 필드는 빈 값으로 유지
        })
        .eq('id', responseId);

      if (error) {
        console.error('Feedback save error:', error);
        alert('피드백 저장에 실패했습니다: ' + error.message);
        return;
      }

      // 로컬 상태 업데이트
      setResponse(prev => prev ? {
        ...prev,
        ai_analysis: JSON.stringify(structuredAnalysis)
      } : null);

      alert('교사 피드백이 저장되었습니다!');
    } catch (err) {
      console.error('Save feedback error:', err);
      alert('피드백 저장 중 오류가 발생했습니다.');
    } finally {
      setSavingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/teacher/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!room || !response) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">데이터를 찾을 수 없습니다.</p>
          <button
            onClick={() => navigate('/teacher/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/teacher/room/${roomId}`)}
                className="text-gray-600 hover:text-gray-900"
              >
                ← 활동방으로 돌아가기
              </button>
              <h1 className="text-2xl font-bold text-gray-900">학생 응답 상세</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 학생 정보 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {response.student_grade && <span className="text-lg">{response.student_grade} </span>}
                {response.student_class && <span className="text-lg">{response.student_class}반 </span>}
                {response.student_number && <span className="text-lg">{response.student_number}번 </span>}
                {response.student_name}
                {response.team_name && (
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2">
                    {response.team_name}
                  </span>
                )}
              </h2>
              <p className="text-sm text-gray-600">
                제출일: {new Date(response.submitted_at).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">활동방: {room.title}</p>
              <p className="text-sm text-gray-600">사고루틴: {(() => {
                const labels: { [key: string]: string } = {
                  'see-think-wonder': 'See-Think-Wonder',
                  '4c': '4C',
                  'circle-of-viewpoints': 'Circle of Viewpoints',
                  'connect-extend-challenge': 'Connect-Extend-Challenge',
                  'frayer-model': 'Frayer Model',
                  'used-to-think-now-think': 'I Used to Think... Now I Think...',
                  'think-puzzle-explore': 'Think-Puzzle-Explore'
                };
                return labels[room.thinking_routine_type] || room.thinking_routine_type;
              })()}</p>
            </div>
          </div>
        </div>

        {/* 교사 제공 자료 */}
        {template && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">교사 제공 자료</h3>
            <div className="space-y-4">
              {template.content.image_url && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">이미지</p>
                  <div className="flex justify-center">
                    <img
                      src={template.content.image_url}
                      alt="활동 이미지"
                      className="max-w-md max-h-64 rounded-lg shadow-sm"
                    />
                  </div>
                </div>
              )}
              
              {template.content.text_content && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">텍스트 내용</p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-900 whitespace-pre-wrap">{template.content.text_content}</p>
                  </div>
                </div>
              )}
              
              {template.content.youtube_url && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">유튜브 영상</p>
                  <div className="flex justify-center">
                    <div className="w-full max-w-2xl">
                      <div className="relative" style={{ paddingBottom: '56.25%' }}>
                        {(() => {
                          const embedUrl = getYouTubeEmbedUrl(template.content.youtube_url);
                          return embedUrl ? (
                            <iframe
                              src={embedUrl}
                              title="YouTube video"
                              className="absolute inset-0 w-full h-full rounded-lg"
                              allowFullScreen
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                              <p className="text-gray-600">유튜브 영상을 불러올 수 없습니다.</p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 질문들 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    {room.thinking_routine_type === 'see-think-wonder' && 'See 질문'}
                    {room.thinking_routine_type === '4c' && 'Connect 질문'}
                    {room.thinking_routine_type === 'circle-of-viewpoints' && 'Viewpoints 질문'}
                    {room.thinking_routine_type === 'connect-extend-challenge' && 'Connect 질문'}
                    {room.thinking_routine_type === 'frayer-model' && 'Definition 질문'}
                    {room.thinking_routine_type === 'used-to-think-now-think' && 'Used to Think 질문'}
                    {room.thinking_routine_type === 'think-puzzle-explore' && 'Think 질문'}
                  </p>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-gray-900">{template.content.see_question}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    {room.thinking_routine_type === 'see-think-wonder' && 'Think 질문'}
                    {room.thinking_routine_type === '4c' && 'Challenge 질문'}
                    {room.thinking_routine_type === 'circle-of-viewpoints' && 'Perspective 질문'}
                    {room.thinking_routine_type === 'connect-extend-challenge' && 'Extend 질문'}
                    {room.thinking_routine_type === 'frayer-model' && 'Characteristics 질문'}
                    {room.thinking_routine_type === 'used-to-think-now-think' && 'Now Think 질문'}
                    {room.thinking_routine_type === 'think-puzzle-explore' && 'Puzzle 질문'}
                  </p>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-gray-900">{template.content.think_question}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    {room.thinking_routine_type === 'see-think-wonder' && 'Wonder 질문'}
                    {room.thinking_routine_type === '4c' && 'Concepts 질문'}
                    {room.thinking_routine_type === 'circle-of-viewpoints' && 'Questions 질문'}
                    {room.thinking_routine_type === 'connect-extend-challenge' && 'Challenge 질문'}
                    {room.thinking_routine_type === 'frayer-model' && 'Examples 질문'}
                    {room.thinking_routine_type === 'used-to-think-now-think' && 'Why Changed 질문'}
                    {room.thinking_routine_type === 'think-puzzle-explore' && 'Explore 질문'}
                  </p>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-gray-900">{template.content.wonder_question}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 학생 응답 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">학생 응답</h3>
          <div className="space-y-6">
            {(() => {
              const routineType = template?.routine_type || 'see-think-wonder';
              const stepConfigs = {
                'see-think-wonder': [
                  { key: 'see', title: 'See', subtitle: '보기', color: 'bg-blue-500', bgColor: 'bg-blue-50', icon: 'S' },
                  { key: 'think', title: 'Think', subtitle: '생각하기', color: 'bg-green-500', bgColor: 'bg-green-50', icon: 'T' },
                  { key: 'wonder', title: 'Wonder', subtitle: '궁금하기', color: 'bg-purple-500', bgColor: 'bg-purple-50', icon: 'W' }
                ],
                '4c': [
                  { key: 'see', title: 'Connect', subtitle: '연결하기', color: 'bg-blue-500', bgColor: 'bg-blue-50', icon: 'C' },
                  { key: 'think', title: 'Challenge', subtitle: '도전하기', color: 'bg-red-500', bgColor: 'bg-red-50', icon: 'C' },
                  { key: 'wonder', title: 'Concepts', subtitle: '개념 파악', color: 'bg-green-500', bgColor: 'bg-green-50', icon: 'C' },
                  { key: 'fourth_step', title: 'Changes', subtitle: '변화 제안', color: 'bg-purple-500', bgColor: 'bg-purple-50', icon: 'C' }
                ],
                'circle-of-viewpoints': [
                  { key: 'see', title: 'Viewpoints', subtitle: '관점 탐색', color: 'bg-blue-500', bgColor: 'bg-blue-50', icon: 'V' },
                  { key: 'think', title: 'Perspective', subtitle: '관점 선택', color: 'bg-green-500', bgColor: 'bg-green-50', icon: 'P' },
                  { key: 'wonder', title: 'Questions', subtitle: '관점별 질문', color: 'bg-purple-500', bgColor: 'bg-purple-50', icon: 'Q' }
                ],
                'connect-extend-challenge': [
                  { key: 'see', title: 'Connect', subtitle: '연결하기', color: 'bg-blue-500', bgColor: 'bg-blue-50', icon: 'C' },
                  { key: 'think', title: 'Extend', subtitle: '확장하기', color: 'bg-green-500', bgColor: 'bg-green-50', icon: 'E' },
                  { key: 'wonder', title: 'Challenge', subtitle: '도전하기', color: 'bg-red-500', bgColor: 'bg-red-50', icon: 'C' }
                ],
                'frayer-model': [
                  { key: 'see', title: 'Definition', subtitle: '정의', color: 'bg-blue-500', bgColor: 'bg-blue-50', icon: 'D' },
                  { key: 'think', title: 'Characteristics', subtitle: '특징', color: 'bg-green-500', bgColor: 'bg-green-50', icon: 'C' },
                  { key: 'wonder', title: 'Examples & Non-Examples', subtitle: '예시와 반례', color: 'bg-purple-500', bgColor: 'bg-purple-50', icon: 'E' }
                ],
                'used-to-think-now-think': [
                  { key: 'see', title: 'Used to Think', subtitle: '이전 생각', color: 'bg-blue-500', bgColor: 'bg-blue-50', icon: 'U' },
                  { key: 'think', title: 'Now Think', subtitle: '현재 생각', color: 'bg-green-500', bgColor: 'bg-green-50', icon: 'N' },
                  { key: 'wonder', title: 'Why Changed', subtitle: '변화 이유', color: 'bg-purple-500', bgColor: 'bg-purple-50', icon: 'W' }
                ],
                'think-puzzle-explore': [
                  { key: 'see', title: 'Think', subtitle: '생각하기', color: 'bg-blue-500', bgColor: 'bg-blue-50', icon: 'T' },
                  { key: 'think', title: 'Puzzle', subtitle: '퍼즐', color: 'bg-yellow-500', bgColor: 'bg-yellow-50', icon: 'P' },
                  { key: 'wonder', title: 'Explore', subtitle: '탐구하기', color: 'bg-green-500', bgColor: 'bg-green-50', icon: 'E' }
                ]
              };

              const steps = stepConfigs[routineType as keyof typeof stepConfigs] || stepConfigs['see-think-wonder'];

              // Frayer Model의 경우 특별한 레이아웃 적용
              if (routineType === 'frayer-model') {
                return (
                  <div className="space-y-6">
                    {/* Definition */}
                    <div>
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">D</span>
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">Definition</h4>
                          <p className="text-sm text-gray-600">정의</p>
                        </div>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-gray-900 whitespace-pre-wrap">
                          {response.response_data.see || '응답 없음'}
                        </p>
                      </div>
                    </div>

                    {/* Characteristics */}
                    <div>
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">C</span>
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">Characteristics</h4>
                          <p className="text-sm text-gray-600">특징</p>
                        </div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-gray-900 whitespace-pre-wrap">
                          {response.response_data.think || '응답 없음'}
                        </p>
                      </div>
                    </div>

                    {/* Examples & Non-Examples */}
                    <div>
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">E</span>
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">Examples & Non-Examples</h4>
                          <p className="text-sm text-gray-600">예시와 반례</p>
                        </div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-green-600 font-bold">✓</span>
                              <span className="font-medium text-gray-900">예시 (Examples)</span>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <p className="text-gray-900 whitespace-pre-wrap">
                                {(() => {
                                  const wonderResponse = response.response_data.wonder || '';
                                  const parts = wonderResponse.split('||');
                                  return parts[0] || '응답 없음';
                                })()}
                              </p>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-red-600 font-bold">✗</span>
                              <span className="font-medium text-gray-900">반례 (Non-Examples)</span>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <p className="text-gray-900 whitespace-pre-wrap">
                                {(() => {
                                  const wonderResponse = response.response_data.wonder || '';
                                  const parts = wonderResponse.split('||');
                                  return parts[1] || '응답 없음';
                                })()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // 다른 사고루틴들의 기본 레이아웃
              return steps.map((step) => {
                const responseValue = response.response_data[step.key as keyof typeof response.response_data];
                if (!responseValue && step.key === 'fourth_step') return null; // 4단계가 없으면 표시하지 않음
                
                return (
                  <div key={step.key}>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`w-8 h-8 rounded-full ${step.color} flex items-center justify-center`}>
                        <span className="text-white font-bold text-sm">{step.icon}</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{step.title}</h4>
                        <p className="text-sm text-gray-600">{step.subtitle}</p>
                      </div>
                    </div>
                    <div className={`${step.bgColor} p-4 rounded-lg`}>
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {responseValue || '응답 없음'}
                      </p>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* AI 분석 및 교사 피드백 시스템 */}
        {!parsedAnalysis ? (
          /* AI 분석 실행 섹션 */
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">AI 분석 및 피드백</h3>
              <div className="flex space-x-2">
                <button
                  onClick={handleAiAnalysis}
                  disabled={aiAnalyzing}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {aiAnalyzing ? '분석 중...' : 'AI 분석 실행'}
                </button>
              </div>
            </div>
            
            {response.ai_analysis ? (
              <div className="space-y-4">
                <div 
                  className="prose prose-sm max-w-none text-gray-800 text-left"
                  dangerouslySetInnerHTML={{ __html: formatMarkdownText(response.ai_analysis) }}
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">AI 분석이 아직 실행되지 않았습니다.</p>
                <p className="text-sm text-gray-400 mt-2">위의 버튼을 클릭하여 AI 분석을 실행하세요.</p>
              </div>
            )}
          </div>
        ) : (
          /* 새로운 AI 분석 결과 표시 시스템 */
          <div className="space-y-6">
            {/* 4단계: 분석 결과 - 단계별 표시 */}
            {!showTeacherFeedback && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">4단계: 분석 결과</h2>
                
                {/* 진행 표시 바 */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">분석 진행 상황</span>
                    <span className="text-sm text-gray-500">{currentAnalysisStep + 1} / 3</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentAnalysisStep + 1) / 3) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span className={currentAnalysisStep >= 0 ? 'text-purple-600 font-medium' : ''}>각 단계별 분석</span>
                    <span className={currentAnalysisStep >= 1 ? 'text-purple-600 font-medium' : ''}>종합 평가</span>
                    <span className={currentAnalysisStep >= 2 ? 'text-purple-600 font-medium' : ''}>교육적 권장사항</span>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* AI 분석 결과 - 현재 단계에 따라 표시 */}
                  <div>
                    <div className="flex items-center mb-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg mr-3">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {currentAnalysisStep === 0 && '1. 각 단계별 분석'}
                          {currentAnalysisStep === 1 && '2. 종합 평가'}
                          {currentAnalysisStep === 2 && '3. 교육적 권장사항'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {currentAnalysisStep === 0 && '사고루틴의 각 단계별 상세 분석 결과'}
                          {currentAnalysisStep === 1 && '전반적인 수행 능력 종합 평가'}
                          {currentAnalysisStep === 2 && '향후 학습을 위한 교육적 제안'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6 shadow-sm">
                      <div 
                        className="prose prose-sm max-w-none text-gray-800 text-left leading-relaxed"
                        dangerouslySetInnerHTML={{ 
                          __html: formatMarkdownText(
                            currentAnalysisStep === 0 ? parsedAnalysis.stepByStep :
                            currentAnalysisStep === 1 ? parsedAnalysis.comprehensive :
                            parsedAnalysis.educational
                          ) 
                        }}
                      />
                    </div>
                  </div>

                  {/* 단계 이동 버튼 */}
                  <div className="flex justify-between mt-8">
                    <button
                      onClick={prevAnalysisStep}
                      disabled={currentAnalysisStep === 0}
                      className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span>이전 단계</span>
                    </button>

                    <button
                      onClick={nextAnalysisStep}
                      className="flex items-center space-x-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium"
                    >
                      <span>
                        {currentAnalysisStep === 2 ? '교사 피드백 작성' : '다음 단계'}
                      </span>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 교사 피드백 및 평가 섹션 */}
            {showTeacherFeedback && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="mb-6">
                  <div className="flex items-center mb-2">
                    <button
                      onClick={prevAnalysisStep}
                      className="flex items-center px-3 py-1 text-gray-600 hover:text-gray-900 mr-4"
                    >
                      <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span className="text-sm">이전으로</span>
                    </button>
                    <h2 className="text-xl font-bold text-gray-900">5단계: 교사 피드백 및 평가</h2>
                  </div>
                  <div className="text-sm text-gray-500">
                    AI 분석 결과를 참고하여 각 단계별로 피드백과 점수를 입력하세요
                  </div>
                </div>

                {/* 사고루틴별 개별 단계 평가 */}
                {parsedAnalysis?.individualSteps && Object.keys(parsedAnalysis.individualSteps).length > 0 ? (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <p className="text-gray-600">
                        AI가 분석한 각 단계별 결과를 참고하여 개별 단계마다 피드백과 점수를 입력하세요
                      </p>
                    </div>

                                    {Object.entries(parsedAnalysis.individualSteps).map(([stepKey, stepContent], index) => {
                  // 사고루틴 유형별 단계 정보 매핑
                  const stepInfoMaps: {[routineType: string]: {[stepKey: string]: {title: string, subtitle: string, color: string}}} = {
                    'see-think-wonder': {
                      'see': { title: 'See', subtitle: '보기', color: 'bg-blue-500' },
                      'think': { title: 'Think', subtitle: '생각하기', color: 'bg-green-500' },
                      'wonder': { title: 'Wonder', subtitle: '궁금하기', color: 'bg-purple-500' }
                    },
                    '4c': {
                      'connect': { title: 'Connect', subtitle: '연결하기', color: 'bg-blue-500' },
                      'challenge': { title: 'Challenge', subtitle: '도전하기', color: 'bg-red-500' },
                      'concepts': { title: 'Concepts', subtitle: '개념 파악', color: 'bg-green-500' },
                      'changes': { title: 'Changes', subtitle: '변화 제안', color: 'bg-purple-500' }
                    },
                    'frayer-model': {
                      'definition': { title: 'Definition', subtitle: '정의', color: 'bg-blue-500' },
                      'characteristics': { title: 'Characteristics', subtitle: '특징', color: 'bg-green-500' },
                      'examples': { title: 'Examples & Non-Examples', subtitle: '예시와 반례', color: 'bg-purple-500' }
                    },
                    'circle-of-viewpoints': {
                      'viewpoint': { title: 'Viewpoint', subtitle: '관점', color: 'bg-blue-500' },
                      'perspective': { title: 'Perspective', subtitle: '시각', color: 'bg-green-500' }
                    },
                    'connect-extend-challenge': {
                      'connect': { title: 'Connect', subtitle: '연결하기', color: 'bg-blue-500' },
                      'extend': { title: 'Extend', subtitle: '확장하기', color: 'bg-green-500' },
                      'challenge': { title: 'Challenge', subtitle: '도전하기', color: 'bg-red-500' }
                    },
                    'used-to-think-now-think': {
                      'used-to-think': { title: 'Used to Think', subtitle: '이전 생각', color: 'bg-blue-500' },
                      'now-think': { title: 'Now Think', subtitle: '현재 생각', color: 'bg-green-500' }
                    },
                    'think-puzzle-explore': {
                      'think': { title: 'Think', subtitle: '생각', color: 'bg-blue-500' },
                      'puzzle': { title: 'Puzzle', subtitle: '퍼즐', color: 'bg-yellow-500' },
                      'explore': { title: 'Explore', subtitle: '탐구', color: 'bg-green-500' }
                    }
                  };
                  
                  const currentRoutineType = template?.routine_type || room?.thinking_routine_type || 'see-think-wonder';
                  const stepInfoMap = stepInfoMaps[currentRoutineType] || stepInfoMaps['see-think-wonder'];

                      const stepInfo = stepInfoMap[stepKey];
                      if (!stepInfo) return null;

                      const gradientColors: {[key: string]: string} = {
                        'bg-blue-500': 'from-blue-50 to-white border-blue-200',
                        'bg-green-500': 'from-green-50 to-white border-green-200',
                        'bg-purple-500': 'from-purple-50 to-white border-purple-200',
                        'bg-red-500': 'from-red-50 to-white border-red-200',
                        'bg-yellow-500': 'from-yellow-50 to-white border-yellow-200'
                      };

                      return (
                        <div 
                          key={stepKey}
                          className={`bg-gradient-to-br ${gradientColors[stepInfo.color] || 'from-gray-50 to-white border-gray-200'} border rounded-xl p-6`}
                        >
                          <h3 className={`text-lg font-bold mb-4 flex items-center ${
                            stepInfo.color === 'bg-blue-500' ? 'text-blue-800' :
                            stepInfo.color === 'bg-green-500' ? 'text-green-800' :
                            stepInfo.color === 'bg-purple-500' ? 'text-purple-800' :
                            stepInfo.color === 'bg-red-500' ? 'text-red-800' :
                            stepInfo.color === 'bg-yellow-500' ? 'text-yellow-800' : 'text-gray-800'
                          }`}>
                            <span className={`w-8 h-8 ${stepInfo.color} text-white rounded-full flex items-center justify-center text-sm font-bold mr-3`}>
                              {index + 1}
                            </span>
                            {stepInfo.title} ({stepInfo.subtitle})
                          </h3>
                          
                          {/* AI 분석 내용 */}
                          <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                              <svg className="w-4 h-4 mr-1 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                              AI 분석 결과
                            </h4>
                            <div 
                              className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: formatMarkdownText(stepContent) }}
                            />
                          </div>

                          {/* 교사 피드백 입력란 */}
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">교사 피드백</label>
                            <textarea
                              value={stepFeedbacks[stepKey] || ''}
                              onChange={(e) => setStepFeedbacks({...stepFeedbacks, [stepKey]: e.target.value})}
                              rows={3}
                              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                                stepInfo.color === 'bg-blue-500' ? 'focus:ring-blue-500' :
                                stepInfo.color === 'bg-green-500' ? 'focus:ring-green-500' :
                                stepInfo.color === 'bg-purple-500' ? 'focus:ring-purple-500' :
                                stepInfo.color === 'bg-red-500' ? 'focus:ring-red-500' :
                                stepInfo.color === 'bg-yellow-500' ? 'focus:ring-yellow-500' : 'focus:ring-gray-500'
                              }`}
                              placeholder={`${stepInfo.title} (${stepInfo.subtitle}) 단계에 대한 피드백을 입력하세요...`}
                            />
                          </div>

                          {/* 점수 입력 */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">점수 (1-100점)</label>
                            <input
                              type="number"
                              value={stepScores[stepKey] || ''}
                              onChange={(e) => setStepScores({...stepScores, [stepKey]: parseInt(e.target.value)})}
                              min="1"
                              max="100"
                              className={`w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                                stepInfo.color === 'bg-blue-500' ? 'focus:ring-blue-500' :
                                stepInfo.color === 'bg-green-500' ? 'focus:ring-green-500' :
                                stepInfo.color === 'bg-purple-500' ? 'focus:ring-purple-500' :
                                stepInfo.color === 'bg-red-500' ? 'focus:ring-red-500' :
                                stepInfo.color === 'bg-yellow-500' ? 'focus:ring-yellow-500' : 'focus:ring-gray-500'
                              }`}
                              placeholder="점수"
                            />
                            <span className="ml-2 text-sm text-gray-500">/ 100점</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          개별 단계별 분석을 찾을 수 없습니다
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>AI 분석 결과에서 개별 단계별 분석을 확인할 수 없습니다.</p>
                          <p className="mt-1">다시 AI 분석을 실행하거나, AI 분석 형식을 확인해주세요.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 저장 버튼 */}
                <div className="flex justify-end mt-8 pt-6 border-t">
                  <button
                    onClick={handleFinalSave}
                    disabled={savingFeedback}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
                  >
                    {savingFeedback ? '저장 중...' : '교사 피드백 저장'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentResponseDetail; 