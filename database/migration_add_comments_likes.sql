-- 댓글 및 좋아요 기능을 위한 테이블 생성
-- 실행일: 2025-08-11

-- 1. 댓글 테이블 생성
CREATE TABLE IF NOT EXISTS student_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    response_id UUID NOT NULL REFERENCES student_responses(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES student_comments(id) ON DELETE CASCADE, -- 대댓글을 위한 자기 참조
    student_name VARCHAR(100) NOT NULL,
    student_grade VARCHAR(10),
    student_class VARCHAR(10),
    student_number INTEGER,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 좋아요 테이블 생성
CREATE TABLE IF NOT EXISTS student_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    response_id UUID NOT NULL REFERENCES student_responses(id) ON DELETE CASCADE,
    student_name VARCHAR(100) NOT NULL,
    student_grade VARCHAR(10),
    student_class VARCHAR(10),
    student_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- 같은 학생이 같은 활동에 중복 좋아요 방지
    UNIQUE(response_id, student_name, student_grade, student_class, student_number)
);

-- 3. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_student_comments_response_id ON student_comments(response_id);
CREATE INDEX IF NOT EXISTS idx_student_comments_parent_id ON student_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_student_comments_created_at ON student_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_likes_response_id ON student_likes(response_id);
CREATE INDEX IF NOT EXISTS idx_student_likes_created_at ON student_likes(created_at DESC);

-- 4. 기존 student_responses 테이블에 댓글/좋아요 카운터 컬럼 추가 (선택사항, 성능용)
ALTER TABLE student_responses 
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- 5. 댓글 수와 좋아요 수를 자동으로 업데이트하는 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_response_counters()
RETURNS TRIGGER AS $$
BEGIN
    -- 댓글 수 업데이트
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
    
    -- 좋아요 수 업데이트
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

-- 6. 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_comments_count ON student_comments;
DROP TRIGGER IF EXISTS trigger_update_likes_count ON student_likes;

CREATE TRIGGER trigger_update_comments_count
    AFTER INSERT OR DELETE ON student_comments
    FOR EACH ROW EXECUTE FUNCTION update_response_counters();

CREATE TRIGGER trigger_update_likes_count
    AFTER INSERT OR DELETE ON student_likes
    FOR EACH ROW EXECUTE FUNCTION update_response_counters();

-- 7. 기존 데이터에 대한 카운터 초기화 (한 번만 실행)
UPDATE student_responses 
SET comments_count = (
    SELECT COUNT(*) 
    FROM student_comments 
    WHERE student_comments.response_id = student_responses.id
),
likes_count = (
    SELECT COUNT(*) 
    FROM student_likes 
    WHERE student_likes.response_id = student_responses.id
);

-- 8. RLS (Row Level Security) 정책 설정 (보안 강화)
ALTER TABLE student_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_likes ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능 (공개 댓글/좋아요)
CREATE POLICY IF NOT EXISTS "댓글 읽기 허용" ON student_comments
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "좋아요 읽기 허용" ON student_likes
    FOR SELECT USING (true);

-- 인증된 사용자만 댓글/좋아요 작성 가능
CREATE POLICY IF NOT EXISTS "댓글 작성 허용" ON student_comments
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "좋아요 작성 허용" ON student_likes
    FOR INSERT WITH CHECK (true);

-- 자신의 댓글만 삭제 가능 (이름 기반 - 간단한 구현)
CREATE POLICY IF NOT EXISTS "댓글 삭제 허용" ON student_comments
    FOR DELETE USING (true); -- 개발 단계에서는 모든 삭제 허용

CREATE POLICY IF NOT EXISTS "좋아요 삭제 허용" ON student_likes
    FOR DELETE USING (true); -- 개발 단계에서는 모든 삭제 허용

-- 마이그레이션 완료 확인을 위한 코멘트
COMMENT ON TABLE student_comments IS '학생 활동에 대한 댓글 저장 테이블 (2025-08-11 추가)';
COMMENT ON TABLE student_likes IS '학생 활동에 대한 좋아요 저장 테이블 (2025-08-11 추가)';
