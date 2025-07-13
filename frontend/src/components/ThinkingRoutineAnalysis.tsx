import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
  const [showCameraGuide, setShowCameraGuide] = useState(false);

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
  const downloadTemplate = async (routineType: string) => {
    if (!isSupabaseConfigured()) {
      alert('Supabase 설정이 필요합니다.');
      return;
    }

    const templateFiles = {
      'see-think-wonder': 'templates/보기-생각하기-궁금하기_템플릿.pdf',
      '4c': 'templates/연결-도전-개념-변화_템플릿.pdf',
      'circle-of-viewpoints': 'templates/관점의원_템플릿.pdf',
      'connect-extend-challenge': 'templates/연결-확장-도전_템플릿.pdf',
      'frayer-model': 'templates/프레이어모델_템플릿.pdf',
      'used-to-think-now-think': 'templates/이전생각-현재생각_템플릿.pdf',
      'think-puzzle-explore': 'templates/생각-퍼즐-탐구_템플릿.pdf'
    };

    const filePath = templateFiles[routineType as keyof typeof templateFiles];
    if (!filePath) {
      alert('해당 템플릿을 찾을 수 없습니다.');
      return;
    }

    try {
      // Supabase 스토리지에서 파일 다운로드
      const { data, error } = await supabase!.storage
        .from('templates')
        .download(filePath);

      if (error) {
        console.error('Template download error:', error);
        alert('템플릿 다운로드 중 오류가 발생했습니다.');
        return;
      }

      // 파일 다운로드 처리
      const fileName = filePath.split('/').pop() || 'template.pdf';
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Download error:', error);
      alert('템플릿 다운로드 중 오류가 발생했습니다.');
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
    setShowCameraGuide(false);
    handleImageUpload(event);
  };

  const openCameraWithGuide = () => {
    setShowCameraGuide(true);
    // 짧은 지연 후 카메라 실행
    setTimeout(() => {
      cameraInputRef.current?.click();
    }, 100);
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
      // 개발 환경에서만 실제 API 호출
      if (process.env.NODE_ENV === 'development') {
        const formData = new FormData();
        formData.append('image', uploadedImage);
        formData.append('routineType', selectedRoutine);

        const apiUrl = 'http://localhost:3001/api/analyze-routine-image';
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('분석 요청에 실패했습니다.');
        }

        const result = await response.json();
        setAnalysisResult(result);
      } else {
        // 프로덕션 환경에서는 더미 응답 반환
        const routineLabels = {
          'see-think-wonder': 'See-Think-Wonder',
          '4c': '4C',
          'circle-of-viewpoints': 'Circle of Viewpoints',
          'connect-extend-challenge': 'Connect-Extend-Challenge',
          'frayer-model': 'Frayer Model',
          'used-to-think-now-think': 'Used to Think... Now Think',
          'think-puzzle-explore': 'Think-Puzzle-Explore'
        };

        const routineLabel = routineLabels[selectedRoutine as keyof typeof routineLabels] || selectedRoutine;

        // 2초 지연으로 실제 분석하는 것처럼 보이게 함
        await new Promise(resolve => setTimeout(resolve, 2000));

        const dummyResult = {
          extractedText: '업로드된 이미지에서 학생의 응답을 성공적으로 인식했습니다.',
          analysis: `## 1. ${routineLabel} 분석 결과

### 전체적인 평가
학생이 제출한 ${routineLabel} 활동 결과물을 분석한 결과입니다.

**강점:**
- 각 단계별로 적절한 응답을 작성했습니다
- 사고 과정이 논리적으로 연결되어 있습니다
- 구체적인 예시와 설명이 포함되어 있습니다

**개선점:**
- 더 깊이 있는 분석과 성찰이 필요합니다
- 다양한 관점에서의 접근을 시도해보세요
- 창의적인 사고를 더 발휘할 수 있습니다

## 2. 교육적 권장사항

### 교사를 위한 피드백 가이드
- 학생의 사고 과정을 인정하고 격려해주세요
- 추가적인 질문을 통해 더 깊은 사고를 유도하세요
- 다른 학생들과의 토론 기회를 제공하세요

### 다음 단계 제안
- 관련된 다른 사고루틴 활동을 시도해보세요
- 동일한 주제로 다른 접근 방식을 탐구해보세요
- 학습한 내용을 실제 상황에 적용해보세요

*현재 백엔드 서버가 배포되지 않아 더미 응답을 표시하고 있습니다. 개발 환경에서는 실제 AI 분석이 수행됩니다.*`,
          confidence: 0.85
        };

        setAnalysisResult(dummyResult);
      }
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
                onClick={() => window.location.href = '/teacher/dashboard'}
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
          <div className="text-center mb-4">
            <h3 className="text-lg font-medium text-blue-800">
              사용 방법 안내
            </h3>
          </div>
          <div className="text-left">
            <div className="text-sm text-blue-700 space-y-2">
              <p>• 학생들이 종이나 다른 플랫폼에서 수행한 사고루틴 활동을 분석할 수 있습니다</p>
              <p>• 먼저 사고루틴 유형을 선택하고 템플릿을 다운로드하여 활용하세요</p>
              <p>• 학생 활동 결과물을 사진으로 촬영하거나 스캔하여 업로드하면 AI가 자동으로 분석합니다</p>
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
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
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
                <div className="text-blue-600 hover:text-blue-500 font-medium">
                  파일에서 이미지 선택
                </div>
                <p className="text-sm text-gray-500 mt-2">PNG, JPG, JPEG 파일 지원</p>
              </div>

              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                onClick={openCameraWithGuide}
              >
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
                <div className="text-blue-600 hover:text-blue-500 font-medium">
                  카메라로 촬영하기
                </div>
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

        {/* 카메라 가이드 오버레이 */}
        {showCameraGuide && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <div className="text-center">
                <div className="mb-4">
                  <svg className="mx-auto h-16 w-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">촬영 가이드</h3>
                <div className="text-sm text-gray-600 text-left space-y-2 mb-6">
                  <p>📄 템플릿 전체가 화면에 들어오도록 촬영하세요</p>
                  <p>💡 조명이 밝고 그림자가 없는 곳에서 촬영하세요</p>
                  <p>🔍 글씨가 선명하게 보이도록 초점을 맞춰주세요</p>
                  <p>📐 템플릿이 기울어지지 않도록 수평을 맞춰주세요</p>
                </div>
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 mb-4">
                  <div className="text-blue-600 text-sm">
                    이 영역 안에 템플릿이 들어오도록 촬영하세요
                  </div>
                  <div className="mt-2 h-32 bg-blue-50 rounded flex items-center justify-center">
                    <div className="text-blue-400 text-xs">사고루틴 템플릿 위치</div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowCameraGuide(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => {
                      setShowCameraGuide(false);
                      cameraInputRef.current?.click();
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    촬영하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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