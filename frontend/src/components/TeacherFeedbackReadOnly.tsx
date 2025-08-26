import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { routineTypeLabels, routineStepLabels } from '../lib/thinkingRoutineUtils';

interface TeacherFeedbackReadOnlyProps {
  responseId: string;
  routineType: string;
  aiAnalysis?: string; // AI 분석 데이터 추가
}

interface TeacherEvaluation {
  routine_type: string;
  step_feedbacks: {[key: string]: string};
  step_scores: {[key: string]: number};
  overall_feedback?: string;
  overall_score?: number;
}

const TeacherFeedbackReadOnly: React.FC<TeacherFeedbackReadOnlyProps> = ({ 
  responseId, 
  routineType,
  aiAnalysis 
}) => {
  const [evaluation, setEvaluation] = useState<TeacherEvaluation | null>(null);
  const [loading, setLoading] = useState(true);

  // AI 분석 결과 파싱
  const parseAIAnalysis = (aiAnalysisString: string) => {
    try {
      // 먼저 JSON 형태인지 확인
      if (aiAnalysisString.trim().startsWith('{')) {
        const parsed = JSON.parse(aiAnalysisString);
        
        // ThinkingRoutineAnalysis에서 저장한 구조화된 형태 처리
        if (parsed.aiAnalysis && parsed.aiAnalysis.individualSteps) {
          return {
            individualSteps: parsed.aiAnalysis.individualSteps,
            comprehensive: parsed.aiAnalysis.comprehensive,
            educational: parsed.aiAnalysis.educational,
            stepByStep: parsed.aiAnalysis.stepByStep,
            teacherFeedback: parsed.teacherFeedback?.individualSteps || {}
          };
        }
        
        // 기존 형태 처리 (직접 individualSteps가 있는 경우)
        if (parsed.individualSteps) {
          return parsed;
        }
        
        return parsed;
      }
      
      // 마크다운 텍스트 형태의 AI 분석 파싱
      const individualSteps: { [key: string]: string } = {};
      
      // See-Think-Wonder 패턴 매칭
      const seeMatch = aiAnalysisString.match(/\*\*See\s*\([^)]*\)\*\*:?\s*([^*]+?)(?=\*\*|$)/s);
      const thinkMatch = aiAnalysisString.match(/\*\*Think\s*\([^)]*\)\*\*:?\s*([^*]+?)(?=\*\*|$)/s);
      const wonderMatch = aiAnalysisString.match(/\*\*Wonder\s*\([^)]*\)\*\*:?\s*([^*]+?)(?=\*\*|$)/s);
      
      if (seeMatch) individualSteps.see = seeMatch[1].trim();
      if (thinkMatch) individualSteps.think = thinkMatch[1].trim();
      if (wonderMatch) individualSteps.wonder = wonderMatch[1].trim();
      
      // 4C 패턴 매칭
      const connectMatch = aiAnalysisString.match(/\*\*Connect\s*\([^)]*\)\*\*:?\s*([^*]+?)(?=\*\*|$)/s);
      const challengeMatch = aiAnalysisString.match(/\*\*Challenge\s*\([^)]*\)\*\*:?\s*([^*]+?)(?=\*\*|$)/s);
      const conceptsMatch = aiAnalysisString.match(/\*\*Concepts?\s*\([^)]*\)\*\*:?\s*([^*]+?)(?=\*\*|$)/s);
      const changesMatch = aiAnalysisString.match(/\*\*Changes?\s*\([^)]*\)\*\*:?\s*([^*]+?)(?=\*\*|$)/s);
      
      if (connectMatch) individualSteps.connect = connectMatch[1].trim();
      if (challengeMatch) individualSteps.challenge = challengeMatch[1].trim();
      if (conceptsMatch) individualSteps.concepts = conceptsMatch[1].trim();
      if (changesMatch) individualSteps.changes = changesMatch[1].trim();
      
      console.log('🔍 Parsed markdown steps:', individualSteps);
      
      const result = {
        individualSteps,
        comprehensive: null,
        educational: null,
        stepByStep: null,
        teacherFeedback: {}
      };
      
      console.log('🔍 Returning parsed result:', result);
      return result;
      
    } catch (error) {
      console.error('AI 분석 데이터 파싱 오류:', error);
      return null;
    }
  };

  // 마크다운 텍스트 포맷팅
  const formatMarkdownText = (text: string): string => {
    if (!text) return '';
    
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>')
      .replace(/- (.*?)(?=\n|$)/g, '• $1')
      .replace(/\d+\. (.*?)(?=\n|$)/g, '<strong>$&</strong>');
  };

  // 디버깅용 로그
  console.log('🔍 TeacherFeedbackReadOnly - Raw AI Analysis:', aiAnalysis);
  
  const parsedAI = aiAnalysis ? parseAIAnalysis(aiAnalysis) : null;
  
  console.log('🔍 TeacherFeedbackReadOnly - Parsed AI:', parsedAI);
  console.log('🔍 TeacherFeedbackReadOnly - Individual Steps:', parsedAI?.individualSteps);
  console.log('🔍 TeacherFeedbackReadOnly - parsedAI 객체 전체:', JSON.stringify(parsedAI, null, 2));

  useEffect(() => {
    fetchTeacherEvaluation();
  }, [responseId]);

  const fetchTeacherEvaluation = async () => {
    try {
      const { data, error } = await supabase
        .from('teacher_evaluations')
        .select('*')
        .eq('response_id', responseId)
        .single();

      if (error) {
        console.log('교사 평가 데이터가 없습니다:', error);
        setEvaluation(null);
      } else {
        setEvaluation(data);
      }
    } catch (err) {
      console.error('교사 평가 데이터 로딩 오류:', err);
      setEvaluation(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // AI 분석이나 교사 평가 중 하나도 없으면 빈 상태 표시
  if (!evaluation && !parsedAI) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            교사 평가 및 피드백
          </h2>
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">AI 분석 및 교사 평가가 없습니다</h3>
            <p className="text-gray-600">아직 이 학생 응답에 대한 AI 분석이나 교사 평가가 없습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  const stepLabels = routineStepLabels[routineType] || routineStepLabels['see-think-wonder'];

  // 단계별 색상 정의
  const stepColors = {
    'see': 'bg-blue-500',
    'think': 'bg-green-500', 
    'wonder': 'bg-purple-500',
    'connect': 'bg-indigo-500',
    'challenge': 'bg-red-500',
    'concepts': 'bg-yellow-500',
    'changes': 'bg-pink-500',
    'extend': 'bg-teal-500',
    'definition': 'bg-cyan-500',
    'characteristics': 'bg-orange-500',
    'examples': 'bg-lime-500',
    'non_examples': 'bg-rose-500',
    'used_to_think': 'bg-violet-500',
    'now_think': 'bg-emerald-500',
    'puzzle': 'bg-amber-500',
    'explore': 'bg-sky-500',
    'viewpoint_select': 'bg-fuchsia-500',
    'viewpoint_thinking': 'bg-slate-500',
    'viewpoint_concerns': 'bg-neutral-500'
  };

  const stepIcons = {
    'see': 'S',
    'think': 'T', 
    'wonder': 'W',
    'connect': 'C',
    'challenge': 'Ch',
    'concepts': 'Co',
    'changes': 'Ch',
    'extend': 'E',
    'definition': 'D',
    'characteristics': 'Ch',
    'examples': 'Ex',
    'non_examples': 'N',
    'used_to_think': 'U',
    'now_think': 'N',
    'puzzle': 'P',
    'explore': 'E',
    'viewpoint_select': 'V1',
    'viewpoint_thinking': 'V2',
    'viewpoint_concerns': 'V3'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          교사 평가 및 피드백
        </h2>

        {/* 단계별 피드백 */}
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">단계별 AI 분석 및 교사 평가</h3>
          
          {Object.entries(stepLabels).map(([stepKey, stepLabel]) => {
            const feedback = evaluation?.step_feedbacks?.[stepKey];
            const score = evaluation?.step_scores?.[stepKey];
            const aiStepAnalysis = parsedAI?.individualSteps?.[stepKey];
            
            console.log(`🔍 Step ${stepKey}:`, { 
              stepLabel,
              feedback, 
              score, 
              aiStepAnalysis,
              hasAI: !!aiStepAnalysis,
              hasFeedback: !!feedback,
              hasScore: !!score,
              shouldShow: !(!aiStepAnalysis && !feedback && !score)
            });
            
            // AI 분석이나 교사 피드백 중 하나라도 있으면 표시
            if (!aiStepAnalysis && !feedback && !score) {
              console.log(`❌ Skipping step ${stepKey} - no data`);
              return null;
            }
            
            console.log(`✅ Rendering step ${stepKey}`);
            

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
                <div className="p-4 bg-white space-y-4">
                  {/* AI 분석 */}
                  {aiStepAnalysis && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        AI 분석
                      </h5>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div 
                          className="text-gray-700 leading-relaxed text-sm"
                          dangerouslySetInnerHTML={{ __html: formatMarkdownText(String(aiStepAnalysis)) }}
                        />
                      </div>
                    </div>
                  )}

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
        </div>

        {/* 종합 평가 */}
        {(evaluation?.overall_feedback || evaluation?.overall_score) && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">종합 평가</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-green-800 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  전체 평가
                </h4>
                {evaluation?.overall_score && (
                  <div className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold">
                    {evaluation.overall_score}점 / 100점
                  </div>
                )}
              </div>
              {evaluation?.overall_feedback && (
                <div className="bg-white rounded-md p-4 border border-green-200">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {evaluation.overall_feedback}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherFeedbackReadOnly;
