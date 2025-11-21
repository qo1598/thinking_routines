/**
 * 학생 검색 및 활동 내역 조회 커스텀 훅
 */

import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { StudentInfo, ActivityRoom, getRoutineTypeLabel } from '../lib/portfolioUtils';

export interface SearchForm {
    grade: string;
    class: string;
    number: string;
    name: string;
}

export const useStudentSearch = () => {
    const [allActivities, setAllActivities] = useState<ActivityRoom[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const performSearch = async (searchForm: SearchForm) => {
        if (!searchForm.name.trim()) {
            setError('학생 이름을 입력해주세요.');
            return;
        }

        if (!isSupabaseConfigured() || !supabase) {
            setError('시스템 설정이 완료되지 않았습니다.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // 학생 정보 설정
            const studentInfo: StudentInfo = {
                student_grade: searchForm.grade,
                student_name: searchForm.name,
                student_class: searchForm.class,
                student_number: searchForm.number ? parseInt(searchForm.number) : undefined
            };

            // 1. 온라인 활동 가져오기 (room_id가 있는 것)
            let onlineQuery = supabase
                .from('student_responses')
                .select(`
          id,
          room_id,
          student_grade,
          student_name,
          student_class,
          student_number,
          team_name,
          response_data,
          ai_analysis,
          teacher_feedback,
          teacher_score,
          submitted_at,
          activity_rooms!inner(title, thinking_routine_type)
        `)
                .eq('student_name', searchForm.name)
                .eq('is_draft', false)
                .not('room_id', 'is', null); // room_id가 있는 것만 (온라인 활동)

            // 2. 오프라인 활동 가져오기 (room_id가 null인 것)
            let offlineQuery = supabase
                .from('student_responses')
                .select(`
          id,
          room_id,
          student_grade,
          student_name,
          student_class,
          student_number,
          team_name,
          routine_type,
          image_url,
          response_data,
          ai_analysis,
          teacher_feedback,
          teacher_score,
          confidence_score,
          submitted_at
        `)
                .eq('student_name', searchForm.name)
                .eq('is_draft', false)
                .is('room_id', null); // room_id가 null인 것만 (오프라인 활동)

            // 필터 적용 - 온라인
            if (searchForm.grade) onlineQuery = onlineQuery.eq('student_grade', searchForm.grade);
            if (searchForm.class) onlineQuery = onlineQuery.eq('student_class', searchForm.class);
            if (searchForm.number) onlineQuery = onlineQuery.eq('student_number', parseInt(searchForm.number));

            // 필터 적용 - 오프라인
            if (searchForm.grade) offlineQuery = offlineQuery.eq('student_grade', searchForm.grade);
            if (searchForm.class) offlineQuery = offlineQuery.eq('student_class', searchForm.class);
            if (searchForm.number) offlineQuery = offlineQuery.eq('student_number', parseInt(searchForm.number));

            // 두 쿼리 병렬 실행
            const [onlineResult, offlineResult] = await Promise.all([
                onlineQuery,
                offlineQuery
            ]);

            const { data: onlineData, error: onlineError } = onlineResult;
            const { data: offlineData, error: offlineError } = offlineResult;

            if (onlineError) throw onlineError;
            if (offlineError) throw offlineError;

            console.log('🔍 온라인 활동 데이터:', onlineData);
            console.log('🔍 오프라인 활동 데이터:', offlineData);

            // 온라인 활동 처리
            const onlineActivities: ActivityRoom[] = onlineData?.map(item => ({
                id: item.id,
                room_id: item.room_id,
                room_title: (item.activity_rooms as any)?.title || '활동방',
                routine_type: (item.activity_rooms as any)?.thinking_routine_type || 'see-think-wonder',
                submitted_at: item.submitted_at,
                team_name: item.team_name,
                response_data: item.response_data,
                ai_analysis: item.ai_analysis,
                teacher_feedback: item.teacher_feedback,
                teacher_score: item.teacher_score,
                activity_type: 'online' as const,
                selected: false
            })) || [];

            // 오프라인 활동 처리
            const offlineActivities: ActivityRoom[] = offlineData?.map(item => ({
                id: item.id,
                room_id: null,
                room_title: `${getRoutineTypeLabel(item.routine_type)} 분석`,
                routine_type: item.routine_type || 'see-think-wonder',
                submitted_at: item.submitted_at,
                team_name: item.team_name,
                response_data: item.response_data,
                ai_analysis: item.ai_analysis,
                teacher_feedback: item.teacher_feedback,
                teacher_score: item.teacher_score,
                activity_type: 'offline' as const,
                image_url: item.image_url,
                confidence_score: item.confidence_score,
                selected: false
            })) || [];

            // 두 활동을 합쳐서 시간순 정렬
            const activityRooms = [...onlineActivities, ...offlineActivities]
                .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

            setAllActivities(activityRooms);
            setSelectedStudent(studentInfo);

        } catch (err) {
            console.error('Student search error:', err);
            setError('학생 활동 내역을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return {
        allActivities,
        selectedStudent,
        loading,
        error,
        performSearch,
        setError,
        setAllActivities,
        setSelectedStudent
    };
};
