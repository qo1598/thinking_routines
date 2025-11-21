/**
 * 교사 인증 관리 커스텀 훅
 * 로그인 확인, 사용자 정보 관리, 로그아웃 등을 담당합니다.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Teacher } from '../types';

export const useTeacherAuth = () => {
    const [user, setUser] = useState<Teacher | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    /**
     * 인증 확인 및 사용자 정보 로드
     */
    const checkAuth = async (onSuccess?: (userId: string) => void) => {
        if (!isSupabaseConfigured() || !supabase) {
            navigate('/teacher');
            return;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                navigate('/teacher');
                return;
            }

            // 사용자 정보 upsert (없으면 생성, 있으면 업데이트)
            const { data: teacherData, error: upsertError } = await supabase
                .from('teachers')
                .upsert([
                    {
                        id: session.user.id,
                        email: session.user.email,
                        name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
                        created_at: new Date().toISOString()
                    }
                ], {
                    onConflict: 'id'
                })
                .select()
                .single();

            if (upsertError) {
                console.error('Teacher upsert error:', upsertError);
                navigate('/teacher');
                return;
            }

            setUser(teacherData);
            setLoading(false);

            // 성공 콜백 실행
            if (onSuccess) {
                onSuccess(session.user.id);
            }
        } catch (error) {
            console.error('Auth check error:', error);
            navigate('/teacher');
            setLoading(false);
        }
    };

    /**
     * 로그아웃
     */
    const handleLogout = async () => {
        if (supabase) {
            await supabase.auth.signOut();
        }
        navigate('/teacher');
    };

    /**
     * 컴포넌트 마운트 시 인증 확인
     */
    useEffect(() => {
        checkAuth();
    }, []);

    return {
        user,
        loading,
        checkAuth,
        handleLogout
    };
};
