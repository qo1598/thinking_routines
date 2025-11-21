/**
 * 학생 활동 상세 정보 로딩 커스텀 훅
 */

import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getRoutineTypeLabel } from '../lib/activityDetailUtils';

export interface ActivityData {
    id: string;
    room_id: string | null;
    room_title: string;
    routine_type: string;
    submitted_at: string;
    student_name: string;
    student_grade?: string;
    student_class?: string;
    student_number?: number;
    team_name?: string;
    response_data?: any;
    ai_analysis?: string;
    teacher_feedback?: string;
    teacher_score?: number;
    activity_type: 'online' | 'offline';
    image_url?: string;
    image_data?: string;
    confidence_score?: number;
    room_description?: string;
    room_thinking_routine_type?: string;
    template_content?: any;
}

export const useActivityDetail = (activityId: string | undefined) => {
    const [activity, setActivity] = useState<ActivityData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (activityId) {
            loadActivityDetail();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activityId]);

    const loadActivityDetail = async () => {
        if (!isSupabaseConfigured() || !supabase) {
            setError('시스템 설정이 완료되지 않았습니다.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError('');

            // 먼저 기본 학생 응답 데이터 가져오기
            const { data: basicData, error: basicError } = await supabase
                .from('student_responses')
                .select(`
          id,
          room_id,
          student_name,
          student_grade,
          student_class,
          student_number,
          team_name,
          routine_type,
          image_url,
          image_data,
          response_data,
          ai_analysis,
          teacher_feedback,
          teacher_score,
          confidence_score,
          submitted_at
        `)
                .eq('id', activityId)
                .single();

            if (basicError) {
                throw new Error(`활동 데이터를 불러올 수 없습니다: ${basicError.message}`);
            }

            if (!basicData) {
                throw new Error('해당 활동을 찾을 수 없습니다.');
            }

            // 온라인 활동인 경우에만 활동방과 템플릿 정보 추가로 가져오기
            let roomData = null;
            let templateData = null;

            if (basicData.room_id) {
                // 활동방 정보 가져오기
                const { data: roomInfo, error: roomError } = await supabase
                    .from('activity_rooms')
                    .select('title, description, thinking_routine_type')
                    .eq('id', basicData.room_id)
                    .single();

                if (!roomError && roomInfo) {
                    roomData = roomInfo;

                    // 템플릿 정보 가져오기
                    const { data: templateInfo, error: templateError } = await supabase
                        .from('routine_templates')
                        .select('content')
                        .eq('room_id', basicData.room_id)
                        .single();

                    if (!templateError && templateInfo) {
                        templateData = templateInfo;
                    }
                }
            }

            const data = {
                ...basicData,
                activity_rooms: roomData,
                routine_templates: templateData
            };

            // 활동 타입 결정 (온라인/오프라인)
            const activityType = data.room_id ? 'online' : 'offline';

            const activityData: ActivityData = {
                id: data.id,
                room_id: data.room_id,
                room_title: activityType === 'online'
                    ? (data.activity_rooms as any)?.title || '활동방'
                    : `${getRoutineTypeLabel(data.routine_type || 'see-think-wonder')} 분석`,
                routine_type: data.routine_type || (data.activity_rooms as any)?.thinking_routine_type || 'see-think-wonder',
                submitted_at: data.submitted_at,
                student_name: data.student_name,
                student_grade: data.student_grade,
                student_class: data.student_class,
                student_number: data.student_number,
                team_name: data.team_name,
                response_data: data.response_data,
                ai_analysis: data.ai_analysis,
                teacher_feedback: data.teacher_feedback,
                teacher_score: data.teacher_score,
                activity_type: activityType,
                image_url: data.image_url,
                image_data: data.image_data,
                confidence_score: data.confidence_score,
                // 온라인 활동용 추가 데이터
                room_description: (data.activity_rooms as any)?.description,
                room_thinking_routine_type: (data.activity_rooms as any)?.thinking_routine_type,
                template_content: (data.routine_templates as any)?.content
            };

            setActivity(activityData);

        } catch (err: any) {
            console.error('Activity detail loading error:', err);
            setError(err.message || '활동 상세 정보를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return {
        activity,
        loading,
        error,
        reload: loadActivityDetail
    };
};
