import { useState, useRef, useEffect } from 'react';

export const useCameraCapture = (onImageCaptured: (file: File) => void) => {
    const [showCameraGuide, setShowCameraGuide] = useState(false);
    const [showCameraModal, setShowCameraModal] = useState(false);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string>('');
    const [hasCameraAccess, setHasCameraAccess] = useState<boolean | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    // 디바이스 감지
    const isMobile = () => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };

    // 카메라 가이드 열기
    const openCameraWithGuide = () => {
        setShowCameraGuide(true);
    };

    // 카메라 시작
    const startCamera = async () => {
        setShowCameraGuide(false);

        if (isMobile()) {
            // 모바일에서는 네이티브 카메라 실행
            if (cameraInputRef.current) {
                cameraInputRef.current.click();
            }
        } else {
            // 데스크탑에서는 웹캠 모달 실행
            setShowCameraModal(true);
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                setCameraStream(stream);
                setHasCameraAccess(true);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Camera access error:", err);
                setHasCameraAccess(false);
                alert("카메라 접근 권한이 필요합니다.");
            }
        }
    };

    // 카메라 종료
    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        setShowCameraModal(false);
    };

    // 이미지 캡처
    const captureImage = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageDataUrl = canvas.toDataURL('image/jpeg');
                setCapturedImage(imageDataUrl);
                stopCamera();
                setShowCameraModal(true); // 미리보기 모달 유지
            }
        }
    };

    // 재촬영
    const retakeImage = () => {
        setCapturedImage('');
        startCamera();
    };

    // 캡처 확정
    const confirmCapture = () => {
        if (capturedImage) {
            // Data URL을 File 객체로 변환
            fetch(capturedImage)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
                    onImageCaptured(file);
                    setShowCameraModal(false);
                    setCapturedImage('');
                });
        }
    };

    // 모바일 카메라 입력 처리
    const handleMobileCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onImageCaptured(file);
        }
        setShowCameraGuide(false);
    };

    // 컴포넌트 언마운트 시 스트림 정리
    useEffect(() => {
        return () => {
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [cameraStream]);

    return {
        showCameraGuide,
        showCameraModal,
        cameraStream,
        capturedImage,
        hasCameraAccess,
        videoRef,
        canvasRef,
        cameraInputRef,
        openCameraWithGuide,
        startCamera,
        stopCamera,
        captureImage,
        retakeImage,
        confirmCapture,
        handleMobileCameraCapture,
        setShowCameraGuide,
        setShowCameraModal
    };
};
