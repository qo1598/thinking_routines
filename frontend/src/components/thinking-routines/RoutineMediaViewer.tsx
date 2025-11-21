import React from 'react';
import { RoutineTemplate } from '../../types';

interface Props {
    template: RoutineTemplate;
    stepQuestion: string;
}

const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : null;
};

export const RoutineMediaViewer: React.FC<Props> = ({ template, stepQuestion }) => {
    return (
        <div className="mb-6">
            <div className="mb-6 space-y-4">
                {/* 텍스트 컨텐츠 */}
                {template.content.text_content && (
                    <div className="prose max-w-none mb-6">
                        <div className="text-gray-900 whitespace-pre-wrap text-center bg-gray-50 p-4 rounded-lg">
                            {template.content.text_content}
                        </div>
                    </div>
                )}

                {/* 이미지 */}
                {template.content.image_url && (
                    <div className="flex justify-center mb-6">
                        <div className="w-full max-w-2xl">
                            <div className="relative" style={{ paddingBottom: '56.25%' }}>
                                <img
                                    src={template.content.image_url}
                                    alt="활동 자료"
                                    className="absolute inset-0 w-full h-full object-cover rounded-lg shadow-sm"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* 유튜브 영상 */}
                {template.content.youtube_url && (
                    <div className="flex justify-center mb-6">
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
                )}

                {/* 자료 없음 */}
                {!template.content.image_url && !template.content.text_content && !template.content.youtube_url && (
                    <div className="text-center py-8">
                        <div className="bg-gray-100 rounded-lg p-6">
                            <p className="text-gray-600">선생님이 아직 활동 자료를 설정하지 않았습니다.</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-lg text-gray-800 font-medium">질문: {stepQuestion}</p>
            </div>
        </div>
    );
};
