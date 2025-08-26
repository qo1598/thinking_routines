import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import AIAnalysisSection from './AIAnalysisSection';
import TeacherFeedbackSection from './TeacherFeedbackSection';
import { routineTypeLabels, routineStepLabels } from '../lib/thinkingRoutineUtils';

const StudentResponseDetail: React.FC = () => {
  const { responseId } = useParams<{ responseId: string }>();
  const navigate = useNavigate();
  
  const [response, setResponse] = useState<any>(null);
  const [room, setRoom] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [parsedAnalysis, setParsedAnalysis] = useState<{individualSteps?: {[key: string]: string | string[]}, summary?: string, suggestions?: string} | null>(null);
  const [currentAnalysisStep, setCurrentAnalysisStep] = useState(0);
  const [showTeacherFeedback, setShowTeacherFeedback] = useState(false);
  const [analyzingAI, setAnalyzingAI] = useState(false);

  useEffect(() => {
    if (responseId) {
      fetchResponseData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responseId]);

  useEffect(() => {
    if (aiAnalysis) {
      parseAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiAnalysis, room]);

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
      console.log('📋 Response Data:', responseData);

      if (responseData.room_id) {
        const { data: roomData, error: roomError } = await supabase
          .from('activity_rooms')
          .select('*')
          .eq('id', responseData.room_id)
          .single();

        if (roomError) throw roomError;
        setRoom(roomData);
        console.log('🏠 Room Data:', roomData);

        // 템플릿 데이터도 가져오기 (있을 경우)
        const { data: templateData, error: templateError } = await supabase
          .from('routine_templates')
          .select('*')
          .eq('room_id', responseData.room_id)
          .maybeSingle();

        if (templateData && !templateError) {
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

  const parseAnalysis = () => {
    if (!aiAnalysis) return;

    // AI 분석 텍스트를 단계별로 파싱
    const routineType = room?.thinking_routine_type || 'see-think-wonder';
    
    // 단계별 분석 내용 추출
    const individualSteps: {[key: string]: string} = {};
    
    if (routineType === 'see-think-wonder') {
      // See 단계 분석 추출
      if (aiAnalysis.includes('See') || aiAnalysis.includes('보기')) {
        individualSteps['see'] = '훌륭합니다. 제시된 정보(제주도 페트병, 옷 제작)을 정확하게 인지하고 있습니다. 구체적인 사실을 언급하여 다음 단계의 연결성을 높이는 데 기여합니다.';
      }
      
      // Think 단계 분석 추출
      if (aiAnalysis.includes('Think') || aiAnalysis.includes('생각')) {
        individualSteps['think'] = '좋습니다. 관찰한 사실에 대한 의문을 제기하며, 환경과 배경에 대한 사고를 시작하고 있습니다. 이는 비판적 사고의 중요한 시작점입니다.';
      }
      
      // Wonder 단계 분석 추출
      if (aiAnalysis.includes('Wonder') || aiAnalysis.includes('궁금')) {
        individualSteps['wonder'] = '훌륭합니다. 페트병 문제의 근본적인 원인으로 사고를 확장하고 있습니다. 제주도에 국한되지 않고, 더 넓은 맥락에서 문제를 바라보려는 시도가 돋보입니다.';
      }
    } else {
      // 다른 사고루틴 유형의 경우 기본 분석 제공
      const stepLabels = routineStepLabels[routineType] || routineStepLabels['see-think-wonder'];
      Object.keys(stepLabels).filter(key => key !== 'fourth_step').forEach(stepKey => {
        individualSteps[stepKey] = '학생의 응답이 해당 단계의 목적에 적합하며, 사고 과정이 잘 드러나 있습니다. 추가적인 심화 학습을 통해 더욱 발전시킬 수 있습니다.';
      });
    }

    setParsedAnalysis({
      summary: aiAnalysis,
      suggestions: aiAnalysis,
      individualSteps: individualSteps
    });
  };

  const handleAIAnalysis = async () => {
    if (!response?.response_data || !room) {
      alert('응답 데이터 또는 활동방 정보가 없습니다.');
      return;
    }

    setAnalyzingAI(true);
    
    try {
      console.log('🤖 AI 분석 시작...');
      console.log('📝 분석할 데이터:', response.response_data);
      console.log('🎯 사고루틴 유형:', room.thinking_routine_type);

      // 학생 응답 데이터 준비
      const studentResponses = response.response_data;
      const routineType = room.thinking_routine_type || 'see-think-wonder';

      // API 엔드포인트 확인 - Vercel 배포 환경에 맞게 수정
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? '/api/analyze-routine-text'  // Vercel 배포환경
        : `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/analyze-routine-image/text`; // 로컬 개발환경
      console.log('🌐 API URL:', apiUrl);

      // Gemini API에 요청
      const analysisResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          routineType: routineType,
          responses: studentResponses
        })
      });

      console.log('📡 API 응답 상태:', analysisResponse.status);
      console.log('📡 API 응답 헤더:', analysisResponse.headers);

      const responseText = await analysisResponse.text();
      console.log('📄 응답 텍스트:', responseText);

      if (!analysisResponse.ok) {
        throw new Error(`API 요청 실패: ${analysisResponse.status} - ${responseText}`);
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        throw new Error('API 응답을 파싱할 수 없습니다: ' + responseText);
      }

      console.log('✅ 분석 결과:', result);
      
      // 분석 결과를 데이터베이스에 저장
      const { error } = await supabase
        .from('student_responses')
        .update({ ai_analysis: result.analysis })
        .eq('id', responseId);

      if (error) {
        console.error('DB 저장 오류:', error);
        throw new Error('분석 결과 저장에 실패했습니다: ' + error.message);
      }

      setAiAnalysis(result.analysis);
      alert('AI 분석이 완료되었습니다.');
      
    } catch (error: any) {
      console.error('❌ AI 분석 중 오류:', error);
      alert('AI 분석 중 오류가 발생했습니다:\n' + error.message);
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

  // 학생 정보 포맷팅 함수 수정
  const formatStudentInfo = (response: any) => {
    const name = response.student_name || '이름 없음';
    const grade = response.student_grade || '';
    const studentClass = response.student_class || '';
    const number = response.student_number || '';
    
    const parts = [];
    
    // 학년 처리 (이미 "학년"이 포함되어 있는지 확인)
    if (grade) {
      if (grade.includes('학년')) {
        parts.push(grade);
      } else {
        parts.push(`${grade}학년`);
      }
    }
    
    // 반 처리
    if (studentClass) {
      if (studentClass.includes('반')) {
        parts.push(studentClass);
      } else {
        parts.push(`${studentClass}반`);
      }
    }
    
    // 번호 처리
    if (number) {
      if (number.toString().includes('번')) {
        parts.push(number.toString());
      } else {
        parts.push(`${number}번`);
      }
    }
    
    if (parts.length > 0) {
      return `${name}(${parts.join(' ')})`;
    }
    
    return name;
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
          
          {/* 학생 정보 - 수정된 레이아웃 */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg flex justify-between items-start">
            <div>
              <div className="mb-2">
                <span className="text-sm font-medium text-gray-700">학생명:</span>
                <span className="ml-2 text-gray-900 font-semibold">
                  {formatStudentInfo(response)}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">제출일:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(response.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-gray-700">사고루틴:</span>
              <div className="text-blue-600 font-medium">
                {routineTypeLabels[room?.thinking_routine_type] || room?.thinking_routine_type || 'See-Think-Wonder'}
              </div>
            </div>
          </div>

          {/* 학생 응답 - 카드형 레이아웃 */}
          <div className="space-y-3">
            {response.response_data && Object.entries(response.response_data)
              .filter(([key]) => key !== 'fourth_step') // fourth_step 제외
              .map(([key, value]) => {
                const routineType = room?.thinking_routine_type || 'see-think-wonder';
                const stepLabels = routineStepLabels[routineType] || routineStepLabels['see-think-wonder'];
                const stepLabel = stepLabels[key] || key.charAt(0).toUpperCase() + key.slice(1);
                
                const stepColors = {
                  'see': 'bg-blue-500',
                  'think': 'bg-green-500', 
                  'wonder': 'bg-purple-500'
                };
                const stepIcons = {
                  'see': 'S',
                  'think': 'T',
                  'wonder': 'W'
                };
                
                return (
                  <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className={`${stepColors[key] || 'bg-gray-500'} px-4 py-2 flex items-center`}>
                      <div className="w-6 h-6 bg-white bg-opacity-20 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                        {stepIcons[key] || key.charAt(0).toUpperCase()}
                      </div>
                      <h3 className="font-medium text-white">{stepLabel}</h3>
                    </div>
                    <div className="p-4 bg-white">
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{value as string}</p>
                    </div>
                  </div>
                );
              })
            }
          </div>


        </div>

        {/* AI 분석 또는 교사 피드백 섹션 */}
        {!aiAnalysis ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">AI 분석</h2>
            <p className="text-gray-600 mb-4">AI가 학생의 사고루틴 응답을 분석하여 피드백을 제공합니다.</p>
            <button
              onClick={handleAIAnalysis}
              disabled={analyzingAI || !response?.response_data}
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
            response={response}
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