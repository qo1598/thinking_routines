export interface StudentInfo {
  grade: string;
  name: string;
  class: string;
  number: string;
  groupName?: string | null;
  roomId: string;
  roomCode: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
}

export interface ActivityRoom {
  id: string;
  title: string;
  description: string;
  room_code: string;
  thinking_routine_type: string;
  participation_type?: string;
  status: string;
  created_at: string;
  teacher_id: string;
  response_count?: number;
}

export interface NewRoomForm {
  title: string;
  description: string;
  thinking_routine_type: string;
  participation_type: string;
  template_content: {
    image_url: string;
    text_content: string;
    youtube_url: string;
    see_question: string;
    think_question: string;
    wonder_question: string;
    fourth_question?: string;
  };
}

export interface StudentResponse {
  id: string;
  student_grade?: string;
  student_name: string;
  student_class?: string;
  student_number?: number;
  team_name?: string;
  student_id: string;
  response_data: any;
  submitted_at: string;
}

export interface RoutineTemplate {
  id: string;
  room_id: string;
  routine_type: string;
  content: {
    image_url?: string;
    text_content?: string;
    youtube_url?: string;
    see_question?: string;
    think_question?: string;
    wonder_question?: string;
    fourth_question?: string;
  };
}

export interface ThinkingRoutineResponse {
  see: string;
  think: string;
  wonder: string;
  fourth_step?: string;
  [key: string]: string | undefined;
}

export interface StepLabel {
  title: string;
  subtitle: string;
  color: string;
}

export interface RoutineConfig {
  name: string;
  steps: string[];
  stepLabels: {
    [key: string]: StepLabel;
  };
  defaultQuestions: {
    [key: string]: string;
  };
}

export interface ParsedAnalysis {
  stepByStep: string;
  comprehensive: string;
  educational: string;
  individualSteps: { [key: string]: string };
}

export interface AnalysisResult {
  extractedText: string;
  analysis: string;
  confidence: number;
}
