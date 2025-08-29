-- ================================================
-- Thinking Routines Database Schema (최종 완전판)
-- Supabase PostgreSQL
-- 작성일: 2025-08-11
-- 버전: Final Complete Version - 모든 오류 수정 포함
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 1. 기본 테이블 생성 (기존 테이블 유지)
-- ================================================

-- 교사 테이블
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 활동방 테이블
CREATE TABLE IF NOT EXISTS activity_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    room_code VARCHAR(6) UNIQUE NOT NULL,
    thinking_routine_type VARCHAR(50) NOT NULL DEFAULT 'see-think-wonder',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사고루틴 템플릿 테이블
CREATE TABLE IF NOT EXISTS routine_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES activity_rooms(id) ON DELETE CASCADE,
    routine_type VARCHAR(50) NOT NULL,
    content JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 학생 응답 테이블 (기존 구조 유지)
CREATE TABLE IF NOT EXISTS student_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES activity_rooms(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_id TEXT,
    response_data JSONB NOT NULL,
    is_draft BOOL DEFAULT FALSE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI 분석 결과 테이블
CREATE TABLE IF NOT EXISTS ai_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    response_id UUID NOT NULL REFERENCES student_responses(id) ON DELETE CASCADE,
    analysis_data JSONB NOT NULL,
    feedback_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 교사 평가 테이블
CREATE TABLE IF NOT EXISTS teacher_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    response_id UUID NOT NULL REFERENCES student_responses(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    teacher_feedback TEXT,
    score INTEGER CHECK (score >= 1 AND score <= 5),
    evaluation_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 댓글 테이블
CREATE TABLE IF NOT EXISTS student_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    response_id UUID NOT NULL REFERENCES student_responses(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES student_comments(id) ON DELETE CASCADE,
    student_name VARCHAR(100) NOT NULL,
    student_grade VARCHAR(10),
    student_class VARCHAR(10),
    student_number INTEGER,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 좋아요 테이블
CREATE TABLE IF NOT EXISTS student_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    response_id UUID NOT NULL REFERENCES student_responses(id) ON DELETE CASCADE,
    student_name VARCHAR(100) NOT NULL,
    student_grade VARCHAR(10),
    student_class VARCHAR(10),
    student_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(response_id, student_name, student_grade, student_class, student_number)
);

-- ================================================
-- 2. 기존 테이블에 컬럼 추가
-- ================================================

-- activity_rooms 테이블에 participation_type 컬럼 추가
ALTER TABLE activity_rooms 
ADD COLUMN IF NOT EXISTS participation_type VARCHAR(20) DEFAULT 'individual' 
CHECK (participation_type IN ('individual', 'group'));

-- student_responses 테이블에 필요한 컬럼들 추가
ALTER TABLE student_responses 
ADD COLUMN IF NOT EXISTS student_grade VARCHAR(10),
ADD COLUMN IF NOT EXISTS student_class VARCHAR(20),
ADD COLUMN IF NOT EXISTS student_number INTEGER,
ADD COLUMN IF NOT EXISTS group_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS team_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS routine_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS image_data TEXT,
ADD COLUMN IF NOT EXISTS ai_analysis TEXT,
ADD COLUMN IF NOT EXISTS teacher_feedback TEXT,
ADD COLUMN IF NOT EXISTS teacher_score INTEGER,
ADD COLUMN IF NOT EXISTS confidence_score INTEGER,
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- teacher_score 제약 조건 추가 (기존 제약조건이 있으면 먼저 삭제)
ALTER TABLE student_responses DROP CONSTRAINT IF EXISTS student_responses_teacher_score_check;
ALTER TABLE student_responses ADD CONSTRAINT student_responses_teacher_score_check 
CHECK (teacher_score >= 1 AND teacher_score <= 100);

-- ================================================
-- 3. 인덱스 생성 (성능 최적화)
-- ================================================

-- 기본 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_activity_rooms_teacher_id ON activity_rooms(teacher_id);
CREATE INDEX IF NOT EXISTS idx_activity_rooms_room_code ON activity_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_activity_rooms_status ON activity_rooms(status);
CREATE INDEX IF NOT EXISTS idx_activity_rooms_participation_type ON activity_rooms(participation_type);

CREATE INDEX IF NOT EXISTS idx_routine_templates_room_id ON routine_templates(room_id);

CREATE INDEX IF NOT EXISTS idx_student_responses_room_id ON student_responses(room_id);
CREATE INDEX IF NOT EXISTS idx_student_responses_student ON student_responses(student_name, student_id);
CREATE INDEX IF NOT EXISTS idx_student_responses_draft ON student_responses(is_draft);
CREATE INDEX IF NOT EXISTS idx_student_responses_grade ON student_responses(student_grade);
CREATE INDEX IF NOT EXISTS idx_student_responses_class ON student_responses(student_class);
CREATE INDEX IF NOT EXISTS idx_student_responses_routine_type ON student_responses(routine_type);
CREATE INDEX IF NOT EXISTS idx_student_responses_group_name ON student_responses(group_name);
CREATE INDEX IF NOT EXISTS idx_student_responses_teacher_score ON student_responses(teacher_score);
CREATE INDEX IF NOT EXISTS idx_student_responses_submitted_at ON student_responses(submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_response_id ON ai_analysis(response_id);
CREATE INDEX IF NOT EXISTS idx_teacher_evaluations_response_id ON teacher_evaluations(response_id);

-- 댓글/좋아요 인덱스
CREATE INDEX IF NOT EXISTS idx_student_comments_response_id ON student_comments(response_id);
CREATE INDEX IF NOT EXISTS idx_student_comments_parent_id ON student_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_student_comments_created_at ON student_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_likes_response_id ON student_likes(response_id);
CREATE INDEX IF NOT EXISTS idx_student_likes_created_at ON student_likes(created_at DESC);

-- ================================================
-- 4. 함수 및 트리거
-- ================================================

-- 6자리 숫자 코드 생성 함수
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS VARCHAR(6) AS $$
DECLARE
    code VARCHAR(6);
    exists_check INTEGER;
BEGIN
    LOOP
        code := LPAD((FLOOR(RANDOM() * 900000) + 100000)::TEXT, 6, '0');
        SELECT COUNT(*) INTO exists_check FROM activity_rooms WHERE room_code = code;
        IF exists_check = 0 THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 활동방 코드 자동 생성 트리거
CREATE OR REPLACE FUNCTION set_room_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.room_code IS NULL OR NEW.room_code = '' THEN
        NEW.room_code := generate_room_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 댓글/좋아요 카운터 업데이트 함수
CREATE OR REPLACE FUNCTION update_response_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'student_comments' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE student_responses 
            SET comments_count = comments_count + 1 
            WHERE id = NEW.response_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE student_responses 
            SET comments_count = comments_count - 1 
            WHERE id = OLD.response_id;
        END IF;
    END IF;
    
    IF TG_TABLE_NAME = 'student_likes' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE student_responses 
            SET likes_count = likes_count + 1 
            WHERE id = NEW.response_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE student_responses 
            SET likes_count = likes_count - 1 
            WHERE id = OLD.response_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 5. 트리거 생성
-- ================================================

-- 기존 트리거 삭제
DROP TRIGGER IF EXISTS trigger_set_room_code ON activity_rooms;
DROP TRIGGER IF EXISTS update_teachers_updated_at ON teachers;
DROP TRIGGER IF EXISTS update_activity_rooms_updated_at ON activity_rooms;
DROP TRIGGER IF EXISTS update_routine_templates_updated_at ON routine_templates;
DROP TRIGGER IF EXISTS update_student_responses_updated_at ON student_responses;
DROP TRIGGER IF EXISTS update_teacher_evaluations_updated_at ON teacher_evaluations;
DROP TRIGGER IF EXISTS trigger_update_comments_count ON student_comments;
DROP TRIGGER IF EXISTS trigger_update_likes_count ON student_likes;

-- 새 트리거 생성
CREATE TRIGGER trigger_set_room_code
    BEFORE INSERT ON activity_rooms
    FOR EACH ROW EXECUTE FUNCTION set_room_code();

CREATE TRIGGER update_teachers_updated_at
    BEFORE UPDATE ON teachers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activity_rooms_updated_at
    BEFORE UPDATE ON activity_rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routine_templates_updated_at
    BEFORE UPDATE ON routine_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_responses_updated_at
    BEFORE UPDATE ON student_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teacher_evaluations_updated_at
    BEFORE UPDATE ON teacher_evaluations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_comments_count
    AFTER INSERT OR DELETE ON student_comments
    FOR EACH ROW EXECUTE FUNCTION update_response_counters();

CREATE TRIGGER trigger_update_likes_count
    AFTER INSERT OR DELETE ON student_likes
    FOR EACH ROW EXECUTE FUNCTION update_response_counters();

-- ================================================
-- 6. Row Level Security (RLS) 설정
-- ================================================

-- RLS 활성화
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_likes ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Teachers can access and insert their own data" ON teachers;
DROP POLICY IF EXISTS "Teachers can only access their own rooms" ON activity_rooms;
DROP POLICY IF EXISTS "Students can read active rooms" ON activity_rooms;
DROP POLICY IF EXISTS "Teachers can insert their own templates" ON routine_templates;
DROP POLICY IF EXISTS "Teachers can update their own templates" ON routine_templates;
DROP POLICY IF EXISTS "Teachers can delete their own templates" ON routine_templates;
DROP POLICY IF EXISTS "Students can read templates of active rooms" ON routine_templates;
DROP POLICY IF EXISTS "Teachers can access responses in their rooms" ON student_responses;
DROP POLICY IF EXISTS "Students can insert responses to active rooms" ON student_responses;
DROP POLICY IF EXISTS "Students can read published responses" ON student_responses;
DROP POLICY IF EXISTS "Allow offline routine analysis insertion" ON student_responses;
DROP POLICY IF EXISTS "Allow offline routine analysis reading" ON student_responses;
DROP POLICY IF EXISTS "Teachers can access AI analysis for their students" ON ai_analysis;
DROP POLICY IF EXISTS "Teachers can access their own evaluations" ON teacher_evaluations;
DROP POLICY IF EXISTS "댓글 읽기 허용" ON student_comments;
DROP POLICY IF EXISTS "좋아요 읽기 허용" ON student_likes;
DROP POLICY IF EXISTS "댓글 작성 허용" ON student_comments;
DROP POLICY IF EXISTS "좋아요 작성 허용" ON student_likes;
DROP POLICY IF EXISTS "댓글 삭제 허용" ON student_comments;
DROP POLICY IF EXISTS "좋아요 삭제 허용" ON student_likes;

-- 새 정책 생성
-- 교사 정책
CREATE POLICY "Teachers can access and insert their own data" ON teachers
    FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Teachers can only access their own rooms" ON activity_rooms
    FOR ALL USING (teacher_id = auth.uid());

-- 학생 정책
CREATE POLICY "Students can read active rooms" ON activity_rooms
    FOR SELECT USING (status = 'active');

-- 템플릿 정책
CREATE POLICY "Teachers can insert their own templates" ON routine_templates
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM activity_rooms WHERE activity_rooms.id = routine_templates.room_id AND activity_rooms.teacher_id = auth.uid())
    );

CREATE POLICY "Teachers can update their own templates" ON routine_templates
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM activity_rooms WHERE activity_rooms.id = routine_templates.room_id AND activity_rooms.teacher_id = auth.uid())
    );

CREATE POLICY "Teachers can delete their own templates" ON routine_templates
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM activity_rooms WHERE activity_rooms.id = routine_templates.room_id AND activity_rooms.teacher_id = auth.uid())
    );

CREATE POLICY "Students can read templates of active rooms" ON routine_templates
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM activity_rooms WHERE activity_rooms.id = routine_templates.room_id AND activity_rooms.status = 'active')
    );

-- 학생 응답 정책 (온라인 활동)
CREATE POLICY "Teachers can access responses in their rooms" ON student_responses
    FOR ALL USING (
        room_id IS NOT NULL AND
        EXISTS (SELECT 1 FROM activity_rooms WHERE activity_rooms.id = student_responses.room_id AND activity_rooms.teacher_id = auth.uid())
    );

CREATE POLICY "Students can insert responses to active rooms" ON student_responses
    FOR INSERT WITH CHECK (
        room_id IS NOT NULL AND
        EXISTS (SELECT 1 FROM activity_rooms WHERE activity_rooms.id = student_responses.room_id AND activity_rooms.status = 'active')
    );

CREATE POLICY "Students can read published responses" ON student_responses
    FOR SELECT USING (
        room_id IS NOT NULL AND
        is_draft = false AND 
        EXISTS (SELECT 1 FROM activity_rooms WHERE activity_rooms.id = student_responses.room_id AND activity_rooms.status = 'active')
    );

-- 오프라인 활동 정책 (중요!)
CREATE POLICY "Allow offline routine analysis insertion" ON student_responses
    FOR INSERT WITH CHECK (
        room_id IS NULL -- 오프라인 활동
        AND routine_type IS NOT NULL -- 사고루틴 타입이 있어야 함
        AND student_name IS NOT NULL -- 학생 이름이 있어야 함
    );

CREATE POLICY "Allow offline routine analysis reading" ON student_responses
    FOR SELECT USING (
        room_id IS NULL -- 오프라인 활동
        AND is_draft = false -- 완료된 활동
    );

-- AI 분석 정책
CREATE POLICY "Teachers can access AI analysis for their students" ON ai_analysis
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM student_responses 
            LEFT JOIN activity_rooms ON activity_rooms.id = student_responses.room_id
            WHERE student_responses.id = ai_analysis.response_id 
            AND (activity_rooms.teacher_id = auth.uid() OR student_responses.room_id IS NULL)
        )
    );

-- 교사 평가 정책
CREATE POLICY "Teachers can access their own evaluations" ON teacher_evaluations
    FOR ALL USING (teacher_id = auth.uid());

-- 댓글/좋아요 정책
CREATE POLICY "댓글 읽기 허용" ON student_comments FOR SELECT USING (true);
CREATE POLICY "좋아요 읽기 허용" ON student_likes FOR SELECT USING (true);
CREATE POLICY "댓글 작성 허용" ON student_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "좋아요 작성 허용" ON student_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "댓글 삭제 허용" ON student_comments FOR DELETE USING (true);
CREATE POLICY "좋아요 삭제 허용" ON student_likes FOR DELETE USING (true);

-- ================================================
-- 7. 데이터 초기화 및 정리
-- ================================================

-- 기존 데이터의 is_draft를 false로 설정
UPDATE student_responses SET is_draft = FALSE WHERE is_draft IS NULL;

-- 기존 데이터의 participation_type을 individual로 설정
UPDATE activity_rooms SET participation_type = 'individual' WHERE participation_type IS NULL;

-- 새로 추가된 컬럼들의 기본값 설정
UPDATE student_responses SET comments_count = 0 WHERE comments_count IS NULL;
UPDATE student_responses SET likes_count = 0 WHERE likes_count IS NULL;
UPDATE student_responses SET created_at = submitted_at WHERE created_at IS NULL;

-- 댓글/좋아요 카운터 초기화
UPDATE student_responses 
SET 
    comments_count = COALESCE((SELECT COUNT(*) FROM student_comments WHERE student_comments.response_id = student_responses.id), 0),
    likes_count = COALESCE((SELECT COUNT(*) FROM student_likes WHERE student_likes.response_id = student_responses.id), 0);

-- ================================================
-- 8. Supabase Storage 설정
-- ================================================

-- routine-uploads 버킷 생성 (이미 있다면 무시됨)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'routine-uploads', 
  'routine-uploads', 
  true, 
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 기존 Storage 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Public read access for routine images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload routine images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload routine images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update routine images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete routine images" ON storage.objects;

-- Storage 정책 생성
CREATE POLICY "Public read access for routine images" ON storage.objects
FOR SELECT USING (bucket_id = 'routine-uploads');

CREATE POLICY "Users can upload routine images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'routine-uploads');

CREATE POLICY "Users can update routine images" ON storage.objects
FOR UPDATE USING (bucket_id = 'routine-uploads')
WITH CHECK (bucket_id = 'routine-uploads');

CREATE POLICY "Users can delete routine images" ON storage.objects
FOR DELETE USING (bucket_id = 'routine-uploads');

-- ================================================
-- 9. 테이블 및 컬럼 코멘트
-- ================================================

COMMENT ON TABLE teachers IS '교사 정보 테이블';
COMMENT ON TABLE activity_rooms IS '활동방 정보 테이블';
COMMENT ON TABLE routine_templates IS '사고루틴 템플릿 테이블';
COMMENT ON TABLE student_responses IS '학생 응답 및 활동 결과 테이블';
COMMENT ON TABLE ai_analysis IS 'AI 분석 결과 테이블';
COMMENT ON TABLE teacher_evaluations IS '교사 평가 테이블';
COMMENT ON TABLE student_comments IS '학생 활동에 대한 댓글 테이블';
COMMENT ON TABLE student_likes IS '학생 활동에 대한 좋아요 테이블';

COMMENT ON COLUMN activity_rooms.participation_type IS '활동방 참여 유형: individual(개인), group(모둠)';
COMMENT ON COLUMN student_responses.group_name IS '학생이 속한 모둠명 (participation_type이 group일 때 사용)';
COMMENT ON COLUMN student_responses.student_grade IS '학생 학년 (예: 1학년, 2학년, 초1, 중1, 고1 등)';
COMMENT ON COLUMN student_responses.student_class IS '학생 반 (예: 1반, 2반, 가반, 나반 등)';
COMMENT ON COLUMN student_responses.student_number IS '학생 번호';
COMMENT ON COLUMN student_responses.team_name IS '모둠명 (모둠 활동인 경우)';
COMMENT ON COLUMN student_responses.image_url IS '포트폴리오 이미지 URL (Supabase storage)';
COMMENT ON COLUMN student_responses.image_data IS 'Base64 encoded image data (fallback when Supabase storage fails)';
COMMENT ON COLUMN student_responses.confidence_score IS 'AI 분석 신뢰도 점수';
COMMENT ON COLUMN student_responses.routine_type IS '사고루틴 유형';
COMMENT ON COLUMN student_responses.comments_count IS '댓글 수 (자동 업데이트)';
COMMENT ON COLUMN student_responses.likes_count IS '좋아요 수 (자동 업데이트)';

-- ================================================
-- 10. 설정 확인 쿼리 (실행 후 결과 확인용)
-- ================================================

-- 테이블 및 컬럼 확인
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'student_responses' 
AND column_name IN ('image_url', 'image_data', 'routine_type', 'student_grade', 'student_class', 'student_number', 'team_name')
ORDER BY ordinal_position;

-- Storage 버킷 확인
SELECT 
  id,
  name,
  public,
  file_size_limit / 1024 / 1024 as size_limit_mb,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'routine-uploads';

-- RLS 정책 확인
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'READ'
    WHEN cmd = 'INSERT' THEN 'INSERT' 
    WHEN cmd = 'UPDATE' THEN 'UPDATE'
    WHEN cmd = 'DELETE' THEN 'DELETE'
    ELSE cmd
  END as permission_type
FROM pg_policies 
WHERE tablename = 'student_responses' 
AND schemaname = 'public'
AND policyname LIKE '%offline%'
ORDER BY cmd, policyname;

-- ================================================
-- 스키마 설정 완료!
-- 이제 모든 기능이 정상적으로 작동할 것입니다.
-- ================================================
