import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import AIAnalysisSection from './AIAnalysisSection';
import TeacherFeedbackSection from './TeacherFeedbackSection';
import StudentResponseSection from './StudentResponseSection';
import { parseAIAnalysis } from '../lib/thinkingRoutineUtils';

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

      if (responseData.room_id) {
        const { data: roomData, error: roomError } = await supabase
          .from('activity_rooms')
          .select('*')
          .eq('id', responseData.room_id)
          .single();

        if (roomError) throw roomError;
        setRoom(roomData);

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
    if (!aiAnalysis || !room?.thinking_routine_type) return;

    const routineType = room.thinking_routine_type;
    const parsed = parseAIAnalysis(aiAnalysis, routineType);
    
    if (parsed) {
      setParsedAnalysis(parsed);
    }
  };

  const handleAIAnalysis = async () => {
    if (!response?.response_data || !template) return;

    setAnalyzingAI(true);
    try {
      const analysisResponse = await fetch('/api/analyze-routine-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routineType: room.thinking_routine_type,
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
        <StudentResponseSection 
          response={response}
          room={room}
          template={template}
        />

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
