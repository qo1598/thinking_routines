const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // 서비스 역할 키 사용
);

// 회원가입
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // 입력 검증
    if (!email || !password || !name) {
      return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: '비밀번호는 최소 6자리 이상이어야 합니다.' });
    }

    // Supabase Auth를 사용한 회원가입
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // 이메일 인증 자동 완료
      user_metadata: {
        name: name
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      return res.status(400).json({ 
        error: authError.message === 'User already registered' 
          ? '이미 등록된 이메일입니다.' 
          : '회원가입에 실패했습니다.' 
      });
    }

    // teachers 테이블에 사용자 정보 저장
    const { data: teacherData, error: teacherError } = await supabase
      .from('teachers')
      .insert([
        {
          id: authData.user.id,
          email: email,
          name: name,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (teacherError) {
      console.error('Teacher insert error:', teacherError);
      // Auth 사용자 삭제 (롤백)
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ error: '사용자 정보 저장에 실패했습니다.' });
    }

    res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      user: {
        id: teacherData.id,
        email: teacherData.email,
        name: teacherData.name
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 입력 검증
    if (!email || !password) {
      return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' });
    }

    // Supabase Auth를 사용한 로그인
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('Login error:', authError);
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    // teachers 테이블에서 사용자 정보 조회
    const { data: teacherData, error: teacherError } = await supabase
      .from('teachers')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (teacherError) {
      console.error('Teacher fetch error:', teacherError);
      return res.status(500).json({ error: '사용자 정보를 불러오는데 실패했습니다.' });
    }

    res.json({
      message: '로그인 성공',
      session: authData.session,
      user: teacherData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 로그아웃
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: '인증 토큰이 없습니다.' });
    }

    const token = authHeader.split(' ')[1];
    const { error } = await supabase.auth.admin.signOut(token);

    if (error) {
      console.error('Logout error:', error);
      return res.status(500).json({ error: '로그아웃에 실패했습니다.' });
    }

    res.json({ message: '로그아웃되었습니다.' });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 사용자 정보 조회
router.get('/me', async (req, res) => {
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

    // teachers 테이블에서 사용자 정보 조회
    const { data: teacherData, error: teacherError } = await supabase
      .from('teachers')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    if (teacherError) {
      console.error('Teacher fetch error:', teacherError);
      return res.status(500).json({ error: '사용자 정보를 불러오는데 실패했습니다.' });
    }

    res.json({ user: teacherData });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router; 