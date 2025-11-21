/**
 * 활동방 관련 유틸리티 함수
 */

/**
 * 6자리 숫자 코드 생성
 */
export const generateRoomCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * 사고루틴 타입 라벨 반환
 */
export const getThinkingRoutineLabel = (type: string): string => {
    const labels: { [key: string]: string } = {
        'see-think-wonder': 'See-Think-Wonder (보기-생각하기-궁금하기)',
        '4c': '4C (연결-도전-개념-변화)',
        'circle-of-viewpoints': 'Circle of Viewpoints (관점의 원)',
        'connect-extend-challenge': 'Connect-Extend-Challenge (연결-확장-도전)',
        'frayer-model': 'Frayer Model (프레이어 모델)',
        'used-to-think-now-think': 'I Used to Think... Now I Think... (이전 생각 - 현재 생각)',
        'think-puzzle-explore': 'Think-Puzzle-Explore (생각-퍼즐-탐구)'
    };
    return labels[type] || type;
};

/**
 * YouTube URL을 임베드 URL로 변환
 */
export const getYouTubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : null;
};

/**
 * 사고루틴 옵션 목록
 */
export const thinkingRoutineOptions = [
    { value: 'see-think-wonder', label: 'See-Think-Wonder (보기-생각하기-궁금하기)' },
    { value: '4c', label: '4C (연결-도전-개념-변화)' },
    { value: 'circle-of-viewpoints', label: 'Circle of Viewpoints (관점의 원)' },
    { value: 'connect-extend-challenge', label: 'Connect-Extend-Challenge (연결-확장-도전)' },
    { value: 'frayer-model', label: 'Frayer Model (프레이어 모델)' },
    { value: 'used-to-think-now-think', label: 'I Used to Think... Now I Think... (이전 생각 - 현재 생각)' },
    { value: 'think-puzzle-explore', label: 'Think-Puzzle-Explore (생각-퍼즐-탐구)' }
];
