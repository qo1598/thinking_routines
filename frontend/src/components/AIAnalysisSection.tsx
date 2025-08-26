import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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

// 사고루틴 유형별 단계 정보 매핑
const stepInfoMaps: {[routineType: string]: {[stepKey: string]: {title: string, subtitle: string, color: string}}} = {
  'see-think-wonder': {
    'see': { title: 'See', subtitle: '보기', color: 'bg-blue-500' },
    'think': { title: 'Think', subtitle: '생각하기', color: 'bg-green-500' },
    'wonder': { title: 'Wonder', subtitle: '궁금하기', color: 'bg-purple-500' }
  },
  '4c': {
    'see': { title: 'Connect', subtitle: '연결하기', color: 'bg-blue-500' },
    'think': { title: 'Challenge', subtitle: '도전하기', color: 'bg-red-500' },
    'wonder': { title: 'Concepts', subtitle: '개념 파악', color: 'bg-green-500' },
    'fourth_step': { title: 'Changes', subtitle: '변화 제안', color: 'bg-purple-500' }
  },
  'frayer-model': {
    'see': { title: 'Definition', subtitle: '정의', color: 'bg-blue-500' },
    'think': { title: 'Characteristics', subtitle: '특징', color: 'bg-green-500' },
    'wonder': { title: 'Examples & Non-Examples', subtitle: '예시와 반례', color: 'bg-purple-500' }
  },
  'circle-of-viewpoints': {
    'see': { title: 'Viewpoints', subtitle: '관점 탐색', color: 'bg-blue-500' },
    'think': { title: 'Perspective', subtitle: '관점 선택', color: 'bg-green-500' },
    'wonder': { title: 'Questions', subtitle: '관점별 질문', color: 'bg-purple-500' }
  },
  'connect-extend-challenge': {
    'see': { title: 'Connect', subtitle: '연결하기', color: 'bg-blue-500' },
    'think': { title: 'Extend', subtitle: '확장하기', color: 'bg-green-500' },
    'wonder': { title: 'Challenge', subtitle: '도전하기', color: 'bg-red-500' }
  },
  'used-to-think-now-think': {
    'see': { title: 'Used to Think', subtitle: '이전 생각', color: 'bg-blue-500' },
    'think': { title: 'Now Think', subtitle: '현재 생각', color: 'bg-green-500' },
    'wonder': { title: 'Why Changed', subtitle: '변화 이유', color: 'bg-purple-500' }
  },
  'think-puzzle-explore': {
    'see': { title: 'Think', subtitle: '생각하기', color: 'bg-blue-500' },
    'think': { title: 'Puzzle', subtitle: '퍼즐', color: 'bg-yellow-500' },
    'wonder': { title: 'Explore', subtitle: '탐구하기', color: 'bg-green-500' }
  }
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
  const stepInfoMap = stepInfoMaps[currentRoutineType] || stepInfoMaps['see-think-wonder'];

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
              사고루틴 단계별 학생 응답 분석
            </h3>
            {Object.entries(stepInfoMap)
              .filter(([stepKey]) => stepKey !== 'fourth_step')
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
              사고루틴 종합 분석
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-gray-800 mb-2">논리적 연결성</h5>
                <p className="text-sm text-gray-700 text-left">
                  각 단계는 훌륭하게 연결되어 있습니다. See 단계에서 관찰한 페트병과 옷 제작 사실이 
                  Think 단계에서 원인에 대한 질문으로 이어지고, Wonder 단계에서 더 근본적인 문제로 확장되는 자연스러운 
                  흐름을 보여줍니다.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-gray-800 mb-2">사고의 깊이</h5>
                <p className="text-sm text-gray-700 text-left">
                  아직은 얄은 수준이지만, 충분한 잠재력을 가지고 있습니다. Think 단계에서 '무슨 일이 있어서'
                  라는 질문을 통해 문제의 원인을 찾으려는 시도는 긍정적입니다. Wonder 단계에서 '바다에서 많이 나오는 
                  이유'에 대한 질문은 환경 문제에 대한 더 깊은 탐구 가능성을 보여줍니다.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-gray-800 mb-2">개선점과 건설적 피드백</h5>
                <p className="text-sm text-gray-700 text-left">
                  Think 단계 강화: Think 단계에서 좀 더 구체적인 질문을 유도하면 사고의 깊이를 더할 수 있습니다. 
                  예를 들어, "제주도에 페트병이 많은 이유가 관광객 때문일까, 아니면 다른 요인이 있을까?"와 같은 
                  질문을 제안할 수 있습니다.<br/><br/>
                  Wonder 단계 확장: Wonder 단계에서 질문의 범위를 넓혀 문제 해결 능력 및 비판적 사고를 향상
                  시키도록 지도해주시면 더욱 효과적인 사고 활동이 될 것입니다.
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h5 className="font-medium text-gray-800 mb-2">추가 활동 제안</h5>
                <p className="text-sm text-gray-700 text-left">
                  See-Think-Wonder 활동 이후, 학생 스스로 정보를 찾아보거나 토론을 진행하는 활동을 추
                  가하면 학습 효과를 높일 수 있습니다. 예를 들어, 페트병 관련 기사를 읽고 토론하거나, 페트병 재활용 방법에 
                  대해 조사하는 활동을 제안할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
              사고루틴 단계별 학생 응답 피드백 및 평가
            </h3>
            
            {Object.entries(stepInfoMap)
              .filter(([stepKey]) => stepKey !== 'fourth_step')
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
