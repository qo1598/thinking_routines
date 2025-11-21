# 🛠️ 사고루틴 웹앱 (Thinking Routines Web App) 프로젝트 분석 보고서

## 1. 📊 프로젝트 개요
**사고루틴 웹앱**은 하버드 대학교 Project Zero의 'Thinking Routines'을 디지털화하여 교육 현장에서 활용할 수 있도록 돕는 웹 애플리케이션입니다. 교사는 활동방을 개설하여 학생들을 초대하고, 학생들은 태블릿 등의 기기를 통해 사고루틴 활동에 참여하며, AI를 통해 피드백을 받을 수 있습니다.

*   **목표**: 학생들의 비판적 사고, 창의적 문제 해결 능력, 메타인지 능력 향상
*   **타겟 사용자**: 교사 (활동 관리 및 평가), 학생 (활동 참여 및 포트폴리오 관리)

## 2. 🔧 기술 스택 (Tech Stack)

### Frontend
*   **Framework**: React (v19.1.0)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **State Management**: React Hooks (useState, useEffect)
*   **API Client**: Axios, Supabase Client
*   **AI Integration**: Google Generative AI SDK
*   **Build Tool**: Create React App (추정, `react-scripts` 사용 시)

### Backend
*   **Runtime**: Node.js (v18+)
*   **Framework**: Express.js
*   **Database Interface**: Supabase Client
*   **Authentication**: Supabase Auth, JWT
*   **AI Service**: Google Gemini API (gemini-2.0-flash-lite)

### Infrastructure & Database
*   **Database**: PostgreSQL (via Supabase)
*   **Storage**: Supabase Storage (이미지 등 파일 저장)
*   **Hosting**: Vercel (Frontend + Serverless Functions)

## 3. 🏗️ 시스템 아키텍처

시스템은 클라이언트-서버 구조를 따르며, Supabase를 BaaS(Backend-as-a-Service)로 활용하여 데이터베이스와 인증을 처리합니다.

*   **Frontend**: 사용자 인터페이스 제공, 교사용/학생용 모드 분리.
*   **Backend API**: 비즈니스 로직 처리, AI 분석 요청 중계, 데이터베이스 접근 제어.
*   **Supabase**: 사용자 인증, 실시간 데이터 동기화, 데이터 저장소 역할.
*   **Google Gemini API**: 학생의 응답(텍스트/이미지)을 분석하여 피드백 생성.

## 4. 🔑 주요 기능

### 교사용 기능
*   **회원가입/로그인**: 이메일 기반 인증.
*   **활동방 관리**: 사고루틴 종류(See-Think-Wonder 등)를 선택하여 방 생성, 6자리 입장 코드 발급.
*   **실시간 모니터링**: 학생들의 참여 현황 및 응답 실시간 확인.
*   **피드백**: 학생 응답에 대한 평가 및 코멘트 작성.

### 학생용 기능
*   **간편 입장**: 별도 가입 없이 6자리 코드로 입장.
*   **사고루틴 활동**: 단계별(예: See -> Think -> Wonder) 질문에 답변 작성.
*   **멀티미디어 지원**: 텍스트 입력 외 음성 입력(STT) 지원.
*   **AI 피드백**: 활동 완료 후 AI가 분석한 피드백 확인.

## 5. 🗄️ 데이터베이스 구조 (ERD 요약)

주요 테이블 간의 관계는 다음과 같습니다.

*   **Teachers**: 교사 정보 저장.
*   **Activity_Rooms**: 교사가 생성한 활동방 정보 (Room Code 포함). `Teachers`와 1:N 관계.
*   **Student_Responses**: 학생들의 활동 응답 데이터 (JSONB 형식으로 유연하게 저장). `Activity_Rooms`와 1:N 관계.
*   **AI_Analysis**: 학생 응답에 대한 AI 분석 결과. `Student_Responses`와 1:1 관계.

## 6. 📂 프로젝트 구조

```
root/
├── backend/                 # 백엔드 서버 코드
│   ├── config/              # 설정 파일 (DB 스키마 등)
│   ├── routes/              # API 라우트 정의
│   └── server.js            # 서버 진입점
├── frontend/                # 프론트엔드 리액트 앱
│   ├── public/              # 정적 파일
│   └── src/                 # 소스 코드
│       ├── components/      # UI 컴포넌트
│       ├── lib/             # 라이브러리 설정 (Supabase 등)
│       └── App.tsx          # 메인 앱 컴포넌트
├── TECHNICAL_DOCUMENTATION.md # 상세 기술 문서
├── USER_GUIDE.md            # 사용자 가이드
└── README.md                # 프로젝트 소개
```

## 7. 🚀 설치 및 실행 요약

1.  **환경 변수 설정**: `backend/.env`, `frontend/.env` 파일에 Supabase, Gemini API Key 등 설정.
2.  **의존성 설치**: `backend`와 `frontend` 각각에서 `npm install` 실행.
3.  **데이터베이스 설정**: Supabase 프로젝트 생성 후 `backend/config/database.sql` 실행.
4.  **실행**:
    *   Backend: `npm run dev` (Port 3001)
    *   Frontend: `npm start` (Port 3000)

## 8. 💡 결론 및 제언

이 프로젝트는 현대적인 웹 기술 스택을 활용하여 교육 현장에 실질적인 도움을 줄 수 있는 잘 설계된 애플리케이션입니다. 특히 **Supabase**를 활용한 빠른 개발 생산성과 **Gemini API**를 이용한 AI 피드백 기능이 돋보입니다.

**향후 발전 가능성**:
*   **실시간 협업**: WebSocket 등을 활용하여 학생들 간의 실시간 의견 공유 기능 추가.
*   **데이터 시각화**: 교사 대시보드에 학생들의 성취도를 그래프로 시각화.
*   **모바일 앱**: React Native 등을 활용한 전용 모바일 앱 출시.
