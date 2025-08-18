import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface ActivityDetailProps {}

interface ActivityData {
  id: string;
  room_id: string | null;
  room_title: string;
  routine_type: string;
  submitted_at: string;
  student_name: string;
  student_grade?: string;
  student_class?: string;
  student_number?: number;
  team_name?: string;
  response_data?: any;
  ai_analysis?: string;
  teacher_feedback?: string;
  teacher_score?: number;
  activity_type: 'online' | 'offline';
  image_url?: string;
  image_data?: string;
  confidence_score?: number;
  // ?⑤씪???쒕룞??異붽? ?곗씠??
  room_description?: string;
  room_thinking_routine_type?: string;
  template_content?: any;
}

const StudentActivityDetail: React.FC<ActivityDetailProps> = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageModalOpen, setImageModalOpen] = useState(false);

  // ?ш퀬猷⑦떞 ????쇰꺼 ?⑥닔
  const getRoutineTypeLabel = (routineType: string): string => {
    const labels: { [key: string]: string } = {
      'see-think-wonder': 'See-Think-Wonder',
      '4c': '4C',
      'circle-of-viewpoints': '愿?먯쓽 ??,
      'connect-extend-challenge': 'Connect-Extend-Challenge',
      'frayer-model': '?꾨젅?댁뼱 紐⑤뜽',
      'used-to-think-now-think': '?댁쟾-?꾩옱 ?앷컖',
      'think-puzzle-explore': 'Think-Puzzle-Explore'
    };
    return labels[routineType] || routineType;
  };

  // ?쒕룞 ?곗씠??濡쒕뱶
  useEffect(() => {
    if (activityId) {
      loadActivityDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId]);

  const loadActivityDetail = async () => {
    if (!isSupabaseConfigured() || !supabase) {
      setError('?쒖뒪???ㅼ젙???꾨즺?섏? ?딆븯?듬땲??');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // 癒쇱? 湲곕낯 ?숈깮 ?묐떟 ?곗씠??媛?몄삤湲?
      const { data: basicData, error: basicError } = await supabase
        .from('student_responses')
        .select(`
          id,
          room_id,
          student_name,
          student_grade,
          student_class,
          student_number,
          team_name,
          routine_type,
          image_url,
          image_data,
          response_data,
          ai_analysis,
          teacher_feedback,
          teacher_score,
          confidence_score,
          submitted_at
        `)
        .eq('id', activityId)
        .single();

      if (basicError) {
        throw new Error(`?쒕룞 ?곗씠?곕? 遺덈윭?????놁뒿?덈떎: ${basicError.message}`);
      }

      if (!basicData) {
        throw new Error('?대떦 ?쒕룞??李얠쓣 ???놁뒿?덈떎.');
      }

      // ?⑤씪???쒕룞??寃쎌슦?먮쭔 ?쒕룞諛⑷낵 ?쒗뵆由??뺣낫 異붽?濡?媛?몄삤湲?
      let roomData = null;
      let templateData = null;

      if (basicData.room_id) {
        // ?쒕룞諛??뺣낫 媛?몄삤湲?
        const { data: roomInfo, error: roomError } = await supabase
          .from('activity_rooms')
          .select('title, description, thinking_routine_type')
          .eq('id', basicData.room_id)
          .single();

        if (!roomError && roomInfo) {
          roomData = roomInfo;

          // ?쒗뵆由??뺣낫 媛?몄삤湲?
          const { data: templateInfo, error: templateError } = await supabase
            .from('routine_templates')
            .select('content')
            .eq('room_id', basicData.room_id)
            .single();

          if (!templateError && templateInfo) {
            templateData = templateInfo;
          }
        }
      }

      const data = {
        ...basicData,
        activity_rooms: roomData,
        routine_templates: templateData
      };

      // ?쒕룞 ???寃곗젙 (?⑤씪???ㅽ봽?쇱씤)
      const activityType = data.room_id ? 'online' : 'offline';
      
      const activityData: ActivityData = {
        id: data.id,
        room_id: data.room_id,
        room_title: activityType === 'online' 
          ? (data.activity_rooms as any)?.title || '?쒕룞諛?
          : `${getRoutineTypeLabel(data.routine_type || 'see-think-wonder')} 遺꾩꽍`,
        routine_type: data.routine_type || (data.activity_rooms as any)?.thinking_routine_type || 'see-think-wonder',
        submitted_at: data.submitted_at,
        student_name: data.student_name,
        student_grade: data.student_grade,
        student_class: data.student_class,
        student_number: data.student_number,
        team_name: data.team_name,
        response_data: data.response_data,
        ai_analysis: data.ai_analysis,
        teacher_feedback: data.teacher_feedback,
        teacher_score: data.teacher_score,
        activity_type: activityType,
        image_url: data.image_url,
        image_data: data.image_data,
        confidence_score: data.confidence_score,
        // ?⑤씪???쒕룞??異붽? ?곗씠??
        room_description: (data.activity_rooms as any)?.description,
        room_thinking_routine_type: (data.activity_rooms as any)?.thinking_routine_type,
        template_content: (data.routine_templates as any)?.content
      };

      setActivity(activityData);

    } catch (err: any) {
      console.error('Activity detail loading error:', err);
      setError(err.message || '?쒕룞 ?곸꽭 ?뺣낫瑜?遺덈윭?ㅻ뒗???ㅽ뙣?덉뒿?덈떎.');
    } finally {
      setLoading(false);
    }
  };

  // ?ㅻ줈 媛湲?
  const handleBack = () => {
    // URL?먯꽌 寃???뚮씪誘명꽣媛 ?덈뒗吏 ?뺤씤?섍퀬, ?덉쑝硫?洹??곹깭濡??뚯븘媛湲?
    const urlParams = new URLSearchParams(window.location.search);
    const hasSearchParams = urlParams.toString();
    
    if (hasSearchParams) {
      // 寃???뚮씪誘명꽣媛 ?덉쑝硫?洹몃?濡??좎??섏뿬 寃??寃곌낵 ?곹깭濡??뚯븘媛湲?
      navigate(`/teacher/portfolio?${hasSearchParams}`);
    } else {
      // 寃???뚮씪誘명꽣媛 ?놁쑝硫??ы듃?대━??泥??섏씠吏濡?
      navigate('/teacher/portfolio');
    }
  };

  // ?좎쭨 ?щ㎎??
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // AI 遺꾩꽍 寃곌낵 ?뚯떛
  const parseAIAnalysis = (aiAnalysis: string) => {
    try {
      const parsed = JSON.parse(aiAnalysis);
      console.log('?뵇 AI 遺꾩꽍 ?먮낯 ?곗씠??', parsed);
      
      // ThinkingRoutineAnalysis?먯꽌 ??ν븳 援ъ“?붾맂 ?뺥깭 泥섎━
      if (parsed.aiAnalysis && parsed.aiAnalysis.individualSteps) {
        console.log('??援ъ“?붾맂 AI 遺꾩꽍 ?곗씠??諛쒓껄');
        return {
          individualSteps: parsed.aiAnalysis.individualSteps,
          comprehensive: parsed.aiAnalysis.comprehensive,
          educational: parsed.aiAnalysis.educational,
          stepByStep: parsed.aiAnalysis.stepByStep,
          teacherFeedback: parsed.teacherFeedback?.individualSteps || {}
        };
      }
      
      // 湲곗〈 ?뺥깭 泥섎━ (吏곸젒 individualSteps媛 ?덈뒗 寃쎌슦)
      if (parsed.individualSteps) {
        console.log('??湲곗〈 ?뺥깭 AI 遺꾩꽍 ?곗씠??諛쒓껄');
        return parsed;
      }
      
      console.log('?좑툘 ?????녿뒗 AI 遺꾩꽍 ?곗씠??援ъ“:', parsed);
      return parsed;
    } catch (error) {
      console.error('??AI 遺꾩꽍 ?곗씠???뚯떛 ?ㅻ쪟:', error);
      return null;
    }
  };

  // 留덊겕?ㅼ슫 ?띿뒪???щ㎎??(ThinkingRoutineAnalysis? ?숈씪)
  const formatMarkdownText = (text: string) => {
    const formatSection = (section: string) => {
      return section
        // 遺덊븘?뷀븳 湲고샇???쒓굅
        .replace(/^\*\s*/gm, '') // 以??쒖옉??* ?쒓굅
        .replace(/^---\s*/gm, '') // --- ?쒓굅
        .replace(/^\s*\*\s*$/gm, '') // * 留??덈뒗 以??쒓굅
        // ?쒕ぉ ?щ㎎??
        .replace(/## (\d+)\. (.*?)(?=\n|$)/g, '<h3 class="text-xl font-bold text-purple-800 mb-4 pb-2 border-b-2 border-purple-200">$1. $2</h3>')
        .replace(/### (.*?)(?=\n|$)/g, '<h4 class="text-lg font-semibold text-gray-900 mt-6 mb-3 text-purple-700">$1</h4>')
        // ?곕낫?쇱깋 ?쒓렇?먯꽌 肄쒕줎 ?쒓굅
        .replace(/\*\*(.*?):\*\*/g, '<div class="mt-4 mb-2"><span class="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">$1</span></div>')
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
        .replace(/^- (.*?)$/gm, '<div class="flex items-start mb-2"><span class="text-purple-500 mr-2 mt-1">??/span><span class="text-gray-700">$1</span></div>')
        // 鍮?以??뺣━
        .replace(/\n\s*\n\s*\n/g, '\n\n') // 3媛??댁긽???곗냽 以꾨컮轅덉쓣 2媛쒕줈
        .replace(/\n\n/g, '<br><br>') // 以꾨컮轅덉쓣 HTML濡?
        .replace(/\n/g, '<br>'); // ?⑥씪 以꾨컮轅덈룄 泥섎━
    };

    return formatSection(text);
  };

  // 濡쒕뵫 ?곹깭
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">?쒕룞 ?뺣낫瑜?遺덈윭?ㅻ뒗 以?..</p>
        </div>
      </div>
    );
  }

  // ?ㅻ쪟 ?곹깭
  if (error || !activity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">?좑툘</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">?ㅻ쪟 諛쒖깮</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            紐⑸줉?쇰줈 ?뚯븘媛湲?
          </button>
        </div>
      </div>
    );
  }

  const aiAnalysis = parseAIAnalysis(activity.ai_analysis || '{}');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ?ㅻ뜑 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                紐⑸줉?쇰줈 ?뚯븘媛湲?
              </button>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              ?ш퀬猷⑦떞 ?쒕룞 ?곸꽭
            </h1>
            <div></div>
          </div>
        </div>
      </div>

      {/* 硫붿씤 肄섑뀗痢?*/}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* ?쒕룞 湲곕낯 ?뺣낫 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{activity.room_title}</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                activity.activity_type === 'online' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {activity.activity_type === 'online' ? '?⑤씪???쒕룞' : '?ㅽ봽?쇱씤 ?쒕룞'}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
              <div>
                <span className="font-medium">?숈깮:</span> {activity.student_name}
                {activity.student_grade && activity.student_class && (
                  <span> ({activity.student_grade} {activity.student_class}諛?/span>
                )}
                {activity.student_number && <span> {activity.student_number}踰?/span>}
                {activity.student_grade && activity.student_class && <span>)</span>}
              </div>
              <div>
                <span className="font-medium">?쒖텧??</span> {formatDate(activity.submitted_at)}
              </div>
              <div>
                <span className="font-medium">?ш퀬猷⑦떞:</span> {getRoutineTypeLabel(activity.routine_type)}
              </div>
              {activity.team_name && (
                <div>
                  <span className="font-medium">紐⑤몺:</span> {activity.team_name}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ?⑤씪???쒕룞 - 援먯궗 ?쒓났 ?먮즺 */}
        {activity.activity_type === 'online' && activity.template_content && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">援먯궗 ?쒓났 ?먮즺</h3>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                <div className="flex items-center mb-3">
                  <span className="text-blue-600 font-medium">?뱷 ?띿뒪???댁슜</span>
                </div>
                <p className="text-gray-900 mb-4">?곕━媛 ?ㅻ뒛 諛곗썙蹂?媛쒕뀗? 異⑹떎?섍쿋?듬땲??</p>
                
                <div className="space-y-3">
                  {(() => {
                    const template = activity.template_content;
                    const routineType = activity.routine_type;
                    
                    if (routineType === 'see-think-wonder') {
                      return (
                        <>
                          <div className="bg-white p-3 rounded border">
                            <div className="font-medium text-blue-600 mb-1">See 吏덈Ц</div>
                            <p className="text-gray-700 text-sm">{template?.see_question || '??媛쒕뀗???대뼸寃??뺤쓽?섍쿋?섏슂?'}</p>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <div className="font-medium text-green-600 mb-1">Think 吏덈Ц</div>
                            <p className="text-gray-700 text-sm">{template?.think_question || '??媛쒕뀗??二쇱슂 ?뱀쭠? 臾댁뾿?멸???'}</p>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <div className="font-medium text-purple-600 mb-1">Wonder 吏덈Ц</div>
                            <p className="text-gray-700 text-sm">{template?.wonder_question || '??媛쒕뀗?????沅곴툑??寃껋? 臾댁뾿?멸???'}</p>
                          </div>
                        </>
                      );
                    }
                    
                    if (routineType === 'frayer-model') {
                      return (
                        <>
                          <div className="bg-white p-3 rounded border">
                            <div className="font-medium text-blue-600 mb-1">Definition 吏덈Ц</div>
                            <p className="text-gray-700 text-sm">{template?.see_question || '??媛쒕뀗???대뼸寃??뺤쓽?섍쿋?섏슂?'}</p>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <div className="font-medium text-green-600 mb-1">Characteristics 吏덈Ц</div>
                            <p className="text-gray-700 text-sm">{template?.think_question || '??媛쒕뀗??二쇱슂 ?뱀쭠? 臾댁뾿?멸???'}</p>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <div className="font-medium text-purple-600 mb-1">Examples 吏덈Ц</div>
                            <p className="text-gray-700 text-sm">{template?.wonder_question || '??媛쒕뀗???덉떆? 諛섎???臾댁뾿?멸???'}</p>
                          </div>
                        </>
                      );
                    }
                    
                    // 湲고? ?ш퀬猷⑦떞??
                    return (
                      <div className="bg-white p-3 rounded border">
                        <div className="font-medium text-gray-700 mb-2">?ш퀬猷⑦떞 吏덈Ц??/div>
                        {Object.entries(template || {}).map(([key, value]) => (
                          <div key={key} className="mb-2 last:mb-0">
                            <span className="text-sm font-medium text-gray-600">{key}: </span>
                            <span className="text-sm text-gray-700">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
              
              {activity.room_description && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">?쒕룞 ?ㅻ챸</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-700">{activity.room_description}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ?ㅽ봽?쇱씤 ?쒕룞 - ?대?吏 */}
        {activity.activity_type === 'offline' && (activity.image_url || activity.image_data) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">?벜 ?낅줈?쒕맂 ?대?吏</h3>
              <div className="flex justify-center">
                <img
                  src={activity.image_url || activity.image_data}
                  alt="?숈깮 ?쒕룞 ?대?吏"
                  className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setImageModalOpen(true)}
                />
              </div>
              <p className="text-sm text-gray-500 text-center mt-2">
                ?대?吏瑜??대┃?섎㈃ ?뺣??댁꽌 蹂????덉뒿?덈떎
              </p>
            </div>
          </div>
        )}

        {/* ?⑤씪???쒕룞 - ?숈깮 ?묐떟 (StudentResponseDetail ?ㅽ??? */}
        {activity.activity_type === 'online' && activity.response_data && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">?륅툘 ?숈깮 ?묐떟</h3>
              
              <div className="space-y-6">
                {(() => {
                  const routineType = activity.routine_type;
                  const responseData = activity.response_data;
                  
                  // See-Think-Wonder
                  if (routineType === 'see-think-wonder') {
                    return (
                      <>
                        <div>
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                              <span className="text-white font-bold text-sm">S</span>
                            </div>
                            <div>
                              <h4 className="text-lg font-medium text-gray-900">See</h4>
                              <p className="text-sm text-gray-600">蹂닿린</p>
                            </div>
                          </div>
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-gray-900 whitespace-pre-wrap">
                              {responseData.see || '?묐떟 ?놁쓬'}
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
                              <p className="text-sm text-gray-600">?앷컖?섍린</p>
                            </div>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-gray-900 whitespace-pre-wrap">
                              {responseData.think || '?묐떟 ?놁쓬'}
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
                              <p className="text-sm text-gray-600">沅곴툑?섍린</p>
                            </div>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <p className="text-gray-900 whitespace-pre-wrap">
                              {responseData.wonder || '?묐떟 ?놁쓬'}
                            </p>
                          </div>
                        </div>
                      </>
                    );
                  }
                  
                  // Frayer Model
                  if (routineType === 'frayer-model') {
                    return (
                      <>
                        <div>
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                              <span className="text-white font-bold text-sm">D</span>
                            </div>
                            <div>
                              <h4 className="text-lg font-medium text-gray-900">Definition</h4>
                              <p className="text-sm text-gray-600">?뺤쓽</p>
                            </div>
                          </div>
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-gray-900 whitespace-pre-wrap">
                              {responseData.see || '?묐떟 ?놁쓬'}
                            </p>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                              <span className="text-white font-bold text-sm">C</span>
                            </div>
                            <div>
                              <h4 className="text-lg font-medium text-gray-900">Characteristics</h4>
                              <p className="text-sm text-gray-600">?뱀쭠</p>
                            </div>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-gray-900 whitespace-pre-wrap">
                              {responseData.think || '?묐떟 ?놁쓬'}
                            </p>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                              <span className="text-white font-bold text-sm">E</span>
                            </div>
                            <div>
                              <h4 className="text-lg font-medium text-gray-900">Examples & Non-Examples</h4>
                              <p className="text-sm text-gray-600">?덉떆? 諛섎?</p>
                            </div>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-green-600 font-bold">??/span>
                                  <span className="font-medium text-gray-900">?덉떆 (Examples)</span>
                                </div>
                                <div className="bg-white p-3 rounded border">
                                  <p className="text-gray-900 whitespace-pre-wrap">
                                    {(() => {
                                      const wonderResponse = responseData.wonder || '';
                                      const parts = wonderResponse.split('||');
                                      return parts[0] || '?묐떟 ?놁쓬';
                                    })()}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-red-600 font-bold">??/span>
                                  <span className="font-medium text-gray-900">諛섎? (Non-Examples)</span>
                                </div>
                                <div className="bg-white p-3 rounded border">
                                  <p className="text-gray-900 whitespace-pre-wrap">
                                    {(() => {
                                      const wonderResponse = responseData.wonder || '';
                                      const parts = wonderResponse.split('||');
                                      return parts[1] || '?묐떟 ?놁쓬';
                                    })()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  }
                  
                  // 紐⑤뱺 ?ш퀬猷⑦떞 ?좏삎蹂??④퀎 ?ㅼ젙
                  const routineStepConfigs: {[routineType: string]: {[key: string]: {title: string, subtitle: string, color: string, bgColor: string, icon: string}}} = {
                    'see-think-wonder': {
                      see: { title: 'See', subtitle: '蹂닿린', color: 'bg-blue-500', bgColor: 'bg-blue-50', icon: 'S' },
                      think: { title: 'Think', subtitle: '?앷컖?섍린', color: 'bg-green-500', bgColor: 'bg-green-50', icon: 'T' },
                      wonder: { title: 'Wonder', subtitle: '沅곴툑?섍린', color: 'bg-purple-500', bgColor: 'bg-purple-50', icon: 'W' }
                    },
                    '4c': {
                      see: { title: 'Connect', subtitle: '?곌껐?섍린', color: 'bg-blue-500', bgColor: 'bg-blue-50', icon: 'C' },
                      think: { title: 'Challenge', subtitle: '?꾩쟾?섍린', color: 'bg-red-500', bgColor: 'bg-red-50', icon: 'C' },
                      wonder: { title: 'Concepts', subtitle: '媛쒕뀗 ?뚯븙', color: 'bg-green-500', bgColor: 'bg-green-50', icon: 'C' },
                      fourth_step: { title: 'Changes', subtitle: '蹂???쒖븞', color: 'bg-purple-500', bgColor: 'bg-purple-50', icon: 'C' }
                    },
                    'circle-of-viewpoints': {
                      see: { title: 'Viewpoints', subtitle: '愿???먯깋', color: 'bg-blue-500', bgColor: 'bg-blue-50', icon: 'V' },
                      think: { title: 'Perspective', subtitle: '愿???좏깮', color: 'bg-green-500', bgColor: 'bg-green-50', icon: 'P' },
                      wonder: { title: 'Questions', subtitle: '愿?먮퀎 吏덈Ц', color: 'bg-purple-500', bgColor: 'bg-purple-50', icon: 'Q' }
                    },
                    'connect-extend-challenge': {
                      see: { title: 'Connect', subtitle: '?곌껐?섍린', color: 'bg-blue-500', bgColor: 'bg-blue-50', icon: 'C' },
                      think: { title: 'Extend', subtitle: '?뺤옣?섍린', color: 'bg-green-500', bgColor: 'bg-green-50', icon: 'E' },
                      wonder: { title: 'Challenge', subtitle: '?꾩쟾?섍린', color: 'bg-red-500', bgColor: 'bg-red-50', icon: 'C' }
                    },
                    'frayer-model': {
                      see: { title: 'Definition', subtitle: '?뺤쓽', color: 'bg-blue-500', bgColor: 'bg-blue-50', icon: 'D' },
                      think: { title: 'Characteristics', subtitle: '?뱀쭠', color: 'bg-green-500', bgColor: 'bg-green-50', icon: 'C' },
                      wonder: { title: 'Examples', subtitle: '?덉떆? 諛섎?', color: 'bg-purple-500', bgColor: 'bg-purple-50', icon: 'E' }
                    },
                    'used-to-think-now-think': {
                      see: { title: 'Used to Think', subtitle: '?댁쟾 ?앷컖', color: 'bg-blue-500', bgColor: 'bg-blue-50', icon: 'U' },
                      think: { title: 'Now Think', subtitle: '?꾩옱 ?앷컖', color: 'bg-green-500', bgColor: 'bg-green-50', icon: 'N' },
                      wonder: { title: 'Why Changed', subtitle: '蹂???댁쑀', color: 'bg-purple-500', bgColor: 'bg-purple-50', icon: 'W' }
                    },
                    'think-puzzle-explore': {
                      see: { title: 'Think', subtitle: '?앷컖?섍린', color: 'bg-blue-500', bgColor: 'bg-blue-50', icon: 'T' },
                      think: { title: 'Puzzle', subtitle: '?쇱쫹', color: 'bg-yellow-500', bgColor: 'bg-yellow-50', icon: 'P' },
                      wonder: { title: 'Explore', subtitle: '?먭뎄?섍린', color: 'bg-green-500', bgColor: 'bg-green-50', icon: 'E' }
                    }
                  };

                  // ?꾩옱 猷⑦떞 ??낆뿉 ?곕Ⅸ ?ㅼ젙 媛?몄삤湲?
                  const currentRoutineType = activity.routine_type || 'see-think-wonder';
                  const stepConfigs = routineStepConfigs[currentRoutineType] || routineStepConfigs['see-think-wonder'];
                  
                  return Object.entries(responseData)
                    .filter(([key]) => key !== 'fourth_step' || currentRoutineType === '4c') // 4C媛 ?꾨땶 寃쎌슦 fourth_step ?쒖쇅
                    .map(([key, value]) => {
                    if (!value && key === 'fourth_step') return null;
                    const config = stepConfigs[key];
                    if (!config) return null;
                    
                    return (
                      <div key={key}>
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`w-8 h-8 rounded-full ${config.color} flex items-center justify-center`}>
                            <span className="text-white font-bold text-sm">{config.icon}</span>
                          </div>
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">{config.title}</h4>
                            <p className="text-sm text-gray-600">{config.subtitle}</p>
                          </div>
                        </div>
                        <div className={`${config.bgColor} p-4 rounded-lg`}>
                          <p className="text-gray-900 whitespace-pre-wrap">
                            {String(value) || '?묐떟 ?놁쓬'}
                          </p>
                        </div>
                      </div>
                    );
                  }).filter(Boolean);
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ?⑤씪???쒕룞: AI 遺꾩꽍 寃곌낵 ?쒖떆 */}
        {activity.activity_type === 'online' && activity.ai_analysis && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6">
              {aiAnalysis ? (
                <div className="space-y-6">
                  {/* ?④퀎蹂?遺꾩꽍 ?쒖떆 (ThinkingRoutineAnalysis ?ㅽ??? */}
                  {aiAnalysis.individualSteps && (
                    <div>
                      <h4 className="text-base font-semibold text-gray-800 mb-4">媛??④퀎蹂?遺꾩꽍</h4>
                      <div className="space-y-4">
                        {Object.entries(aiAnalysis.individualSteps).map(([stepKey, stepContent], index) => {
                          // ?④퀎蹂??뺣낫 留ㅽ븨
                          const stepInfoMap: {[key: string]: {title: string, subtitle: string, color: string}} = {
                            'see': { title: 'See', subtitle: '蹂닿린', color: 'bg-blue-500' },
                            'think': { title: 'Think', subtitle: '?앷컖?섍린', color: 'bg-green-500' },
                            'wonder': { title: 'Wonder', subtitle: '沅곴툑?섍린', color: 'bg-purple-500' },
                            'connect': { title: 'Connect', subtitle: '?곌껐?섍린', color: 'bg-blue-500' },
                            'challenge': { title: 'Challenge', subtitle: '?꾩쟾?섍린', color: 'bg-red-500' },
                            'concepts': { title: 'Concepts', subtitle: '媛쒕뀗 ?뚯븙', color: 'bg-green-500' },
                            'changes': { title: 'Changes', subtitle: '蹂???쒖븞', color: 'bg-purple-500' },
                            'definition': { title: 'Definition', subtitle: '?뺤쓽', color: 'bg-blue-500' },
                            'characteristics': { title: 'Characteristics', subtitle: '?뱀쭠', color: 'bg-green-500' },
                            'examples': { title: 'Examples', subtitle: '?덉떆? 諛섎?', color: 'bg-purple-500' }
                          };

                          const stepInfo = stepInfoMap[stepKey];
                          if (!stepInfo || !stepContent) return null;

                          const gradientColors: {[key: string]: string} = {
                            'bg-blue-500': 'from-blue-50 to-white border-blue-200',
                            'bg-green-500': 'from-green-50 to-white border-green-200',
                            'bg-purple-500': 'from-purple-50 to-white border-purple-200',
                            'bg-red-500': 'from-red-50 to-white border-red-200'
                          };

                          return (
                            <div 
                              key={stepKey}
                              className={`bg-gradient-to-br ${gradientColors[stepInfo.color] || 'from-gray-50 to-white border-gray-200'} border rounded-xl p-6`}
                            >
                              <h5 className={`text-lg font-bold mb-4 flex items-center ${
                                stepInfo.color === 'bg-blue-500' ? 'text-blue-800' :
                                stepInfo.color === 'bg-green-500' ? 'text-green-800' :
                                stepInfo.color === 'bg-purple-500' ? 'text-purple-800' :
                                stepInfo.color === 'bg-red-500' ? 'text-red-800' : 'text-gray-800'
                              }`}>
                                <span className={`w-8 h-8 ${stepInfo.color} text-white rounded-full flex items-center justify-center text-sm font-bold mr-3`}>
                                  {index + 1}
                                </span>
                                {stepInfo.title} ({stepInfo.subtitle})
                              </h5>
                              
                              {/* AI 遺꾩꽍 寃곌낵 */}
                              <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                                <h6 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                  <svg className="w-4 h-4 mr-1 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                  </svg>
                                  AI 遺꾩꽍 寃곌낵
                                </h6>
                                <div 
                                  className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                                  dangerouslySetInnerHTML={{ __html: formatMarkdownText(stepContent as string) }}
                                />
                              </div>

                              {/* 援먯궗 ?쇰뱶諛?諛??먯닔 */}
                              {(() => {
                                // ?꾩껜 遺꾩꽍 ?곗씠?곗뿉??teacherFeedback 李얘린
                                const fullAnalysis = typeof activity.ai_analysis === 'string' ? 
                                  JSON.parse(activity.ai_analysis) : activity.ai_analysis;
                                const teacherFeedbackSteps = fullAnalysis?.teacherFeedback?.individualSteps;
                                const stepFeedback = teacherFeedbackSteps?.[stepKey];
                                
                                // ?붾쾭源낆슜 濡쒓렇
                                console.log('?뵇 Online Step:', stepKey);
                                console.log('?뱤 Online Full Analysis:', fullAnalysis);
                                console.log('?뫅?랅윆?Online Teacher Feedback Steps:', teacherFeedbackSteps);
                                console.log('?뱷 Online Step Feedback:', stepFeedback);
                                
                                if (stepFeedback) {
                                  return (
                                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                                      <h6 className="text-sm font-medium text-gray-700 mb-3 flex items-center justify-between">
                                        <span className="flex items-center">
                                          <svg className="w-4 h-4 mr-1 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                          </svg>
                                          援먯궗 ?쇰뱶諛?
                                        </span>
                                        {stepFeedback.score && (
                                          <span className="text-sm font-medium text-green-600">
                                            {stepFeedback.score}??/ 100??
                                          </span>
                                        )}
                                      </h6>
                                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                                        <p className="text-gray-700 text-sm whitespace-pre-wrap">
                                          {stepFeedback.feedback || '援먯궗 ?쇰뱶諛깆씠 ?꾩쭅 ?묒꽦?섏? ?딆븯?듬땲??'}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}


                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div 
                    className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatMarkdownText(activity.ai_analysis) }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* 泥?踰덉㎏ ?ㅽ봽?쇱씤 ?뱀뀡 ?쒓굅??*/}
        {false && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6">
              
              {aiAnalysis && aiAnalysis.individualSteps && Object.keys(aiAnalysis.individualSteps).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(aiAnalysis.individualSteps).map(([stepKey, stepContent], index) => {
                    // ?④퀎蹂??뺣낫 留ㅽ븨
                    const stepInfoMap: {[key: string]: {title: string, subtitle: string, color: string}} = {
                      'see': { title: 'See', subtitle: '蹂닿린', color: 'bg-blue-500' },
                      'think': { title: 'Think', subtitle: '?앷컖?섍린', color: 'bg-green-500' },
                      'wonder': { title: 'Wonder', subtitle: '沅곴툑?섍린', color: 'bg-purple-500' },
                      'connect': { title: 'Connect', subtitle: '?곌껐?섍린', color: 'bg-blue-500' },
                      'challenge': { title: 'Challenge', subtitle: '?꾩쟾?섍린', color: 'bg-red-500' },
                      'concepts': { title: 'Concepts', subtitle: '媛쒕뀗 ?뚯븙', color: 'bg-green-500' },
                      'changes': { title: 'Changes', subtitle: '蹂???쒖븞', color: 'bg-purple-500' },
                      'definition': { title: 'Definition', subtitle: '?뺤쓽', color: 'bg-blue-500' },
                      'characteristics': { title: 'Characteristics', subtitle: '?뱀쭠', color: 'bg-green-500' },
                      'examples': { title: 'Examples', subtitle: '?덉떆? 諛섎?', color: 'bg-purple-500' }
                    };

                    const stepInfo = stepInfoMap[stepKey];
                    if (!stepInfo) return null;

                    const gradientColors: {[key: string]: string} = {
                      'bg-blue-500': 'from-blue-50 to-white border-blue-200',
                      'bg-green-500': 'from-green-50 to-white border-green-200',
                      'bg-purple-500': 'from-purple-50 to-white border-purple-200',
                      'bg-red-500': 'from-red-50 to-white border-red-200'
                    };

                    // ??λ맂 援먯궗 ?쇰뱶諛?李얘린
                    const savedFeedback = aiAnalysis.teacherFeedback && aiAnalysis.teacherFeedback[stepKey];
                    const feedbackData = typeof savedFeedback === 'object' ? savedFeedback as any : { feedback: savedFeedback || '', score: null };
                    
                    console.log(`?뵇 ${stepKey} ?④퀎 ?쇰뱶諛?`, savedFeedback);

                    return (
                      <div 
                        key={stepKey}
                        className={`bg-gradient-to-br ${gradientColors[stepInfo.color] || 'from-gray-50 to-white border-gray-200'} border rounded-xl p-6`}
                      >
                        <h3 className={`text-lg font-bold mb-4 flex items-center ${
                          stepInfo.color === 'bg-blue-500' ? 'text-blue-800' :
                          stepInfo.color === 'bg-green-500' ? 'text-green-800' :
                          stepInfo.color === 'bg-purple-500' ? 'text-purple-800' :
                          stepInfo.color === 'bg-red-500' ? 'text-red-800' : 'text-gray-800'
                        }`}>
                          <span className={`w-8 h-8 ${stepInfo.color} text-white rounded-full flex items-center justify-center text-sm font-bold mr-3`}>
                            {index + 1}
                          </span>
                          {stepInfo.title} ({stepInfo.subtitle})
                        </h3>
                        
                        {/* AI 遺꾩꽍 ?댁슜 */}
                        <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-1 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            AI 遺꾩꽍 寃곌낵
                          </h4>
                          <div 
                            className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: formatMarkdownText(stepContent as string) }}
                          />
                        </div>

                        {/* 援먯궗 ?쇰뱶諛??쒖떆 (?쎄린 ?꾩슜) */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">援먯궗 ?쇰뱶諛?/label>
                          <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 min-h-[80px]">
                            {feedbackData.feedback || '?쇰뱶諛깆씠 ?낅젰?섏? ?딆븯?듬땲??'}
                          </div>
                        </div>

                        {/* ?먯닔 ?쒖떆 */}
                        <div className="flex items-center">
                          <label className="block text-sm font-medium text-gray-700 mr-4">?먯닔 (1-100??</label>
                          <div className="w-24 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 text-center">
                            {feedbackData.score || '-'}
                          </div>
                          <span className="ml-2 text-sm text-gray-500">/ 100??/span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-2">AI 遺꾩꽍 ?곗씠???뺤씤</h4>
                  <p className="text-gray-600 mb-4">援ъ“?붾맂 AI 遺꾩꽍 寃곌낵瑜?李얠쓣 ???놁뒿?덈떎.</p>
                  
                  {/* ?붾쾭源??뺣낫 ?쒖떆 */}
                  {aiAnalysis ? (
                    <div className="text-xs text-gray-500 bg-white p-3 rounded border">
                      <p className="font-medium mb-1">??λ맂 ?곗씠??援ъ“:</p>
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(aiAnalysis, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">AI 遺꾩꽍 ?곗씠?곌? ?놁뒿?덈떎.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ?⑤씪???쒕룞: AI 遺꾩꽍 寃곌낵 ?쒖떆 ?꾩쟾 ?쒓굅??*/}

        {/* ?ㅽ봽?쇱씤 ?쒕룞: 5?④퀎 援먯궗 ?쇰뱶諛?諛??됯? (媛쒖꽑??踰꾩쟾) */}
        {activity.activity_type === 'offline' && activity.ai_analysis && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6">
              {aiAnalysis ? (
                <div className="space-y-6">
                  {/* ?④퀎蹂?遺꾩꽍 ?쒖떆 (ThinkingRoutineAnalysis ?ㅽ??? */}
                  {aiAnalysis.individualSteps && (
                    <div>
                      <h4 className="text-base font-semibold text-gray-800 mb-4">媛??④퀎蹂?遺꾩꽍</h4>
                      <div className="space-y-4">
                        {Object.entries(aiAnalysis.individualSteps).map(([stepKey, stepContent], index) => {
                          // ?④퀎蹂??뺣낫 留ㅽ븨
                          const stepInfoMap: {[key: string]: {title: string, subtitle: string, color: string}} = {
                            'see': { title: 'See', subtitle: '蹂닿린', color: 'bg-blue-500' },
                            'think': { title: 'Think', subtitle: '?앷컖?섍린', color: 'bg-green-500' },
                            'wonder': { title: 'Wonder', subtitle: '沅곴툑?섍린', color: 'bg-purple-500' },
                            'connect': { title: 'Connect', subtitle: '?곌껐?섍린', color: 'bg-blue-500' },
                            'challenge': { title: 'Challenge', subtitle: '?꾩쟾?섍린', color: 'bg-red-500' },
                            'concepts': { title: 'Concepts', subtitle: '媛쒕뀗 ?뚯븙', color: 'bg-green-500' },
                            'changes': { title: 'Changes', subtitle: '蹂???쒖븞', color: 'bg-purple-500' },
                            'definition': { title: 'Definition', subtitle: '?뺤쓽', color: 'bg-blue-500' },
                            'characteristics': { title: 'Characteristics', subtitle: '?뱀쭠', color: 'bg-green-500' },
                            'examples': { title: 'Examples', subtitle: '?덉떆? 諛섎?', color: 'bg-purple-500' }
                          };

                          const stepInfo = stepInfoMap[stepKey];
                          if (!stepInfo || !stepContent) return null;

                          const gradientColors: {[key: string]: string} = {
                            'bg-blue-500': 'from-blue-50 to-white border-blue-200',
                            'bg-green-500': 'from-green-50 to-white border-green-200',
                            'bg-purple-500': 'from-purple-50 to-white border-purple-200',
                            'bg-red-500': 'from-red-50 to-white border-red-200'
                          };

                          return (
                            <div 
                              key={stepKey}
                              className={`bg-gradient-to-br ${gradientColors[stepInfo.color] || 'from-gray-50 to-white border-gray-200'} border rounded-xl p-6`}
                            >
                              <h5 className={`text-lg font-bold mb-4 flex items-center ${
                                stepInfo.color === 'bg-blue-500' ? 'text-blue-800' :
                                stepInfo.color === 'bg-green-500' ? 'text-green-800' :
                                stepInfo.color === 'bg-purple-500' ? 'text-purple-800' :
                                stepInfo.color === 'bg-red-500' ? 'text-red-800' : 'text-gray-800'
                              }`}>
                                <span className={`w-8 h-8 ${stepInfo.color} text-white rounded-full flex items-center justify-center text-sm font-bold mr-3`}>
                                  {index + 1}
                                </span>
                                {stepInfo.title} ({stepInfo.subtitle})
                              </h5>
                              
                              {/* AI 遺꾩꽍 寃곌낵 */}
                              <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                                <h6 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                  <svg className="w-4 h-4 mr-1 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                  </svg>
                                  AI 遺꾩꽍 寃곌낵
                                </h6>
                                <div 
                                  className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                                  dangerouslySetInnerHTML={{ __html: formatMarkdownText(stepContent as string) }}
                                />
                              </div>

                              {/* 援먯궗 ?쇰뱶諛?諛??먯닔 */}
                              {(() => {
                                // ?꾩껜 遺꾩꽍 ?곗씠?곗뿉??teacherFeedback 李얘린
                                const fullAnalysis = typeof activity.ai_analysis === 'string' ? 
                                  JSON.parse(activity.ai_analysis) : activity.ai_analysis;
                                const teacherFeedbackSteps = fullAnalysis?.teacherFeedback?.individualSteps;
                                const stepFeedback = teacherFeedbackSteps?.[stepKey];
                                
                                // ?붾쾭源낆슜 濡쒓렇
                                console.log('?뵇 Step:', stepKey);
                                console.log('?뱤 Full Analysis:', fullAnalysis);
                                console.log('?뫅?랅윆?Teacher Feedback Steps:', teacherFeedbackSteps);
                                console.log('?뱷 Step Feedback:', stepFeedback);
                                
                                if (stepFeedback) {
                                  return (
                                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                                      <h6 className="text-sm font-medium text-gray-700 mb-3 flex items-center justify-between">
                                        <span className="flex items-center">
                                          <svg className="w-4 h-4 mr-1 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                          </svg>
                                          援먯궗 ?쇰뱶諛?
                                        </span>
                                        {stepFeedback.score && (
                                          <span className="text-sm font-medium text-green-600">
                                            {stepFeedback.score}??/ 100??
                                          </span>
                                        )}
                                      </h6>
                                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                                        <p className="text-gray-700 text-sm whitespace-pre-wrap">
                                          {stepFeedback.feedback || '援먯궗 ?쇰뱶諛깆씠 ?꾩쭅 ?묒꽦?섏? ?딆븯?듬땲??'}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}


                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div 
                    className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatMarkdownText(activity.ai_analysis) }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* 援먯궗 ?쇰뱶諛?諛??됯? ?뱀뀡 */}
        {(activity?.teacher_feedback || activity?.teacher_score || (aiAnalysis && aiAnalysis.teacherFeedback)) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">?뫆?랅윆?援먯궗 ?쇰뱶諛?諛??됯?</h3>
              
              {/* ?꾩껜 ?먯닔 ?쒖떆 */}
              {activity?.teacher_score && (
                <div className="mb-6">
                  <span className="text-sm text-gray-600">?꾩껜 ?됯? ?먯닔: </span>
                  <span className="text-xl font-bold text-green-600">{activity?.teacher_score}??/span>
                  <span className="text-sm text-gray-500"> / 100??/span>
                </div>
              )}
              
              {/* 援ъ“?붾맂 援먯궗 ?쇰뱶諛??쒖떆 (AI 遺꾩꽍怨??④퍡 ??λ맂 寃쎌슦) */}
              {aiAnalysis && aiAnalysis.teacherFeedback && (
                <div className="space-y-4 mb-6">
                  <h4 className="text-base font-semibold text-gray-800">?④퀎蹂?援먯궗 ?쇰뱶諛?/h4>
                  {Object.entries(aiAnalysis.teacherFeedback).map(([stepKey, feedback], index) => {
                    const stepInfoMap: {[key: string]: {title: string, subtitle: string, color: string}} = {
                      'see': { title: 'See', subtitle: '蹂닿린', color: 'bg-blue-500' },
                      'think': { title: 'Think', subtitle: '?앷컖?섍린', color: 'bg-green-500' },
                      'wonder': { title: 'Wonder', subtitle: '沅곴툑?섍린', color: 'bg-purple-500' },
                      'connect': { title: 'Connect', subtitle: '?곌껐?섍린', color: 'bg-blue-500' },
                      'challenge': { title: 'Challenge', subtitle: '?꾩쟾?섍린', color: 'bg-red-500' },
                      'concepts': { title: 'Concepts', subtitle: '媛쒕뀗 ?뚯븙', color: 'bg-green-500' },
                      'changes': { title: 'Changes', subtitle: '蹂???쒖븞', color: 'bg-purple-500' },
                      'definition': { title: 'Definition', subtitle: '?뺤쓽', color: 'bg-blue-500' },
                      'characteristics': { title: 'Characteristics', subtitle: '?뱀쭠', color: 'bg-green-500' },
                      'examples': { title: 'Examples', subtitle: '?덉떆? 諛섎?', color: 'bg-purple-500' }
                    };

                    const stepInfo = stepInfoMap[stepKey];
                    if (!stepInfo || !feedback) return null;

                    const feedbackData = typeof feedback === 'object' ? feedback as any : { feedback: feedback, score: null };

                    return (
                      <div key={stepKey} className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                        <h5 className="font-medium text-gray-800 mb-2 flex items-center">
                          <span className={`w-6 h-6 ${stepInfo.color} text-white rounded-full flex items-center justify-center text-xs font-bold mr-2`}>
                            {index + 1}
                          </span>
                          {stepInfo.title} ({stepInfo.subtitle})
                          {feedbackData.score && (
                            <span className="ml-auto text-sm font-medium text-green-600">
                              {feedbackData.score}??
                            </span>
                          )}
                        </h5>
                        <p className="text-gray-700 text-sm whitespace-pre-wrap ml-8">
                          {feedbackData.feedback || feedbackData}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* ?쇰컲 援먯궗 ?쇰뱶諛?(湲곗〈 諛⑹떇) */}
              {activity?.teacher_feedback && !(aiAnalysis && aiAnalysis.teacherFeedback) && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-2">?쇰뱶諛??댁슜</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{activity?.teacher_feedback}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ?대?吏 ?뺣? 紐⑤떖 */}
      {imageModalOpen && (activity.image_url || activity.image_data) && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setImageModalOpen(false)}
        >
          <div className="relative max-w-full max-h-full">
            <button
              onClick={() => setImageModalOpen(false)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75"
            >
              ??
            </button>
            <img
              src={activity.image_url || activity.image_data}
              alt="?숈깮 ?쒕룞 ?대?吏 (?뺣?)"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentActivityDetail;
