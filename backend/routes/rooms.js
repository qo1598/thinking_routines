const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// 인증 미들웨어
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }

    req.user = userData.user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: '인증 처리 중 오류가 발생했습니다.' });
  }
};

// 6자리 숫자 코드 생성 함수
const generateRoomCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 고유한 방 코드 생성 (중복 체크)
const generateUniqueRoomCode = async () => {
  let code;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    code = generateRoomCode();
    
    // 기존 코드와 중복 체크
    const { data: existingRoom, error } = await supabase
      .from('activity_rooms')
      .select('id')
      .eq('room_code', code)
      .eq('is_active', true)
      .single();

    if (error && error.code === 'PGRST116') {
      // 데이터가 없음 (중복 없음)
      isUnique = true;
    } else if (error) {
      console.error('Room code check error:', error);
      attempts++;
    } else {
      // 중복 발견
      attempts++;
    }
  }

  if (!isUnique) {
    throw new Error('고유한 방 코드 생성에 실패했습니다.');
  }

  return code;
};

// 활동방 생성
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { title, description, routine_type = 'see-think-wonder' } = req.body;
    const teacherId = req.user.id;

    if (!title) {
      return res.status(400).json({ error: '활동방 제목을 입력해주세요.' });
    }

    // 고유한 6자리 방 코드 생성
    const roomCode = await generateUniqueRoomCode();

    // 활동방 생성
    const { data: roomData, error: roomError } = await supabase
      .from('activity_rooms')
      .insert([
        {
          teacher_id: teacherId,
          title: title,
          description: description || '',
          room_code: roomCode,
          routine_type: routine_type,
          status: 'draft', // 기존 로컬의 status 필드 유지
          is_active: true,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (roomError) {
      console.error('Room creation error:', roomError);
      return res.status(500).json({ error: '활동방 생성에 실패했습니다.' });
    }

    res.status(201).json({
      message: '활동방이 생성되었습니다.',
      room: roomData
    });

  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 교사의 활동방 목록 조회
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data: roomsData, error: roomsError } = await supabase
      .from('activity_rooms')
      .select(`
        *,
        routine_templates (
          id,
          routine_type,
          content
        ),
        student_responses (
          id,
          student_name,
          submitted_at
        )
      `)
      .eq('teacher_id', req.user.id)
      .order('created_at', { ascending: false });

    if (roomsError) {
      console.error('Rooms fetch error:', roomsError);
      return res.status(500).json({ error: '활동방 목록 조회에 실패했습니다.' });
    }

    // 각 활동방의 통계 정보 추가
    const roomsWithStats = roomsData.map(room => ({
      ...room,
      stats: {
        total_responses: room.student_responses.length,
        template_count: room.routine_templates.length
      }
    }));

    res.json({ rooms: roomsWithStats });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: '활동방 목록 조회 중 오류가 발생했습니다.' });
  }
});

// 특정 활동방 조회
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: roomData, error: roomError } = await supabase
      .from('activity_rooms')
      .select(`
        *,
        routine_templates (
          id,
          routine_type,
          content,
          created_at
        ),
        student_responses (
          id,
          student_name,
          student_id,
          response_data,
          submitted_at,
          ai_analysis (
            id,
            analysis_data,
            feedback_data
          ),
          teacher_evaluations (
            id,
            teacher_feedback,
            score,
            evaluation_data
          )
        )
      `)
      .eq('id', id)
      .eq('teacher_id', req.user.id)
      .single();

    if (roomError) {
      if (roomError.code === 'PGRST116') {
        return res.status(404).json({ error: '활동방을 찾을 수 없습니다.' });
      } else {
        console.error('Room fetch error:', roomError);
        return res.status(500).json({ error: '활동방 조회에 실패했습니다.' });
      }
    }

    res.json({ room: roomData });
  } catch (error) {
    console.error('Get room by ID error:', error);
    res.status(500).json({ error: '활동방 조회 중 오류가 발생했습니다.' });
  }
});

// 활동방 상태 업데이트 (활성화/비활성화)
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active === 'undefined') {
      return res.status(400).json({ error: 'is_active 상태를 제공해야 합니다.' });
    }

    const { data: roomData, error: roomError } = await supabase
      .from('activity_rooms')
      .update({ is_active })
      .eq('id', id)
      .eq('teacher_id', req.user.id)
      .select()
      .single();

    if (roomError) {
      console.error('Update room status error:', roomError);
      return res.status(500).json({ error: '활동방 상태 업데이트에 실패했습니다.' });
    }

    if (!roomData) {
      return res.status(404).json({ error: '활동방을 찾을 수 없습니다.' });
    }

    res.json({ message: '활동방 상태가 업데이트되었습니다.', room: roomData });
  } catch (error) {
    console.error('Update room status error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 활동방 삭제
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('activity_rooms')
      .delete()
      .eq('id', id)
      .eq('teacher_id', req.user.id);

    if (error) {
      console.error('Delete room error:', error);
      return res.status(500).json({ error: '활동방 삭제에 실패했습니다.' });
    }

    res.json({ message: '활동방이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 특정 활동방에 학생 응답 생성
router.post('/:roomId/responses', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { student_name, response_data } = req.body;

    if (!student_name || !response_data) {
      return res.status(400).json({ error: '학생 이름과 응답 데이터를 모두 제공해야 합니다.' });
    }

    // 해당 활동방이 존재하는지 확인
    const { data: room, error: roomError } = await supabase
      .from('activity_rooms')
      .select('id')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return res.status(404).json({ error: '활동방을 찾을 수 없습니다.' });
    }

    // 학생 응답 삽입
    const { data: studentResponse, error: responseError } = await supabase
      .from('student_responses')
      .insert([
        {
          room_id: roomId,
          student_name: student_name,
          response_data: response_data,
          submitted_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (responseError) {
      console.error('Student response creation error:', responseError);
      return res.status(500).json({ error: '학생 응답 저장에 실패했습니다.' });
    }

    res.status(201).json({ message: '학생 응답이 성공적으로 저장되었습니다.', response: studentResponse });
  } catch (error) {
    console.error('Create student response error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 특정 활동방의 모든 학생 응답 조회 (교사용)
router.get('/:roomId/responses', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;

    // 활동방이 현재 교사의 소유인지 확인
    const { data: room, error: roomError } = await supabase
      .from('activity_rooms')
      .select('id')
      .eq('id', roomId)
      .eq('teacher_id', req.user.id)
      .single();

    if (roomError || !room) {
      return res.status(404).json({ error: '활동방을 찾을 수 없거나 접근 권한이 없습니다.' });
    }

    const { data: responses, error: responsesError } = await supabase
      .from('student_responses')
      .select(`
        *,
        ai_analysis (
          id,
          analysis_data,
          feedback_data
        ),
        teacher_evaluations (
          id,
          teacher_feedback,
          score,
          evaluation_data
        )
      `)
      .eq('room_id', roomId)
      .order('submitted_at', { ascending: false });

    if (responsesError) {
      console.error('Fetch student responses error:', responsesError);
      return res.status(500).json({ error: '학생 응답 조회에 실패했습니다.' });
    }

    res.json({ responses });
  } catch (error) {
    console.error('Get student responses error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 특정 학생 응답 상세 조회 (교사용)
router.get('/:roomId/responses/:responseId', authenticateToken, async (req, res) => {
  try {
    const { roomId, responseId } = req.params;

    // 활동방이 현재 교사의 소유인지 확인
    const { data: room, error: roomError } = await supabase
      .from('activity_rooms')
      .select('id')
      .eq('id', roomId)
      .eq('teacher_id', req.user.id)
      .single();

    if (roomError || !room) {
      return res.status(404).json({ error: '활동방을 찾을 수 없거나 접근 권한이 없습니다.' });
    }

    const { data: response, error: responseError } = await supabase
      .from('student_responses')
      .select(`
        *,
        ai_analysis (
          id,
          analysis_data,
          feedback_data
        ),
        teacher_evaluations (
          id,
          teacher_feedback,
          score,
          evaluation_data
        )
      `)
      .eq('id', responseId)
      .eq('room_id', roomId)
      .single();

    if (responseError || !response) {
      return res.status(404).json({ error: '학생 응답을 찾을 수 없습니다.' });
    }

    res.json({ response });
  } catch (error) {
    console.error('Get student response detail error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 교사가 학생 응답에 대한 AI 분석 요청 (새로운 라우트)
router.post('/:roomId/responses/:responseId/analyze', authenticateToken, async (req, res) => {
  try {
    const { roomId, responseId } = req.params;
    const { routineType, imageData } = req.body;

    if (!routineType || !imageData) {
      return res.status(400).json({ error: '사고루틴 유형과 이미지 데이터가 필요합니다.' });
    }

    // 활동방이 현재 교사의 소유인지 확인
    const { data: room, error: roomError } = await supabase
      .from('activity_rooms')
      .select('id')
      .eq('id', roomId)
      .eq('teacher_id', req.user.id)
      .single();

    if (roomError || !room) {
      return res.status(404).json({ error: '활동방을 찾을 수 없거나 접근 권한이 없습니다.' });
    }

    // Gemini API 호출 (실제 API 로직은 여기에 통합되거나 별도 유틸리티 함수로 분리)
    // 이 부분은 임시 응답이며, 실제 Gemini API 통합 로직이 필요합니다.
    const analysis = `AI 분석 결과: ${routineType} 루틴에 대한 이미지 분석이 성공적으로 완료되었습니다.`;
    const confidence = 90;

    // 기존 AI 분석 데이터가 있는지 확인
    const { data: existingAnalysis, error: fetchError } = await supabase
      .from('ai_analysis')
      .select('id')
      .eq('response_id', responseId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Fetch existing analysis error:', fetchError);
      return res.status(500).json({ error: '기존 분석 데이터 조회에 실패했습니다.' });
    }

    let aiAnalysisResult;
    if (existingAnalysis) {
      // 기존 데이터가 있으면 업데이트
      const { data, error } = await supabase
        .from('ai_analysis')
        .update({ analysis_data: analysis, confidence_score: confidence, generated_at: new Date().toISOString() })
        .eq('response_id', responseId)
        .select()
        .single();
      aiAnalysisResult = data;
      if (error) throw error;
    } else {
      // 새 데이터 삽입
      const { data, error } = await supabase
        .from('ai_analysis')
        .insert([
          {
            response_id: responseId,
            analysis_data: analysis,
            confidence_score: confidence,
            generated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
      aiAnalysisResult = data;
      if (error) throw error;
    }

    res.json({ message: 'AI 분석이 완료되었습니다.', analysis: aiAnalysisResult });

  } catch (error) {
    console.error('AI analysis request error:', error);
    res.status(500).json({ error: 'AI 분석 요청 중 오류가 발생했습니다.' });
  }
});

// 교사가 학생 응답에 피드백 및 점수 기록 (새로운 라우트)
router.post('/:roomId/responses/:responseId/evaluate', authenticateToken, async (req, res) => {
  try {
    const { roomId, responseId } = req.params;
    const { teacher_feedback, score } = req.body;

    if (!teacher_feedback || typeof score === 'undefined') {
      return res.status(400).json({ error: '교사 피드백과 점수를 모두 제공해야 합니다.' });
    }

    // 활동방이 현재 교사의 소유인지 확인
    const { data: room, error: roomError } = await supabase
      .from('activity_rooms')
      .select('id')
      .eq('id', roomId)
      .eq('teacher_id', req.user.id)
      .single();

    if (roomError || !room) {
      return res.status(404).json({ error: '활동방을 찾을 수 없거나 접근 권한이 없습니다.' });
    }

    // 기존 교사 평가 데이터가 있는지 확인
    const { data: existingEvaluation, error: fetchError } = await supabase
      .from('teacher_evaluations')
      .select('id')
      .eq('response_id', responseId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Fetch existing evaluation error:', fetchError);
      return res.status(500).json({ error: '기존 평가 데이터 조회에 실패했습니다.' });
    }

    let teacherEvaluationResult;
    if (existingEvaluation) {
      // 기존 데이터가 있으면 업데이트
      const { data, error } = await supabase
        .from('teacher_evaluations')
        .update({ teacher_feedback, score, evaluated_at: new Date().toISOString() })
        .eq('response_id', responseId)
        .select()
        .single();
      teacherEvaluationResult = data;
      if (error) throw error;
    } else {
      // 새 데이터 삽입
      const { data, error } = await supabase
        .from('teacher_evaluations')
        .insert([
          {
            response_id: responseId,
            teacher_feedback,
            score,
            evaluated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
      teacherEvaluationResult = data;
      if (error) throw error;
    }

    res.json({ message: '교사 피드백이 저장되었습니다.', evaluation: teacherEvaluationResult });

  } catch (error) {
    console.error('Teacher evaluation error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router; 