/**
 * 학생 포트폴리오 유틸리티 함수
 */

import { routineTypeLabels } from './thinkingRoutineUtils';

export interface StudentInfo {
    student_grade?: string;
    student_name: string;
    student_class?: string;
    student_number?: number;
}

export interface ActivityRoom {
    id: string;
    room_id: string | null;
    room_title: string;
    routine_type: string;
    submitted_at: string;
    team_name?: string;
    response_data?: any;
    ai_analysis?: string;
    teacher_feedback?: string;
    teacher_score?: number;
    activity_type?: 'online' | 'offline';
    image_url?: string;
    confidence_score?: number;
    selected?: boolean;
}

/**
 * 날짜를 한국어 형식으로 포맷팅
 */
export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

/**
 * 학생 정보를 텍스트로 변환
 */
export const getStudentInfoText = (student: StudentInfo | null): string => {
    if (!student) return '';
    const parts = [];
    if (student.student_grade) parts.push(student.student_grade);
    if (student.student_class) parts.push(`${student.student_class}반`);
    if (student.student_number) parts.push(`${student.student_number}번`);
    if (student.student_name) parts.push(student.student_name);
    return parts.join(' ');
};

/**
 * 사고루틴 타입 라벨 반환
 */
export const getRoutineTypeLabel = (routineType: string): string => {
    return routineTypeLabels[routineType] || routineType;
};

/**
 * 인쇄용 HTML 생성
 */
export const generatePrintContent = (
    selectedActivities: ActivityRoom[],
    studentInfo: StudentInfo | null
): string => {
    const studentInfoText = getStudentInfoText(studentInfo);

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${studentInfo?.student_name} 사고루틴 포트폴리오</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .student-info { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .activity { margin-bottom: 40px; border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
        .activity-header { background: #f5f5f5; padding: 10px; margin: -20px -20px 20px -20px; }
        .activity-title { font-size: 16px; font-weight: bold; color: #333; }
        .activity-meta { font-size: 12px; color: #666; margin-top: 5px; }
        .response-section { margin-top: 15px; }
        .response-title { font-weight: bold; color: #444; margin-bottom: 5px; }
        .response-content { background: #f9f9f9; padding: 10px; border-radius: 4px; margin-bottom: 10px; }
        .feedback-section { background: #e8f4fd; padding: 15px; border-radius: 4px; margin-top: 15px; }
        .score { color: #e67e22; font-weight: bold; }
        @media print { 
          body { margin: 0; } 
          .activity { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>사고루틴 포트폴리오</h1>
        <div class="student-info">${studentInfoText}</div>
        <div>생성일: ${new Date().toLocaleDateString('ko-KR')}</div>
      </div>
      
      ${selectedActivities.map(activity => `
        <div class="activity">
          <div class="activity-header">
            <div class="activity-title">
              ${getRoutineTypeLabel(activity.routine_type)}
              <span style="color: #666; font-size: 12px; margin-left: 10px;">
                (${activity.activity_type === 'online' ? '온라인' : '오프라인'} 활동)
              </span>
            </div>
            <div class="activity-meta">
              활동방: ${activity.room_title} | 
              제출일: ${new Date(activity.submitted_at).toLocaleDateString('ko-KR')} |
              ${activity.team_name ? `모둠: ${activity.team_name}` : '개별 활동'}
            </div>
          </div>
          
          ${activity.response_data ? `
            <div class="response-section">
              ${Object.entries(activity.response_data).map(([key, value]) => {
        if (!value || (key === 'fourth_step' && !value)) return '';
        const labels: any = {
            see: 'See (관찰/연결)',
            think: 'Think (생각/도전)',
            wonder: 'Wonder (궁금증/개념)',
            fourth_step: 'Changes (변화)'
        };
        return `
                  <div class="response-title">${labels[key] || key}:</div>
                  <div class="response-content">${value}</div>
                `;
    }).join('')}
            </div>
          ` : ''}
          
          ${activity.ai_analysis ? `
            <div class="feedback-section">
              <div class="response-title">AI 분석 결과:</div>
              <div>${activity.ai_analysis.replace(/\n/g, '<br>')}</div>
            </div>
          ` : ''}
          
          ${activity.teacher_feedback ? `
            <div class="feedback-section">
              <div class="response-title">교사 피드백:</div>
              <div>${activity.teacher_feedback}</div>
              ${activity.teacher_score ? `<div class="score">점수: ${activity.teacher_score}점</div>` : ''}
            </div>
          ` : ''}
        </div>
      `).join('')}
    </body>
    </html>
  `;
};
