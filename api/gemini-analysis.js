import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
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

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.log('Gemini API 키 누락');
      return res.status(500).json({ error: 'Google Gemini API key not configured' });
    }

    console.log('Gemini API 초기화 중...');
    
    // Google Gemini API 초기화
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    
    // 더 안정적인 모델 사용
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    });

    // 전체 프롬프트 구성
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    
    console.log('Gemini API 호출 중...');

    // Gemini API 호출
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    
    if (!response) {
      throw new Error('Gemini API 응답이 없습니다');
    }
    
    const analysis = response.text();
    
    if (!analysis) {
      throw new Error('Gemini API 응답 텍스트가 없습니다');
    }

    console.log('Gemini API 분석 완료');
    
    return res.status(200).json({ analysis });
  } catch (error) {
    console.error('Gemini API 상세 오류:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // 구체적인 오류 메시지 제공
    let errorMessage = 'AI 분석 중 오류가 발생했습니다.';
    
    if (error.message.includes('API_KEY')) {
      errorMessage = 'API 키 설정에 문제가 있습니다.';
    } else if (error.message.includes('quota')) {
      errorMessage = 'API 사용량 한도를 초과했습니다.';
    } else if (error.message.includes('timeout')) {
      errorMessage = '요청 시간이 초과되었습니다. 다시 시도해주세요.';
    }
    
    return res.status(500).json({ 
      error: errorMessage,
      details: error.message 
    });
  }
} 