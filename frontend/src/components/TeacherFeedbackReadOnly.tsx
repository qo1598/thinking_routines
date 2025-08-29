import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { routineTypeLabels, routineStepLabels } from '../lib/thinkingRoutineUtils';
import { parseStoredAIAnalysis, AIAnalysisData } from '../lib/aiAnalysisUtils';

interface TeacherFeedbackReadOnlyProps {
  responseId: string;
  routineType: string;
  aiAnalysis?: string | null;
}

interface TeacherEvaluation {
  id: string;
  response_id: string;
  teacher_id: string;
  teacher_feedback: string;
  score: number;
  evaluation_data: any;
  step_feedbacks: Record<string, string>;
  step_scores: Record<string, number>;
  overall_feedback: string;
  overall_score: number;
  routine_type: string;
  created_at: string;
  updated_at: string;
}

const stepColors: Record<string, string> = {
  see: 'bg-blue-500',
  think: 'bg-green-500', 
  wonder: 'bg-purple-500',
  connect: 'bg-blue-500',
  challenge: 'bg-orange-500',
  concepts: 'bg-green-500',
  changes: 'bg-purple-500',
  viewpoint_select: 'bg-blue-500',
  viewpoint_thinking: 'bg-green-500',
  viewpoint_concerns: 'bg-purple-500',
  extend: 'bg-green-500',
  definition: 'bg-blue-500',
  characteristics: 'bg-green-500',
  examples: 'bg-yellow-500',
  non_examples: 'bg-red-500',
  used_to_think: 'bg-blue-500',
  now_think: 'bg-green-500',
  puzzle: 'bg-green-500',
  explore: 'bg-purple-500'
};

const stepIcons: Record<string, string> = {
  see: '👁️',
  think: '💭', 
  wonder: '❓',
  connect: '🔗',
  challenge: '⚡',
  concepts: '💡',
  changes: '🔄',
  viewpoint_select: '👁️',
  viewpoint_thinking: '💭',
  viewpoint_concerns: '❓',
  extend: '🚀',
  definition: '📝',
  characteristics: '🔍',
  examples: '✅',
  non_examples: '❌',
  used_to_think: '🕐',
  now_think: '🕕',
  puzzle: '🧩',
  explore: '🔍'
};

const formatMarkdownText = (text: string): string => {
  if (!text) return '';
  
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>')
    .replace(/•/g, '•')
    .replace(/^\s*\*\s+/gm, '• ');
};

const TeacherFeedbackReadOnly: React.FC<TeacherFeedbackReadOnlyProps> = ({
  responseId,
  routineType,
  aiAnalysis
}) => {
  const [evaluation, setEvaluation] = useState<TeacherEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 해당 사고루틴 유형의 단계 라벨
  const stepLabels = routineStepLabels[routineType] || {};

  // AI 분석 파싱
  const parsedAI: AIAnalysisData | null = aiAnalysis ? parseStoredAIAnalysis(aiAnalysis, routineType) : null;
  
  console.log('🔍 TeacherFeedbackReadOnly - Raw AI Analysis:', aiAnalysis);
  console.log('🔍 TeacherFeedbackReadOnly - Parsed AI (NEW SYSTEM):', parsedAI);
  console.log('🔍 TeacherFeedbackReadOnly - stepByStep Content:', parsedAI?.stepByStep);

  useEffect(() => {
    loadTeacherEvaluation();
  }, [responseId]);

  const loadTeacherEvaluation = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('teacher_evaluations')
        .select('*')
        .eq('response_id', responseId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setEvaluation(data);
    } catch (err: any) {
      console.error('교사 평가 로드 오류:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-200 h-10 w-10"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-red-600">
          오류가 발생했습니다: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
        <svg className="w-6 h-6 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        교사 평가 및 피드백
      </h2>

      {/* AI 분석 전체 표시 */}
      {parsedAI?.stepByStep && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">AI 분석 결과</h3>
          <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-purple-500">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="font-semibold text-purple-700">각 단계별 응답의 품질과 적절성 평가</span>
            </div>
            <div 
              className="text-sm text-gray-800 leading-relaxed text-left"
              dangerouslySetInnerHTML={{ __html: formatMarkdownText(parsedAI.stepByStep) }}
            />
          </div>
        </div>
      )}

      {/* 단계별 교사 피드백 */}
      <div className="space-y-4 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">단계별 교사 평가</h3>
        
        {Object.entries(stepLabels).map(([stepKey, stepLabel]) => {
          const feedback = evaluation?.step_feedbacks?.[stepKey];
          const score = evaluation?.step_scores?.[stepKey];
          
          // 교사 피드백이나 점수가 있는 경우만 표시
          if (!feedback && !score) {
            return null;
          }
          
          return (
            <div key={stepKey} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className={`${stepColors[stepKey] || 'bg-gray-500'} px-4 py-2 flex items-center justify-between`}>
                <div className="flex items-center">
                  <div className="w-8 h-6 bg-white bg-opacity-20 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                    {stepIcons[stepKey] || stepKey.charAt(0).toUpperCase()}
                  </div>
                  <h4 className="font-medium text-white">{stepLabel}</h4>
                </div>
                {score && (
                  <div className="bg-white bg-opacity-20 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {score}점
                  </div>
                )}
              </div>
              <div className="p-4 bg-white">
                {/* 교사 피드백 */}
                {feedback && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <svg className="w-4 h-4 mr-1 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      교사 피드백
                    </h5>
                    <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm">{feedback}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* 교사 피드백이 없는 경우 메시지 */}
        {Object.entries(stepLabels).every(([stepKey]) => !evaluation?.step_feedbacks?.[stepKey] && !evaluation?.step_scores?.[stepKey]) && (
          <div className="text-center text-gray-500 py-8">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>아직 교사 평가가 없습니다.</p>
          </div>
        )}
      </div>

      {/* 종합 평가 */}
      {(evaluation?.overall_feedback || evaluation?.overall_score) && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">종합 평가</h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-green-800 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                종합 피드백
              </h4>
              {evaluation.overall_score && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  {evaluation.overall_score}점
                </span>
              )}
            </div>
            {evaluation.overall_feedback && (
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{evaluation.overall_feedback}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherFeedbackReadOnly;