import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface StudentInfo {
  name: string;
  class: string;
  number: string;
  roomId: string;
  roomCode: string;
}

interface ActivityRoom {
  id: string;
  title: string;
  description: string;
  thinking_routine_type: string;
  status: string;
}

interface RoutineTemplate {
  id: string;
  room_id: string;
  routine_type: string;
  content: {
    image_url?: string;
    text_content?: string;
    youtube_url?: string;
    see_question?: string;
    think_question?: string;
    wonder_question?: string;
  };
}

interface SeeThinkWonderResponse {
  see: string;
  think: string;
  wonder: string;
}

const SeeThinkWonderForm: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [room, setRoom] = useState<ActivityRoom | null>(null);
  const [template, setTemplate] = useState<RoutineTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState<'see' | 'think' | 'wonder'>('see');
  const [responses, setResponses] = useState<SeeThinkWonderResponse>({
    see: '',
    think: '',
    wonder: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase || !roomId) {
      setError('시스템 설정이 완료되지 않았습니다.');
      setLoading(false);
      return;
    }

    try {
      // 활동방 정보 조회
      const { data: roomData, error: roomError } = await supabase
        .from('activity_rooms')
        .select('*')
        .eq('id', roomId)
        .eq('status', 'active')
        .single();

      if (roomError) {
        console.error('Room fetch error:', roomError);
        setError('활동방을 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      setRoom(roomData);

      // 템플릿 정보 조회
      const { data: templateData, error: templateError } = await supabase
        .from('routine_templates')
        .select('*')
        .eq('room_id', roomId)
        .single();

      if (templateError && templateError.code !== 'PGRST116') {
        console.error('Template fetch error:', templateError);
        setError('활동 내용을 불러오는데 실패했습니다.');
      } else if (templateData) {
        setTemplate(templateData);
      }

    } catch (err) {
      console.error('Fetch error:', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // 임시저장된 응답 불러오기
  const loadDraftResponse = useCallback(async (studentInfo: StudentInfo) => {
    if (!supabase || !roomId) return;

    try {
      const { data: draftData, error: draftError } = await supabase
        .from('student_responses')
        .select('*')
        .eq('room_id', roomId)
        .eq('student_name', studentInfo.name)
        .eq('student_id', studentInfo.class && studentInfo.number ? `${studentInfo.class}반 ${studentInfo.number}번` : '')
        .eq('is_draft', true)
        .single();

      if (draftError && draftError.code !== 'PGRST116') {
        console.error('Draft fetch error:', draftError);
        return;
      }

      if (draftData && draftData.response_data) {
        setResponses(draftData.response_data);
        // 마지막으로 작성한 단계 확인
        if (draftData.response_data.wonder && draftData.response_data.wonder.trim()) {
          setCurrentStep('wonder');
        } else if (draftData.response_data.think && draftData.response_data.think.trim()) {
          setCurrentStep('think');
        } else if (draftData.response_data.see && draftData.response_data.see.trim()) {
          setCurrentStep('see');
        }
        
        // 임시저장된 데이터가 있다는 알림
        alert('이전에 작성하던 내용을 불러왔습니다. 이어서 작성하실 수 있습니다.');
      }
    } catch (err) {
      console.error('Load draft error:', err);
    }
  }, [roomId]);

  // 임시저장 함수
  const saveDraft = useCallback(async (currentResponses: SeeThinkWonderResponse) => {
    if (!supabase || !studentInfo || !roomId) return;

    try {
      const studentId = studentInfo.class && studentInfo.number ? `${studentInfo.class}반 ${studentInfo.number}번` : '';
      
      // 기존 임시저장 데이터 확인
      const { data: existingDraft } = await supabase
        .from('student_responses')
        .select('id')
        .eq('room_id', roomId)
        .eq('student_name', studentInfo.name)
        .eq('student_id', studentId)
        .eq('is_draft', true)
        .single();

      if (existingDraft) {
        // 기존 임시저장 데이터 업데이트
        await supabase
          .from('student_responses')
          .update({
            response_data: currentResponses,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingDraft.id);
      } else {
        // 새 임시저장 데이터 생성
        await supabase
          .from('student_responses')
          .insert([{
            room_id: roomId,
            student_name: studentInfo.name,
            student_id: studentId,
            response_data: currentResponses,
            is_draft: true,
            submitted_at: new Date().toISOString()
          }]);
      }
    } catch (err) {
      console.error('Save draft error:', err);
    }
  }, [studentInfo, roomId]);

  useEffect(() => {
    const storedStudentInfo = localStorage.getItem('studentInfo');
    if (!storedStudentInfo) {
      navigate('/student');
      return;
    }

    const parsedStudentInfo = JSON.parse(storedStudentInfo);
    setStudentInfo(parsedStudentInfo);

    if (parsedStudentInfo.roomId !== roomId) {
      navigate('/student');
      return;
    }

    fetchData().then(() => {
      // 데이터 로드 완료 후 임시저장 데이터 불러오기
      loadDraftResponse(parsedStudentInfo);
    });
  }, [roomId, navigate, fetchData, loadDraftResponse]);

  // 응답 변경 시 자동 임시저장 (debounce 적용)
  useEffect(() => {
    if (!studentInfo || (!responses.see && !responses.think && !responses.wonder)) return;

    const timeoutId = setTimeout(() => {
      saveDraft(responses);
    }, 2000); // 2초 후 자동 저장

    return () => clearTimeout(timeoutId);
  }, [responses, saveDraft, studentInfo]);

  const handleInputChange = (value: string) => {
    setResponses(prev => ({
      ...prev,
      [currentStep]: value
    }));
  };

  const handleNextStep = () => {
    if (currentStep === 'see') {
      setCurrentStep('think');
    } else if (currentStep === 'think') {
      setCurrentStep('wonder');
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 'think') {
      setCurrentStep('see');
    } else if (currentStep === 'wonder') {
      setCurrentStep('think');
    }
  };

  const handleSubmit = async () => {
    if (!responses.see.trim() || !responses.think.trim() || !responses.wonder.trim()) {
      alert('모든 단계를 완료해주세요.');
      return;
    }

    if (!supabase || !studentInfo) return;

    setSubmitting(true);
    try {
      const studentId = studentInfo.class && studentInfo.number ? `${studentInfo.class}반 ${studentInfo.number}번` : '';
      
      // 기존 임시저장 데이터 확인 및 삭제
      const { data: existingDraft } = await supabase
        .from('student_responses')
        .select('id')
        .eq('room_id', roomId)
        .eq('student_name', studentInfo.name)
        .eq('student_id', studentId)
        .eq('is_draft', true)
        .single();

      if (existingDraft) {
        // 임시저장 데이터 삭제
        await supabase
          .from('student_responses')
          .delete()
          .eq('id', existingDraft.id);
      }

      // 정식 제출
      const { error } = await supabase
        .from('student_responses')
        .insert([{
          room_id: roomId,
          student_name: studentInfo.name,
          student_id: studentId,
          response_data: responses,
          is_draft: false,
          submitted_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Submit error:', error);
        alert('제출에 실패했습니다. 다시 시도해주세요.');
        return;
      }

      alert('제출이 완료되었습니다!');
      navigate('/student');
    } catch (err) {
      console.error('Submit error:', err);
      alert('제출에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStepInfo = () => {
    const stepInfo = {
      see: {
        title: 'See',
        subtitle: '보기',
        question: template?.content.see_question || '이 자료에서 무엇을 보았나요?',
        placeholder: '보이는 것들을 구체적으로 적어보세요...',
        color: 'bg-blue-500'
      },
      think: {
        title: 'Think',
        subtitle: '생각하기',
        question: template?.content.think_question || '이것에 대해 어떻게 생각하나요?',
        placeholder: '생각이나 느낌을 자유롭게 적어보세요...',
        color: 'bg-green-500'
      },
      wonder: {
        title: 'Wonder',
        subtitle: '궁금하기',
        question: template?.content.wonder_question || '이것에 대해 무엇이 궁금한가요?',
        placeholder: '궁금한 점이나 더 알고 싶은 것을 적어보세요...',
        color: 'bg-purple-500'
      }
    };
    return stepInfo[currentStep];
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">오류가 발생했습니다</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/student')}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">활동 준비 중</h2>
          <p className="text-gray-600 mb-6">선생님이 아직 활동 내용을 설정하지 않았습니다.</p>
          <button
            onClick={() => navigate('/student')}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const stepInfo = getStepInfo();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{room.title}</h1>
              <p className="text-sm text-gray-600">{studentInfo?.name}님의 활동</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/student')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1"
              >
                <span>🏠</span>
                <span>홈</span>
              </button>
              <div className="flex space-x-1">
                {['see', 'think', 'wonder'].map((step, index) => (
                  <div
                    key={step}
                    className={`w-3 h-3 rounded-full ${
                      step === currentStep ? 'bg-primary-600' : 
                      ['see', 'think', 'wonder'].indexOf(currentStep) > index ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* 활동 영역 */}
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-12 h-12 rounded-full ${stepInfo.color} flex items-center justify-center`}>
                  <span className="text-white font-bold text-lg">{stepInfo.title[0]}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{stepInfo.title}</h2>
                  <p className="text-gray-600">{stepInfo.subtitle}</p>
                </div>
              </div>
              
              {/* 자료 표시 영역 - 각 단계마다 표시 */}
              <div className="mb-6 space-y-4">
                {/* 디버깅 정보 (개발 중에만 표시) */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <strong>디버깅 정보:</strong><br/>
                      이미지 URL: {template.content.image_url || '없음'}<br/>
                      텍스트 내용: {template.content.text_content ? '있음' : '없음'}<br/>
                      유튜브 URL: {template.content.youtube_url || '없음'}<br/>
                      유튜브 임베드 URL: {template.content.youtube_url ? getYouTubeEmbedUrl(template.content.youtube_url) || '파싱 실패' : '없음'}
                    </p>
                  </div>
                )}
                
                {template.content.image_url && (
                  <div className="flex justify-center">
                    <img 
                      src={template.content.image_url} 
                      alt="활동 자료" 
                      className="max-w-full max-h-96 rounded-lg shadow-sm"
                      onError={(e) => {
                        console.error('이미지 로드 실패:', template.content.image_url);
                        e.currentTarget.style.display = 'none';
                      }}
                      onLoad={() => {
                        console.log('이미지 로드 성공:', template.content.image_url);
                      }}
                    />
                  </div>
                )}
                
                {template.content.text_content && (
                  <div className="prose max-w-none">
                    <div className="text-gray-900 whitespace-pre-wrap text-center bg-gray-50 p-4 rounded-lg">
                      {template.content.text_content}
                    </div>
                  </div>
                )}
                
                {template.content.youtube_url && (
                  <div className="flex justify-center">
                    <div className="w-full max-w-2xl">
                      <div className="relative" style={{ paddingBottom: '56.25%' }}>
                        {(() => {
                          const embedUrl = getYouTubeEmbedUrl(template.content.youtube_url);
                          console.log('유튜브 원본 URL:', template.content.youtube_url);
                          console.log('유튜브 임베드 URL:', embedUrl);
                          return embedUrl ? (
                            <iframe
                              src={embedUrl}
                              title="YouTube video"
                              className="absolute inset-0 w-full h-full rounded-lg"
                              allowFullScreen
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                              <div className="text-center">
                                <p className="text-gray-600 mb-2">유튜브 영상을 불러올 수 없습니다.</p>
                                <p className="text-sm text-gray-500">원본 링크: {template.content.youtube_url}</p>
                                <a 
                                  href={template.content.youtube_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline text-sm"
                                >
                                  새 탭에서 보기
                                </a>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* 자료가 하나도 없는 경우 안내 메시지 */}
                {!template.content.image_url && !template.content.text_content && !template.content.youtube_url && (
                  <div className="text-center py-8">
                    <div className="bg-gray-100 rounded-lg p-6">
                      <p className="text-gray-600">선생님이 아직 활동 자료를 설정하지 않았습니다.</p>
                      <p className="text-sm text-gray-500 mt-2">자료 없이도 활동을 진행할 수 있습니다.</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-lg text-gray-800 font-medium">{stepInfo.question}</p>
              </div>
            </div>

            <div className="space-y-4">
              <textarea
                value={responses[currentStep]}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={stepInfo.placeholder}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
              
              <div className="flex justify-between">
                <button
                  onClick={handlePrevStep}
                  disabled={currentStep === 'see'}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                
                {currentStep === 'wonder' ? (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !responses.see.trim() || !responses.think.trim() || !responses.wonder.trim()}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? '제출 중...' : '제출하기'}
                  </button>
                ) : (
                  <button
                    onClick={handleNextStep}
                    disabled={!responses[currentStep].trim()}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    다음
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SeeThinkWonderForm; 