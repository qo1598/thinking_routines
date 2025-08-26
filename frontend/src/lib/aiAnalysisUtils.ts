import { routineStepLabels } from './thinkingRoutineUtils';

export interface AIAnalysisData {
  individualSteps: { [stepKey: string]: string };
  comprehensive?: string;
  educational?: string;
  stepByStep?: string;
  confidence?: number;
  analyzedAt?: string;
  routineType?: string;
}

export interface StructuredAIAnalysis {
  aiAnalysis: AIAnalysisData;
  teacherFeedback?: {
    individualSteps: { [stepKey: string]: { feedback: string; score: number | null } };
    feedbackAt?: string;
  };
  routineInfo?: {
    type: string;
    extractedText?: string;
  };
}

/**
 * 마크다운 형태의 AI 분석 텍스트를 구조화된 JSON으로 변환
 */
export const parseMarkdownToStructuredAI = (
  markdownText: string, 
  routineType: string
): AIAnalysisData => {
  const individualSteps: { [stepKey: string]: string } = {};
  const stepLabels = routineStepLabels[routineType] || routineStepLabels['see-think-wonder'];
  
  console.log('🔄 Converting markdown to structured AI data:', { routineType, stepLabels });
  
  // 각 단계별로 텍스트에서 분석 내용 추출
  Object.entries(stepLabels).forEach(([stepKey, stepLabel]) => {
    // 다양한 패턴으로 매칭 시도
    const patterns = getStepPatterns(stepKey, stepLabel, routineType);
    
    console.log(`🔍 Trying to extract ${stepKey} (${stepLabel}) with ${patterns.length} patterns`);
    
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      console.log(`📝 Pattern ${i + 1}:`, pattern.toString());
      
      const match = markdownText.match(pattern);
      if (match && match[1]) {
        individualSteps[stepKey] = cleanExtractedText(match[1]);
        console.log(`✅ MATCH! Extracted ${stepKey} with pattern ${i + 1}:`, individualSteps[stepKey].substring(0, 100) + '...');
        break;
      } else {
        console.log(`❌ Pattern ${i + 1} failed for ${stepKey}`);
      }
    }
    
    if (!individualSteps[stepKey]) {
      console.log(`❌ Could not extract ${stepKey} (${stepLabel}) with any pattern`);
      
      // 실제 텍스트에서 해당 키워드가 있는지 확인
      const keywordCheck = markdownText.includes(`**${stepKey.charAt(0).toUpperCase() + stepKey.slice(1)}`);
      const koreanCheck = markdownText.includes(stepLabel.split(' ')[0]);
      console.log(`🔍 Keyword check for ${stepKey}:`, { keywordCheck, koreanCheck });
      
      // 실제 텍스트 샘플 표시
      const sampleMatch = markdownText.match(new RegExp(`\\*.*${stepKey.charAt(0).toUpperCase() + stepKey.slice(1)}.*`, 'i'));
      if (sampleMatch) {
        console.log(`📋 Found sample text for ${stepKey}:`, sampleMatch[0]);
      }
    }
  });
  
  // 종합 분석 추출
  const comprehensiveMatch = markdownText.match(/\*\*2\.\s*논리적\s*연결성과\s*사고의\s*깊이\s*분석\*\*\s*\n\n([\s\S]*?)(?=\*\*3\.|$)/);
  const comprehensive = comprehensiveMatch ? cleanExtractedText(comprehensiveMatch[1]) : '';
  
  const educationalMatch = markdownText.match(/\*\*3\.\s*개선점과\s*건설적\s*피드백\s*제안\*\*\s*\n\n([\s\S]*?)(?=\*\*4\.|$)/);
  const educational = educationalMatch ? cleanExtractedText(educationalMatch[1]) : '';
  
  const stepByStepMatch = markdownText.match(/\*\*1\.\s*각\s*단계별\s*응답의\s*품질과\s*적절성\s*평가\*\*\s*\n\n([\s\S]*?)(?=\*\*2\.|$)/);
  const stepByStep = stepByStepMatch ? cleanExtractedText(stepByStepMatch[1]) : '';
  
  return {
    individualSteps,
    comprehensive,
    educational, 
    stepByStep,
    analyzedAt: new Date().toISOString(),
    routineType
  };
};

/**
 * 단계별 패턴 생성 (사고루틴별 맞춤 패턴)
 */
const getStepPatterns = (stepKey: string, stepLabel: string, routineType: string): RegExp[] => {
  const patterns: RegExp[] = [];
  
  // See-Think-Wonder 전용 실제 AI 텍스트 패턴 (정확한 공백 패턴 반영)
  if (routineType === 'see-think-wonder') {
    if (stepKey === 'see') {
      patterns.push(
        /\*\s+\*\*See\s+\(본\s+것\)\*\*:\s*"([^"]+)"/s,
        /\*\s*\*\*See\s*\(본\s*것\)\*\*:?\s*"([^"]+)"/s
      );
    } else if (stepKey === 'think') {
      patterns.push(
        /\*\s+\*\*Think\s+\(생각한\s+것\)\*\*:\s*"([^"]+)"/s,
        /\*\s*\*\*Think\s*\(생각한\s*것\)\*\*:?\s*"([^"]+)"/s
      );
    } else if (stepKey === 'wonder') {
      patterns.push(
        /\*\s+\*\*Wonder\s+\(궁금한\s+점\)\*\*:\s*"([^"]+)"/s,
        /\*\s*\*\*Wonder\s*\(궁금한\s*점\)\*\*:?\s*"([^"]+)"/s
      );
    }
  }
  
  // 일반적인 패턴들 (모든 루틴에 적용)
  const escapedLabel = escapeRegExp(stepLabel);
  patterns.push(
    // 패턴 1: *   **Label:** "content"
    new RegExp(`\\*\\s*\\*\\*${escapedLabel}\\*\\*:?\\s*"([^"]+)"`, 's'),
    // 패턴 2: **Label:** "content"  
    new RegExp(`\\*\\*${escapedLabel}\\*\\*:?\\s*"([^"]+)"`, 's'),
    // 패턴 3: *   **Label:** content (따옴표 없음)
    new RegExp(`\\*\\s*\\*\\*${escapedLabel}\\*\\*:?\\s*([^*]+?)(?=\\*\\*|$)`, 's'),
    // 패턴 4: **Label:** content (따옴표 없음)
    new RegExp(`\\*\\*${escapedLabel}\\*\\*:?\\s*([^*]+?)(?=\\*\\*|$)`, 's'),
    // 패턴 5: 영어 키워드 기반 (4C, Connect-Extend-Challenge 등)
    new RegExp(`\\*\\s*\\*\\*${stepKey}\\s*\\([^)]*\\)\\*\\*:?\\s*"([^"]+)"`, 'si'),
    new RegExp(`\\*\\*${stepKey}\\s*\\([^)]*\\)\\*\\*:?\\s*"([^"]+)"`, 'si')
  );
  
  return patterns;
};

/**
 * 추출된 텍스트 정리
 */
const cleanExtractedText = (text: string): string => {
  return text
    .trim()
    .replace(/^\*+\s*/, '') // 앞의 * 제거
    .replace(/\*+$/, '') // 뒤의 * 제거
    .replace(/\n\s*\*\s*\*\*[^:]*\*\*:.*$/gm, '') // 하위 항목들 제거
    .trim();
};

/**
 * 정규표현식 특수문자 이스케이프
 */
const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * 구조화된 AI 분석 데이터를 JSON으로 저장
 */
export const saveStructuredAIAnalysis = async (
  responseId: string,
  aiAnalysisData: AIAnalysisData,
  supabase: any
): Promise<boolean> => {
  try {
    const structuredData: StructuredAIAnalysis = {
      aiAnalysis: aiAnalysisData,
      routineInfo: {
        type: aiAnalysisData.routineType || 'see-think-wonder'
      }
    };
    
    const { error } = await supabase
      .from('student_responses')
      .update({ 
        ai_analysis: JSON.stringify(structuredData),
        updated_at: new Date().toISOString()
      })
      .eq('id', responseId);
    
    if (error) {
      console.error('❌ Failed to save structured AI analysis:', error);
      return false;
    }
    
    console.log('✅ Structured AI analysis saved successfully');
    return true;
  } catch (error) {
    console.error('❌ Error saving structured AI analysis:', error);
    return false;
  }
};

/**
 * 저장된 AI 분석 데이터를 구조화된 형태로 파싱
 */
export const parseStoredAIAnalysis = (aiAnalysisString: string, routineType: string): AIAnalysisData | null => {
  try {
    // JSON 형태인지 먼저 확인
    if (aiAnalysisString.trim().startsWith('{')) {
      const parsed = JSON.parse(aiAnalysisString);
      
      // 구조화된 형태 (ThinkingRoutineAnalysis에서 저장)
      if (parsed.aiAnalysis && parsed.aiAnalysis.individualSteps) {
        console.log('✅ Found structured AI analysis data');
        return parsed.aiAnalysis;
      }
      
      // 기존 형태 (직접 individualSteps)
      if (parsed.individualSteps) {
        console.log('✅ Found legacy structured AI analysis');
        return parsed;
      }
    }
    
    // 마크다운 텍스트 형태라면 구조화
    console.log('🔄 Converting markdown AI analysis to structured format');
    return parseMarkdownToStructuredAI(aiAnalysisString, routineType);
    
  } catch (error) {
    console.error('❌ Error parsing stored AI analysis:', error);
    return null;
  }
};
