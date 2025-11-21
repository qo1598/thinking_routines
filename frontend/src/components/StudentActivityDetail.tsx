import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { routineTypeLabels, routineStepLabels, mapResponseToRoutineSteps, generateStepInfoMap } from '../lib/thinkingRoutineUtils';
import { formatMarkdownText } from '../lib/analysisParser';
import { formatDate, getBackToPortfolioUrl } from '../lib/activityDetailUtils';
import { useActivityDetail } from '../hooks/useActivityDetail';
import { useAIAnalysisParsing } from '../hooks/useAIAnalysisParsing';
import TeacherFeedbackReadOnly from './TeacherFeedbackReadOnly';
import TeacherMaterialsSection from './TeacherMaterialsSection';

interface ActivityDetailProps { }

const StudentActivityDetail: React.FC<ActivityDetailProps> = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const [imageModalOpen, setImageModalOpen] = useState(false);

  // 커스텀 훅 사용
  const { activity, loading, error } = useActivityDetail(activityId);
  const parsedAiAnalysis = useAIAnalysisParsing(activity?.ai_analysis, activity?.routine_type || 'see-think-wonder');



  // 뒤로 가기
  const handleBack = () => {
    navigate(getBackToPortfolioUrl());
  };



  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">활동 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 오류 상태
  if (error || !activity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">오류 발생</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 파싱된 AI 분석 데이터는 이제 state에서 가져옴
  const aiAnalysis = parsedAiAnalysis;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                목록으로 돌아가기
              </button>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              사고루틴 활동 상세
            </h1>
            <div></div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 활동 기본 정보 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{activity.room_title}</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${activity.activity_type === 'online'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-purple-100 text-purple-800'
                }`}>
                {activity.activity_type === 'online' ? '온라인 활동' : '오프라인 활동'}
              </span>
            </div>

            {/* 학생 정보 - 수정된 레이아웃 */}
            <div className="p-4 bg-gray-50 rounded-lg flex justify-between items-start">
              <div>
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-700">학생명:</span>
                  <span className="ml-2 text-gray-900 font-semibold">
                    {(() => {
                      const name = activity.student_name || '학생';
                      const grade = activity.student_grade || '';
                      const studentClass = activity.student_class || '';
                      const number = activity.student_number || '';

                      const parts = [];
                      if (grade) {
                        if (grade.includes('학년')) {
                          parts.push(grade);
                        } else {
                          parts.push(`${grade}학년`);
                        }
                      }
                      if (studentClass) {
                        if (studentClass.includes('반')) {
                          parts.push(studentClass);
                        } else {
                          parts.push(`${studentClass}반`);
                        }
                      }
                      if (number) {
                        if (number.toString().includes('번')) {
                          parts.push(number.toString());
                        } else {
                          parts.push(`${number}번`);
                        }
                      }

                      if (parts.length > 0) {
                        return `${name}(${parts.join(' ')})`;
                      }
                      return name;
                    })()}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">제출일:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(activity.submitted_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {activity.team_name && (
                  <div className="mt-1">
                    <span className="text-sm font-medium text-gray-700">모둠:</span>
                    <span className="ml-2 text-gray-900">{activity.team_name}</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-gray-700">사고루틴:</span>
                <div className="text-blue-600 font-medium">
                  {routineTypeLabels[activity.routine_type] || activity.routine_type || 'See-Think-Wonder'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 온라인 활동 - 교사 제공 자료 */}
        {activity.activity_type === 'online' && activity.room_id && (
          <TeacherMaterialsSection
            roomId={activity.room_id}
            roomTitle={activity.room_title}
            roomDescription={activity.room_description}
          />
        )}

        {/* 오프라인 활동 - 이미지 */}
        {activity.activity_type === 'offline' && (activity.image_url || activity.image_data) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📷 업로드된 이미지</h3>
              <div className="flex justify-center">
                <img
                  src={activity.image_url || activity.image_data}
                  alt="학생 활동 이미지"
                  className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setImageModalOpen(true)}
                />
              </div>
              <p className="text-sm text-gray-500 text-center mt-2">
                이미지를 클릭하면 확대해서 볼 수 있습니다
              </p>
            </div>
          </div>
        )}

        {/* 학생 응답 - 카드형 레이아웃 (온라인 + 오프라인 통합) */}
        {activity.response_data && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">학생 응답</h2>

              {/* 학생 응답 - 카드형 레이아웃 */}
              <div className="space-y-3">
                {(() => {
                  const routineType = activity.routine_type || 'see-think-wonder';
                  const mappedResponses = mapResponseToRoutineSteps(activity.response_data, routineType);
                  const stepLabels = routineStepLabels[routineType] || routineStepLabels['see-think-wonder'];

                  // 단계별 색상과 아이콘 정의 (더 많은 단계 지원)
                  const stepColors = {
                    'see': 'bg-blue-500',
                    'think': 'bg-green-500',
                    'wonder': 'bg-purple-500',
                    'connect': 'bg-indigo-500',
                    'challenge': 'bg-red-500',
                    'concepts': 'bg-yellow-500',
                    'changes': 'bg-pink-500',
                    'extend': 'bg-teal-500',
                    'definition': 'bg-cyan-500',
                    'characteristics': 'bg-orange-500',
                    'examples': 'bg-lime-500',
                    'non_examples': 'bg-rose-500',
                    'used_to_think': 'bg-violet-500',
                    'now_think': 'bg-emerald-500',
                    'puzzle': 'bg-amber-500',
                    'explore': 'bg-sky-500',
                    'viewpoint_select': 'bg-fuchsia-500',
                    'viewpoint_thinking': 'bg-slate-500',
                    'viewpoint_concerns': 'bg-neutral-500'
                  };

                  const stepIcons = {
                    'see': 'S',
                    'think': 'T',
                    'wonder': 'W',
                    'connect': 'C',
                    'challenge': 'Ch',
                    'concepts': 'Co',
                    'changes': 'Ch',
                    'extend': 'E',
                    'definition': 'D',
                    'characteristics': 'Ch',
                    'examples': 'Ex',
                    'non_examples': 'N',
                    'used_to_think': 'U',
                    'now_think': 'N',
                    'puzzle': 'P',
                    'explore': 'E',
                    'viewpoint_select': 'V1',
                    'viewpoint_thinking': 'V2',
                    'viewpoint_concerns': 'V3'
                  };

                  return Object.entries(mappedResponses)
                    .filter(([key, value]) => value && value.trim().length > 0)
                    .map(([key, value]) => {
                      const stepLabel = (stepLabels as any)[key] || key.charAt(0).toUpperCase() + key.slice(1);

                      return (
                        <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className={`${(stepColors as any)[key] || 'bg-gray-500'} px-4 py-2 flex items-center`}>
                            <div className="w-8 h-6 bg-white bg-opacity-20 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                              {(stepIcons as any)[key] || key.charAt(0).toUpperCase()}
                            </div>
                            <h3 className="font-medium text-white">{stepLabel}</h3>
                          </div>
                          <div className="p-4 bg-white">
                            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{value as string}</p>
                          </div>
                        </div>
                      );
                    });
                })()}
              </div>
            </div>
          </div>
        )}

        {/* 교사 피드백 및 평가 (조회 전용) */}
        <TeacherFeedbackReadOnly
          responseId={activity.id}
          routineType={activity.routine_type || 'see-think-wonder'}
          aiAnalysis={activity.ai_analysis}
        />

        {/* 온라인 활동: AI 분석 결과 표시 (제거됨) */}
        {false && activity?.activity_type === 'online' && activity?.ai_analysis && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6">
              {aiAnalysis ? (
                <div className="space-y-6">
                  {/* 단계별 분석 표시 (ThinkingRoutineAnalysis 스타일) */}
                  {aiAnalysis.individualSteps && (
                    <div>
                      <h4 className="text-base font-semibold text-gray-800 mb-4">각 단계별 분석</h4>
                      <div className="space-y-4">
                        {Object.entries(aiAnalysis.individualSteps).map(([stepKey, stepContent], index) => {
                          // 단계별 정보 매핑
                          const stepInfoMap = generateStepInfoMap(activity?.routine_type || 'see-think-wonder');

                          const stepInfo = stepInfoMap[stepKey];

                          // 중요: stepContent 내용 디버깅
                          console.log(`🎯 화면 표시 중 - ${stepKey} 단계:`, {
                            stepInfo,
                            stepContent,
                            stepContentType: typeof stepContent,
                            stepContentLength: stepContent ? (stepContent as string).length : 0,
                            firstChars: stepContent ? (stepContent as string).substring(0, 100) : 'NULL'
                          });

                          if (!stepInfo || !stepContent) {
                            console.log(`❌ ${stepKey} 단계 표시 실패:`, { stepInfo: !!stepInfo, stepContent: !!stepContent });
                            return null;
                          }

                          const gradientColors: { [key: string]: string } = {
                            'bg-blue-500': 'from-blue-50 to-white border-blue-200',
                            'bg-green-500': 'from-green-50 to-white border-green-200',
                            'bg-purple-500': 'from-purple-50 to-white border-purple-200',
                            'bg-red-500': 'from-red-50 to-white border-red-200'
                          };

                          return (
                            <div
                              key={stepKey}
                              className={`bg-gradient-to-br ${gradientColors[stepInfo.color] || 'from-gray-50 to-white border-gray-200'} border rounded-xl p-6`}
                            >
                              <h5 className={`text-lg font-bold mb-4 flex items-center ${stepInfo.color === 'bg-blue-500' ? 'text-blue-800' :
                                stepInfo.color === 'bg-green-500' ? 'text-green-800' :
                                  stepInfo.color === 'bg-purple-500' ? 'text-purple-800' :
                                    stepInfo.color === 'bg-red-500' ? 'text-red-800' : 'text-gray-800'
                                }`}>
                                <span className={`w-8 h-8 ${stepInfo.color} text-white rounded-full flex items-center justify-center text-sm font-bold mr-3`}>
                                  {index + 1}
                                </span>
                                {stepInfo.title} ({stepInfo.subtitle})
                              </h5>

                              {/* AI 분석 결과 */}
                              <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                                <h6 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                  <svg className="w-4 h-4 mr-1 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                  </svg>
                                  AI 분석 결과
                                </h6>
                                <div
                                  className="prose prose-sm max-w-none text-gray-700 leading-relaxed text-left"
                                  dangerouslySetInnerHTML={{
                                    __html: (() => {
                                      const formattedText = formatMarkdownText(stepContent as string);
                                      console.log(`🎨 ${stepKey} 포맷팅 결과:`, {
                                        originalText: stepContent,
                                        formattedText,
                                        originalLength: stepContent ? (stepContent as string).length : 0,
                                        formattedLength: formattedText ? formattedText.length : 0
                                      });
                                      return formattedText;
                                    })()
                                  }}
                                />
                              </div>

                              {/* 교사 피드백 및 점수 */}
                              {(() => {
                                // 전체 분석 데이터에서 teacherFeedback 찾기
                                const fullAnalysis = typeof activity?.ai_analysis === 'string' ?
                                  JSON.parse(activity.ai_analysis) : activity?.ai_analysis;
                                const teacherFeedbackSteps = fullAnalysis?.teacherFeedback?.individualSteps;
                                const stepFeedback = teacherFeedbackSteps?.[stepKey];

                                // 디버깅용 로그
                                console.log('🔍 Online Step:', stepKey);
                                console.log('📊 Online Full Analysis:', fullAnalysis);
                                console.log('👨‍🏫 Online Teacher Feedback Steps:', teacherFeedbackSteps);
                                console.log('📝 Online Step Feedback:', stepFeedback);

                                if (stepFeedback) {
                                  return (
                                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                                      <h6 className="text-sm font-medium text-gray-700 mb-3 flex items-center justify-between">
                                        <span className="flex items-center">
                                          <svg className="w-4 h-4 mr-1 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                          </svg>
                                          교사 피드백
                                        </span>
                                        {stepFeedback.score && (
                                          <span className="text-sm font-medium text-green-600">
                                            {stepFeedback.score}점 / 100점
                                          </span>
                                        )}
                                      </h6>
                                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                                        <p className="text-gray-700 text-sm whitespace-pre-wrap">
                                          {stepFeedback.feedback || '교사 피드백이 아직 작성되지 않았습니다.'}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}


                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div
                    className="prose prose-sm max-w-none text-gray-700 leading-relaxed text-left"
                    dangerouslySetInnerHTML={{ __html: formatMarkdownText(activity?.ai_analysis || '') }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* 첫 번째 오프라인 섹션 제거됨 */}
        {false && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6">

              {aiAnalysis && aiAnalysis.individualSteps && Object.keys(aiAnalysis.individualSteps).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(aiAnalysis.individualSteps).map(([stepKey, stepContent], index) => {
                    // 표준 단계별 정보 매핑 사용
                    const stepInfoMap = generateStepInfoMap(activity?.routine_type || 'see-think-wonder');

                    const stepInfo = stepInfoMap[stepKey];
                    if (!stepInfo) return null;

                    const gradientColors: { [key: string]: string } = {
                      'bg-blue-500': 'from-blue-50 to-white border-blue-200',
                      'bg-green-500': 'from-green-50 to-white border-green-200',
                      'bg-purple-500': 'from-purple-50 to-white border-purple-200',
                      'bg-red-500': 'from-red-50 to-white border-red-200'
                    };

                    // 저장된 교사 피드백 찾기
                    const savedFeedback = aiAnalysis.teacherFeedback && aiAnalysis.teacherFeedback[stepKey];
                    const feedbackData = typeof savedFeedback === 'object' ? savedFeedback as any : { feedback: savedFeedback || '', score: null };

                    console.log(`🔍 ${stepKey} 단계 피드백:`, savedFeedback);

                    return (
                      <div
                        key={stepKey}
                        className={`bg-gradient-to-br ${gradientColors[stepInfo.color] || 'from-gray-50 to-white border-gray-200'} border rounded-xl p-6`}
                      >
                        <h3 className={`text-lg font-bold mb-4 flex items-center ${stepInfo.color === 'bg-blue-500' ? 'text-blue-800' :
                          stepInfo.color === 'bg-green-500' ? 'text-green-800' :
                            stepInfo.color === 'bg-purple-500' ? 'text-purple-800' :
                              stepInfo.color === 'bg-red-500' ? 'text-red-800' : 'text-gray-800'
                          }`}>
                          <span className={`w-8 h-8 ${stepInfo.color} text-white rounded-full flex items-center justify-center text-sm font-bold mr-3`}>
                            {index + 1}
                          </span>
                          {stepInfo.title} ({stepInfo.subtitle})
                        </h3>

                        {/* 학생 응답 */}
                        {(() => {
                          console.log('🎯 학생 응답 데이터 확인:', {
                            stepKey,
                            responseData: activity?.response_data,
                            routineType: activity?.routine_type
                          });

                          const mappedResponses = mapResponseToRoutineSteps(activity?.response_data, activity?.routine_type || 'see-think-wonder');
                          console.log('🔄 매핑된 응답:', mappedResponses);

                          let studentResponse = mappedResponses[stepKey];

                          // response_data에 응답이 없는 경우, AI 분석에서 학생 응답 추출 시도
                          if (!studentResponse && aiAnalysis?.stepByStep) {
                            console.log('🔄 AI 분석에서 학생 응답 추출 시도');

                            // AI 분석 텍스트에서 해당 단계의 학생 응답 추출
                            const stepLabel = stepInfo.title;
                            const patterns = [
                              new RegExp(`\\*\\s*\\*\\*${stepLabel}.*?\\*\\*:?\\s*"([^"]+)"`, 'si'),
                              new RegExp(`###\\s*${stepLabel}.*?\\n.*?학생.*?응답.*?[:：]\\s*([^\\n]+)`, 'si'),
                              new RegExp(`${stepLabel}.*?[:：]\\s*"([^"]+)"`, 'si'),
                              new RegExp(`\\*\\s*\\*\\*${stepLabel}\\s*\\([^)]*\\)\\*\\*:?\\s*"([^"]+)"`, 'si')
                            ];

                            for (const pattern of patterns) {
                              const match = aiAnalysis.stepByStep.match(pattern);
                              if (match && match[1]) {
                                studentResponse = match[1].trim();
                                console.log(`✅ AI 분석에서 ${stepKey} 학생 응답 추출:`, studentResponse);
                                break;
                              }
                            }
                          }

                          console.log(`🎓 최종 ${stepKey} 단계 학생 응답:`, studentResponse);

                          return studentResponse ? (
                            <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
                              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <svg className="w-4 h-4 mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                학생 응답
                              </h4>
                              <p className="text-gray-700 leading-relaxed text-left">
                                {studentResponse}
                              </p>
                            </div>
                          ) : null;
                        })()}

                        {/* AI 분석 내용 */}
                        <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-1 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            AI 분석 결과
                          </h4>
                          <div
                            className="prose prose-sm max-w-none text-gray-700 leading-relaxed text-left"
                            dangerouslySetInnerHTML={{ __html: formatMarkdownText(stepContent as string) }}
                          />
                        </div>

                        {/* 교사 피드백 표시 (읽기 전용) */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">교사 피드백</label>
                          <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 min-h-[80px]">
                            {feedbackData.feedback || '피드백이 입력되지 않았습니다.'}
                          </div>
                        </div>

                        {/* 점수 표시 */}
                        <div className="flex items-center">
                          <label className="block text-sm font-medium text-gray-700 mr-4">점수 (1-100점)</label>
                          <div className="w-24 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 text-center">
                            {feedbackData.score || '-'}
                          </div>
                          <span className="ml-2 text-sm text-gray-500">/ 100점</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-2">AI 분석 데이터 확인</h4>
                  <p className="text-gray-600 mb-4">구조화된 AI 분석 결과를 찾을 수 없습니다.</p>

                  {/* 디버깅 정보 표시 */}
                  {aiAnalysis ? (
                    <div className="text-xs text-gray-500 bg-white p-3 rounded border">
                      <p className="font-medium mb-1">저장된 데이터 구조:</p>
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(aiAnalysis, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">AI 분석 데이터가 없습니다.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 온라인 활동: AI 분석 결과 표시 완전 제거됨 */}

        {/* AI 분석 결과 표시 */}
        {activity.ai_analysis && aiAnalysis && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6">
              {aiAnalysis ? (
                <div className="space-y-6">
                  {/* 단계별 분석 표시 (ThinkingRoutineAnalysis 스타일) */}
                  {aiAnalysis.individualSteps && (
                    <div>
                      <h4 className="text-base font-semibold text-gray-800 mb-4">각 단계별 분석</h4>
                      <div className="space-y-4">
                        {Object.entries(aiAnalysis.individualSteps).map(([stepKey, stepContent], index) => {
                          // 단계별 정보 매핑
                          const stepInfoMap = generateStepInfoMap(activity?.routine_type || 'see-think-wonder');

                          const stepInfo = stepInfoMap[stepKey];

                          // 중요: stepContent 내용 디버깅
                          console.log(`🎯 화면 표시 중 - ${stepKey} 단계:`, {
                            stepInfo,
                            stepContent,
                            stepContentType: typeof stepContent,
                            stepContentLength: stepContent ? (stepContent as string).length : 0,
                            firstChars: stepContent ? (stepContent as string).substring(0, 100) : 'NULL'
                          });

                          if (!stepInfo || !stepContent) {
                            console.log(`❌ ${stepKey} 단계 표시 실패:`, { stepInfo: !!stepInfo, stepContent: !!stepContent });
                            return null;
                          }

                          const gradientColors: { [key: string]: string } = {
                            'bg-blue-500': 'from-blue-50 to-white border-blue-200',
                            'bg-green-500': 'from-green-50 to-white border-green-200',
                            'bg-purple-500': 'from-purple-50 to-white border-purple-200',
                            'bg-red-500': 'from-red-50 to-white border-red-200'
                          };

                          return (
                            <div
                              key={stepKey}
                              className={`bg-gradient-to-br ${gradientColors[stepInfo.color] || 'from-gray-50 to-white border-gray-200'} border rounded-xl p-6`}
                            >
                              <h5 className={`text-lg font-bold mb-4 flex items-center ${stepInfo.color === 'bg-blue-500' ? 'text-blue-800' :
                                stepInfo.color === 'bg-green-500' ? 'text-green-800' :
                                  stepInfo.color === 'bg-purple-500' ? 'text-purple-800' :
                                    stepInfo.color === 'bg-red-500' ? 'text-red-800' : 'text-gray-800'
                                }`}>
                                <span className={`w-8 h-8 ${stepInfo.color} text-white rounded-full flex items-center justify-center text-sm font-bold mr-3`}>
                                  {index + 1}
                                </span>
                                {stepInfo.title} ({stepInfo.subtitle})
                              </h5>

                              {/* AI 분석 결과 */}
                              <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                                <h6 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                  <svg className="w-4 h-4 mr-1 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                  </svg>
                                  AI 분석 결과
                                </h6>
                                <div
                                  className="prose prose-sm max-w-none text-gray-700 leading-relaxed text-left"
                                  dangerouslySetInnerHTML={{
                                    __html: (() => {
                                      const formattedText = formatMarkdownText(stepContent as string);
                                      console.log(`🎨 ${stepKey} 포맷팅 결과:`, {
                                        originalText: stepContent,
                                        formattedText,
                                        originalLength: stepContent ? (stepContent as string).length : 0,
                                        formattedLength: formattedText ? formattedText.length : 0
                                      });
                                      return formattedText;
                                    })()
                                  }}
                                />
                              </div>

                              {/* 교사 피드백 및 점수 */}
                              {(() => {
                                // 전체 분석 데이터에서 teacherFeedback 찾기
                                const fullAnalysis = typeof activity.ai_analysis === 'string' ?
                                  JSON.parse(activity.ai_analysis) : activity.ai_analysis;
                                const teacherFeedbackSteps = fullAnalysis?.teacherFeedback?.individualSteps;
                                const stepFeedback = teacherFeedbackSteps?.[stepKey];

                                // 디버깅용 로그
                                console.log('🔍 Step:', stepKey);
                                console.log('📊 Full Analysis:', fullAnalysis);
                                console.log('👨‍🏫 Teacher Feedback Steps:', teacherFeedbackSteps);
                                console.log('📝 Step Feedback:', stepFeedback);

                                if (stepFeedback) {
                                  return (
                                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                                      <h6 className="text-sm font-medium text-gray-700 mb-3 flex items-center justify-between">
                                        <span className="flex items-center">
                                          <svg className="w-4 h-4 mr-1 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                          </svg>
                                          교사 피드백
                                        </span>
                                        {stepFeedback.score && (
                                          <span className="text-sm font-medium text-green-600">
                                            {stepFeedback.score}점 / 100점
                                          </span>
                                        )}
                                      </h6>
                                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                                        <p className="text-gray-700 text-sm whitespace-pre-wrap">
                                          {stepFeedback.feedback || '교사 피드백이 아직 작성되지 않았습니다.'}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}


                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div
                    className="prose prose-sm max-w-none text-gray-700 leading-relaxed text-left"
                    dangerouslySetInnerHTML={{ __html: formatMarkdownText(activity?.ai_analysis || '') }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* 교사 피드백 및 평가 섹션 */}
        {(activity?.teacher_feedback || activity?.teacher_score || (aiAnalysis && aiAnalysis.teacherFeedback)) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">👩‍🏫 교사 피드백 및 평가</h3>

              {/* 전체 점수 표시 */}
              {activity?.teacher_score && (
                <div className="mb-6">
                  <span className="text-sm text-gray-600">전체 평가 점수: </span>
                  <span className="text-xl font-bold text-green-600">{activity?.teacher_score}점</span>
                  <span className="text-sm text-gray-500"> / 100점</span>
                </div>
              )}

              {/* 구조화된 교사 피드백 표시 (AI 분석과 함께 저장된 경우) */}
              {aiAnalysis && aiAnalysis.teacherFeedback && (
                <div className="space-y-4 mb-6">
                  <h4 className="text-base font-semibold text-gray-800">단계별 교사 피드백</h4>
                  {Object.entries(aiAnalysis.teacherFeedback).map(([stepKey, feedback], index) => {
                    // 표준 단계별 정보 매핑 사용
                    const stepInfoMap = generateStepInfoMap(activity?.routine_type || 'see-think-wonder');

                    const stepInfo = stepInfoMap[stepKey];
                    if (!stepInfo || !feedback) return null;

                    const feedbackData = typeof feedback === 'object' ? feedback as any : { feedback: feedback, score: null };

                    return (
                      <div key={stepKey} className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                        <h5 className="font-medium text-gray-800 mb-2 flex items-center">
                          <span className={`w-6 h-6 ${stepInfo.color} text-white rounded-full flex items-center justify-center text-xs font-bold mr-2`}>
                            {index + 1}
                          </span>
                          {stepInfo.title} ({stepInfo.subtitle})
                          {feedbackData.score && (
                            <span className="ml-auto text-sm font-medium text-green-600">
                              {feedbackData.score}점
                            </span>
                          )}
                        </h5>
                        <p className="text-gray-700 text-sm whitespace-pre-wrap ml-8">
                          {feedbackData.feedback || feedbackData}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 일반 교사 피드백 (기존 방식) */}
              {activity?.teacher_feedback && !(aiAnalysis && aiAnalysis.teacherFeedback) && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-2">피드백 내용</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{activity?.teacher_feedback}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 이미지 확대 모달 */}
      {
        imageModalOpen && (activity.image_url || activity.image_data) && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setImageModalOpen(false)}
          >
            <div className="relative max-w-full max-h-full">
              <button
                onClick={() => setImageModalOpen(false)}
                className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75"
              >
                ✕
              </button>
              <img
                src={activity.image_url || activity.image_data}
                alt="학생 활동 이미지 (확대)"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        )
      }
    </div >
  );
};

export default StudentActivityDetail;
