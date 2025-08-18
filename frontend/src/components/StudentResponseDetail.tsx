import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import AIAnalysisSection from './AIAnalysisSection';
import TeacherFeedbackSection from './TeacherFeedbackSection';

// 사고루틴 유형별 정규표현식 패턴
const routineStepPatterns: {[routineType: string]: {[stepKey: string]: RegExp[]}} = {
  'see-think-wonder': {
    'see': [
      /(?:^|\n)(?:\*\*)?(?:See|보기|관찰)(?:\*\*)?(?:\s*[:：]?\s*)(.*?)(?=\n(?:\*\*)?(?:Think|생각|Wonder|궁금)|$)/s,
      /(?:^|\n)(?:\d+\.\s*)?(?:\*\*)?(?:See|보기|관찰)(?:\*\*)?(?:\s*[:：]?\s*)(.*?)(?=\n(?:\d+\.\s*)?(?:\*\*)?(?:Think|생각|Wonder|궁금)|$)/s
    ],
    'think': [
      /(?:^|\n)(?:\*\*)?(?:Think|생각|생각하기)(?:\*\*)?(?:\s*[:：]?\s*)(.*?)(?=\n(?:\*\*)?(?:Wonder|궁금|See|보기)|$)/s,
      /(?:^|\n)(?:\d+\.\s*)?(?:\*\*)?(?:Think|생각|생각하기)(?:\*\*)?(?:\s*[:：]?\s*)(.*?)(?=\n(?:\d+\.\s*)?(?:\*\*)?(?:Wonder|궁금|See|보기)|$)/s
    ],
    'wonder': [
      /(?:^|\n)(?:\*\*)?(?:Wonder|궁금|궁금하기)(?:\*\*)?(?:\s*[:：]?\s*)(.*?)(?=\n(?:\*\*)?(?:See|보기|Think|생각)|$)/s,
      /(?:^|\n)(?:\d+\.\s*)?(?:\*\*)?(?:Wonder|궁금|궁금하기)(?:\*\*)?(?:\s*[:：]?\s*)(.*?)(?=\n(?:\d+\.\s*)?(?:\*\*)?(?:See|보기|Think|생각)|$)/s
    ]
  },
  'frayer-model': {
    'see': [
      /(?:^|\n)(?:\*\*)?(?:Definition|정의)(?:\*\*)?(?:\s*[:：]?\s*)(.*?)(?=\n(?:\*\*)?(?:Characteristics?|특징|Examples?|예시)|$)/s,
      /(?:^|\n)(?:\d+\.\s*)?(?:\*\*)?(?:Definition|정의)(?:\*\*)?(?:\s*[:：]?\s*)(.*?)(?=\n(?:\d+\.\s*)?(?:\*\*)?(?:Characteristics?|특징|Examples?|예시)|$)/s
    ],
    'think': [
      /(?:^|\n)(?:\*\*)?(?:Characteristics?|특징)(?:\*\*)?(?:\s*[:：]?\s*)(.*?)(?=\n(?:\*\*)?(?:Definition|정의|Examples?|예시)|$)/s,
      /(?:^|\n)(?:\d+\.\s*)?(?:\*\*)?(?:Characteristics?|특징)(?:\*\*)?(?:\s*[:：]?\s*)(.*?)(?=\n(?:\d+\.\s*)?(?:\*\*)?(?:Definition|정의|Examples?|예시)|$)/s
    ],
    'wonder': [
      /(?:^|\n)(?:\*\*)?(?:Examples?\s*&?\s*Non[-\s]?Examples?|예시와?\s*반례|Examples?|예시)(?:\*\*)?(?:\s*[:：]?\s*)(.*?)(?=\n(?:\*\*)?(?:Definition|정의|Characteristics?|특징)|$)/s,
      /(?:^|\n)(?:\d+\.\s*)?(?:\*\*)?(?:Examples?\s*&?\s*Non[-\s]?Examples?|예시와?\s*반례|Examples?|예시)(?:\*\*)?(?:\s*[:：]?\s*)(.*?)(?=\n(?:\d+\.\s*)?(?:\*\*)?(?:Definition|정의|Characteristics?|특징)|$)/s
    ]
  },
  '4c': {
    'see': [
      /(?:^|\n)(?:\*\*)?(?:Connect|연결|연결하기)(?:\*\*)?(?:\s*[:：]?\s*)(.*?)(?=\n(?:\*\*)?(?:Challenge|도전|Concepts?|개념|Changes?|변화)|$)/s
    ],
    'think': [
      /(?:^|\n)(?:\*\*)?(?:Challenge|도전|도전하기)(?:\*\*)?(?:\s*[:：]?\s*)(.*?)(?=\n(?:\*\*)?(?:Connect|연결|Concepts?|개념|Changes?|변화)|$)/s
    ],
    'wonder': [
      /(?:^|\n)(?:\*\*)?(?:Concepts?|개념|개념\s*파악)(?:\*\*)?(?:\s*[:：]?\s*)(.*?)(?=\n(?:\*\*)?(?:Connect|연결|Challenge|도전|Changes?|변화)|$)/s
    ],
    'fourth_step': [
      /(?:^|\n)(?:\*\*)?(?:Changes?|변화|변화\s*제안)(?:\*\*)?(?:\s*[:：]?\s*)(.*?)(?=\n(?:\*\*)?(?:Connect|연결|Challenge|도전|Concepts?|개념)|$)/s
    ]
  }
};

const StudentResponseDetail: React.FC = () => {
  const { responseId } = useParams<{ responseId: string }>();
  const navigate = useNavigate();
  
  const [response, setResponse] = useState<any>(null);
  const [room, setRoom] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [parsedAnalysis, setParsedAnalysis] = useState<any>(null);
  const [currentAnalysisStep, setCurrentAnalysisStep] = useState(0);
  const [showTeacherFeedback, setShowTeacherFeedback] = useState(false);
  const [analyzingAI, setAnalyzingAI] = useState(false);

  useEffect(() => {
    if (responseId) {
      fetchResponseData();
    }
  }, [responseId]);

  useEffect(() => {
    if (aiAnalysis) {
      parseAIAnalysis();
    }
  }, [aiAnalysis, template, room]);

  const fetchResponseData = async () => {
    try {
      setLoading(true);
      
      const { data: responseData, error: responseError } = await supabase
        .from('student_responses')
        .select('*')
        .eq('id', responseId)
        .single();

      if (responseError) throw responseError;
      setResponse(responseData);

      if (responseData.room_id) {
        const { data: roomData, error: roomError } = await supabase
          .from('activity_rooms')
          .select('*')
          .eq('id', responseData.room_id)
          .single();

        if (roomError) throw roomError;
        setRoom(roomData);

        if (roomData.template_id) {
          const { data: templateData, error: templateError } = await supabase
            .from('thinking_routine_templates')
            .select('*')
            .eq('id', roomData.template_id)
            .single();

          if (templateError) throw templateError;
          setTemplate(templateData);
        }
      }

      if (responseData.ai_analysis) {
        setAiAnalysis(responseData.ai_analysis);
      }
    } catch (error: any) {
      console.error('데이터 로딩 중 오류:', error);
      setError(error.message || '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const parseAIAnalysis = () => {
    if (!aiAnalysis || !template?.routine_type) return;

    try {
      const routineType = template.routine_type;
      const patterns = routineStepPatterns[routineType];
      
      if (!patterns) {
        console.warn(`No patterns found for routine type: ${routineType}`);
        return;
      }

      const individualSteps: {[key: string]: string} = {};
      
      Object.entries(patterns).forEach(([stepKey, stepPatterns]) => {
        for (const pattern of stepPatterns) {
          const match = aiAnalysis.match(pattern);
          if (match && match[1]) {
            individualSteps[stepKey] = match[1].trim();
            break;
          }
        }
      });

      const summaryMatch = aiAnalysis.match(/(?:전체.*?분석|종합.*?평가|요약)[\s\S]*?(?=\n(?:\*\*)?(?:개선|제안|권장사항)|$)/i);
      const suggestionsMatch = aiAnalysis.match(/(?:개선.*?제안|권장사항|제안사항)[\s\S]*$/i);

      setParsedAnalysis({
        individualSteps,
        summary: summaryMatch ? summaryMatch[0].trim() : '',
        suggestions: suggestionsMatch ? suggestionsMatch[0].trim() : ''
      });
    } catch (error) {
      console.error('AI 분석 파싱 중 오류:', error);
    }
  };

  const handleAIAnalysis = async () => {
    if (!response?.response_data || !template) return;

    setAnalyzingAI(true);
    try {
      const analysisResponse = await fetch('/api/gemini-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routineType: template.routine_type,
          responses: response.response_data,
          imageData: response.image_data
        })
      });

      if (!analysisResponse.ok) {
        throw new Error('AI 분석 요청에 실패했습니다.');
      }

      const result = await analysisResponse.json();
      
      const { error } = await supabase
        .from('student_responses')
        .update({ ai_analysis: result.analysis })
        .eq('id', responseId);

      if (error) throw error;

      setAiAnalysis(result.analysis);
      alert('AI 분석이 완료되었습니다.');
    } catch (error: any) {
      console.error('AI 분석 중 오류:', error);
      alert('AI 분석 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setAnalyzingAI(false);
    }
  };

  const nextAnalysisStep = () => {
    if (currentAnalysisStep < 2) {
      setCurrentAnalysisStep(currentAnalysisStep + 1);
    }
  };

  const prevAnalysisStep = () => {
    if (currentAnalysisStep > 0) {
      setCurrentAnalysisStep(currentAnalysisStep - 1);
    }
  };

  const handleShowTeacherFeedback = () => {
    setShowTeacherFeedback(true);
  };

  const handleBackFromTeacherFeedback = () => {
    setShowTeacherFeedback(false);
    setCurrentAnalysisStep(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">데이터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !response) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <svg className="w-16 h-16 mx-auto text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">오류 발생</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            >
              이전으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            목록으로 돌아가기
          </button>
          <h1 className="text-2xl font-bold text-gray-900">학생 응답 상세</h1>
        </div>

        {/* 학생 응답 섹션 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">학생 응답</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-sm font-medium text-gray-700">학생명:</span>
              <span className="ml-2 text-gray-900">{response.student_name}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">제출일:</span>
              <span className="ml-2 text-gray-900">
                {new Date(response.created_at).toLocaleDateString('ko-KR')}
              </span>
            </div>
          </div>
          
          {response.response_data && (
            <div className="space-y-4">
              {Object.entries(response.response_data).map(([key, value]) => (
                <div key={key} className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2 capitalize">{key.replace(/_/g, ' ')}</h3>
                  <p className="text-gray-700">{value as string}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI 분석 또는 교사 피드백 섹션 */}
        {!aiAnalysis ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">AI 분석</h2>
            <p className="text-gray-600 mb-4">AI 분석을 실행하여 학생의 응답을 분석해보세요.</p>
            <button
              onClick={handleAIAnalysis}
              disabled={analyzingAI}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzingAI ? '분석 중...' : 'AI 분석 시작'}
            </button>
          </div>
        ) : showTeacherFeedback ? (
          <TeacherFeedbackSection
            responseId={responseId!}
            parsedAnalysis={parsedAnalysis}
            template={template}
            room={room}
            onBack={handleBackFromTeacherFeedback}
          />
        ) : (
          <AIAnalysisSection
            parsedAnalysis={parsedAnalysis}
            template={template}
            room={room}
            currentAnalysisStep={currentAnalysisStep}
            onPrevStep={prevAnalysisStep}
            onNextStep={nextAnalysisStep}
            onShowTeacherFeedback={handleShowTeacherFeedback}
          />
        )}
      </div>
    </div>
  );
};

export default StudentResponseDetail;
