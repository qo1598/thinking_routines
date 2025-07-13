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
    
    const { systemPrompt, userPrompt, imageUrl, youtubeUrl } = req.body;

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
    
    // 멀티모달 입력 구성
    const parts = [
      { text: systemPrompt },
      { text: userPrompt }
    ];

    // 이미지가 있는 경우 추가
    if (imageUrl) {
      try {
        console.log('이미지 분석 포함:', imageUrl);
        const imageResponse = await fetch(imageUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        const imageData = {
          inlineData: {
            data: Buffer.from(imageBuffer).toString('base64'),
            mimeType: imageResponse.headers.get('content-type') || 'image/jpeg'
          }
        };
        parts.push(imageData);
        parts.push({ text: "\n\n위 이미지를 분석하여 학생의 응답을 평가해주세요." });
      } catch (imageError) {
        console.error('이미지 로드 오류:', imageError);
        parts.push({ text: "\n\n(이미지 분석 중 오류가 발생했습니다. 텍스트 기반으로만 분석합니다.)" });
      }
    }

    // 유튜브 영상이 있는 경우 추가
    if (youtubeUrl) {
      try {
        console.log('유튜브 영상 분석 포함:', youtubeUrl);
        parts.push({ text: `\n\n유튜브 영상: ${youtubeUrl}` });
        parts.push({ text: "\n\n위 유튜브 영상의 내용을 분석하여 학생의 응답을 평가해주세요." });
      } catch (youtubeError) {
        console.error('유튜브 분석 오류:', youtubeError);
        parts.push({ text: "\n\n(유튜브 영상 분석 중 오류가 발생했습니다. 텍스트 기반으로만 분석합니다.)" });
      }
    }

    const result = await model.generateContent(parts);

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
