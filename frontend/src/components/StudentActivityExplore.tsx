import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface StudentResponse {
  id: string;
  student_name: string;
  student_grade?: string;
  student_class?: string;
  student_number?: number;
  team_name?: string;
  routine_type: string;
  image_url?: string;
  ai_analysis?: string;
  teacher_feedback?: string;
  teacher_score?: number;
  submitted_at: string;
  comments_count?: number;
  likes_count?: number;
}

interface Comment {
  id: string;
  response_id: string;
  parent_comment_id?: string;
  student_name: string;
  student_grade?: string;
  student_class?: string;
  student_number?: number;
  content: string;
  created_at: string;
  replies?: Comment[];
}

interface Like {
  id: string;
  response_id: string;
  student_name: string;
  created_at: string;
}

const StudentActivityExplore: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<StudentResponse[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<StudentResponse | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [error, setError] = useState('');

  // 로컬 스토리지에서 학생 정보 가져오기
  const studentInfo = JSON.parse(localStorage.getItem('studentInfo') || '{}');

  useEffect(() => {
    if (roomId) {
      fetchActivities();
    }
  }, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchActivities = async () => {
    if (!isSupabaseConfigured() || !supabase) {
      setError('시스템 설정이 완료되지 않았습니다.');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('student_responses')
        .select(`
          id,
          student_name,
          student_grade,
          student_class,
          student_number,
          team_name,
          routine_type,
          image_url,
          ai_analysis,
          teacher_feedback,
          teacher_score,
          submitted_at,
          comments_count,
          likes_count
        `)
        .eq('room_id', roomId)
        .eq('is_draft', false)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Activities fetch error:', error);
        setError('활동 내역을 불러오는데 실패했습니다.');
        return;
      }

      setActivities(data || []);
    } catch (err) {
      console.error('Activities fetch error:', err);
      setError('활동 내역을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityDetails = async (activityId: string) => {
    if (!isSupabaseConfigured() || !supabase) return;

    try {
      // 댓글 가져오기
      const { data: commentsData, error: commentsError } = await supabase
        .from('student_comments')
        .select('*')
        .eq('response_id', activityId)
        .order('created_at', { ascending: true });

      if (commentsError) {
        console.error('Comments fetch error:', commentsError);
      } else {
        // 댓글을 계층 구조로 정리
        const organizedComments = organizeComments(commentsData || []);
        setComments(organizedComments);
      }

      // 좋아요 가져오기
      const { data: likesData, error: likesError } = await supabase
        .from('student_likes')
        .select('*')
        .eq('response_id', activityId)
        .order('created_at', { ascending: false });

      if (likesError) {
        console.error('Likes fetch error:', likesError);
      } else {
        setLikes(likesData || []);
      }
    } catch (err) {
      console.error('Activity details fetch error:', err);
    }
  };

  const organizeComments = (commentsList: Comment[]): Comment[] => {
    const topLevelComments: Comment[] = [];
    const repliesMap: { [key: string]: Comment[] } = {};

    // 댓글을 부모-자식 관계로 분류
    commentsList.forEach(comment => {
      if (!comment.parent_comment_id) {
        topLevelComments.push({ ...comment, replies: [] });
      } else {
        if (!repliesMap[comment.parent_comment_id]) {
          repliesMap[comment.parent_comment_id] = [];
        }
        repliesMap[comment.parent_comment_id].push(comment);
      }
    });

    // 부모 댓글에 대댓글 연결
    topLevelComments.forEach(comment => {
      if (repliesMap[comment.id]) {
        comment.replies = repliesMap[comment.id];
      }
    });

    return topLevelComments;
  };

  const handleActivitySelect = (activity: StudentResponse) => {
    setSelectedActivity(activity);
    fetchActivityDetails(activity.id);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedActivity) return;
    if (!isSupabaseConfigured() || !supabase) return;

    try {
      const { error } = await supabase
        .from('student_comments')
        .insert({
          response_id: selectedActivity.id,
          student_name: studentInfo.name,
          student_grade: studentInfo.grade,
          student_class: studentInfo.class,
          student_number: studentInfo.number,
          content: newComment.trim()
        });

      if (error) {
        console.error('Comment add error:', error);
        setError('댓글 작성에 실패했습니다.');
        return;
      }

      setNewComment('');
      fetchActivityDetails(selectedActivity.id);
    } catch (err) {
      console.error('Comment add error:', err);
      setError('댓글 작성에 실패했습니다.');
    }
  };

  const handleAddReply = async (parentCommentId: string) => {
    if (!replyContent.trim() || !selectedActivity) return;
    if (!isSupabaseConfigured() || !supabase) return;

    try {
      const { error } = await supabase
        .from('student_comments')
        .insert({
          response_id: selectedActivity.id,
          parent_comment_id: parentCommentId,
          student_name: studentInfo.name,
          student_grade: studentInfo.grade,
          student_class: studentInfo.class,
          student_number: studentInfo.number,
          content: replyContent.trim()
        });

      if (error) {
        console.error('Reply add error:', error);
        setError('대댓글 작성에 실패했습니다.');
        return;
      }

      setReplyContent('');
      setReplyTo(null);
      fetchActivityDetails(selectedActivity.id);
    } catch (err) {
      console.error('Reply add error:', err);
      setError('대댓글 작성에 실패했습니다.');
    }
  };

  const handleToggleLike = async () => {
    if (!selectedActivity || !isSupabaseConfigured() || !supabase) return;

    try {
      // 이미 좋아요를 눌렀는지 확인
      const existingLike = likes.find(like => 
        like.student_name === studentInfo.name &&
        like.response_id === selectedActivity.id
      );

      if (existingLike) {
        // 좋아요 제거
        const { error } = await supabase
          .from('student_likes')
          .delete()
          .eq('id', existingLike.id);

        if (error) {
          console.error('Like remove error:', error);
          setError('좋아요 취소에 실패했습니다.');
          return;
        }
      } else {
        // 좋아요 추가
        const { error } = await supabase
          .from('student_likes')
          .insert({
            response_id: selectedActivity.id,
            student_name: studentInfo.name,
            student_grade: studentInfo.grade,
            student_class: studentInfo.class,
            student_number: studentInfo.number
          });

        if (error) {
          console.error('Like add error:', error);
          setError('좋아요 추가에 실패했습니다.');
          return;
        }
      }

      fetchActivityDetails(selectedActivity.id);
    } catch (err) {
      console.error('Like toggle error:', err);
      setError('좋아요 처리에 실패했습니다.');
    }
  };

  const getStudentDisplayName = (response: StudentResponse) => {
    const parts = [];
    if (response.student_grade) parts.push(response.student_grade);
    if (response.student_class) parts.push(`${response.student_class}반`);
    if (response.student_number) parts.push(`${response.student_number}번`);
    parts.push(response.student_name);
    return parts.join(' ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isLikedByMe = () => {
    return likes.some(like => 
      like.student_name === studentInfo.name &&
      like.response_id === selectedActivity?.id
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">활동 내역을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/student')}
                className="text-gray-600 hover:text-gray-900 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                돌아가기
              </button>
              <h1 className="text-xl font-bold text-gray-900">활동 탐구하기</h1>
            </div>
            <div className="text-sm text-gray-600">
              {studentInfo.name && `${getStudentDisplayName(studentInfo)}`}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 활동 리스트 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              같은 활동방의 다른 친구들 활동 ({activities.length}개)
            </h2>
            
            {activities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                아직 제출된 활동이 없습니다.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    onClick={() => handleActivitySelect(activity)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedActivity?.id === activity.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">
                        {getStudentDisplayName(activity)}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatDate(activity.submitted_at)}
                      </span>
                    </div>
                    
                    {activity.team_name && (
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-2">
                        {activity.team_name}
                      </span>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.471L3 21l1.471-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                        </svg>
                        {activity.comments_count || 0}
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {activity.likes_count || 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 활동 상세보기 */}
          <div className="bg-white rounded-lg shadow">
            {!selectedActivity ? (
              <div className="p-6 text-center text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                왼쪽에서 활동을 선택하면 자세한 내용을 볼 수 있습니다.
              </div>
            ) : (
              <div className="p-6">
                {/* 활동 정보 헤더 */}
                <div className="mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {getStudentDisplayName(selectedActivity)}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {formatDate(selectedActivity.submitted_at)}
                      </p>
                    </div>
                    {selectedActivity.team_name && (
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {selectedActivity.team_name}
                      </span>
                    )}
                  </div>
                  
                  {/* 활동 이미지 */}
                  {selectedActivity.image_url && (
                    <div className="mb-4">
                      <img
                        src={selectedActivity.image_url}
                        alt="활동 결과물"
                        className="w-full max-w-md mx-auto rounded-lg shadow-sm"
                      />
                    </div>
                  )}
                  
                  {/* 좋아요 버튼 */}
                  <div className="flex items-center justify-center mb-6">
                    <button
                      onClick={handleToggleLike}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${
                        isLikedByMe()
                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <svg className={`w-5 h-5 ${isLikedByMe() ? 'fill-current' : ''}`} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span>{likes.length}개의 좋아요</span>
                    </button>
                  </div>
                </div>

                {/* 댓글 섹션 */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    댓글 ({comments.length})
                  </h3>
                  
                  {/* 댓글 작성 */}
                  <div className="mb-6">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="응원의 댓글을 남겨보세요..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        댓글 작성
                      </button>
                    </div>
                  </div>
                  
                  {/* 댓글 리스트 */}
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {comments.map((comment) => (
                      <div key={comment.id} className="space-y-2">
                        {/* 부모 댓글 */}
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div className="text-sm font-medium text-gray-900">
                              {comment.student_name}
                              {comment.student_grade && comment.student_class && comment.student_number && (
                                <span className="text-gray-500 ml-1">
                                  ({comment.student_grade} {comment.student_class}반 {comment.student_number}번)
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(comment.created_at)}
                            </div>
                          </div>
                          <p className="text-gray-700 text-sm mb-2">{comment.content}</p>
                          <button
                            onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            답글
                          </button>
                          
                          {/* 답글 작성 폼 */}
                          {replyTo === comment.id && (
                            <div className="mt-3 space-y-2">
                              <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="답글을 입력하세요..."
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                rows={2}
                              />
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => {
                                    setReplyTo(null);
                                    setReplyContent('');
                                  }}
                                  className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                                >
                                  취소
                                </button>
                                <button
                                  onClick={() => handleAddReply(comment.id)}
                                  disabled={!replyContent.trim()}
                                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                  답글 작성
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* 대댓글 */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="ml-6 space-y-2">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="bg-blue-50 p-2 rounded">
                                <div className="flex justify-between items-start mb-1">
                                  <div className="text-xs font-medium text-gray-900">
                                    {reply.student_name}
                                    {reply.student_grade && reply.student_class && reply.student_number && (
                                      <span className="text-gray-500 ml-1">
                                        ({reply.student_grade} {reply.student_class}반 {reply.student_number}번)
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {formatDate(reply.created_at)}
                                  </div>
                                </div>
                                <p className="text-gray-700 text-xs">{reply.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentActivityExplore;
