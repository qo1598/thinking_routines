import { RoutineConfig } from '../types';

export const ROUTINE_CONFIGS: { [key: string]: RoutineConfig } = {
    'see-think-wonder': {
        name: 'See-Think-Wonder',
        steps: ['see', 'think', 'wonder'],
        stepLabels: {
            see: { title: 'See', subtitle: '보기', color: 'bg-blue-500' },
            think: { title: 'Think', subtitle: '생각하기', color: 'bg-green-500' },
            wonder: { title: 'Wonder', subtitle: '궁금하기', color: 'bg-purple-500' }
        },
        defaultQuestions: {
            see: '이 자료에서 무엇을 보았나요?',
            think: '이것에 대해 어떻게 생각하나요?',
            wonder: '이것에 대해 무엇이 궁금한가요?'
        }
    },
    '4c': {
        name: '4C',
        steps: ['see', 'think', 'wonder', 'fourth_step'],
        stepLabels: {
            see: { title: 'Connect', subtitle: '연결하기', color: 'bg-blue-500' },
            think: { title: 'Challenge', subtitle: '도전하기', color: 'bg-red-500' },
            wonder: { title: 'Concepts', subtitle: '개념 파악', color: 'bg-green-500' },
            fourth_step: { title: 'Changes', subtitle: '변화 제안', color: 'bg-purple-500' }
        },
        defaultQuestions: {
            see: '이 내용이 이미 알고 있는 것과 어떻게 연결되나요?',
            think: '이 내용에서 어떤 아이디어나 가정에 도전하고 싶나요?',
            wonder: '이 내용에서 중요하다고 생각하는 핵심 개념은 무엇인가요?',
            fourth_step: '이 내용이 당신이나 다른 사람들에게 어떤 변화를 제안하나요?'
        }
    },
    'circle-of-viewpoints': {
        name: 'Circle of Viewpoints',
        steps: ['see', 'think', 'wonder'],
        stepLabels: {
            see: { title: 'Viewpoints', subtitle: '관점 탐색', color: 'bg-blue-500' },
            think: { title: 'Perspective', subtitle: '관점 선택', color: 'bg-green-500' },
            wonder: { title: 'Questions', subtitle: '관점별 질문', color: 'bg-purple-500' }
        },
        defaultQuestions: {
            see: '이 주제에 대해 다양한 관점을 가질 수 있는 사람들은 누구인가요?',
            think: '선택한 관점에서 이 주제를 어떻게 바라볼까요?',
            wonder: '이 관점에서 가질 수 있는 질문은 무엇인가요?'
        }
    },
    'connect-extend-challenge': {
        name: 'Connect-Extend-Challenge',
        steps: ['see', 'think', 'wonder'],
        stepLabels: {
            see: { title: 'Connect', subtitle: '연결하기', color: 'bg-blue-500' },
            think: { title: 'Extend', subtitle: '확장하기', color: 'bg-green-500' },
            wonder: { title: 'Challenge', subtitle: '도전하기', color: 'bg-red-500' }
        },
        defaultQuestions: {
            see: '이 내용이 이미 알고 있는 것과 어떻게 연결되나요?',
            think: '이 내용이 당신의 생각을 어떻게 확장시켰나요?',
            wonder: '이 내용에서 어떤 것이 당신에게 도전이 되나요?'
        }
    },
    'frayer-model': {
        name: 'Frayer Model',
        steps: ['see', 'think', 'wonder'],
        stepLabels: {
            see: { title: 'Definition', subtitle: '정의', color: 'bg-blue-500' },
            think: { title: 'Characteristics', subtitle: '특징', color: 'bg-green-500' },
            wonder: { title: 'Examples', subtitle: '예시와 반례', color: 'bg-purple-500' }
        },
        defaultQuestions: {
            see: '이 개념을 어떻게 정의하겠나요?',
            think: '이 개념의 주요 특징은 무엇인가요?',
            wonder: '이 개념의 예시와 반례는 무엇인가요?'
        }
    },
    'used-to-think-now-think': {
        name: 'I Used to Think... Now I Think...',
        steps: ['see', 'think', 'wonder'],
        stepLabels: {
            see: { title: 'Used to Think', subtitle: '이전 생각', color: 'bg-blue-500' },
            think: { title: 'Now Think', subtitle: '현재 생각', color: 'bg-green-500' },
            wonder: { title: 'Why Changed', subtitle: '변화 이유', color: 'bg-purple-500' }
        },
        defaultQuestions: {
            see: '이 주제에 대해 이전에 어떻게 생각했나요?',
            think: '지금은 어떻게 생각하나요?',
            wonder: '생각이 바뀐 이유는 무엇인가요?'
        }
    },
    'think-puzzle-explore': {
        name: 'Think-Puzzle-Explore',
        steps: ['see', 'think', 'wonder'],
        stepLabels: {
            see: { title: 'Think', subtitle: '생각하기', color: 'bg-blue-500' },
            think: { title: 'Puzzle', subtitle: '퍼즐', color: 'bg-yellow-500' },
            wonder: { title: 'Explore', subtitle: '탐구하기', color: 'bg-green-500' }
        },
        defaultQuestions: {
            see: '이 주제에 대해 무엇을 알고 있다고 생각하나요?',
            think: '무엇이 퍼즐이나 의문점인가요?',
            wonder: '이 퍼즐을 어떻게 탐구해보고 싶나요?'
        }
    }
};
