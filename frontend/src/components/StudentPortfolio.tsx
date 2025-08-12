import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
  room_id: string;
  room_title: string;
  routine_type: string;
  submitted_at: string;
  team_name?: string;
  response_data?: any;
  ai_analysis?: string;
  teacher_feedback?: string;
  teacher_score?: number;
  selected?: boolean;
}

interface SearchForm {
  grade: string;
  class: string;
  number: string;
  name: string;
}

const StudentPortfolio: React.FC<StudentPortfolioProps> = ({ onBack }) => {
  const [searchForm, setSearchForm] = useState<SearchForm>({
    grade: '',
    class: '',
    number: '',
    name: ''
  });
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null);
  const [activities, setActivities] = useState<ActivityRoom[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<ActivityRoom | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
  const searchStudentActivities = async () => {
    if (!searchForm.name.trim()) {
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
        student_grade: searchForm.grade,
        student_name: searchForm.name,
        student_class: searchForm.class,
        student_number: searchForm.number ? parseInt(searchForm.number) : undefined
      };

      // 온라인 활동만 가져오기 (room_id가 있는 것만)
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
        .eq('student_name', searchForm.name)
        .eq('is_draft', false)
        .not('room_id', 'is', null); // room_id가 있는 것만 (온라인 활동)

      if (searchForm.grade) onlineQuery = onlineQuery.eq('student_grade', searchForm.grade);
      if (searchForm.class) onlineQuery = onlineQuery.eq('student_class', searchForm.class);
      if (searchForm.number) onlineQuery = onlineQuery.eq('student_number', parseInt(searchForm.number));

      const { data: onlineData, error: onlineError } = await onlineQuery;

      if (onlineError) throw onlineError;

      console.log('🔍 온라인 활동 데이터:', onlineData);

      // 활동방별로 그룹화
      const activityRooms: ActivityRoom[] = onlineData?.map(item => ({
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
        selected: false
      })) || [];

      // 제출일 기준으로 정렬
      const sortedActivities = activityRooms.sort((a, b) => 
        new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
      );

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
    setSelectedActivity(activity);
  };

  // 활동 목록으로 돌아가기
  const handleBackToList = () => {
    setSelectedActivity(null);
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
                ${routineLabels[activity.routine_type] || activity.routine_type}
                <span style="color: #666; font-size: 12px; margin-left: 10px;">
                  (온라인 활동)
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
                <div className="grid grid-cols-2 gap-4">
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
                    <input
                      type="text"
                      value={searchForm.class}
                      onChange={(e) => setSearchForm({...searchForm, class: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="예: 1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">번호</label>
                    <input
                      type="text"
                      value={searchForm.number}
                      onChange={(e) => setSearchForm({...searchForm, number: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="예: 15"
                    />
                  </div>

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
                </div>

                <button
                  onClick={searchStudentActivities}
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
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">필터</span>
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
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>총 {activities.length}개의 활동 기록</span>
                  <span>•</span>
                  <span>선택됨: {activities.filter(a => a.selected).length}개</span>
                  <button
                    onClick={() => {
                      // 필터 초기화 시 전체 선택 해제
                      setActivities(prev => prev.map(activity => ({ ...activity, selected: false })));
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    선택 초기화
                  </button>
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
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              {routineLabels[activity.routine_type] || activity.routine_type}
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

                        <p className="text-gray-600 mb-3">사고루틴: {routineLabels[activity.routine_type]}</p>

                        {/* 상태 표시 */}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>온라인 활동</span>
                          <span>•</span>
                          <span>제출일: {formatDate(activity.submitted_at)}</span>
                          {activity.teacher_score && (
                            <>
                              <span>•</span>
                              <span className="text-blue-600 font-medium">평가완료 ({activity.teacher_score}점)</span>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">학생 활동 응답</h3>
                <div className="space-y-4">
                  {Object.entries(selectedActivity.response_data).map(([key, value]) => {
                    if (!value) return null;
                    const labels: any = {
                      see: 'See (관찰/연결)',
                      think: 'Think (생각/도전)',
                      wonder: 'Wonder (궁금증/개념)',
                      fourth_step: 'Changes (변화)'
                    };
                    return (
                      <div key={key} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-700 mb-2">{labels[key] || key}</h4>
                        <div className="text-gray-600 whitespace-pre-wrap">{String(value)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AI 분석 결과 */}
            {selectedActivity.ai_analysis && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI 분석 결과</h3>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-gray-700 whitespace-pre-wrap">{selectedActivity.ai_analysis}</div>
                </div>
              </div>
            )}

            {/* 교사 피드백 */}
            {(selectedActivity.teacher_feedback || selectedActivity.teacher_score) && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">교사 평가</h3>
                <div className="bg-green-50 rounded-lg p-4">
                  {selectedActivity.teacher_feedback && (
                    <div className="mb-3">
                      <h4 className="font-medium text-green-800 mb-2">피드백</h4>
                      <div className="text-green-700 whitespace-pre-wrap">{selectedActivity.teacher_feedback}</div>
                    </div>
                  )}
                  {selectedActivity.teacher_score && (
                    <div>
                      <h4 className="font-medium text-green-800 mb-2">점수</h4>
                      <div className="flex items-center text-green-700">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-xl font-bold">{selectedActivity.teacher_score}점</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentPortfolio;