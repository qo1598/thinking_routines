-- Supabase Storage 설정: routine-uploads 버킷 생성 및 정책 설정
-- 이 스크립트를 Supabase 대시보드의 SQL Editor에서 실행하세요

-- 1. routine-uploads 버킷 생성 (이미 있다면 무시됨)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'routine-uploads', 
  'routine-uploads', 
  true, 
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Public read access for routine images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload routine images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload routine images" ON storage.objects;

-- 3. 공개 읽기 접근 정책 (이미지 URL 접근을 위해 필요)
CREATE POLICY "Public read access for routine images" ON storage.objects
FOR SELECT USING (bucket_id = 'routine-uploads');

-- 4. 업로드 정책 - 인증 없이도 업로드 가능 (교사용 도구이므로)
CREATE POLICY "Users can upload routine images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'routine-uploads');

-- 5. 업데이트 정책 (덮어쓰기 허용)
CREATE POLICY "Users can update routine images" ON storage.objects
FOR UPDATE USING (bucket_id = 'routine-uploads')
WITH CHECK (bucket_id = 'routine-uploads');

-- 6. 삭제 정책
CREATE POLICY "Users can delete routine images" ON storage.objects
FOR DELETE USING (bucket_id = 'routine-uploads');

-- 7. 버킷 설정 확인 쿼리
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'routine-uploads';

-- 8. 정책 확인 쿼리
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%routine%';
