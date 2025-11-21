import { ParsedAnalysis } from '../types';

/**
 * AI 분석 결과 파싱 유틸리티
 * AI가 반환한 마크다운 형식의 분석 결과를 파싱하고 포맷팅합니다.
 */

/**
 * AI 분석 결과를 단계별로 파싱
 */
export const parseAnalysisResult = (analysis: string): ParsedAnalysis => {
    try {
        // 정규식을 사용하여 각 섹션을 추출
        const stepByStepMatch = analysis.match(/## 1\. 각 단계별 분석([\s\S]*?)(?=## 2\.|$)/);
        const comprehensiveMatch = analysis.match(/## 2\. 종합 평가([\s\S]*?)(?=## 3\.|$)/);
        const educationalMatch = analysis.match(/## 3\. 교육적 제안([\s\S]*?)$/);

        // 개별 단계별 분석 추출
        const individualSteps: { [key: string]: string } = {};

        if (stepByStepMatch) {
            const stepByStepContent = stepByStepMatch[1].trim();

            // See-Think-Wonder 방식
            const seeMatch = stepByStepContent.match(/### See \(보기\)([\s\S]*?)(?=### |$)/);
            const thinkMatch = stepByStepContent.match(/### Think \(생각하기\)([\s\S]*?)(?=### |$)/);
            const wonderMatch = stepByStepContent.match(/### Wonder \(궁금하기\)([\s\S]*?)(?=### |$)/);

            // 4C 방식
            const connectMatch = stepByStepContent.match(/### Connect \(연결\)([\s\S]*?)(?=### |$)/);
            const challengeMatch = stepByStepContent.match(/### Challenge \(도전\)([\s\S]*?)(?=### |$)/);
            const conceptsMatch = stepByStepContent.match(/### Concepts \(개념\)([\s\S]*?)(?=### |$)/);
            const changesMatch = stepByStepContent.match(/### Changes \(변화\)([\s\S]*?)(?=### |$)/);

            // Circle of Viewpoints 방식
            const viewpointsMatch = stepByStepContent.match(/### Viewpoints \(관점 탐색\)([\s\S]*?)(?=### |$)/);
            const perspectiveMatch = stepByStepContent.match(/### Perspective \(관점 선택\)([\s\S]*?)(?=### |$)/);
            const questionsMatch = stepByStepContent.match(/### Questions \(관점별 질문\)([\s\S]*?)(?=### |$)/);

            // Connect-Extend-Challenge 방식
            const extendMatch = stepByStepContent.match(/### Extend \(확장\)([\s\S]*?)(?=### |$)/);

            // Frayer Model 방식
            const definitionMatch = stepByStepContent.match(/### Definition \(정의\)([\s\S]*?)(?=### |$)/);
            const characteristicsMatch = stepByStepContent.match(/### Characteristics \(특징\)([\s\S]*?)(?=### |$)/);
            const examplesMatch = stepByStepContent.match(/### Examples & Non-Examples \(예시와 반례\)([\s\S]*?)(?=### |$)/);

            // I Used to Think... Now I Think... 방식
            const usedToThinkMatch = stepByStepContent.match(/### Used to Think \(이전 생각\)([\s\S]*?)(?=### |$)/);
            const nowThinkMatch = stepByStepContent.match(/### Now Think \(현재 생각\)([\s\S]*?)(?=### |$)/);
            const whyChangedMatch = stepByStepContent.match(/### Why Changed \(변화 이유\)([\s\S]*?)(?=### |$)/);

            // Think-Puzzle-Explore 방식
            const puzzleMatch = stepByStepContent.match(/### Puzzle \(퍼즐\)([\s\S]*?)(?=### |$)/);
            const exploreMatch = stepByStepContent.match(/### Explore \(탐구하기\)([\s\S]*?)(?=### |$)/);

            // 각 매칭 결과를 individualSteps에 추가
            if (seeMatch) individualSteps['see'] = seeMatch[1].trim();
            if (thinkMatch) individualSteps['think'] = thinkMatch[1].trim();
            if (wonderMatch) individualSteps['wonder'] = wonderMatch[1].trim();
            if (connectMatch) individualSteps['connect'] = connectMatch[1].trim();
            if (challengeMatch) individualSteps['challenge'] = challengeMatch[1].trim();
            if (conceptsMatch) individualSteps['concepts'] = conceptsMatch[1].trim();
            if (changesMatch) individualSteps['changes'] = changesMatch[1].trim();
            if (viewpointsMatch) individualSteps['viewpoints'] = viewpointsMatch[1].trim();
            if (perspectiveMatch) individualSteps['perspective'] = perspectiveMatch[1].trim();
            if (questionsMatch) individualSteps['questions'] = questionsMatch[1].trim();
            if (extendMatch) individualSteps['extend'] = extendMatch[1].trim();
            if (definitionMatch) individualSteps['definition'] = definitionMatch[1].trim();
            if (characteristicsMatch) individualSteps['characteristics'] = characteristicsMatch[1].trim();
            if (examplesMatch) individualSteps['examples'] = examplesMatch[1].trim();
            if (usedToThinkMatch) individualSteps['used_to_think'] = usedToThinkMatch[1].trim();
            if (nowThinkMatch) individualSteps['now_think'] = nowThinkMatch[1].trim();
            if (whyChangedMatch) individualSteps['why_changed'] = whyChangedMatch[1].trim();
            if (puzzleMatch) individualSteps['puzzle'] = puzzleMatch[1].trim();
            if (exploreMatch) individualSteps['explore'] = exploreMatch[1].trim();
        }

        return {
            stepByStep: stepByStepMatch ? stepByStepMatch[1].trim() : '',
            comprehensive: comprehensiveMatch ? comprehensiveMatch[1].trim() : '',
            educational: educationalMatch ? educationalMatch[1].trim() : '',
            individualSteps
        };
    } catch (error) {
        console.error('Analysis parsing error:', error);
        // 파싱 실패 시 전체 텍스트를 첫 번째 단계로 표시
        return {
            stepByStep: analysis,
            comprehensive: '',
            educational: '',
            individualSteps: {}
        };
    }
};

/**
 * 마크다운 텍스트 포맷팅 (HTML로 변환)
 */
export const formatMarkdownText = (text: string): string => {
    return text
        // 불필요한 기호들 제거
        .replace(/^\*\s*/gm, '') // 줄 시작의 * 제거
        .replace(/^---\s*/gm, '') // --- 제거
        .replace(/^\s*\*\s*$/gm, '') // * 만 있는 줄 제거
        // 제목 포맷팅
        .replace(/## (\d+)\. (.*?)(?=\n|$)/g, '<h3 class="text-xl font-bold text-purple-800 mb-4 pb-2 border-b-2 border-purple-200">$1. $2</h3>')
        .replace(/### (.*?)(?=\n|$)/g, '<h4 class="text-lg font-semibold text-gray-900 mt-6 mb-3 text-purple-700">$1</h4>')
        // 연보라색 태그에서 콜론 제거
        .replace(/\*\*(.*?):\*\*/g, '<div class="mt-4 mb-2"><span class="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">$1</span></div>')
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
        .replace(/^- (.*?)$/gm, '<div class="flex items-start mb-2"><span class="text-purple-500 mr-2 mt-1">•</span><span class="text-gray-700">$1</span></div>')
        // 빈 줄 정리
        .replace(/\n\s*\n\s*\n/g, '\n\n') // 3개 이상의 연속 줄바꿈을 2개로
        .replace(/\n\n/g, '</p><p class="mb-4">')
        .replace(/\n/g, '<br/>')
        .replace(/^/, '<p class="mb-4">')
        .replace(/$/, '</p>');
};
