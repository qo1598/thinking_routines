import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface ActivityRoom {
  id: string;
  title: string;
  description: string;
  thinking_routine_type: string;
  room_code: string;
  teacher_id: string;
  created_at: string;
  is_active: boolean;
}

interface RoutineTemplate {
  id: string;
  room_id: string;
  routine_type: string;
  content: {
    image_url: string;
    text_content: string;
    youtube_url: string;
    see_question: string;
    think_question: string;
    wonder_question: string;
  };
}

interface StudentResponse {
  id: string;
  student_name: string;
  student_id: string;
  response_data: {
    see: string;
    think: string;
    wonder: string;
  };
  submitted_at: string;
  ai_analysis?: string;
  teacher_feedback?: string;
  teacher_score?: number;
}

const StudentResponseDetail: React.FC = () => {
  const { roomId, responseId } = useParams<{ roomId: string; responseId: string }>();
  const navigate = useNavigate();
  
  const [room, setRoom] = useState<ActivityRoom | null>(null);
  const [template, setTemplate] = useState<RoutineTemplate | null>(null);
  const [response, setResponse] = useState<StudentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [teacherFeedback, setTeacherFeedback] = useState('');
  const [teacherScore, setTeacherScore] = useState<number | ''>('');
  const [savingFeedback, setSavingFeedback] = useState(false);

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase || !roomId || !responseId) {
      setError('시스템 설정이 완료되지 않았습니다.');
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/teacher');
        return;
      }

      // 활동방 정보 조회
      const { data: roomData, error: roomError } = await supabase
        .from('activity_rooms')
        .select('*')
        .eq('id', roomId)
        .eq('teacher_id', session.user.id)
        .single();

      if (roomError) {
        console.error('Room fetch error:', roomError);
        setError('활동방을 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      setRoom(roomData);

      // 학생 응답 조회
      const { data: responseData, error: responseError } = await supabase
        .from('student_responses')
        .select('*')
        .eq('id', responseId)
        .eq('room_id', roomId)
        .single();

      if (responseError) {
        console.error('Response fetch error:', responseError);
        setError('학생 응답을 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      setResponse(responseData);
      // 기존 피드백과 점수를 입력창에 설정
      setTeacherFeedback(responseData.teacher_feedback || '');
      setTeacherScore(responseData.teacher_score !== null && responseData.teacher_score !== undefined ? responseData.teacher_score : '');

      // 활동 템플릿 조회
      const { data: templateData, error: templateError } = await supabase
        .from('routine_templates')
        .select('*')
        .eq('room_id', roomId)
        .single();

      if (templateError && templateError.code !== 'PGRST116') {
        console.error('Template fetch error:', templateError);
      } else if (templateData) {
        setTemplate(templateData);
      }

      setLoading(false);
    } catch (err) {
      console.error('Fetch data error:', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  }, [roomId, responseId, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : null;
  };

  const handleAiAnalysis = async () => {
    if (!response || !template) return;

    // 응답 품질 검사
    const responses = {
      see: response.response_data.see?.trim() || '',
      think: response.response_data.think?.trim() || '',
      wonder: response.response_data.wonder?.trim() || ''
    };
    
    // 극도로 성의 없는 응답 체크
    const isExtremelyLowQuality = 
      Object.values(responses).every(r => r.length < 3) || // 모든 응답이 3글자 미만
      Object.values(responses).some(r => /^\d+$/.test(r)) || // 숫자만 입력
      Object.values(responses).some(r => /^[a-zA-Z]{1,2}$/.test(r)) || // 매우 짧은 영문자만
      Object.values(responses).some(r => /^[ㄱ-ㅎㅏ-ㅣ]{1,2}$/.test(r)) || // 자음/모음만
      Object.values(responses).some(r => /^[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]+$/.test(r)); // 특수문자만
    
    if (isExtremelyLowQuality) {
      alert('학생의 응답이 너무 간단합니다. 더 구체적인 응답을 작성하도록 안내해주세요.\n\nAI 분석은 의미 있는 응답에 대해서만 실행됩니다.');
      return;
    }

    setAiAnalyzing(true);
    try {
      // Google Gemini API 호출을 위한 시스템 프롬프트 구성
      const systemPrompt = `당신은 사고루틴(Thinking Routines) 교육 전문가입니다. 
교사의 평가 보조 수단으로 활용될 분석과 피드백을 제공하는 것이 당신의 핵심 역할입니다.

**See-Think-Wonder 사고루틴 이해:**
- See(관찰): 학생이 주어진 자료에서 객관적으로 관찰한 내용
- Think(사고): 관찰한 내용을 바탕으로 한 학생의 해석, 추론, 연결
- Wonder(궁금증): 학생이 가지게 된 의문, 호기심, 탐구하고 싶은 점

**응답 품질 평가 기준:**
1. **내용의 적절성**: 각 단계의 목적에 맞는 응답인가?
2. **구체성**: 추상적이지 않고 구체적인 내용인가?
3. **논리적 연결**: See → Think → Wonder 단계가 논리적으로 연결되는가?
4. **깊이**: 표면적이지 않고 깊이 있는 사고가 드러나는가?
5. **창의성**: 독창적이고 다양한 관점이 포함되어 있는가?

**다양한 응답 상황별 대응:**
- **우수한 응답**: 구체적인 강점을 명시하고 더 발전시킬 방향 제시
- **평균적 응답**: 잘한 부분을 인정하되 개선점을 명확히 제시
- **부실한 응답**: 단계별 목적 재설명과 구체적 개선 방법 제시
- **부적절한 응답**: 왜 부적절한지 설명하고 올바른 방향 안내
- **성의 없는 응답**: 사고루틴의 의미와 중요성 강조

**교사 활용을 위한 중요 지침:**
1. 객관적이고 구체적인 분석 제공
2. 교사가 점수를 매길 때 참고할 수 있는 명확한 근거 제시
3. 학생 개별 지도를 위한 실용적 조언 포함
4. 긍정적이면서도 정확한 평가 유지

**출력 형식:**
## 1. 각 단계별 분석

### See (관찰)
- [응답 품질 평가와 구체적 피드백 2-3줄]

### Think (사고)  
- [응답 품질 평가와 구체적 피드백 2-3줄]

### Wonder (궁금증)
- [응답 품질 평가와 구체적 피드백 2-3줄]

## 2. 종합 평가

**강점:**
- [구체적 강점과 근거 1-2개]

**개선점:**
- [명확한 개선점과 개선 방법 1-2개]

**교사 참고사항:**
- [점수 평가 시 고려할 요소들]

## 3. 교육적 권장사항

**다음 활동 제안:**
- [학생 수준에 맞는 구체적 제안 2-3개]

위 형식을 정확히 따라 작성해주세요.`;

      const userPrompt = `
**학생:** ${response.student_name}

**교사 제공 자료:**
${template.content.image_url ? `- 이미지 자료 제공` : ''}
${template.content.text_content ? `- 텍스트: "${template.content.text_content}"` : ''}
${template.content.youtube_url ? `- 유튜브 영상 제공` : ''}

**학생 응답:**
- **See (관찰):** ${response.response_data.see}
- **Think (사고):** ${response.response_data.think}
- **Wonder (궁금증):** ${response.response_data.wonder}

위 학생의 응답을 분석하고 교육적 피드백을 제공해주세요.`;

      // Google Gemini API 호출
      console.log('AI 분석 요청 시작...');
      
      const apiResponse = await fetch('/api/gemini-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemPrompt,
          userPrompt,
          imageUrl: template.content.image_url,
          youtubeUrl: template.content.youtube_url
        })
      });

      console.log('API 응답 상태:', apiResponse.status);

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        console.error('API 오류 응답:', errorData);
        throw new Error(errorData.error || 'AI 분석 요청 실패');
      }

      const analysisResult = await apiResponse.json();
      console.log('분석 결과 수신:', analysisResult);
      
      if (!analysisResult.analysis) {
        throw new Error('AI 분석 결과가 없습니다');
      }
      
      const aiAnalysis = analysisResult.analysis;

      // 데이터베이스에 AI 분석 결과 저장
      const { error: updateError } = await supabase!
        .from('student_responses')
        .update({ ai_analysis: aiAnalysis })
        .eq('id', responseId);

      if (updateError) {
        console.error('AI analysis save error:', updateError);
        alert('AI 분석 결과 저장에 실패했습니다.');
        return;
      }

      setResponse(prev => prev ? { ...prev, ai_analysis: aiAnalysis } : null);
      alert('AI 분석이 완료되었습니다!');
    } catch (err) {
      console.error('AI analysis error:', err);
      alert('AI 분석 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleSaveTeacherFeedback = async () => {
    if (!response) return;

    // 점수 유효성 검사 (1-100점)
    if (teacherScore !== '' && (isNaN(Number(teacherScore)) || Number(teacherScore) < 1 || Number(teacherScore) > 100)) {
      alert('점수는 1-100 사이의 숫자여야 합니다.');
      return;
    }

    setSavingFeedback(true);
    try {
      const updateData: any = {
        teacher_feedback: teacherFeedback
      };

      // 점수가 입력되었을 때만 업데이트
      if (teacherScore !== '') {
        updateData.teacher_score = Number(teacherScore);
      } else {
        updateData.teacher_score = null;
      }

      const { error } = await supabase!
        .from('student_responses')
        .update(updateData)
        .eq('id', responseId);

      if (error) {
        console.error('Feedback save error:', error);
        alert('피드백 저장에 실패했습니다: ' + error.message);
        return;
      }

      // 로컬 상태 업데이트
      setResponse(prev => prev ? {
        ...prev,
        teacher_feedback: teacherFeedback,
        teacher_score: teacherScore === '' ? undefined : Number(teacherScore)
      } : null);

      alert('피드백이 저장되었습니다!');
    } catch (err) {
      console.error('Save feedback error:', err);
      alert('피드백 저장 중 오류가 발생했습니다.');
    } finally {
      setSavingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/teacher/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!room || !response) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">데이터를 찾을 수 없습니다.</p>
          <button
            onClick={() => navigate('/teacher/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/teacher/room/${roomId}`)}
                className="text-gray-600 hover:text-gray-900"
              >
                ← 활동방으로 돌아가기
              </button>
              <h1 className="text-2xl font-bold text-gray-900">학생 응답 상세</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 학생 정보 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {response.student_name}
                {response.student_id && (
                  <span className="text-sm text-gray-500 ml-2">({response.student_id})</span>
                )}
              </h2>
              <p className="text-sm text-gray-600">
                제출일: {new Date(response.submitted_at).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">활동방: {room.title}</p>
              <p className="text-sm text-gray-600">사고루틴: See-Think-Wonder</p>
            </div>
          </div>
        </div>

        {/* 교사 제공 자료 */}
        {template && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">교사 제공 자료</h3>
            <div className="space-y-4">
              {template.content.image_url && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">이미지</p>
                  <div className="flex justify-center">
                    <img
                      src={template.content.image_url}
                      alt="활동 이미지"
                      className="max-w-md max-h-64 rounded-lg shadow-sm"
                    />
                  </div>
                </div>
              )}
              
              {template.content.text_content && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">텍스트 내용</p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-900 whitespace-pre-wrap">{template.content.text_content}</p>
                  </div>
                </div>
              )}
              
              {template.content.youtube_url && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">유튜브 영상</p>
                  <div className="flex justify-center">
                    <div className="w-full max-w-2xl">
                      <div className="relative" style={{ paddingBottom: '56.25%' }}>
                        {(() => {
                          const embedUrl = getYouTubeEmbedUrl(template.content.youtube_url);
                          return embedUrl ? (
                            <iframe
                              src={embedUrl}
                              title="YouTube video"
                              className="absolute inset-0 w-full h-full rounded-lg"
                              allowFullScreen
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                              <p className="text-gray-600">유튜브 영상을 불러올 수 없습니다.</p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 질문들 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">See 질문</p>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-gray-900">{template.content.see_question}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Think 질문</p>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-gray-900">{template.content.think_question}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Wonder 질문</p>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-gray-900">{template.content.wonder_question}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 학생 응답 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">학생 응답</h3>
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">See</h4>
                  <p className="text-sm text-gray-600">보기</p>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-900 whitespace-pre-wrap">
                  {response.response_data.see || '응답 없음'}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">T</span>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">Think</h4>
                  <p className="text-sm text-gray-600">생각하기</p>
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-gray-900 whitespace-pre-wrap">
                  {response.response_data.think || '응답 없음'}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">W</span>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">Wonder</h4>
                  <p className="text-sm text-gray-600">궁금하기</p>
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-gray-900 whitespace-pre-wrap">
                  {response.response_data.wonder || '응답 없음'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* AI 분석 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">AI 분석 및 피드백</h3>
            <div className="flex space-x-2">
              <button
                onClick={handleAiAnalysis}
                disabled={aiAnalyzing}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                {aiAnalyzing ? '분석 중...' : 'AI 분석 실행'}
              </button>
            </div>
          </div>
          
          {response.ai_analysis ? (
            <div className="space-y-4">
              {(() => {
                const analysisText = response.ai_analysis;
                const sections = analysisText.split(/## \d+\./);
                
                return sections.slice(1).map((section, index) => {
                  const sectionTitle = section.split('\n')[0].trim();
                  const sectionContent = section.split('\n').slice(1).join('\n').trim();
                  
                  return (
                    <div key={index} className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">
                        {index + 1}. {sectionTitle}
                      </h4>
                      <div className="text-gray-800 whitespace-pre-wrap text-left">
                        {sectionContent}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">AI 분석이 아직 실행되지 않았습니다.</p>
              <p className="text-sm text-gray-400 mt-2">위의 버튼을 클릭하여 AI 분석을 실행하세요.</p>
            </div>
          )}
        </div>

        {/* 교사 피드백 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">교사 피드백 및 평가</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                피드백 내용
              </label>
              <textarea
                value={teacherFeedback}
                onChange={(e) => setTeacherFeedback(e.target.value)}
                placeholder="학생에게 제공할 피드백을 입력하세요..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                점수 (1-100점)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={teacherScore}
                onChange={(e) => setTeacherScore(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveTeacherFeedback}
                disabled={savingFeedback}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                {savingFeedback ? '저장 중...' : '피드백 저장'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentResponseDetail; 