const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 인증 미들웨어
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: '인증 토큰이 없습니다.' });
    }

    const token = authHeader.split(' ')[1];
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

    // 입력 검증
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
router.get('/my-rooms', authenticateToken, async (req, res) => {
  try {
    const teacherId = req.user.id;

    const { data: rooms, error } = await supabase
      .from('activity_rooms')
      .select(`
        *,
        student_responses(count)
      `)
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch rooms error:', error);
      return res.status(500).json({ error: '활동방 목록을 불러오는데 실패했습니다.' });
    }

    res.json({ rooms });

  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 방 코드로 활동방 조회 (학생용)
router.get('/join/:roomCode', async (req, res) => {
  try {
    const { roomCode } = req.params;

    // 6자리 숫자 코드 검증
    if (!/^\d{6}$/.test(roomCode)) {
      return res.status(400).json({ error: '올바른 6자리 방 코드를 입력해주세요.' });
    }

    const { data: room, error } = await supabase
      .from('activity_rooms')
      .select(`
        id,
        title,
        description,
        room_code,
        routine_type,
        is_active,
        teachers(name)
      `)
      .eq('room_code', roomCode)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: '존재하지 않는 방 코드입니다.' });
      }
      console.error('Room fetch error:', error);
      return res.status(500).json({ error: '활동방 정보를 불러오는데 실패했습니다.' });
    }

    res.json({ room });

  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 활동방 상세 조회
router.get('/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const teacherId = req.user.id;

    const { data: room, error } = await supabase
      .from('activity_rooms')
      .select(`
        *,
        student_responses(
          id,
          student_name,
          see_response,
          think_response,
          wonder_response,
          created_at
        )
      `)
      .eq('id', roomId)
      .eq('teacher_id', teacherId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: '존재하지 않는 활동방입니다.' });
      }
      console.error('Room detail fetch error:', error);
      return res.status(500).json({ error: '활동방 정보를 불러오는데 실패했습니다.' });
    }

    res.json({ room });

  } catch (error) {
    console.error('Get room detail error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 활동방 수정
router.put('/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { title, description } = req.body;
    const teacherId = req.user.id;

    // 입력 검증
    if (!title) {
      return res.status(400).json({ error: '활동방 제목을 입력해주세요.' });
    }

    const { data: room, error } = await supabase
      .from('activity_rooms')
      .update({
        title: title,
        description: description || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId)
      .eq('teacher_id', teacherId)
      .select()
      .single();

    if (error) {
      console.error('Room update error:', error);
      return res.status(500).json({ error: '활동방 수정에 실패했습니다.' });
    }

    res.json({
      message: '활동방이 수정되었습니다.',
      room: room
    });

  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 활동방 비활성화
router.delete('/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const teacherId = req.user.id;

    const { data: room, error } = await supabase
      .from('activity_rooms')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId)
      .eq('teacher_id', teacherId)
      .select()
      .single();

    if (error) {
      console.error('Room deactivation error:', error);
      return res.status(500).json({ error: '활동방 비활성화에 실패했습니다.' });
    }

    res.json({
      message: '활동방이 비활성화되었습니다.',
      room: room
    });

  } catch (error) {
    console.error('Deactivate room error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router; 