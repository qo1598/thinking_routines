import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface Teacher {
  id: string;
  name: string;
  email: string;
}

interface ActivityRoom {
  id: string;
  title: string;
  description: string;
  room_code: string;
  thinking_routine_type: string;
  status: string;
  created_at: string;
  response_count?: number;
}

interface NewRoomForm {
  title: string;
  description: string;
  thinking_routine_type: string;
  participation_type: string; // 참여 유형: 'individual' | 'group'
  // 템플릿 내용도 함께 관리
  template_content: {
    image_url: string;
    text_content: string;
    youtube_url: string;
    see_question: string;
    think_question: string;
    wonder_question: string;
    fourth_question?: string; // 4C의 Changes 단계용
  };
}

interface TeacherRoomManagementProps {
  onBack: () => void;
}

// 6자리 숫자 코드 생성 함수
const generateRoomCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const TeacherRoomManagement: React.FC<TeacherRoomManagementProps> = ({ onBack }) => {
  const [user, setUser] = useState<Teacher | null>(null);
  const [rooms, setRooms] = useState<ActivityRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createStep, setCreateStep] = useState(1); // 1: 사고루틴 선택, 2: 활동 자료 설정, 3: 질문 입력

  const [newRoom, setNewRoom] = useState<NewRoomForm>({
    title: '',
    description: '',
    thinking_routine_type: '',
    participation_type: 'individual', // 기본값: 개인 참여
    template_content: {
      image_url: '',
      text_content: '',
      youtube_url: '',
      see_question: '이 자료에서 무엇을 보았나요?',
      think_question: '이것에 대해 어떻게 생각하나요?',
      wonder_question: '이것에 대해 무엇이 궁금한가요?',
      fourth_question: ''
    }
  });
  const [createLoading, setCreateLoading] = useState(false);

  const navigate = useNavigate();

  // 사고루틴 타입 라벨 반환 함수
  const getThinkingRoutineLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'see-think-wonder': 'See-Think-Wonder (보기-생각하기-궁금하기)',
      '4c': '4C (연결-도전-개념-변화)',
      'circle-of-viewpoints': 'Circle of Viewpoints (관점의 원)',
      'connect-extend-challenge': 'Connect-Extend-Challenge (연결-확장-도전)',
      'frayer-model': 'Frayer Model (프레이어 모델)',
      'used-to-think-now-think': 'I Used to Think... Now I Think... (이전 생각 - 현재 생각)',
      'think-puzzle-explore': 'Think-Puzzle-Explore (생각-퍼즐-탐구)'
    };
    return labels[type] || type;
  };

  // 사고루틴 옵션
  const thinkingRoutineOptions = [
    { value: 'see-think-wonder', label: 'See-Think-Wonder (보기-생각하기-궁금하기)' },
    { value: '4c', label: '4C (연결-도전-개념-변화)' },
    { value: 'circle-of-viewpoints', label: 'Circle of Viewpoints (관점의 원)' },
    { value: 'connect-extend-challenge', label: 'Connect-Extend-Challenge (연결-확장-도전)' },
    { value: 'frayer-model', label: 'Frayer Model (프레이어 모델)' },
    { value: 'used-to-think-now-think', label: 'I Used to Think... Now I Think... (이전 생각 - 현재 생각)' },
    { value: 'think-puzzle-explore', label: 'Think-Puzzle-Explore (생각-퍼즐-탐구)' }
  ];

  useEffect(() => {
    checkAuth();
  }, [navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkAuth = async () => {
    if (!isSupabaseConfigured() || !supabase) {
      navigate('/teacher');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/teacher');
        return;
      }

      // 사용자 정보 upsert (없으면 생성, 있으면 업데이트)
      const { data: teacherData, error: upsertError } = await supabase
        .from('teachers')
        .upsert([
          {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
            created_at: new Date().toISOString()
          }
        ], { 
          onConflict: 'id'
        })
        .select()
        .single();

      if (upsertError) {
        console.error('Teacher upsert error:', upsertError);
        navigate('/teacher');
        return;
      }

      setUser(teacherData);
      await fetchRooms(session.user.id);
    } catch (error) {
      console.error('Auth check error:', error);
      navigate('/teacher');
    }
  };

  const fetchRooms = async (userId: string) => {
    if (!supabase) return;

    try {
      // 먼저 활동방 목록을 가져옵니다
      const { data: roomsData, error } = await supabase
        .from('activity_rooms')
        .select('*')
        .eq('teacher_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch rooms error:', error);
        setError('활동방 목록을 불러오는데 실패했습니다.');
        setLoading(false);
        return;
      }

      // 각 활동방의 응답 개수를 별도로 조회
      const roomsWithCount = await Promise.all(
        roomsData.map(async (room) => {
          if (!supabase) return { ...room, response_count: 0 };
          
          const { count, error: countError } = await supabase
            .from('student_responses')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .eq('is_draft', false); // 임시저장 제외

          if (countError) {
            console.error('Count error for room', room.id, ':', countError);
            return { ...room, response_count: 0 };
          }

          return { ...room, response_count: count || 0 };
        })
      );

      setRooms(roomsWithCount);
    } catch (err) {
      console.error('Fetch rooms error:', err);
      setError('활동방 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSupabaseConfigured() || !supabase) {
      setError('시스템 설정이 완료되지 않았습니다.');
      return;
    }

    setCreateLoading(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/teacher');
        return;
      }

      // 고유한 6자리 방 코드 생성
      let roomCode = generateRoomCode();
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 10) {
        const { data: existingRoom } = await supabase
          .from('activity_rooms')
          .select('id')
          .eq('room_code', roomCode)
          .eq('status', 'active')
          .single();

        if (!existingRoom) {
          isUnique = true;
        } else {
          roomCode = generateRoomCode();
          attempts++;
        }
      }

      if (!isUnique) {
        setError('고유한 방 코드 생성에 실패했습니다. 다시 시도해주세요.');
        return;
      }

      const { data: roomData, error } = await supabase
        .from('activity_rooms')
        .insert([
          {
            teacher_id: session.user.id,
            title: newRoom.title,
            description: newRoom.description || '',
            room_code: roomCode,
            thinking_routine_type: newRoom.thinking_routine_type,
            participation_type: newRoom.participation_type,
            status: 'active',
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Room creation error:', error);
        setError('활동방 생성에 실패했습니다.');
        return;
      }

      // 템플릿 내용이 있으면 함께 저장
      if (newRoom.template_content.image_url || newRoom.template_content.text_content || newRoom.template_content.youtube_url) {
        const { error: templateError } = await supabase
          .from('routine_templates')
          .insert([
            {
              room_id: roomData.id,
              routine_type: newRoom.thinking_routine_type,
              content: newRoom.template_content
            }
          ]);

        if (templateError) {
          console.error('Template creation error:', templateError);
          // 템플릿 생성 실패는 치명적이지 않으므로 경고만 표시
          alert('활동방은 생성되었지만 템플릿 저장에 실패했습니다. 나중에 활동방 관리에서 설정할 수 있습니다.');
        }
      }

      const newRoomWithCount = {
        ...roomData,
        response_count: 0
      };

      setRooms([newRoomWithCount, ...rooms]);
      setNewRoom({ 
        title: '', 
        description: '', 
        thinking_routine_type: '', 
        participation_type: 'individual',
        template_content: {
          image_url: '',
          text_content: '',
          youtube_url: '',
          see_question: '이 자료에서 무엇을 보았나요?',
          think_question: '이것에 대해 어떻게 생각하나요?',
          wonder_question: '이것에 대해 무엇이 궁금한가요?',
          fourth_question: ''
        }
      });
      setShowCreateForm(false);
      setCreateStep(1);
      alert(`활동방이 생성되었습니다! 방 코드: ${roomCode}`);
    } catch (err) {
      console.error('Create room error:', err);
      setError('활동방 생성 중 오류가 발생했습니다.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleThinkingRoutineChange = (routineType: string) => {
    // 사고루틴 타입 변경 시 질문을 빈 문자열로 초기화
    setNewRoom({
      ...newRoom,
      thinking_routine_type: routineType,
      template_content: {
        ...newRoom.template_content,
        see_question: '',
        think_question: '',
        wonder_question: '',
        fourth_question: ''
      }
    });
  };

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : null;
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    navigate('/teacher');
  };

  const getStatusBadge = (room: ActivityRoom) => {
    if (room.status !== 'active') {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
          비활성
        </span>
      );
    }

    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
        활성
      </span>
    );
  };

  const handleStatusChange = async (roomId: string, newStatus: string) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('activity_rooms')
        .update({ status: newStatus })
        .eq('id', roomId);

      if (error) {
        console.error('Status update error:', error);
        setError('상태 변경에 실패했습니다.');
        return;
      }

      // 로컬 상태 업데이트
      setRooms(rooms.map(room => 
        room.id === roomId ? { ...room, status: newStatus } : room
      ));
      
      alert(`활동방이 ${newStatus === 'active' ? '활성화' : '비활성화'}되었습니다.`);
    } catch (err) {
      console.error('Status change error:', err);
      setError('상태 변경 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteRoom = async (roomId: string, roomTitle: string) => {
    if (!supabase) return;

    // 확인 대화상자
    const confirmed = window.confirm(`'${roomTitle}' 활동방을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 해당 활동방의 모든 학생 응답도 함께 삭제됩니다.`);
    
    if (!confirmed) return;

    try {
      // 먼저 관련된 학생 응답들 삭제
      const { error: responsesError } = await supabase
        .from('student_responses')
        .delete()
        .eq('room_id', roomId);

      if (responsesError) {
        console.error('Delete responses error:', responsesError);
        setError('학생 응답 삭제에 실패했습니다.');
        return;
      }

      // 활동 템플릿 삭제
      const { error: templateError } = await supabase
        .from('routine_templates')
        .delete()
        .eq('room_id', roomId);

      if (templateError) {
        console.error('Delete template error:', templateError);
        // 템플릿 삭제 실패는 치명적이지 않으므로 계속 진행
      }

      // 활동방 삭제
      const { error: roomError } = await supabase
        .from('activity_rooms')
        .delete()
        .eq('id', roomId);

      if (roomError) {
        console.error('Delete room error:', roomError);
        setError('활동방 삭제에 실패했습니다.');
        return;
      }

      // 로컬 상태에서 삭제된 방 제거
      setRooms(rooms.filter(room => room.id !== roomId));
      
      alert('활동방이 삭제되었습니다.');
    } catch (err) {
      console.error('Delete room error:', err);
      setError('활동방 삭제 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/teacher/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← 대시보드로 돌아가기
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                사고루틴 생성 및 적용하기
              </h1>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <span className="text-sm text-gray-700">
                안녕하세요, {user?.name}님!
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* 활동방 생성 버튼 */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            + 새 활동방 만들기
          </button>
        </div>

        {/* 활동방 생성 폼 */}
        {showCreateForm && (
          <div className="mb-6 bg-white p-6 rounded-lg shadow-sm border">
            {/* 단계 표시 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">새 활동방 만들기</h3>
                <div className="text-sm text-gray-500">
                  {createStep === 1 && '1단계: 사고루틴 선택'}
                  {createStep === 2 && '2단계: 활동 자료 설정'}
                  {createStep === 3 && '3단계: 질문 입력'}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${createStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  1
                </div>
                <div className={`h-1 w-16 ${createStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${createStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  2
                </div>
                <div className={`h-1 w-16 ${createStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${createStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  3
                </div>
              </div>
            </div>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              {/* 1단계: 사고루틴 선택 */}
              {createStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="thinkingRoutineType" className="block text-sm font-medium text-gray-700">
                      사고루틴 타입
                    </label>
                    <select
                      id="thinkingRoutineType"
                      value={newRoom.thinking_routine_type}
                      onChange={(e) => handleThinkingRoutineChange(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">사고루틴 타입을 선택하세요</option>
                      {thinkingRoutineOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      활동방 제목
                    </label>
                    <input
                      id="title"
                      type="text"
                      required
                      value={newRoom.title}
                      onChange={(e) => setNewRoom({...newRoom, title: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="활동방 제목을 입력하세요"
                    />
                  </div>
                  <div>
                    <label htmlFor="participationType" className="block text-sm font-medium text-gray-700">
                      참여 유형
                    </label>
                    <select
                      id="participationType"
                      value={newRoom.participation_type}
                      onChange={(e) => setNewRoom({...newRoom, participation_type: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="individual">개인 참여</option>
                      <option value="group">모둠 참여</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      {newRoom.participation_type === 'individual' 
                        ? '학생들이 개별적으로 사고루틴을 수행합니다.' 
                        : '학생들이 모둠을 구성하여 사고루틴을 수행합니다.'}
                    </p>
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      설명 (선택사항)
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      value={newRoom.description}
                      onChange={(e) => setNewRoom({...newRoom, description: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="활동방에 대한 간단한 설명을 입력하세요"
                    />
                  </div>
                </div>
              )}

              {/* 2단계: 활동 자료 설정 */}
              {createStep === 2 && (
                <div className="space-y-4">
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="textContent" className="block text-sm font-medium text-gray-700">
                        텍스트 내용
                      </label>
                      <textarea
                        id="textContent"
                        rows={3}
                        value={newRoom.template_content.text_content}
                        onChange={(e) => setNewRoom({
                          ...newRoom,
                          template_content: { ...newRoom.template_content, text_content: e.target.value }
                        })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="학생들에게 제시할 텍스트를 입력하세요"
                      />
                    </div>

                    <div>
                      <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
                        이미지 URL
                      </label>
                      <input
                        id="imageUrl"
                        type="url"
                        value={newRoom.template_content.image_url}
                        onChange={(e) => setNewRoom({
                          ...newRoom,
                          template_content: { ...newRoom.template_content, image_url: e.target.value }
                        })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://example.com/image.jpg"
                      />
                      {newRoom.template_content.image_url && (
                        <div className="mt-2 flex justify-center">
                          <img 
                            src={newRoom.template_content.image_url} 
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
                      <label htmlFor="youtubeUrl" className="block text-sm font-medium text-gray-700">
                        유튜브 URL
                      </label>
                      <input
                        id="youtubeUrl"
                        type="url"
                        value={newRoom.template_content.youtube_url}
                        onChange={(e) => setNewRoom({
                          ...newRoom,
                          template_content: { ...newRoom.template_content, youtube_url: e.target.value }
                        })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                      {newRoom.template_content.youtube_url && (
                        <div className="mt-2 flex justify-center">
                          <div className="w-full max-w-md">
                            <div className="relative" style={{ paddingBottom: '56.25%' }}>
                              {(() => {
                                const embedUrl = getYouTubeEmbedUrl(newRoom.template_content.youtube_url);
                                return embedUrl ? (
                                  <iframe
                                    src={embedUrl}
                                    title="YouTube preview"
                                    className="absolute inset-0 w-full h-full rounded-lg"
                                    allowFullScreen
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                                    <p className="text-gray-600 text-sm">유튜브 URL이 올바르지 않습니다.</p>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* 3단계: 질문 입력 */}
              {createStep === 3 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">📝 질문 입력</h4>
                    <p className="text-sm text-blue-700">
                      학생들이 답변할 질문을 입력하세요. 기본 질문이 제공되지만, 활동에 맞게 수정할 수 있습니다.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    {/* 첫 번째 질문 */}
                    <div>
                      <label htmlFor="seeQuestion" className="block text-sm font-medium text-gray-700">
                        {newRoom.thinking_routine_type === 'see-think-wonder' && '1단계: See 질문'}
                        {newRoom.thinking_routine_type === '4c' && '1단계: Connect 질문'}
                        {newRoom.thinking_routine_type === 'circle-of-viewpoints' && '1단계: Viewpoints 질문'}
                        {newRoom.thinking_routine_type === 'connect-extend-challenge' && '1단계: Connect 질문'}
                        {newRoom.thinking_routine_type === 'frayer-model' && '1단계: Definition 질문'}
                        {newRoom.thinking_routine_type === 'used-to-think-now-think' && '1단계: Used to Think 질문'}
                        {newRoom.thinking_routine_type === 'think-puzzle-explore' && '1단계: Think 질문'}
                      </label>
                      <input
                        id="seeQuestion"
                        type="text"
                        required
                        value={newRoom.template_content.see_question}
                        onChange={(e) => setNewRoom({
                          ...newRoom,
                          template_content: { ...newRoom.template_content, see_question: e.target.value }
                        })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder={
                          newRoom.thinking_routine_type === 'see-think-wonder' ? '예: 이 자료에서 무엇을 보았나요?' :
                          newRoom.thinking_routine_type === '4c' ? '예: 이 내용이 이미 알고 있는 것과 어떻게 연결되나요? (Connect)' :
                          newRoom.thinking_routine_type === 'circle-of-viewpoints' ? '예: 이 주제에 대해 다양한 관점을 가질 수 있는 사람들은 누구인가요?' :
                          newRoom.thinking_routine_type === 'connect-extend-challenge' ? '예: 이 내용이 이미 알고 있는 것과 어떻게 연결되나요? (Connect)' :
                          newRoom.thinking_routine_type === 'frayer-model' ? '예: 이 개념을 어떻게 정의하겠나요? (Definition)' :
                          newRoom.thinking_routine_type === 'used-to-think-now-think' ? '예: 이 주제에 대해 이전에 어떻게 생각했나요? (I Used to Think...)' :
                          newRoom.thinking_routine_type === 'think-puzzle-explore' ? '예: 이 주제에 대해 무엇을 알고 있다고 생각하나요? (Think)' :
                          '첫 번째 질문을 입력하세요'
                        }
                      />
                    </div>
                    
                    {/* 두 번째 질문 */}
                    <div>
                      <label htmlFor="thinkQuestion" className="block text-sm font-medium text-gray-700">
                        {newRoom.thinking_routine_type === 'see-think-wonder' && '2단계: Think 질문'}
                        {newRoom.thinking_routine_type === '4c' && '2단계: Challenge 질문'}
                        {newRoom.thinking_routine_type === 'circle-of-viewpoints' && '2단계: Perspective 질문'}
                        {newRoom.thinking_routine_type === 'connect-extend-challenge' && '2단계: Extend 질문'}
                        {newRoom.thinking_routine_type === 'frayer-model' && '2단계: Characteristics 질문'}
                        {newRoom.thinking_routine_type === 'used-to-think-now-think' && '2단계: Now Think 질문'}
                        {newRoom.thinking_routine_type === 'think-puzzle-explore' && '2단계: Puzzle 질문'}
                      </label>
                      <input
                        id="thinkQuestion"
                        type="text"
                        required
                        value={newRoom.template_content.think_question}
                        onChange={(e) => setNewRoom({
                          ...newRoom,
                          template_content: { ...newRoom.template_content, think_question: e.target.value }
                        })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder={
                          newRoom.thinking_routine_type === 'see-think-wonder' ? '예: 이것에 대해 어떻게 생각하나요?' :
                          newRoom.thinking_routine_type === '4c' ? '예: 이 내용에서 어떤 아이디어나 가정에 도전하고 싶나요? (Challenge)' :
                          newRoom.thinking_routine_type === 'circle-of-viewpoints' ? '예: 선택한 관점에서 이 주제를 어떻게 바라볼까요?' :
                          newRoom.thinking_routine_type === 'connect-extend-challenge' ? '예: 이 내용이 당신의 생각을 어떻게 확장시켰나요? (Extend)' :
                          newRoom.thinking_routine_type === 'frayer-model' ? '예: 이 개념의 주요 특징은 무엇인가요? (Characteristics)' :
                          newRoom.thinking_routine_type === 'used-to-think-now-think' ? '예: 지금은 어떻게 생각하나요? (Now I Think...)' :
                          newRoom.thinking_routine_type === 'think-puzzle-explore' ? '예: 무엇이 퍼즐이나 의문점인가요? (Puzzle)' :
                          '두 번째 질문을 입력하세요'
                        }
                      />
                    </div>
                    
                    {/* 세 번째 질문 */}
                    <div>
                      <label htmlFor="wonderQuestion" className="block text-sm font-medium text-gray-700">
                        {newRoom.thinking_routine_type === 'see-think-wonder' && '3단계: Wonder 질문'}
                        {newRoom.thinking_routine_type === '4c' && '3단계: Concepts 질문'}
                        {newRoom.thinking_routine_type === 'circle-of-viewpoints' && '3단계: Questions 질문'}
                        {newRoom.thinking_routine_type === 'connect-extend-challenge' && '3단계: Challenge 질문'}
                        {newRoom.thinking_routine_type === 'frayer-model' && '3단계: Examples 질문'}
                        {newRoom.thinking_routine_type === 'used-to-think-now-think' && '3단계: Why Changed 질문'}
                        {newRoom.thinking_routine_type === 'think-puzzle-explore' && '3단계: Explore 질문'}
                      </label>
                      <input
                        id="wonderQuestion"
                        type="text"
                        required
                        value={newRoom.template_content.wonder_question}
                        onChange={(e) => setNewRoom({
                          ...newRoom,
                          template_content: { ...newRoom.template_content, wonder_question: e.target.value }
                        })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder={
                          newRoom.thinking_routine_type === 'see-think-wonder' ? '예: 이것에 대해 무엇이 궁금한가요?' :
                          newRoom.thinking_routine_type === '4c' ? '예: 이 내용에서 중요하다고 생각하는 핵심 개념은 무엇인가요? (Concepts)' :
                          newRoom.thinking_routine_type === 'circle-of-viewpoints' ? '예: 이 관점에서 가질 수 있는 질문은 무엇인가요?' :
                          newRoom.thinking_routine_type === 'connect-extend-challenge' ? '예: 이 내용에서 어떤 것이 당신에게 도전이 되나요? (Challenge)' :
                          newRoom.thinking_routine_type === 'frayer-model' ? '예: 이 개념의 예시와 반례는 무엇인가요? (Examples & Non-Examples)' :
                          newRoom.thinking_routine_type === 'used-to-think-now-think' ? '예: 생각이 바뀐 이유는 무엇인가요?' :
                          newRoom.thinking_routine_type === 'think-puzzle-explore' ? '예: 이 퍼즐을 어떻게 탐구해보고 싶나요? (Explore)' :
                          '세 번째 질문을 입력하세요'
                        }
                      />
                    </div>
                    
                    {/* 네 번째 질문 (4C만 해당) */}
                    {newRoom.thinking_routine_type === '4c' && (
                      <div>
                        <label htmlFor="fourthQuestion" className="block text-sm font-medium text-gray-700">
                          4단계: Changes 질문
                        </label>
                        <input
                          id="fourthQuestion"
                          type="text"
                          required
                          value={newRoom.template_content.fourth_question || ''}
                          onChange={(e) => setNewRoom({
                            ...newRoom,
                            template_content: { ...newRoom.template_content, fourth_question: e.target.value }
                          })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="예: 이 내용이 당신이나 다른 사람들에게 어떤 변화를 제안하나요? (Changes)"
                        />
                      </div>
                    )}
                  </div>
                  

                </div>
              )}

              {/* 단계별 네비게이션 버튼 */}
              <div className="flex justify-between mt-6">
                <div>
                  {createStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setCreateStep(createStep - 1)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                    >
                      이전
                    </button>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setCreateStep(1);
                    }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    취소
                  </button>
                  {createStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => {
                        // 1단계에서는 사고루틴 타입과 제목이 필수
                        if (createStep === 1 && (!newRoom.thinking_routine_type || !newRoom.title)) {
                          alert('사고루틴 타입과 활동방 제목을 입력해주세요.');
                          return;
                        }
                        setCreateStep(createStep + 1);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      다음
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={createLoading || !newRoom.template_content.see_question || !newRoom.template_content.think_question || !newRoom.template_content.wonder_question || (newRoom.thinking_routine_type === '4c' && !newRoom.template_content.fourth_question)}
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {createLoading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          활동방 생성 중...
                        </span>
                      ) : (
                        '생성'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        )}

        {/* 활동방 목록 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">활동방 리스트</h2>
          </div>

          {rooms.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">아직 생성된 활동방이 없습니다.</p>
              <p className="text-sm text-gray-400 mt-2">위의 버튼을 클릭하여 첫 번째 활동방을 만들어보세요!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {rooms.map((room) => (
                <div key={room.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">{room.title}</h3>
                        {getStatusBadge(room)}
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>코드: <span className="font-mono font-bold text-blue-600">{room.room_code}</span></span>
                        <span>사고루틴: <span className="font-medium text-gray-700">{getThinkingRoutineLabel(room.thinking_routine_type)}</span></span>
                        <span>응답: {room.response_count || 0}개</span>
                        <span>생성일: {new Date(room.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleStatusChange(room.id, room.status === 'active' ? 'draft' : 'active')}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          room.status === 'active' 
                            ? 'bg-red-100 hover:bg-red-200 text-red-700' 
                            : 'bg-green-100 hover:bg-green-200 text-green-700'
                        }`}
                      >
                        {room.status === 'active' ? '비활성화' : '활성화'}
                      </button>
                      <button
                        onClick={() => navigate(`/teacher/room/${room.id}`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                      >
                        관리
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room.id, room.title)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
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

export default TeacherRoomManagement; 