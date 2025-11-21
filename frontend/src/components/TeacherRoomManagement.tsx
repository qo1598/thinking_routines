import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeacherAuth } from '../hooks/useTeacherAuth';
import { useRoomManagement } from '../hooks/useRoomManagement';
import { useRoomForm } from '../hooks/useRoomForm';
import { RoomList } from './teacher-room/RoomList';
import { RoomCreationForm } from './teacher-room/RoomCreationForm';

interface TeacherRoomManagementProps {
  onBack: () => void;
}

const TeacherRoomManagement: React.FC<TeacherRoomManagementProps> = ({ onBack }) => {
  const navigate = useNavigate();

  // 커스텀 훅 사용
  const { user, loading: authLoading, checkAuth, handleLogout } = useTeacherAuth();
  const {
    rooms,
    loading: roomsLoading,
    error: roomsError,
    fetchRooms,
    createRoom,
    handleStatusChange,
    handleDeleteRoom
  } = useRoomManagement();

  const {
    newRoom,
    createStep,
    showCreateForm,
    createLoading,
    setCreateStep,
    setShowCreateForm,
    setCreateLoading,
    resetForm,
    handleThinkingRoutineChange,
    updateNewRoom,
    updateTemplateContent
  } = useRoomForm();

  // 인증 확인 및 방 목록 로드
  useEffect(() => {
    checkAuth((userId) => {
      fetchRooms(userId);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setCreateLoading(true);
    const roomCode = await createRoom(newRoom, user.id);

    if (roomCode) {
      alert(`활동방이 생성되었습니다! 방 코드: ${roomCode}`);
      resetForm();
    } else {
      setCreateLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // 인증 실패 시 리다이렉트됨
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="mr-4 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">교사 대시보드</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">
              안녕하세요, <span className="font-semibold text-blue-600">{user.name}</span> 선생님
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 px-3 py-1 rounded"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">나의 활동방 관리</h2>
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              새 활동방 만들기
            </button>
          )}
        </div>

        {roomsError && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{roomsError}</p>
              </div>
            </div>
          </div>
        )}

        {showCreateForm ? (
          <RoomCreationForm
            formData={newRoom}
            currentStep={createStep}
            loading={createLoading}
            onUpdate={updateNewRoom}
            onTemplateUpdate={updateTemplateContent}
            onRoutineChange={handleThinkingRoutineChange}
            onStepChange={setCreateStep}
            onCancel={() => {
              setShowCreateForm(false);
              setCreateStep(1);
            }}
            onSubmit={handleCreateSubmit}
          />
        ) : (
          <RoomList
            rooms={rooms}
            loading={roomsLoading}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteRoom}
            onNavigate={(roomId) => navigate(`/teacher/room/${roomId}`)}
          />
        )}
      </main>
    </div>
  );
};

export default TeacherRoomManagement;