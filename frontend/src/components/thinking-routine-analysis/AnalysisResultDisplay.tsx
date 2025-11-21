import React from 'react';
import { ParsedAnalysis } from '../../types';
import { formatMarkdownText } from '../../lib/analysisParser';
import { ROUTINE_CONFIGS } from '../../constants/routineConfigs';

interface AnalysisResultDisplayProps {
    selectedRoutine: string;
    parsedAnalysis: ParsedAnalysis;
    currentAnalysisStep: number;
    onNextStep: () => void;
    onPrevStep: () => void;
    showTeacherFeedback: boolean;
    stepFeedbacks: { [key: string]: string };
    stepScores: { [key: string]: number };
    onFeedbackChange: (step: string, feedback: string) => void;
    onScoreChange: (step: string, score: number) => void;
    onSave: () => void;
    saving: boolean;
}

export const AnalysisResultDisplay: React.FC<AnalysisResultDisplayProps> = ({
    selectedRoutine,
    parsedAnalysis,
    currentAnalysisStep,
    onNextStep,
    onPrevStep,
    showTeacherFeedback,
    stepFeedbacks,
    stepScores,
    onFeedbackChange,
    onScoreChange,
    onSave,
    saving
}) => {
    const routineConfig = ROUTINE_CONFIGS[selectedRoutine];
    const steps = routineConfig?.steps || [];
    const stepLabels = routineConfig?.stepLabels || {};

    // 현재 단계가 분석 단계 범위 내인지 확인
    const isAnalysisStep = currentAnalysisStep < steps.length;
    const currentStepKey = isAnalysisStep ? steps[currentAnalysisStep] : null;
    const currentStepLabel = currentStepKey ? stepLabels[currentStepKey] : null;

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-purple-100">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white flex items-center">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI 분석 결과
                </h3>
                <div className="flex space-x-2">
                    {steps.map((_, idx) => (
                        <div
                            key={idx}
                            className={`w-3 h-3 rounded-full ${idx === currentAnalysisStep ? 'bg-white' : 'bg-purple-400'
                                }`}
                        />
                    ))}
                    <div
                        className={`w-3 h-3 rounded-full ${currentAnalysisStep === steps.length ? 'bg-white' : 'bg-purple-400'
                            }`}
                    />
                    <div
                        className={`w-3 h-3 rounded-full ${currentAnalysisStep === steps.length + 1 ? 'bg-white' : 'bg-purple-400'
                            }`}
                    />
                </div>
            </div>

            <div className="p-8">
                {isAnalysisStep && currentStepKey && currentStepLabel ? (
                    <div className="animate-fadeIn">
                        <div className="flex items-center mb-6">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4 shadow-md ${currentStepLabel.color.replace('bg-', 'bg-').replace('100', '500')}`}>
                                {currentAnalysisStep + 1}
                            </div>
                            <div>
                                <h4 className="text-2xl font-bold text-gray-800">{currentStepLabel.title}</h4>
                                <p className="text-gray-500">{currentStepLabel.subtitle}</p>
                            </div>
                        </div>

                        <div className="bg-purple-50 rounded-xl p-6 border border-purple-100 shadow-inner min-h-[200px]">
                            <div
                                className="prose prose-purple max-w-none"
                                dangerouslySetInnerHTML={{
                                    __html: formatMarkdownText(parsedAnalysis.individualSteps[currentStepKey] || '분석 내용이 없습니다.')
                                }}
                            />
                        </div>

                        {showTeacherFeedback && (
                            <div className="mt-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                <h5 className="font-semibold text-yellow-800 mb-2 flex items-center">
                                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    교사 피드백 및 평가
                                </h5>
                                <textarea
                                    value={stepFeedbacks[currentStepKey] || ''}
                                    onChange={(e) => onFeedbackChange(currentStepKey, e.target.value)}
                                    placeholder="이 단계에 대한 피드백을 입력하세요..."
                                    className="w-full p-3 border border-yellow-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white mb-3"
                                    rows={3}
                                />
                                <div className="flex items-center">
                                    <span className="text-sm font-medium text-gray-700 mr-3">점수:</span>
                                    <div className="flex space-x-2">
                                        {[1, 2, 3, 4, 5].map((score) => (
                                            <button
                                                key={score}
                                                onClick={() => onScoreChange(currentStepKey, score)}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${(stepScores[currentStepKey] || 0) === score
                                                        ? 'bg-yellow-500 text-white shadow-md transform scale-110'
                                                        : 'bg-white border border-gray-300 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {score}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : currentAnalysisStep === steps.length ? (
                    <div className="animate-fadeIn">
                        <div className="flex items-center mb-6">
                            <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xl mr-4 shadow-md">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-2xl font-bold text-gray-800">종합 평가</h4>
                                <p className="text-gray-500">전체적인 사고 과정에 대한 분석입니다.</p>
                            </div>
                        </div>

                        <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100 shadow-inner min-h-[200px]">
                            <div
                                className="prose prose-indigo max-w-none"
                                dangerouslySetInnerHTML={{
                                    __html: formatMarkdownText(parsedAnalysis.comprehensive || '종합 평가 내용이 없습니다.')
                                }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="animate-fadeIn">
                        <div className="flex items-center mb-6">
                            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-xl mr-4 shadow-md">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-2xl font-bold text-gray-800">교육적 제안</h4>
                                <p className="text-gray-500">학생의 사고 확장을 위한 제안입니다.</p>
                            </div>
                        </div>

                        <div className="bg-green-50 rounded-xl p-6 border border-green-100 shadow-inner min-h-[200px]">
                            <div
                                className="prose prose-green max-w-none"
                                dangerouslySetInnerHTML={{
                                    __html: formatMarkdownText(parsedAnalysis.educational || '교육적 제안 내용이 없습니다.')
                                }}
                            />
                        </div>

                        <div className="mt-8 flex justify-center">
                            <button
                                onClick={onSave}
                                disabled={saving}
                                className={`px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl transform transition hover:-translate-y-1 flex items-center ${saving ? 'opacity-75 cursor-not-allowed' : ''
                                    }`}
                            >
                                {saving ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        저장 중...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                        </svg>
                                        포트폴리오에 저장하기
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                    <button
                        onClick={onPrevStep}
                        disabled={currentAnalysisStep === 0}
                        className={`px-6 py-2 rounded-lg font-medium flex items-center ${currentAnalysisStep === 0
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-purple-600'
                            }`}
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        이전 단계
                    </button>

                    {currentAnalysisStep < steps.length + 1 && (
                        <button
                            onClick={onNextStep}
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 flex items-center shadow-md"
                        >
                            다음 단계
                            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
