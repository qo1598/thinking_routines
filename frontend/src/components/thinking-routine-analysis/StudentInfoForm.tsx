import React from 'react';

interface StudentInfoFormProps {
    studentInfo: {
        grade: string;
        class: string;
        number: string;
        name: string;
    };
    isTeamActivity: boolean;
    teamName: string;
    onStudentInfoChange: (field: keyof StudentInfoFormProps['studentInfo'], value: string) => void;
    onTeamActivityChange: (isTeam: boolean) => void;
    onTeamNameChange: (name: string) => void;
}

export const StudentInfoForm: React.FC<StudentInfoFormProps> = ({
    studentInfo,
    isTeamActivity,
    teamName,
    onStudentInfoChange,
    onTeamActivityChange,
    onTeamNameChange
}) => {
    return (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">학생 정보 입력</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">학년</label>
                    <select
                        value={studentInfo.grade}
                        onChange={(e) => onStudentInfoChange('grade', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                        <option value="">선택</option>
                        {[1, 2, 3, 4, 5, 6].map(g => (
                            <option key={g} value={`${g}학년`}>{g}학년</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">반</label>
                    <select
                        value={studentInfo.class}
                        onChange={(e) => onStudentInfoChange('class', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                        <option value="">선택</option>
                        {Array.from({ length: 15 }, (_, i) => i + 1).map(c => (
                            <option key={c} value={c.toString()}>{c}반</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">번호</label>
                    <select
                        value={studentInfo.number}
                        onChange={(e) => onStudentInfoChange('number', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                        <option value="">선택</option>
                        {Array.from({ length: 35 }, (_, i) => i + 1).map(n => (
                            <option key={n} value={n.toString()}>{n}번</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                    <input
                        type="text"
                        value={studentInfo.name}
                        onChange={(e) => onStudentInfoChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="이름 입력"
                    />
                </div>
            </div>

            <div className="mb-4">
                <label className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={isTeamActivity}
                        onChange={(e) => onTeamActivityChange(e.target.checked)}
                        className="rounded text-blue-600"
                    />
                    <span className="text-sm text-gray-700">모둠 활동인가요?</span>
                </label>
            </div>

            {isTeamActivity && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">모둠명</label>
                    <input
                        type="text"
                        value={teamName}
                        onChange={(e) => onTeamNameChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="모둠 이름 입력"
                    />
                </div>
            )}
        </div>
    );
};
