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
    'connect': 'Connect (연결하기)',
    'challenge': 'Challenge (도전하기)',
    'concepts': 'Concepts (개념)',
    'changes': 'Changes (변화)'
  },
  'circle-of-viewpoints': {
    'viewpoint_select': '관점 정하기',
    'viewpoint_thinking': '관점에 따라 생각 쓰기',
    'viewpoint_concerns': '관점에 대한 염려되거나 더 알고 싶은 것 쓰기'
  },
  'connect-extend-challenge': {
    'connect': 'Connect (연결)',
    'extend': 'Extend (확장)',
    'challenge': 'Challenge (도전)'
  },
  'frayer-model': {
    'definition': 'Definition (정의)',
    'characteristics': 'Characteristics (특징)',
    'examples': 'Examples (예시)',
    'non_examples': 'Non-Examples (반례)'
  },
  'used-to-think-now-think': {
    'used_to_think': 'I Used to Think (이전 생각)',
    'now_think': 'Now I Think (현재 생각)'
  },
  'think-puzzle-explore': {
    'think': 'Think (생각하기)',
    'puzzle': 'Puzzle (질문하기)',
    'explore': 'Explore (탐구하기)'
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
    'connect': '기존 지식이나 경험과 어떻게 연결되는지 설명해주세요.',
    'challenge': '비판적으로 검토하고 도전해볼 점을 기록해주세요.',
    'concepts': '핵심 개념이 무엇인지 파악해주세요.',
    'changes': '어떤 변화나 개선이 필요한지 제안해주세요.'
  },
  'circle-of-viewpoints': {
    'viewpoint_select': '어떤 관점에서 바라볼지 정해주세요.',
    'viewpoint_thinking': '선택한 관점에 따라 생각한 내용을 써주세요.',
    'viewpoint_concerns': '이 관점에 대해 염려되거나 더 알고 싶은 것을 써주세요.'
  },
  'connect-extend-challenge': {
    'connect': '기존 지식이나 경험과 어떻게 연결되는지 설명해주세요.',
    'extend': '이 주제를 더 확장하거나 발전시킬 수 있는 방법을 생각해주세요.',
    'challenge': '비판적으로 검토하고 도전해볼 점을 기록해주세요.'
  },
  'frayer-model': {
    'definition': '개념의 정의를 명확하게 써주세요.',
    'characteristics': '개념의 특징이나 속성을 나열해주세요.',
    'examples': '개념에 해당하는 구체적인 예시를 들어주세요.',
    'non_examples': '개념에 해당하지 않는 반례를 들어주세요.'
  },
  'used-to-think-now-think': {
    'used_to_think': '이전에 생각했던 내용을 써주세요.',
    'now_think': '지금 새롭게 생각하는 내용을 써주세요.'
  },
  'think-puzzle-explore': {
    'think': '주제에 대해 생각한 내용을 써주세요.',
    'puzzle': '궁금하거나 질문하고 싶은 것을 써주세요.',
    'explore': '더 탐구하고 싶은 방향이나 방법을 써주세요.'
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
  '4c': {
    'connect': [
      new RegExp('(?:^|\\n)(?:\\*\\*)?(?:Connect|연결|연결하기)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\*\\*)?(?:Challenge|도전|Concepts?|개념|Changes?|변화)|$)', 'is')
    ],
    'challenge': [
      new RegExp('(?:^|\\n)(?:\\*\\*)?(?:Challenge|도전|도전하기)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\*\\*)?(?:Connect|연결|Concepts?|개념|Changes?|변화)|$)', 'is')
    ],
    'concepts': [
      new RegExp('(?:^|\\n)(?:\\*\\*)?(?:Concepts?|개념|개념\\s*파악)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\*\\*)?(?:Connect|연결|Challenge|도전|Changes?|변화)|$)', 'is')
    ],
    'changes': [
      new RegExp('(?:^|\\n)(?:\\*\\*)?(?:Changes?|변화|변화\\s*제안)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\*\\*)?(?:Connect|연결|Challenge|도전|Concepts?|개념)|$)', 'is')
    ]
  },
  'circle-of-viewpoints': {
    'viewpoint_select': [
      new RegExp('(?:^|\\n)(?:\\*\\*)?(?:관점\\s*선택|관점\\s*정하기|Viewpoint)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\*\\*)?(?:관점\\s*생각|염려|우려)|$)', 'is')
    ],
    'viewpoint_thinking': [
      new RegExp('(?:^|\\n)(?:\\*\\*)?(?:관점\\s*생각|관점\\s*따라|Thinking)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\*\\*)?(?:관점\\s*선택|염려|우려)|$)', 'is')
    ],
    'viewpoint_concerns': [
      new RegExp('(?:^|\\n)(?:\\*\\*)?(?:염려|우려|더\\s*알고\\s*싶은|Concerns?)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\*\\*)?(?:관점\\s*선택|관점\\s*생각)|$)', 'is')
    ]
  },
  'connect-extend-challenge': {
    'connect': [
      new RegExp('(?:^|\\n)(?:\\*\\*)?(?:Connect|연결)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\*\\*)?(?:Extend|확장|Challenge|도전)|$)', 'is')
    ],
    'extend': [
      new RegExp('(?:^|\\n)(?:\\*\\*)?(?:Extend|확장)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\*\\*)?(?:Connect|연결|Challenge|도전)|$)', 'is')
    ],
    'challenge': [
      new RegExp('(?:^|\\n)(?:\\*\\*)?(?:Challenge|도전)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\*\\*)?(?:Connect|연결|Extend|확장)|$)', 'is')
    ]
  },
  'frayer-model': {
    'definition': [
      new RegExp('(?:^|\\n)(?:\\*\\*)?(?:Definition|정의)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\*\\*)?(?:Characteristics?|특징|Examples?|예시)|$)', 'is'),
      new RegExp('(?:^|\\n)(?:\\d+\\.\\s*)?(?:\\*\\*)?(?:Definition|정의)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\d+\\.\\s*)?(?:\\*\\*)?(?:Characteristics?|특징|Examples?|예시)|$)', 'is')
    ],
    'characteristics': [
      new RegExp('(?:^|\\n)(?:\\*\\*)?(?:Characteristics?|특징)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\*\\*)?(?:Definition|정의|Examples?|예시)|$)', 'is'),
      new RegExp('(?:^|\\n)(?:\\d+\\.\\s*)?(?:\\*\\*)?(?:Characteristics?|특징)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\d+\\.\\s*)?(?:\\*\\*)?(?:Definition|정의|Examples?|예시)|$)', 'is')
    ],
    'examples': [
      new RegExp('(?:^|\\n)(?:\\*\\*)?(?:Examples?|예시)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\*\\*)?(?:Definition|정의|Characteristics?|특징|Non[-\\s]?Examples?|반례)|$)', 'is'),
      new RegExp('(?:^|\\n)(?:\\d+\\.\\s*)?(?:\\*\\*)?(?:Examples?|예시)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\d+\\.\\s*)?(?:\\*\\*)?(?:Definition|정의|Characteristics?|특징|Non[-\\s]?Examples?|반례)|$)', 'is')
    ],
    'non_examples': [
      new RegExp('(?:^|\\n)(?:\\*\\*)?(?:Non[-\\s]?Examples?|반례)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\*\\*)?(?:Definition|정의|Characteristics?|특징|Examples?|예시)|$)', 'is'),
      new RegExp('(?:^|\\n)(?:\\d+\\.\\s*)?(?:\\*\\*)?(?:Non[-\\s]?Examples?|반례)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\d+\\.\\s*)?(?:\\*\\*)?(?:Definition|정의|Characteristics?|특징|Examples?|예시)|$)', 'is')
    ]
  },
  'used-to-think-now-think': {
    'used_to_think': [
      new RegExp('(?:^|\\n)(?:\\*\\*)?(?:Used\\s*to\\s*Think|이전\\s*생각)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\*\\*)?(?:Now\\s*Think|현재\\s*생각)|$)', 'is')
    ],
    'now_think': [
      new RegExp('(?:^|\\n)(?:\\*\\*)?(?:Now\\s*Think|현재\\s*생각)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\*\\*)?(?:Used\\s*to\\s*Think|이전\\s*생각)|$)', 'is')
    ]
  },
  'think-puzzle-explore': {
    'think': [
      new RegExp('(?:^|\\n)(?:\\*\\*)?(?:Think|생각|생각하기)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\*\\*)?(?:Puzzle|질문|Explore|탐구)|$)', 'is')
    ],
    'puzzle': [
      new RegExp('(?:^|\\n)(?:\\*\\*)?(?:Puzzle|질문|질문하기)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\*\\*)?(?:Think|생각|Explore|탐구)|$)', 'is')
    ],
    'explore': [
      new RegExp('(?:^|\\n)(?:\\*\\*)?(?:Explore|탐구|탐구하기)(?:\\*\\*)?(?:\\s*[:：]?\\s*)(.*?)(?=\\n(?:\\*\\*)?(?:Think|생각|Puzzle|질문)|$)', 'is')
    ]
  }
};

// 응답 데이터를 사고루틴 유형에 맞게 매핑하는 함수
export const mapResponseToRoutineSteps = (responseData: any, routineType: string): { [stepKey: string]: string } => {
  if (!responseData || !routineType) return {};

  const stepLabels = routineStepLabels[routineType];
  if (!stepLabels) return responseData;

  const mappedResponse: { [stepKey: string]: string } = {};
  
  // 사고루틴 유형별 키 매핑
  const routineKeyMappings: { [routineType: string]: { [key: string]: string } } = {
    'see-think-wonder': {
      'see': 'see',
      'think': 'think',
      'wonder': 'wonder'
    },
    '4c': {
      'connect': 'connect',
      'challenge': 'challenge', 
      'concepts': 'concepts',
      'changes': 'changes',
      // 이전 키들도 지원 (하위 호환성)
      'see': 'connect',
      'think': 'challenge',
      'wonder': 'concepts',
      'fourth_step': 'changes'
    },
    'circle-of-viewpoints': {
      'viewpoint_select': 'viewpoint_select',
      'viewpoint_thinking': 'viewpoint_thinking',
      'viewpoint_concerns': 'viewpoint_concerns',
      // 이전 키들도 지원
      'see': 'viewpoint_select',
      'think': 'viewpoint_thinking', 
      'wonder': 'viewpoint_concerns'
    },
    'connect-extend-challenge': {
      'connect': 'connect',
      'extend': 'extend',
      'challenge': 'challenge',
      // 이전 키들도 지원
      'see': 'connect',
      'think': 'extend',
      'wonder': 'challenge'
    },
    'frayer-model': {
      'definition': 'definition',
      'characteristics': 'characteristics',
      'examples': 'examples',
      'non_examples': 'non_examples',
      // 이전 키들도 지원
      'see': 'definition',
      'think': 'characteristics',
      'wonder': 'examples',
      'fourth_step': 'non_examples'
    },
    'used-to-think-now-think': {
      'used_to_think': 'used_to_think',
      'now_think': 'now_think',
      // 이전 키들도 지원
      'see': 'used_to_think',
      'think': 'now_think'
    },
    'think-puzzle-explore': {
      'think': 'think',
      'puzzle': 'puzzle',
      'explore': 'explore',
      // 이전 키들도 지원
      'see': 'think',
      'wonder': 'explore'
    }
  };

  const keyMappings = routineKeyMappings[routineType] || {};

  // 응답 데이터의 각 키를 사고루틴 단계에 매핑
  Object.entries(responseData).forEach(([key, value]) => {
    const normalizedKey = key.toLowerCase().replace(/_/g, '').replace(/-/g, '');
    
    // 직접 매칭 먼저 시도
    if (keyMappings[key]) {
      mappedResponse[keyMappings[key]] = value as string;
    }
    // 정규화된 키로 매칭 시도
    else {
      const foundKey = Object.keys(keyMappings).find(k => 
        k.toLowerCase().replace(/_/g, '').replace(/-/g, '') === normalizedKey
      );
      if (foundKey) {
        mappedResponse[keyMappings[foundKey]] = value as string;
      } else {
        // 매칭되지 않으면 원본 키 사용
        mappedResponse[key] = value as string;
      }
    }
  });

  return mappedResponse;
};

// 단계별 색상 매핑
const stepColors: { [stepIndex: number]: string } = {
  0: 'bg-blue-500',
  1: 'bg-green-500', 
  2: 'bg-purple-500',
  3: 'bg-red-500',
  4: 'bg-yellow-500',
  5: 'bg-indigo-500'
};

// routineStepLabels를 기반으로 stepInfoMap 생성하는 함수
export const generateStepInfoMap = (routineType: string): {[stepKey: string]: {title: string, subtitle: string, color: string}} => {
  const stepLabels = routineStepLabels[routineType] || routineStepLabels['see-think-wonder'];
  const stepInfoMap: {[stepKey: string]: {title: string, subtitle: string, color: string}} = {};
  
  Object.entries(stepLabels).forEach(([stepKey, label], index) => {
    // 라벨에서 제목과 부제목 분리 (예: "Connect (연결하기)" -> title: "Connect", subtitle: "연결하기")
    const match = label.match(/^(.+?)\s*\((.+?)\)$/) || label.match(/^(.+)$/);
    let title = '';
    let subtitle = '';
    
    if (match) {
      if (match[2]) {
        title = match[1].trim();
        subtitle = match[2].trim();
      } else {
        // 괄호가 없는 경우 (circle-of-viewpoints 등)
        title = match[1].trim();
        subtitle = match[1].trim();
      }
    }
    
    stepInfoMap[stepKey] = {
      title,
      subtitle,
      color: stepColors[index] || 'bg-gray-500'
    };
  });
  
  return stepInfoMap;
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
