-- room_id NOT NULL 제약조건 수정
-- 오프라인 활동을 위해 room_id가 NULL을 허용하도록 수정

-- 1. 현재 student_responses 테이블의 제약조건 확인
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'student_responses'::regclass
AND contype IN ('c', 'f') -- check, foreign key
ORDER BY conname;

-- 2. room_id 컬럼의 NOT NULL 제약조건 제거
ALTER TABLE student_responses 
ALTER COLUMN room_id DROP NOT NULL;

-- 3. 확인: room_id 컬럼이 nullable인지 체크
SELECT 
    column_name,
    is_nullable,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'student_responses' 
AND column_name = 'room_id';

-- 4. 기존 외래키 제약조건은 유지 (NULL 값은 외래키 검사에서 제외됨)
-- 이미 다음과 같이 정의되어 있음: room_id UUID REFERENCES activity_rooms(id) ON DELETE CASCADE
