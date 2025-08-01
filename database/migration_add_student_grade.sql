-- Migration: Add student_grade column to student_responses table
-- Created: 2025-01-XX (Emergency update)
-- Purpose: Add grade information to all student records

-- Add student_grade column to student_responses table
ALTER TABLE student_responses 
ADD COLUMN student_grade VARCHAR(10); -- 예: "1학년", "2학년", "3학년", "초1", "중1", "고1" 등

-- Add student_class column for better organization (if not exists)
-- Note: student_id currently exists, let's rename it to student_number for clarity
ALTER TABLE student_responses 
ADD COLUMN student_class VARCHAR(20); -- 예: "1반", "2반", "가반", "나반" 등

-- Add student_number column (rename from student_id for clarity)
ALTER TABLE student_responses 
ADD COLUMN student_number INTEGER; -- 번호

-- Add team_name column for group activities
ALTER TABLE student_responses 
ADD COLUMN team_name VARCHAR(50); -- 예: "1모둠", "2모둠" 등

-- Add image_url column for portfolio images
ALTER TABLE student_responses 
ADD COLUMN image_url TEXT; -- Supabase storage URL

-- Add confidence_score for AI analysis confidence
ALTER TABLE student_responses 
ADD COLUMN confidence_score INTEGER; -- AI 분석 신뢰도

-- Add routine_type to easily identify which thinking routine was used
ALTER TABLE student_responses 
ADD COLUMN routine_type VARCHAR(50); -- see-think-wonder, 4c, etc.

-- Create index for grade for better query performance
CREATE INDEX idx_student_responses_grade ON student_responses(student_grade);
CREATE INDEX idx_student_responses_class ON student_responses(student_class);
CREATE INDEX idx_student_responses_routine_type ON student_responses(routine_type);

-- Update RLS policies to include new columns (if needed)
-- The existing policies should still work as they're based on room_id relationships

COMMENT ON COLUMN student_responses.student_grade IS '학생 학년 (예: 1학년, 2학년, 초1, 중1, 고1 등)';
COMMENT ON COLUMN student_responses.student_class IS '학생 반 (예: 1반, 2반, 가반, 나반 등)';
COMMENT ON COLUMN student_responses.student_number IS '학생 번호';
COMMENT ON COLUMN student_responses.team_name IS '모둠명 (모둠 활동인 경우)';
COMMENT ON COLUMN student_responses.image_url IS '포트폴리오 이미지 URL (Supabase storage)';
COMMENT ON COLUMN student_responses.confidence_score IS 'AI 분석 신뢰도 점수';
COMMENT ON COLUMN student_responses.routine_type IS '사고루틴 유형';