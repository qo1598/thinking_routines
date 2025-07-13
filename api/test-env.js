module.exports = async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const hasGeminiKey = !!process.env.GEMINI_API_KEY;
    const geminiKeyLength = process.env.GEMINI_API_KEY?.length || 0;
    
    return res.status(200).json({
      hasGeminiKey,
      geminiKeyLength: geminiKeyLength > 0 ? `${geminiKeyLength} characters` : '0 characters',
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Environment test error:', error);
    return res.status(500).json({ 
      error: 'Environment test failed',
      details: error.message 
    });
  }
}; 