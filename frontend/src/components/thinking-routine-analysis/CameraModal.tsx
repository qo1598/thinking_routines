import React, { RefObject } from 'react';

interface CameraModalProps {
    isOpen: boolean;
    videoRef: RefObject<HTMLVideoElement>;
    canvasRef: RefObject<HTMLCanvasElement>;
    capturedImage: string;
    onClose: () => void;
    onCapture: () => void;
    onRetake: () => void;
    onConfirm: () => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
    isOpen,
    videoRef,
    canvasRef,
    capturedImage,
    onClose,
    onCapture,
    onRetake,
    onConfirm
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">활동지 촬영</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
                    {!capturedImage ? (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <img
                            src={capturedImage}
                            alt="Captured"
                            className="w-full h-full object-contain"
                        />
                    )}
                    <canvas ref={canvasRef} className="hidden" />

                    {/* 가이드라인 오버레이 */}
                    {!capturedImage && (
                        <div className="absolute inset-0 pointer-events-none border-2 border-white border-opacity-30 m-8 rounded-lg">
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white"></div>
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white"></div>
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white"></div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <p className="text-white text-opacity-70 text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
                                    활동지가 가이드라인 안에 들어오도록 맞춰주세요
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 flex justify-center space-x-4 bg-gray-50">
                    {!capturedImage ? (
                        <button
                            onClick={onCapture}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-medium flex items-center shadow-lg transform transition hover:scale-105"
                        >
                            <div className="w-4 h-4 bg-white rounded-full mr-2 animate-pulse"></div>
                            촬영하기
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={onRetake}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-medium"
                            >
                                다시 찍기
                            </button>
                            <button
                                onClick={onConfirm}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                            >
                                이 사진 사용하기
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
