const express = require('express');
const multer = require('multer');
const { GoogleGenAI } = require('@google/genai');
const router = express.Router();

// Multer 설정 (메모리 저장)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB 제한
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
    }
  }
});

// 새로운 Gemini API 초기화
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 사고루틴별 분석 프롬프트 생성
const generateAnalysisPrompt = (routineType) => {
  const basePrompt = `당신은 한국의 사고루틴(Thinking Routines) 교육 전문가입니다. 
학생이 작성한 사고루틴 활동 결과물을 분석하여 교사에게 도움이 되는 피드백을 제공하는 것이 목표입니다.

**중요 지침:**
1. 이미지의 모든 텍스트를 정확히 읽고 이해하세요
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
이 이미지는 학생이 작성한 See-Think-Wonder(보기-생각하기-궁금하기) 활동 결과물입니다.

- **See(보기)**: 학생이 주어진 자료에서 객관적으로 관찰한 내용
- **Think(생각하기)**: 관찰한 내용을 바탕으로 한 학생의 해석, 추론, 연결
- **Wonder(궁금하기)**: 학생이 가지게 된 의문, 호기심, 탐구하고 싶은 점

**분석 형식:**
## 1. 각 단계별 분석
### See (보기) 
- [학생의 관찰 능력과 응답 품질 평가 2-3줄]
### Think (생각하기)
- [학생의 사고 능력과 응답 품질 평가 2-3줄]
### Wonder (궁금하기)
- [학생의 호기심과 질문 생성 능력 평가 2-3줄]`,

    '4c': `
**4C 사고루틴 분석:**
이 이미지는 학생이 작성한 4C(Connect-Challenge-Concepts-Changes) 활동 결과물입니다.

- **Connect(연결하기)**: 새로운 정보를 기존 지식과 연결하는 능력
- **Challenge(도전하기)**: 도전적이거나 논란이 될 수 있는 아이디어 식별
- **Concepts(개념)**: 핵심 개념과 아이디어 파악
- **Changes(변화)**: 태도나 사고, 행동의 변화 제안

**분석 형식:**
## 1. 각 단계별 분석
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
이 이미지는 학생이 작성한 Circle of Viewpoints(관점의 원) 활동 결과물입니다.

**분석 형식:**
## 1. 각 단계별 분석
### 관점 정하기
- [관점 선택 능력 평가 2-3줄]
### 관점에 따라 생각 쓰기
- [선택한 관점에서의 사고 능력 평가 2-3줄]
### 관점에 대한 염려되거나 더 알고 싶은 것 쓰기
- [비판적 사고 및 호기심 능력 평가 2-3줄]`,

    'connect-extend-challenge': `
**Connect-Extend-Challenge 사고루틴 분석:**
이 이미지는 학생이 작성한 Connect-Extend-Challenge(연결-확장-도전) 활동 결과물입니다.

**분석 형식:**
## 1. 각 단계별 분석
### Connect (연결)
- [기존 지식과의 연결 능력 평가 2-3줄]
### Extend (확장)
- [사고 확장 능력 평가 2-3줄]
### Challenge (도전)
- [비판적 사고 및 도전 제기 능력 평가 2-3줄]`,

    'frayer-model': `
**Frayer Model 사고루틴 분석:**
이 이미지는 학생이 작성한 Frayer Model(프레이어 모델) 활동 결과물입니다.

**분석 형식:**
## 1. 각 단계별 분석
### Definition (정의)
- [개념 정의 능력 평가 2-3줄]
### Characteristics (특징)
- [특징 파악 능력 평가 2-3줄]
### Examples (예시)
- [예시 제시 능력 평가 2-3줄]
### Non-Examples (반례)
- [반례 제시 능력 평가 2-3줄]`,

    'used-to-think-now-think': `
**I Used to Think... Now I Think... 사고루틴 분석:**
이 이미지는 학생이 작성한 I Used to Think... Now I Think...(이전 생각 - 현재 생각) 활동 결과물입니다.

**분석 형식:**
## 1. 각 단계별 분석
### I Used to Think (이전 생각)
- [이전 생각 표현 능력 평가 2-3줄]
### Now I Think (현재 생각)
- [현재 생각 표현 능력 평가 2-3줄]`,

    'think-puzzle-explore': `
**Think-Puzzle-Explore 사고루틴 분석:**
이 이미지는 학생이 작성한 Think-Puzzle-Explore(생각하기-질문하기-탐구하기) 활동 결과물입니다.

**분석 형식:**
## 1. 각 단계별 분석
### Think (생각하기)
- [기존 지식 활용 능력 평가 2-3줄]
### Puzzle (질문하기)
- [의문 제기 능력 평가 2-3줄]
### Explore (탐구하기)
- [탐구 계획 능력 평가 2-3줄]`
  };

  const commonEnd = `
## 2. 종합 평가

**강점:**
- [구체적 강점과 근거 1-2개]

**개선점:**
- [명확한 개선점과 개선 방법 1-2개]

**교사 참고사항:**
- [점수 평가 시 고려할 요소들]

## 3. 교육적 권장사항

**다음 활동 제안:**
- [학생 수준에 맞는 구체적 제안 2-3개]

위 형식을 정확히 따라 작성해주세요.`;

  return basePrompt + (routineSpecificPrompts[routineType] || routineSpecificPrompts['see-think-wonder']) + commonEnd;
};

// 이미지를 base64로 변환
const fileToGenerativePart = (buffer, mimeType) => {
  return {
    inlineData: {
      data: Buffer.from(buffer).toString('base64'),
      mimeType
    }
  };
};

// POST /api/analyze-routine-image
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { routineType } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({ error: '이미지 파일이 필요합니다.' });
    }

    if (!routineType) {
      return res.status(400).json({ error: '사고루틴 타입이 필요합니다.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API 키가 설정되지 않았습니다.' });
    }

    console.log(`이미지 분석 시작: ${routineType}, 파일 크기: ${imageFile.size} bytes`);

    // 프롬프트 생성
    const prompt = generateAnalysisPrompt(routineType);

    // 이미지를 Gemini가 이해할 수 있는 형태로 변환
    const imagePart = fileToGenerativePart(imageFile.buffer, imageFile.mimetype);

    console.log('새로운 Gemini SDK로 API 호출 중...');

    // 새로운 SDK 방식으로 API 호출 - 가장 경제적인 모델 사용!
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-lite',  // 비용 절약을 위한 가장 경제적인 모델
      contents: [
        prompt,
        imagePart
      ]
    });

    const analysisText = response.text;

    console.log('분석 완료, 응답 길이:', analysisText.length);

    // 신뢰도 계산 (간단한 휴리스틱)
    const confidence = calculateConfidence(analysisText);

    // 텍스트 추출 시뮬레이션 (실제로는 OCR 결과)
    const extractedText = `[이미지에서 추출된 텍스트]\n사고루틴: ${routineType}\n학생 응답 내용이 여기에 표시됩니다.`;

    res.json({
      extractedText,
      analysis: analysisText,
      confidence,
      routineType
    });

  } catch (error) {
    console.error('이미지 분석 오류:', error);
    
    // Gemini API 에러 처리
    if (error.message.includes('API_KEY')) {
      return res.status(500).json({ error: 'API 키 오류가 발생했습니다.' });
    }
    
    if (error.message.includes('SAFETY')) {
      return res.status(400).json({ error: '안전 정책에 위반되는 콘텐츠입니다.' });
    }

    if (error.message.includes('QUOTA')) {
      return res.status(429).json({ error: 'API 사용량 한도를 초과했습니다.' });
    }

    res.status(500).json({ 
      error: '이미지 분석 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
});

// POST /api/analyze-routine-image/text - 텍스트 기반 분석
router.post('/text', async (req, res) => {
  try {
    const { routineType, responses } = req.body;

    if (!routineType || !responses) {
      return res.status(400).json({ error: '사고루틴 유형과 응답 데이터가 필요합니다.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API 키가 설정되지 않았습니다.' });
    }

    console.log(`텍스트 분석 시작: ${routineType}`);

    // 텍스트 응답을 분석용 텍스트로 변환 (모든 단계 포함)
    const responseText = Object.entries(responses)
      .filter(([key, value]) => value && value.trim().length > 0)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n\n');

    // 프롬프트 생성
    const prompt = `당신은 한국의 사고루틴(Thinking Routines) 교육 전문가입니다.
학생이 작성한 ${routineType} 사고루틴 활동 결과물을 분석하여 교사에게 도움이 되는 피드백을 제공하는 것이 목표입니다.

**학생 응답:**
${responseText}

**분석 요청:**
1. 각 단계별 응답의 품질과 적절성 평가
2. 종합 분석 (논리적 연결성, 사고의 깊이, 개선점과 건설적 피드백, 추가 활동 제안)
3. 교육적 제안
4. 긍정적이면서 건설적인 평가

한국어로 자세하고 구체적인 분석을 제공해주세요.`;

    console.log('Gemini API 호출 중...');

    // Gemini API 호출
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-lite',
      contents: [prompt]
    });

    const analysisText = response.text;

    console.log('분석 완료, 응답 길이:', analysisText.length);

    // 신뢰도 계산
    const confidence = calculateConfidence(analysisText);

    res.json({
      analysis: analysisText,
      confidence,
      routineType
    });

  } catch (error) {
    console.error('텍스트 분석 오류:', error);
    
    if (error.message.includes('API_KEY')) {
      return res.status(500).json({ error: 'API 키 오류가 발생했습니다.' });
    }
    
    if (error.message.includes('SAFETY')) {
      return res.status(400).json({ error: '안전 정책에 위반되는 콘텐츠입니다.' });
    }

    if (error.message.includes('QUOTA')) {
      return res.status(429).json({ error: 'API 사용량 한도를 초과했습니다.' });
    }

    res.status(500).json({ 
      error: '텍스트 분석 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
});

// 신뢰도 계산 함수
const calculateConfidence = (analysisText) => {
  let confidence = 0.5; // 기본값

  // 텍스트 길이 기반 (더 길면 더 자세한 분석)
  if (analysisText.length > 1000) confidence += 0.2;
  if (analysisText.length > 2000) confidence += 0.1;

  // 구조화된 응답인지 확인
  if (analysisText.includes('## 1.') && analysisText.includes('## 2.')) confidence += 0.2;

  // 구체적인 피드백 포함 여부
  if (analysisText.includes('강점') && analysisText.includes('개선점')) confidence += 0.1;

  return Math.min(confidence, 0.95); // 최대 95%
};

module.exports = router; 