import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface StudentInfo {
    grade: string;
    class: string;
    number: string;
    name: string;
}

export const useAnalysisStorage = () => {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);

    // 학생 정보 상태
    const [studentInfo, setStudentInfo] = useState<StudentInfo>({
        grade: '',
        class: '',
        number: '',
        name: ''
    });

    const [teamName, setTeamName] = useState('');
    const [isTeamActivity, setIsTeamActivity] = useState(false);
    const [stepFeedbacks, setStepFeedbacks] = useState<{ [key: string]: string }>({});
    const [stepScores, setStepScores] = useState<{ [key: string]: number }>({});

    const handleStudentInfoChange = (field: keyof StudentInfo, value: string) => {
        setStudentInfo(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveResult = async (
        selectedRoutine: string,
        uploadedImage: File | null,
        analysisResult: any
    ) => {
        if (!selectedRoutine || !uploadedImage || !analysisResult) {
            alert('저장할 데이터가 부족합니다.');
            return;
        }

        if (!studentInfo.name) {
            alert('학생 이름을 입력해주세요.');
            return;
        }

        setSaving(true);

        try {
            // 1. 이미지 업로드
            const fileExt = uploadedImage.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `submissions/${fileName}`;

            const { error: uploadError } = await supabase
                .storage
                .from('thinking-routines')
                .upload(filePath, uploadedImage);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('thinking-routines')
                .getPublicUrl(filePath);

            // 2. 데이터베이스 저장
            const { error: dbError } = await supabase
                .from('student_responses')
                .insert({
                    routine_type: selectedRoutine,
                    student_grade: studentInfo.grade,
                    student_class: studentInfo.class,
                    student_number: studentInfo.number,
                    student_name: studentInfo.name,
                    team_name: isTeamActivity ? teamName : null,
                    image_url: publicUrl,
                    ai_analysis: analysisResult.analysis,
                    teacher_feedback: JSON.stringify(stepFeedbacks),
                    teacher_score: Object.values(stepScores).reduce((a, b) => a + b, 0) / Object.keys(stepScores).length || 0,
                    submitted_at: new Date().toISOString()
                });

            if (dbError) throw dbError;

            alert('성공적으로 저장되었습니다!');
            navigate('/teacher/portfolio');

        } catch (error) {
            console.error('Save error:', error);
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    return {
        saving,
        studentInfo,
        teamName,
        isTeamActivity,
        stepFeedbacks,
        stepScores,
        setTeamName,
        setIsTeamActivity,
        setStepFeedbacks,
        setStepScores,
        handleStudentInfoChange,
        handleSaveResult
    };
};
