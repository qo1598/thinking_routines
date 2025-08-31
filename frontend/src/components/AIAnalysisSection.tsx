import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { routineStepLabels, routineTypeLabels, generateStepInfoMap } from '../lib/thinkingRoutineUtils';

interface ParsedAnalysis {
  individualSteps?: {[key: string]: string | string[]};
  summary?: string;
  suggestions?: string;
}

interface AIAnalysisSectionProps {
  parsedAnalysis: ParsedAnalysis | null;
  template: any;
  room: any;
  response: any;
  currentAnalysisStep: number;
  onPrevStep: () => void;
  onNextStep: () => void;
  onShowTeacherFeedback: () => void;
}



// 사고루틴 유형별 표시명 매핑 (표준 routineTypeLabels 사용)
const getRoutineDisplayName = (routineType: string): string => {
  return routineTypeLabels[routineType] || routineTypeLabels['see-think-wonder'];
};

// 기본 분석 텍스트 생성
const getDefaultAnalysisText = (routineType: string): string => {
  const defaultTexts: {[key: string]: string} = {
    'see-think-wonder': '각 단계가 논리적으로 연결되어 있으며, 관찰에서 사고, 그리고 의문으로 이어지는 자연스러운 학습 흘름을 보여줍니다.',
    '4c': '각 단계가 체계적으로 연결되어 있으며, 연결-도전-개념-변화의 순차적 사고 과정을 잘 보여줍니다.',
    'connect-extend-challenge': '연결-확장-도전의 3단계가 순차적으로 이어지며 사고의 깊이를 더해가는 과정을 보여줍니다.',
    'circle-of-viewpoints': '다양한 관점에서 사고하는 능력과 각 관점의 타당성을 평가하는 비판적 사고 능력을 보여줍니다.',
    'frayer-model': '개념의 정의, 특징, 예시, 반례를 중심으로 체계적이고 명확한 개념 이해를 보여줍니다.',
    'used-to-think-now-think': '학습 전후의 인식 변화를 명확하게 비교하며 성찰적 사고 능력을 보여줍니다.',
    'think-puzzle-explore': '기존 지식에서 의문으로, 그리고 탐구 계획으로 이어지는 자기주도적 학습 자세를 보여줍니다.'
  };
  return defaultTexts[routineType] || defaultTexts['see-think-wonder'];
};

const AIAnalysisSection: React.FC<AIAnalysisSectionProps> = ({
  parsedAnalysis,
  template,
  room,
  response,
  currentAnalysisStep,
  onPrevStep,
  onNextStep,
  onShowTeacherFeedback
}) => {
  const currentRoutineType = template?.routine_type || room?.thinking_routine_type || 'see-think-wonder';
  const stepInfoMap = generateStepInfoMap(currentRoutineType);

  // 교사 피드백 및 점수 상태 관리
  const [teacherFeedbacks, setTeacherFeedbacks] = useState<{[stepKey: string]: string}>({});
  const [teacherScores, setTeacherScores] = useState<{[stepKey: string]: number}>({});
  const [saving, setSaving] = useState(false);
  const [existingEvaluation, setExistingEvaluation] = useState<any>(null);

  const gradientColors: {[key: string]: string} = {
    'bg-blue-500': 'from-blue-50 to-blue-100 border-blue-200',
    'bg-green-500': 'from-green-50 to-green-100 border-green-200',
    'bg-purple-500': 'from-purple-50 to-purple-100 border-purple-200',
    'bg-red-500': 'from-red-50 to-red-100 border-red-200',
    'bg-yellow-500': 'from-yellow-50 to-yellow-100 border-yellow-200'
  };

  // 기존 교사 평가 데이터 로드
  useEffect(() => {
    const loadExistingEvaluation = async () => {
      if (!response?.id) return;

      try {
        const { data, error } = await supabase
          .from('teacher_evaluations')
          .select('*')
          .eq('response_id', response.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') { // PGRST116은 데이터 없음 에러
          console.error('기존 평가 로드 오류:', error);
          return;
        }

        if (data) {
          setExistingEvaluation(data);
          
          // 기존 피드백과 점수 로드
          if (data.step_feedbacks) {
            setTeacherFeedbacks(data.step_feedbacks);
          }
          if (data.step_scores) {
            setTeacherScores(data.step_scores);
          }
        }
      } catch (error) {
        console.error('평가 데이터 로드 중 오류:', error);
      }
    };

    loadExistingEvaluation();
  }, [response?.id]);

  // 교사 평가 저장 함수
  const handleSaveEvaluation = async () => {
    if (!response?.id) {
      alert('응답 데이터가 없습니다.');
      return;
    }

    // 입력값 검증
    const hasAnyFeedback = Object.values(teacherFeedbacks).some(feedback => feedback.trim() !== '');
    const hasAnyScore = Object.values(teacherScores).some(score => score > 0);

    if (!hasAnyFeedback && !hasAnyScore) {
      alert('피드백이나 점수 중 하나는 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      const evaluationData = {
        response_id: response.id,
        routine_type: currentRoutineType,
        step_feedbacks: teacherFeedbacks,
        step_scores: teacherScores,
        teacher_feedback: Object.values(teacherFeedbacks).filter(f => f.trim()).join('\n\n'),
        updated_at: new Date().toISOString()
      };

      let result;
      if (existingEvaluation) {
        // 기존 평가 업데이트
        result = await supabase
          .from('teacher_evaluations')
          .update(evaluationData)
          .eq('id', existingEvaluation.id);
      } else {
        // 새 평가 생성
        result = await supabase
          .from('teacher_evaluations')
          .insert([{
            ...evaluationData,
            created_at: new Date().toISOString()
          }]);
      }

      if (result.error) {
        throw result.error;
      }

      alert('교사 평가가 성공적으로 저장되었습니다!');
      
      // 저장 후 데이터 다시 로드
      if (!existingEvaluation) {
        const { data: newData } = await supabase
          .from('teacher_evaluations')
          .select('*')
          .eq('response_id', response.id)
          .maybeSingle();
        
        if (newData) {
          setExistingEvaluation(newData);
        }
      }

    } catch (error: any) {
      console.error('평가 저장 오류:', error);
      alert('평가 저장 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const renderAnalysisStep = () => {
    switch (currentAnalysisStep) {
      case 0:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
              {getRoutineDisplayName(currentRoutineType)} 단계별 학생 응답 분석
            </h3>
            {Object.entries(stepInfoMap)

              .map(([stepKey, stepInfo], index) => {
                const studentResponse = response?.response_data?.[stepKey];
                const aiAnalysis = parsedAnalysis?.individualSteps?.[stepKey];
                
                if (!studentResponse && !aiAnalysis) return null;

                return (
                  <div key={stepKey} className="border rounded-lg overflow-hidden">
                    {/* 단계 헤더 */}
                    <div className={`${stepInfo.color} text-white px-4 py-2`}>
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white font-semibold mr-3 text-sm">
                          {stepInfo.title.charAt(0)}
                        </div>
                        <h4 className="font-medium text-white">
                          {stepInfo.title} ({stepInfo.subtitle})
                        </h4>
                      </div>
                    </div>
                    
                    <div className="p-4 space-y-3">
                      {/* 학생 응답 */}
                      {studentResponse && (
                        <div className="p-3 bg-gray-50 rounded">
                          <p className="text-sm text-gray-700">{studentResponse}</p>
                        </div>
                      )}
                      
                      {/* AI 분석 */}
                      {aiAnalysis && (
                        <div className="p-3 bg-blue-50 rounded">
                          <p className="text-sm font-medium text-gray-800 mb-2">AI 분석</p>
                          <div className="text-sm text-gray-700 leading-relaxed text-left">
                            {Array.isArray(aiAnalysis) ? (
                              aiAnalysis.map((item, i) => (
                                <p key={i} className="mb-2">{String(item)}</p>
                              ))
                            ) : (
                              <p>{String(aiAnalysis)}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
              {getRoutineDisplayName(currentRoutineType)} 사고루틴 종합 분석
            </h3>
            
            <div className="space-y-4">
              {parsedAnalysis?.comprehensive ? (
                <div className="space-y-4">
                  {/* 종합 분석을 마크다운으로 파싱해서 4가지 항목으로 분리 표시 */}
                  {(() => {
                    const comprehensive = parsedAnalysis.comprehensive;
                    
                    // 논리적 연결성 추출
                    const logicalMatch = comprehensive.match(/\*\*논리적\s*연결성\*\*\s*\n([\s\S]*?)(?=\*\*사고의\s*깊이|\*\*개선점|$)/);
                    const logical = logicalMatch ? logicalMatch[1].trim() : '';
                    
                    // 사고의 깊이 추출
                    const depthMatch = comprehensive.match(/\*\*사고의\s*깊이\*\*\s*\n([\s\S]*?)(?=\*\*개선점|\*\*추가\s*활동|$)/);
                    const depth = depthMatch ? depthMatch[1].trim() : '';
                    
                    // 개선점과 건설적 피드백 추출
                    const improvementMatch = comprehensive.match(/\*\*개선점과?\s*(?:건설적\s*)?피드백\*\*\s*\n([\s\S]*?)(?=\*\*추가\s*활동|$)/);
                    const improvement = improvementMatch ? improvementMatch[1].trim() : '';
                    
                    // 추가 활동 제안 추출
                    const suggestionMatch = comprehensive.match(/\*\*추가\s*활동\s*제안\*\*\s*\n([\s\S]*?)$/);
                    const suggestion = suggestionMatch ? suggestionMatch[1].trim() : '';
                    
                    return (
                      <>
                        {logical && (
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <h5 className="font-medium text-gray-800 mb-2">논리적 연결성</h5>
                            <p className="text-sm text-gray-700 text-left">
                              {logical}
                            </p>
                          </div>
                        )}
                        
                        {depth && (
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <h5 className="font-medium text-gray-800 mb-2">사고의 깊이</h5>
                            <p className="text-sm text-gray-700 text-left">
                              {depth}
                            </p>
                          </div>
                        )}
                        
                        {improvement && (
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <h5 className="font-medium text-gray-800 mb-2">개선점과 건설적 피드백</h5>
                            <p className="text-sm text-gray-700 text-left">
                              {improvement}
                            </p>
                          </div>
                        )}
                        
                        {suggestion && (
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <h5 className="font-medium text-gray-800 mb-2">추가 활동 제안</h5>
                            <p className="text-sm text-gray-700 text-left">
                              {suggestion}
                            </p>
                          </div>
                        )}
                        
                        {/* 개별 항목이 없는 경우 전체 텍스트 표시 */}
                        {!logical && !depth && !improvement && !suggestion && (
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <h5 className="font-medium text-gray-800 mb-2">종합 분석</h5>
                            <div className="text-sm text-gray-700 text-left whitespace-pre-wrap">
                              {comprehensive}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-gray-800 mb-2">분석 결과가 없습니다</h5>
                  <p className="text-sm text-gray-700 text-left">
                    AI 분석 결과를 불러오는 중입니다...
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
              {getRoutineDisplayName(currentRoutineType)} 단계별 학생 응답 피드백 및 평가
            </h3>
            
            {Object.entries(stepInfoMap)

              .map(([stepKey, stepInfo], index) => {
                const studentResponse = response?.response_data?.[stepKey];
                const aiAnalysis = parsedAnalysis?.individualSteps?.[stepKey];
                
                if (!studentResponse && !aiAnalysis) return null;

                return (
                  <div key={stepKey} className="border rounded-lg overflow-hidden">
                    {/* 단계 헤더 */}
                    <div className={`${stepInfo.color} text-white px-4 py-2`}>
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white font-semibold mr-3 text-sm">
                          {stepInfo.title.charAt(0)}
                        </div>
                        <h4 className="font-medium text-white">
                          {stepInfo.title} ({stepInfo.subtitle})
                        </h4>
                      </div>
                    </div>
                    
                    <div className="p-4 space-y-3">
                      {/* 학생 응답 */}
                      {studentResponse && (
                        <div className="p-3 bg-gray-50 rounded">
                          <p className="text-sm text-gray-700">{studentResponse}</p>
                        </div>
                      )}
                      
                      {/* AI 분석 */}
                      {aiAnalysis && (
                        <div className="p-3 bg-blue-50 rounded">
                          <p className="text-sm font-medium text-gray-800 mb-2">AI 분석</p>
                          <div className="text-sm text-gray-700 leading-relaxed text-left">
                            {Array.isArray(aiAnalysis) ? (
                              aiAnalysis.map((item, i) => (
                                <p key={i} className="mb-2">{String(item)}</p>
                              ))
                            ) : (
                              <p>{String(aiAnalysis)}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 교사 피드백 및 점수 입력 */}
                      <div className="p-3 bg-yellow-50 rounded">
                        <div className="flex items-start space-x-3">
                          <div className="flex-1">
                            <label className="text-sm font-medium text-gray-800 mb-2 block">
                              교사 피드백
                            </label>
                            <textarea
                              className="w-full p-2 border border-gray-300 rounded text-sm"
                              rows={3}
                              placeholder="이 단계에 대한 피드백을 작성해주세요..."
                              value={teacherFeedbacks[stepKey] || ''}
                              onChange={(e) => setTeacherFeedbacks(prev => ({
                                ...prev,
                                [stepKey]: e.target.value
                              }))}
                            />
                          </div>
                          <div className="flex-shrink-0">
                            <label className="text-sm font-medium text-gray-800 mb-2 block">
                              점수
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              className="w-16 p-2 border border-gray-300 rounded text-sm text-center"
                              placeholder="점수"
                              value={teacherScores[stepKey] || ''}
                              onChange={(e) => setTeacherScores(prev => ({
                                ...prev,
                                [stepKey]: parseInt(e.target.value) || 0
                              }))}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

            {/* 저장하기 버튼 */}
            <div className="flex justify-center pt-4">
              <button
                className="bg-green-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSaveEvaluation}
                disabled={saving}
              >
                {saving ? '저장 중...' : existingEvaluation ? '평가 업데이트' : '평가 저장'}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900">AI 분석 결과</h2>
          <div className="text-sm text-gray-500">
            {currentAnalysisStep + 1} / 3
          </div>
        </div>
      </div>

      {/* 진행 표시기 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-2">
          {[0, 1, 2].map((step) => (
            <div
              key={step}
              className={`w-3 h-3 rounded-full ${
                currentAnalysisStep >= step ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 분석 내용 */}
      {renderAnalysisStep()}

      {/* 네비게이션 버튼 */}
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={onPrevStep}
          disabled={currentAnalysisStep === 0}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          이전 단계
        </button>

        <div className="flex space-x-3">
          {currentAnalysisStep < 2 && (
            <button
              onClick={onNextStep}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            >
              다음 단계
              <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisSection;
