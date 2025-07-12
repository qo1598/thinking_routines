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
}

// 6자리 숫자 코드 생성 함수
const generateRoomCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const TeacherDashboard: React.FC = () => {
  const [user, setUser] = useState<Teacher | null>(null);
  const [rooms, setRooms] = useState<ActivityRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRoom, setNewRoom] = useState<NewRoomForm>({
    title: '',
    description: '',
    thinking_routine_type: 'see-think-wonder'
  });
  const [createLoading, setCreateLoading] = useState(false);

  const navigate = useNavigate();

  // 사고루틴 옵션
  const thinkingRoutineOptions = [
    { value: 'see-think-wonder', label: 'See-Think-Wonder' },
    { value: 'connect-extend-challenge', label: 'Connect-Extend-Challenge' },
    { value: 'what-makes-you-say-that', label: 'What Makes You Say That?' },
    { value: 'think-pair-share', label: 'Think-Pair-Share' }
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
      const { data: roomsData, error } = await supabase
        .from('activity_rooms')
        .select(`
          *,
          student_responses(count)
        `)
        .eq('teacher_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch rooms error:', error);
        setError('활동방 목록을 불러오는데 실패했습니다.');
      } else {
        // 응답 수 계산
        const roomsWithCount = roomsData.map(room => ({
          ...room,
          response_count: room.student_responses?.length || 0
        }));
        setRooms(roomsWithCount);
      }
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

      const newRoomWithCount = {
        ...roomData,
        response_count: 0
      };

      setRooms([newRoomWithCount, ...rooms]);
      setNewRoom({ title: '', description: '', thinking_routine_type: 'see-think-wonder' });
      setShowCreateForm(false);
      alert(`활동방이 생성되었습니다! 방 코드: ${roomCode}`);
    } catch (err) {
      console.error('Create room error:', err);
      setError('활동방 생성 중 오류가 발생했습니다.');
    } finally {
      setCreateLoading(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">교사 대시보드</h1>
              <p className="text-sm text-gray-600">안녕하세요, {user?.name}님!</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              로그아웃
            </button>
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
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            + 새 활동방 만들기
          </button>
        </div>

        {/* 활동방 생성 폼 */}
        {showCreateForm && (
          <div className="mb-6 bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">새 활동방 만들기</h3>
            <form onSubmit={handleCreateRoom} className="space-y-4">
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="예: 미술 작품 감상하기"
                />
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="활동방에 대한 간단한 설명을 입력하세요"
                />
              </div>
              <div>
                <label htmlFor="thinkingRoutineType" className="block text-sm font-medium text-gray-700">
                  사고루틴 타입
                </label>
                <select
                  id="thinkingRoutineType"
                  value={newRoom.thinking_routine_type}
                  onChange={(e) => setNewRoom({...newRoom, thinking_routine_type: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  {thinkingRoutineOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {createLoading ? '생성 중...' : '활동방 생성'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 활동방 목록 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">내 활동방</h2>
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
                      {room.description && (
                        <p className="text-sm text-gray-600 mt-1">{room.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>코드: <span className="font-mono font-bold text-primary-600">{room.room_code}</span></span>
                        <span>응답: {room.response_count || 0}개</span>
                        <span>생성일: {new Date(room.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(room.room_code);
                          alert('코드가 복사되었습니다!');
                        }}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm"
                      >
                        코드 복사
                      </button>
                      <button
                        onClick={() => navigate(`/teacher/room/${room.id}`)}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded text-sm"
                      >
                        관리
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

export default TeacherDashboard; 