import React from 'react';
import { NewRoomForm } from '../../types';
import { thinkingRoutineOptions, getYouTubeEmbedUrl } from '../../lib/roomUtils';

interface RoomCreationFormProps {
    formData: NewRoomForm;
    currentStep: number;
    loading: boolean;
    onUpdate: (updates: Partial<NewRoomForm>) => void;
    onTemplateUpdate: (updates: Partial<NewRoomForm['template_content']>) => void;
    onRoutineChange: (routineType: string) => void;
    onStepChange: (step: number) => void;
    onCancel: () => void;
    onSubmit: (e: React.FormEvent) => void;
}

export const RoomCreationForm: React.FC<RoomCreationFormProps> = ({
    formData,
    currentStep,
    loading,
    onUpdate,
    onTemplateUpdate,
    onRoutineChange,
    onStepChange,
    onCancel,
    onSubmit
}) => {
    return (
        <div className="bg-white shadow-sm rounded-lg p-6 mb-8 border border-blue-100">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">새 활동방 만들기</h2>
                <div className="flex items-center mt-4">
                    <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 1 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>1</div>
                        <span className="ml-2 font-medium">기본 정보</span>
                    </div>
                    <div className={`w-12 h-0.5 mx-4 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                    <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 2 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>2</div>
                        <span className="ml-2 font-medium">활동 자료</span>
                    </div>
                    <div className={`w-12 h-0.5 mx-4 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                    <div className={`flex items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 3 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>3</div>
                        <span className="ml-2 font-medium">질문 입력</span>
                    </div>
                </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
                {/* 1단계: 기본 정보 */}
                {currentStep === 1 && (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="routineType" className="block text-sm font-medium text-gray-700">
                                사고루틴 선택 <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="routineType"
                                required
                                value={formData.thinking_routine_type}
                                onChange={(e) => onRoutineChange(e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            >
                                <option value="">선택해주세요</option>
                                {thinkingRoutineOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                활동방 제목 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="title"
                                required
                                value={formData.title}
                                onChange={(e) => onUpdate({ title: e.target.value })}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="예: 3학년 1반 미술 감상 수업"
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                설명 (선택사항)
                            </label>
                            <textarea
                                id="description"
                                rows={3}
                                value={formData.description}
                                onChange={(e) => onUpdate({ description: e.target.value })}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="활동에 대한 간단한 설명을 입력하세요"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                참여 방식
                            </label>
                            <div className="flex space-x-4">
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        className="form-radio text-blue-600"
                                        name="participationType"
                                        value="individual"
                                        checked={formData.participation_type === 'individual'}
                                        onChange={(e) => onUpdate({ participation_type: e.target.value as 'individual' | 'team' })}
                                    />
                                    <span className="ml-2">개인 참여</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        className="form-radio text-blue-600"
                                        name="participationType"
                                        value="team"
                                        checked={formData.participation_type === 'team'}
                                        onChange={(e) => onUpdate({ participation_type: e.target.value as 'individual' | 'team' })}
                                    />
                                    <span className="ml-2">모둠 참여</span>
                                </label>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">
                                {formData.participation_type === 'individual'
                                    ? '학생들이 각자 자신의 기기로 참여합니다.'
                                    : '학생들이 모둠별로 하나의 기기를 사용하여 참여합니다.'}
                            </p>
                        </div>
                    </div>
                )}

                {/* 2단계: 활동 자료 설정 */}
                {currentStep === 2 && (
                    <div className="space-y-6">
                        <div className="bg-blue-50 p-4 rounded-md">
                            <h3 className="text-sm font-medium text-blue-800 mb-2">활동 자료 설정 가이드</h3>
                            <p className="text-sm text-blue-700">
                                학생들이 사고루틴 활동을 할 때 참고할 자료를 설정합니다. 이미지, 텍스트, 유튜브 영상 중 하나 이상을 입력해주세요.
                            </p>
                        </div>

                        <div>
                            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
                                이미지 URL (선택사항)
                            </label>
                            <input
                                type="url"
                                id="imageUrl"
                                value={formData.template_content.image_url}
                                onChange={(e) => onTemplateUpdate({ image_url: e.target.value })}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="https://example.com/image.jpg"
                            />
                            {formData.template_content.image_url && (
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500 mb-1">미리보기:</p>
                                    <img
                                        src={formData.template_content.image_url}
                                        alt="Preview"
                                        className="h-40 object-contain border border-gray-200 rounded"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Invalid+Image+URL';
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="textContent" className="block text-sm font-medium text-gray-700">
                                텍스트 내용 (선택사항)
                            </label>
                            <textarea
                                id="textContent"
                                rows={4}
                                value={formData.template_content.text_content}
                                onChange={(e) => onTemplateUpdate({ text_content: e.target.value })}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="학생들이 읽어야 할 텍스트나 지시사항을 입력하세요"
                            />
                        </div>

                        <div>
                            <label htmlFor="youtubeUrl" className="block text-sm font-medium text-gray-700">
                                YouTube 영상 URL (선택사항)
                            </label>
                            <input
                                type="url"
                                id="youtubeUrl"
                                value={formData.template_content.youtube_url}
                                onChange={(e) => onTemplateUpdate({ youtube_url: e.target.value })}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="https://www.youtube.com/watch?v=..."
                            />
                            {formData.template_content.youtube_url && getYouTubeEmbedUrl(formData.template_content.youtube_url) && (
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500 mb-1">미리보기:</p>
                                    <iframe
                                        width="280"
                                        height="157"
                                        src={getYouTubeEmbedUrl(formData.template_content.youtube_url)!}
                                        title="YouTube video player"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="rounded border border-gray-200"
                                    ></iframe>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 3단계: 질문 입력 */}
                {currentStep === 3 && (
                    <div className="space-y-6">
                        <div className="bg-yellow-50 p-4 rounded-md">
                            <h3 className="text-sm font-medium text-yellow-800 mb-2">질문 설정</h3>
                            <p className="text-sm text-yellow-700">
                                선택한 사고루틴({thinkingRoutineOptions.find(o => o.value === formData.thinking_routine_type)?.label})에 맞는 질문을 입력해주세요. 기본 질문이 제공되지만, 수업 내용에 맞게 수정하는 것을 권장합니다.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {/* 첫 번째 질문 */}
                            <div>
                                <label htmlFor="seeQuestion" className="block text-sm font-medium text-gray-700">
                                    {formData.thinking_routine_type === 'see-think-wonder' && '1단계: See 질문'}
                                    {formData.thinking_routine_type === '4c' && '1단계: Connect 질문'}
                                    {formData.thinking_routine_type === 'circle-of-viewpoints' && '1단계: Viewpoints 질문'}
                                    {formData.thinking_routine_type === 'connect-extend-challenge' && '1단계: Connect 질문'}
                                    {formData.thinking_routine_type === 'frayer-model' && '1단계: Definition 질문'}
                                    {formData.thinking_routine_type === 'used-to-think-now-think' && '1단계: Used to Think 질문'}
                                    {formData.thinking_routine_type === 'think-puzzle-explore' && '1단계: Think 질문'}
                                </label>
                                <input
                                    id="seeQuestion"
                                    type="text"
                                    required
                                    value={formData.template_content.see_question}
                                    onChange={(e) => onTemplateUpdate({ see_question: e.target.value })}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="첫 번째 질문을 입력하세요"
                                />
                            </div>

                            {/* 두 번째 질문 */}
                            <div>
                                <label htmlFor="thinkQuestion" className="block text-sm font-medium text-gray-700">
                                    {formData.thinking_routine_type === 'see-think-wonder' && '2단계: Think 질문'}
                                    {formData.thinking_routine_type === '4c' && '2단계: Challenge 질문'}
                                    {formData.thinking_routine_type === 'circle-of-viewpoints' && '2단계: Perspective 질문'}
                                    {formData.thinking_routine_type === 'connect-extend-challenge' && '2단계: Extend 질문'}
                                    {formData.thinking_routine_type === 'frayer-model' && '2단계: Characteristics 질문'}
                                    {formData.thinking_routine_type === 'used-to-think-now-think' && '2단계: Now Think 질문'}
                                    {formData.thinking_routine_type === 'think-puzzle-explore' && '2단계: Puzzle 질문'}
                                </label>
                                <input
                                    id="thinkQuestion"
                                    type="text"
                                    required
                                    value={formData.template_content.think_question}
                                    onChange={(e) => onTemplateUpdate({ think_question: e.target.value })}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="두 번째 질문을 입력하세요"
                                />
                            </div>

                            {/* 세 번째 질문 */}
                            <div>
                                <label htmlFor="wonderQuestion" className="block text-sm font-medium text-gray-700">
                                    {formData.thinking_routine_type === 'see-think-wonder' && '3단계: Wonder 질문'}
                                    {formData.thinking_routine_type === '4c' && '3단계: Concepts 질문'}
                                    {formData.thinking_routine_type === 'circle-of-viewpoints' && '3단계: Questions 질문'}
                                    {formData.thinking_routine_type === 'connect-extend-challenge' && '3단계: Challenge 질문'}
                                    {formData.thinking_routine_type === 'frayer-model' && '3단계: Examples 질문'}
                                    {formData.thinking_routine_type === 'used-to-think-now-think' && '3단계: Why Changed 질문'}
                                    {formData.thinking_routine_type === 'think-puzzle-explore' && '3단계: Explore 질문'}
                                </label>
                                <input
                                    id="wonderQuestion"
                                    type="text"
                                    required
                                    value={formData.template_content.wonder_question}
                                    onChange={(e) => onTemplateUpdate({ wonder_question: e.target.value })}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="세 번째 질문을 입력하세요"
                                />
                            </div>

                            {/* 네 번째 질문 (4C만 해당) */}
                            {formData.thinking_routine_type === '4c' && (
                                <div>
                                    <label htmlFor="fourthQuestion" className="block text-sm font-medium text-gray-700">
                                        4단계: Changes 질문
                                    </label>
                                    <input
                                        id="fourthQuestion"
                                        type="text"
                                        required
                                        value={formData.template_content.fourth_question || ''}
                                        onChange={(e) => onTemplateUpdate({ fourth_question: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="예: 이 내용이 당신이나 다른 사람들에게 어떤 변화를 제안하나요? (Changes)"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 단계별 네비게이션 버튼 */}
                <div className="flex justify-between mt-6">
                    <div>
                        {currentStep > 1 && (
                            <button
                                type="button"
                                onClick={() => onStepChange(currentStep - 1)}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                            >
                                이전
                            </button>
                        )}
                    </div>
                    <div className="flex space-x-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                        >
                            취소
                        </button>
                        {currentStep < 3 ? (
                            <button
                                type="button"
                                onClick={() => {
                                    // 1단계에서는 사고루틴 타입과 제목이 필수
                                    if (currentStep === 1 && (!formData.thinking_routine_type || !formData.title)) {
                                        alert('사고루틴 타입과 활동방 제목을 입력해주세요.');
                                        return;
                                    }
                                    onStepChange(currentStep + 1);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                            >
                                다음
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={loading || !formData.template_content.see_question || !formData.template_content.think_question || !formData.template_content.wonder_question || (formData.thinking_routine_type === '4c' && !formData.template_content.fourth_question)}
                                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200"
                            >
                                {loading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        활동방 생성 중...
                                    </span>
                                ) : (
                                    '생성'
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
};
