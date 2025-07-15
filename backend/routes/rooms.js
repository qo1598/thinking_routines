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

// 활동방 생성
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, thinking_routine_type = 'see-think-wonder' } = req.body;

    if (!title) {
      return res.status(400).json({ error: '활동방 제목을 입력해주세요.' });
    }

    // 활동방 생성
    const { data: roomData, error: roomError } = await supabase
      .from('activity_rooms')
      .insert([
        {
          teacher_id: req.user.id,
          title,
          description,
          thinking_routine_type,
          status: 'draft'
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
    res.status(500).json({ error: '활동방 생성 중 오류가 발생했습니다.' });
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
      }
      console.error('Room fetch error:', roomError);
      return res.status(500).json({ error: '활동방 조회에 실패했습니다.' });
    }

    res.json({ room: roomData });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: '활동방 조회 중 오류가 발생했습니다.' });
  }
});

// 활동방 업데이트
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;

    const { data: roomData, error: roomError } = await supabase
      .from('activity_rooms')
      .update(updateData)
      .eq('id', id)
      .eq('teacher_id', req.user.id)
      .select()
      .single();

    if (roomError) {
      if (roomError.code === 'PGRST116') {
        return res.status(404).json({ error: '활동방을 찾을 수 없습니다.' });
      }
      console.error('Room update error:', roomError);
      return res.status(500).json({ error: '활동방 수정에 실패했습니다.' });
    }

    res.json({
      message: '활동방이 수정되었습니다.',
      room: roomData
    });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ error: '활동방 수정 중 오류가 발생했습니다.' });
  }
});

// 활동방 삭제
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error: roomError } = await supabase
      .from('activity_rooms')
      .delete()
      .eq('id', id)
      .eq('teacher_id', req.user.id);

    if (roomError) {
      console.error('Room delete error:', roomError);
      return res.status(500).json({ error: '활동방 삭제에 실패했습니다.' });
    }

    res.json({ message: '활동방이 삭제되었습니다.' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ error: '활동방 삭제 중 오류가 발생했습니다.' });
  }
});

// 활동방 코드로 조회 (학생용)
router.get('/code/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const { data: roomData, error: roomError } = await supabase
      .from('activity_rooms')
      .select(`
        id,
        title,
        description,
        thinking_routine_type,
        status,
        routine_templates (
          id,
          routine_type,
          content
        )
      `)
      .eq('room_code', code.toUpperCase())
      .eq('status', 'active')
      .single();

    if (roomError) {
      if (roomError.code === 'PGRST116') {
        return res.status(404).json({ error: '활동방을 찾을 수 없습니다.' });
      }
      console.error('Room fetch by code error:', roomError);
      return res.status(500).json({ error: '활동방 조회에 실패했습니다.' });
    }

    res.json({ room: roomData });
  } catch (error) {
    console.error('Get room by code error:', error);
    res.status(500).json({ error: '활동방 조회 중 오류가 발생했습니다.' });
  }
});

// 사고루틴 템플릿 생성/수정
router.post('/:id/template', authenticateToken, async (req, res) => {
  try {
    const { id: roomId } = req.params;
    const { routine_type, content } = req.body;

    // 활동방 소유권 확인
    const { data: roomData, error: roomError } = await supabase
      .from('activity_rooms')
      .select('id')
      .eq('id', roomId)
      .eq('teacher_id', req.user.id)
      .single();

    if (roomError) {
      return res.status(404).json({ error: '활동방을 찾을 수 없습니다.' });
    }

    // 기존 템플릿 확인
    const { data: existingTemplate, error: checkError } = await supabase
      .from('routine_templates')
      .select('id')
      .eq('room_id', roomId)
      .eq('routine_type', routine_type)
      .single();

    let templateData;
    if (existingTemplate) {
      // 기존 템플릿 업데이트
      const { data: updatedTemplate, error: updateError } = await supabase
        .from('routine_templates')
        .update({ content })
        .eq('id', existingTemplate.id)
        .select()
        .single();

      if (updateError) {
        console.error('Template update error:', updateError);
        return res.status(500).json({ error: '템플릿 수정에 실패했습니다.' });
      }
      templateData = updatedTemplate;
    } else {
      // 새 템플릿 생성
      const { data: newTemplate, error: createError } = await supabase
        .from('routine_templates')
        .insert([{
          room_id: roomId,
          routine_type,
          content
        }])
        .select()
        .single();

      if (createError) {
        console.error('Template create error:', createError);
        return res.status(500).json({ error: '템플릿 생성에 실패했습니다.' });
      }
      templateData = newTemplate;
    }

    res.json({
      message: '사고루틴 템플릿이 저장되었습니다.',
      template: templateData
    });
  } catch (error) {
    console.error('Save template error:', error);
    res.status(500).json({ error: '템플릿 저장 중 오류가 발생했습니다.' });
  }
});

module.exports = router; 