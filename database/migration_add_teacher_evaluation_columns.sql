-- ================================================
-- Teacher Evaluations Table 컬럼 추가 마이그레이션
-- 작성일: 2025-01-25
-- 목적: 사고루틴 유형별 단계별 피드백 및 점수 저장을 위한 컬럼 추가
-- ================================================

-- 1. teacher_evaluations 테이블에 새로운 컬럼들 추가
ALTER TABLE teacher_evaluations 
ADD COLUMN IF NOT EXISTS routine_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS step_feedbacks JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS step_scores JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS overall_feedback TEXT,
ADD COLUMN IF NOT EXISTS overall_score INTEGER CHECK (overall_score >= 1 AND overall_score <= 100);

-- 2. 기존 score 컬럼의 제약 조건 수정 (1-5에서 1-100으로)
ALTER TABLE teacher_evaluations DROP CONSTRAINT IF EXISTS teacher_evaluations_score_check;
ALTER TABLE teacher_evaluations ADD CONSTRAINT teacher_evaluations_score_check 
CHECK (score >= 1 AND score <= 100);

-- 3. routine_type에 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_teacher_evaluations_routine_type ON teacher_evaluations(routine_type);

-- 4. teacher_id에 기본값 설정 (임시 교사 ID)
-- 기존 데이터에 대해 임시 교사 ID 설정
UPDATE teacher_evaluations 
SET teacher_id = (SELECT id FROM teachers LIMIT 1)
WHERE teacher_id IS NULL AND EXISTS (SELECT 1 FROM teachers);

-- 만약 teachers 테이블에 데이터가 없다면 임시 교사 생성
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM teachers) THEN
    INSERT INTO teachers (id, email, name) 
    VALUES (
      uuid_generate_v4(), 
      'temp@teacher.com', 
      '임시 교사'
    );
  END IF;
END $$;

-- 5. teacher_id NOT NULL 제약조건을 우선 완화 (현재 환경에서는 교사 인증이 없으므로)
ALTER TABLE teacher_evaluations ALTER COLUMN teacher_id DROP NOT NULL;

-- 6. 테이블 코멘트 업데이트
COMMENT ON COLUMN teacher_evaluations.routine_type IS '사고루틴 유형 (see-think-wonder, 4c, circle-of-viewpoints, connect-extend-challenge, frayer-model, used-to-think-now-think, think-puzzle-explore)';
COMMENT ON COLUMN teacher_evaluations.step_feedbacks IS '단계별 피드백 JSON (key: 단계명, value: 피드백 내용)';
COMMENT ON COLUMN teacher_evaluations.step_scores IS '단계별 점수 JSON (key: 단계명, value: 점수 1-100)';
COMMENT ON COLUMN teacher_evaluations.overall_feedback IS '전체 종합 피드백';
COMMENT ON COLUMN teacher_evaluations.overall_score IS '전체 종합 점수 (1-100)';

-- 7. 사고루틴 유형별 유효성 검증을 위한 체크 제약조건
ALTER TABLE teacher_evaluations ADD CONSTRAINT teacher_evaluations_routine_type_check 
CHECK (routine_type IN (
  'see-think-wonder', 
  '4c', 
  'circle-of-viewpoints', 
  'connect-extend-challenge', 
  'frayer-model', 
  'used-to-think-now-think', 
  'think-puzzle-explore'
));

-- 8. 기존 데이터 호환성을 위한 데이터 마이그레이션
-- evaluation_data가 있는 경우 새로운 컬럼들로 데이터 이전
UPDATE teacher_evaluations 
SET 
  step_feedbacks = COALESCE(evaluation_data->'step_feedbacks', '{}'),
  step_scores = COALESCE(evaluation_data->'step_scores', '{}'),
  routine_type = evaluation_data->>'routine_type'
WHERE evaluation_data IS NOT NULL;

-- ================================================
-- 마이그레이션 완료 확인 쿼리
-- ================================================

-- 새로 추가된 컬럼들 확인
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'teacher_evaluations' 
AND column_name IN ('routine_type', 'step_feedbacks', 'step_scores', 'overall_feedback', 'overall_score')
ORDER BY ordinal_position;

-- 인덱스 확인
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'teacher_evaluations' 
AND indexname LIKE '%routine_type%';

-- ================================================
-- 마이그레이션 스크립트 완료
-- ================================================
