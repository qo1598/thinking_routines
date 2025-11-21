import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { StudentInfo, ThinkingRoutineResponse } from '../types';

export const checkSystemConfig = (): boolean => {
    return isSupabaseConfigured() && !!supabase;
};

export const fetchRoomData = async (roomId: string) => {
    if (!checkSystemConfig()) throw new Error('시스템 설정이 완료되지 않았습니다.');

    const { data, error } = await supabase
        .from('activity_rooms')
        .select('*')
        .eq('id', roomId)
        .eq('status', 'active')
        .single();

    if (error) throw error;
    return data;
};

export const fetchRoutineTemplate = async (roomId: string) => {
    if (!checkSystemConfig()) throw new Error('시스템 설정이 완료되지 않았습니다.');

    const { data, error } = await supabase
        .from('routine_templates')
        .select('*')
        .eq('room_id', roomId)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
};

export const fetchStudentResponse = async (roomId: string, studentInfo: StudentInfo, isDraft: boolean) => {
    if (!checkSystemConfig()) return null;

    const studentId = `${studentInfo.name}_${studentInfo.grade}_${studentInfo.class}_${studentInfo.number}`;

    const { data, error } = await supabase
        .from('student_responses')
        .select('*')
        .eq('room_id', roomId)
        .eq('student_name', studentInfo.name)
        .eq('student_id', studentId)
        .eq('is_draft', isDraft)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
};

export const saveStudentResponse = async (
    roomId: string,
    studentInfo: StudentInfo,
    responses: ThinkingRoutineResponse,
    isDraft: boolean,
    existingId?: string
) => {
    if (!checkSystemConfig()) throw new Error('시스템 설정이 완료되지 않았습니다.');

    const studentId = `${studentInfo.name}_${studentInfo.grade}_${studentInfo.class}_${studentInfo.number}`;
    const now = new Date().toISOString();

    const payload = {
        room_id: roomId,
        student_id: studentId,
        student_grade: studentInfo.grade,
        student_name: studentInfo.name,
        student_class: studentInfo.class,
        student_number: studentInfo.number ? parseInt(studentInfo.number) : null,
        team_name: studentInfo.groupName || null,
        response_data: responses,
        is_draft: isDraft,
        submitted_at: isDraft ? undefined : now,
        updated_at: now
    };

    if (existingId) {
        const { error } = await supabase
            .from('student_responses')
            .update(payload)
            .eq('id', existingId);
        if (error) throw error;
    } else {
        const { error } = await supabase
            .from('student_responses')
            .insert([payload]);
        if (error) throw error;
    }
};

export const deleteStudentResponse = async (id: string) => {
    if (!checkSystemConfig()) return;

    const { error } = await supabase
        .from('student_responses')
        .delete()
        .eq('id', id);

    if (error) throw error;
};
