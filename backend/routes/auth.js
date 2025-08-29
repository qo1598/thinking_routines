const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// 회원가입
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // 입력 값 검증
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: '이메일, 비밀번호, 이름을 모두 입력해주세요.' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: '비밀번호는 최소 6자리 이상이어야 합니다.' });
    }

    // Supabase Auth로 사용자 생성
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
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

    // 교사 정보를 teachers 테이블에 저장
    if (authData.user) {
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .insert([
          {
            id: authData.user.id,
            email: authData.user.email,
            name: name,
            created_at: new Date().toISOString() // created_at 필드 추가
          }
        ])
        .select();

      if (teacherError) {
        console.error('Teacher creation error:', teacherError);
        // Auth 사용자 삭제 (롤백) - 관리자 권한이 아님으로 삭제.
        // await supabase.auth.admin.deleteUser(authData.user.id);
        return res.status(500).json({ error: '교사 정보 저장에 실패했습니다.' });
      }

      res.status(201).json({
        message: '회원가입이 완료되었습니다. 이메일을 확인해주세요.',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: name
        }
      });
    } else {
      // authData.user가 없는 경우 (예: 이메일 인증 필요 시)
      res.status(200).json({
        message: '회원가입 요청이 처리되었습니다. 이메일을 확인하여 계정을 활성화해주세요.'
      });
    }

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
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return res.status(500).json({ error: '로그아웃에 실패했습니다.' });
    }

    res.json({ message: '로그아웃 되었습니다.' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: '로그아웃 중 오류가 발생했습니다.' });
  }
});

// 현재 사용자 정보 조회
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
    }

    // 토큰 유효성 검증 (선택 사항, Supabase JWT는 클라이언트에서 자동으로 처리)
    // 실제 프로덕션에서는 서버에서 토큰 유효성 검증 로직을 추가하는 것이 좋음
    // const { data: user, error: userError } = await supabase.auth.getUser(token);

    const { data: { user }, error: userError } = await supabase.auth.getUser(); // 세션에서 사용자 정보 가져오기

    if (userError || !user) {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }

    // 교사 정보 조회
    const { data: teacherData, error: teacherError } = await supabase
      .from('teachers')
      .select('*')
      .eq('id', user.id)
      .single();

    if (teacherError) {
      console.error('Teacher fetch error for /me:', teacherError);
      return res.status(500).json({ error: '사용자 정보 조회에 실패했습니다.' });
    }

    res.json({ user: teacherData });
  } catch (error) {
    console.error('/me route error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router; 