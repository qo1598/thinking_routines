import React from 'react';

interface ParsedAnalysis {
  individualSteps?: {[key: string]: string | string[]};
  summary?: string;
  suggestions?: string;
}

interface AIAnalysisSectionProps {
  parsedAnalysis: ParsedAnalysis | null;
  template: any;
  room: any;
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
  currentAnalysisStep,
  onPrevStep,
  onNextStep,
  onShowTeacherFeedback
}) => {
  const currentRoutineType = template?.routine_type || room?.thinking_routine_type || 'see-think-wonder';
  const stepInfoMap = stepInfoMaps[currentRoutineType] || stepInfoMaps['see-think-wonder'];

  const gradientColors: {[key: string]: string} = {
    'bg-blue-500': 'from-blue-50 to-blue-100 border-blue-200',
    'bg-green-500': 'from-green-50 to-green-100 border-green-200',
    'bg-purple-500': 'from-purple-50 to-purple-100 border-purple-200',
    'bg-red-500': 'from-red-50 to-red-100 border-red-200',
    'bg-yellow-500': 'from-yellow-50 to-yellow-100 border-yellow-200'
  };

  const renderAnalysisStep = () => {
    switch (currentAnalysisStep) {
      case 0:
        return (
          <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
            <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
              전체 분석 개요
            </h3>
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
              {parsedAnalysis?.summary ? (
                <p>{parsedAnalysis.summary}</p>
              ) : (
                <p>전체적인 분석 개요를 확인할 수 있습니다.</p>
              )}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
              각 단계별 분석
            </h3>
            {parsedAnalysis?.individualSteps && Object.keys(parsedAnalysis.individualSteps).length > 0 ? (
              Object.entries(parsedAnalysis.individualSteps).map(([stepKey, stepContent], index) => {
                const stepInfo = stepInfoMap[stepKey];
                if (!stepInfo) return null;

                return (
                  <div 
                    key={stepKey}
                    className={`bg-gradient-to-br ${gradientColors[stepInfo.color] || 'from-gray-50 to-white border-gray-200'} border rounded-xl p-6`}
                  >
                    <h4 className={`text-lg font-bold mb-4 flex items-center ${
                      stepInfo.color === 'bg-blue-500' ? 'text-blue-800' :
                      stepInfo.color === 'bg-green-500' ? 'text-green-800' :
                      stepInfo.color === 'bg-purple-500' ? 'text-purple-800' :
                      stepInfo.color === 'bg-red-500' ? 'text-red-800' : 'text-gray-800'
                    }`}>
                      <span className={`w-8 h-8 ${stepInfo.color} text-white rounded-full flex items-center justify-center text-sm font-bold mr-3`}>
                        {index + 1}
                      </span>
                      {stepInfo.title} ({stepInfo.subtitle})
                    </h4>
                    <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                      {Array.isArray(stepContent) ? (
                        stepContent.map((item, i) => (
                          <p key={i} className="mb-2">{String(item)}</p>
                        ))
                      ) : (
                        <p>{String(stepContent)}</p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">개별 단계별 분석 결과를 찾을 수 없습니다.</p>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
            <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
              개선 제안 및 종합 평가
            </h3>
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
              {parsedAnalysis?.suggestions ? (
                <p>{parsedAnalysis.suggestions}</p>
              ) : (
                <p>개선 제안 및 종합 평가 내용을 확인할 수 있습니다.</p>
              )}
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
          <h2 className="text-xl font-bold text-gray-900">4단계: 분석 결과</h2>
          <div className="text-sm text-gray-500">
            {currentAnalysisStep + 1} / 3
          </div>
        </div>
        <div className="text-sm text-gray-500">
          AI가 분석한 결과를 단계별로 확인하고 교사 피드백을 작성할 수 있습니다
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
          {currentAnalysisStep < 2 ? (
            <button
              onClick={onNextStep}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            >
              다음 단계
              <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={onShowTeacherFeedback}
              className="flex items-center px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              교사 피드백 작성
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisSection;
