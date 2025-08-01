import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface StudentPortfolioProps {
  onBack: () => void;
}

interface PortfolioItem {
  id: string;
  student_grade?: string;
  student_name: string;
  student_class?: string;
  student_number?: number;
  team_name?: string;
  routine_type: string;
  image_url?: string;
  ai_analysis?: string;
  teacher_feedback?: string;
  teacher_score?: number;
  submitted_at: string;
  room_title?: string;
}

interface FilterState {
  grade: string;
  studentName: string;
  routineType: string;
  dateRange: {
    start: string;
    end: string;
  };
}

const StudentPortfolio: React.FC<StudentPortfolioProps> = ({ onBack }) => {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    grade: '',
    studentName: '',
    routineType: '',
    dateRange: { start: '', end: '' }
  });

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

  // 사고루틴 타입별 아이콘 및 색상
  const routineStyles: { [key: string]: { icon: string; bgColor: string; textColor: string } } = {
    'see-think-wonder': { icon: 'STW', bgColor: 'bg-blue-500', textColor: 'text-white' },
    '4c': { icon: '4C', bgColor: 'bg-green-500', textColor: 'text-white' },
    'circle-of-viewpoints': { icon: 'COV', bgColor: 'bg-purple-500', textColor: 'text-white' },
    'connect-extend-challenge': { icon: 'CEC', bgColor: 'bg-yellow-500', textColor: 'text-white' },
    'frayer-model': { icon: 'FM', bgColor: 'bg-red-500', textColor: 'text-white' },
    'used-to-think-now-think': { icon: 'UTT', bgColor: 'bg-indigo-500', textColor: 'text-white' },
    'think-puzzle-explore': { icon: 'TPE', bgColor: 'bg-pink-500', textColor: 'text-white' }
  };

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [portfolioItems, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPortfolioData = async () => {
    if (!isSupabaseConfigured() || !supabase) {
      setError('시스템 설정이 완료되지 않았습니다.');
      setLoading(false);
      return;
    }

    try {
      // student_responses와 activity_rooms를 조인하여 포트폴리오 데이터 가져오기
      const { data, error } = await supabase
        .from('student_responses')
        .select(`
          id,
          student_grade,
          student_name,
          student_class,
          student_number,
          team_name,
          routine_type,
          image_url,
          ai_analysis,
          teacher_feedback,
          teacher_score,
          submitted_at,
          activity_rooms!inner(title)
        `)
        .eq('is_draft', false)
        .order('submitted_at', { ascending: false });

      if (error) {
        throw error;
      }

      const formattedData: PortfolioItem[] = data?.map(item => ({
        id: item.id,
        student_grade: item.student_grade,
        student_name: item.student_name,
        student_class: item.student_class,
        student_number: item.student_number,
        team_name: item.team_name,
        routine_type: item.routine_type,
        image_url: item.image_url,
        ai_analysis: item.ai_analysis,
        teacher_feedback: item.teacher_feedback,
        teacher_score: item.teacher_score,
        submitted_at: item.submitted_at,
        room_title: (item.activity_rooms as any)?.title
      })) || [];

      setPortfolioItems(formattedData);
    } catch (err) {
      console.error('Portfolio fetch error:', err);
      setError('포트폴리오 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...portfolioItems];

    if (filters.grade) {
      filtered = filtered.filter(item => item.student_grade === filters.grade);
    }

    if (filters.studentName) {
      filtered = filtered.filter(item => 
        item.student_name.toLowerCase().includes(filters.studentName.toLowerCase())
      );
    }

    if (filters.routineType) {
      filtered = filtered.filter(item => item.routine_type === filters.routineType);
    }

    if (filters.dateRange.start) {
      filtered = filtered.filter(item => 
        new Date(item.submitted_at) >= new Date(filters.dateRange.start)
      );
    }

    if (filters.dateRange.end) {
      filtered = filtered.filter(item => 
        new Date(item.submitted_at) <= new Date(filters.dateRange.end + 'T23:59:59')
      );
    }

    setFilteredItems(filtered);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getStudentInfo = (item: PortfolioItem) => {
    const parts = [];
    if (item.student_grade) parts.push(item.student_grade);
    if (item.student_class) parts.push(`${item.student_class}반`);
    if (item.student_number) parts.push(`${item.student_number}번`);
    return parts.join(' ');
  };

  const exportPortfolio = () => {
    // CSV 내보내기 기능
    const csvHeaders = ['학년', '반', '번호', '이름', '모둠', '사고루틴', '활동방', '제출일', '교사점수'];
    const csvData = filteredItems.map(item => [
      item.student_grade || '',
      item.student_class || '',
      item.student_number || '',
      item.student_name,
      item.team_name || '',
      routineLabels[item.routine_type] || item.routine_type,
      item.room_title || '',
      formatDate(item.submitted_at),
      item.teacher_score || ''
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `사고루틴_포트폴리오_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">포트폴리오 로딩 중...</p>
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
                onClick={onBack}
                className="text-gray-600 hover:text-gray-900"
              >
                ← 대시보드로 돌아가기
              </button>
              <h1 className="text-3xl font-bold text-blue-600">포트폴리오 목록</h1>
            </div>
            <button
              onClick={exportPortfolio}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              📊 내보내기
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 필터 섹션 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">필터</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">학년</label>
              <select
                value={filters.grade}
                onChange={(e) => setFilters({...filters, grade: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">학생 이름</label>
              <input
                type="text"
                value={filters.studentName}
                onChange={(e) => setFilters({...filters, studentName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="이름 검색"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">사고루틴</label>
              <select
                value={filters.routineType}
                onChange={(e) => setFilters({...filters, routineType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체</option>
                {Object.entries(routineLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">시작일</label>
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => setFilters({
                  ...filters, 
                  dateRange: {...filters.dateRange, start: e.target.value}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">종료일</label>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => setFilters({
                  ...filters, 
                  dateRange: {...filters.dateRange, end: e.target.value}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              총 {filteredItems.length}개의 활동 결과
            </p>
            <button
              onClick={() => setFilters({
                grade: '',
                studentName: '',
                routineType: '',
                dateRange: { start: '', end: '' }
              })}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              필터 초기화
            </button>
          </div>
        </div>

        {/* 포트폴리오 그리드 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">포트폴리오가 없습니다</h3>
            <p className="text-gray-600">
              {portfolioItems.length === 0 
                ? "아직 제출된 학생 활동이 없습니다."
                : "필터 조건에 맞는 활동이 없습니다. 필터를 조정해 보세요."
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const style = routineStyles[item.routine_type] || routineStyles['see-think-wonder'];
              return (
                <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start space-x-4">
                      {/* 사고루틴 아이콘 */}
                      <div className={`w-16 h-16 rounded-lg ${style.bgColor} ${style.textColor} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-sm font-bold">{style.icon}</span>
                      </div>

                      {/* 내용 */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {routineLabels[item.routine_type] || item.routine_type}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2 truncate">
                          {item.room_title}
                        </p>
                        
                        {/* 학생 정보 */}
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">{getStudentInfo(item)}</span>
                            <span className="ml-1">{item.student_name}</span>
                            {item.team_name && (
                              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {item.team_name}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            <span>{formatDate(item.submitted_at)}</span>
                          </div>

                          {item.teacher_score && (
                            <div className="flex items-center text-sm text-gray-600">
                              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="font-medium text-yellow-600">{item.teacher_score}점</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 이미지 미리보기 */}
                    {item.image_url && (
                      <div className="mt-4">
                        <img
                          src={item.image_url}
                          alt="활동 결과물"
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    )}

                    {/* 피드백 미리보기 */}
                    {item.teacher_feedback && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">교사 피드백</p>
                        <p className="text-sm text-gray-800 line-clamp-2">
                          {item.teacher_feedback}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentPortfolio;