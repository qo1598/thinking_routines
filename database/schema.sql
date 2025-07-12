-- Thinking Routines Database Schema
-- Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 교사 테이블
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 활동방 테이블
CREATE TABLE activity_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    room_code VARCHAR(6) UNIQUE NOT NULL, -- 6자리 코드
    thinking_routine_type VARCHAR(50) NOT NULL DEFAULT 'see-think-wonder',
    status VARCHAR(20) DEFAULT 'draft', -- draft, active, completed, archived
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사고루틴 템플릿 테이블 (교사가 설정하는 내용)
CREATE TABLE routine_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES activity_rooms(id) ON DELETE CASCADE,
    routine_type VARCHAR(50) NOT NULL,
    content JSONB NOT NULL, -- 이미지 URL, 질문 등 사고루틴별 설정
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 학생 응답 테이블
CREATE TABLE student_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES activity_rooms(id) ON DELETE CASCADE,
    student_name VARCHAR(100) NOT NULL,
    student_id VARCHAR(50), -- 학번 등 (선택사항)
    response_data JSONB NOT NULL, -- See-Think-Wonder 응답 데이터
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI 분석 결과 테이블
CREATE TABLE ai_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    response_id UUID NOT NULL REFERENCES student_responses(id) ON DELETE CASCADE,
    analysis_data JSONB NOT NULL, -- AI 분석 결과
    feedback_data JSONB NOT NULL, -- AI 피드백
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 교사 평가 테이블
CREATE TABLE teacher_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    response_id UUID NOT NULL REFERENCES student_responses(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    teacher_feedback TEXT,
    score INTEGER CHECK (score >= 1 AND score <= 5),
    evaluation_data JSONB, -- 추가 평가 데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_activity_rooms_teacher_id ON activity_rooms(teacher_id);
CREATE INDEX idx_activity_rooms_room_code ON activity_rooms(room_code);
CREATE INDEX idx_routine_templates_room_id ON routine_templates(room_id);
CREATE INDEX idx_student_responses_room_id ON student_responses(room_id);
CREATE INDEX idx_ai_analysis_response_id ON ai_analysis(response_id);
CREATE INDEX idx_teacher_evaluations_response_id ON teacher_evaluations(response_id);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_evaluations ENABLE ROW LEVEL SECURITY;

-- 기존 RLS 정책 삭제 (있을 경우)
DROP POLICY IF EXISTS "Teachers can only access their own data" ON teachers;

-- 교사는 자신의 데이터만 접근 가능 (INSERT 허용)
CREATE POLICY "Teachers can access and insert their own data" ON teachers
    FOR ALL USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Teachers can only access their own rooms" ON activity_rooms
    FOR ALL USING (teacher_id = auth.uid());

-- 학생들이 활동방 정보를 조회할 수 있도록 허용 (읽기 전용)
CREATE POLICY "Students can read active rooms" ON activity_rooms
    FOR SELECT USING (status = 'active');

CREATE POLICY "Teachers can only access their own templates" ON routine_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM activity_rooms 
            WHERE activity_rooms.id = routine_templates.room_id 
            AND activity_rooms.teacher_id = auth.uid()
        )
    );

-- 학생 응답은 해당 방의 교사만 접근 가능
CREATE POLICY "Teachers can access responses in their rooms" ON student_responses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM activity_rooms 
            WHERE activity_rooms.id = student_responses.room_id 
            AND activity_rooms.teacher_id = auth.uid()
        )
    );

-- 학생들이 활성 방에 응답을 저장할 수 있도록 허용
CREATE POLICY "Students can insert responses to active rooms" ON student_responses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM activity_rooms 
            WHERE activity_rooms.id = student_responses.room_id 
            AND activity_rooms.status = 'active'
        )
    );

-- AI 분석 결과도 마찬가지
CREATE POLICY "Teachers can access AI analysis for their students" ON ai_analysis
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM student_responses 
            JOIN activity_rooms ON activity_rooms.id = student_responses.room_id
            WHERE student_responses.id = ai_analysis.response_id 
            AND activity_rooms.teacher_id = auth.uid()
        )
    );

-- 교사 평가도 마찬가지
CREATE POLICY "Teachers can access their own evaluations" ON teacher_evaluations
    FOR ALL USING (teacher_id = auth.uid());

-- 함수: 6자리 숫자 코드 생성
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS VARCHAR(6) AS $$
DECLARE
    code VARCHAR(6);
    exists_check INTEGER;
BEGIN
    LOOP
        -- 6자리 숫자 코드 생성 (100000 ~ 999999)
        code := LPAD((FLOOR(RANDOM() * 900000) + 100000)::TEXT, 6, '0');
        
        -- 중복 확인
        SELECT COUNT(*) INTO exists_check 
        FROM activity_rooms 
        WHERE room_code = code;
        
        -- 중복이 없으면 반환
        IF exists_check = 0 THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 트리거: 활동방 생성 시 자동으로 코드 생성
CREATE OR REPLACE FUNCTION set_room_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.room_code IS NULL OR NEW.room_code = '' THEN
        NEW.room_code := generate_room_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_room_code
    BEFORE INSERT ON activity_rooms
    FOR EACH ROW
    EXECUTE FUNCTION set_room_code();

-- 트리거: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_teachers_updated_at
    BEFORE UPDATE ON teachers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activity_rooms_updated_at
    BEFORE UPDATE ON activity_rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routine_templates_updated_at
    BEFORE UPDATE ON routine_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_responses_updated_at
    BEFORE UPDATE ON student_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teacher_evaluations_updated_at
    BEFORE UPDATE ON teacher_evaluations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 