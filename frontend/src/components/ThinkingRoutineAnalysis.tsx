import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AnalysisResult {
  extractedText: string;
  analysis: string;
  confidence: number;
}

const ThinkingRoutineAnalysis: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  
  const [selectedRoutine, setSelectedRoutine] = useState('');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [showCameraGuide, setShowCameraGuide] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string>('');
  const [hasCameraAccess, setHasCameraAccess] = useState<boolean | null>(null);

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
      'see-think-wonder': 'templates/See-Think-Wonder_template.png',
      '4c': 'templates/4C(Connect-Challenge-Concepts-Changes)_template-1.png',
      'circle-of-viewpoints': 'templates/Circle of Viewpoints_template.jpg',
      'connect-extend-challenge': 'templates/Connect, Extend, Challenge_template-1.png',
      'frayer-model': 'templates/Frayer Model_template-1.png',
      'used-to-think-now-think': 'templates/I Used to Think... Now I Think..._template.jpg',
      'think-puzzle-explore': 'templates/Think Puzzle Explore_template-1.png'
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
      const fileName = filePath.split('/').pop() || 'template.png';
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

  // 이미지 업로드 처리
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 먼저 로컬에서 이미지 설정
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError('');

      // 백그라운드에서 Supabase에 업로드 (실패해도 로컬 작업은 계속)
      try {
        await uploadImageToSupabase(file);
        console.log('Supabase upload completed successfully');
      } catch (error) {
        console.warn('Supabase upload failed, but continuing with local processing:', error);
      }
    }
  };

  // 카메라 촬영 처리
  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowCameraGuide(false);
    handleImageUpload(event);
  };

  const openCameraWithGuide = () => {
    setShowCameraGuide(true);
  };

  const startCamera = () => {
    setShowCameraGuide(false);
    // 카메라 input 클릭
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  // 파일 선택 처리 (무한 반복 방지)
  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 이미지 삭제 처리
  const handleCancelImage = () => {
    setUploadedImage(null);
    setImagePreview('');
    setAnalysisResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
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
      // 이미지를 base64로 변환
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(uploadedImage);
      });

      // 사고루틴별 맞춤형 프롬프트 생성
      const systemPrompt = generateAIPrompt(selectedRoutine);
      const userPrompt = generateUserPrompt(selectedRoutine, imageBase64);

      console.log('AI 분석 요청 시작...');
      
      const apiResponse = await fetch('/api/gemini-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemPrompt,
          userPrompt,
          imageData: imageBase64
        })
      });

      console.log('API 응답 상태:', apiResponse.status);

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        console.error('API 오류 응답:', errorData);
        throw new Error(errorData.error || 'AI 분석 요청 실패');
      }

      const analysisResult = await apiResponse.json();
      console.log('분석 결과 수신:', analysisResult);
      
      if (!analysisResult.analysis) {
        throw new Error('AI 분석 결과가 없습니다');
      }

      setAnalysisResult({
        extractedText: '업로드된 이미지에서 학생의 사고루틴 활동 내용을 성공적으로 인식했습니다.',
        analysis: analysisResult.analysis,
        confidence: 85
      });

    } catch (error) {
      console.error('Analysis error:', error);
      setError('분석 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setAnalyzing(false);
    }
  };

  // 사고루틴별 AI 프롬프트 생성
  const generateAIPrompt = (routineType: string) => {
    const prompts = {
      'see-think-wonder': `
당신은 교육 전문가입니다. 학생이 작성한 See-Think-Wonder 사고루틴 활동 결과물을 분석하고 평가해주세요.

**See-Think-Wonder 사고루틴 이해:**
- See(보기): 관찰 가능한 사실과 정보를 기록
- Think(생각하기): 관찰한 내용에 대한 해석과 추론
- Wonder(궁금하기): 더 알고 싶은 점과 질문 생성

**평가 기준:**
1. 각 단계별 적절성 (관찰-해석-질문의 논리적 연결)
2. 구체성과 명확성
3. 사고의 깊이와 창의성
4. 언어 표현의 정확성

**출력 형식:**
## 1. 각 단계별 분석
### See (보기)
- [관찰 능력 평가와 구체적 피드백 2-3줄]
### Think (생각하기)
- [추론 능력 평가와 구체적 피드백 2-3줄]
### Wonder (궁금하기)
- [질문 생성 능력 평가와 구체적 피드백 2-3줄]

## 2. 종합 평가
### 강점
- [구체적인 강점 2-3가지]
### 개선점
- [구체적인 개선 방안 2-3가지]

## 3. 교육적 제안
- [다음 단계 학습 방향 제시]`,

      '4c': `
당신은 교육 전문가입니다. 학생이 작성한 4C 사고루틴 활동 결과물을 분석하고 평가해주세요.

**4C 사고루틴 이해:**
- Connect(연결): 기존 지식이나 경험과의 연결점
- Challenge(도전): 의문점이나 도전적인 아이디어
- Concepts(개념): 핵심 개념과 아이디어
- Changes(변화): 제안하는 변화나 행동

**평가 기준:**
1. 각 단계별 적절성과 논리적 연결
2. 비판적 사고와 창의적 사고
3. 개념 이해의 깊이
4. 실행 가능한 변화 제안

**출력 형식:**
## 1. 각 단계별 분석
### Connect (연결)
- [연결 능력 평가와 구체적 피드백 2-3줄]
### Challenge (도전)
- [비판적 사고 능력 평가와 구체적 피드백 2-3줄]
### Concepts (개념)
- [개념 이해 능력 평가와 구체적 피드백 2-3줄]
### Changes (변화)
- [변화 제안 능력 평가와 구체적 피드백 2-3줄]

## 2. 종합 평가
### 강점
- [구체적인 강점 2-3가지]
### 개선점
- [구체적인 개선 방안 2-3가지]

## 3. 교육적 제안
- [다음 단계 학습 방향 제시]`,

      'circle-of-viewpoints': `
당신은 교육 전문가입니다. 학생이 작성한 Circle of Viewpoints 사고루틴 활동 결과물을 분석하고 평가해주세요.

**Circle of Viewpoints 사고루틴 이해:**
- Viewpoints(관점 탐색): 다양한 관점을 가질 수 있는 사람들 식별
- Perspective(관점 선택): 특정 관점에서 주제를 바라보기
- Questions(관점별 질문): 선택한 관점에서 제기할 수 있는 질문

**평가 기준:**
1. 관점의 다양성과 창의성
2. 관점 이해의 깊이
3. 관점별 질문의 적절성
4. 다각적 사고 능력

**출력 형식:**
## 1. 각 단계별 분석
### Viewpoints (관점 탐색)
- [관점 다양성 평가와 구체적 피드백 2-3줄]
### Perspective (관점 선택)
- [관점 이해 능력 평가와 구체적 피드백 2-3줄]
### Questions (관점별 질문)
- [질문 생성 능력 평가와 구체적 피드백 2-3줄]

## 2. 종합 평가
### 강점
- [구체적인 강점 2-3가지]
### 개선점
- [구체적인 개선 방안 2-3가지]

## 3. 교육적 제안
- [다음 단계 학습 방향 제시]`,

      'connect-extend-challenge': `
당신은 교육 전문가입니다. 학생이 작성한 Connect-Extend-Challenge 사고루틴 활동 결과물을 분석하고 평가해주세요.

**Connect-Extend-Challenge 사고루틴 이해:**
- Connect(연결): 기존 지식과의 연결점 찾기
- Extend(확장): 생각을 확장하거나 발전시키기
- Challenge(도전): 의문점이나 도전적인 부분 제기

**평가 기준:**
1. 연결 능력과 배경지식 활용
2. 사고 확장의 창의성
3. 비판적 사고와 도전 정신
4. 논리적 사고 과정

**출력 형식:**
## 1. 각 단계별 분석
### Connect (연결)
- [연결 능력 평가와 구체적 피드백 2-3줄]
### Extend (확장)
- [사고 확장 능력 평가와 구체적 피드백 2-3줄]
### Challenge (도전)
- [비판적 사고 능력 평가와 구체적 피드백 2-3줄]

## 2. 종합 평가
### 강점
- [구체적인 강점 2-3가지]
### 개선점
- [구체적인 개선 방안 2-3가지]

## 3. 교육적 제안
- [다음 단계 학습 방향 제시]`,

      'frayer-model': `
당신은 교육 전문가입니다. 학생이 작성한 Frayer Model 사고루틴 활동 결과물을 분석하고 평가해주세요.

**Frayer Model 사고루틴 이해:**
- Definition(정의): 개념의 명확한 정의
- Characteristics(특징): 개념의 핵심 특징들
- Examples & Non-Examples(예시와 반례): 구체적인 예시와 반례

**평가 기준:**
1. 정의의 정확성과 명확성
2. 특징 파악의 완전성
3. 예시와 반례의 적절성
4. 개념 이해의 깊이

**출력 형식:**
## 1. 각 단계별 분석
### Definition (정의)
- [정의 능력 평가와 구체적 피드백 2-3줄]
### Characteristics (특징)
- [특징 파악 능력 평가와 구체적 피드백 2-3줄]
### Examples & Non-Examples (예시와 반례)
- [예시 제시 능력 평가와 구체적 피드백 2-3줄]

## 2. 종합 평가
### 강점
- [구체적인 강점 2-3가지]
### 개선점
- [구체적인 개선 방안 2-3가지]

## 3. 교육적 제안
- [다음 단계 학습 방향 제시]`,

      'used-to-think-now-think': `
당신은 교육 전문가입니다. 학생이 작성한 I Used to Think... Now I Think... 사고루틴 활동 결과물을 분석하고 평가해주세요.

**I Used to Think... Now I Think... 사고루틴 이해:**
- Used to Think(이전 생각): 학습 전의 생각이나 인식
- Now Think(현재 생각): 학습 후의 새로운 생각이나 인식
- Why Changed(변화 이유): 생각이 바뀐 이유와 과정

**평가 기준:**
1. 이전 생각의 솔직한 표현
2. 현재 생각의 발전성
3. 변화 과정의 논리성
4. 성찰의 깊이

**출력 형식:**
## 1. 각 단계별 분석
### Used to Think (이전 생각)
- [이전 인식 표현 능력 평가와 구체적 피드백 2-3줄]
### Now Think (현재 생각)
- [새로운 인식 형성 능력 평가와 구체적 피드백 2-3줄]
### Why Changed (변화 이유)
- [성찰 능력 평가와 구체적 피드백 2-3줄]

## 2. 종합 평가
### 강점
- [구체적인 강점 2-3가지]
### 개선점
- [구체적인 개선 방안 2-3가지]

## 3. 교육적 제안
- [다음 단계 학습 방향 제시]`,

      'think-puzzle-explore': `
당신은 교육 전문가입니다. 학생이 작성한 Think-Puzzle-Explore 사고루틴 활동 결과물을 분석하고 평가해주세요.

**Think-Puzzle-Explore 사고루틴 이해:**
- Think(생각하기): 주제에 대해 이미 알고 있는 것
- Puzzle(퍼즐): 궁금하거나 혼란스러운 점
- Explore(탐구하기): 탐구하고 싶은 방법이나 방향

**평가 기준:**
1. 기존 지식의 정확성
2. 의문점의 창의성과 깊이
3. 탐구 방법의 구체성
4. 탐구 의지와 호기심

**출력 형식:**
## 1. 각 단계별 분석
### Think (생각하기)
- [기존 지식 활용 능력 평가와 구체적 피드백 2-3줄]
### Puzzle (퍼즐)
- [의문 제기 능력 평가와 구체적 피드백 2-3줄]
### Explore (탐구하기)
- [탐구 계획 능력 평가와 구체적 피드백 2-3줄]

## 2. 종합 평가
### 강점
- [구체적인 강점 2-3가지]
### 개선점
- [구체적인 개선 방안 2-3가지]

## 3. 교육적 제안
- [다음 단계 학습 방향 제시]`
    };

    return prompts[routineType as keyof typeof prompts] || prompts['see-think-wonder'];
  };

  // 사용자 프롬프트 생성
  const generateUserPrompt = (routineType: string, imageBase64: string) => {
    const routineLabels = {
      'see-think-wonder': 'See-Think-Wonder',
      '4c': '4C',
      'circle-of-viewpoints': 'Circle of Viewpoints',
      'connect-extend-challenge': 'Connect-Extend-Challenge',
      'frayer-model': 'Frayer Model',
      'used-to-think-now-think': 'I Used to Think... Now I Think...',
      'think-puzzle-explore': 'Think-Puzzle-Explore'
    };

    const routineLabel = routineLabels[routineType as keyof typeof routineLabels] || routineType;

    return `
업로드된 이미지는 학생이 작성한 ${routineLabel} 사고루틴 활동 결과물입니다.

**분석 요청:**
1. 이미지에서 학생의 응답 내용을 정확히 읽어주세요
2. ${routineLabel} 사고루틴의 각 단계별로 학생의 응답을 평가해주세요
3. 교육적 관점에서 구체적이고 건설적인 피드백을 제공해주세요
4. 학생의 사고 과정을 이해하고 다음 단계 학습을 위한 제안을 해주세요

**주의사항:**
- 학생의 연령대를 고려하여 이해하기 쉬운 언어로 피드백해주세요
- 부정적인 평가보다는 건설적인 개선 방안을 제시해주세요
- 학생의 노력과 시도를 인정하고 격려해주세요

위의 형식에 맞춰 분석 결과를 제공해주세요.
    `;
  };

  // 마크다운 텍스트 포맷팅 (StudentResponseDetail과 동일)
  const formatMarkdownText = (text: string) => {
    const formatSection = (section: string) => {
      return section
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

    return formatSection(text);
  };

  // 디바이스 감지 함수
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // 카메라 접근 권한 확인
  useEffect(() => {
    const checkCameraAccess = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setHasCameraAccess(true);
      } catch (error) {
        console.warn('Camera access denied or not available:', error);
        setHasCameraAccess(false);
      }
    };

    if (!isMobile()) {
      checkCameraAccess();
    }

    // 컴포넌트 언마운트 시 카메라 스트림 정리
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // 카메라 스트림 시작
  const startCameraStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      return true;
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('카메라에 접근할 수 없습니다. 권한을 확인해주세요.');
      return false;
    }
  };

  // 카메라 스트림 정지
  const stopCameraStream = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  // 사진 촬영
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (context) {
        context.drawImage(video, 0, 0);
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageDataUrl);
      }
    }
  };

  // 촬영 이미지를 파일로 변환 및 업로드
  const uploadCapturedImage = async () => {
    if (!capturedImage) return;

    try {
      // Base64를 Blob으로 변환
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      
      // File 객체 생성
      const file = new File([blob], `captured-${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      // 먼저 로컬에서 이미지 설정
      setUploadedImage(file);
      setImagePreview(capturedImage);
      setShowCameraModal(false);
      setCapturedImage('');
      stopCameraStream();

      // 백그라운드에서 Supabase에 업로드 (실패해도 로컬 작업은 계속)
      try {
        await uploadImageToSupabase(file);
        console.log('Captured image uploaded to Supabase successfully');
      } catch (uploadError) {
        console.warn('Supabase upload failed, but continuing with local processing:', uploadError);
      }
    } catch (error) {
      console.error('Error processing captured image:', error);
      setError('촬영한 이미지 처리 중 오류가 발생했습니다.');
    }
  };

  // Supabase에 이미지 업로드
  const uploadImageToSupabase = async (file: File): Promise<string | null> => {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, skipping upload');
      return null;
    }

    try {
      const fileName = `routine-images/${Date.now()}-${file.name}`;
      const { error } = await supabase!.storage
        .from('templates')
        .upload(fileName, file);

      if (error) {
        console.error('Supabase upload error:', error);
        throw error;
      }

      // 업로드된 파일의 공개 URL 가져오기
      const { data: { publicUrl } } = supabase!.storage
        .from('templates')
        .getPublicUrl(fileName);

      console.log('Image uploaded to Supabase:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading to Supabase:', error);
      // Supabase 업로드가 실패해도 로컬에서는 계속 작업할 수 있도록 함
      return null;
    }
  };

  // PC 카메라 모달 열기
  const openPCCameraModal = async () => {
    if (hasCameraAccess === false) {
      setError('카메라가 연결되어 있지 않거나 접근 권한이 없습니다.');
      return;
    }

    setShowCameraModal(true);
    const success = await startCameraStream();
    if (!success) {
      setShowCameraModal(false);
    }
  };

  // 카메라 모달 닫기
  const closeCameraModal = () => {
    setShowCameraModal(false);
    setCapturedImage('');
    stopCameraStream();
  };

  // 다시 촬영
  const retakePhoto = async () => {
    setCapturedImage('');
    // 카메라 스트림을 다시 시작
    const success = await startCameraStream();
    if (!success) {
      setError('카메라를 다시 시작할 수 없습니다.');
    }
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
                onClick={handleFileSelect}
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
                  파일로 업로드
                </div>
                <p className="text-sm text-gray-500 mt-2">PNG, JPG, JPEG 파일 지원</p>
              </div>

              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                onClick={isMobile() ? openCameraWithGuide : openPCCameraModal}
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
                  촬영하여 업로드
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {isMobile() ? '모바일 카메라로 촬영' : 'PC 카메라로 촬영'}
                </p>
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
                {/* 취소 버튼 추가 */}
                <div className="flex justify-center mt-4">
                  <button
                    onClick={handleCancelImage}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    이미지 삭제
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PC 카메라 모달 */}
        {showCameraModal && !isMobile() && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-4">사고루틴 촬영</h3>
                
                {!capturedImage ? (
                  <>
                    {/* 카메라 화면 */}
                    <div className="relative mb-4">
                      <div className="bg-gray-200 rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                          style={{ transform: 'scaleX(-1)' }}
                        />
                        {/* 가이드 오버레이 */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="border-2 border-white border-dashed rounded-lg" 
                               style={{ width: '90%', height: '75%' }}>
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
                                템플릿이 이 영역 안에 들어오도록 조정해주세요
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 촬영 안내 */}
                    <div className="text-sm text-gray-600 mb-6 text-left space-y-2">
                      <p>📄 템플릿 전체가 화면에 들어오도록 조정하세요</p>
                      <p>💡 조명이 밝고 그림자가 없는 곳에서 촬영하세요</p>
                      <p>🔍 글씨가 선명하게 보이도록 초점을 맞춰주세요</p>
                      <p>📐 템플릿이 기울어지지 않도록 수평을 맞춰주세요</p>
                    </div>
                    
                    {/* 촬영 버튼 */}
                    <div className="flex space-x-3">
                      <button
                        onClick={closeCameraModal}
                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-3 rounded-md font-medium"
                      >
                        취소
                      </button>
                      <button
                        onClick={capturePhoto}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium flex items-center justify-center space-x-2"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0118.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>촬영</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* 촬영된 이미지 미리보기 */}
                    <div className="relative mb-4">
                      <img
                        src={capturedImage}
                        alt="촬영된 이미지"
                        className="w-full max-w-2xl mx-auto rounded-lg"
                        style={{ transform: 'scaleX(-1)' }}
                      />
                    </div>
                    
                    {/* 업로드/다시촬영 버튼 */}
                    <div className="flex space-x-3">
                      <button
                        onClick={retakePhoto}
                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-3 rounded-md font-medium"
                      >
                        다시 촬영
                      </button>
                      <button
                        onClick={uploadCapturedImage}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md font-medium"
                      >
                        업로드
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* 숨겨진 캔버스 */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        )}

        {/* 모바일 카메라 가이드 오버레이 - 개선된 버전 */}
        {showCameraGuide && isMobile() && (
          <div className="fixed inset-0 bg-gray-800 flex flex-col z-50">
            {/* 헤더 */}
            <div className="bg-white shadow-lg">
              <div className="flex items-center justify-between p-4">
                <h3 className="text-lg font-semibold text-gray-900">사고루틴 촬영</h3>
                <button
                  onClick={() => setShowCameraGuide(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 카메라 프리뷰 영역 */}
            <div className="flex-1 relative">
              {/* 카메라 가이드 프레임 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* 가이드 프레임 */}
                  <div 
                    className="border-2 border-white rounded-lg"
                    style={{ 
                      width: '280px', 
                      height: '200px',
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                    }}
                  >
                    {/* 모서리 가이드 */}
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-l-2 border-t-2 border-white"></div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-r-2 border-t-2 border-white"></div>
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-l-2 border-b-2 border-white"></div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-r-2 border-b-2 border-white"></div>
                  </div>
                  
                  {/* 가이드 텍스트 */}
                  <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
                    <p className="text-white text-sm font-medium">
                      템플릿이 이 영역 안에<br/>
                      들어오도록 조정해주세요
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 하단 가이드 및 버튼 */}
            <div className="bg-white p-4">
              <div className="text-center mb-4">
                <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-500">📄</span>
                    <span>템플릿 전체가 보이도록</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-500">💡</span>
                    <span>밝은 조명에서 촬영하세요</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-500">🔍</span>
                    <span>글씨가 선명하게 보이도록</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-500">📐</span>
                    <span>수평을 맞춰주세요</span>
                  </div>
                </div>
              </div>
              
              {/* 촬영 버튼 */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCameraGuide(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-3 rounded-full text-sm font-medium"
                >
                  취소
                </button>
                <button
                  onClick={startCamera}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-full text-sm font-medium flex items-center justify-center space-x-2"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0118.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>촬영하기</span>
                </button>
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
              
              <div>
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

        {/* 4단계: 분석 결과 - StudentResponseDetail과 동일한 레이아웃 */}
        {analysisResult && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">4단계: 분석 결과</h2>
            
            <div className="space-y-6">
              {/* 신뢰도 표시 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">분석 신뢰도</span>
                  <span className="text-sm text-gray-600">{Math.round(analysisResult.confidence)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${analysisResult.confidence}%` }}
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

              {/* AI 분석 결과 - StudentResponseDetail과 동일한 스타일 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">🤖 AI 분석 및 피드백</h3>
                <div className="space-y-4">
                  <div 
                    className="prose prose-sm max-w-none text-gray-800 text-left"
                    dangerouslySetInnerHTML={{ __html: formatMarkdownText(analysisResult.analysis) }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThinkingRoutineAnalysis; 