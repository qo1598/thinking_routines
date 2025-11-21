/**
 * 포트폴리오 인쇄 및 PDF 생성 커스텀 훅
 */

import { ActivityRoom, StudentInfo, generatePrintContent } from '../lib/portfolioUtils';

export const usePortfolioPrint = () => {

    const handlePrint = (selectedActivities: ActivityRoom[], studentInfo: StudentInfo | null) => {
        if (selectedActivities.length === 0) {
            alert('인쇄할 활동을 선택해주세요.');
            return;
        }

        const printContent = generatePrintContent(selectedActivities, studentInfo);
        const printWindow = window.open('', '_blank');

        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.focus();

            // 문서 로드 완료 후 인쇄
            printWindow.onload = () => {
                printWindow.print();
            };
        }
    };

    const handleSavePDF = (selectedActivities: ActivityRoom[], studentInfo: StudentInfo | null) => {
        if (selectedActivities.length === 0) {
            alert('PDF로 저장할 활동을 선택해주세요.');
            return;
        }

        const printContent = generatePrintContent(selectedActivities, studentInfo);
        const printWindow = window.open('', '_blank');

        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.focus();

            // 문서 로드 완료 후 인쇄 대화상자 표시 (PDF로 저장 옵션 포함)
            printWindow.onload = () => {
                printWindow.print();
            };

            alert('인쇄 대화상자에서 "PDF로 저장" 옵션을 선택하세요.');
        }
    };

    return {
        handlePrint,
        handleSavePDF
    };
};
