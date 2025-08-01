import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface ActivityRoom {
  id: string;
  title: string;
  description: string;
  room_code: string;
  thinking_routine_type: string;
  status: string;
  created_at: string;
  teacher_id: string;
}

interface RoutineTemplate {
  id: string;
  room_id: string;
  routine_type: string;
  content: {
    image_url?: string;
    text_content?: string;
    youtube_url?: string;
    see_question?: string;
    think_question?: string;
    wonder_question?: string;
    fourth_question?: string;
  };
}

interface StudentResponse {
  id: string;
  student_grade?: string;
  student_name: string;
  student_class?: string;
  student_number?: number;
  team_name?: string;
  student_id: string;
  response_data: any;
  submitted_at: string;
}

// 사고루틴별 설정 정보 추가
const ROUTINE_CONFIGS = {
  'see-think-wonder': {
    name: 'See-Think-Wonder',
    stepLabels: {
      see: { title: 'See', subtitle: '보기' },
      think: { title: 'Think', subtitle: '생각하기' },
      wonder: { title: 'Wonder', subtitle: '궁금하기' }
    },
    defaultQuestions: {
      see: '이 자료에서 무엇을 보았나요?',
      think: '이것에 대해 어떻게 생각하나요?',
      wonder: '이것에 대해 무엇이 궁금한가요?'
    }
  },
  '4c': {
    name: '4C',
    stepLabels: {
      see: { title: 'Connect', subtitle: '연결하기' },
      think: { title: 'Challenge', subtitle: '도전하기' },
      wonder: { title: 'Concepts', subtitle: '개념 파악' },
      fourth_step: { title: 'Changes', subtitle: '변화 제안' }
    },
    defaultQuestions: {
      see: '이 내용이 이미 알고 있는 것과 어떻게 연결되나요?',
      think: '이 내용에서 어떤 아이디어나 가정에 도전하고 싶나요?',
      wonder: '이 내용에서 중요하다고 생각하는 핵심 개념은 무엇인가요?',
      fourth_step: '이 내용이 당신이나 다른 사람들에게 어떤 변화를 제안하나요?'
    }
  },
  'circle-of-viewpoints': {
    name: 'Circle of Viewpoints',
    stepLabels: {
      see: { title: 'Viewpoints', subtitle: '관점 탐색' },
      think: { title: 'Perspective', subtitle: '관점 선택' },
      wonder: { title: 'Questions', subtitle: '관점별 질문' }
    },
    defaultQuestions: {
      see: '이 주제에 대해 다양한 관점을 가질 수 있는 사람들은 누구인가요?',
      think: '선택한 관점에서 이 주제를 어떻게 바라볼까요?',
      wonder: '이 관점에서 가질 수 있는 질문은 무엇인가요?'
    }
  },
  'connect-extend-challenge': {
    name: 'Connect-Extend-Challenge',
    stepLabels: {
      see: { title: 'Connect', subtitle: '연결하기' },
      think: { title: 'Extend', subtitle: '확장하기' },
      wonder: { title: 'Challenge', subtitle: '도전하기' }
    },
    defaultQuestions: {
      see: '이 내용이 이미 알고 있는 것과 어떻게 연결되나요?',
      think: '이 내용이 당신의 생각을 어떻게 확장시켰나요?',
      wonder: '이 내용에서 어떤 것이 당신에게 도전이 되나요?'
    }
  },
  'frayer-model': {
    name: 'Frayer Model',
    stepLabels: {
      see: { title: 'Definition', subtitle: '정의' },
      think: { title: 'Characteristics', subtitle: '특징' },
      wonder: { title: 'Examples', subtitle: '예시와 반례' }
    },
    defaultQuestions: {
      see: '이 개념을 어떻게 정의하겠나요?',
      think: '이 개념의 주요 특징은 무엇인가요?',
      wonder: '이 개념의 예시와 반례는 무엇인가요?'
    }
  },
  'used-to-think-now-think': {
    name: 'I Used to Think... Now I Think...',
    stepLabels: {
      see: { title: 'Used to Think', subtitle: '이전 생각' },
      think: { title: 'Now Think', subtitle: '현재 생각' },
      wonder: { title: 'Why Changed', subtitle: '변화 이유' }
    },
    defaultQuestions: {
      see: '이 주제에 대해 이전에 어떻게 생각했나요?',
      think: '지금은 어떻게 생각하나요?',
      wonder: '생각이 바뀐 이유는 무엇인가요?'
    }
  },
  'think-puzzle-explore': {
    name: 'Think-Puzzle-Explore',
    stepLabels: {
      see: { title: 'Think', subtitle: '생각하기' },
      think: { title: 'Puzzle', subtitle: '퍼즐' },
      wonder: { title: 'Explore', subtitle: '탐구하기' }
    },
    defaultQuestions: {
      see: '이 주제에 대해 무엇을 알고 있다고 생각하나요?',
      think: '무엇이 퍼즐이나 의문점인가요?',
      wonder: '이 퍼즐을 어떻게 탐구해보고 싶나요?'
    }
  }
};

const TeacherRoomDetail: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<ActivityRoom | null>(null);
  const [responses, setResponses] = useState<StudentResponse[]>([]);
  const [template, setTemplate] = useState<RoutineTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTemplateForm, setShowTemplateForm] = useState(false);

  const [templateForm, setTemplateForm] = useState({
    image_url: '',
    text_content: '',
    youtube_url: '',
    see_question: '',
    think_question: '',
    wonder_question: '',
    fourth_question: ''
  });

  const fetchRoomData = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase || !roomId) {
      setError('시스템 설정이 완료되지 않았습니다.');
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/teacher');
        return;
      }

      // 활동방 정보 조회
      const { data: roomData, error: roomError } = await supabase
        .from('activity_rooms')
        .select('*')
        .eq('id', roomId)
        .eq('teacher_id', session.user.id)
        .single();

      if (roomError) {
        console.error('Room fetch error:', roomError);
        setError('활동방을 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      setRoom(roomData);
      
      // 학생 응답 조회
      const { data: responsesData, error: responsesError } = await supabase
        .from('student_responses')
        .select('*')
        .eq('room_id', roomId)
        .eq('is_draft', false) // 임시저장 제외
        .order('submitted_at', { ascending: false });

      if (responsesError) {
        console.error('Responses fetch error:', responsesError);
        setError('학생 응답을 불러오는데 실패했습니다.');
      } else {
        setResponses(responsesData || []);
      }

      // 활동 템플릿 조회
      const { data: templateData, error: templateError } = await supabase
        .from('routine_templates')
        .select('*')
        .eq('room_id', roomId)
        .single();

      if (templateError && templateError.code !== 'PGRST116') {
        console.error('Template fetch error:', templateError);
      } else if (templateData) {
        setTemplate(templateData);
        setTemplateForm(templateData.content);
      } else {
        // 템플릿이 없는 경우 사고루틴 타입에 따른 기본 질문 설정
        const routineConfig = ROUTINE_CONFIGS[roomData.thinking_routine_type as keyof typeof ROUTINE_CONFIGS];
        if (routineConfig) {
          setTemplateForm(prev => ({
            ...prev,
            see_question: routineConfig.defaultQuestions.see,
            think_question: routineConfig.defaultQuestions.think,
            wonder_question: routineConfig.defaultQuestions.wonder,
            fourth_question: (routineConfig.defaultQuestions as any).fourth_step || ''
          }));
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Fetch error:', error);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  }, [roomId, navigate]);

  useEffect(() => {
    if (roomId) {
      fetchRoomData();
    }
  }, [roomId, fetchRoomData]);

  const handleBackToRoomManagement = () => {
    navigate('/teacher/thinking-routines');
  };

  const getThinkingRoutineLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'see-think-wonder': 'See-Think-Wonder',
      'connect-extend-challenge': 'Connect-Extend-Challenge',
      'what-makes-you-say-that': 'What Makes You Say That?',
      'think-pair-share': 'Think-Pair-Share'
    };
    return labels[type] || type;
  };

  // 사고루틴별 질문 라벨 가져오기
  const getQuestionLabels = (routineType: string) => {
    const config = ROUTINE_CONFIGS[routineType as keyof typeof ROUTINE_CONFIGS];
    return config ? config.stepLabels : ROUTINE_CONFIGS['see-think-wonder'].stepLabels;
  };

  const handleSaveTemplate = async () => {
    if (!supabase || !room) return;

    try {
      const templateData = {
        room_id: room.id,
        routine_type: room.thinking_routine_type,
        content: templateForm
      };

      if (template) {
        // 업데이트
        const { error } = await supabase
          .from('routine_templates')
          .update(templateData)
          .eq('id', template.id);

        if (error) {
          console.error('Template update error:', error);
          alert('템플릿 저장에 실패했습니다.');
          return;
        }
      } else {
        // 새로 생성
        const { data, error } = await supabase
          .from('routine_templates')
          .insert([templateData])
          .select()
          .single();

        if (error) {
          console.error('Template create error:', error);
          alert('템플릿 저장에 실패했습니다.');
          return;
        }

        setTemplate(data);
      }

      alert('템플릿이 저장되었습니다!');
      setShowTemplateForm(false);
    } catch (error) {
      console.error('Save template error:', error);
      alert('템플릿 저장 중 오류가 발생했습니다.');
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : null;
  };

  const handleViewResponse = (response: StudentResponse) => {
    navigate(`/teacher/room/${roomId}/response/${response.id}`);
  };

  const handleDeleteResponse = async (response: StudentResponse) => {
    if (!window.confirm(`${response.student_name}님의 응답을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      const { error } = await supabase!
        .from('student_responses')
        .delete()
        .eq('id', response.id);

      if (error) {
        console.error('Delete response error:', error);
        alert('응답 삭제에 실패했습니다.');
        return;
      }

      // 성공적으로 삭제된 경우 목록에서 제거
      setResponses(prev => prev.filter(r => r.id !== response.id));
      alert('응답이 삭제되었습니다.');
    } catch (err) {
      console.error('Delete response error:', err);
      alert('응답 삭제 중 오류가 발생했습니다.');
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">오류가 발생했습니다</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleBackToRoomManagement}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            사고루틴 생성 및 적용하기로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToRoomManagement}
                className="text-gray-600 hover:text-gray-900"
              >
                ← 사고루틴 생성 및 적용하기로 돌아가기
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{room.title}</h1>
                <p className="text-sm text-gray-600">활동방 관리</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 활동방 정보 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">활동방 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">방 코드</p>
              <p className="text-lg font-mono font-bold text-blue-600">{room.room_code}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">사고루틴</p>
              <p className="text-lg font-medium">{getThinkingRoutineLabel(room.thinking_routine_type)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">상태</p>
              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                {room.status === 'active' ? '활성' : '비활성'}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">참여 학생 수</p>
              <p className="text-lg font-medium">{responses.length}명</p>
            </div>
          </div>
          {room.description && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">설명</p>
              <p className="text-gray-900">{room.description}</p>
            </div>
          )}
        </div>

        {/* 활동 내용 설정 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">활동 내용 설정</h2>
            {!showTemplateForm && (
              <button
                onClick={() => setShowTemplateForm(!showTemplateForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                {template ? '내용 수정' : '내용 설정'}
              </button>
            )}
          </div>

          {template && !showTemplateForm && (
            <div className="space-y-4">
              {template.content.image_url && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">이미지</p>
                  <div className="flex justify-center">
                    <img src={template.content.image_url} alt="활동 이미지" className="max-w-md max-h-64 rounded-lg shadow-sm" />
                  </div>
                </div>
              )}
              {template.content.text_content && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">텍스트 내용</p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-900 whitespace-pre-wrap">{template.content.text_content}</p>
                  </div>
                </div>
              )}
              {template.content.youtube_url && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">유튜브 영상</p>
                  <div className="flex justify-center">
                    <div className="w-full max-w-2xl">
                      <div className="relative" style={{ paddingBottom: '56.25%' }}>
                        {(() => {
                          const embedUrl = getYouTubeEmbedUrl(template.content.youtube_url);
                          return embedUrl ? (
                            <iframe
                              src={embedUrl}
                              title="YouTube video"
                              className="absolute inset-0 w-full h-full rounded-lg"
                              allowFullScreen
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                              <div className="text-center">
                                <p className="text-gray-600 mb-2">유튜브 영상을 불러올 수 없습니다.</p>
                                <a 
                                  href={template.content.youtube_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline text-sm"
                                >
                                  새 탭에서 보기
                                </a>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {(() => {
                const questionLabels = getQuestionLabels(room.thinking_routine_type);
                const hasFourth = room.thinking_routine_type === '4c';
                
                return (
                  <div className={`grid grid-cols-1 gap-4 ${hasFourth ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'}`}>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">{questionLabels.see.title} 질문</p>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-900">{template.content.see_question}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">{questionLabels.think.title} 질문</p>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-900">{template.content.think_question}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">{questionLabels.wonder.title} 질문</p>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-900">{template.content.wonder_question}</p>
                      </div>
                    </div>
                    {hasFourth && (template.content as any).fourth_question && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">{(questionLabels as any).fourth_step?.title} 질문</p>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-gray-900">{(template.content as any).fourth_question}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {showTemplateForm && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이미지 URL (선택사항)
                </label>
                <input
                  type="url"
                  value={templateForm.image_url}
                  onChange={(e) => setTemplateForm({...templateForm, image_url: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
                {templateForm.image_url && (
                  <div className="mt-2 flex justify-center">
                    <img 
                      src={templateForm.image_url} 
                      alt="이미지 미리보기" 
                      className="max-w-full max-h-64 rounded-lg shadow-sm"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  텍스트 내용 (선택사항)
                </label>
                <textarea
                  rows={4}
                  value={templateForm.text_content}
                  onChange={(e) => setTemplateForm({...templateForm, text_content: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="학생들에게 보여줄 텍스트를 입력하세요..."
                />
                {templateForm.text_content && (
                  <div className="mt-2 bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">미리보기:</p>
                    <p className="text-gray-900 whitespace-pre-wrap">{templateForm.text_content}</p>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  유튜브 URL (선택사항)
                </label>
                <input
                  type="url"
                  value={templateForm.youtube_url}
                  onChange={(e) => setTemplateForm({...templateForm, youtube_url: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                {templateForm.youtube_url && (
                  <div className="mt-2 flex justify-center">
                    <div className="w-full max-w-2xl">
                      <div className="relative" style={{ paddingBottom: '56.25%' }}>
                        {(() => {
                          const embedUrl = getYouTubeEmbedUrl(templateForm.youtube_url);
                          return embedUrl ? (
                            <iframe
                              src={embedUrl}
                              title="YouTube preview"
                              className="absolute inset-0 w-full h-full rounded-lg"
                              allowFullScreen
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                              <div className="text-center">
                                <p className="text-gray-600 mb-2">유튜브 영상을 불러올 수 없습니다.</p>
                                <p className="text-sm text-gray-500">원본 링크: {templateForm.youtube_url}</p>
                                <a 
                                  href={templateForm.youtube_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline text-sm"
                                >
                                  새 탭에서 보기
                                </a>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {(() => {
                const questionLabels = getQuestionLabels(room.thinking_routine_type);
                const hasFourth = room.thinking_routine_type === '4c';
                
                return (
                  <div className={`grid grid-cols-1 gap-4 ${hasFourth ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'}`}>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {questionLabels.see.title} 질문
                      </label>
                      <input
                        type="text"
                        value={templateForm.see_question}
                        onChange={(e) => setTemplateForm({...templateForm, see_question: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {questionLabels.think.title} 질문
                      </label>
                      <input
                        type="text"
                        value={templateForm.think_question}
                        onChange={(e) => setTemplateForm({...templateForm, think_question: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {questionLabels.wonder.title} 질문
                      </label>
                      <input
                        type="text"
                        value={templateForm.wonder_question}
                        onChange={(e) => setTemplateForm({...templateForm, wonder_question: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    {hasFourth && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {(questionLabels as any).fourth_step?.title} 질문
                        </label>
                        <input
                          type="text"
                          value={templateForm.fourth_question}
                          onChange={(e) => setTemplateForm({...templateForm, fourth_question: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowTemplateForm(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveTemplate}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  저장
                </button>
              </div>
            </div>
          )}

          {!template && !showTemplateForm && (
            <div className="text-center py-8">
              <p className="text-gray-500">아직 활동 내용이 설정되지 않았습니다.</p>
              <p className="text-sm text-gray-400 mt-2">위의 버튼을 클릭하여 활동 내용을 설정하세요.</p>
            </div>
          )}
        </div>

        {/* 학생 응답 목록 */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">학생 응답</h2>
          </div>

          {responses.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">아직 제출된 응답이 없습니다.</p>
              <p className="text-sm text-gray-400 mt-2">학생들이 활동을 완료하면 여기에 표시됩니다.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {responses.map((response) => (
                <div key={response.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {response.student_grade && <span className="text-base">{response.student_grade} </span>}
                        {response.student_class && <span className="text-base">{response.student_class}반 </span>}
                        {response.student_number && <span className="text-base">{response.student_number}번 </span>}
                        {response.student_name}
                        {response.team_name && (
                          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2">
                            {response.team_name}
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">
                        제출일: {new Date(response.submitted_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewResponse(response)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                      >
                        응답 보기
                      </button>
                      <button
                        onClick={() => handleDeleteResponse(response)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>


    </div>
  );
};

export default TeacherRoomDetail; 