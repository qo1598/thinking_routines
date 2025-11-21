/**
/**
 * 활동방 관리 커스텀 훅
 * 활동방 목록 조회, 생성, 수정, 삭제 등을 담당합니다.
 */

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ActivityRoom, NewRoomForm } from '../types';
import { generateRoomCode } from '../lib/roomUtils';

export const useRoomManagement = () => {
    const [rooms, setRooms] = useState<ActivityRoom[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    /**
     * 활동방 목록 조회
     */
    const fetchRooms = async (userId: string) => {
        if (!supabase) return;

        setLoading(true);
        try {
            // 활동방 목록 가져오기
            const { data: roomsData, error } = await supabase
                .from('activity_rooms')
                .select('*')
                .eq('teacher_id', userId)
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Fetch rooms error:', error);
                setError('활동방 목록을 불러오는데 실패했습니다.');
                return;
            }

            // 각 활동방의 응답 개수 조회
            const roomsWithCount = await Promise.all(
                roomsData.map(async (room) => {
                    if (!supabase) return { ...room, response_count: 0 };

                    const { count, error: countError } = await supabase
                        .from('student_responses')
                        .select('*', { count: 'exact', head: true })
                        .eq('room_id', room.id)
                        .eq('is_draft', false);

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

    /**
     * 활동방 생성
     */
    const createRoom = async (newRoom: NewRoomForm, userId: string): Promise<string | null> => {
        if (!supabase) {
            setError('시스템 설정이 완료되지 않았습니다.');
            return null;
        }

        try {
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
                return null;
            }

            const { data: roomData, error } = await supabase
                .from('activity_rooms')
                .insert([
                    {
                        teacher_id: userId,
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
                return null;
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
                    alert('활동방은 생성되었지만 템플릿 저장에 실패했습니다. 나중에 활동방 관리에서 설정할 수 있습니다.');
                }
            }

            const newRoomWithCount = {
                ...roomData,
                response_count: 0
            };

            setRooms([newRoomWithCount, ...rooms]);
            return roomCode;
        } catch (err) {
            console.error('Create room error:', err);
            setError('활동방 생성 중 오류가 발생했습니다.');
            return null;
        }
    };

    /**
     * 활동방 상태 변경
     */
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

    /**
     * 활동방 삭제
     */
    const handleDeleteRoom = async (roomId: string, roomTitle: string) => {
        if (!supabase) return;

        const confirmed = window.confirm(
            `'${roomTitle}' 활동방을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 해당 활동방의 모든 학생 응답도 함께 삭제됩니다.`
        );

        if (!confirmed) return;

        try {
            // 학생 응답 삭제
            const { error: responsesError } = await supabase
                .from('student_responses')
                .delete()
                .eq('room_id', roomId);

            if (responsesError) {
                console.error('Delete responses error:', responsesError);
                setError('학생 응답 삭제에 실패했습니다.');
                return;
            }

            // 템플릿 삭제
            await supabase
                .from('routine_templates')
                .delete()
                .eq('room_id', roomId);

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

            // 로컬 상태에서 제거
            setRooms(rooms.filter(room => room.id !== roomId));
            alert('활동방이 삭제되었습니다.');
        } catch (err) {
            console.error('Delete room error:', err);
            setError('활동방 삭제 중 오류가 발생했습니다.');
        }
    };

    return {
        rooms,
        loading,
        error,
        setError,
        setRooms,
        fetchRooms,
        createRoom,
        handleStatusChange,
        handleDeleteRoom
    };
};
