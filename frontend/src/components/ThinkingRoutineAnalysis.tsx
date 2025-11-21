import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTINE_CONFIGS } from '../constants/routineConfigs';
import { useImageUpload } from '../hooks/useImageUpload';
import { useCameraCapture } from '../hooks/useCameraCapture';
import { useAIAnalysis } from '../hooks/useAIAnalysis';
import { useAnalysisStorage } from '../hooks/useAnalysisStorage';
import { ImageUploadSection } from './thinking-routine-analysis/ImageUploadSection';
import { CameraModal } from './thinking-routine-analysis/CameraModal';
import { AnalysisResultDisplay } from './thinking-routine-analysis/AnalysisResultDisplay';
import { StudentInfoForm } from './thinking-routine-analysis/StudentInfoForm';

const ThinkingRoutineAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRoutine, setSelectedRoutine] = useState<string>('');
  const [showTeacherFeedback, setShowTeacherFeedback] = useState(false);

  // Custom Hooks
  const {
    uploadedImage,
    imagePreview,
    error: uploadError,
    setError: setUploadError,
    fileInputRef,
    handleImageUpload,
    handleCancelImage,
    triggerFileInput,
    setUploadedImage,
    setImagePreview
  } = useImageUpload();

  const handleImageCaptured = (file: File) => {
    setUploadedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    setUploadError('');
  };

  const {
    showCameraModal,
    videoRef,
    canvasRef,
    capturedImage,
    startCamera,
    stopCamera,
    captureImage,
    retakeImage,
    confirmCapture,
    setShowCameraModal
  } = useCameraCapture(handleImageCaptured);

  const {
    analyzing,
    analysisResult,
    error: analysisError,
    currentAnalysisStep,
    parsedAnalysis,
    handleAnalyzeImage,
    resetAnalysis,
    setCurrentAnalysisStep,
    setError: setAnalysisError
  } = useAIAnalysis();

  const {
    saving,
    studentInfo,
    teamName,
    isTeamActivity,
    stepFeedbacks,
    stepScores,
    setTeamName,
    setIsTeamActivity,
    setStepFeedbacks,
    setStepScores,
    handleStudentInfoChange,
    handleSaveResult
  } = useAnalysisStorage();

  // Handlers
  const handleRoutineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRoutine(e.target.value);
    resetAnalysis();
  };

  const handleAnalyzeClick = () => {
    if (uploadedImage && selectedRoutine) {
      handleAnalyzeImage(uploadedImage, selectedRoutine);
    }
  };

  const handleNextStep = () => {
    setCurrentAnalysisStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setCurrentAnalysisStep(prev => prev - 1);
  };

  const handleFeedbackChange = (step: string, feedback: string) => {
    setStepFeedbacks(prev => ({ ...prev, [step]: feedback }));
  };

  const handleScoreChange = (step: string, score: number) => {
    setStepScores(prev => ({ ...prev, [step]: score }));
  };

  const onSave = () => {
    handleSaveResult(selectedRoutine, uploadedImage, analysisResult);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">사고루틴 분석</h2>
        <button
          onClick={() => navigate('/teacher/portfolio')}
          className="text-gray-600 hover:text-gray-900 flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          포트폴리오로 돌아가기
        </button>
      </div>

      {/* 설정 섹션 */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">사고루틴 선택</label>
            <select
              value={selectedRoutine}
              onChange={handleRoutineChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">선택해주세요</option>
              {Object.entries(ROUTINE_CONFIGS).map(([key, config]) => (
                <option key={key} value={key}>{config.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showTeacherFeedback}
                onChange={(e) => setShowTeacherFeedback(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 h-5 w-5"
              />
              <span className="text-gray-700 font-medium">교사 피드백 및 평가 모드 활성화</span>
            </label>
          </div>
        </div>
      </div>

      {/* 학생 정보 입력 폼 */}
      <StudentInfoForm
        studentInfo={studentInfo}
        isTeamActivity={isTeamActivity}
        teamName={teamName}
        onStudentInfoChange={handleStudentInfoChange}
        onTeamActivityChange={setIsTeamActivity}
        onTeamNameChange={setTeamName}
      />

      {/* 이미지 업로드 섹션 */}
      <ImageUploadSection
        uploadedImage={uploadedImage}
        imagePreview={imagePreview}
        fileInputRef={fileInputRef}
        onImageUpload={handleImageUpload}
        onCancelImage={handleCancelImage}
        onTriggerFileInput={triggerFileInput}
        onCameraClick={startCamera}
      />

      {/* 에러 메시지 */}
      {(uploadError || analysisError) && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{uploadError || analysisError}</p>
            </div>
          </div>
        </div>
      )}

      {/* 분석 버튼 */}
      {uploadedImage && !parsedAnalysis && (
        <div className="flex justify-center mb-12">
          <button
            onClick={handleAnalyzeClick}
            disabled={analyzing || !selectedRoutine}
            className={`px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl transform transition hover:-translate-y-1 flex items-center ${(analyzing || !selectedRoutine) ? 'opacity-75 cursor-not-allowed' : ''
              }`}
          >
            {analyzing ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                AI가 분석중입니다...
              </>
            ) : (
              <>
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                AI 분석 시작하기
              </>
            )}
          </button>
        </div>
      )}

      {/* 분석 결과 표시 */}
      {parsedAnalysis && (
        <AnalysisResultDisplay
          selectedRoutine={selectedRoutine}
          parsedAnalysis={parsedAnalysis}
          currentAnalysisStep={currentAnalysisStep}
          onNextStep={handleNextStep}
          onPrevStep={handlePrevStep}
          showTeacherFeedback={showTeacherFeedback}
          stepFeedbacks={stepFeedbacks}
          stepScores={stepScores}
          onFeedbackChange={handleFeedbackChange}
          onScoreChange={handleScoreChange}
          onSave={onSave}
          saving={saving}
        />
      )}

      {/* 카메라 모달 */}
      <CameraModal
        isOpen={showCameraModal}
        videoRef={videoRef}
        canvasRef={canvasRef}
        capturedImage={capturedImage}
        onClose={stopCamera}
        onCapture={captureImage}
        onRetake={retakeImage}
        onConfirm={confirmCapture}
      />
    </div>
  );
};

export default ThinkingRoutineAnalysis;