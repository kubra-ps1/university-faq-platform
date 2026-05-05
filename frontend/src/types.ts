export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type QuestionStatus = 'pending' | 'answered' | 'rejected';

export interface Category {
  id: string;
  name: string;
  questionCount: number;
}

export interface Question {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorFaculty?: string;
  authorDepartment?: string;
  status: QuestionStatus;
  createdAt: string;
  categoryId?: string;
  answer?: string;
  isSaved?: boolean; // 'İlgilendiklerim' durumu
}

// Chart Data Types
export interface KeywordData {
  name: string;
  value: number;
}

export interface TrafficData {
  day: string;
  questions: number;
}
