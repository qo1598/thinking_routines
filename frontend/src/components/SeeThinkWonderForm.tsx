import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface StudentInfo {
  grade: string;
  name: string;
  class: string;
  number: string;
  groupName?: string | null; // 모둠명 (선택사항)
  roomId: string;
  roomCode: string;
}

interface ActivityRoom {
  id: string;
  title: string;
  description: string;
  thinking_routine_type: string;
  status: string;
}

interface RoutineTemplate {
  id: string;
  room_id: string;
  routine_type: string;
  content: {
    image_url?: string;
    text_content?: string;
    youtube_url?: string;
    see_question?: string;
    think_question?: string;
    wonder_question?: string;
    fourth_question?: string; // 4C의 Changes 단계용
  };
}

interface ThinkingRoutineResponse {
  see: string;
  think: string;
  wonder: string;
  fourth_step?: string; // 4C의 Changes 단계용
  [key: string]: string | undefined; // 동적 접근을 위한 인덱스 시그니처
}

// 사고루틴별 설정 정보
const ROUTINE_CONFIGS = {
  'see-think-wonder': {
    name: 'See-Think-Wonder',
    steps: ['see', 'think', 'wonder'],
    stepLabels: {
      see: { title: 'See', subtitle: '보기', color: 'bg-blue-500' },
      think: { title: 'Think', subtitle: '생각하기', color: 'bg-green-500' },
      wonder: { title: 'Wonder', subtitle: '궁금하기', color: 'bg-purple-500' }
    },
    defaultQuestions: {
      see: '이 자료에서 무엇을 보았나요?',
      think: '이것에 대해 어떻게 생각하나요?',
      wonder: '이것에 대해 무엇이 궁금한가요?'
    }
  },
  '4c': {
    name: '4C',
    steps: ['see', 'think', 'wonder', 'fourth_step'],
    stepLabels: {
      see: { title: 'Connect', subtitle: '연결하기', color: 'bg-blue-500' },
      think: { title: 'Challenge', subtitle: '도전하기', color: 'bg-red-500' },
      wonder: { title: 'Concepts', subtitle: '개념 파악', color: 'bg-green-500' },
      fourth_step: { title: 'Changes', subtitle: '변화 제안', color: 'bg-purple-500' }
    },
    defaultQuestions: {
      see: '이 내용이 이미 알고 있는 것과 어떻게 연결되나요?',
      think: '이 내용에서 어떤 아이디어나 가정에 도전하고 싶나요?',
      wonder: '이 내용에서 중요하다고 생각하는 핵심 개념은 무엇인가요?',
      fourth_step: '이 내용이 당신이나 다른 사람들에게 어떤 변화를 제안하나요?'
    }
  },
  'circle-of-viewpoints': {
    name: 'Circle of Viewpoints',
    steps: ['see', 'think', 'wonder'],
    stepLabels: {
      see: { title: 'Viewpoints', subtitle: '관점 탐색', color: 'bg-blue-500' },
      think: { title: 'Perspective', subtitle: '관점 선택', color: 'bg-green-500' },
      wonder: { title: 'Questions', subtitle: '관점별 질문', color: 'bg-purple-500' }
    },
    defaultQuestions: {
      see: '이 주제에 대해 다양한 관점을 가질 수 있는 사람들은 누구인가요?',
      think: '선택한 관점에서 이 주제를 어떻게 바라볼까요?',
      wonder: '이 관점에서 가질 수 있는 질문은 무엇인가요?'
    }
  },
  'connect-extend-challenge': {
    name: 'Connect-Extend-Challenge',
    steps: ['see', 'think', 'wonder'],
    stepLabels: {
      see: { title: 'Connect', subtitle: '연결하기', color: 'bg-blue-500' },
      think: { title: 'Extend', subtitle: '확장하기', color: 'bg-green-500' },
      wonder: { title: 'Challenge', subtitle: '도전하기', color: 'bg-red-500' }
    },
    defaultQuestions: {
      see: '이 내용이 이미 알고 있는 것과 어떻게 연결되나요?',
      think: '이 내용이 당신의 생각을 어떻게 확장시켰나요?',
      wonder: '이 내용에서 어떤 것이 당신에게 도전이 되나요?'
    }
  },
  'frayer-model': {
    name: 'Frayer Model',
    steps: ['see', 'think', 'wonder'],
    stepLabels: {
      see: { title: 'Definition', subtitle: '정의', color: 'bg-blue-500' },
      think: { title: 'Characteristics', subtitle: '특징', color: 'bg-green-500' },
      wonder: { title: 'Examples', subtitle: '예시와 반례', color: 'bg-purple-500' }
    },
    defaultQuestions: {
      see: '이 개념을 어떻게 정의하겠나요?',
      think: '이 개념의 주요 특징은 무엇인가요?',
      wonder: '이 개념의 예시와 반례는 무엇인가요?'
    }
  },
  'used-to-think-now-think': {
    name: 'I Used to Think... Now I Think...',
    steps: ['see', 'think', 'wonder'],
    stepLabels: {
      see: { title: 'Used to Think', subtitle: '이전 생각', color: 'bg-blue-500' },
      think: { title: 'Now Think', subtitle: '현재 생각', color: 'bg-green-500' },
      wonder: { title: 'Why Changed', subtitle: '변화 이유', color: 'bg-purple-500' }
    },
    defaultQuestions: {
      see: '이 주제에 대해 이전에 어떻게 생각했나요?',
      think: '지금은 어떻게 생각하나요?',
      wonder: '생각이 바뀐 이유는 무엇인가요?'
    }
  },
  'think-puzzle-explore': {
    name: 'Think-Puzzle-Explore',
    steps: ['see', 'think', 'wonder'],
    stepLabels: {
      see: { title: 'Think', subtitle: '생각하기', color: 'bg-blue-500' },
      think: { title: 'Puzzle', subtitle: '퍼즐', color: 'bg-yellow-500' },
      wonder: { title: 'Explore', subtitle: '탐구하기', color: 'bg-green-500' }
    },
    defaultQuestions: {
      see: '이 주제에 대해 무엇을 알고 있다고 생각하나요?',
      think: '무엇이 퍼즐이나 의문점인가요?',
      wonder: '이 퍼즐을 어떻게 탐구해보고 싶나요?'
    }
  }
};

const ThinkingRoutineForm: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [room, setRoom] = useState<ActivityRoom | null>(null);
  const [template, setTemplate] = useState<RoutineTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState<string>('see');
  const [responses, setResponses] = useState<ThinkingRoutineResponse>({
    see: '',
    think: '',
    wonder: '',
    fourth_step: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase || !roomId) {
      setError('시스템 설정이 완료되지 않았습니다.');
      setLoading(false);
      return;
    }

    try {
      // 활동방 정보 조회
      const { data: roomData, error: roomError } = await supabase
        .from('activity_rooms')
        .select('*')
        .eq('id', roomId)
        .eq('status', 'active')
        .single();

      if (roomError) {
        console.error('Room fetch error:', roomError);
        setError('활동방을 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      setRoom(roomData);

      // 템플릿 정보 조회
      const { data: templateData, error: templateError } = await supabase
        .from('routine_templates')
        .select('*')
        .eq('room_id', roomId)
        .single();

      if (templateError && templateError.code !== 'PGRST116') {
        console.error('Template fetch error:', templateError);
        setError('활동 내용을 불러오는데 실패했습니다.');
      } else if (templateData) {
        setTemplate(templateData);
      }

    } catch (err) {
      console.error('Fetch error:', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // 기존 응답 불러오기 (임시저장 또는 정식 제출)
  const loadExistingResponse = useCallback(async (studentInfo: StudentInfo) => {
    if (!supabase || !roomId) return;

    try {
      const studentId = studentInfo.class && studentInfo.number ? `${studentInfo.grade} ${studentInfo.class}반 ${studentInfo.number}번` : '';
      
      // 먼저 임시저장된 응답 확인
      const { data: draftData } = await supabase
        .from('student_responses')
        .select('*')
        .eq('room_id', roomId)
        .eq('student_name', studentInfo.name)
        .eq('student_id', studentId)
        .eq('is_draft', true)
        .single();

      if (draftData && draftData.response_data) {
        setResponses(draftData.response_data);
        // 마지막으로 작성한 단계 확인 - 역순으로 확인하여 가장 마지막 단계 찾기
        if (draftData.response_data.fourth_step && draftData.response_data.fourth_step.trim()) {
          setCurrentStep('fourth_step');
        } else if (draftData.response_data.wonder && draftData.response_data.wonder.trim()) {
          setCurrentStep('wonder');
        } else if (draftData.response_data.think && draftData.response_data.think.trim()) {
          setCurrentStep('think');
        } else if (draftData.response_data.see && draftData.response_data.see.trim()) {
          setCurrentStep('see');
        }
        
        alert('이전에 작성하던 내용을 불러왔습니다. 이어서 작성하실 수 있습니다.');
        return;
      }

      // 임시저장이 없으면 정식 제출된 응답 확인
      const { data: submittedData } = await supabase
        .from('student_responses')
        .select('*')
        .eq('room_id', roomId)
        .eq('student_name', studentInfo.name)
        .eq('student_id', studentId)
        .eq('is_draft', false)
        .single();

      if (submittedData && submittedData.response_data) {
        setResponses(submittedData.response_data);
        // 모든 단계가 완료되어 있으므로 마지막 단계로 설정
        if (submittedData.response_data.fourth_step) {
          setCurrentStep('fourth_step');
        } else {
          setCurrentStep('wonder');
        }
        
        alert('이전에 제출한 응답을 불러왔습니다. 수정하여 다시 제출할 수 있습니다.');
      }
    } catch (err) {
      console.error('Load existing response error:', err);
    }
  }, [roomId]);

  // 임시저장 함수
  const saveDraft = useCallback(async (currentResponses: ThinkingRoutineResponse) => {
    if (!supabase || !studentInfo || !roomId) return;

    try {
      const studentId = studentInfo.class && studentInfo.number ? `${studentInfo.grade} ${studentInfo.class}반 ${studentInfo.number}번` : '';
      
      // 기존 임시저장 데이터 확인
      const { data: existingDraft } = await supabase
        .from('student_responses')
        .select('id')
        .eq('room_id', roomId)
        .eq('student_name', studentInfo.name)
        .eq('student_id', studentId)
        .eq('is_draft', true)
        .single();

      if (existingDraft) {
        // 기존 임시저장 데이터 업데이트
        await supabase
          .from('student_responses')
          .update({
            response_data: currentResponses,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingDraft.id);
      } else {
        // 새 임시저장 데이터 생성
        await supabase
          .from('student_responses')
          .insert([{
            room_id: roomId,
            student_grade: studentInfo.grade,
            student_name: studentInfo.name,
            student_class: studentInfo.class,
            student_number: parseInt(studentInfo.number),
            team_name: studentInfo.groupName || null,
            response_data: currentResponses,
            is_draft: true,
            submitted_at: new Date().toISOString()
          }]);
      }
    } catch (err) {
      console.error('Save draft error:', err);
    }
  }, [studentInfo, roomId]);

  useEffect(() => {
    const storedStudentInfo = localStorage.getItem('studentInfo');
    if (!storedStudentInfo) {
      navigate('/student');
      return;
    }

    const parsedStudentInfo = JSON.parse(storedStudentInfo);
    setStudentInfo(parsedStudentInfo);

    if (parsedStudentInfo.roomId !== roomId) {
      navigate('/student');
      return;
    }

    fetchData().then(() => {
      // 데이터 로드 완료 후 기존 응답 불러오기
      loadExistingResponse(parsedStudentInfo);
    });
  }, [roomId, navigate, fetchData, loadExistingResponse]);

  // 응답 변경 시 자동 임시저장 (debounce 적용)
  useEffect(() => {
    if (!studentInfo || (!responses.see && !responses.think && !responses.wonder)) return;

    const timeoutId = setTimeout(() => {
      saveDraft(responses);
    }, 2000); // 2초 후 자동 저장

    return () => clearTimeout(timeoutId);
  }, [responses, saveDraft, studentInfo]);

  const handleInputChange = (value: string) => {
    setResponses(prev => ({
      ...prev,
      [currentStep as keyof ThinkingRoutineResponse]: value
    }));
  };

  const handleNextStep = () => {
    if (!template) return;
    
    const routineConfig = ROUTINE_CONFIGS[template.routine_type as keyof typeof ROUTINE_CONFIGS];
    if (!routineConfig) return;
    
    const currentIndex = routineConfig.steps.indexOf(currentStep);
    if (currentIndex < routineConfig.steps.length - 1) {
      setCurrentStep(routineConfig.steps[currentIndex + 1]);
    }
  };

  const handlePrevStep = () => {
    if (!template) return;
    
    const routineConfig = ROUTINE_CONFIGS[template.routine_type as keyof typeof ROUTINE_CONFIGS];
    if (!routineConfig) return;
    
    const currentIndex = routineConfig.steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(routineConfig.steps[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    if (!template) return;
    
    const routineConfig = ROUTINE_CONFIGS[template.routine_type as keyof typeof ROUTINE_CONFIGS];
    if (!routineConfig) return;
    
    // 모든 단계가 완료되었는지 확인
    const allStepsCompleted = routineConfig.steps.every(step => {
      const response = responses[step as keyof ThinkingRoutineResponse];
      return response && response.trim();
    });
    
    if (!allStepsCompleted) {
      alert('모든 단계를 완료해주세요.');
      return;
    }

    if (!supabase || !studentInfo) return;

    setSubmitting(true);
    try {
      const studentId = studentInfo.class && studentInfo.number ? `${studentInfo.grade} ${studentInfo.class}반 ${studentInfo.number}번` : '';
      
      // 기존 임시저장 데이터 확인 및 삭제
      const { data: existingDraft } = await supabase
        .from('student_responses')
        .select('id')
        .eq('room_id', roomId)
        .eq('student_name', studentInfo.name)
        .eq('student_id', studentId)
        .eq('is_draft', true)
        .single();

      if (existingDraft) {
        // 임시저장 데이터 삭제
        await supabase
          .from('student_responses')
          .delete()
          .eq('id', existingDraft.id);
      }

      // 기존 정식 제출 데이터 확인 (같은 학생의 기존 응답 찾기)
      const { data: existingResponse } = await supabase
        .from('student_responses')
        .select('id')
        .eq('room_id', roomId)
        .eq('student_name', studentInfo.name)
        .eq('student_id', studentId)
        .eq('is_draft', false)
        .single();

      if (existingResponse) {
        // 기존 응답이 있으면 업데이트
        const { error } = await supabase
          .from('student_responses')
          .update({
            response_data: responses,
            submitted_at: new Date().toISOString(),
            // AI 분석과 교사 피드백은 초기화하지 않음 (교사가 이미 작성했을 수 있음)
          })
          .eq('id', existingResponse.id);

        if (error) {
          console.error('Update error:', error);
          alert('응답 수정에 실패했습니다. 다시 시도해주세요.');
          return;
        }

        alert('응답이 수정되었습니다!');
      } else {
        // 기존 응답이 없으면 새로 생성
        const { error } = await supabase
          .from('student_responses')
          .insert([{
            room_id: roomId,
            student_name: studentInfo.name,
            student_id: studentId,
            group_name: studentInfo.groupName || null,
            response_data: responses,
            is_draft: false,
            submitted_at: new Date().toISOString()
          }]);

        if (error) {
          console.error('Submit error:', error);
          alert('제출에 실패했습니다. 다시 시도해주세요.');
          return;
        }

        alert('제출이 완료되었습니다!');
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Submit error:', err);
      alert('제출에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  // AI 분석 요청 함수
  const handleAIAnalysis = async () => {
    if (!template || !studentInfo) return;

    setAnalyzing(true);
    try {
      // 사고루틴별 맞춤형 프롬프트 생성
      const systemPrompt = generateAIPrompt(template.routine_type);
      const userPrompt = generateUserPrompt();

      // Google Gemini API 호출
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

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || 'AI 분석 요청 실패');
      }

      const analysisResult = await apiResponse.json();
      
      if (!analysisResult.analysis) {
        throw new Error('AI 분석 결과가 없습니다');
      }
      
      setAiAnalysisResult(analysisResult.analysis);
      alert('AI 분석이 완료되었습니다!');
    } catch (error) {
      console.error('AI 분석 오류:', error);
      alert('AI 분석 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setAnalyzing(false);
    }
  };

  // 사고루틴별 AI 프롬프트 생성
  const generateAIPrompt = (routineType: string) => {
    const prompts = {
      'see-think-wonder': `
당신은 교육 전문가입니다. 학생이 작성한 See-Think-Wonder 사고루틴 활동 결과물을 분석하고 평가해주세요.

**See-Think-Wonder 사고루틴 이해:**
- See(보기): 관찰 가능한 사실과 정보를 기록
- Think(생각하기): 관찰한 내용에 대한 해석과 추론
- Wonder(궁금하기): 더 알고 싶은 점과 질문 생성

**평가 기준:**
1. 각 단계별 적절성 (관찰-해석-질문의 논리적 연결)
2. 구체성과 명확성
3. 사고의 깊이와 창의성
4. 언어 표현의 정확성

**출력 형식:**
## 1. 각 단계별 분석
### See (보기)
- [관찰 능력 평가와 구체적 피드백 2-3줄]
### Think (생각하기)
- [추론 능력 평가와 구체적 피드백 2-3줄]
### Wonder (궁금하기)
- [질문 생성 능력 평가와 구체적 피드백 2-3줄]

## 2. 종합 평가
### 강점
- [구체적인 강점 2-3가지]
### 개선점
- [구체적인 개선 방안 2-3가지]

## 3. 교육적 제안
- [다음 단계 학습 방향 제시]`,

      '4c': `
당신은 교육 전문가입니다. 학생이 작성한 4C 사고루틴 활동 결과물을 분석하고 평가해주세요.

**4C 사고루틴 이해:**
- Connect(연결): 기존 지식이나 경험과의 연결점
- Challenge(도전): 의문점이나 도전적인 아이디어
- Concepts(개념): 핵심 개념과 아이디어
- Changes(변화): 제안하는 변화나 행동

**평가 기준:**
1. 각 단계별 적절성과 논리적 연결
2. 비판적 사고와 창의적 사고
3. 개념 이해의 깊이
4. 실행 가능한 변화 제안

**출력 형식:**
## 1. 각 단계별 분석
### Connect (연결)
- [연결 능력 평가와 구체적 피드백 2-3줄]
### Challenge (도전)
- [비판적 사고 능력 평가와 구체적 피드백 2-3줄]
### Concepts (개념)
- [개념 이해 능력 평가와 구체적 피드백 2-3줄]
### Changes (변화)
- [변화 제안 능력 평가와 구체적 피드백 2-3줄]

## 2. 종합 평가
### 강점
- [구체적인 강점 2-3가지]
### 개선점
- [구체적인 개선 방안 2-3가지]

## 3. 교육적 제안
- [다음 단계 학습 방향 제시]`
    };

    return prompts[routineType as keyof typeof prompts] || prompts['see-think-wonder'];
  };

  // 사용자 응답 프롬프트 생성
  const generateUserPrompt = () => {
    if (!template) return '';

    const routineConfig = ROUTINE_CONFIGS[template.routine_type as keyof typeof ROUTINE_CONFIGS];
    if (!routineConfig) return '';

    let prompt = `학생 정보:
- 이름: ${studentInfo.name}
- 학급: ${studentInfo.class}
- 번호: ${studentInfo.number}
${studentInfo.groupName ? `- 모둠명: ${studentInfo.groupName}` : ''}

활동 내용:
- 제목: ${template?.content?.text_content || ''}

학생 응답:`;

    routineConfig.steps.forEach((step: string) => {
      const stepLabel = routineConfig.stepLabels[step as keyof typeof routineConfig.stepLabels];
      const response = responses[step as keyof ThinkingRoutineResponse];
      prompt += `\n\n**${stepLabel.title} (${stepLabel.subtitle}):**\n${response || '(응답 없음)'}`;
    });

    return prompt;
  };

  const getStepInfo = () => {
    const routineConfig = ROUTINE_CONFIGS[template?.routine_type as keyof typeof ROUTINE_CONFIGS];
    
    // 기본 See-Think-Wonder 구조
    const defaultStepInfo = {
      title: 'See',
      subtitle: '보기',
      question: '이 자료에서 무엇을 보았나요?',
      placeholder: '보이는 것들을 구체적으로 적어보세요...',
      color: 'bg-blue-500'
    };
    
    if (!routineConfig) return defaultStepInfo;

    const stepInfo = routineConfig.stepLabels[currentStep as keyof typeof routineConfig.stepLabels];
    if (!stepInfo) return defaultStepInfo;

    // 질문 가져오기
    let question = '';
    if (currentStep === 'see') {
      question = template?.content.see_question || routineConfig.defaultQuestions.see;
    } else if (currentStep === 'think') {
      question = template?.content.think_question || routineConfig.defaultQuestions.think;
    } else if (currentStep === 'wonder') {
      question = template?.content.wonder_question || routineConfig.defaultQuestions.wonder;
    } else if (currentStep === 'fourth_step') {
      question = template?.content.fourth_question || (routineConfig.defaultQuestions as any).fourth_step || '';
    }

    const placeholder = `이 단계의 질문에 대해 자유롭게 답변해주세요...`;

    return {
      ...stepInfo,
      question: question,
      placeholder: placeholder
    };
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">오류가 발생했습니다</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/student')}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">활동 준비 중</h2>
          <p className="text-gray-600 mb-6">선생님이 아직 활동 내용을 설정하지 않았습니다.</p>
          <button
            onClick={() => navigate('/student')}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const routineConfig = ROUTINE_CONFIGS[template?.routine_type as keyof typeof ROUTINE_CONFIGS];
  if (!routineConfig) return <div>지원되지 않는 사고루틴입니다.</div>;
  
  const stepInfo = getStepInfo();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{room.title}</h1>
              <p className="text-sm text-gray-600">{studentInfo?.name}님의 활동</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/student')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1"
              >
                <span>🏠</span>
                <span>홈</span>
              </button>
              <div className="flex space-x-1">
                {routineConfig.steps.map((step, index) => (
                  <div
                    key={step}
                    className={`w-3 h-3 rounded-full ${
                      step === currentStep ? 'bg-primary-600' : 
                      routineConfig.steps.indexOf(currentStep) > index ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* 활동 영역 */}
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-12 h-12 rounded-full ${stepInfo.color} flex items-center justify-center`}>
                  <span className="text-white font-bold text-lg">{stepInfo.title[0]}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{stepInfo.title}</h2>
                  <p className="text-gray-600">{stepInfo.subtitle}</p>
                </div>
              </div>
              
              {/* 자료 표시 영역 - 각 단계마다 표시 */}
              <div className="mb-6 space-y-4">
                {/* 디버깅 정보 (개발 중에만 표시) */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <strong>디버깅 정보:</strong><br/>
                      이미지 URL: {template.content.image_url || '없음'}<br/>
                      텍스트 내용: {template.content.text_content ? '있음' : '없음'}<br/>
                      유튜브 URL: {template.content.youtube_url || '없음'}<br/>
                      유튜브 임베드 URL: {template.content.youtube_url ? getYouTubeEmbedUrl(template.content.youtube_url) || '파싱 실패' : '없음'}
                    </p>
                  </div>
                )}
                
                {template.content.image_url && (
                  <div className="flex justify-center">
                    <img 
                      src={template.content.image_url} 
                      alt="활동 자료" 
                      className="max-w-full max-h-96 rounded-lg shadow-sm"
                      onError={(e) => {
                        console.error('이미지 로드 실패:', template.content.image_url);
                        e.currentTarget.style.display = 'none';
                      }}
                      onLoad={() => {
                        console.log('이미지 로드 성공:', template.content.image_url);
                      }}
                    />
                  </div>
                )}
                
                {template.content.text_content && (
                  <div className="prose max-w-none">
                    <div className="text-gray-900 whitespace-pre-wrap text-center bg-gray-50 p-4 rounded-lg">
                      {template.content.text_content}
                    </div>
                  </div>
                )}
                
                {template.content.youtube_url && (
                  <div className="flex justify-center">
                    <div className="w-full max-w-2xl">
                      <div className="relative" style={{ paddingBottom: '56.25%' }}>
                        {(() => {
                          const embedUrl = getYouTubeEmbedUrl(template.content.youtube_url);
                          console.log('유튜브 원본 URL:', template.content.youtube_url);
                          console.log('유튜브 임베드 URL:', embedUrl);
                          return embedUrl ? (
                            <iframe
                              src={embedUrl}
                              title="YouTube video"
                              className="absolute inset-0 w-full h-full rounded-lg"
                              allowFullScreen
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                              <div className="text-center">
                                <p className="text-gray-600 mb-2">유튜브 영상을 불러올 수 없습니다.</p>
                                <p className="text-sm text-gray-500">원본 링크: {template.content.youtube_url}</p>
                                <a 
                                  href={template.content.youtube_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline text-sm"
                                >
                                  새 탭에서 보기
                                </a>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* 자료가 하나도 없는 경우 안내 메시지 */}
                {!template.content.image_url && !template.content.text_content && !template.content.youtube_url && (
                  <div className="text-center py-8">
                    <div className="bg-gray-100 rounded-lg p-6">
                      <p className="text-gray-600">선생님이 아직 활동 자료를 설정하지 않았습니다.</p>
                      <p className="text-sm text-gray-500 mt-2">자료 없이도 활동을 진행할 수 있습니다.</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-lg text-gray-800 font-medium">{stepInfo.question}</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* 사고루틴별 특화된 입력 컴포넌트 */}
              {template.routine_type === 'frayer-model' && currentStep === 'see' && (
                <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-blue-800">Definition (정의)</h3>
                    <p className="text-sm text-blue-600">이 개념을 명확하게 정의해보세요</p>
                  </div>
                  <textarea
                    value={responses[currentStep]}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="이 개념을 한 문장으로 정의해보세요..."
                    rows={4}
                    className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white"
                  />
                </div>
              )}
              
              {template.routine_type === 'frayer-model' && currentStep === 'think' && (
                <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-green-800">Characteristics (특징)</h3>
                    <p className="text-sm text-green-600">이 개념의 주요 특징들을 나열해보세요</p>
                  </div>
                  <textarea
                    value={responses[currentStep]}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="• 특징 1: 
• 특징 2: 
• 특징 3: "
                    rows={6}
                    className="w-full px-4 py-3 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none bg-white"
                  />
                </div>
              )}
              
              {template.routine_type === 'frayer-model' && currentStep === 'wonder' && (
                <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-purple-800">Examples & Non-Examples</h3>
                    <p className="text-sm text-purple-600">예시와 반례를 들어보세요</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-purple-700 mb-2">✓ 예시 (Examples)</h4>
                      <textarea
                        value={responses[currentStep]?.split('||')[0] || ''}
                        onChange={(e) => {
                          const nonExamples = responses[currentStep]?.split('||')[1] || '';
                          handleInputChange(e.target.value + '||' + nonExamples);
                        }}
                        placeholder="이 개념에 해당하는 예시들을 적어보세요..."
                        rows={4}
                        className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-white"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-purple-700 mb-2">✗ 반례 (Non-Examples)</h4>
                      <textarea
                        value={responses[currentStep]?.split('||')[1] || ''}
                        onChange={(e) => {
                          const examples = responses[currentStep]?.split('||')[0] || '';
                          handleInputChange(examples + '||' + e.target.value);
                        }}
                        placeholder="이 개념에 해당하지 않는 반례들을 적어보세요..."
                        rows={4}
                        className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {template.routine_type === '4c' && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-blue-200">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-blue-800">
                      {currentStep === 'see' && 'Connect (연결하기)'}
                      {currentStep === 'think' && 'Challenge (도전하기)'}
                      {currentStep === 'wonder' && 'Concepts (개념 파악)'}
                      {currentStep === 'fourth_step' && 'Changes (변화 제안)'}
                    </h3>
                    <p className="text-sm text-blue-600">
                      {currentStep === 'see' && '이전 지식과 연결점을 찾아보세요'}
                      {currentStep === 'think' && '기존 생각에 도전해보세요'}
                      {currentStep === 'wonder' && '핵심 개념을 파악해보세요'}
                      {currentStep === 'fourth_step' && '변화를 제안해보세요'}
                    </p>
                  </div>
                  <textarea
                    value={responses[currentStep]}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder={stepInfo.placeholder}
                    rows={5}
                    className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white"
                  />
                </div>
              )}
              
              {template.routine_type === 'used-to-think-now-think' && (
                <div className="bg-gradient-to-r from-orange-50 to-blue-50 p-6 rounded-lg border-2 border-orange-200">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-orange-800">
                      {currentStep === 'see' && '🤔 I Used to Think... (이전 생각)'}
                      {currentStep === 'think' && '💡 Now I Think... (현재 생각)'}
                      {currentStep === 'wonder' && '🔄 Why Changed? (변화 이유)'}
                    </h3>
                    <p className="text-sm text-orange-600">
                      {currentStep === 'see' && '이 주제에 대해 예전에 어떻게 생각했나요?'}
                      {currentStep === 'think' && '지금은 어떻게 생각하나요?'}
                      {currentStep === 'wonder' && '생각이 바뀐 이유는 무엇인가요?'}
                    </p>
                  </div>
                  <textarea
                    value={responses[currentStep]}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder={stepInfo.placeholder}
                    rows={5}
                    className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none bg-white"
                  />
                </div>
              )}
              
              {template.routine_type === 'think-puzzle-explore' && (
                <div className="bg-gradient-to-r from-green-50 to-yellow-50 p-6 rounded-lg border-2 border-green-200">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-green-800">
                      {currentStep === 'see' && '🧠 Think (생각하기)'}
                      {currentStep === 'think' && '🧩 Puzzle (퍼즐)'}
                      {currentStep === 'wonder' && '🔍 Explore (탐구하기)'}
                    </h3>
                    <p className="text-sm text-green-600">
                      {currentStep === 'see' && '이 주제에 대해 무엇을 알고 있나요?'}
                      {currentStep === 'think' && '어떤 것이 궁금하거나 혼란스러운가요?'}
                      {currentStep === 'wonder' && '어떻게 탐구해보고 싶나요?'}
                    </p>
                  </div>
                  <textarea
                    value={responses[currentStep]}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder={stepInfo.placeholder}
                    rows={5}
                    className="w-full px-4 py-3 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none bg-white"
                  />
                </div>
              )}
              
              {template.routine_type === 'circle-of-viewpoints' && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border-2 border-indigo-200">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-indigo-800">
                      {currentStep === 'see' && '👥 Viewpoints (관점 탐색)'}
                      {currentStep === 'think' && '🎭 Perspective (관점 선택)'}
                      {currentStep === 'wonder' && '❓ Questions (관점별 질문)'}
                    </h3>
                    <p className="text-sm text-indigo-600">
                      {currentStep === 'see' && '다양한 관점을 가진 사람들을 생각해보세요'}
                      {currentStep === 'think' && '선택한 관점에서 바라보세요'}
                      {currentStep === 'wonder' && '이 관점에서 가질 수 있는 질문들을 생각해보세요'}
                    </p>
                  </div>
                  <textarea
                    value={responses[currentStep]}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder={stepInfo.placeholder}
                    rows={5}
                    className="w-full px-4 py-3 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-white"
                  />
                </div>
              )}
              
              {template.routine_type === 'connect-extend-challenge' && (
                <div className="bg-gradient-to-r from-cyan-50 to-teal-50 p-6 rounded-lg border-2 border-cyan-200">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-cyan-800">
                      {currentStep === 'see' && '🔗 Connect (연결하기)'}
                      {currentStep === 'think' && '📈 Extend (확장하기)'}
                      {currentStep === 'wonder' && '⚡ Challenge (도전하기)'}
                    </h3>
                    <p className="text-sm text-cyan-600">
                      {currentStep === 'see' && '이미 알고 있는 것과 어떻게 연결되나요?'}
                      {currentStep === 'think' && '생각이 어떻게 확장되었나요?'}
                      {currentStep === 'wonder' && '어떤 것이 도전이 되나요?'}
                    </p>
                  </div>
                  <textarea
                    value={responses[currentStep]}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder={stepInfo.placeholder}
                    rows={5}
                    className="w-full px-4 py-3 border border-cyan-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none bg-white"
                  />
                </div>
              )}
              
              {/* 기본 See-Think-Wonder 템플릿 */}
              {template.routine_type === 'see-think-wonder' && (
                <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border-2 border-blue-200">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-blue-800">
                      {currentStep === 'see' && '👁️ See (보기)'}
                      {currentStep === 'think' && '🤔 Think (생각하기)'}
                      {currentStep === 'wonder' && '❓ Wonder (궁금하기)'}
                    </h3>
                    <p className="text-sm text-blue-600">
                      {currentStep === 'see' && '무엇을 보고 관찰했나요?'}
                      {currentStep === 'think' && '어떤 생각이 드나요?'}
                      {currentStep === 'wonder' && '무엇이 궁금한가요?'}
                    </p>
                  </div>
                  <textarea
                    value={responses[currentStep]}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder={stepInfo.placeholder}
                    rows={5}
                    className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white"
                  />
                </div>
              )}
              
              <div className="flex justify-between">
                <button
                  onClick={handlePrevStep}
                  disabled={currentStep === routineConfig.steps[0]}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                
                {currentStep === routineConfig.steps[routineConfig.steps.length - 1] ? (
                  <button
                    onClick={handleSubmit}
                                          disabled={submitting || !routineConfig.steps.every(step => responses[step as keyof ThinkingRoutineResponse]?.trim())}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? '제출 중...' : '제출하기'}
                  </button>
                ) : (
                  <button
                    onClick={handleNextStep}
                    disabled={!responses[currentStep as keyof ThinkingRoutineResponse]?.trim()}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    다음
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 제출 완료 후 AI 분석 섹션 */}
        {submitted && (
          <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              🤖 AI 분석 및 피드백
            </h2>
            
            <div className="mb-4">
              <p className="text-gray-700 mb-4">
                제출한 사고루틴 활동을 AI가 분석하여 개인 맞춤형 피드백을 제공합니다.
              </p>
              
              {!aiAnalysisResult ? (
                <button
                  onClick={handleAIAnalysis}
                  disabled={analyzing}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {analyzing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      AI 분석 중...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      AI 분석 시작하기
                    </>
                  )}
                </button>
              ) : (
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    📊 AI 분석 결과
                  </h3>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-gray-700 bg-white p-4 rounded border">
                      {aiAnalysisResult}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3 pt-4 border-t">
              <button
                onClick={() => navigate('/student')}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                돌아가기
              </button>
              {aiAnalysisResult && (
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setAiAnalysisResult(null);
                    // 응답 초기화
                    setResponses({
                      see: '',
                      think: '',
                      wonder: '',
                      fourth_step: ''
                    });
                    setCurrentStep('see');
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  새 활동 시작하기
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ThinkingRoutineForm; 