// 사고루틴 유형별 한국어 라벨 매핑
export const routineTypeLabels: { [key: string]: string } = {
  'see-think-wonder': 'See-Think-Wonder',
  '4c': '4C (Connect-Challenge-Concepts-Changes)',
  'circle-of-viewpoints': 'Circle of Viewpoints',
  'connect-extend-challenge': 'Connect-Extend-Challenge',
  'frayer-model': 'Frayer Model',
  'used-to-think-now-think': 'I Used to Think... Now I Think...',
  'think-puzzle-explore': 'Think-Puzzle-Explore'
};

// 사고루틴별 단계 라벨 매핑
export const routineStepLabels: { [routineType: string]: { [stepKey: string]: string } } = {
  'see-think-wonder': {
    'see': 'See (보기)',
    'think': 'Think (생각하기)',
    'wonder': 'Wonder (궁금하기)'
  },
  '4c': {
    'see': 'Connect (연결하기)',
    'think': 'Challenge (도전하기)',
    'wonder': 'Concepts (개념)',
    'fourth_step': 'Changes (변화)'
  },
  'circle-of-viewpoints': {
    'see': '관점 1',
    'think': '관점 2',
    'wonder': '관점 3',
    'fourth_step': '종합적 관점'
  },
  'connect-extend-challenge': {
    'see': 'Connect (연결)',
    'think': 'Extend (확장)',
    'wonder': 'Challenge (도전)'
  },
  'frayer-model': {
    'see': 'Definition (정의)',
    'think': 'Characteristics (특징)',
    'wonder': 'Examples (예시)',
    'fourth_step': 'Non-Examples (반례)'
  },
  'used-to-think-now-think': {
    'see': 'I Used to Think (이전 생각)',
    'think': 'Now I Think (현재 생각)',
    'wonder': 'What Changed My Thinking (변화 요인)'
  },
  'think-puzzle-explore': {
    'see': 'Think (생각)',
    'think': 'Puzzle (의문)',
    'wonder': 'Explore (탐구)'
  }
};

// 사고루틴별 설명 텍스트
export const routineDescriptions: { [routineType: string]: { [stepKey: string]: string } } = {
  'see-think-wonder': {
    'see': '이미지나 자료를 객관적으로 관찰하고 구체적으로 기술해주세요.',
    'think': '관찰한 내용을 바탕으로 해석하고 생각을 기록해주세요.',
    'wonder': '궁금한 점이나 더 알고 싶은 것을 기록해주세요.'
  },
  '4c': {
    'see': '기존 지식이나 경험과 어떻게 연결되는지 설명해주세요.',
    'think': '비판적으로 검토하고 도전해볼 점을 기록해주세요.',
    'wonder': '핵심 개념이 무엇인지 파악해주세요.',
    'fourth_step': '어떤 변화나 개선이 필요한지 제안해주세요.'
  },
  'frayer-model': {
    'see': '개념의 정의를 명확하게 써주세요.',
    'think': '개념의 특징이나 속성을 나열해주세요.',
    'wonder': '개념에 해당하는 구체적인 예시를 들어주세요.',
    'fourth_step': '개념에 해당하지 않는 반례를 들어주세요.'
  }
};

// 사고루틴 유형별 정규표현식 패턴 (ES2018 호환)
export const routineStepPatterns: {[routineType: string]: {[stepKey: string]: RegExp[]}} = {
  'see-think-wonder': {
    'see': [
      new RegExp('(?:^|\\n)(?:\\*\\*)?(?:See|보기|관찰)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\*\\*)?(?:Think|생각|Wonder|궁금)|$)', 'is'),
      new RegExp('(?:^|\\n)(?:\\d+\\.\\s*)?(?:\\*\\*)?(?:See|보기|관찰)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\d+\\.\\s*)?(?:\\*\\*)?(?:Think|생각|Wonder|궁금)|$)', 'is')
    ],
    'think': [
      new RegExp('(?:^|\\n)(?:\\*\\*)?(?:Think|생각|생각하기)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\*\\*)?(?:Wonder|궁금|See|보기)|$)', 'is'),
      new RegExp('(?:^|\\n)(?:\\d+\\.\\s*)?(?:\\*\\*)?(?:Think|생각|생각하기)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\d+\\.\\s*)?(?:\\*\\*)?(?:Wonder|궁금|See|보기)|$)', 'is')
    ],
    'wonder': [
      new RegExp('(?:^|\\n)(?:\\*\\*)?(?:Wonder|궁금|궁금하기)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\*\\*)?(?:See|보기|Think|생각)|$)', 'is'),
      new RegExp('(?:^|\\n)(?:\\d+\\.\\s*)?(?:\\*\\*)?(?:Wonder|궁금|궁금하기)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\d+\\.\\s*)?(?:\\*\\*)?(?:See|보기|Think|생각)|$)', 'is')
    ]
  },
  'frayer-model': {
    'see': [
      new RegExp('(?:^|\\n)(?:\\*\\*)?(?:Definition|정의)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\*\\*)?(?:Characteristics?|특징|Examples?|예시)|$)', 'is'),
      new RegExp('(?:^|\\n)(?:\\d+\\.\\s*)?(?:\\*\\*)?(?:Definition|정의)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\d+\\.\\s*)?(?:\\*\\*)?(?:Characteristics?|특징|Examples?|예시)|$)', 'is')
    ],
    'think': [
      new RegExp('(?:^|\\n)(?:\\*\\*)?(?:Characteristics?|특징)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\*\\*)?(?:Definition|정의|Examples?|예시)|$)', 'is'),
      new RegExp('(?:^|\\n)(?:\\d+\\.\\s*)?(?:\\*\\*)?(?:Characteristics?|특징)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\d+\\.\\s*)?(?:\\*\\*)?(?:Definition|정의|Examples?|예시)|$)', 'is')
    ],
    'wonder': [
      new RegExp('(?:^|\\n)(?:\\*\\*)?(?:Examples?\\s*&?\\s*Non[-\\s]?Examples?|예시와?\\s*반례|Examples?|예시)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\*\\*)?(?:Definition|정의|Characteristics?|특징)|$)', 'is'),
      new RegExp('(?:^|\\n)(?:\\d+\\.\\s*)?(?:\\*\\*)?(?:Examples?\\s*&?\\s*Non[-\\s]?Examples?|예시와?\\s*반례|Examples?|예시)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\d+\\.\\s*)?(?:\\*\\*)?(?:Definition|정의|Characteristics?|특징)|$)', 'is')
    ]
  },
  '4c': {
    'see': [
      new RegExp('(?:^|\\n)(?:\\*\\*)?(?:Connect|연결|연결하기)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\*\\*)?(?:Challenge|도전|Concepts?|개념|Changes?|변화)|$)', 'is')
    ],
    'think': [
      new RegExp('(?:^|\\n)(?:\\*\\*)?(?:Challenge|도전|도전하기)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\*\\*)?(?:Connect|연결|Concepts?|개념|Changes?|변화)|$)', 'is')
    ],
    'wonder': [
      new RegExp('(?:^|\\n)(?:\\*\\*)?(?:Concepts?|개념|개념\\s*파악)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\*\\*)?(?:Connect|연결|Challenge|도전|Changes?|변화)|$)', 'is')
    ],
    'fourth_step': [
      new RegExp('(?:^|\\n)(?:\\*\\*)?(?:Changes?|변화|변화\\s*제안)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\*\\*)?(?:Connect|연결|Challenge|도전|Concepts?|개념)|$)', 'is')
    ]
  }
};

// 응답 데이터를 사고루틴 유형에 맞게 매핑하는 함수
export const mapResponseToRoutineSteps = (responseData: any, routineType: string): { [stepKey: string]: string } => {
  if (!responseData || !routineType) return {};

  const stepLabels = routineStepLabels[routineType];
  if (!stepLabels) return responseData;

  const mappedResponse: { [stepKey: string]: string } = {};
  
  // 표준화된 키 매핑
  const keyMappings: { [key: string]: string } = {
    'see': 'see',
    'think': 'think', 
    'wonder': 'wonder',
    'fourth_step': 'fourth_step',
    'connect': 'see',
    'challenge': 'think',
    'concepts': 'wonder',
    'changes': 'fourth_step',
    'definition': 'see',
    'characteristics': 'think',
    'examples': 'wonder',
    'non_examples': 'fourth_step'
  };

  // 응답 데이터의 각 키를 사고루틴 단계에 매핑
  Object.entries(responseData).forEach(([key, value]) => {
    const normalizedKey = key.toLowerCase().replace(/_/g, '');
    const mappedKey = keyMappings[normalizedKey] || key;
    mappedResponse[mappedKey] = value as string;
  });

  return mappedResponse;
};

// AI 분석 결과를 파싱하는 함수
export const parseAIAnalysis = (aiAnalysis: string, routineType: string) => {
  if (!aiAnalysis || !routineType) return null;

  try {
    const patterns = routineStepPatterns[routineType];
    
    if (!patterns) {
      console.warn(`No patterns found for routine type: ${routineType}`);
      return null;
    }

    const individualSteps: {[key: string]: string} = {};
    
    Object.entries(patterns).forEach(([stepKey, stepPatterns]) => {
      for (const pattern of stepPatterns) {
        const match = aiAnalysis.match(pattern);
        if (match && match[1]) {
          individualSteps[stepKey] = match[1].trim();
          break;
        }
      }
    });

    const summaryMatch = aiAnalysis.match(/(?:전체.*?분석|종합.*?평가|요약)[\s\S]*?(?=\n(?:\*\*)?(?:개선|제안|권장사항)|$)/i);
    const suggestionsMatch = aiAnalysis.match(/(?:개선.*?제안|권장사항|제안사항)[\s\S]*$/i);

    return {
      individualSteps,
      summary: summaryMatch ? summaryMatch[0].trim() : '',
      suggestions: suggestionsMatch ? suggestionsMatch[0].trim() : ''
    };
  } catch (error) {
    console.error('AI 분석 파싱 중 오류:', error);
    return null;
  }
};
