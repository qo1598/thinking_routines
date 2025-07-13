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
  student_name: string;
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
  const [teacherFeedback, setTeacherFeedback] = useState('');
  const [teacherScore, setTeacherScore] = useState<number | ''>('');
  const [savingFeedback, setSavingFeedback] = useState(false);

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
        // **강조:** 형식 처리
        .replace(/\*\*(.*?):\*\*/g, '<div class="mt-4 mb-2"><span class="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">$1:</span></div>')
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
**학생:** ${response.student_name}

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
      alert('AI 분석이 완료되었습니다!');
    } catch (err) {
      console.error('AI analysis error:', err);
      alert('AI 분석 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleSaveTeacherFeedback = async () => {
    if (!response) return;

    // 점수 유효성 검사 (1-100점)
    if (teacherScore !== '' && (isNaN(Number(teacherScore)) || Number(teacherScore) < 1 || Number(teacherScore) > 100)) {
      alert('점수는 1-100 사이의 숫자여야 합니다.');
      return;
    }

    setSavingFeedback(true);
    try {
      const updateData: any = {
        teacher_feedback: teacherFeedback
      };

      // 점수가 입력되었을 때만 업데이트
      if (teacherScore !== '') {
        updateData.teacher_score = Number(teacherScore);
      } else {
        updateData.teacher_score = null;
      }

      const { error } = await supabase!
        .from('student_responses')
        .update(updateData)
        .eq('id', responseId);

      if (error) {
        console.error('Feedback save error:', error);
        alert('피드백 저장에 실패했습니다: ' + error.message);
        return;
      }

      // 로컬 상태 업데이트
      setResponse(prev => prev ? {
        ...prev,
        teacher_feedback: teacherFeedback,
        teacher_score: teacherScore === '' ? undefined : Number(teacherScore)
      } : null);

      alert('피드백이 저장되었습니다!');
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
                {response.student_name}
                {response.student_id && (
                  <span className="text-sm text-gray-500 ml-2">({response.student_id})</span>
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
                                  const parts = wonderResponse.split('|||');
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
                                  const parts = wonderResponse.split('|||');
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

        {/* AI 분석 */}
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

        {/* 교사 피드백 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">교사 피드백 및 평가</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                피드백 내용
              </label>
              <textarea
                value={teacherFeedback}
                onChange={(e) => setTeacherFeedback(e.target.value)}
                placeholder="학생에게 제공할 피드백을 입력하세요..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                점수 (1-100점)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={teacherScore}
                onChange={(e) => setTeacherScore(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveTeacherFeedback}
                disabled={savingFeedback}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                {savingFeedback ? '저장 중...' : '피드백 저장'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentResponseDetail; 