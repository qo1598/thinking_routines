-- 오프라인 사고루틴 분석을 위한 RLS 정책 수정
-- Supabase SQL Editor에서 실행하세요

-- 1. 오프라인 활동 저장을 위한 새 정책 추가
CREATE POLICY "Allow offline routine analysis insertion" ON student_responses
FOR INSERT WITH CHECK (
  room_id IS NULL -- 오프라인 활동 (room_id가 null인 경우)
  AND routine_type IS NOT NULL -- 사고루틴 타입이 있어야 함
);

-- 2. 오프라인 활동 읽기 정책 추가
CREATE POLICY "Allow offline routine analysis reading" ON student_responses
FOR SELECT USING (
  room_id IS NULL -- 오프라인 활동
  AND is_draft = false -- 임시저장이 아닌 완료된 활동
);

-- 3. 기존 정책 확인 쿼리
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'student_responses' 
AND schemaname = 'public'
ORDER BY cmd, policyname;
