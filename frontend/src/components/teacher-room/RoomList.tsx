import React from 'react';
import { ActivityRoom } from '../../types';
import { RoomCard } from './RoomCard';

interface RoomListProps {
    rooms: ActivityRoom[];
    loading: boolean;
    onStatusChange: (roomId: string, newStatus: string) => void;
    onDelete: (roomId: string, roomTitle: string) => void;
    onNavigate: (roomId: string) => void;
}

export const RoomList: React.FC<RoomListProps> = ({
    rooms,
    loading,
    onStatusChange,
    onDelete,
    onNavigate
}) => {
    if (loading) {
        return (
            <div className="bg-white shadow-sm rounded-lg p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">활동방 목록을 불러오는 중...</p>
            </div>
        );
    }

    return (
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
                        <RoomCard
                            key={room.id}
                            room={room}
                            onStatusChange={onStatusChange}
                            onDelete={onDelete}
                            onNavigate={onNavigate}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
