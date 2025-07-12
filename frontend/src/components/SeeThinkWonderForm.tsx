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

    fetchData();
  }, [roomId, navigate, fetchData]);

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
      const { error } = await supabase
        .from('student_responses')
        .insert([{
          room_id: roomId,
          student_name: studentInfo.name,
          student_id: studentInfo.class && studentInfo.number ? `${studentInfo.class}반 ${studentInfo.number}번` : '',
          response_data: responses
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
            <div className="flex items-center space-x-2">
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
          {/* 자료 표시 영역 */}
          <div className="p-6 border-b border-gray-200">
            <div className="space-y-4">
              {template.content.image_url && (
                <div className="flex justify-center">
                  <img 
                    src={template.content.image_url} 
                    alt="활동 자료" 
                    className="max-w-full max-h-96 rounded-lg shadow-sm"
                  />
                </div>
              )}
              
              {template.content.text_content && (
                <div className="prose max-w-none">
                  <div className="text-gray-900 whitespace-pre-wrap text-center">
                    {template.content.text_content}
                  </div>
                </div>
              )}
              
              {template.content.youtube_url && (
                <div className="flex justify-center">
                  <div className="w-full max-w-2xl">
                    <div className="relative pb-9/16">
                      <iframe
                        src={getYouTubeEmbedUrl(template.content.youtube_url) || ''}
                        title="YouTube video"
                        className="absolute inset-0 w-full h-full rounded-lg"
                        style={{ aspectRatio: '16/9' }}
                        allowFullScreen
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

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