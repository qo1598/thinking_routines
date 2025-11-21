import { useState, useEffect, useCallback } from 'react';
import { ActivityRoom, RoutineTemplate } from '../types';
import { fetchRoomData, fetchRoutineTemplate } from '../services/supabaseService';

export const useRoutineData = (roomId: string | undefined) => {
    const [room, setRoom] = useState<ActivityRoom | null>(null);
    const [template, setTemplate] = useState<RoutineTemplate | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        if (!roomId) {
            setError('활동방 ID가 없습니다.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const [roomData, templateData] = await Promise.all([
                fetchRoomData(roomId),
                fetchRoutineTemplate(roomId)
            ]);

            setRoom(roomData);
            setTemplate(templateData);
        } catch (err: any) {
            console.error('Fetch error:', err);
            setError(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    }, [roomId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { room, template, loading, error };
};
