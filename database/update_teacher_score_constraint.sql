-- teacher_score 제약 조건을 1-100점으로 업데이트
-- 실행 날짜: 2024-12-XX

-- 기존 제약 조건 삭제
ALTER TABLE student_responses DROP CONSTRAINT IF EXISTS student_responses_teacher_score_check;

-- 새로운 제약 조건 추가 (1-100점)
ALTER TABLE student_responses ADD CONSTRAINT student_responses_teacher_score_check 
CHECK (teacher_score >= 1 AND teacher_score <= 100); 