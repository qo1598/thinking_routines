/**
 * 사고루틴 결과 저장 관리 커스텀 훅
 * 학생 정보, 분석 결과, 교사 피드백을 Supabase에 저장합니다.
 */

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ParsedAnalysis } from '../types';

interface AnalysisResult {
    extractedText: string;
    analysis: string;
    confidence: number;
}

export const useRoutineStorage = () => {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string>('');

    // 학생 정보
    const [studentGrade, setStudentGrade] = useState('');
    const [studentClass, setStudentClass] = useState('');
    const [studentNumber, setStudentNumber] = useState('');
    const [studentName, setStudentName] = useState('');

    // 모둠 활동 정보
    const [isTeamActivity, setIsTeamActivity] = useState(false);
    const [teamName, setTeamName] = useState('');

    // 교사 피드백
    const [stepFeedbacks, setStepFeedbacks] = useState<{ [key: string]: string }>({});
    const [stepScores, setStepScores] = useState<{ [key: string]: number }>({});
    const [showTeacherFeedback, setShowTeacherFeedback] = useState(false);

    /**
     * 최종 저장 (Supabase에 이미지 + 데이터 저장)
     */
    const handleFinalSave = async (
        uploadedImage: File | null,
        analysisResult: AnalysisResult | null,
        parsedAnalysis: ParsedAnalysis | null,
        selectedRoutine: string | null,
        uploadImageToSupabase: (file: File) => Promise<string | null>,
        onSuccess?: () => void
    ) => {
        if (!uploadedImage || !analysisResult || !studentGrade || !studentClass || !studentNumber || !studentName) {
            setError('모든 필수 정보를 입력해주세요.');
            return;
        }

        setSaving(true);
        setError('');

        try {
            // 1. Supabase에 이미지 업로드 (선택사항)
            let imageUrl: string | null = null;

            try {
                imageUrl = await uploadImageToSupabase(uploadedImage);
                console.log('✅ Supabase 이미지 업로드 성공:', imageUrl);
            } catch (uploadError: any) {
                console.warn('⚠️ Supabase 업로드 실패, base64 fallback 사용:', uploadError.message);

                // 업로드 실패 시 base64로 변환하여 저장
                const reader = new FileReader();
                imageUrl = await new Promise<string>((resolve) => {
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsDataURL(uploadedImage);
                });

                console.log('📦 Base64 fallback 준비 완료, 크기:', imageUrl.length);
                console.info('💡 이미지가 로컬 형식으로 저장됩니다 (Supabase Storage 업로드 실패)');
            }

            // 2. JSON 형식으로 분석 및 피드백 데이터 구조화
            const structuredAnalysis = {
                aiAnalysis: {
                    stepByStep: parsedAnalysis?.stepByStep || '',
                    comprehensive: parsedAnalysis?.comprehensive || '',
                    educational: parsedAnalysis?.educational || '',
                    individualSteps: parsedAnalysis?.individualSteps || {},
                    confidence: analysisResult.confidence,
                    analyzedAt: new Date().toISOString()
                },
                teacherFeedback: {
                    // 개별 단계별 피드백
                    individualSteps: Object.keys(parsedAnalysis?.individualSteps || {}).reduce((acc, stepKey) => {
                        acc[stepKey] = {
                            feedback: stepFeedbacks[stepKey] || '',
                            score: stepScores[stepKey] || null
                        };
                        return acc;
                    }, {} as { [key: string]: { feedback: string, score: number | null } }),
                    feedbackAt: new Date().toISOString()
                },
                routineInfo: {
                    type: selectedRoutine,
                    extractedText: analysisResult.extractedText
                }
            };

            // 3. 데이터베이스에 학생 응답 저장
            const studentResponseData = {
                room_id: null, // 오프라인 활동이므로 null
                student_grade: studentGrade,
                student_name: studentName,
                student_class: studentClass,
                student_number: parseInt(studentNumber),
                student_id: null, // legacy field
                team_name: isTeamActivity ? teamName : null,
                routine_type: selectedRoutine,
                image_url: imageUrl,
                image_data: imageUrl?.startsWith('data:') ? imageUrl : null, // base64 데이터도 저장
                ai_analysis: JSON.stringify(structuredAnalysis), // JSON 형식으로 저장
                teacher_feedback: '', // 레거시 필드는 빈 값으로 유지
                confidence_score: analysisResult.confidence,
                response_data: { // 추출된 학생 응답 데이터 포함
                    type: 'offline_analysis',
                    analysisDate: new Date().toISOString(),
                    originalFileName: uploadedImage.name,
                    routineType: selectedRoutine,
                    analysisComplete: true,
                    extractedText: analysisResult.extractedText,
                    // 파싱된 학생 응답도 저장
                    ...(parsedAnalysis?.individualSteps || {})
                },
                is_draft: false,
                submitted_at: new Date().toISOString(),
                created_at: new Date().toISOString()
            };

            console.log('💾 데이터베이스 저장 시도:', studentResponseData);

            const { error: dbError } = await supabase!
                .from('student_responses')
                .insert(studentResponseData);

            if (dbError) {
                console.error('❌ Database save error:', dbError);

                // RLS 정책 오류인 경우 구체적인 안내
                if (dbError.message?.includes('row-level security') || dbError.message?.includes('policy')) {
                    throw new Error('데이터베이스 보안 정책 오류입니다. 관리자에게 문의하세요.');
                }

                // 컬럼 누락 오류인 경우
                if (dbError.message?.includes('column') && dbError.message?.includes('does not exist')) {
                    throw new Error('데이터베이스 스키마가 업데이트되지 않았습니다. image_data 컬럼을 추가해주세요.');
                }

                throw new Error(`데이터베이스 저장 실패: ${dbError.message}`);
            }

            console.log('✅ 데이터베이스 저장 성공!');

            // 성공 메시지
            alert('학생 결과물이 성공적으로 저장되었습니다!');

            // 성공 콜백 실행
            onSuccess?.();

        } catch (error) {
            console.error('Error saving to database:', error);
            setError('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setSaving(false);
        }
    };

    /**
     * 폼 초기화
     */
    const resetForm = () => {
        setStudentGrade('');
        setStudentName('');
        setStudentClass('');
        setStudentNumber('');
        setTeamName('');
        setIsTeamActivity(false);
        setStepFeedbacks({});
        setStepScores({});
        setShowTeacherFeedback(false);
        setError('');
    };

    return {
        // State
        saving,
        error,
        studentGrade,
        studentClass,
        studentNumber,
        studentName,
        isTeamActivity,
        teamName,
        stepFeedbacks,
        stepScores,
        showTeacherFeedback,

        // Actions
        setError,
        setStudentGrade,
        setStudentClass,
        setStudentNumber,
        setStudentName,
        setIsTeamActivity,
        setTeamName,
        setStepFeedbacks,
        setStepScores,
        setShowTeacherFeedback,
        handleFinalSave,
        resetForm
    };
};
