-- 데이터베이스에 image_data 컬럼 추가
-- Supabase SQL Editor에서 실행하세요

-- 1. image_data 컬럼 추가 (base64 이미지 저장용)
ALTER TABLE student_responses 
ADD COLUMN IF NOT EXISTS image_data TEXT;

-- 2. 컬럼 설명 추가
COMMENT ON COLUMN student_responses.image_data 
IS 'Base64 encoded image data (fallback when Supabase storage fails)';

-- 3. 확인 쿼리
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'student_responses' 
AND column_name IN ('image_url', 'image_data')
ORDER BY ordinal_position;
