import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { routineTypeLabels, routineStepLabels, mapResponseToRoutineSteps } from '../lib/thinkingRoutineUtils';

interface StudentPortfolioProps {
  onBack: () => void;
}

interface StudentInfo {
  student_grade?: string;
  student_name: string;
  student_class?: string;
  student_number?: number;
}

interface ActivityRoom {
  id: string;
  room_id: string | null;
  room_title: string;
  routine_type: string;
  submitted_at: string;
  team_name?: string;
  response_data?: any;
  ai_analysis?: string;
  teacher_feedback?: string;
  teacher_score?: number;
  activity_type?: 'online' | 'offline';
  image_url?: string;
  confidence_score?: number;
  selected?: boolean;
}

interface SearchForm {
  grade: string;
  class: string;
  number: string;
  name: string;
}

interface FilterForm {
  routineType: string;
  startDate: string;
  endDate: string;
}

const StudentPortfolio: React.FC<StudentPortfolioProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const { activityId } = useParams<{ activityId?: string }>();
  
  const [searchForm, setSearchForm] = useState<SearchForm>({
    grade: '',
    class: '',
    number: '',
    name: ''
  });
  const [filterForm, setFilterForm] = useState<FilterForm>({
    routineType: '',
    startDate: '',
    endDate: ''
  });
  const [allActivities, setAllActivities] = useState<ActivityRoom[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null);
  const [activities, setActivities] = useState<ActivityRoom[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<ActivityRoom | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // URL 파라미터에서 검색 조건을 읽어서 자동 검색 실행
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlGrade = urlParams.get('grade');
    const urlClass = urlParams.get('class');
    const urlNumber = urlParams.get('number');
    const urlName = urlParams.get('name');

    // URL에 검색 파라미터가 있으면 폼에 설정하고 자동 검색
    if (urlName || urlGrade || urlClass || urlNumber) {
      const newSearchForm = {
        grade: urlGrade || '',
        class: urlClass || '',
        number: urlNumber || '',
        name: urlName || ''
      };
      setSearchForm(newSearchForm);
      
      // 검색 실행
      if (urlName) {
        performSearch(newSearchForm);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 컴포넌트 마운트 시에만 실행

  // URL 파라미터에서 활동 ID가 있으면 해당 활동 로드
  useEffect(() => {
    if (activityId && activities.length > 0) {
      const activity = activities.find(a => a.id === activityId);
      if (activity) {
        setSelectedActivity(activity);
      }
    } else if (!activityId) {
      setSelectedActivity(null);
    }
  }, [activityId, activities]);

  // 필터 적용 로직
  useEffect(() => {
    let filtered = [...allActivities];

    // 사고루틴 타입 필터
    if (filterForm.routineType) {
      filtered = filtered.filter(activity => activity.routine_type === filterForm.routineType);
    }

    // 기간 필터
    if (filterForm.startDate) {
      const startDate = new Date(filterForm.startDate);
      filtered = filtered.filter(activity => new Date(activity.submitted_at) >= startDate);
    }
    if (filterForm.endDate) {
      const endDate = new Date(filterForm.endDate);
      endDate.setHours(23, 59, 59, 999); // 해당 날짜의 끝까지 포함
      filtered = filtered.filter(activity => new Date(activity.submitted_at) <= endDate);
    }

    setActivities(filtered);
  }, [allActivities, filterForm]);

  // 사고루틴 타입 라벨 함수
  const getRoutineTypeLabel = (routineType: string): string => {
    const labels: { [key: string]: string } = {
      'see-think-wonder': 'See-Think-Wonder',
      '4c': '4C',
      'circle-of-viewpoints': '관점의 원',
      'connect-extend-challenge': 'Connect-Extend-Challenge',
      'frayer-model': '프레이어 모델',
      'used-to-think-now-think': '이전-현재 생각',
      'think-puzzle-explore': 'Think-Puzzle-Explore'
    };
    return labels[routineType] || routineType;
  };
  
  // 사고루틴 타입 라벨
  const routineLabels: { [key: string]: string } = {
    'see-think-wonder': 'See-Think-Wonder',
    '4c': '4C',
    'circle-of-viewpoints': 'Circle of Viewpoints',
    'connect-extend-challenge': 'Connect-Extend-Challenge',
    'frayer-model': 'Frayer Model',
    'used-to-think-now-think': 'I Used to Think... Now I Think...',
    'think-puzzle-explore': 'Think-Puzzle-Explore'
  };

  // 학생 검색 및 활동 내역 가져오기
  const performSearch = async (formData?: SearchForm) => {
    const targetForm = formData || searchForm;
    if (!targetForm.name.trim()) {
      setError('학생 이름을 입력해주세요.');
      return;
    }

    if (!isSupabaseConfigured() || !supabase) {
      setError('시스템 설정이 완료되지 않았습니다.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 학생 정보 설정
      const studentInfo: StudentInfo = {
        student_grade: targetForm.grade,
        student_name: targetForm.name,
        student_class: targetForm.class,
        student_number: targetForm.number ? parseInt(targetForm.number) : undefined
      };

      // 1. 온라인 활동 가져오기 (room_id가 있는 것)
      let onlineQuery = supabase
        .from('student_responses')
        .select(`
          id,
          room_id,
          student_grade,
          student_name,
          student_class,
          student_number,
          team_name,
          response_data,
          ai_analysis,
          teacher_feedback,
          teacher_score,
          submitted_at,
          activity_rooms!inner(title, thinking_routine_type)
        `)
        .eq('student_name', targetForm.name)
        .eq('is_draft', false)
        .not('room_id', 'is', null); // room_id가 있는 것만 (온라인 활동)
        
      // 2. 오프라인 활동 가져오기 (room_id가 null인 것)
      let offlineQuery = supabase
        .from('student_responses')
        .select(`
          id,
          room_id,
          student_grade,
          student_name,
          student_class,
          student_number,
          team_name,
          routine_type,
          image_url,
          response_data,
          ai_analysis,
          teacher_feedback,
          teacher_score,
          confidence_score,
          submitted_at
        `)
        .eq('student_name', targetForm.name)
        .eq('is_draft', false)
        .is('room_id', null); // room_id가 null인 것만 (오프라인 활동)

      // 필터 적용 - 온라인
      if (targetForm.grade) onlineQuery = onlineQuery.eq('student_grade', targetForm.grade);
      if (targetForm.class) onlineQuery = onlineQuery.eq('student_class', targetForm.class);
      if (targetForm.number) onlineQuery = onlineQuery.eq('student_number', parseInt(targetForm.number));
      
      // 필터 적용 - 오프라인
      if (targetForm.grade) offlineQuery = offlineQuery.eq('student_grade', targetForm.grade);
      if (targetForm.class) offlineQuery = offlineQuery.eq('student_class', targetForm.class);
      if (targetForm.number) offlineQuery = offlineQuery.eq('student_number', parseInt(targetForm.number));

      // 두 쿼리 병렬 실행
      const [onlineResult, offlineResult] = await Promise.all([
        onlineQuery,
        offlineQuery
      ]);
      
      const { data: onlineData, error: onlineError } = onlineResult;
      const { data: offlineData, error: offlineError } = offlineResult;

      if (onlineError) throw onlineError;
      if (offlineError) throw offlineError;

      console.log('🔍 온라인 활동 데이터:', onlineData);
      console.log('🔍 오프라인 활동 데이터:', offlineData);

      // 온라인 활동 처리
      const onlineActivities: ActivityRoom[] = onlineData?.map(item => ({
        id: item.id,
        room_id: item.room_id,
        room_title: (item.activity_rooms as any)?.title || '활동방',
        routine_type: (item.activity_rooms as any)?.thinking_routine_type || 'see-think-wonder',
        submitted_at: item.submitted_at,
        team_name: item.team_name,
        response_data: item.response_data,
        ai_analysis: item.ai_analysis,
        teacher_feedback: item.teacher_feedback,
        teacher_score: item.teacher_score,
        activity_type: 'online',
        selected: false
      })) || [];
      
      // 오프라인 활동 처리
      const offlineActivities: ActivityRoom[] = offlineData?.map(item => ({
        id: item.id,
        room_id: null,
        room_title: `${getRoutineTypeLabel(item.routine_type)} 분석`,
        routine_type: item.routine_type || 'see-think-wonder',
        submitted_at: item.submitted_at,
        team_name: item.team_name,
        response_data: item.response_data,
        ai_analysis: item.ai_analysis,
        teacher_feedback: item.teacher_feedback,
        teacher_score: item.teacher_score,
        activity_type: 'offline',
        image_url: item.image_url,
        confidence_score: item.confidence_score,
        selected: false
      })) || [];
      
      // 두 활동을 합쳐서 시간순 정렬
      const activityRooms = [...onlineActivities, ...offlineActivities]
        .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

      // 제출일 기준으로 정렬
      const sortedActivities = activityRooms.sort((a, b) => 
        new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
      );

      setAllActivities(sortedActivities);
      setActivities(sortedActivities);
      setSelectedStudent(studentInfo);
      
    } catch (err) {
      console.error('Student search error:', err);
      setError('학생 활동 내역을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 체크박스 선택/해제
  const toggleActivitySelection = (activityId: string) => {
    setActivities(prev => prev.map(activity => 
      activity.id === activityId 
        ? { ...activity, selected: !activity.selected }
        : activity
    ));
  };

  // 전체 선택/해제
  const toggleAllSelection = () => {
    const allSelected = activities.every(activity => activity.selected);
    setActivities(prev => prev.map(activity => ({ ...activity, selected: !allSelected })));
  };

  // 활동 상세보기
  const handleActivityClick = (activity: ActivityRoom) => {
    // 현재 검색 상태를 URL 파라미터로 전달
    const currentSearchParams = new URLSearchParams();
    if (searchForm.grade) currentSearchParams.set('grade', searchForm.grade);
    if (searchForm.class) currentSearchParams.set('class', searchForm.class);
    if (searchForm.number) currentSearchParams.set('number', searchForm.number);
    if (searchForm.name) currentSearchParams.set('name', searchForm.name);
    
    const searchParamsString = currentSearchParams.toString();
    const url = searchParamsString 
      ? `/teacher/portfolio/${activity.id}?${searchParamsString}`
      : `/teacher/portfolio/${activity.id}`;
    
    // 브라우저 히스토리에 현재 검색 결과 페이지를 명시적으로 추가
    const currentUrl = searchParamsString 
      ? `/teacher/portfolio?${searchParamsString}`
      : '/teacher/portfolio';
    
    // 현재 URL이 이미 올바른 검색 상태가 아니라면 히스토리를 수정
    if (window.location.pathname + window.location.search !== currentUrl) {
      window.history.replaceState(null, '', currentUrl);
    }
    
    // 상세 페이지로 이동 (새로운 히스토리 엔트리 생성)
    navigate(url);
  };

  // 활동 목록으로 돌아가기
  const handleBackToList = () => {
    setSelectedActivity(null);
    navigate('/teacher/portfolio');
  };

  // 인쇄하기
  const handlePrint = () => {
    const selectedActivities = activities.filter(activity => activity.selected);
    if (selectedActivities.length === 0) {
      alert('인쇄할 활동을 선택해주세요.');
      return;
    }

    // 인쇄용 HTML 생성
    const printContent = generatePrintContent(selectedActivities);
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  // PDF 저장하기
  const handleSavePDF = async () => {
    const selectedActivities = activities.filter(activity => activity.selected);
    if (selectedActivities.length === 0) {
      alert('저장할 활동을 선택해주세요.');
      return;
    }

    try {
      // PDF 생성 (html2pdf 라이브러리 사용을 가정)
      const printContent = generatePrintContent(selectedActivities);
      
      // 간단한 PDF 다운로드 (실제로는 html2pdf 등의 라이브러리 필요)
      const blob = new Blob([printContent], { type: 'text/html' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${selectedStudent?.student_name}_사고루틴_포트폴리오.html`;
      link.click();
      
      alert('HTML 파일로 저장되었습니다. PDF 변환은 브라우저의 인쇄 기능을 이용해주세요.');
    } catch (error) {
      console.error('PDF 저장 오류:', error);
      alert('PDF 저장 중 오류가 발생했습니다.');
    }
  };

  // 인쇄용 HTML 생성
  const generatePrintContent = (selectedActivities: ActivityRoom[]) => {
    const studentInfo = selectedStudent;
    const studentInfoText = [
      studentInfo?.student_grade,
      studentInfo?.student_class ? `${studentInfo.student_class}반` : '',
      studentInfo?.student_number ? `${studentInfo.student_number}번` : '',
      studentInfo?.student_name
    ].filter(Boolean).join(' ');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${studentInfo?.student_name} 사고루틴 포트폴리오</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .student-info { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
          .activity { margin-bottom: 40px; border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
          .activity-header { background: #f5f5f5; padding: 10px; margin: -20px -20px 20px -20px; }
          .activity-title { font-size: 16px; font-weight: bold; color: #333; }
          .activity-meta { font-size: 12px; color: #666; margin-top: 5px; }
          .response-section { margin-top: 15px; }
          .response-title { font-weight: bold; color: #444; margin-bottom: 5px; }
          .response-content { background: #f9f9f9; padding: 10px; border-radius: 4px; margin-bottom: 10px; }
          .feedback-section { background: #e8f4fd; padding: 15px; border-radius: 4px; margin-top: 15px; }
          .score { color: #e67e22; font-weight: bold; }
          @media print { 
            body { margin: 0; } 
            .activity { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>사고루틴 포트폴리오</h1>
          <div class="student-info">${studentInfoText}</div>
          <div>생성일: ${new Date().toLocaleDateString('ko-KR')}</div>
        </div>
        
        ${selectedActivities.map(activity => `
          <div class="activity">
            <div class="activity-header">
              <div class="activity-title">
                ${getRoutineTypeLabel(activity.routine_type)}
                <span style="color: #666; font-size: 12px; margin-left: 10px;">
                  (${activity.activity_type === 'online' ? '온라인' : '오프라인'} 활동)
                </span>
              </div>
              <div class="activity-meta">
                활동방: ${activity.room_title} | 
                제출일: ${new Date(activity.submitted_at).toLocaleDateString('ko-KR')} |
                ${activity.team_name ? `모둠: ${activity.team_name}` : '개별 활동'}
              </div>
            </div>
            
            ${activity.response_data ? `
              <div class="response-section">
                ${Object.entries(activity.response_data).map(([key, value]) => {
                                if (!value || (key === 'fourth_step' && !value)) return '';
                                const labels: any = {
                    see: 'See (관찰/연결)',
                    think: 'Think (생각/도전)',
                    wonder: 'Wonder (궁금증/개념)',
                    fourth_step: 'Changes (변화)'
                  };
                  return `
                    <div class="response-title">${labels[key] || key}:</div>
                    <div class="response-content">${value}</div>
                  `;
                }).join('')}
              </div>
            ` : ''}
            
            ${activity.ai_analysis ? `
              <div class="feedback-section">
                <div class="response-title">AI 분석 결과:</div>
                <div>${activity.ai_analysis.replace(/\n/g, '<br>')}</div>
              </div>
            ` : ''}
            
            ${activity.teacher_feedback ? `
              <div class="feedback-section">
                <div class="response-title">교사 피드백:</div>
                <div>${activity.teacher_feedback}</div>
                ${activity.teacher_score ? `<div class="score">점수: ${activity.teacher_score}점</div>` : ''}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </body>
      </html>
    `;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getStudentInfoText = () => {
    if (!selectedStudent) return '';
    const parts = [];
    if (selectedStudent.student_grade) parts.push(selectedStudent.student_grade);
    if (selectedStudent.student_class) parts.push(`${selectedStudent.student_class}반`);
    if (selectedStudent.student_number) parts.push(`${selectedStudent.student_number}번`);
    if (selectedStudent.student_name) parts.push(selectedStudent.student_name);
    return parts.join(' ');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="text-gray-600 hover:text-gray-900"
              >
                ← 대시보드로 돌아가기
              </button>
              <h1 className="text-3xl font-bold text-blue-600">사고루틴 포트폴리오</h1>
            </div>
            
            {selectedStudent && (
              <div className="flex space-x-2">
                <button
                  onClick={handlePrint}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium shadow-lg"
                  title="인쇄하기"
                >
                  🖨️
                </button>
                <button
                  onClick={handleSavePDF}
                  className="bg-green-600 hover:bg-green-700 text-white w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium shadow-lg"
                  title="저장하기"
                >
                  💾
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {!selectedStudent ? (
          /* 학생 검색 화면 */
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">학생별 사고루틴 포트폴리오</h2>
                <p className="text-gray-600">각 학생의 사고루틴 학습 과정과 성장을 추적할 수 있습니다.</p>
              </div>

              <div className="space-y-4">
                {/* 학년, 반, 번호를 한 줄로 배치 */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">학년</label>
                    <select
                      value={searchForm.grade}
                      onChange={(e) => setSearchForm({...searchForm, grade: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">전체</option>
                      <option value="1학년">1학년</option>
                      <option value="2학년">2학년</option>
                      <option value="3학년">3학년</option>
                      <option value="4학년">4학년</option>
                      <option value="5학년">5학년</option>
                      <option value="6학년">6학년</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">반</label>
                    <select
                      value={searchForm.class}
                      onChange={(e) => setSearchForm({...searchForm, class: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">전체</option>
                      {Array.from({length: 15}, (_, i) => i + 1).map(num => (
                        <option key={num} value={num.toString()}>{num}반</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">번호</label>
                    <select
                      value={searchForm.number}
                      onChange={(e) => setSearchForm({...searchForm, number: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">전체</option>
                      {Array.from({length: 35}, (_, i) => i + 1).map(num => (
                        <option key={num} value={num.toString()}>{num}번</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 학생 이름을 전체 너비로 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">학생 이름 *</label>
                  <input
                    type="text"
                    value={searchForm.name}
                    onChange={(e) => setSearchForm({...searchForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="이름 검색"
                    required
                  />
                </div>

                <button
                  onClick={() => performSearch()}
                  disabled={loading || !searchForm.name.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '검색 중...' : '시작하기'}
                </button>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
            </div>
          </div>
        ) : !selectedActivity ? (
          /* 활동 목록 화면 */
          <div>
            {/* 학생 정보 헤더 */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{getStudentInfoText()}</h2>
                  <p className="text-gray-600">총 {activities.length}개의 활동 기록</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedStudent(null);
                    setActivities([]);
                    setSelectedActivity(null);
                    setError('');
                  }}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ← 학생 검색으로 돌아가기
                </button>
              </div>
            </div>

            {/* 필터 */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-col space-y-4">
                {/* 필터 제목과 전체 선택 */}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">필터 및 선택</h3>
                  {activities.length > 0 && (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={activities.every(activity => activity.selected)}
                        onChange={toggleAllSelection}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">전체 선택</span>
                    </label>
                  )}
                </div>

                {/* 필터 옵션들 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">사고루틴 유형</label>
                    <select
                      value={filterForm.routineType}
                      onChange={(e) => setFilterForm({...filterForm, routineType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">전체 유형</option>
                      <option value="see-think-wonder">See-Think-Wonder</option>
                      <option value="4c">4C</option>
                      <option value="circle-of-viewpoints">관점의 원</option>
                      <option value="connect-extend-challenge">Connect-Extend-Challenge</option>
                      <option value="frayer-model">프레이어 모델</option>
                      <option value="used-to-think-now-think">이전-현재 생각</option>
                      <option value="think-puzzle-explore">Think-Puzzle-Explore</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">시작 날짜</label>
                    <input
                      type="date"
                      value={filterForm.startDate}
                      onChange={(e) => setFilterForm({...filterForm, startDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">종료 날짜</label>
                    <input
                      type="date"
                      value={filterForm.endDate}
                      onChange={(e) => setFilterForm({...filterForm, endDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>

                {/* 필터 결과 및 초기화 */}
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>총 {allActivities.length}개 중 {activities.length}개 표시</span>
                    <span>•</span>
                    <span>선택됨: {activities.filter(a => a.selected).length}개</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setFilterForm({ routineType: '', startDate: '', endDate: '' });
                      }}
                      className="text-gray-600 hover:text-gray-800 text-sm"
                    >
                      필터 초기화
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => {
                        setActivities(prev => prev.map(activity => ({ ...activity, selected: false })));
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      선택 초기화
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 활동 목록 */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">활동 내역 로딩 중...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <p className="text-red-800">{error}</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">포트폴리오가 없습니다</h3>
                <p className="text-gray-600">아직 제출된 학생 활동이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start space-x-4">
                      {/* 체크박스 */}
                      <input
                        type="checkbox"
                        checked={activity.selected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleActivitySelection(activity.id);
                        }}
                        className="mt-1 rounded"
                      />

                      {/* 활동 내용 */}
                      <div className="flex-1" onClick={() => handleActivityClick(activity)}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {activity.room_title}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              activity.activity_type === 'online' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {getRoutineTypeLabel(activity.routine_type)}
                            </span>
                            {activity.team_name && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                                {activity.team_name}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatDate(activity.submitted_at)}
                          </div>
                        </div>

                        {/* 옵션 정보 - AI 분석 신뢰도 표시 제거 */}

                        {/* 상태 표시 */}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className={`px-2 py-1 rounded text-xs ${
                            activity.activity_type === 'online'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-purple-50 text-purple-700'
                          }`}>
                            {activity.activity_type === 'online' ? '온라인 활동' : '오프라인 활동'}
                          </span>
                          {activity.teacher_score && (
                            <>
                              <span>•</span>
                              <span className="text-green-600 font-medium">평가완료 ({activity.teacher_score}점)</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* 화살표 아이콘 */}
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* 활동 상세보기 화면 */
          <div>
            {/* 헤더 */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedActivity.room_title}</h2>
                  <p className="text-gray-600">{routineLabels[selectedActivity.routine_type]} • {formatDate(selectedActivity.submitted_at)}</p>
                </div>
                <button
                  onClick={handleBackToList}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ← 활동 목록으로 돌아가기
                </button>
              </div>
            </div>

            {/* 학생 응답 */}
            {selectedActivity.response_data && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">학생 응답</h2>
                
                {/* 학생 정보 - 수정된 레이아웃 */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg flex justify-between items-start">
                  <div>
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-700">학생명:</span>
                      <span className="ml-2 text-gray-900 font-semibold">
                        {(() => {
                          const name = selectedStudent?.student_name || '학생';
                          const grade = selectedStudent?.student_grade || '';
                          const studentClass = selectedStudent?.student_class || '';
                          const number = selectedStudent?.student_number || '';
                          
                          const parts = [];
                          if (grade) {
                            if (grade.includes('학년')) {
                              parts.push(grade);
                            } else {
                              parts.push(`${grade}학년`);
                            }
                          }
                          if (studentClass) {
                            if (studentClass.includes('반')) {
                              parts.push(studentClass);
                            } else {
                              parts.push(`${studentClass}반`);
                            }
                          }
                          if (number) {
                            if (number.toString().includes('번')) {
                              parts.push(number.toString());
                            } else {
                              parts.push(`${number}번`);
                            }
                          }
                          
                          if (parts.length > 0) {
                            return `${name}(${parts.join(' ')})`;
                          }
                          return name;
                        })()}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">제출일:</span>
                      <span className="ml-2 text-gray-900">
                        {new Date(selectedActivity.submitted_at).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-700">사고루틴:</span>
                    <div className="text-blue-600 font-medium">
                      {routineTypeLabels[selectedActivity.routine_type] || selectedActivity.routine_type || 'See-Think-Wonder'}
                    </div>
                  </div>
                </div>

                {/* 학생 응답 - 카드형 레이아웃 */}
                <div className="space-y-3">
                  {(() => {
                    const routineType = selectedActivity.routine_type || 'see-think-wonder';
                    const mappedResponses = mapResponseToRoutineSteps(selectedActivity.response_data, routineType);
                    const stepLabels = routineStepLabels[routineType] || routineStepLabels['see-think-wonder'];
                    
                    // 단계별 색상과 아이콘 정의 (더 많은 단계 지원)
                    const stepColors = {
                      'see': 'bg-blue-500',
                      'think': 'bg-green-500', 
                      'wonder': 'bg-purple-500',
                      'connect': 'bg-indigo-500',
                      'challenge': 'bg-red-500',
                      'concepts': 'bg-yellow-500',
                      'changes': 'bg-pink-500',
                      'extend': 'bg-teal-500',
                      'definition': 'bg-cyan-500',
                      'characteristics': 'bg-orange-500',
                      'examples': 'bg-lime-500',
                      'non_examples': 'bg-rose-500',
                      'used_to_think': 'bg-violet-500',
                      'now_think': 'bg-emerald-500',
                      'puzzle': 'bg-amber-500',
                      'explore': 'bg-sky-500',
                      'viewpoint_select': 'bg-fuchsia-500',
                      'viewpoint_thinking': 'bg-slate-500',
                      'viewpoint_concerns': 'bg-neutral-500'
                    };
                    
                    const stepIcons = {
                      'see': 'S',
                      'think': 'T', 
                      'wonder': 'W',
                      'connect': 'C',
                      'challenge': 'Ch',
                      'concepts': 'Co',
                      'changes': 'Ch',
                      'extend': 'E',
                      'definition': 'D',
                      'characteristics': 'Ch',
                      'examples': 'Ex',
                      'non_examples': 'N',
                      'used_to_think': 'U',
                      'now_think': 'N',
                      'puzzle': 'P',
                      'explore': 'E',
                      'viewpoint_select': 'V1',
                      'viewpoint_thinking': 'V2',
                      'viewpoint_concerns': 'V3'
                    };
                    
                    return Object.entries(mappedResponses)
                      .filter(([key, value]) => value && value.trim().length > 0)
                      .map(([key, value]) => {
                        const stepLabel = stepLabels[key] || key.charAt(0).toUpperCase() + key.slice(1);
                        
                        return (
                          <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className={`${stepColors[key] || 'bg-gray-500'} px-4 py-2 flex items-center`}>
                              <div className="w-8 h-6 bg-white bg-opacity-20 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                                {stepIcons[key] || key.charAt(0).toUpperCase()}
                              </div>
                              <h3 className="font-medium text-white">{stepLabel}</h3>
                            </div>
                            <div className="p-4 bg-white">
                              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{value as string}</p>
                            </div>
                          </div>
                        );
                      });
                  })()}
                </div>
              </div>
            )}

            {/* AI 분석 및 교사 평가 통합 */}
            {(selectedActivity.ai_analysis || selectedActivity.teacher_feedback || selectedActivity.teacher_score) && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">AI 분석 결과</h2>
                
                {/* AI 분석 결과 */}
                {selectedActivity.ai_analysis && (
                  <div className="mb-8">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        AI가 분석한 학습 결과
                      </h3>
                      <div className="text-gray-700 whitespace-pre-wrap leading-relaxed text-left">
                        {selectedActivity.ai_analysis}
                      </div>
                    </div>
                  </div>
                )}

                {/* 교사 평가 (조회 전용) */}
                {(selectedActivity.teacher_feedback || selectedActivity.teacher_score) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      교사 평가 및 피드백
                    </h3>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      {selectedActivity.teacher_feedback && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            교사 피드백
                          </h4>
                          <div className="text-green-700 whitespace-pre-wrap leading-relaxed bg-white rounded-md p-4 border border-green-200">
                            {selectedActivity.teacher_feedback}
                          </div>
                        </div>
                      )}
                      
                      {selectedActivity.teacher_score && (
                        <div>
                          <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            평가 점수
                          </h4>
                          <div className="flex items-center">
                            <div className="bg-white rounded-lg p-4 border border-green-200">
                              <span className="text-2xl font-bold text-green-700">{selectedActivity.teacher_score}</span>
                              <span className="text-green-600 ml-1">/ 100점</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentPortfolio;