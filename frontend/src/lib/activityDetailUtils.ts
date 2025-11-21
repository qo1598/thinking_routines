/**
 * 학생 활동 상세 페이지 유틸리티 함수
 */

/**
 * 날짜를 한국어 형식으로 포맷팅
 */
export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * 사고루틴 타입 라벨 반환
 */
export const getRoutineTypeLabel = (routineType: string): string => {
    const labels: { [key: string]: string } = {
        'see-think-wonder': 'See-Think-Wonder',
        '4c': '4C',
        'circle-of-viewpoints': '관점의 원',
        'connect-extend-challenge': 'Connect-Extend-Challenge',
        'frayer-model': '프레이어 모델',
        'used-to-think-now-think': '이전-현재 생각',
        'think-puzzle-explore': 'Think-Puzzle-Explore'
    };
    return labels[routineType] || routineType;
};

/**
 * URL 검색 파라미터를 유지하며 포트폴리오로 이동하는 URL 생성
 */
export const getBackToPortfolioUrl = (): string => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasSearchParams = urlParams.toString();

    if (hasSearchParams) {
        return `/teacher/portfolio?${hasSearchParams}`;
    }
    return '/teacher/portfolio';
};
