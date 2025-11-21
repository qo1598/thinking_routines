/**
 * 활동방 생성 폼 관리 커스텀 훅
 */

import { useState } from 'react';
import { NewRoomForm } from '../types';

const INITIAL_FORM_STATE: NewRoomForm = {
    title: '',
    description: '',
    thinking_routine_type: '',
    participation_type: 'individual',
    template_content: {
        image_url: '',
        text_content: '',
        youtube_url: '',
        see_question: '이 자료에서 무엇을 보았나요?',
        think_question: '이것에 대해 어떻게 생각하나요?',
        wonder_question: '이것에 대해 무엇이 궁금한가요?',
        fourth_question: ''
    }
};

export const useRoomForm = () => {
    const [newRoom, setNewRoom] = useState<NewRoomForm>(INITIAL_FORM_STATE);
    const [createStep, setCreateStep] = useState(1);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);

    const resetForm = () => {
        setNewRoom(INITIAL_FORM_STATE);
        setCreateStep(1);
        setShowCreateForm(false);
        setCreateLoading(false);
    };

    const handleThinkingRoutineChange = (routineType: string) => {
        setNewRoom(prev => ({
            ...prev,
            thinking_routine_type: routineType,
            template_content: {
                ...prev.template_content,
                see_question: '',
                think_question: '',
                wonder_question: '',
                fourth_question: ''
            }
        }));
    };

    const updateNewRoom = (updates: Partial<NewRoomForm>) => {
        setNewRoom(prev => ({ ...prev, ...updates }));
    };

    const updateTemplateContent = (updates: Partial<typeof INITIAL_FORM_STATE.template_content>) => {
        setNewRoom(prev => ({
            ...prev,
            template_content: { ...prev.template_content, ...updates }
        }));
    };

    return {
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
    };
};
