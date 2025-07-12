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
  };
}

interface StudentResponse {
  id: string;
  student_name: string;
  student_id: string;
  response_data: any;
  submitted_at: string;
}

const TeacherRoomManagement: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<ActivityRoom | null>(null);
  const [responses, setResponses] = useState<StudentResponse[]>([]);
  const [template, setTemplate] = useState<RoutineTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<StudentResponse | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    image_url: '',
    text_content: '',
    youtube_url: '',
    see_question: '이 자료에서 무엇을 보았나요?',
    think_question: '이것에 대해 어떻게 생각하나요?',
    wonder_question: '이것에 대해 무엇이 궁금한가요?'
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
      }

    } catch (error) {
      console.error('Fetch error:', error);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [roomId, navigate]);

  useEffect(() => {
    if (roomId) {
      fetchRoomData();
    }
  }, [roomId, fetchRoomData]);

  const handleBackToDashboard = () => {
    navigate('/teacher/dashboard');
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
    setSelectedResponse(response);
    setShowResponseModal(true);
  };

  const handleCloseResponseModal = () => {
    setSelectedResponse(null);
    setShowResponseModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
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
            onClick={handleBackToDashboard}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md"
          >
            대시보드로 돌아가기
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
                onClick={handleBackToDashboard}
                className="text-gray-600 hover:text-gray-900"
              >
                ← 대시보드로 돌아가기
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
              <p className="text-lg font-mono font-bold text-primary-600">{room.room_code}</p>
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
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium"
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">See 질문</p>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-900">{template.content.see_question}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Think 질문</p>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-900">{template.content.think_question}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Wonder 질문</p>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-900">{template.content.wonder_question}</p>
                  </div>
                </div>
              </div>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    See 질문
                  </label>
                  <input
                    type="text"
                    value={templateForm.see_question}
                    onChange={(e) => setTemplateForm({...templateForm, see_question: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Think 질문
                  </label>
                  <input
                    type="text"
                    value={templateForm.think_question}
                    onChange={(e) => setTemplateForm({...templateForm, think_question: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wonder 질문
                  </label>
                  <input
                    type="text"
                    value={templateForm.wonder_question}
                    onChange={(e) => setTemplateForm({...templateForm, wonder_question: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowTemplateForm(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveTemplate}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium"
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
                        {response.student_name}
                        {response.student_id && (
                          <span className="text-sm text-gray-500 ml-2">({response.student_id})</span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">
                        제출일: {new Date(response.submitted_at).toLocaleString()}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleViewResponse(response)}
                      className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm"
                    >
                      응답 보기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 응답 모달 */}
      {selectedResponse && showResponseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-full overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {selectedResponse.student_name}
                {selectedResponse.student_id && (
                  <span className="text-sm text-gray-500 ml-2">({selectedResponse.student_id})</span>
                )}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                제출일: {new Date(selectedResponse.submitted_at).toLocaleString()}
              </p>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
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
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedResponse.response_data.see || '응답 없음'}</p>
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
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedResponse.response_data.think || '응답 없음'}</p>
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
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedResponse.response_data.wonder || '응답 없음'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={handleCloseResponseModal}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherRoomManagement; 