import { getApiBase } from '../../services/api';

export interface AcademyCourseSummary {
  id: string;
  slug: string;
  title: string;
  level: string;
  level_name: string;
  description: string;
  estimated_hours: number;
  lesson_count: number;
  completed_lessons: number;
  progress_percent: number;
  exam_unlocked: boolean;
  completed: boolean;
  latest_exam: { score: number; passed: boolean; submitted_at: string } | null;
  certificate: { id: string; student_name: string; score: number; issued_at: string } | null;
  lessons: AcademyLessonSummary[];
}

export interface AcademyLessonSummary {
  id: string;
  slug: string;
  order: number;
  title: string;
  duration_minutes: number;
  completed: boolean;
  lab_kind?: string | null;
}

export interface AcademyQuestion {
  id: string;
  topic: string;
  question: string;
  options: { id: string; text: string }[];
  answered_option?: string;
  correct_option?: string;
  correct?: boolean;
  explanation?: string;
}

export interface AcademyLesson extends AcademyLessonSummary {
  course_id: string;
  objectives: string[];
  sections: { heading: string; body: string }[];
  quick_checks: AcademyQuestion[];
  video_url?: string | null;
}

export interface ExamAttempt {
  id: string;
  course_id: string;
  started_at: string;
  expires_at: string;
  duration_minutes: number;
  question_count: number;
  answers: Record<string, string>;
  questions: AcademyQuestion[];
}

export interface ExamResult {
  attempt_id: string;
  course_id: string;
  score: number;
  correct_count: number;
  question_count: number;
  passed: boolean;
  pass_score: number;
  expired: boolean;
  review: {
    question_id: string;
    lesson: string;
    topic: string;
    question: string;
    selected_text?: string;
    correct_text: string;
    correct: boolean;
    explanation: string;
  }[];
  topics_to_review: { topic: string; correct: number; total: number }[];
}

export interface AcademyDashboardData {
  student_name: string;
  current_level: string;
  overall_progress: number;
  completed_lessons: number;
  total_lessons: number;
  completed_courses: number;
  current_course: string | null;
  average_exam_score: number | null;
  exam_attempts: { course_title: string; score: number; passed: boolean; submitted_at: string }[];
  learning_streak: number;
  recommended_lesson: { course_id: string; course_slug: string; lesson_id: string; lesson_title: string; course_title: string } | null;
  courses: AcademyCourseSummary[];
  certificates: { id: string; course_id: string; student_name: string; score: number; issued_at: string }[];
  achievements: { key: string; earned_at: string }[];
  activity: { date: string; completed: number }[];
}

const API_BASE = getApiBase();

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const academyApi = {
  dashboard: () => request<AcademyDashboardData>('/academy/dashboard'),
  course: (courseId: string) => request<AcademyCourseSummary>(`/academy/courses/${courseId}`),
  lesson: (courseId: string, lessonId: string) => request<AcademyLesson>(`/academy/courses/${courseId}/lessons/${lessonId}`),
  saveName: (student_name: string) => request<{ student_name: string }>('/academy/profile', { method: 'PUT', body: JSON.stringify({ student_name }) }),
  completeLesson: (lessonId: string) => request<{ completed: boolean }>(`/academy/lessons/${lessonId}/complete`, { method: 'POST' }),
  answerQuickCheck: (lessonId: string, questionId: string, option_id: string) =>
    request<{ correct: boolean; correct_option: string; explanation: string }>(`/academy/lessons/${lessonId}/quick-checks/${questionId}`, { method: 'POST', body: JSON.stringify({ option_id }) }),
  startExam: (courseId: string) => request<ExamAttempt>(`/academy/courses/${courseId}/exams/start`, { method: 'POST' }),
  activeExam: () => request<ExamAttempt | null>('/academy/exams/active'),
  exam: (attemptId: string) => request<ExamAttempt | ExamResult>(`/academy/exams/${attemptId}`),
  saveAnswers: (attemptId: string, answers: Record<string, string>) =>
    request<{ saved: boolean }>(`/academy/exams/${attemptId}/answers`, { method: 'PUT', body: JSON.stringify({ answers }) }),
  submitExam: (attemptId: string, answers: Record<string, string>) =>
    request<ExamResult>(`/academy/exams/${attemptId}/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),
  certificate: (certificateId: string) => request<{ id: string; certificate_id: string; student_name: string; course_title: string; level_name: string; score: number; issued_at: string }>(`/academy/certificates/${certificateId}`),
};

