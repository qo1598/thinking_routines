# 사고루틴 웹앱 (Thinking Routines Web App)

See-Think-Wonder 사고루틴을 활용한 교육용 웹 애플리케이션입니다.

## 🚀 주요 기능

- **교사용 기능**
  - 교사 회원가입 및 로그인
  - 활동방 생성 및 관리
  - 6자리 코드를 통한 학생 참여 관리
  - 학생 응답 확인 및 피드백

- **학생용 기능**
  - 6자리 코드로 간편 참여
  - 태블릿 최적화 인터페이스
  - See-Think-Wonder 사고루틴 수행
  - 음성 입력 지원 (STT)

## 🛠️ 기술 스택

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini API
- **Authentication**: Supabase Auth

## 📋 설치 및 실행

### 1. 프로젝트 클론 및 의존성 설치

```bash
# 백엔드 의존성 설치
cd backend
npm install

# 프론트엔드 의존성 설치
cd ../frontend
npm install
```

### 2. 환경 변수 설정

#### 백엔드 환경 변수 (`backend/.env`)

```env
# 서버 설정
PORT=3001
NODE_ENV=development

# Supabase 설정
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Gemini API 설정
GEMINI_API_KEY=your_gemini_api_key

# JWT 설정
JWT_SECRET=your_jwt_secret_key

# CORS 설정
CORS_ORIGIN=http://localhost:3000
```

#### 프론트엔드 환경 변수 (`frontend/.env`)

```env
REACT_APP_API_URL=http://localhost:3001
```

### 3. 데이터베이스 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트를 생성합니다.
2. `backend/config/database.sql` 파일의 내용을 Supabase SQL 에디터에서 실행합니다.
3. Supabase 프로젝트 설정에서 URL과 API 키를 복사하여 환경 변수에 설정합니다.

### 4. Google Gemini API 설정

1. [Google AI Studio](https://makersuite.google.com/app/apikey)에서 API 키를 생성합니다.
2. 생성된 API 키를 `GEMINI_API_KEY` 환경 변수에 설정합니다.

### 5. 애플리케이션 실행

```bash
# 백엔드 서버 실행
cd backend
npm run dev

# 새 터미널에서 프론트엔드 실행
cd frontend
npm start
```

## 🌐 접속 방법

- **교사용**: http://localhost:3000/teacher
- **학생용**: http://localhost:3000/student

## 📱 사용 방법

### 교사 사용법

1. `/teacher` 페이지에서 회원가입 또는 로그인
2. 대시보드에서 "새 활동방 만들기" 클릭
3. 활동방 제목과 설명 입력
4. 생성된 6자리 코드를 학생들에게 공유
5. 학생들의 응답을 실시간으로 확인

### 학생 사용법

1. `/student` 페이지에서 교사가 제공한 6자리 코드 입력
2. 이름 입력 후 활동 시작
3. See-Think-Wonder 3단계 순서대로 진행:
   - **SEE**: 이미지를 관찰하고 구체적으로 기술
   - **THINK**: 관찰한 내용을 바탕으로 해석과 생각 기록
   - **WONDER**: 궁금한 점이나 더 알고 싶은 것 기록
4. 모든 단계 완료 후 제출

## 🎯 향후 개발 계획

- [ ] AI 기반 자동 피드백 시스템 구현
- [ ] 다양한 사고루틴 추가 (Connect-Extend-Challenge 등)
- [ ] 실시간 협업 기능
- [ ] 학습 분석 대시보드
- [ ] 모바일 앱 개발

## 🔧 개발 환경

- Node.js 18+
- npm 8+
- 모던 웹 브라우저 (Chrome, Firefox, Safari, Edge)

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 🤝 기여하기

버그 리포트, 기능 제안, 풀 리퀘스트를 환영합니다!

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해주세요. 