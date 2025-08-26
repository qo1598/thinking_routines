import React from 'react';
import { routineStepLabels, routineDescriptions, mapResponseToRoutineSteps } from '../lib/thinkingRoutineUtils';

interface StudentResponseSectionProps {
  response: any;
  room: any;
  template: any;
}

const StudentResponseSection: React.FC<StudentResponseSectionProps> = ({ response, room, template }) => {
  if (!response || !room) return null;

  const routineType = room.thinking_routine_type || 'see-think-wonder';
  const stepLabels = routineStepLabels[routineType] || routineStepLabels['see-think-wonder'];
  const descriptions = routineDescriptions[routineType] || {};
  
  // 응답 데이터를 사고루틴 유형에 맞게 매핑
  const mappedResponse = mapResponseToRoutineSteps(response.response_data, routineType);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      {/* 헤더 정보 */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">학생 응답</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <span className="text-sm font-medium text-gray-700">학생명:</span>
            <span className="ml-2 text-gray-900 font-semibold">{response.student_name}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">제출일:</span>
            <span className="ml-2 text-gray-900">
              {new Date(response.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">사고루틴:</span>
            <span className="ml-2 text-blue-600 font-medium">{stepLabels ? Object.keys(stepLabels).length + '단계' : ''}</span>
          </div>
        </div>
      </div>

      {/* 활동방 정보 */}
      <div className="mb-6 p-4 border-l-4 border-blue-500 bg-blue-50">
        <h3 className="font-medium text-blue-900 mb-2">교사 제공 자료</h3>
        <div className="space-y-2">
          <div>
            <span className="text-sm font-medium text-blue-800">활동 제목:</span>
            <span className="ml-2 text-blue-900">{room.title}</span>
          </div>
          {room.description && (
            <div>
              <span className="text-sm font-medium text-blue-800">활동 설명:</span>
              <p className="ml-2 text-blue-900 mt-1">{room.description}</p>
            </div>
          )}
          {template?.content && (
            <div>
              <span className="text-sm font-medium text-blue-800">템플릿 내용:</span>
              <div className="ml-2 mt-1">
                {typeof template.content === 'string' ? (
                  <p className="text-blue-900">{template.content}</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(template.content).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="font-medium text-blue-800">{key}:</span>
                        <span className="ml-1 text-blue-900">{value as string}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 유투브 영상 */}
      {response.image_data && response.image_data.includes('youtube') && (
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">교사 제공 자료</h3>
          <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
            <iframe
              src={response.image_data}
              title="교사 제공 영상"
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* 학생 응답 내용 */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">학생 응답</h3>
        
        {Object.entries(stepLabels).map(([stepKey, stepLabel]) => {
          const responseValue = mappedResponse[stepKey];
          const description = descriptions[stepKey];
          
          if (!responseValue) return null;

          return (
            <div key={stepKey} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-3
                  ${stepKey === 'see' ? 'bg-blue-500' : 
                    stepKey === 'think' ? 'bg-green-500' : 
                    stepKey === 'wonder' ? 'bg-purple-500' : 'bg-orange-500'}
                `}>
                  {stepKey === 'see' ? 'S' : 
                   stepKey === 'think' ? 'T' : 
                   stepKey === 'wonder' ? 'W' : '4'}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{stepLabel}</h3>
                  {description && (
                    <p className="text-sm text-gray-600">{description}</p>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-md p-4">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{responseValue}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 응답 메타데이터 */}
      {response.response_data && Object.keys(response.response_data).length > Object.keys(stepLabels).length && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">추가 정보</h4>
          <div className="space-y-2">
            {Object.entries(response.response_data)
              .filter(([key]) => !Object.keys(stepLabels).includes(key))
              .map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className="font-medium text-gray-700">{key.replace(/_/g, ' ')}:</span>
                  <span className="ml-2 text-gray-600">{value as string}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentResponseSection;
