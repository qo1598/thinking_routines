const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// 학생 응답 제출
router.post('/', async (req, res) => {
  try {
    const { room_id, student_name, student_id, response_data } = req.body;

    // 입력 값 검증
    if (!room_id || !student_name || !response_data) {
      return res.status(400).json({ 
        error: '필수 정보가 누락되었습니다.' 
      });
    }

    // 활동방이 활성 상태인지 확인
    const { data: roomData, error: roomError } = await supabase
      .from('activity_rooms')
      .select('id, status')
      .eq('id', room_id)
      .eq('status', 'active')
      .single();

    if (roomError || !roomData) {
      return res.status(404).json({ 
        error: '활성화된 활동방을 찾을 수 없습니다.' 
      });
    }

    // 학생 응답 저장
    const { data: responseData, error: responseError } = await supabase
      .from('student_responses')
      .insert([
        {
          room_id,
          student_name,
          student_id: student_id || null,
          response_data
        }
      ])
      .select()
      .single();

    if (responseError) {
      console.error('Response save error:', responseError);
      return res.status(500).json({ error: '응답 저장에 실패했습니다.' });
    }

    res.status(201).json({
      message: '응답이 성공적으로 제출되었습니다.',
      response: responseData
    });
  } catch (error) {
    console.error('Submit response error:', error);
    res.status(500).json({ error: '응답 제출 중 오류가 발생했습니다.' });
  }
});

// 특정 활동방의 응답 목록 조회 (교사용)
router.get('/room/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
    }

    // 토큰 검증
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }

    // 활동방 소유권 확인
    const { data: roomData, error: roomError } = await supabase
      .from('activity_rooms')
      .select('id')
      .eq('id', roomId)
      .eq('teacher_id', userData.user.id)
      .single();

    if (roomError) {
      return res.status(404).json({ error: '활동방을 찾을 수 없습니다.' });
    }

    // 응답 목록 조회
    const { data: responsesData, error: responsesError } = await supabase
      .from('student_responses')
      .select(`
        *,
        ai_analysis (
          id,
          analysis_data,
          feedback_data,
          created_at
        ),
        teacher_evaluations (
          id,
          teacher_feedback,
          score,
          evaluation_data,
          created_at
        )
      `)
      .eq('room_id', roomId)
      .order('submitted_at', { ascending: false });

    if (responsesError) {
      console.error('Responses fetch error:', responsesError);
      return res.status(500).json({ error: '응답 목록 조회에 실패했습니다.' });
    }

    res.json({ responses: responsesData });
  } catch (error) {
    console.error('Get responses error:', error);
    res.status(500).json({ error: '응답 목록 조회 중 오류가 발생했습니다.' });
  }
});

// 특정 응답 조회 (교사용)
router.get('/:responseId', async (req, res) => {
  try {
    const { responseId } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
    }

    // 토큰 검증
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }

    // 응답 조회 및 권한 확인
    const { data: responseData, error: responseError } = await supabase
      .from('student_responses')
      .select(`
        *,
        activity_rooms!inner (
          id,
          title,
          teacher_id
        ),
        ai_analysis (
          id,
          analysis_data,
          feedback_data,
          created_at
        ),
        teacher_evaluations (
          id,
          teacher_feedback,
          score,
          evaluation_data,
          created_at
        )
      `)
      .eq('id', responseId)
      .eq('activity_rooms.teacher_id', userData.user.id)
      .single();

    if (responseError) {
      return res.status(404).json({ error: '응답을 찾을 수 없습니다.' });
    }

    res.json({ response: responseData });
  } catch (error) {
    console.error('Get response error:', error);
    res.status(500).json({ error: '응답 조회 중 오류가 발생했습니다.' });
  }
});

module.exports = router; 