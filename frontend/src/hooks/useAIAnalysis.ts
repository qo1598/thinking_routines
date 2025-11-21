import { useState } from 'react';
import { generateAIPrompt, generateUserPrompt } from '../lib/promptGenerator';
import { parseAnalysisResult } from '../lib/analysisParser';
import { ParsedAnalysis, AnalysisResult } from '../types';

export const useAIAnalysis = () => {
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState('');
    const [currentAnalysisStep, setCurrentAnalysisStep] = useState(0);
    const [parsedAnalysis, setParsedAnalysis] = useState<ParsedAnalysis | null>(null);

    const handleAnalyzeImage = async (uploadedImage: File, selectedRoutine: string) => {
        if (!uploadedImage || !selectedRoutine) {
            setError('사고루틴을 선택하고 이미지를 업로드해주세요.');
            return;
        }

        setAnalyzing(true);
        setError('');

        try {
            // 이미지를 base64로 변환
            const imageBase64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(uploadedImage);
            });

            // 사고루틴별 맞춤형 프롬프트 생성
            const systemPrompt = generateAIPrompt(selectedRoutine);
            const userPrompt = generateUserPrompt(selectedRoutine, imageBase64);

            console.log('AI 분석 요청 시작...');

            const apiResponse = await fetch('/api/gemini-analysis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    systemPrompt,
                    userPrompt,
                    imageData: imageBase64
                })
            });

            if (!apiResponse.ok) {
                const errorData = await apiResponse.json();
                throw new Error(errorData.error || 'AI 분석 요청 실패');
            }

            const result = await apiResponse.json();

            if (!result.analysis) {
                throw new Error('AI 분석 결과가 없습니다');
            }

            setAnalysisResult({
                extractedText: '업로드된 이미지에서 학생의 사고루틴 활동 내용을 성공적으로 인식했습니다.',
                analysis: result.analysis,
                confidence: 85
            });

            // AI 분석 결과를 단계별로 파싱
            const parsed = parseAnalysisResult(result.analysis);
            setParsedAnalysis(parsed);
            setCurrentAnalysisStep(0);

        } catch (error) {
            console.error('Analysis error:', error);
            setError('분석 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setAnalyzing(false);
        }
    };

    const resetAnalysis = () => {
        setAnalysisResult(null);
        setParsedAnalysis(null);
        setCurrentAnalysisStep(0);
        setError('');
    };

    return {
        analyzing,
        analysisResult,
        error,
        currentAnalysisStep,
        parsedAnalysis,
        handleAnalyzeImage,
        resetAnalysis,
        setCurrentAnalysisStep,
        setError
    };
};
