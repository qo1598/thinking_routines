import React from 'react';
import { ActivityRoom } from '../../types';
import { getThinkingRoutineLabel } from '../../lib/roomUtils';

interface RoomCardProps {
    room: ActivityRoom;
    onStatusChange: (roomId: string, newStatus: string) => void;
    onDelete: (roomId: string, roomTitle: string) => void;
    onNavigate: (roomId: string) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({
    room,
    onStatusChange,
    onDelete,
    onNavigate
}) => {
    const getStatusBadge = (status: string) => {
        if (status === 'active') {
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">진행중</span>;
        }
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">종료됨</span>;
    };

    return (
        <div className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">{room.title}</h3>
                        {getStatusBadge(room.status)}
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
                        onClick={() => onStatusChange(room.id, room.status === 'active' ? 'draft' : 'active')}
                        className={`px-3 py-1 rounded text-sm font-medium ${room.status === 'active'
                                ? 'bg-red-100 hover:bg-red-200 text-red-700'
                                : 'bg-green-100 hover:bg-green-200 text-green-700'
                            }`}
                    >
                        {room.status === 'active' ? '비활성화' : '활성화'}
                    </button>
                    <button
                        onClick={() => onNavigate(room.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                    >
                        관리
                    </button>
                    <button
                        onClick={() => onDelete(room.id, room.title)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                    >
                        삭제
                    </button>
                </div>
            </div>
        </div>
    );
};
