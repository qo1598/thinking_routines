import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface ParsedAnalysis {
  individualSteps?: {[key: string]: string | string[]};
  summary?: string;
  suggestions?: string;
}

interface TeacherFeedbackSectionProps {
  responseId: string;
  parsedAnalysis: ParsedAnalysis | null;
  template: any;
  room: any;
  onBack: () => void;
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

const TeacherFeedbackSection: React.FC<TeacherFeedbackSectionProps> = ({
  responseId,
  parsedAnalysis,
  template,
  room,
  onBack
}) => {
  const [stepFeedbacks, setStepFeedbacks] = useState<{[key: string]: string}>({});
  const [stepScores, setStepScores] = useState<{[key: string]: number}>({});
  const [savingFeedback, setSavingFeedback] = useState(false);

  const handleSaveTeacherFeedback = async () => {
    setSavingFeedback(true);
    try {
      // 개별 단계 피드백과 점수를 JSON으로 저장
      const feedbackData = {
        step_feedbacks: stepFeedbacks,
        step_scores: stepScores,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('student_responses')
        .update({
          teacher_feedback: JSON.stringify(feedbackData),
          teacher_score: Object.values(stepScores).length > 0 
            ? Math.round(Object.values(stepScores).reduce((a, b) => a + b, 0) / Object.values(stepScores).length)
            : null
        })
        .eq('id', responseId);

      if (error) throw error;

      alert('교사 피드백이 저장되었습니다.');
      onBack();
    } catch (error) {
      console.error('피드백 저장 중 오류:', error);
      alert('피드백 저장 중 오류가 발생했습니다.');
    } finally {
      setSavingFeedback(false);
    }
  };

  const currentRoutineType = template?.routine_type || room?.thinking_routine_type || 'see-think-wonder';
  const stepInfoMap = stepInfoMaps[currentRoutineType] || stepInfoMaps['see-think-wonder'];

  const gradientColors: {[key: string]: string} = {
    'bg-blue-500': 'from-blue-50 to-blue-100 border-blue-200',
    'bg-green-500': 'from-green-50 to-green-100 border-green-200',
    'bg-purple-500': 'from-purple-50 to-purple-100 border-purple-200',
    'bg-red-500': 'from-red-50 to-red-100 border-red-200',
    'bg-yellow-500': 'from-yellow-50 to-yellow-100 border-yellow-200'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <button
            onClick={onBack}
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

      {/* 4단계와 동일한 각 단계별 분석 + 교사 피드백 입력 */}
      {parsedAnalysis?.individualSteps && Object.keys(parsedAnalysis.individualSteps).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(parsedAnalysis.individualSteps).map(([stepKey, stepContent], index) => {
            const stepInfo = stepInfoMap[stepKey];
            if (!stepInfo) return null;

            return (
              <div 
                key={stepKey}
                className={`bg-gradient-to-br ${gradientColors[stepInfo.color] || 'from-gray-50 to-white border-gray-200'} border rounded-xl p-6`}
              >
                <h3 className={`text-lg font-bold mb-4 flex items-center ${
                  stepInfo.color === 'bg-blue-500' ? 'text-blue-800' :
                  stepInfo.color === 'bg-green-500' ? 'text-green-800' :
                  stepInfo.color === 'bg-purple-500' ? 'text-purple-800' :
                  stepInfo.color === 'bg-red-500' ? 'text-red-800' : 'text-gray-800'
                }`}>
                  <span className={`w-8 h-8 ${stepInfo.color} text-white rounded-full flex items-center justify-center text-sm font-bold mr-3`}>
                    {index + 1}
                  </span>
                  {stepInfo.title} ({stepInfo.subtitle})
                </h3>
                
                {/* AI 분석 결과 (4단계와 동일) */}
                <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-1 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI 분석 결과
                  </h4>
                  <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed text-left">
                    {Array.isArray(stepContent) ? (
                      stepContent.map((item, i) => (
                        <p key={i} className="mb-2">{String(item)}</p>
                      ))
                    ) : (
                      <p>{String(stepContent)}</p>
                    )}
                  </div>
                </div>

                {/* 교사 피드백 입력란 */}
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-1 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    교사 피드백
                  </h4>
                  <textarea
                    value={stepFeedbacks[stepKey] || ''}
                    onChange={(e) => setStepFeedbacks({...stepFeedbacks, [stepKey]: e.target.value})}
                    rows={3}
                    className={`w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent resize-none ${
                      stepInfo.color === 'bg-blue-500' ? 'focus:ring-blue-500' :
                      stepInfo.color === 'bg-green-500' ? 'focus:ring-green-500' :
                      stepInfo.color === 'bg-purple-500' ? 'focus:ring-purple-500' :
                      stepInfo.color === 'bg-red-500' ? 'focus:ring-red-500' : 'focus:ring-gray-500'
                    }`}
                    placeholder={`${stepInfo.title} (${stepInfo.subtitle}) 단계에 대한 피드백을 입력하세요...`}
                  />
                </div>

                {/* 점수 입력 */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-1 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    점수 (1-100점)
                  </h4>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={stepScores[stepKey] || ''}
                      onChange={(e) => setStepScores({...stepScores, [stepKey]: parseInt(e.target.value) || 0})}
                      className="w-20 px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-center"
                      placeholder="점수"
                    />
                    <span className="text-sm text-gray-600">/ 100점</span>
                    <div className="ml-auto">
                      {stepScores[stepKey] && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          stepScores[stepKey] >= 80 ? 'bg-green-100 text-green-800' :
                          stepScores[stepKey] >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {stepScores[stepKey] >= 80 ? '우수' : stepScores[stepKey] >= 60 ? '보통' : '개선필요'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-700 mb-2">AI 분석 데이터 확인</h4>
          <p className="text-gray-600 mb-4">구조화된 AI 분석 결과를 찾을 수 없습니다.</p>
          <p className="text-sm text-gray-500">먼저 4단계 AI 분석을 완료해주세요.</p>
        </div>
      )}

      {/* 저장 버튼 */}
      <div className="mt-8 flex justify-end space-x-4">
        <button
          onClick={() => {
            const totalSteps = Object.keys(stepFeedbacks).length + Object.keys(stepScores).length;
            if (totalSteps === 0) {
              alert('최소한 하나의 단계에 피드백 또는 점수를 입력해주세요.');
              return;
            }
            handleSaveTeacherFeedback();
          }}
          disabled={savingFeedback}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {savingFeedback ? '저장 중...' : '피드백 저장'}
        </button>
      </div>
    </div>
  );
};

export default TeacherFeedbackSection;
