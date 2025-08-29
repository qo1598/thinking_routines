-- AI 분석과 교사 피드백 컬럼 추가 마이그레이션
-- 실행 날짜: 2024-12-XX

-- student_responses 테이블에 새 컬럼 추가
ALTER TABLE student_responses 
ADD COLUMN ai_analysis TEXT,
ADD COLUMN teacher_feedback TEXT,
ADD COLUMN teacher_score INTEGER CHECK (teacher_score >= 1 AND teacher_score <= 10);

-- 인덱스 추가 (필요시)
CREATE INDEX idx_student_responses_teacher_score ON student_responses(teacher_score);
CREATE INDEX idx_student_responses_feedback ON student_responses(teacher_feedback) WHERE teacher_feedback IS NOT NULL; 