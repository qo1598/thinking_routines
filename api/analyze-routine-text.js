const { GoogleGenerativeAI } = require('@google/generative-ai');

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

    // 응답 데이터를 텍스트로 변환 (fourth_step 제외)
    const responseText = Object.entries(responses)
      .filter(([key]) => key !== 'fourth_step')
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n\n');

    console.log('프롬프트 생성 중...');
    const prompt = `당신은 한국의 사고루틴(Thinking Routines) 교육 전문가입니다.
학생이 작성한 ${routineType} 사고루틴 활동 결과물을 분석하여 교사에게 도움이 되는 피드백을 제공하는 것이 목표입니다.

**학생 응답:**
${responseText}

**분석 요청:**
1. 각 단계별 응답의 품질과 적절성 평가
2. 논리적 연결성과 사고의 깊이 분석
3. 개선점과 건설적 피드백 제안
4. 긍정적이면서 건설적인 평가

한국어로 자세하고 구체적인 분석을 제공해주세요.`;

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
