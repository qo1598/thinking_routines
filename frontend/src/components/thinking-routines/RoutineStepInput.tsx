import React from 'react';
import { RoutineTemplate, ThinkingRoutineResponse } from '../../types';

interface Props {
    template: RoutineTemplate;
    currentStep: string;
    responses: ThinkingRoutineResponse;
    onInputChange: (value: string) => void;
    placeholder: string;
}

export const RoutineStepInput: React.FC<Props> = ({
    template,
    currentStep,
    responses,
    onInputChange,
    placeholder
}) => {
    // Frayer Model 특화 UI
    if (template.routine_type === 'frayer-model') {
        if (currentStep === 'see') {
            return (
                <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                    <div className="text-center mb-4">
                        <h3 className="text-lg font-bold text-blue-800">Definition (정의)</h3>
                    </div>
                    <textarea
                        value={responses[currentStep] || ''}
                        onChange={(e) => onInputChange(e.target.value)}
                        placeholder="이 개념을 한 문장으로 정의해보세요..."
                        rows={4}
                        className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white"
                    />
                </div>
            );
        }
        if (currentStep === 'think') {
            return (
                <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
                    <div className="text-center mb-4">
                        <h3 className="text-lg font-bold text-green-800">Characteristics (특징)</h3>
                    </div>
                    <textarea
                        value={responses[currentStep] || ''}
                        onChange={(e) => onInputChange(e.target.value)}
                        placeholder="• 특징 1: &#13;&#10;• 특징 2: &#13;&#10;• 특징 3: "
                        rows={6}
                        className="w-full px-4 py-3 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none bg-white"
                    />
                </div>
            );
        }
        if (currentStep === 'wonder') {
            const [examples, nonExamples] = (responses[currentStep] || '||').split('||');
            return (
                <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
                    <div className="text-center mb-4">
                        <h3 className="text-lg font-bold text-purple-800">Examples & Non-Examples</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-semibold text-purple-700 mb-2">✓ 예시 (Examples)</h4>
                            <textarea
                                value={examples || ''}
                                onChange={(e) => onInputChange(`${e.target.value}||${nonExamples}`)}
                                placeholder="예시를 적어주세요..."
                                rows={5}
                                className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-white"
                            />
                        </div>
                        <div>
                            <h4 className="font-semibold text-purple-700 mb-2">✗ 반례 (Non-Examples)</h4>
                            <textarea
                                value={nonExamples || ''}
                                onChange={(e) => onInputChange(`${examples}||${e.target.value}`)}
                                placeholder="반례를 적어주세요..."
                                rows={5}
                                className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-white"
                            />
                        </div>
                    </div>
                </div>
            );
        }
    }

    // 기본 UI
    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <textarea
                value={responses[currentStep] || ''}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder={placeholder}
                className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-lg leading-relaxed"
            />
        </div>
    );
};
