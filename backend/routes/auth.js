const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// 교사 회원가입
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // 입력 값 검증
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: '이메일, 비밀번호, 이름을 모두 입력해주세요.' 
      });
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
      return res.status(400).json({ error: authError.message });
    }

    // 교사 정보를 teachers 테이블에 저장
    if (authData.user) {
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .insert([
          {
            id: authData.user.id,
            email: authData.user.email,
            name: name
          }
        ])
        .select();

      if (teacherError) {
        console.error('Teacher creation error:', teacherError);
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
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: '회원가입 중 오류가 발생했습니다.' });
  }
});

// 교사 로그인
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: '이메일과 비밀번호를 입력해주세요.' 
      });
    }

    // Supabase Auth로 로그인
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      return res.status(401).json({ error: '로그인에 실패했습니다.' });
    }

    // 교사 정보 조회
    const { data: teacherData, error: teacherError } = await supabase
      .from('teachers')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (teacherError) {
      console.error('Teacher fetch error:', teacherError);
      return res.status(500).json({ error: '교사 정보 조회에 실패했습니다.' });
    }

    res.json({
      message: '로그인 성공',
      user: teacherData,
      session: authData.session
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '로그인 중 오류가 발생했습니다.' });
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

    // 토큰 검증
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }

    // 교사 정보 조회
    const { data: teacherData, error: teacherError } = await supabase
      .from('teachers')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    if (teacherError) {
      return res.status(404).json({ error: '교사 정보를 찾을 수 없습니다.' });
    }

    res.json({ user: teacherData });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: '사용자 정보 조회 중 오류가 발생했습니다.' });
  }
});

module.exports = router; 