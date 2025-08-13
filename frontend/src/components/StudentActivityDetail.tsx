import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface ActivityDetailProps {}

interface ActivityData {
  id: string;
  room_id: string | null;
  room_title: string;
  routine_type: string;
  submitted_at: string;
  student_name: string;
  student_grade?: string;
  student_class?: string;
  student_number?: number;
  team_name?: string;
  response_data?: any;
  ai_analysis?: string;
  teacher_feedback?: string;
  teacher_score?: number;
  activity_type: 'online' | 'offline';
  image_url?: string;
  image_data?: string;
  confidence_score?: number;
  // 온라인 활동용 추가 데이터
  room_description?: string;
  room_thinking_routine_type?: string;
  template_content?: any;
}

const StudentActivityDetail: React.FC<ActivityDetailProps> = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageModalOpen, setImageModalOpen] = useState(false);

  // 사고루틴 타입 라벨 함수
  const getRoutineTypeLabel = (routineType: string): string => {
    const labels: { [key: string]: string } = {
      'see-think-wonder': 'See-Think-Wonder',
      '4c': '4C',
      'circle-of-viewpoints': '관점의 원',
      'connect-extend-challenge': 'Connect-Extend-Challenge',
      'frayer-model': '프레이어 모델',
      'used-to-think-now-think': '이전-현재 생각',
      'think-puzzle-explore': 'Think-Puzzle-Explore'
    };
    return labels[routineType] || routineType;
  };

  // 활동 데이터 로드
  useEffect(() => {
    if (activityId) {
      loadActivityDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId]);

  const loadActivityDetail = async () => {
    if (!isSupabaseConfigured() || !supabase) {
      setError('시스템 설정이 완료되지 않았습니다.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // 먼저 기본 학생 응답 데이터 가져오기
      const { data: basicData, error: basicError } = await supabase
        .from('student_responses')
        .select(`
          id,
          room_id,
          student_name,
          student_grade,
          student_class,
          student_number,
          team_name,
          routine_type,
          image_url,
          image_data,
          response_data,
          ai_analysis,
          teacher_feedback,
          teacher_score,
          confidence_score,
          submitted_at
        `)
        .eq('id', activityId)
        .single();

      if (basicError) {
        throw new Error(`활동 데이터를 불러올 수 없습니다: ${basicError.message}`);
      }

      if (!basicData) {
        throw new Error('해당 활동을 찾을 수 없습니다.');
      }

      // 온라인 활동인 경우에만 활동방과 템플릿 정보 추가로 가져오기
      let roomData = null;
      let templateData = null;

      if (basicData.room_id) {
        // 활동방 정보 가져오기
        const { data: roomInfo, error: roomError } = await supabase
          .from('activity_rooms')
          .select('title, description, thinking_routine_type')
          .eq('id', basicData.room_id)
          .single();

        if (!roomError && roomInfo) {
          roomData = roomInfo;

          // 템플릿 정보 가져오기
          const { data: templateInfo, error: templateError } = await supabase
            .from('routine_templates')
            .select('content')
            .eq('room_id', basicData.room_id)
            .single();

          if (!templateError && templateInfo) {
            templateData = templateInfo;
          }
        }
      }

      const data = {
        ...basicData,
        activity_rooms: roomData,
        routine_templates: templateData
      };

      // 활동 타입 결정 (온라인/오프라인)
      const activityType = data.room_id ? 'online' : 'offline';
      
      const activityData: ActivityData = {
        id: data.id,
        room_id: data.room_id,
        room_title: activityType === 'online' 
          ? (data.activity_rooms as any)?.title || '활동방'
          : `${getRoutineTypeLabel(data.routine_type || 'see-think-wonder')} 분석`,
        routine_type: data.routine_type || (data.activity_rooms as any)?.thinking_routine_type || 'see-think-wonder',
        submitted_at: data.submitted_at,
        student_name: data.student_name,
        student_grade: data.student_grade,
        student_class: data.student_class,
        student_number: data.student_number,
        team_name: data.team_name,
        response_data: data.response_data,
        ai_analysis: data.ai_analysis,
        teacher_feedback: data.teacher_feedback,
        teacher_score: data.teacher_score,
        activity_type: activityType,
        image_url: data.image_url,
        image_data: data.image_data,
        confidence_score: data.confidence_score,
        // 온라인 활동용 추가 데이터
        room_description: (data.activity_rooms as any)?.description,
        room_thinking_routine_type: (data.activity_rooms as any)?.thinking_routine_type,
        template_content: (data.routine_templates as any)?.content
      };

      setActivity(activityData);

    } catch (err: any) {
      console.error('Activity detail loading error:', err);
      setError(err.message || '활동 상세 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 뒤로 가기
  const handleBack = () => {
    // URL에서 검색 파라미터가 있는지 확인하고, 있으면 그 상태로 돌아가기
    const urlParams = new URLSearchParams(window.location.search);
    const hasSearchParams = urlParams.toString();
    
    if (hasSearchParams) {
      // 검색 파라미터가 있으면 그대로 유지하여 검색 결과 상태로 돌아가기
      navigate(`/teacher/portfolio?${hasSearchParams}`);
    } else {
      // 검색 파라미터가 없으면 포트폴리오 첫 페이지로
      navigate('/teacher/portfolio');
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // AI 분석 결과 파싱
  const parseAIAnalysis = (aiAnalysis: string) => {
    try {
      const parsed = JSON.parse(aiAnalysis);
      console.log('🔍 AI 분석 원본 데이터:', parsed);
      
      // ThinkingRoutineAnalysis에서 저장한 구조화된 형태 처리
      if (parsed.aiAnalysis && parsed.aiAnalysis.individualSteps) {
        console.log('✅ 구조화된 AI 분석 데이터 발견');
        return {
          individualSteps: parsed.aiAnalysis.individualSteps,
          comprehensive: parsed.aiAnalysis.comprehensive,
          educational: parsed.aiAnalysis.educational,
          stepByStep: parsed.aiAnalysis.stepByStep,
          teacherFeedback: parsed.teacherFeedback?.individualSteps || {}
        };
      }
      
      // 기존 형태 처리 (직접 individualSteps가 있는 경우)
      if (parsed.individualSteps) {
        console.log('✅ 기존 형태 AI 분석 데이터 발견');
        return parsed;
      }
      
      console.log('⚠️ 알 수 없는 AI 분석 데이터 구조:', parsed);
      return parsed;
    } catch (error) {
      console.error('❌ AI 분석 데이터 파싱 오류:', error);
      return null;
    }
  };

  // 마크다운 텍스트 포맷팅 (ThinkingRoutineAnalysis와 동일)
  const formatMarkdownText = (text: string) => {
    const formatSection = (section: string) => {
      return section
        // 불필요한 기호들 제거
        .replace(/^\*\s*/gm, '') // 줄 시작의 * 제거
        .replace(/^---\s*/gm, '') // --- 제거
        .replace(/^\s*\*\s*$/gm, '') // * 만 있는 줄 제거
        // 제목 포맷팅
        .replace(/## (\d+)\. (.*?)(?=\n|$)/g, '<h3 class="text-xl font-bold text-purple-800 mb-4 pb-2 border-b-2 border-purple-200">$1. $2</h3>')
        .replace(/### (.*?)(?=\n|$)/g, '<h4 class="text-lg font-semibold text-gray-900 mt-6 mb-3 text-purple-700">$1</h4>')
        // 연보라색 태그에서 콜론 제거
        .replace(/\*\*(.*?):\*\*/g, '<div class="mt-4 mb-2"><span class="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">$1</span></div>')
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
        .replace(/^- (.*?)$/gm, '<div class="flex items-start mb-2"><span class="text-purple-500 mr-2 mt-1">•</span><span class="text-gray-700">$1</span></div>')
        // 빈 줄 정리
        .replace(/\n\s*\n\s*\n/g, '\n\n') // 3개 이상의 연속 줄바꿈을 2개로
        .replace(/\n\n/g, '<br><br>') // 줄바꿈을 HTML로
        .replace(/\n/g, '<br>'); // 단일 줄바꿈도 처리
    };

    return formatSection(text);
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

  const aiAnalysis = parseAIAnalysis(activity.ai_analysis || '{}');

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
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                activity.activity_type === 'online' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {activity.activity_type === 'online' ? '온라인 활동' : '오프라인 활동'}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
              <div>
                <span className="font-medium">학생:</span> {activity.student_name}
                {activity.student_grade && activity.student_class && (
                  <span> ({activity.student_grade} {activity.student_class}반</span>
                )}
                {activity.student_number && <span> {activity.student_number}번</span>}
                {activity.student_grade && activity.student_class && <span>)</span>}
              </div>
              <div>
                <span className="font-medium">제출일:</span> {formatDate(activity.submitted_at)}
              </div>
              <div>
                <span className="font-medium">사고루틴:</span> {getRoutineTypeLabel(activity.routine_type)}
              </div>
              {activity.team_name && (
                <div>
                  <span className="font-medium">모둠:</span> {activity.team_name}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 온라인 활동 - 교사 제공 자료 */}
        {activity.activity_type === 'online' && activity.template_content && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">교사 제공 자료</h3>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                <div className="flex items-center mb-3">
                  <span className="text-blue-600 font-medium">📝 텍스트 내용</span>
                </div>
                <p className="text-gray-900 mb-4">우리가 오늘 배워볼 개념은 충실하겠습니다.</p>
                
                <div className="space-y-3">
                  {(() => {
                    const template = activity.template_content;
                    const routineType = activity.routine_type;
                    
                    if (routineType === 'see-think-wonder') {
                      return (
                        <>
                          <div className="bg-white p-3 rounded border">
                            <div className="font-medium text-blue-600 mb-1">See 질문</div>
                            <p className="text-gray-700 text-sm">{template?.see_question || '이 개념을 어떻게 정의하겠나요?'}</p>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <div className="font-medium text-green-600 mb-1">Think 질문</div>
                            <p className="text-gray-700 text-sm">{template?.think_question || '이 개념의 주요 특징은 무엇인가요?'}</p>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <div className="font-medium text-purple-600 mb-1">Wonder 질문</div>
                            <p className="text-gray-700 text-sm">{template?.wonder_question || '이 개념에 대해 궁금한 것은 무엇인가요?'}</p>
                          </div>
                        </>
                      );
                    }
                    
                    if (routineType === 'frayer-model') {
                      return (
                        <>
                          <div className="bg-white p-3 rounded border">
                            <div className="font-medium text-blue-600 mb-1">Definition 질문</div>
                            <p className="text-gray-700 text-sm">{template?.see_question || '이 개념을 어떻게 정의하겠나요?'}</p>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <div className="font-medium text-green-600 mb-1">Characteristics 질문</div>
                            <p className="text-gray-700 text-sm">{template?.think_question || '이 개념의 주요 특징은 무엇인가요?'}</p>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <div className="font-medium text-purple-600 mb-1">Examples 질문</div>
                            <p className="text-gray-700 text-sm">{template?.wonder_question || '이 개념의 예시와 반례는 무엇인가요?'}</p>
                          </div>
                        </>
                      );
                    }
                    
                    // 기타 사고루틴들
                    return (
                      <div className="bg-white p-3 rounded border">
                        <div className="font-medium text-gray-700 mb-2">사고루틴 질문들</div>
                        {Object.entries(template || {}).map(([key, value]) => (
                          <div key={key} className="mb-2 last:mb-0">
                            <span className="text-sm font-medium text-gray-600">{key}: </span>
                            <span className="text-sm text-gray-700">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
              
              {activity.room_description && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">활동 설명</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700">{activity.room_description}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
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

        {/* 온라인 활동 - 학생 응답 (StudentResponseDetail 스타일) */}
        {activity.activity_type === 'online' && activity.response_data && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">✏️ 학생 응답</h3>
              
              <div className="space-y-6">
                {(() => {
                  const routineType = activity.routine_type;
                  const responseData = activity.response_data;
                  
                  // See-Think-Wonder
                  if (routineType === 'see-think-wonder') {
                    return (
                      <>
                        <div>
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                              <span className="text-white font-bold text-sm">S</span>
                            </div>
                            <div>
                              <h4 className="text-lg font-medium text-gray-900">See</h4>
                              <p className="text-sm text-gray-600">보기</p>
                            </div>
                          </div>
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-gray-900 whitespace-pre-wrap">
                              {responseData.see || '응답 없음'}
                            </p>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                              <span className="text-white font-bold text-sm">T</span>
                            </div>
                            <div>
                              <h4 className="text-lg font-medium text-gray-900">Think</h4>
                              <p className="text-sm text-gray-600">생각하기</p>
                            </div>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-gray-900 whitespace-pre-wrap">
                              {responseData.think || '응답 없음'}
                            </p>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                              <span className="text-white font-bold text-sm">W</span>
                            </div>
                            <div>
                              <h4 className="text-lg font-medium text-gray-900">Wonder</h4>
                              <p className="text-sm text-gray-600">궁금하기</p>
                            </div>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <p className="text-gray-900 whitespace-pre-wrap">
                              {responseData.wonder || '응답 없음'}
                            </p>
                          </div>
                        </div>
                      </>
                    );
                  }
                  
                  // Frayer Model
                  if (routineType === 'frayer-model') {
                    return (
                      <>
                        <div>
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                              <span className="text-white font-bold text-sm">D</span>
                            </div>
                            <div>
                              <h4 className="text-lg font-medium text-gray-900">Definition</h4>
                              <p className="text-sm text-gray-600">정의</p>
                            </div>
                          </div>
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-gray-900 whitespace-pre-wrap">
                              {responseData.see || '응답 없음'}
                            </p>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                              <span className="text-white font-bold text-sm">C</span>
                            </div>
                            <div>
                              <h4 className="text-lg font-medium text-gray-900">Characteristics</h4>
                              <p className="text-sm text-gray-600">특징</p>
                            </div>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-gray-900 whitespace-pre-wrap">
                              {responseData.think || '응답 없음'}
                            </p>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                              <span className="text-white font-bold text-sm">E</span>
                            </div>
                            <div>
                              <h4 className="text-lg font-medium text-gray-900">Examples & Non-Examples</h4>
                              <p className="text-sm text-gray-600">예시와 반례</p>
                            </div>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-green-600 font-bold">✓</span>
                                  <span className="font-medium text-gray-900">예시 (Examples)</span>
                                </div>
                                <div className="bg-white p-3 rounded border">
                                  <p className="text-gray-900 whitespace-pre-wrap">
                                    {(() => {
                                      const wonderResponse = responseData.wonder || '';
                                      const parts = wonderResponse.split('||');
                                      return parts[0] || '응답 없음';
                                    })()}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-red-600 font-bold">✗</span>
                                  <span className="font-medium text-gray-900">반례 (Non-Examples)</span>
                                </div>
                                <div className="bg-white p-3 rounded border">
                                  <p className="text-gray-900 whitespace-pre-wrap">
                                    {(() => {
                                      const wonderResponse = responseData.wonder || '';
                                      const parts = wonderResponse.split('||');
                                      return parts[1] || '응답 없음';
                                    })()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  }
                  
                  // 기타 사고루틴들 (4C, Connect-Extend-Challenge 등)
                  const stepConfigs: {[key: string]: {title: string, subtitle: string, color: string, bgColor: string, icon: string}} = {
                    see: { title: 'See', subtitle: '보기', color: 'bg-blue-500', bgColor: 'bg-blue-50', icon: 'S' },
                    connect: { title: 'Connect', subtitle: '연결하기', color: 'bg-blue-500', bgColor: 'bg-blue-50', icon: 'C' },
                    think: { title: 'Think', subtitle: '생각하기', color: 'bg-green-500', bgColor: 'bg-green-50', icon: 'T' },
                    challenge: { title: 'Challenge', subtitle: '도전하기', color: 'bg-red-500', bgColor: 'bg-red-50', icon: 'C' },
                    wonder: { title: 'Wonder', subtitle: '궁금하기', color: 'bg-purple-500', bgColor: 'bg-purple-50', icon: 'W' },
                    concepts: { title: 'Concepts', subtitle: '개념 파악', color: 'bg-green-500', bgColor: 'bg-green-50', icon: 'C' },
                    changes: { title: 'Changes', subtitle: '변화 제안', color: 'bg-purple-500', bgColor: 'bg-purple-50', icon: 'C' },
                    fourth_step: { title: 'Changes', subtitle: '변화 제안', color: 'bg-purple-500', bgColor: 'bg-purple-50', icon: 'C' }
                  };
                  
                  return Object.entries(responseData).map(([key, value]) => {
                    if (!value && key === 'fourth_step') return null;
                    const config = stepConfigs[key];
                    if (!config) return null;
                    
                    return (
                      <div key={key}>
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`w-8 h-8 rounded-full ${config.color} flex items-center justify-center`}>
                            <span className="text-white font-bold text-sm">{config.icon}</span>
                          </div>
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">{config.title}</h4>
                            <p className="text-sm text-gray-600">{config.subtitle}</p>
                          </div>
                        </div>
                        <div className={`${config.bgColor} p-4 rounded-lg`}>
                          <p className="text-gray-900 whitespace-pre-wrap">
                            {String(value) || '응답 없음'}
                          </p>
                        </div>
                      </div>
                    );
                  }).filter(Boolean);
                })()}
              </div>
            </div>
          </div>
        )}

        {/* 온라인 활동 - 5단계: 교사 피드백 및 평가 (오프라인과 동일한 형태) */}
        {activity.activity_type === 'online' && activity.ai_analysis && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6">
              {(() => {
                // AI 분석 데이터 파싱 시도
                let aiAnalysisData: {individualSteps: any, teacherFeedback: any} | null = null;
                try {
                  const parsed = JSON.parse(activity.ai_analysis);
                  // 구조화된 데이터 형태 확인
                  if (parsed.aiAnalysis && parsed.aiAnalysis.individualSteps) {
                    aiAnalysisData = {
                      individualSteps: parsed.aiAnalysis.individualSteps,
                      teacherFeedback: parsed.teacherFeedback?.individualSteps || {}
                    };
                  } else if (parsed.individualSteps) {
                    aiAnalysisData = {
                      individualSteps: parsed.individualSteps,
                      teacherFeedback: parsed.teacherFeedback || {}
                    };
                  }
                } catch (error) {
                  console.log('AI 분석 데이터 파싱 실패');
                }

                if (aiAnalysisData && aiAnalysisData.individualSteps && Object.keys(aiAnalysisData.individualSteps).length > 0) {
                  // 구조화된 AI 분석 데이터가 있는 경우 - 5단계 형태로 표시
                  const stepInfoMap: {[key: string]: {title: string, subtitle: string, color: string}} = {
                    see: { title: 'See', subtitle: '보기', color: 'bg-blue-500' },
                    think: { title: 'Think', subtitle: '생각하기', color: 'bg-green-500' },
                    wonder: { title: 'Wonder', subtitle: '궁금하기', color: 'bg-purple-500' },
                    definition: { title: 'Definition', subtitle: '정의', color: 'bg-blue-500' },
                    characteristics: { title: 'Characteristics', subtitle: '특징', color: 'bg-green-500' },
                    examples: { title: 'Examples & Non-Examples', subtitle: '예시와 반례', color: 'bg-purple-500' }
                  };

                  const gradientColors: {[key: string]: string} = {
                    'bg-blue-500': 'from-blue-50 to-blue-100 border-blue-200',
                    'bg-green-500': 'from-green-50 to-green-100 border-green-200',
                    'bg-purple-500': 'from-purple-50 to-purple-100 border-purple-200'
                  };

                  return (
                    <div className="space-y-6">
                      {Object.entries(aiAnalysisData.individualSteps).map(([stepKey, stepContent], index) => {
                        const stepInfo = stepInfoMap[stepKey] || { title: stepKey, subtitle: stepKey, color: 'bg-gray-500' };
                        const savedFeedback = aiAnalysisData?.teacherFeedback && aiAnalysisData.teacherFeedback[stepKey];
                        const feedbackData = typeof savedFeedback === 'object' ? savedFeedback as any : { feedback: savedFeedback || '', score: null };

                        return (
                          <div
                            key={stepKey}
                            className={`bg-gradient-to-br ${gradientColors[stepInfo.color] || 'from-gray-50 to-white border-gray-200'} border rounded-xl p-6`}
                          >
                            <h3 className={`text-lg font-bold mb-4 flex items-center text-gray-800`}>
                              <span className={`w-8 h-8 ${stepInfo.color} text-white rounded-full flex items-center justify-center text-sm font-bold mr-3`}>
                                {index + 1}
                              </span>
                              {stepInfo.title} ({stepInfo.subtitle})
                            </h3>

                            {/* AI 분석 내용 */}
                            <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <svg className="w-4 h-4 mr-1 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                AI 분석 결과
                              </h4>
                              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                                <div dangerouslySetInnerHTML={{ __html: String(stepContent).replace(/\n/g, '<br/>') }} />
                              </div>
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
                  );
                } else {
                  // 구조화되지 않은 데이터인 경우 표시하지 않음
                  return null;
                }
              })()}
            </div>
          </div>
        )}

        {/* 오프라인 활동: ThinkingRoutineAnalysis 5단계 교사 피드백 형태로 표시 */}
        {activity.activity_type === 'offline' && activity.ai_analysis && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6">
              
              {aiAnalysis && aiAnalysis.individualSteps && Object.keys(aiAnalysis.individualSteps).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(aiAnalysis.individualSteps).map(([stepKey, stepContent], index) => {
                    // 단계별 정보 매핑
                    const stepInfoMap: {[key: string]: {title: string, subtitle: string, color: string}} = {
                      'see': { title: 'See', subtitle: '보기', color: 'bg-blue-500' },
                      'think': { title: 'Think', subtitle: '생각하기', color: 'bg-green-500' },
                      'wonder': { title: 'Wonder', subtitle: '궁금하기', color: 'bg-purple-500' },
                      'connect': { title: 'Connect', subtitle: '연결하기', color: 'bg-blue-500' },
                      'challenge': { title: 'Challenge', subtitle: '도전하기', color: 'bg-red-500' },
                      'concepts': { title: 'Concepts', subtitle: '개념 파악', color: 'bg-green-500' },
                      'changes': { title: 'Changes', subtitle: '변화 제안', color: 'bg-purple-500' },
                      'definition': { title: 'Definition', subtitle: '정의', color: 'bg-blue-500' },
                      'characteristics': { title: 'Characteristics', subtitle: '특징', color: 'bg-green-500' },
                      'examples': { title: 'Examples', subtitle: '예시와 반례', color: 'bg-purple-500' }
                    };

                    const stepInfo = stepInfoMap[stepKey];
                    if (!stepInfo) return null;

                    const gradientColors: {[key: string]: string} = {
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
                        <h3 className={`text-lg font-bold mb-4 flex items-center ${
                          stepInfo.color === 'bg-blue-500' ? 'text-blue-800' :
                          stepInfo.color === 'bg-green-500' ? 'text-green-800' :
                          stepInfo.color === 'bg-purple-500' ? 'text-purple-800' :
                          stepInfo.color === 'bg-red-500' ? 'text-red-800' : 'text-gray-800'
                        }`}>
                          <span className={`w-8 h-8 ${stepInfo.color} text-white rounded-full flex items-center justify-center text-sm font-bold mr-3`}>
                            {index + 1}
                          </span>
                          {stepInfo.title} ({stepInfo.subtitle})
                        </h3>
                        
                        {/* AI 분석 내용 */}
                        <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-1 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            AI 분석 결과
                          </h4>
                          <div 
                            className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
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

        {/* 온라인 활동: 기존 AI 분석 결과 표시 방식 유지 */}
        {activity.activity_type === 'online' && activity.ai_analysis && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🤖 AI 분석 결과</h3>
              {activity.confidence_score && (
                <div className="mb-6">
                  <span className="text-sm text-gray-600">신뢰도: </span>
                  <span className="font-medium text-blue-600">{activity.confidence_score}%</span>
                </div>
              )}
              
              {aiAnalysis ? (
                <div className="space-y-6">
                  {/* 단계별 분석 표시 (ThinkingRoutineAnalysis 스타일) */}
                  {aiAnalysis.individualSteps && (
                    <div>
                      <h4 className="text-base font-semibold text-gray-800 mb-4">각 단계별 분석</h4>
                      <div className="space-y-4">
                        {Object.entries(aiAnalysis.individualSteps).map(([stepKey, stepContent], index) => {
                          // 단계별 정보 매핑
                          const stepInfoMap: {[key: string]: {title: string, subtitle: string, color: string}} = {
                            'see': { title: 'See', subtitle: '보기', color: 'bg-blue-500' },
                            'think': { title: 'Think', subtitle: '생각하기', color: 'bg-green-500' },
                            'wonder': { title: 'Wonder', subtitle: '궁금하기', color: 'bg-purple-500' },
                            'connect': { title: 'Connect', subtitle: '연결하기', color: 'bg-blue-500' },
                            'challenge': { title: 'Challenge', subtitle: '도전하기', color: 'bg-red-500' },
                            'concepts': { title: 'Concepts', subtitle: '개념 파악', color: 'bg-green-500' },
                            'changes': { title: 'Changes', subtitle: '변화 제안', color: 'bg-purple-500' },
                            'definition': { title: 'Definition', subtitle: '정의', color: 'bg-blue-500' },
                            'characteristics': { title: 'Characteristics', subtitle: '특징', color: 'bg-green-500' },
                            'examples': { title: 'Examples', subtitle: '예시와 반례', color: 'bg-purple-500' }
                          };

                          const stepInfo = stepInfoMap[stepKey];
                          if (!stepInfo || !stepContent) return null;

                          const gradientColors: {[key: string]: string} = {
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
                              <h5 className={`text-lg font-bold mb-4 flex items-center ${
                                stepInfo.color === 'bg-blue-500' ? 'text-blue-800' :
                                stepInfo.color === 'bg-green-500' ? 'text-green-800' :
                                stepInfo.color === 'bg-purple-500' ? 'text-purple-800' :
                                stepInfo.color === 'bg-red-500' ? 'text-red-800' : 'text-gray-800'
                              }`}>
                                <span className={`w-8 h-8 ${stepInfo.color} text-white rounded-full flex items-center justify-center text-sm font-bold mr-3`}>
                                  {index + 1}
                                </span>
                                {stepInfo.title} ({stepInfo.subtitle})
                              </h5>
                              
                              <div className="bg-white rounded-lg p-4 border border-gray-200">
                                <h6 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                  <svg className="w-4 h-4 mr-1 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                  </svg>
                                  AI 분석 결과
                                </h6>
                                <div 
                                  className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                                  dangerouslySetInnerHTML={{ __html: formatMarkdownText(stepContent as string) }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 종합 평가 */}
                  {aiAnalysis.comprehensive && (
                    <div className="bg-gradient-to-br from-yellow-50 to-white border border-yellow-200 rounded-xl p-6">
                      <h4 className="text-lg font-bold text-yellow-800 mb-4">종합 평가</h4>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div 
                          className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: formatMarkdownText(aiAnalysis.comprehensive) }}
                        />
                      </div>
                    </div>
                  )}

                  {/* 교육적 권장사항 */}
                  {aiAnalysis.educational && (
                    <div className="bg-gradient-to-br from-orange-50 to-white border border-orange-200 rounded-xl p-6">
                      <h4 className="text-lg font-bold text-orange-800 mb-4">교육적 권장사항</h4>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div 
                          className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: formatMarkdownText(aiAnalysis.educational) }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div 
                    className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatMarkdownText(activity.ai_analysis) }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* 온라인 활동 교사 피드백 */}
        {activity.activity_type === 'online' && (activity.teacher_feedback || activity.teacher_score || (aiAnalysis && aiAnalysis.teacherFeedback)) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">👩‍🏫 교사 피드백 및 평가</h3>
              
              {/* 전체 점수 표시 */}
              {activity.teacher_score && (
                <div className="mb-6">
                  <span className="text-sm text-gray-600">전체 평가 점수: </span>
                  <span className="text-xl font-bold text-green-600">{activity.teacher_score}점</span>
                  <span className="text-sm text-gray-500"> / 100점</span>
                </div>
              )}
              
              {/* 구조화된 교사 피드백 표시 (AI 분석과 함께 저장된 경우) */}
              {aiAnalysis && aiAnalysis.teacherFeedback && (
                <div className="space-y-4 mb-6">
                  <h4 className="text-base font-semibold text-gray-800">단계별 교사 피드백</h4>
                  {Object.entries(aiAnalysis.teacherFeedback).map(([stepKey, feedback], index) => {
                    const stepInfoMap: {[key: string]: {title: string, subtitle: string, color: string}} = {
                      'see': { title: 'See', subtitle: '보기', color: 'bg-blue-500' },
                      'think': { title: 'Think', subtitle: '생각하기', color: 'bg-green-500' },
                      'wonder': { title: 'Wonder', subtitle: '궁금하기', color: 'bg-purple-500' },
                      'connect': { title: 'Connect', subtitle: '연결하기', color: 'bg-blue-500' },
                      'challenge': { title: 'Challenge', subtitle: '도전하기', color: 'bg-red-500' },
                      'concepts': { title: 'Concepts', subtitle: '개념 파악', color: 'bg-green-500' },
                      'changes': { title: 'Changes', subtitle: '변화 제안', color: 'bg-purple-500' },
                      'definition': { title: 'Definition', subtitle: '정의', color: 'bg-blue-500' },
                      'characteristics': { title: 'Characteristics', subtitle: '특징', color: 'bg-green-500' },
                      'examples': { title: 'Examples', subtitle: '예시와 반례', color: 'bg-purple-500' }
                    };

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
              {activity.teacher_feedback && !(aiAnalysis && aiAnalysis.teacherFeedback) && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-2">피드백 내용</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{activity.teacher_feedback}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 이미지 확대 모달 */}
      {imageModalOpen && (activity.image_url || activity.image_data) && (
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
      )}
    </div>
  );
};

export default StudentActivityDetail;
