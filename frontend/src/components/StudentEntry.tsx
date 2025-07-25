import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface ActivityRoom {
  id: string;
  title: string;
  description: string;
  room_code: string;
  thinking_routine_type: string;
  status: string;
  teachers?: Array<{
    name: string;
  }>;
}

const StudentEntry: React.FC = () => {
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [room, setRoom] = useState<ActivityRoom | null>(null);
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [studentNumber, setStudentNumber] = useState('');

  const navigate = useNavigate();

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSupabaseConfigured() || !supabase) {
      setError('시스템 설정이 완료되지 않았습니다.');
      return;
    }

    setLoading(true);
    setError('');

    // 6자리 숫자 코드 검증
    if (!/^\d{6}$/.test(roomCode)) {
      setError('6자리 숫자 코드를 입력해주세요.');
      setLoading(false);
      return;
    }

    try {
      const { data: roomData, error } = await supabase
        .from('activity_rooms')
        .select(`
          id,
          title,
          description,
          room_code,
          thinking_routine_type,
          status
        `)
        .eq('room_code', roomCode)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError('존재하지 않는 방 코드입니다. 코드를 확인해주세요.');
        } else {
          console.error('Room fetch error:', error);
          setError('활동방 조회에 실패했습니다. 다시 시도해주세요.');
        }
        return;
      }

      // 활동방 상태 확인
      if (roomData.status !== 'active') {
        setError('현재 참여할 수 없는 활동방입니다. 선생님께 문의하세요.');
        return;
      }

      setRoom(roomData);
    } catch (err) {
      console.error('Room fetch error:', err);
      setError('활동방 조회에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = () => {
    if (!studentName.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    // 학생 정보를 로컬 스토리지에 저장
    const studentInfo = {
      name: studentName,
      class: studentClass,
      number: studentNumber,
      roomId: room?.id,
      roomCode: roomCode
    };
    
    localStorage.setItem('studentInfo', JSON.stringify(studentInfo));
    
    // 사고루틴 페이지로 이동
    navigate(`/student/activity/${room?.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-blue-100 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            사고루틴 활동하기
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            선생님께서 제공한 6자리 숫자 코드를 입력하세요
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {!room ? (
            <form onSubmit={handleCodeSubmit} className="space-y-6">
              <div>
                <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700">
                  활동방 코드
                </label>
                <input
                  id="roomCode"
                  type="text"
                  required
                  value={roomCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // 숫자만 허용
                    setRoomCode(value);
                  }}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-secondary-500 focus:border-secondary-500 text-center text-2xl font-mono tracking-widest"
                  placeholder="123456"
                  maxLength={6}
                />
                <p className="mt-2 text-xs text-gray-500 text-center">
                  6자리 숫자 코드를 입력하세요
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || roomCode.length !== 6}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary-600 hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 disabled:opacity-50"
              >
                {loading ? '확인 중...' : '입장하기'}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              {/* 활동방 정보 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-2 text-center">
                  {room.title}
                </h3>
                {room.description && (
                  <p className="text-sm text-gray-600 mb-3 text-center">
                    {room.description}
                  </p>
                )}
                <div className="flex justify-center">
                  <span className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-medium">
                    {(() => {
                      const labels: { [key: string]: string } = {
                        'see-think-wonder': 'See-Think-Wonder',
                        '4c': '4C',
                        'circle-of-viewpoints': 'Circle of Viewpoints',
                        'connect-extend-challenge': 'Connect-Extend-Challenge',
                        'frayer-model': 'Frayer Model',
                        'used-to-think-now-think': 'I Used to Think... Now I Think...',
                        'think-puzzle-explore': 'Think-Puzzle-Explore'
                      };
                      return labels[room.thinking_routine_type] || room.thinking_routine_type;
                    })()}
                  </span>
                </div>
              </div>

              {/* 학생 정보 입력 */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="studentName" className="block text-sm font-medium text-gray-700">
                    이름 *
                  </label>
                  <input
                    id="studentName"
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-secondary-500 focus:border-secondary-500"
                    placeholder="이름을 입력하세요"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="studentClass" className="block text-sm font-medium text-gray-700">
                      반
                    </label>
                    <select
                      id="studentClass"
                      value={studentClass}
                      onChange={(e) => setStudentClass(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-secondary-500 focus:border-secondary-500"
                    >
                      <option value="">선택</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                        <option key={num} value={num}>{num}반</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="studentNumber" className="block text-sm font-medium text-gray-700">
                      번호
                    </label>
                    <select
                      id="studentNumber"
                      value={studentNumber}
                      onChange={(e) => setStudentNumber(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-secondary-500 focus:border-secondary-500"
                    >
                      <option value="">선택</option>
                      {Array.from({length: 30}, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>{num}번</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <button
                  onClick={handleJoinRoom}
                  disabled={!studentName.trim()}
                  className="w-full bg-secondary-600 hover:bg-secondary-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                >
                  활동 시작하기
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 도움말 */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            활동방 코드를 모르시나요? 선생님께 문의하세요.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentEntry; 
