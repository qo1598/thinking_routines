-- Storage 설정 검증 쿼리
-- Supabase SQL Editor에서 실행하여 설정 상태 확인

-- 1. routine-uploads 버킷 상태 확인
SELECT 
  'BUCKET STATUS' as check_type,
  id,
  name,
  public,
  file_size_limit / 1024 / 1024 as size_limit_mb,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'routine-uploads';

-- 2. 설정된 정책 목록 확인  
SELECT 
  'POLICY STATUS' as check_type,
  policyname,
  permissive,
  roles,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'READ ACCESS'
    WHEN cmd = 'INSERT' THEN 'UPLOAD ACCESS' 
    WHEN cmd = 'UPDATE' THEN 'UPDATE ACCESS'
    WHEN cmd = 'DELETE' THEN 'DELETE ACCESS'
    ELSE cmd
  END as permission_type
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%routine%'
ORDER BY cmd;

-- 3. 간단한 테스트용 더미 확인 (실제 파일은 애플리케이션에서 업로드)
SELECT 
  'UPLOAD TEST' as check_type,
  'Ready for upload' as status,
  'routine-uploads bucket is configured and ready' as message;
