import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface AnalysisResult {
  extractedText: string;
  analysis: string;
  confidence: number;
}

const ThinkingRoutineAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedRoutine, setSelectedRoutine] = useState('');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');

  // 사고루틴 옵션
  const routineOptions = [
    { value: 'see-think-wonder', label: 'See-Think-Wonder (보기-생각하기-궁금하기)' },
    { value: '4c', label: '4C (연결-도전-개념-변화)' },
    { value: 'circle-of-viewpoints', label: 'Circle of Viewpoints (관점의 원)' },
    { value: 'connect-extend-challenge', label: 'Connect-Extend-Challenge (연결-확장-도전)' },
    { value: 'frayer-model', label: 'Frayer Model (프레이어 모델)' },
    { value: 'used-to-think-now-think', label: 'I Used to Think... Now I Think... (이전 생각 - 현재 생각)' },
    { value: 'think-puzzle-explore', label: 'Think-Puzzle-Explore (생각-퍼즐-탐구)' }
  ];

  // 템플릿 다운로드 기능
  const downloadTemplate = (routineType: string) => {
    const templates = {
      'see-think-wonder': {
        name: '보기-생각하기-궁금하기_템플릿.pdf',
        content: generateSeeThinkWonderTemplate()
      },
      '4c': {
        name: '연결-도전-개념-변화_템플릿.pdf',
        content: generate4CTemplate()
      },
      'circle-of-viewpoints': {
        name: '관점의원_템플릿.pdf',
        content: generateCircleOfViewpointsTemplate()
      },
      'connect-extend-challenge': {
        name: '연결-확장-도전_템플릿.pdf',
        content: generateConnectExtendChallengeTemplate()
      },
      'frayer-model': {
        name: '프레이어모델_템플릿.pdf',
        content: generateFrayerModelTemplate()
      },
      'used-to-think-now-think': {
        name: '이전생각-현재생각_템플릿.pdf',
        content: generateUsedToThinkNowThinkTemplate()
      },
      'think-puzzle-explore': {
        name: '생각-퍼즐-탐구_템플릿.pdf',
        content: generateThinkPuzzleExploreTemplate()
      }
    };

    const template = templates[routineType as keyof typeof templates];
    if (template) {
      // 임시로 alert으로 알림 (실제로는 PDF 생성 라이브러리 필요)
      alert(`${template.name} 다운로드 기능이 준비 중입니다.`);
    }
  };

  // 템플릿 생성 함수들 (실제로는 PDF 생성 라이브러리 사용)
  const generateSeeThinkWonderTemplate = () => {
    return `
보기-생각하기-궁금하기 (See-Think-Wonder)

┌─────────────────────────────────────────────────────────────┐
│                    보기-생각하기-궁금하기                      │
├─────────────────┬─────────────────┬─────────────────────────┤
│      보기        │    생각하기      │       궁금하기           │
│     (See)       │    (Think)      │      (Wonder)          │
│                 │                 │                        │
│ 무엇을 보았나요?  │ 어떻게 생각하나요? │ 무엇이 궁금한가요?      │
│                 │                 │                        │
│                 │                 │                        │
│                 │                 │                        │
│                 │                 │                        │
│                 │                 │                        │
│                 │                 │                        │
│                 │                 │                        │
│                 │                 │                        │
│                 │                 │                        │
│                 │                 │                        │
└─────────────────┴─────────────────┴─────────────────────────┘

이름: ________________    날짜: ________________
`;
  };

  const generate4CTemplate = () => {
    return `
연결-도전-개념-변화 (4C)

┌─────────────────────────────────────────────────────────────┐
│                    연결-도전-개념-변화                         │
├─────────────────────────────┬───────────────────────────────┤
│            연결              │            도전               │
│         (Connect)           │         (Challenge)          │
│                             │                              │
│ 이미 알고 있는 것과 어떻게    │ 어떤 아이디어나 가정에        │
│ 연결되나요?                  │ 도전하고 싶나요?              │
│                             │                              │
│                             │                              │
│                             │                              │
│                             │                              │
├─────────────────────────────┼───────────────────────────────┤
│            개념              │            변화               │
│         (Concepts)          │          (Changes)           │
│                             │                              │
│ 중요하다고 생각하는          │ 어떤 변화를 제안하나요?       │
│ 핵심 개념은 무엇인가요?      │                              │
│                             │                              │
│                             │                              │
│                             │                              │
│                             │                              │
└─────────────────────────────┴───────────────────────────────┘

이름: ________________    날짜: ________________
`;
  };

  const generateCircleOfViewpointsTemplate = () => {
    return `관점의 원 (Circle of Viewpoints) 템플릿`;
  };

  const generateConnectExtendChallengeTemplate = () => {
    return `연결-확장-도전 (Connect-Extend-Challenge) 템플릿`;
  };

  const generateFrayerModelTemplate = () => {
    return `프레이어 모델 (Frayer Model) 템플릿`;
  };

  const generateUsedToThinkNowThinkTemplate = () => {
    return `이전 생각 - 현재 생각 (I Used to Think... Now I Think...) 템플릿`;
  };

  const generateThinkPuzzleExploreTemplate = () => {
    return `생각-퍼즐-탐구 (Think-Puzzle-Explore) 템플릿`;
  };

  // 이미지 업로드 처리
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  // 카메라 촬영 처리
  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleImageUpload(event);
  };

  // AI 분석 실행
  const handleAnalyzeImage = async () => {
    if (!uploadedImage || !selectedRoutine) {
      setError('사고루틴을 선택하고 이미지를 업로드해주세요.');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', uploadedImage);
      formData.append('routineType', selectedRoutine);

      // 개발 환경에서는 백엔드 서버 URL 사용
      const apiUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3001/api/analyze-routine-image'
        : '/api/analyze-routine-image';
        
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('분석 요청에 실패했습니다.');
      }

      const result = await response.json();
      setAnalysisResult(result);
    } catch (err) {
      console.error('Analysis error:', err);
      setError('이미지 분석 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setAnalyzing(false);
    }
  };

  // 초기화
  const handleReset = () => {
    setSelectedRoutine('');
    setUploadedImage(null);
    setImagePreview('');
    setAnalysisResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // 마크다운 텍스트를 HTML로 변환
  const formatMarkdownText = (text: string) => {
    return text
      .replace(/## (\d+)\. (.*?)(?=\n|$)/g, '<h3 class="text-xl font-bold text-purple-800 mb-4 pb-2 border-b-2 border-purple-200">$1. $2</h3>')
      .replace(/### (.*?)(?=\n|$)/g, '<h4 class="text-lg font-semibold text-gray-900 mt-6 mb-3 text-purple-700">$1</h4>')
      .replace(/\*\*(.*?):\*\*/g, '<div class="mt-4 mb-2"><span class="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">$1:</span></div>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      .replace(/^- (.*?)$/gm, '<div class="flex items-start mb-2"><span class="text-purple-500 mr-2 mt-1">•</span><span class="text-gray-700">$1</span></div>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br/>')
      .replace(/^/, '<p class="mb-4">')
      .replace(/$/, '</p>');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/teacher/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← 대시보드로 돌아가기
              </button>
              <h1 className="text-2xl font-bold text-gray-900">사고루틴 분석 및 평가하기</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* 안내 메시지 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-blue-800">
                오프라인 사고루틴 활동 분석
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>• 학생들이 종이나 다른 플랫폼에서 수행한 사고루틴 활동을 분석할 수 있습니다</p>
                <p>• 먼저 사고루틴 유형을 선택하고 템플릿을 다운로드하여 활용하세요</p>
                <p>• 학생 활동 결과물을 사진으로 촬영하거나 스캔하여 업로드하면 AI가 자동으로 분석합니다</p>
              </div>
            </div>
          </div>
        </div>

        {/* 1단계: 사고루틴 선택 및 템플릿 다운로드 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">1단계: 사고루틴 선택 및 템플릿 다운로드</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사고루틴 유형 선택
              </label>
              <select
                value={selectedRoutine}
                onChange={(e) => setSelectedRoutine(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">사고루틴을 선택하세요</option>
                {routineOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedRoutine && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-green-800">
                      {routineOptions.find(r => r.value === selectedRoutine)?.label} 템플릿
                    </h4>
                    <p className="text-sm text-green-600 mt-1">
                      한글화된 템플릿을 다운로드하여 학생 활동에 활용하세요
                    </p>
                  </div>
                  <button
                    onClick={() => downloadTemplate(selectedRoutine)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>템플릿 다운로드</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2단계: 이미지 업로드 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">2단계: 학생 활동 결과물 업로드</h2>
          
          <div className="space-y-4">
            {/* 업로드 옵션 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  파일에서 이미지 선택
                </button>
                <p className="text-sm text-gray-500 mt-2">PNG, JPG, JPEG 파일 지원</p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraCapture}
                  className="hidden"
                />
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  카메라로 촬영하기
                </button>
                <p className="text-sm text-gray-500 mt-2">직접 촬영하여 업로드</p>
              </div>
            </div>

            {/* 이미지 미리보기 */}
            {imagePreview && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">업로드된 이미지</h4>
                <div className="flex justify-center">
                  <div className="max-w-md">
                    <img
                      src={imagePreview}
                      alt="업로드된 이미지"
                      className="w-full h-auto rounded-lg shadow-sm border"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 촬영 가이드 */}
            {selectedRoutine && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">📸 촬영 가이드</h4>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p>• 템플릿 전체가 화면에 들어오도록 촬영하세요</p>
                  <p>• 조명이 밝고 그림자가 없는 곳에서 촬영하세요</p>
                  <p>• 글씨가 선명하게 보이도록 초점을 맞춰주세요</p>
                  <p>• 템플릿이 기울어지지 않도록 수평을 맞춰주세요</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3단계: AI 분석 실행 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">3단계: AI 분석 실행</h2>
          
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700">
                  {selectedRoutine && uploadedImage 
                    ? '분석을 시작할 준비가 완료되었습니다.' 
                    : '사고루틴을 선택하고 이미지를 업로드해주세요.'
                  }
                </p>
                {selectedRoutine && uploadedImage && (
                  <p className="text-sm text-gray-500 mt-1">
                    AI가 이미지의 내용을 읽고 사고루틴별 기준에 따라 분석합니다.
                  </p>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleReset}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  초기화
                </button>
                <button
                  onClick={handleAnalyzeImage}
                  disabled={!selectedRoutine || !uploadedImage || analyzing}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {analyzing ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>분석 중...</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span>AI 분석 시작</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4단계: 분석 결과 */}
        {analysisResult && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">4단계: 분석 결과</h2>
            
            <div className="space-y-6">
              {/* 신뢰도 표시 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">분석 신뢰도</span>
                  <span className="text-sm text-gray-600">{Math.round(analysisResult.confidence * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${analysisResult.confidence * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* 추출된 텍스트 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">📝 이미지에서 추출된 내용</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                    {analysisResult.extractedText}
                  </pre>
                </div>
              </div>

              {/* AI 분석 결과 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">🤖 AI 분석 및 피드백</h3>
                <div 
                  className="prose prose-sm max-w-none text-gray-800"
                  dangerouslySetInnerHTML={{ __html: formatMarkdownText(analysisResult.analysis) }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThinkingRoutineAnalysis; 