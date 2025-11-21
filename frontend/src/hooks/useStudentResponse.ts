import { useState, useEffect, useCallback } from 'react';
import { StudentInfo, ThinkingRoutineResponse, RoutineTemplate } from '../types';
import { fetchStudentResponse, saveStudentResponse, deleteStudentResponse } from '../services/supabaseService';
import { ROUTINE_CONFIGS } from '../constants/routineConfigs';

export const useStudentResponse = (
    roomId: string | undefined,
    studentInfo: StudentInfo | null,
    template: RoutineTemplate | null
) => {
    const [responses, setResponses] = useState<ThinkingRoutineResponse>({
        see: '',
        think: '',
        wonder: '',
        fourth_step: ''
    });
    const [currentStep, setCurrentStep] = useState<string>('see');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // 초기 데이터 로드
    useEffect(() => {
        if (!roomId || !studentInfo) return;

        const loadData = async () => {
            try {
                // 1. 임시저장 확인
                const draft = await fetchStudentResponse(roomId, studentInfo, true);
                if (draft && draft.response_data) {
                    setResponses(draft.response_data);
                    // 마지막 작성 단계로 이동
                    const data = draft.response_data;
                    if (data.fourth_step?.trim()) setCurrentStep('fourth_step');
                    else if (data.wonder?.trim()) setCurrentStep('wonder');
                    else if (data.think?.trim()) setCurrentStep('think');
                    else if (data.see?.trim()) setCurrentStep('see');

                    alert('이전에 작성하던 내용을 불러왔습니다.');
                    return;
                }

                // 2. 제출된 응답 확인
                const submittedData = await fetchStudentResponse(roomId, studentInfo, false);
                if (submittedData && submittedData.response_data) {
                    setResponses(submittedData.response_data);
                    if (submittedData.response_data.fourth_step) setCurrentStep('fourth_step');
                    else setCurrentStep('wonder');

                    alert('이전에 제출한 응답을 불러왔습니다.');
                }
            } catch (err) {
                console.error('Load response error:', err);
            }
        };

        loadData();
    }, [roomId, studentInfo]);

    // 자동 저장 (Debounce)
    useEffect(() => {
        if (!roomId || !studentInfo || (!responses.see && !responses.think && !responses.wonder)) return;

        const timeoutId = setTimeout(async () => {
            try {
                const existingDraft = await fetchStudentResponse(roomId, studentInfo, true);
                await saveStudentResponse(roomId, studentInfo, responses, true, existingDraft?.id);
            } catch (err) {
                console.error('Auto save error:', err);
            }
        }, 2000);

        return () => clearTimeout(timeoutId);
    }, [responses, roomId, studentInfo]);

    const handleInputChange = (value: string) => {
        setResponses(prev => ({
            ...prev,
            [currentStep]: value
        }));
    };

    const handleNextStep = () => {
        if (!template) return;
        const config = ROUTINE_CONFIGS[template.routine_type];
        if (!config) return;

        const idx = config.steps.indexOf(currentStep);
        if (idx < config.steps.length - 1) {
            setCurrentStep(config.steps[idx + 1]);
        }
    };

    const handlePrevStep = () => {
        if (!template) return;
        const config = ROUTINE_CONFIGS[template.routine_type];
        if (!config) return;

        const idx = config.steps.indexOf(currentStep);
        if (idx > 0) {
            setCurrentStep(config.steps[idx - 1]);
        }
    };

    const handleSubmit = async () => {
        if (!roomId || !studentInfo || !template) return;

        const config = ROUTINE_CONFIGS[template.routine_type];
        const allCompleted = config.steps.every(step => {
            const val = responses[step];
            return val && val.trim();
        });

        if (!allCompleted) {
            alert('모든 단계를 완료해주세요.');
            return;
        }

        setSubmitting(true);
        try {
            // 임시저장 삭제
            const draft = await fetchStudentResponse(roomId, studentInfo, true);
            if (draft) await deleteStudentResponse(draft.id);

            // 정식 제출 (기존 제출 확인 후 업데이트 또는 생성)
            const existing = await fetchStudentResponse(roomId, studentInfo, false);
            await saveStudentResponse(roomId, studentInfo, responses, false, existing?.id);

            setSubmitted(true);
            alert('제출이 완료되었습니다!');
        } catch (err) {
            console.error('Submit error:', err);
            alert('제출에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    return {
        responses,
        currentStep,
        setCurrentStep,
        submitting,
        submitted,
        handleInputChange,
        handleNextStep,
        handlePrevStep,
        handleSubmit
    };
};
