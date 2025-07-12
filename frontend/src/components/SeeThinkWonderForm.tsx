import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

interface StudentInfo {
  name: string;
  id: string;
  roomId: string;
  roomCode: string;
}

interface ActivityRoom {
  id: string;
  title: string;
  description: string;
  routine_templates: Array<{
    id: string;
    routine_type: string;
    content: {
      image_url?: string;
      question?: string;
      instructions?: string;
    };
  }>;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState<'see' | 'think' | 'wonder'>('see');
  const [responses, setResponses] = useState<SeeThinkWonderResponse>({
    see: '',
    think: '',
    wonder: ''
  });
  const [isRecording, setIsRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

    fetchRoom();
  }, [roomId, navigate]);

  const fetchRoom = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/rooms/code/${JSON.parse(localStorage.getItem('studentInfo')!).roomCode}`);
      setRoom(response.data.room);
    } catch (err) {
      setError('활동방 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await convertSpeechToText(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert('마이크 접근 권한이 필요합니다.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const convertSpeechToText = async (audioBlob: Blob) => {
    // 실제 구현에서는 Web Speech API 또는 외부 STT 서비스를 사용
    // 여기서는 간단한 예시로 대체
    try {
      // Web Speech API 사용 예시 (브라우저 지원 필요)
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        alert('음성 인식을 지원하지 않는 브라우저입니다.');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'ko-KR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setResponses(prev => ({
          ...prev,
          [currentStep]: prev[currentStep] + ' ' + transcript
        }));
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        alert('음성 인식에 실패했습니다.');
      };

      recognition.start();
    } catch (err) {
      console.error('STT error:', err);
      alert('음성 변환에 실패했습니다.');
    }
  };

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

    setSubmitting(true);
    try {
      await axios.post(`${API_BASE_URL}/api/responses`, {
        room_id: roomId,
        student_name: studentInfo?.name,
        student_id: studentInfo?.id,
        response_data: responses
      });

      alert('제출이 완료되었습니다!');
      navigate('/student');
    } catch (err) {
      alert('제출에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStepInfo = () => {
    const stepInfo = {
      see: {
        title: 'SEE (관찰하기)',
        description: '이미지를 자세히 보고 구체적으로 관찰한 내용을 적어보세요.',
        placeholder: '예: 왼쪽에 큰 나무가 있고, 하늘이 파란색이며...',
        color: 'bg-blue-500'
      },
      think: {
        title: 'THINK (생각하기)',
        description: '관찰한 내용을 바탕으로 무엇을 생각했는지 적어보세요.',
        placeholder: '예: 이 그림은 평화로운 시골 풍경을 표현한 것 같다...',
        color: 'bg-green-500'
      },
      wonder: {
        title: 'WONDER (궁금해하기)',
        description: '이 이미지에 대해 궁금한 점이나 더 알고 싶은 것을 적어보세요.',
        placeholder: '예: 이 그림은 언제 그려진 것일까? 화가는 누구일까?',
        color: 'bg-purple-500'
      }
    };
    return stepInfo[currentStep];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-secondary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/student')}
            className="bg-secondary-600 hover:bg-secondary-700 text-white px-4 py-2 rounded-md"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const stepInfo = getStepInfo();
  const template = room?.routine_templates[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{room?.title}</h1>
              <p className="text-sm text-gray-600">{studentInfo?.name}님의 활동</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                {['see', 'think', 'wonder'].map((step, index) => (
                  <div
                    key={step}
                    className={`w-3 h-3 rounded-full ${
                      step === currentStep ? 'bg-secondary-600' : 
                      ['see', 'think', 'wonder'].indexOf(currentStep) > index ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">
                {['see', 'think', 'wonder'].indexOf(currentStep) + 1}/3
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* 단계 헤더 */}
          <div className={`${stepInfo.color} text-white p-6`}>
            <h2 className="text-2xl font-bold mb-2">{stepInfo.title}</h2>
            <p className="text-lg opacity-90">{stepInfo.description}</p>
          </div>

          <div className="p-6">
            {/* 이미지 표시 */}
            {template?.content.image_url && (
              <div className="mb-6">
                <img 
                  src={template.content.image_url} 
                  alt="활동 이미지"
                  className="w-full max-w-2xl mx-auto rounded-lg shadow-sm"
                />
              </div>
            )}

            {/* 질문 표시 */}
            {template?.content.question && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-lg font-medium text-gray-900">
                  {template.content.question}
                </p>
              </div>
            )}

            {/* 입력 영역 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  여러분의 답변을 입력하세요
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      isRecording 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    {isRecording ? '🎤 녹음 중지' : '🎤 음성 입력'}
                  </button>
                </div>
              </div>

              <textarea
                value={responses[currentStep]}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={stepInfo.placeholder}
                className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 text-lg resize-none"
              />
            </div>

            {/* 네비게이션 버튼 */}
            <div className="flex justify-between mt-8">
              <button
                onClick={handlePrevStep}
                disabled={currentStep === 'see'}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이전 단계
              </button>

              {currentStep === 'wonder' ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !responses.see.trim() || !responses.think.trim() || !responses.wonder.trim()}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '제출 중...' : '제출하기'}
                </button>
              ) : (
                <button
                  onClick={handleNextStep}
                  disabled={!responses[currentStep].trim()}
                  className="px-6 py-3 bg-secondary-600 hover:bg-secondary-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음 단계
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 진행 상황 표시 */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">진행 상황</h3>
          <div className="space-y-3">
            {(['see', 'think', 'wonder'] as const).map((step) => (
              <div key={step} className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${
                  responses[step].trim() ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <span className={`text-sm ${
                  responses[step].trim() ? 'text-green-700' : 'text-gray-500'
                }`}>
                  {step.toUpperCase()}: {responses[step].trim() ? '완료' : '미완료'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SeeThinkWonderForm; 