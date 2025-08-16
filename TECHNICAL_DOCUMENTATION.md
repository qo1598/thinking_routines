 # 🛠️ 사고루틴 웹앱 기술 문서

## 📋 목차
1. [프로젝트 개요](#프로젝트-개요)
2. [시스템 아키텍처](#시스템-아키텍처)
3. [기술 스택](#기술-스택)
4. [백엔드 구조](#백엔드-구조)
5. [프론트엔드 구조](#프론트엔드-구조)
6. [데이터베이스 설계](#데이터베이스-설계)
7. [AI 통합](#ai-통합)
8. [배포 및 인프라](#배포-및-인프라)
9. [보안 및 인증](#보안-및-인증)
10. [성능 최적화](#성능-최적화)

---

## 📊 프로젝트 개요

### 🎯 **프로젝트 정보**
- **이름**: thinking-routines-app
- **버전**: 1.0.0
- **라이선스**: MIT
- **Node.js 버전**: >=18.0.0
- **배포 URL**: [thinking-routines.vercel.app](https://thinking-routines.vercel.app/)

### 💡 **핵심 기능**
- 7가지 하버드 Project Zero 사고루틴 구현
- 실시간 교사-학생 상호작용
- AI 기반 학습 분석 및 피드백
- 음성 입력 지원 (STT)
- 포트폴리오 시스템

---

## 🏗️ 시스템 아키텍처

### **전체 아키텍처**
```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                       │
├─────────────────────────────────────────────────────────────┤
│                     Frontend (React)                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐ │
│  │   Teacher UI    │  │   Student UI    │  │  Landing Page │ │
│  └─────────────────┘  └─────────────────┘  └───────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Backend API (Node.js)                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐ │
│  │   Auth Routes   │  │   Room Routes   │  │   AI Routes   │ │
│  └─────────────────┘  └─────────────────┘  └───────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                     External Services                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐ │
│  │   Supabase      │  │   Google AI     │  │   Channel.io  │ │
│  │   (Database)    │  │   (Gemini)      │  │   (Support)   │ │
│  └─────────────────┘  └─────────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### **데이터 플로우**
```
Teacher                Student               AI Service
   │                      │                      │
   ├─ Create Room ────────┼─────────────────────▶│
   │                      │                      │
   ├─ Generate Code ──────┤                      │
   │                      │                      │
   │                   ┌──▼── Join Room          │
   │                   │                         │
   │                   ├─── Submit Response ────▶│
   │                   │                         │
   │◀─ Real-time ──────┼─── Get Analysis ◀──────┤
   │   Updates         │                         │
   │                   │                         │
   ├─ Review & ────────┤                         │
   │   Feedback        │                         │
```

---

## 🔧 기술 스택

### **Frontend**
```json
{
  "core": {
    "React": "^19.1.0",
    "React DOM": "^19.1.0", 
    "TypeScript": "^4.9.5",
    "React Router": "^7.6.3"
  },
  "styling": {
    "Tailwind CSS": "^3.x",
    "@tailwindcss/forms": "^0.5.10"
  },
  "state_management": {
    "React Hooks": "Built-in",
    "Local State": "useState, useEffect"
  },
  "api_client": {
    "Axios": "^1.10.0",
    "@supabase/supabase-js": "^2.50.5"
  },
  "ai_integration": {
    "@google/generative-ai": "^0.24.1"
  },
  "testing": {
    "@testing-library/react": "^16.3.0",
    "@testing-library/jest-dom": "^6.6.3",
    "Jest": "Built-in with CRA"
  },
  "support": {
    "@channel.io/channel-web-sdk-loader": "2.0.0"
  }
}
```

### **Backend**
```json
{
  "runtime": {
    "Node.js": ">=18.0.0",
    "Express.js": "^5.1.0"
  },
  "database": {
    "@supabase/supabase-js": "^2.50.5",
    "PostgreSQL": "via Supabase"
  },
  "authentication": {
    "Supabase Auth": "^2.50.5",
    "JWT": "^9.0.2",
    "bcryptjs": "^2.4.3"
  },
  "ai_services": {
    "@google/genai": "^1.13.0",
    "Google Gemini": "2.0-flash-lite"
  },
  "middleware": {
    "CORS": "^2.8.5",
    "Multer": "^1.4.5-lts.1",
    "dotenv": "^17.2.0"
  },
  "development": {
    "nodemon": "^3.1.10",
    "TypeScript": "Dev support"
  }
}
```

### **Infrastructure & Services**
```json
{
  "hosting": {
    "Vercel": "Frontend + Serverless Functions",
    "Edge Network": "Global CDN"
  },
  "database": {
    "Supabase": "PostgreSQL + Real-time + Auth",
    "Storage": "File uploads via Supabase Storage"
  },
  "ai_services": {
    "Google AI Studio": "Gemini API",
    "Model": "gemini-2.0-flash-lite"
  },
  "monitoring": {
    "Channel.io": "Customer Support",
    "Vercel Analytics": "Performance monitoring"
  }
}
```

---

## 🔙 백엔드 구조

### **서버 설정 (`server.js`)**
```javascript
// 핵심 미들웨어 스택
app.use(cors());           // CORS 허용
app.use(express.json());   // JSON 파싱

// 서비스 초기화
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);
```

### **API 라우트 구조**
```
/api/
├── auth/                    # 인증 관련
│   ├── POST /signup        # 교사 회원가입
│   ├── POST /login         # 교사 로그인
│   └── POST /logout        # 로그아웃
├── rooms/                   # 활동방 관리
│   ├── POST /create        # 활동방 생성
│   ├── GET /:roomId        # 활동방 조회
│   ├── PUT /:roomId        # 활동방 수정
│   ├── DELETE /:roomId     # 활동방 삭제
│   └── GET /teacher/:teacherId  # 교사별 활동방 목록
├── responses/               # 학생 응답 관리
│   ├── POST /submit        # 응답 제출
│   ├── GET /:roomId        # 활동방별 응답 목록
│   └── GET /:responseId    # 개별 응답 조회
└── analyze-routine-image/   # AI 분석
    └── POST /              # 이미지 분석 요청
```

### **인증 미들웨어**
```javascript
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: '인증 토큰이 필요합니다.' 
      });
    }

    const { data: userData, error: userError } = 
      await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      return res.status(401).json({ 
        error: '유효하지 않은 토큰입니다.' 
      });
    }

    req.user = userData.user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      error: '인증 처리 중 오류가 발생했습니다.' 
    });
  }
};
```

### **핵심 비즈니스 로직**

#### **1. 활동방 코드 생성**
```javascript
// 6자리 고유 코드 생성
const generateUniqueRoomCode = async () => {
  let code;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 중복 체크
    const { data: existingRoom, error } = await supabase
      .from('activity_rooms')
      .select('id')
      .eq('room_code', code)
      .eq('is_active', true)
      .single();

    if (error && error.code === 'PGRST116') {
      isUnique = true; // 중복 없음
    } else {
      attempts++;
    }
  }

  return code;
};
```

#### **2. AI 분석 프로세스**
```javascript
// Gemini API 호출 로직
const response = await ai.models.generateContent({
  model: 'gemini-2.0-flash-lite',  // 경제적 모델 선택
  contents: [
    generateAnalysisPrompt(routineType),
    fileToGenerativePart(imageBuffer, mimeType)
  ]
});

// 신뢰도 계산
const confidence = calculateConfidence(analysisText);

// 결과 저장
const { data, error } = await supabase
  .from('ai_analysis')
  .insert([{
    response_id: responseId,
    analysis_data: analysis,
    confidence_score: confidence,
    generated_at: new Date().toISOString()
  }]);
```

---

## 🎨 프론트엔드 구조

### **컴포넌트 아키텍처**
```
src/
├── components/
│   ├── LandingPage.tsx              # 메인 랜딩 페이지
│   ├── TeacherLogin.tsx             # 교사 인증
│   ├── TeacherDashboard.tsx         # 교사 대시보드
│   ├── TeacherRoomDetail.tsx        # 활동방 상세
│   ├── TeacherRoomManagement.tsx    # 활동방 관리
│   ├── StudentEntry.tsx             # 학생 입장
│   ├── StudentPortfolio.tsx         # 학생 포트폴리오
│   ├── SeeThinkWonderForm.tsx       # 사고루틴 폼
│   ├── StudentActivityDetail.tsx    # 활동 상세
│   ├── StudentResponseDetail.tsx    # 응답 상세
│   ├── StudentActivityExplore.tsx   # 활동 탐색
│   └── ThinkingRoutineAnalysis.tsx  # AI 분석 UI
├── lib/
│   └── supabase.ts                  # Supabase 클라이언트
└── App.tsx                          # 라우팅 설정
```

### **라우팅 구조**
```javascript
// React Router 설정
<Routes>
  {/* 공통 */}
  <Route path="/" element={<LandingPage />} />
  
  {/* 교사용 */}
  <Route path="/teacher" element={<TeacherLogin />} />
  <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
  <Route path="/teacher/room/:roomId" element={<TeacherRoomDetail />} />
  <Route path="/teacher/room/:roomId/response/:responseId" 
         element={<StudentResponseDetail />} />
  
  {/* 학생용 */}
  <Route path="/student" element={<StudentEntry />} />
  <Route path="/student/activity/:roomId" element={<SeeThinkWonderForm />} />
  <Route path="/student/explore/:roomId" element={<StudentActivityExplore />} />
</Routes>
```

### **상태 관리 패턴**
```javascript
// 로컬 상태 관리 (React Hooks)
const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
const [room, setRoom] = useState<ActivityRoom | null>(null);
const [responses, setResponses] = useState<ThinkingRoutineResponse>({
  see: '',
  think: '',
  wonder: '',
  fourth_step: ''
});

// Supabase 실시간 구독
useEffect(() => {
  const subscription = supabase
    .channel('responses')
    .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'student_responses' },
        (payload) => {
          setResponses(prev => [...prev, payload.new]);
        }
    )
    .subscribe();

  return () => subscription.unsubscribe();
}, []);
```

### **타입 시스템 (TypeScript)**
```typescript
// 핵심 인터페이스 정의
interface ActivityRoom {
  id: string;
  teacher_id: string;
  title: string;
  description: string;
  room_code: string;
  thinking_routine_type: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

interface StudentResponse {
  id: string;
  room_id: string;
  student_name: string;
  response_data: ThinkingRoutineResponse;
  submitted_at: string;
}

interface ThinkingRoutineResponse {
  see: string;
  think: string;
  wonder: string;
  fourth_step?: string;
  [key: string]: string | undefined;
}
```

---

## 🗄️ 데이터베이스 설계

### **ERD (개체-관계 다이어그램)**
```
Teachers (교사)
├─ id (PK)
├─ email (UNIQUE)
├─ name
├─ created_at
└─ updated_at

Activity_Rooms (활동방)
├─ id (PK)
├─ teacher_id (FK → Teachers.id)
├─ title
├─ description  
├─ room_code (UNIQUE, 6자리)
├─ thinking_routine_type
├─ status
├─ created_at
└─ updated_at

Routine_Templates (루틴 템플릿)
├─ id (PK)
├─ room_id (FK → Activity_Rooms.id)
├─ routine_type
├─ content (JSONB)
├─ created_at
└─ updated_at

Student_Responses (학생 응답)
├─ id (PK)
├─ room_id (FK → Activity_Rooms.id)
├─ student_name
├─ student_id
├─ response_data (JSONB)
├─ is_draft
├─ submitted_at
└─ updated_at

AI_Analysis (AI 분석)
├─ id (PK)
├─ response_id (FK → Student_Responses.id)
├─ analysis_data (JSONB)
├─ feedback_data (JSONB)
└─ created_at

Teacher_Evaluations (교사 평가)
├─ id (PK)
├─ response_id (FK → Student_Responses.id)
├─ teacher_id (FK → Teachers.id)
├─ teacher_feedback
├─ score (1-5)
├─ evaluation_data (JSONB)
├─ created_at
└─ updated_at
```

### **주요 테이블 상세**

#### **1. Activity_Rooms**
```sql
CREATE TABLE activity_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    room_code VARCHAR(6) UNIQUE NOT NULL,
    thinking_routine_type VARCHAR(50) NOT NULL DEFAULT 'see-think-wonder',
    status VARCHAR(20) DEFAULT 'draft' 
        CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **2. Student_Responses (JSONB 구조)**
```sql
-- response_data JSONB 예시
{
  "see": "이미지에서 파란색 하늘과 구름이 보입니다.",
  "think": "날씨가 좋아 보여서 기분이 좋아집니다.",
  "wonder": "구름은 어떻게 만들어지는지 궁금합니다.",
  "metadata": {
    "completion_time": 180,
    "voice_input_used": true,
    "session_id": "sess_123"
  }
}
```

#### **3. AI_Analysis (분석 데이터 구조)**
```sql
-- analysis_data JSONB 예시
{
  "overall_score": 85,
  "detailed_analysis": {
    "see_quality": 80,
    "think_quality": 85,
    "wonder_quality": 90,
    "coherence": 85,
    "creativity": 80
  },
  "strengths": [
    "구체적인 관찰",
    "논리적 추론",
    "창의적 질문"
  ],
  "improvements": [
    "더 다양한 관점 고려",
    "근거 제시 강화"
  ],
  "confidence": 92
}
```

### **인덱스 최적화**
```sql
-- 성능 최적화를 위한 인덱스
CREATE INDEX idx_activity_rooms_teacher_id ON activity_rooms(teacher_id);
CREATE INDEX idx_activity_rooms_room_code ON activity_rooms(room_code);
CREATE INDEX idx_activity_rooms_status ON activity_rooms(status);
CREATE INDEX idx_student_responses_room_id ON student_responses(room_id);
CREATE INDEX idx_student_responses_submitted_at ON student_responses(submitted_at);
CREATE INDEX idx_ai_analysis_response_id ON ai_analysis(response_id);

-- JSONB 인덱스
CREATE INDEX idx_student_responses_data_gin ON student_responses 
USING GIN (response_data);
CREATE INDEX idx_ai_analysis_data_gin ON ai_analysis 
USING GIN (analysis_data);
```

### **RLS (Row Level Security) 정책**
```sql
-- 교사는 자신의 데이터만 접근 가능
CREATE POLICY "Teachers can only access their own data" ON teachers
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Teachers can only access their own rooms" ON activity_rooms
    FOR ALL USING (teacher_id = auth.uid());

-- 학생 응답은 활동방 기반 접근 제어
CREATE POLICY "Students can access room responses" ON student_responses
    FOR SELECT USING (
        room_id IN (
            SELECT id FROM activity_rooms 
            WHERE status = 'active'
        )
    );
```

---

## 🤖 AI 통합

### **Google Gemini API 통합**

#### **1. 초기화 및 설정**
```javascript
// 백엔드: Gemini AI 초기화
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY 
});

// 모델 선택: 비용 효율적인 gemini-2.0-flash-lite 사용
const model = 'gemini-2.0-flash-lite';
```

#### **2. 이미지 분석 프로세스**
```javascript
// 이미지 전처리
const fileToGenerativePart = (buffer, mimeType) => {
  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType
    }
  };
};

// AI 분석 요청
const analyzeStudentResponse = async (imageBuffer, mimeType, routineType) => {
  const prompt = generateAnalysisPrompt(routineType);
  const imagePart = fileToGenerativePart(imageBuffer, mimeType);

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-lite',
    contents: [prompt, imagePart]
  });

  return {
    analysis: response.text,
    confidence: calculateConfidence(response.text),
    metadata: {
      model: 'gemini-2.0-flash-lite',
      timestamp: new Date().toISOString(),
      routineType
    }
  };
};
```

#### **3. 사고루틴별 분석 프롬프트**
```javascript
const generateAnalysisPrompt = (routineType) => {
  const basePrompt = `
당신은 한국의 사고루틴(Thinking Routines) 교육 전문가입니다.
학생이 작성한 사고루틴 활동 결과물을 분석하여 교사에게 
도움이 되는 피드백을 제공하는 것이 목표입니다.

**평가 기준:**
1. 내용의 적절성: 각 단계의 목적에 맞는 응답인가?
2. 구체성: 추상적이지 않고 구체적인 내용인가?  
3. 논리적 연결: 단계들이 논리적으로 연결되는가?
4. 깊이: 표면적이지 않고 깊이 있는 사고가 드러나는가?
5. 창의성: 독창적이고 다양한 관점이 포함되어 있는가?
  `;

  const routineSpecificPrompts = {
    'see-think-wonder': `
**See-Think-Wonder 사고루틴 분석:**
- SEE: 객관적 관찰의 정확성과 구체성
- THINK: 관찰을 바탕으로 한 추론의 논리성
- WONDER: 호기심과 탐구 의지의 표현
    `,
    '4c': `
**4C 사고루틴 분석:**
- CONNECT: 기존 지식과의 연결성
- CHALLENGE: 비판적 사고의 깊이
- CONCEPTS: 핵심 개념 파악 능력
- CHANGES: 실천적 적용 가능성
    `,
    // ... 다른 루틴들
  };

  return basePrompt + routineSpecificPrompts[routineType];
};
```

#### **4. 신뢰도 계산 알고리즘**
```javascript
const calculateConfidence = (analysisText) => {
  let confidence = 70; // 기본 신뢰도

  // 텍스트 길이 기반 조정
  if (analysisText.length > 500) confidence += 10;
  if (analysisText.length > 1000) confidence += 10;

  // 키워드 존재 여부 확인
  const qualityKeywords = ['구체적', '논리적', '창의적', '깊이', '연결'];
  const keywordCount = qualityKeywords.filter(keyword => 
    analysisText.includes(keyword)
  ).length;
  confidence += keywordCount * 2;

  // 구조화된 응답 확인
  if (analysisText.includes('**') || analysisText.includes('###')) {
    confidence += 5;
  }

  return Math.min(95, Math.max(60, confidence));
};
```

---

## 🚀 배포 및 인프라

### **Vercel 배포 설정**

#### **1. vercel.json 구성**
```json
{
  "installCommand": "npm install && npm install --prefix backend && npm install --prefix frontend",
  "buildCommand": "npm run build --prefix frontend", 
  "outputDirectory": "frontend/build",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/backend/server.js"
    },
    {
      "source": "/(.*)", 
      "destination": "/index.html"
    }
  ]
}
```

#### **2. 환경 변수 설정**
```bash
# Vercel Environment Variables
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GEMINI_API_KEY=AIzaSyD...
JWT_SECRET=your-secret-key
NODE_ENV=production

# Frontend Environment Variables
REACT_APP_API_URL=https://thinking-routines.vercel.app
REACT_APP_SUPABASE_URL=https://xxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### **3. 빌드 프로세스**
```bash
# 의존성 설치
npm install --prefix backend
npm install --prefix frontend

# 프론트엔드 빌드
npm run build --prefix frontend

# 서버리스 함수로 백엔드 배포
vercel --prod
```

### **성능 최적화**

#### **1. 번들 크기 최적화**
```javascript
// React Code Splitting
const TeacherDashboard = lazy(() => import('./components/TeacherDashboard'));
const StudentEntry = lazy(() => import('./components/StudentEntry'));

// Tree Shaking 최적화
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
```

#### **2. 이미지 최적화**
```javascript
// Multer 설정으로 파일 크기 제한
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB 제한
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
    }
  }
});
```

#### **3. 데이터베이스 쿼리 최적화**
```javascript
// 필요한 필드만 선택
const { data } = await supabase
  .from('student_responses')
  .select('id, student_name, submitted_at, response_data')
  .eq('room_id', roomId)
  .order('submitted_at', { ascending: false })
  .limit(50);

// 실시간 구독 최적화
const subscription = supabase
  .channel(`room-${roomId}`)
  .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'student_responses',
        filter: `room_id=eq.${roomId}`
      },
      handleNewResponse
  )
  .subscribe();
```

---

## 🔐 보안 및 인증

### **인증 시스템**

#### **1. Supabase Auth 통합**
```javascript
// 회원가입 프로세스
const signUp = async (email, password, name) => {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }
    }
  });

  if (authData.user) {
    // 교사 정보를 별도 테이블에 저장
    await supabase.from('teachers').insert([{
      id: authData.user.id,
      email: authData.user.email,
      name: name,
      created_at: new Date().toISOString()
    }]);
  }
};
```

#### **2. JWT 토큰 관리**
```javascript
// 토큰 검증 미들웨어
const authenticateToken = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  const { data: userData, error } = await supabase.auth.getUser(token);
  
  if (error || !userData.user) {
    return res.status(401).json({ error: '인증 실패' });
  }

  req.user = userData.user;
  next();
};
```

### **데이터 보안**

#### **1. Row Level Security (RLS)**
```sql
-- 교사 데이터 보호
CREATE POLICY "Teachers own data only" ON teachers
    FOR ALL USING (auth.uid() = id);

-- 활동방 접근 제어  
CREATE POLICY "Teacher room access" ON activity_rooms
    FOR ALL USING (teacher_id = auth.uid());

-- 학생 응답 보호
CREATE POLICY "Room-based response access" ON student_responses
    FOR SELECT USING (
        room_id IN (
            SELECT id FROM activity_rooms 
            WHERE teacher_id = auth.uid() OR status = 'active'
        )
    );
```

#### **2. 입력 검증 및 새니타이제이션**
```javascript
// 입력 검증
const validateRoomData = (data) => {
  const { title, description, routine_type } = data;

  if (!title || title.length < 2 || title.length > 200) {
    throw new Error('제목은 2-200자 사이여야 합니다.');
  }

  const allowedRoutines = [
    'see-think-wonder', '4c', 'circle-of-viewpoints',
    'connect-extend-challenge', 'frayer-model',
    'used-to-think-now-think', 'think-puzzle-explore'
  ];

  if (!allowedRoutines.includes(routine_type)) {
    throw new Error('유효하지 않은 사고루틴 유형입니다.');
  }

  return true;
};

// XSS 방지
const sanitizeInput = (input) => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};
```

### **API 보안**

#### **1. Rate Limiting**
```javascript
// 요청 횟수 제한 (예: Express Rate Limit)
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100회 요청
  message: '요청 횟수가 초과되었습니다.'
});

app.use('/api/', apiLimiter);
```

#### **2. CORS 설정**
```javascript
const corsOptions = {
  origin: [
    'https://thinking-routines.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

---

## ⚡ 성능 최적화

### **프론트엔드 최적화**

#### **1. React 최적화**
```javascript
// 메모이제이션
const StudentResponseItem = memo(({ response }) => {
  return (
    <div className="response-item">
      {response.student_name}: {response.response_data.see}
    </div>
  );
});

// 콜백 최적화
const handleResponseSubmit = useCallback(async (responseData) => {
  await submitResponse(responseData);
  setSubmitted(true);
}, [submitResponse]);

// Effect 최적화
useEffect(() => {
  if (!roomId) return;
  
  const fetchData = async () => {
    const data = await fetchRoomData(roomId);
    setRoomData(data);
  };
  
  fetchData();
}, [roomId]); // 의존성 최소화
```

#### **2. 로딩 상태 관리**
```javascript
// 스켈레톤 로딩
const LoadingSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
  </div>
);

// 에러 바운더리
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div>문제가 발생했습니다. 새로고침해주세요.</div>;
    }

    return this.props.children;
  }
}
```

### **백엔드 최적화**

#### **1. 데이터베이스 최적화**
```sql
-- 쿼리 최적화: 필요한 컬럼만 선택
SELECT id, title, room_code, status 
FROM activity_rooms 
WHERE teacher_id = $1 AND status = 'active'
ORDER BY created_at DESC
LIMIT 20;

-- 인덱스 활용
CREATE INDEX CONCURRENTLY idx_student_responses_room_submitted 
ON student_responses(room_id, submitted_at DESC);

-- 파티셔닝 (대용량 데이터 처리)
CREATE TABLE student_responses_2024 PARTITION OF student_responses
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

#### **2. 캐싱 전략**
```javascript
// 메모리 캐시 (간단한 구현)
const cache = new Map();

const getCachedRoomData = (roomId) => {
  const cacheKey = `room_${roomId}`;
  
  if (cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey);
    if (Date.now() - timestamp < 5 * 60 * 1000) { // 5분 캐시
      return data;
    }
  }
  
  return null;
};

const setCachedRoomData = (roomId, data) => {
  cache.set(`room_${roomId}`, {
    data,
    timestamp: Date.now()
  });
};
```

### **AI 서비스 최적화**

#### **1. 요청 최적화**
```javascript
// 배치 처리
const batchAnalyzeResponses = async (responses) => {
  const batches = chunk(responses, 5); // 5개씩 배치
  
  const results = [];
  for (const batch of batches) {
    const batchResults = await Promise.all(
      batch.map(response => analyzeResponse(response))
    );
    results.push(...batchResults);
    
    // Rate limiting 고려 (1초 대기)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
};
```

#### **2. 에러 처리 및 재시도**
```javascript
const analyzeWithRetry = async (imageData, routineType, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await analyzeStudentResponse(imageData, routineType);
    } catch (error) {
      console.error(`Analysis attempt ${i + 1} failed:`, error);
      
      if (i === maxRetries - 1) throw error;
      
      // 지수 백오프
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
};
```

---

## 📊 모니터링 및 로깅

### **로깅 시스템**
```javascript
// 구조화된 로깅
const logger = {
  info: (message, meta = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  },
  error: (message, error, meta = {}) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  }
};

// 사용 예시
logger.info('Room created', { 
  roomId: newRoom.id, 
  teacherId: req.user.id,
  routineType: newRoom.thinking_routine_type 
});
```

### **성능 메트릭**
```javascript
// API 응답 시간 측정
const responseTime = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('API request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });
  
  next();
};

app.use(responseTime);
```

---

## 🔄 개발 워크플로우

### **개발 환경 설정**
```bash
# 1. 저장소 클론
git clone https://github.com/qo1598/thinking_routines.git
cd thinking_routines

# 2. 의존성 설치
npm install --prefix backend
npm install --prefix frontend

# 3. 환경 변수 설정
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 4. 개발 서버 실행
npm run dev --prefix backend    # 포트 3001
npm start --prefix frontend     # 포트 3000
```

### **테스트 전략**
```javascript
// 유닛 테스트 (Jest + React Testing Library)
import { render, screen, fireEvent } from '@testing-library/react';
import StudentEntry from '../components/StudentEntry';

describe('StudentEntry', () => {
  test('renders room code input', () => {
    render(<StudentEntry />);
    const input = screen.getByPlaceholderText('6자리 코드 입력');
    expect(input).toBeInTheDocument();
  });

  test('validates room code format', async () => {
    render(<StudentEntry />);
    const input = screen.getByPlaceholderText('6자리 코드 입력');
    
    fireEvent.change(input, { target: { value: '123' } });
    fireEvent.click(screen.getByText('참여하기'));
    
    expect(screen.getByText('6자리 코드를 입력해주세요')).toBeInTheDocument();
  });
});
```

### **배포 파이프라인**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          npm install --prefix backend
          npm install --prefix frontend
          
      - name: Run tests
        run: |
          npm test --prefix frontend -- --coverage --watchAll=false
          
      - name: Deploy to Vercel
        uses: vercel/action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 📈 확장성 고려사항

### **스케일링 전략**
```javascript
// 1. 데이터베이스 연결 풀링
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 2. 레디스 캐싱 도입 (향후)
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

// 3. 마이크로서비스 분리 계획
// - Auth Service
// - Room Management Service  
// - AI Analysis Service
// - Notification Service
```

### **모니터링 및 알림**
```javascript
// 헬스 체크 엔드포인트
app.get('/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      database: 'checking...',
      ai: 'checking...'
    }
  };

  try {
    // DB 연결 확인
    await supabase.from('teachers').select('id').limit(1);
    health.services.database = 'OK';
  } catch (error) {
    health.services.database = 'ERROR';
    health.status = 'DEGRADED';
  }

  try {
    // AI 서비스 확인
    await ai.models.generateContent({
      model: 'gemini-2.0-flash-lite',
      contents: ['Health check']
    });
    health.services.ai = 'OK';
  } catch (error) {
    health.services.ai = 'ERROR';
    health.status = 'DEGRADED';
  }

  res.json(health);
});
```

---

이 기술 문서는 사고루틴 웹앱의 전체적인 기술적 구조와 구현 세부사항을 다룹니다. 각 섹션은 실제 코드베이스를 기반으로 작성되었으며, 향후 개발과 유지보수에 참고할 수 있도록 구성되었습니다.