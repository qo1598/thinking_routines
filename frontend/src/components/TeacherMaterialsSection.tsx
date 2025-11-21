import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface TeacherMaterialsSectionProps {
  roomId: string;
  roomTitle?: string;
  roomDescription?: string;
}

interface TemplateContent {
  text_content?: string;
  image_url?: string;
  youtube_url?: string;
  see_question?: string;
  think_question?: string;
  wonder_question?: string;
  fourth_question?: string;
  // 추가 사고루틴 질문 필드들
  connect_question?: string;
  extend_question?: string;
  challenge_question?: string;
  concepts_question?: string;
  changes_question?: string;
  definition_question?: string;
  characteristics_question?: string;
  examples_question?: string;
  non_examples_question?: string;
  used_to_think_question?: string;
  now_think_question?: string;
  puzzle_question?: string;
  explore_question?: string;
  viewpoint_select_question?: string;
  viewpoint_thinking_question?: string;
  viewpoint_concerns_question?: string;
}


const TeacherMaterialsSection: React.FC<TeacherMaterialsSectionProps> = ({
  roomId,
  roomTitle,
  roomDescription
}) => {
  const [templateContent, setTemplateContent] = useState<TemplateContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplateContent();
  }, [roomId]);

  const fetchTemplateContent = async () => {
    try {
      const { data, error } = await supabase
        .from('routine_templates')
        .select('content')
        .eq('room_id', roomId)
        .single();

      if (error) {
        console.log('템플릿 데이터가 없습니다:', error);
        setTemplateContent(null);
      } else {
        setTemplateContent(data?.content || null);
      }
    } catch (err) {
      console.error('템플릿 데이터 로딩 오류:', err);
      setTemplateContent(null);
    } finally {
      setLoading(false);
    }
  };

  const extractYouTubeId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!templateContent) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">교사 제공 자료</h3>
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">교사 제공 자료가 없습니다</h4>
            <p className="text-gray-600">이 활동에는 교사가 제공한 자료가 없습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">교사 제공 자료</h3>

        <div className="space-y-6">
          {/* 텍스트 내용 */}
          {templateContent.text_content && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center mb-3">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-blue-600 font-medium">텍스트 내용</span>
              </div>
              <div className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                {templateContent.text_content}
              </div>
            </div>
          )}

          {/* 이미지 */}
          {templateContent.image_url && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center mb-3">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-green-600 font-medium">이미지 자료</span>
              </div>
              <div className="bg-white p-3 rounded border border-green-200">
                <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 비율로 영상과 동일하게 */ }}>
                  <img
                    src={templateContent.image_url}
                    alt="교사 제공 이미지"
                    className="absolute top-0 left-0 w-full h-full object-contain rounded"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 유튜브 영상 */}
          {templateContent.youtube_url && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center mb-3">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-600 font-medium">유튜브 영상</span>
              </div>
              <div className="bg-white p-3 rounded border border-red-200">
                {(() => {
                  const videoId = extractYouTubeId(templateContent.youtube_url!);
                  if (videoId) {
                    return (
                      <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 비율 */ }}>
                        <iframe
                          src={`https://www.youtube.com/embed/${videoId}`}
                          title="교사 제공 유튜브 영상"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute top-0 left-0 w-full h-full rounded"
                        />
                      </div>
                    );
                  } else {
                    return (
                      <div className="text-center py-4">
                        <p className="text-gray-600 mb-2">유튜브 영상을 불러올 수 없습니다</p>
                        <a
                          href={templateContent.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          링크에서 직접 보기
                        </a>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          )}

          {/* 사고루틴 질문들 */}
          {(templateContent.see_question || templateContent.think_question || templateContent.wonder_question || templateContent.fourth_question) && (
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center mb-3">
                <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-purple-600 font-medium">사고루틴 질문</span>
              </div>
              <div className="space-y-3">
                {templateContent.see_question && (
                  <div className="bg-white p-3 rounded border border-purple-200">
                    <div className="font-medium text-blue-600 mb-1">See 질문</div>
                    <p className="text-gray-700">{templateContent.see_question}</p>
                  </div>
                )}
                {templateContent.think_question && (
                  <div className="bg-white p-3 rounded border border-purple-200">
                    <div className="font-medium text-green-600 mb-1">Think 질문</div>
                    <p className="text-gray-700">{templateContent.think_question}</p>
                  </div>
                )}
                {templateContent.wonder_question && (
                  <div className="bg-white p-3 rounded border border-purple-200">
                    <div className="font-medium text-purple-600 mb-1">Wonder 질문</div>
                    <p className="text-gray-700">{templateContent.wonder_question}</p>
                  </div>
                )}
                {templateContent.fourth_question && (
                  <div className="bg-white p-3 rounded border border-purple-200">
                    <div className="font-medium text-pink-600 mb-1">4번째 질문</div>
                    <p className="text-gray-700">{templateContent.fourth_question}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 활동 설명 */}
          {roomDescription && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center mb-3">
                <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-600 font-medium">활동 설명</span>
              </div>
              <div className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                {roomDescription}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherMaterialsSection;
