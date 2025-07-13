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
    console.log('Gemini API 요청 시작');
    
    const { systemPrompt, userPrompt } = req.body;

    if (!systemPrompt || !userPrompt) {
      console.log('필수 프롬프트 누락');
      return res.status(400).json({ error: 'Missing required prompts' });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.log('Gemini API 키 누락');
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    console.log('Gemini API 초기화 중...');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // 더 안정적인 모델 사용
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    console.log('AI 분석 시작...');
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userPrompt }
    ]);

    console.log('AI 분석 완료');
    const response = await result.response;
    const analysisText = response.text();

    if (!analysisText) {
      console.log('AI 분석 결과가 비어있음');
      return res.status(500).json({ error: 'Empty analysis result' });
    }

    console.log('성공적으로 분석 완료');
    return res.status(200).json({
      analysis: analysisText,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Gemini API 오류:', error);
    
    // 더 구체적인 오류 메시지 제공
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
