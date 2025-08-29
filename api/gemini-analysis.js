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
    
    const { systemPrompt, userPrompt, imageUrl, youtubeUrl, imageData } = req.body;

    if (!systemPrompt || !userPrompt) {
      console.log('필수 프롬프트 누락');
      return res.status(400).json({ error: 'Missing required prompts' });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.log('Gemini API 키 누락');
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    console.log('새로운 Gemini SDK 초기화 중...');
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    console.log('AI 분석 시작...');
    
    // 멀티모달 입력 구성
    const parts = [
      { text: systemPrompt },
      { text: userPrompt }
    ];

    // 업로드된 이미지 데이터가 있는 경우 (ThinkingRoutineAnalysis에서 사용)
    if (imageData) {
      try {
        console.log('업로드된 이미지 분석 포함');
        // base64 데이터에서 데이터 부분만 추출 (data:image/jpeg;base64, 제거)
        const base64Data = imageData.split(',')[1] || imageData;
        const mimeType = imageData.includes('data:') ? 
          imageData.split(';')[0].split(':')[1] : 'image/jpeg';
        
        const imageDataObj = {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        };
        parts.push(imageDataObj);
        parts.push({ text: "\n\n위 이미지를 분석하여 학생의 사고루틴 활동을 평가해주세요." });
      } catch (imageError) {
        console.error('업로드된 이미지 처리 오류:', imageError);
        parts.push({ text: "\n\n(이미지 분석 중 오류가 발생했습니다. 텍스트 기반으로만 분석합니다.)" });
      }
    }
    // 이미지 URL이 있는 경우 (기존 StudentResponseDetail에서 사용)
    else if (imageUrl) {
      try {
        console.log('이미지 URL 분석 포함:', imageUrl);
        const imageResponse = await fetch(imageUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        const imageDataObj = {
          inlineData: {
            data: Buffer.from(imageBuffer).toString('base64'),
            mimeType: imageResponse.headers.get('content-type') || 'image/jpeg'
          }
        };
        parts.push(imageDataObj);
        parts.push({ text: "\n\n위 이미지를 분석하여 학생의 응답을 평가해주세요." });
      } catch (imageError) {
        console.error('이미지 URL 로드 오류:', imageError);
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

    // Gemini API 호출 - 가장 경제적인 모델 사용
    const model = ai.getGenerativeModel({ 
      model: 'gemini-1.5-flash'  // 안정적이고 경제적인 모델
    });
    
    const response = await model.generateContent(parts);

    console.log('AI 분석 완료');
    const analysisText = response.response.text();

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
