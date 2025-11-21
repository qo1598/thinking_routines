# 🛠️ 리팩토링 및 최적화 계획 (Refactoring Plan)

현재 프로젝트는 기능이 확장되면서 파일의 크기가 커지고, 비즈니스 로직과 UI 코드가 뒤섞여 유지보수가 어려운 "스파게티 코드" 징후를 보이고 있습니다. 이를 해결하기 위해 다음과 같은 단계적 리팩토링을 제안합니다.

## 1. 🎯 리팩토링 목표
*   **가독성 향상**: 코드를 읽고 이해하기 쉽게 구조화합니다.
*   **유지보수성 강화**: 기능 수정 시 다른 부분에 영향을 주지 않도록 결합도를 낮춥니다.
*   **재사용성 증대**: 공통 로직과 UI를 분리하여 재사용 가능하게 만듭니다.
*   **안정성 확보**: 에러 처리를 일원화하고 타입 안정성을 강화합니다.

---

## 2. 🏗️ Frontend 리팩토링 (React)

가장 시급한 `ThinkingRoutinesForm.tsx` (약 1000라인) 파일을 중심으로 진행합니다.

### 2.1 컴포넌트 분리 (Component Splitting)
거대한 컴포넌트를 역할별로 작은 단위로 쪼갭니다.

*   **`ThinkingRoutineLayout`**: 전체적인 레이아웃(헤더, 메인 컨테이너) 담당
*   **`RoutineMediaViewer`**: 이미지, 텍스트, 유튜브 영상 등 학습 자료를 보여주는 컴포넌트
*   **`RoutineStepInput`**: 단계별 입력 폼 (Textarea 등) 및 사고루틴별 특수 입력 UI
*   **`RoutineProgressBar`**: 상단 단계 진행 표시 바
*   **`RoutineNavigation`**: 이전/다음/제출 버튼 관리

### 2.2 로직 분리 (Custom Hooks)
UI 컴포넌트에서 비즈니스 로직을 추출하여 Custom Hook으로 만듭니다.

*   **`useRoutineData(roomId)`**:
    *   활동방 정보 및 템플릿 데이터 Fetching 로직
    *   로딩 및 에러 상태 관리
*   **`useStudentResponse(roomId, studentInfo)`**:
    *   응답 상태 관리 (`responses`)
    *   임시 저장 (`saveDraft`) 및 불러오기 로직
    *   제출 (`handleSubmit`) 로직
    *   자동 저장 (Debounce) 처리

### 2.3 상수 및 설정 분리
*   **`constants/routineConfigs.ts`**: `ROUTINE_CONFIGS` 객체를 별도 파일로 분리하여 관리.
*   **`types/index.ts`**: `StudentInfo`, `ActivityRoom` 등 인터페이스를 중앙에서 관리하여 중복 정의 제거.

### 2.4 API 서비스 계층 도입
*   **`services/supabaseService.ts`**: 컴포넌트 내에서 직접 `supabase.from(...).select(...)`를 호출하지 않고, 함수 형태로 래핑하여 사용.
    *   예: `fetchRoomData(roomId)`, `submitResponse(data)`

---

## 3. 🔙 Backend 리팩토링 (Node.js)

### 3.1 라우트와 컨트롤러 분리
현재 라우터 파일(`routes/*.js`)에 비즈니스 로직이 포함되어 있어 파일이 비대합니다.

*   **구조 변경**:
    ```
    backend/
    ├── controllers/      # 비즈니스 로직 (Req/Res 처리)
    │   ├── roomController.js
    │   └── responseController.js
    ├── routes/           # 라우팅 정의만 담당
    │   ├── rooms.js
    │   └── responses.js
    ├── services/         # DB 쿼리 및 순수 로직 (선택적)
    └── utils/            # 공통 유틸리티 (에러 핸들러 등)
    ```

### 3.2 유효성 검사 (Validation) 강화
*   요청 데이터 검증 로직을 미들웨어로 분리하여 컨트롤러 코드를 깔끔하게 유지.

---

## 4. 📅 실행 계획 (Action Plan)

### 1단계: 구조 잡기 (Foundation)
1.  `frontend/src/types`, `frontend/src/constants`, `frontend/src/hooks`, `frontend/src/services` 폴더 생성.
2.  공통 타입 및 `ROUTINE_CONFIGS` 분리.
3.  Supabase 관련 API 호출 함수화 (`services/api.ts`).

### 2단계: Frontend 컴포넌트 분해 (Decomposition)
1.  `ThinkingRoutinesForm.tsx`에서 UI 부분부터 서브 컴포넌트로 분리.
2.  데이터 로직을 `useRoutineData`, `useStudentResponse` 훅으로 이관.
3.  메인 컴포넌트는 훅과 서브 컴포넌트를 조합하는 역할만 수행하도록 축소.

### 3단계: Backend 정리 (Cleanup)
1.  `backend/controllers` 폴더 생성.
2.  `routes/rooms.js`의 로직을 `controllers/roomController.js`로 이동.

## 5. 🌟 기대 효과
*   **코드 라인 수 감소**: 메인 컴포넌트 1000라인 → 200라인 이하로 감소 예상.
*   **버그 수정 용이**: 로직이 분리되어 있어 특정 기능 수정 시 사이드 이펙트 최소화.
*   **확장성**: 새로운 사고루틴 추가 시 `constants`와 설정만 변경하면 되므로 확장이 쉬움.
