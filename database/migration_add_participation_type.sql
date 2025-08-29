-- 활동방 참여 유형 선택 기능 추가를 위한 마이그레이션
-- 작성일: 2024-12-19
-- 목적: 활동방에 개인/모둠 참여 유형 필드 추가

-- 1. activity_rooms 테이블에 participation_type 컬럼 추가
ALTER TABLE activity_rooms 
ADD COLUMN participation_type VARCHAR(20) DEFAULT 'individual' CHECK (participation_type IN ('individual', 'group'));

-- 기존 데이터에 대해 기본값 설정
UPDATE activity_rooms 
SET participation_type = 'individual' 
WHERE participation_type IS NULL;

-- 2. student_responses 테이블에 group_name 컬럼 추가 (모둠명 저장용)
ALTER TABLE student_responses 
ADD COLUMN group_name VARCHAR(100) DEFAULT NULL;

-- 3. 인덱스 추가 (성능 최적화)
CREATE INDEX idx_activity_rooms_participation_type ON activity_rooms(participation_type);
CREATE INDEX idx_student_responses_group_name ON student_responses(group_name);

-- 4. 기존 RLS 정책은 그대로 유지 (추가 권한 변경 불필요)

-- 5. 데이터 무결성을 위한 주석 추가
COMMENT ON COLUMN activity_rooms.participation_type IS '활동방 참여 유형: individual(개인), group(모둠)';
COMMENT ON COLUMN student_responses.group_name IS '학생이 속한 모둠명 (participation_type이 group일 때만 사용)';

-- 마이그레이션 완료 확인을 위한 주석
-- 실행 완료: 활동방 참여 유형(개인/모둠) 선택 기능 추가
-- 실행 일시: 실행 시점에 기록됨