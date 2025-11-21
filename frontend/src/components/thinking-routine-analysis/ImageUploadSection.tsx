import React, { RefObject } from 'react';

interface ImageUploadSectionProps {
    uploadedImage: File | null;
    imagePreview: string;
    fileInputRef: RefObject<HTMLInputElement>;
    onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onCancelImage: () => void;
    onTriggerFileInput: () => void;
    onCameraClick: () => void;
}

export const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
    uploadedImage,
    imagePreview,
    fileInputRef,
    onImageUpload,
    onCancelImage,
    onTriggerFileInput,
    onCameraClick
}) => {
    return (
        <div className="mb-8">
            <input
                type="file"
                accept="image/*"
                onChange={onImageUpload}
                ref={fileInputRef}
                className="hidden"
            />

            {!uploadedImage ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 파일 업로드 버튼 */}
                    <div
                        onClick={onTriggerFileInput}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer flex flex-col items-center justify-center h-64"
                    >
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">이미지 업로드</h3>
                        <p className="text-gray-500 text-sm">클릭하여 활동지 사진을 선택하세요</p>
                    </div>

                    {/* 카메라 촬영 버튼 */}
                    <div
                        onClick={onCameraClick}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-purple-500 hover:bg-purple-50 transition-colors cursor-pointer flex flex-col items-center justify-center h-64"
                    >
                        <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">카메라 촬영</h3>
                        <p className="text-gray-500 text-sm">직접 활동지를 촬영하여 업로드하세요</p>
                    </div>
                </div>
            ) : (
                <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                    <img src={imagePreview} alt="Uploaded" className="w-full h-auto max-h-[600px] object-contain mx-auto" />
                    <button
                        onClick={onCancelImage}
                        className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 text-gray-600"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
};
