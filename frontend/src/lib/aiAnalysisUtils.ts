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
  
  // 종합 분석 추출 - 더 유연한 패턴들
  let comprehensive = '';
  let educational = '';
  let stepByStep = '';
  
  // 논리적 연결성 패턴
  const logicalMatch = markdownText.match(/(?:\*\*)?논리적\s*연결성(?:\*\*)?(?:\s*[:：]?\s*)([\s\S]*?)(?=(?:\*\*)?사고의\s*깊이|(?:\*\*)?개선점|(?:\*\*)?제안|$)/);
  
  // 사고의 깊이 패턴  
  const depthMatch = markdownText.match(/(?:\*\*)?사고의\s*깊이(?:\*\*)?(?:\s*[:：]?\s*)([\s\S]*?)(?=(?:\*\*)?개선점|(?:\*\*)?건설적|(?:\*\*)?제안|$)/);
  
  // 개선점과 건설적 피드백 패턴
  const improvementMatch = markdownText.match(/(?:\*\*)?개선점과?\s*(?:건설적\s*)?피드백(?:\*\*)?(?:\s*[:：]?\s*)([\s\S]*?)(?=(?:\*\*)?추가\s*활동|(?:\*\*)?제안|$)/);
  
  // 추가 활동 제안 패턴
  const suggestionsMatch = markdownText.match(/(?:\*\*)?추가\s*활동\s*제안(?:\*\*)?(?:\s*[:：]?\s*)([\s\S]*?)$/);
  
  // 전체 종합 분석 섹션 추출 시도
  const comprehensiveSection = markdownText.match(/\*\*2\.\s*.*?종합\s*분석\*\*\s*\n\n([\s\S]*?)(?=\*\*3\.|$)/);
  
  if (comprehensiveSection) {
    comprehensive = cleanExtractedText(comprehensiveSection[1]);
  } else {
    // 개별 항목들을 조합
    const parts = [];
    if (logicalMatch) parts.push(`**논리적 연결성**\n${cleanExtractedText(logicalMatch[1])}`);
    if (depthMatch) parts.push(`**사고의 깊이**\n${cleanExtractedText(depthMatch[1])}`);
    if (improvementMatch) parts.push(`**개선점과 건설적 피드백**\n${cleanExtractedText(improvementMatch[1])}`);
    if (suggestionsMatch) parts.push(`**추가 활동 제안**\n${cleanExtractedText(suggestionsMatch[1])}`);
    
    comprehensive = parts.join('\n\n');
  }
  
  // 교육적 제안 추출
  const educationalMatch = markdownText.match(/\*\*3\.\s*개선점과\s*건설적\s*피드백\s*제안\*\*\s*\n\n([\s\S]*?)(?=\*\*4\.|$)/);
  educational = educationalMatch ? cleanExtractedText(educationalMatch[1]) : '';
  
  // 단계별 분석 추출
  const stepByStepMatch = markdownText.match(/\*\*1\.\s*각\s*단계별\s*응답의\s*품질과\s*적절성\s*평가\*\*\s*\n\n([\s\S]*?)(?=\*\*2\.|$)/);
  stepByStep = stepByStepMatch ? cleanExtractedText(stepByStepMatch[1]) : '';
  
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
  
  // 사고루틴 유형별 전용 패턴 정의
  if (routineType === 'see-think-wonder') {
    if (stepKey === 'see') {
      patterns.push(
        // 실제 텍스트: *   **See (본 것):** "내용"
        /\*\s+\*\*See\s+\(본\s+것\)\*\*:\s*"([^"]+)"/s,
        /\*\s*\*\*See\s*\(본\s*것\)\*\*:?\s*"([^"]+)"/s,
        /###\s*See\s*\(보기\)\s*\n([\s\S]*?)(?=###|##|$)/s,
        // 추가 패턴들
        /\*\*See\s*\(보기\)\*\*:?\s*([\s\S]*?)(?=\*\*Think|\*\*Wonder|###|$)/s,
        /-\s*\*\*See\s*\(보기\)\*\*:?\s*([\s\S]*?)(?=-\s*\*\*Think|-\s*\*\*Wonder|$)/s
      );
    } else if (stepKey === 'think') {
      patterns.push(
        // 실제 텍스트: *   **Think (생각한 것):** "내용"
        /\*\s+\*\*Think\s+\(생각한\s+것\)\*\*:\s*"([^"]+)"/s,
        /\*\s*\*\*Think\s*\(생각한\s*것\)\*\*:?\s*"([^"]+)"/s,
        /###\s*Think\s*\(생각하기\)\s*\n([\s\S]*?)(?=###|##|$)/s
      );
    } else if (stepKey === 'wonder') {
      patterns.push(
        // 실제 텍스트: *   **Wonder (궁금한 점):** "내용"
        /\*\s+\*\*Wonder\s+\(궁금한\s+점\)\*\*:\s*"([^"]+)"/s,
        /\*\s*\*\*Wonder\s*\(궁금한\s*점\)\*\*:?\s*"([^"]+)"/s,
        /###\s*Wonder\s*\(궁금하기\)\s*\n([\s\S]*?)(?=###|##|$)/s
      );
    }
  } else if (routineType === '4c') {
    if (stepKey === 'connect') {
      patterns.push(
        // 기본 패턴들
        /###\s*Connect\s*\(연결하기\)\s*\n([\s\S]*?)(?=###|##|$)/s,
        /\*\*Connect\s*\(연결하기\)\*\*:?\s*([\s\S]*?)(?=\*\*[A-Z]|$)/s,
        // 실제 응답에서 나타나는 패턴들
        /\*\s*\*\*Connect\s*\([^)]*\)\*\*:?\s*"([^"]+)"/si,
        /Connect\s*\([^)]*\):?\s*([^\n]*)/si,
        /연결하기[:\s]*([^\n]*)/si,
        // 더 유연한 패턴
        /Connect[^:]*:?\s*(.{20,}?)(?=Challenge|Concept|Change|##|###|$)/si
      );
    } else if (stepKey === 'challenge') {
      patterns.push(
        /###\s*Challenge\s*\(도전하기\)\s*\n([\s\S]*?)(?=###|##|$)/s,
        /\*\*Challenge\s*\(도전하기\)\*\*:?\s*([\s\S]*?)(?=\*\*[A-Z]|$)/s,
        /\*\s*\*\*Challenge\s*\([^)]*\)\*\*:?\s*"([^"]+)"/si,
        /Challenge\s*\([^)]*\):?\s*([^\n]*)/si,
        /도전하기[:\s]*([^\n]*)/si,
        /Challenge[^:]*:?\s*(.{20,}?)(?=Concept|Change|##|###|$)/si
      );
    } else if (stepKey === 'concepts') {
      patterns.push(
        /###\s*Concepts\s*\(개념\)\s*\n([\s\S]*?)(?=###|##|$)/s,
        /\*\*Concepts\s*\(개념\)\*\*:?\s*([\s\S]*?)(?=\*\*[A-Z]|$)/s,
        /\*\s*\*\*Concepts\s*\([^)]*\)\*\*:?\s*"([^"]+)"/si,
        /Concepts\s*\([^)]*\):?\s*([^\n]*)/si,
        /개념[:\s]*([^\n]*)/si,
        /Concept[^:]*:?\s*(.{20,}?)(?=Change|##|###|$)/si
      );
    } else if (stepKey === 'changes') {
      patterns.push(
        /###\s*Changes\s*\(변화\)\s*\n([\s\S]*?)(?=###|##|$)/s,
        /\*\*Changes\s*\(변화\)\*\*:?\s*([\s\S]*?)(?=\*\*[A-Z]|$)/s,
        /\*\s*\*\*Changes\s*\([^)]*\)\*\*:?\s*"([^"]+)"/si,
        /Changes\s*\([^)]*\):?\s*([^\n]*)/si,
        /변화[:\s]*([^\n]*)/si,
        /Change[^:]*:?\s*(.{20,}?)(?=##|###|종합|$)/si
      );
    }
  } else if (routineType === 'connect-extend-challenge') {
    if (stepKey === 'connect') {
      patterns.push(
        /###\s*Connect\s*\(연결하기\)\s*\n([\s\S]*?)(?=###|##|$)/s,
        /\*\*Connect\s*\(연결하기\)\*\*:?\s*([\s\S]*?)(?=\*\*[A-Z]|$)/s
      );
    } else if (stepKey === 'extend') {
      patterns.push(
        /###\s*Extend\s*\(확장하기\)\s*\n([\s\S]*?)(?=###|##|$)/s,
        /\*\*Extend\s*\(확장하기\)\*\*:?\s*([\s\S]*?)(?=\*\*[A-Z]|$)/s
      );
    } else if (stepKey === 'challenge') {
      patterns.push(
        /###\s*Challenge\s*\(도전하기\)\s*\n([\s\S]*?)(?=###|##|$)/s,
        /\*\*Challenge\s*\(도전하기\)\*\*:?\s*([\s\S]*?)(?=\*\*[A-Z]|$)/s
      );
    }
  } else if (routineType === 'circle-of-viewpoints') {
    if (stepKey === 'viewpoint_select') {
      patterns.push(
        /###\s*관점\s*정하기\s*\n([\s\S]*?)(?=###|##|$)/s,
        /\*\*관점\s*정하기\*\*:?\s*([\s\S]*?)(?=\*\*[^*]*\*\*|$)/s
      );
    } else if (stepKey === 'viewpoint_thinking') {
      patterns.push(
        /###\s*관점에\s*따라\s*생각\s*쓰기\s*\n([\s\S]*?)(?=###|##|$)/s,
        /\*\*관점에\s*따라\s*생각\s*쓰기\*\*:?\s*([\s\S]*?)(?=\*\*[^*]*\*\*|$)/s
      );
    } else if (stepKey === 'viewpoint_concerns') {
      patterns.push(
        /###\s*관점에\s*대한\s*염려되거나\s*더\s*알고\s*싶은\s*것\s*쓰기\s*\n([\s\S]*?)(?=###|##|$)/s,
        /\*\*관점에\s*대한\s*염려되거나\s*더\s*알고\s*싶은\s*것\s*쓰기\*\*:?\s*([\s\S]*?)(?=\*\*[^*]*\*\*|$)/s
      );
    }
  } else if (routineType === 'frayer-model') {
    if (stepKey === 'definition') {
      patterns.push(
        /###\s*Definition\s*\(정의\)\s*\n([\s\S]*?)(?=###|##|$)/s,
        /\*\*Definition\s*\(정의\)\*\*:?\s*([\s\S]*?)(?=\*\*[A-Z]|$)/s
      );
    } else if (stepKey === 'characteristics') {
      patterns.push(
        /###\s*Characteristics\s*\(특징\)\s*\n([\s\S]*?)(?=###|##|$)/s,
        /\*\*Characteristics\s*\(특징\)\*\*:?\s*([\s\S]*?)(?=\*\*[A-Z]|$)/s
      );
    } else if (stepKey === 'examples') {
      patterns.push(
        /###\s*Examples\s*\(예시\)\s*\n([\s\S]*?)(?=###|##|$)/s,
        /\*\*Examples\s*\(예시\)\*\*:?\s*([\s\S]*?)(?=\*\*[A-Z]|$)/s
      );
    } else if (stepKey === 'non_examples') {
      patterns.push(
        /###\s*Non-Examples\s*\(반례\)\s*\n([\s\S]*?)(?=###|##|$)/s,
        /\*\*Non-Examples\s*\(반례\)\*\*:?\s*([\s\S]*?)(?=\*\*[A-Z]|$)/s
      );
    }
  } else if (routineType === 'used-to-think-now-think') {
    if (stepKey === 'used_to_think') {
      patterns.push(
        /###\s*Used\s*to\s*Think\s*\(이전\s*생각\)\s*\n([\s\S]*?)(?=###|##|$)/s,
        /\*\*Used\s*to\s*Think\s*\(이전\s*생각\)\*\*:?\s*([\s\S]*?)(?=\*\*[A-Z]|$)/s
      );
    } else if (stepKey === 'now_think') {
      patterns.push(
        /###\s*Now\s*Think\s*\(현재\s*생각\)\s*\n([\s\S]*?)(?=###|##|$)/s,
        /\*\*Now\s*Think\s*\(현재\s*생각\)\*\*:?\s*([\s\S]*?)(?=\*\*[A-Z]|$)/s
      );
    }
  } else if (routineType === 'think-puzzle-explore') {
    if (stepKey === 'think') {
      patterns.push(
        /###\s*Think\s*\(생각하기\)\s*\n([\s\S]*?)(?=###|##|$)/s,
        /\*\*Think\s*\(생각하기\)\*\*:?\s*([\s\S]*?)(?=\*\*[A-Z]|$)/s
      );
    } else if (stepKey === 'puzzle') {
      patterns.push(
        /###\s*Puzzle\s*\(퍼즐\)\s*\n([\s\S]*?)(?=###|##|$)/s,
        /\*\*Puzzle\s*\(퍼즐\)\*\*:?\s*([\s\S]*?)(?=\*\*[A-Z]|$)/s
      );
    } else if (stepKey === 'explore') {
      patterns.push(
        /###\s*Explore\s*\(탐구하기\)\s*\n([\s\S]*?)(?=###|##|$)/s,
        /\*\*Explore\s*\(탐구하기\)\*\*:?\s*([\s\S]*?)(?=\*\*[A-Z]|$)/s
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
    new RegExp(`\\*\\*${stepKey}\\s*\\([^)]*\\)\\*\\*:?\\s*"([^"]+)"`, 'si'),
    // 패턴 6: ### 헤더 형태
    new RegExp(`###\\s*${escapedLabel}\\s*\\n([\\s\\S]*?)(?=###|##|$)`, 's'),
    new RegExp(`###\\s*${stepLabel.split('(')[0].trim()}\\s*\\n([\\s\\S]*?)(?=###|##|$)`, 's'),
    // 패턴 7: - 리스트 형태
    new RegExp(`-\\s*\\*\\*${escapedLabel}\\*\\*:?\\s*([\\s\\S]*?)(?=-\\s*\\*\\*|$)`, 's'),
    // 패턴 8: 더 유연한 매칭 (대소문자 무시)
    new RegExp(`(?:^|\\n)\\s*(?:\\*\\*)?\\s*${stepLabel.split('(')[0].trim()}\\s*(?:\\([^)]*\\))?\\s*(?:\\*\\*)?\\s*(?:[:：]?)\\s*([\\s\\S]*?)(?=\\n\\s*(?:\\*\\*)?\\s*[A-Za-z가-힣]|$)`, 'is')
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
