const { GoogleGenerativeAI } = require('@google/generative-ai');

// 사고루틴별 분석 프롬프트 생성
const generateAnalysisPrompt = (routineType, responseText) => {
  const basePrompt = `당신은 한국의 사고루틴(Thinking Routines) 교육 전문가입니다. 
학생이 작성한 사고루틴 활동 결과물을 분석하여 교사에게 도움이 되는 피드백을 제공하는 것이 목표입니다.

**중요 지침:**
1. 학생의 모든 응답을 정확히 읽고 이해하세요
2. 한국어로 작성된 내용을 분석하세요
3. 교사가 학생을 평가할 때 참고할 수 있는 구체적이고 객관적인 분석을 제공하세요
4. 긍정적이면서도 정확한 평가를 유지하세요

**응답 품질 평가 기준:**
1. **내용의 적절성**: 각 단계의 목적에 맞는 응답인가?
2. **구체성**: 추상적이지 않고 구체적인 내용인가?
3. **논리적 연결**: 단계들이 논리적으로 연결되는가?
4. **깊이**: 표면적이지 않고 깊이 있는 사고가 드러나는가?
5. **창의성**: 독창적이고 다양한 관점이 포함되어 있는가?`;

  const routineSpecificPrompts = {
    'see-think-wonder': `
**See-Think-Wonder 사고루틴 분석:**
이 데이터는 학생이 작성한 See-Think-Wonder(보기-생각하기-궁금하기) 활동 결과물입니다.

- **See(보기)**: 학생이 주어진 자료에서 객관적으로 관찰한 내용
- **Think(생각하기)**: 관찰한 내용을 바탕으로 한 학생의 해석, 추론, 연결
- **Wonder(궁금하기)**: 학생이 가지게 된 의문, 호기심, 탐구하고 싶은 점

**분석 형식:**
## 1. 각 단계별 응답의 품질과 적절성 평가
### See (보기) 
- [학생의 관찰 능력과 응답 품질 평가 2-3줄]
### Think (생각하기)
- [학생의 사고 능력과 응답 품질 평가 2-3줄]
### Wonder (궁금하기)
- [학생의 호기심과 질문 생성 능력 평가 2-3줄]`,

    '4c': `
**4C 사고루틴 분석:**
이 데이터는 학생이 작성한 4C(Connect-Challenge-Concepts-Changes) 활동 결과물입니다.

- **Connect(연결하기)**: 새로운 정보를 기존 지식과 연결하는 능력
- **Challenge(도전하기)**: 도전적이거나 논란이 될 수 있는 아이디어 식별
- **Concepts(개념)**: 핵심 개념과 아이디어 파악
- **Changes(변화)**: 태도나 사고, 행동의 변화 제안

**분석 형식:**
## 1. 각 단계별 응답의 품질과 적절성 평가
### Connect (연결하기)
- [연결 능력 평가와 구체적 피드백 2-3줄]
### Challenge (도전하기)
- [비판적 사고 능력 평가와 구체적 피드백 2-3줄]
### Concepts (개념)
- [핵심 개념 파악 능력 평가와 구체적 피드백 2-3줄]
### Changes (변화)
- [변화 제안 능력 평가와 구체적 피드백 2-3줄]`,

    'circle-of-viewpoints': `
**Circle of Viewpoints 사고루틴 분석:**
이 데이터는 학생이 작성한 Circle of Viewpoints(관점의 원) 활동 결과물입니다.

**분석 형식:**
## 1. 각 단계별 응답의 품질과 적절성 평가
### 관점 정하기
- [관점 선택 능력 평가 2-3줄]
### 관점에 따라 생각 쓰기
- [선택한 관점에서의 사고 능력 평가 2-3줄]
### 관점에 대한 염려되거나 더 알고 싶은 것 쓰기
- [비판적 사고 및 호기심 능력 평가 2-3줄]`,

    'connect-extend-challenge': `
**Connect-Extend-Challenge 사고루틴 분석:**
이 데이터는 학생이 작성한 Connect-Extend-Challenge(연결-확장-도전) 활동 결과물입니다.

**분석 형식:**
## 1. 각 단계별 응답의 품질과 적절성 평가
### Connect (연결하기)
- [기존 지식과의 연결 능력 평가 2-3줄]
### Extend (확장하기)
- [사고 확장 능력 평가 2-3줄]
### Challenge (도전하기)
- [비판적 사고 능력 평가 2-3줄]`,

    'frayer-model': `
**Frayer Model 사고루틴 분석:**
이 데이터는 학생이 작성한 Frayer Model(프레이어 모델) 활동 결과물입니다.

**분석 형식:**
## 1. 각 단계별 응답의 품질과 적절성 평가
### Definition (정의)
- [개념 정의 능력 평가 2-3줄]
### Characteristics (특징)
- [특징 파악 능력 평가 2-3줄]
### Examples (예시)
- [예시 제시 능력 평가 2-3줄]
### Non-Examples (반례)
- [반례 이해 능력 평가 2-3줄]`,

    'used-to-think-now-think': `
**I Used to Think... Now I Think... 사고루틴 분석:**
이 데이터는 학생이 작성한 I Used to Think... Now I Think... 활동 결과물입니다.

**분석 형식:**
## 1. 각 단계별 응답의 품질과 적절성 평가
### Used to Think (이전 생각)
- [이전 인식 표현 능력 평가 2-3줄]
### Now Think (현재 생각)
- [새로운 인식 형성 능력 평가 2-3줄]`,

    'think-puzzle-explore': `
**Think-Puzzle-Explore 사고루틴 분석:**
이 데이터는 학생이 작성한 Think-Puzzle-Explore 활동 결과물입니다.

**분석 형식:**
## 1. 각 단계별 응답의 품질과 적절성 평가
### Think (생각하기)
- [기존 지식 활용 능력 평가 2-3줄]
### Puzzle (퍼즐)
- [의문 제기 능력 평가 2-3줄]
### Explore (탐구하기)
- [탐구 계획 능력 평가 2-3줄]`
  };

  const specificPrompt = routineSpecificPrompts[routineType] || routineSpecificPrompts['see-think-wonder'];
  
  return `${basePrompt}${specificPrompt}

**학생 응답:**
${responseText}

## 2. 종합 분석
**논리적 연결성**
[각 단계 간의 논리적 연결성과 일관성 평가 2-3줄]

**사고의 깊이**  
[학습자의 사고 깊이와 성숙도 평가 2-3줄]

**개선점과 건설적 피드백**
[구체적인 개선 방안과 발전 방향 제시 2-3줄]

**추가 활동 제안**
[사고루틴의 확장이나 심화를 위한 활동 제안 2-3줄]

## 3. 교육적 제안
- [교사를 위한 지도 방안과 후속 활동 제안 3-4줄]`;
};


module.exports = async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('텍스트 분석 API 요청 시작');
    
    const { routineType, responses } = req.body;

    if (!routineType || !responses) {
      console.log('필수 데이터 누락');
      return res.status(400).json({ error: '사고루틴 유형과 응답 데이터가 필요합니다.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.log('Gemini API 키 누락');
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    console.log('Gemini AI 초기화 중...');
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // 응답 데이터를 텍스트로 변환 (모든 단계 포함)
    const responseText = Object.entries(responses)
      .filter(([key, value]) => value && value.trim().length > 0)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n\n');

    console.log('프롬프트 생성 중...');
    const prompt = generateAnalysisPrompt(routineType, responseText);

    console.log('Gemini API 호출 중...');
    const model = ai.getGenerativeModel({ 
      model: 'gemini-2.0-flash-lite'  // 백엔드와 동일한 모델 사용
    });
    
    const response = await model.generateContent([{ text: prompt }]);
    const analysisText = response.response.text();

    if (!analysisText) {
      console.log('AI 분석 결과가 비어있음');
      return res.status(500).json({ error: 'Empty analysis result' });
    }

    // 신뢰도 계산 (백엔드와 동일한 로직)
    const calculateConfidence = (text) => {
      let confidence = 0.5; // 기본값
      
      if (text && text.length > 100) confidence += 0.2;
      if (text && text.includes('분석') || text.includes('평가')) confidence += 0.1;
      if (text && text.includes('개선') || text.includes('피드백')) confidence += 0.1;
      if (text && text.split('\n').length > 3) confidence += 0.1;
      
      return Math.min(confidence, 0.95);
    };

    const confidence = calculateConfidence(analysisText);

    console.log('텍스트 분석 완료');
    return res.status(200).json({
      analysis: analysisText,
      confidence,
      routineType,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Gemini API 오류:', error);
    
    let errorMessage = 'AI 분석 중 오류가 발생했습니다';
    if (error.message) {
      errorMessage += `: ${error.message}`;
    }
    
    return res.status(500).json({ 
      error: errorMessage,
      details: error.toString()
    });
  }
};
