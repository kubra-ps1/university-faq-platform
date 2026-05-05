import { mockCategories, mockQuestions, mockKeywordData, mockTrafficData } from './mockData';
import type { Question, Category, KeywordData, TrafficData } from '../types';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // Public & Search
  getCategories: async (): Promise<Category[]> => {
    await delay(300);
    return [...mockCategories];
  },
  
  getQuestionsByCategory: async (categoryId: string): Promise<Question[]> => {
    await delay(400);
    return mockQuestions.filter(q => q.categoryId === categoryId && q.status === 'answered');
  },

  searchQuestions: async (query: string): Promise<{ type: 'exact' | 'similar' | 'none', data: Question[] }> => {
    await delay(600);
    const q = query.toLowerCase();
    
    // 1) Find answered exact match (simulated)
    const exactMatch = mockQuestions.find(
      mq => mq.status === 'answered' && mq.text.toLowerCase().includes(q)
    );
    if (exactMatch) {
      return { type: 'exact', data: [exactMatch] };
    }

    // 2) Find pending similar questions
    const similar = mockQuestions.filter(
      mq => mq.status === 'pending' && mq.text.toLowerCase().includes(q)
    );
    if (similar.length > 0) {
      // Sort by favorites descending
      return { type: 'similar', data: similar.sort((a, b) => b.favorites - a.favorites) };
    }

    // 3) None found
    return { type: 'none', data: [] };
  },

  // Student Actions
  askQuestion: async (text: string, _authorId: string, _authorName: string): Promise<{ success: boolean, message: string }> => {
    await delay(800);
    
    // AI Mock Logic: Reject inappropriate questions
    const inappropriateWords = ['aptal', 'kötü', 'saçma'];
    const isRude = inappropriateWords.some(word => text.toLowerCase().includes(word));
    
    if (isRude) {
      return { success: false, message: 'Sorunuz uygun olmayan ifadeler içeriyor. Lütfen daha uygun bir dille tekrar sorunuz.' };
    }
    
    return { success: true, message: 'Sorunuz başarıyla havuza eklendi.' };
  },

  toggleFavorite: async (_questionId: string): Promise<boolean> => {
    await delay(200);
    return true; // simulated success
  },

  toggleSave: async (_questionId: string): Promise<boolean> => {
    await delay(200);
    return true; // simulated success
  },

  getStudentQuestions: async (studentId: string): Promise<Question[]> => {
    await delay(400);
    return mockQuestions.filter(q => q.authorId === studentId);
  },

  getStudentInterests: async (): Promise<Question[]> => {
    await delay(400);
    return mockQuestions.filter(q => q.isFavoritedByMe || q.isSavedByMe);
  },

  deleteMyQuestion: async (_questionId: string): Promise<boolean> => {
    await delay(300);
    return true;
  },

  // Admin Actions
  getDashboardStats: async () => {
    await delay(400);
    return {
      totalQuestions: 1250,
      pendingQuestions: 85,
      totalStudents: 4500
    };
  },

  getKeywordData: async (): Promise<KeywordData[]> => {
    await delay(300);
    return mockKeywordData;
  },

  getTrafficData: async (): Promise<TrafficData[]> => {
    await delay(300);
    return mockTrafficData;
  },

  getPendingQuestions: async (): Promise<Question[]> => {
    await delay(500);
    // Return pending questions with > 10 favorites
    return mockQuestions.filter(q => q.status === 'pending' && q.favorites > 10);
  },

  getAllPoolQuestions: async (): Promise<Question[]> => {
    await delay(400);
    return mockQuestions.filter(q => q.status === 'pending');
  },

  getAnsweredQuestions: async (): Promise<Question[]> => {
    await delay(400);
    return mockQuestions.filter(q => q.status === 'answered');
  },

  editAnsweredQuestion: async (_id: string, _text: string, _answer: string): Promise<boolean> => {
    await delay(400);
    return true;
  },

  answerQuestion: async (_questionId: string, _answer: string, _categoryId: string): Promise<boolean> => {
    await delay(600);
    return true;
  },

  deleteQuestionAsAdmin: async (_questionId: string): Promise<boolean> => {
    await delay(300);
    return true;
  },
  
  createQuestionAsAdmin: async (_text: string, _answer: string, _categoryId: string): Promise<boolean> => {
    await delay(500);
    return true;
  }
};