import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

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
  stats: {
    total_responses: number;
    template_count: number;
  };
}

interface NewRoomForm {
  title: string;
  description: string;
}

const TeacherDashboard: React.FC = () => {
  const [user, setUser] = useState<Teacher | null>(null);
  const [rooms, setRooms] = useState<ActivityRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRoom, setNewRoom] = useState<NewRoomForm>({
    title: '',
    description: ''
  });
  const [createLoading, setCreateLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/teacher');
      return;
    }

    setUser(JSON.parse(userData));
    fetchRooms();
  }, [navigate]);

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/rooms`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setRooms(response.data.rooms);
    } catch (err: any) {
      setError('활동방 목록을 불러오는데 실패했습니다.');
      console.error('Fetch rooms error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/api/rooms`, newRoom, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setRooms([response.data.room, ...rooms]);
      setNewRoom({ title: '', description: '' });
      setShowCreateForm(false);
      alert('활동방이 생성되었습니다!');
    } catch (err: any) {
      setError(err.response?.data?.error || '활동방 생성에 실패했습니다.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/teacher');
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: '준비중', color: 'bg-gray-100 text-gray-800' },
      active: { label: '활성', color: 'bg-green-100 text-green-800' },
      completed: { label: '완료', color: 'bg-blue-100 text-blue-800' },
      archived: { label: '보관', color: 'bg-yellow-100 text-yellow-800' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.draft;
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
        {statusInfo.label}
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
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={createLoading}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {createLoading ? '생성 중...' : '생성하기'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  취소
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
                        {getStatusBadge(room.status)}
                      </div>
                      {room.description && (
                        <p className="text-sm text-gray-600 mt-1">{room.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>코드: <span className="font-mono font-bold text-primary-600">{room.room_code}</span></span>
                        <span>응답: {room.stats.total_responses}개</span>
                        <span>생성일: {new Date(room.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/teacher/room/${room.id}`)}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded text-sm"
                      >
                        관리
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(room.room_code);
                          alert('코드가 복사되었습니다!');
                        }}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm"
                      >
                        코드 복사
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