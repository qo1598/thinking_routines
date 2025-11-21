/**
 * AI 분석 결과 파싱 커스텀 훅
 */

import { useState, useEffect } from 'react';
import { parseMarkdownToStructuredAI } from '../lib/aiAnalysisUtils';

export const useAIAnalysisParsing = (aiAnalysis: string | undefined, routineType: string) => {
    const [parsedAnalysis, setParsedAnalysis] = useState<any>(null);

    useEffect(() => {
        if (!aiAnalysis) {
            setParsedAnalysis(null);
            return;
        }

        console.log('🎯 AI 분석 데이터 파싱 시작:', aiAnalysis);
        const parsed = parseAIAnalysisData(aiAnalysis, routineType);
        console.log('✅ 파싱 완료, state 업데이트:', parsed);
        setParsedAnalysis(parsed);
    }, [aiAnalysis, routineType]);

    const parseAIAnalysisData = (aiAnalysis: string, routineType: string) => {
        console.log('🔍 원본 AI 분석 데이터 (타입:', typeof aiAnalysis, '):', aiAnalysis);

        if (!aiAnalysis) {
            console.log('❌ AI 분석 데이터가 없습니다');
            return null;
        }

        try {
            // JSON 형태인지 확인
            if (aiAnalysis.startsWith('{') || aiAnalysis.startsWith('[')) {
                const parsed = JSON.parse(aiAnalysis);
                console.log('🔍 JSON 파싱된 AI 분석 데이터:', parsed);

                // ThinkingRoutineAnalysis에서 저장한 구조화된 형태 처리
                if (parsed.aiAnalysis && parsed.aiAnalysis.individualSteps) {
                    console.log('✅ 구조화된 AI 분석 데이터 발견');
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
                    console.log('✅ 기존 형태 AI 분석 데이터 발견');
                    return parsed;
                }

                console.log('⚠️ 알 수 없는 JSON AI 분석 데이터 구조:', parsed);
                return parsed;
            } else {
                // 마크다운 텍스트 형태
                console.log('📝 마크다운 텍스트 형태 AI 분석, 파싱 시도...');
                console.log('📝 전체 AI 응답 텍스트:', aiAnalysis);
                console.log('📝 텍스트 길이:', aiAnalysis.length);
                console.log('🎯 사고루틴 유형:', routineType);

                // 실제 AI 응답에서 특정 키워드들이 있는지 확인
                const keywords = ['Connect', 'Challenge', 'Concepts', 'Changes', '연결하기', '도전하기', '개념', '변화'];
                keywords.forEach(keyword => {
                    const found = aiAnalysis.includes(keyword);
                    if (found) {
                        const lines = aiAnalysis.split('\n').filter(line => line.includes(keyword));
                        console.log(`🔍 키워드 "${keyword}" 발견된 줄들:`, lines);
                    }
                });

                // aiAnalysisUtils의 parseMarkdownToStructuredAI 사용
                const structuredData = parseMarkdownToStructuredAI(aiAnalysis, routineType);
                console.log('🔄 파싱된 구조화 데이터:', structuredData);
                console.log('🔄 individualSteps:', structuredData?.individualSteps);
                console.log('🔄 comprehensive:', structuredData?.comprehensive);
                return structuredData;
            }
        } catch (error) {
            console.error('❌ AI 분석 데이터 파싱 오류:', error);
            console.log('❌ 오류 발생한 원본 데이터:', aiAnalysis);
            return null;
        }
    };

    return parsedAnalysis;
};
