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
    navigate('/teacher/portfolio');
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
      return JSON.parse(aiAnalysis);
    } catch {
      return null;
    }
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

        {/* 온라인 활동 - 활동방 내용 */}
        {activity.activity_type === 'online' && activity.template_content && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 활동방 내용</h3>
              {activity.room_description && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">활동 설명</h4>
                  <p className="text-gray-600">{activity.room_description}</p>
                </div>
              )}
              
              {/* 템플릿 내용 표시 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-3">사고루틴 템플릿</h4>
                {/* 템플릿 내용을 여기에 렌더링 */}
                <pre className="whitespace-pre-wrap text-sm text-gray-600">
                  {JSON.stringify(activity.template_content, null, 2)}
                </pre>
              </div>
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

        {/* 학생 응답 (온라인 활동만) */}
        {activity.activity_type === 'online' && activity.response_data && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">✏️ 학생 응답</h3>
              <div className="bg-blue-50 rounded-lg p-4">
                <pre className="whitespace-pre-wrap text-sm text-gray-700">
                  {JSON.stringify(activity.response_data, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* AI 분석 결과 */}
        {activity.ai_analysis && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🤖 AI 분석 결과</h3>
              {activity.confidence_score && (
                <div className="mb-4">
                  <span className="text-sm text-gray-600">신뢰도: </span>
                  <span className="font-medium text-blue-600">{activity.confidence_score}%</span>
                </div>
              )}
              <div className="bg-green-50 rounded-lg p-4">
                {aiAnalysis ? (
                  <div className="space-y-4">
                    {/* AI 분석 구조화된 데이터 표시 */}
                    <pre className="whitespace-pre-wrap text-sm text-gray-700">
                      {JSON.stringify(aiAnalysis, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">
                    {activity.ai_analysis}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 교사 피드백 */}
        {(activity.teacher_feedback || activity.teacher_score) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">👩‍🏫 교사 피드백 및 평가</h3>
              
              {activity.teacher_score && (
                <div className="mb-4">
                  <span className="text-sm text-gray-600">평가 점수: </span>
                  <span className="text-xl font-bold text-green-600">{activity.teacher_score}점</span>
                  <span className="text-sm text-gray-500"> / 100점</span>
                </div>
              )}
              
              {activity.teacher_feedback && (
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
