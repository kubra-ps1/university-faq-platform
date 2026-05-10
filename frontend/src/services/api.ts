import axios from 'axios';
import type { LoginCredentials, RegisterRequest, AuthResponse, RegisterResponse } from '../types/auth';
import type { Question, Category } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

const apiInstance = axios.create({
  baseURL: API_BASE_URL,
});

apiInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- MAPPERS ---
// Backend expects specific schema, frontend expects different casing/names
// This adapter pattern minimizes refactoring in UI components.

const mapCategory = (data: unknown): Category => {
  const d = data as Record<string, unknown>;
  return {
    id: String(d.id),
    name: String(d.name),
    questionCount: Number(d.total_questions) || 0,
  };
};

const mapQuestion = (data: unknown): Question => {
  const d = data as Record<string, unknown>;
  const authorIdStr = d.user_id ? String(d.user_id) : 'unknown';
  
  return {
    id: String(d.id),
    text: String(d.question_text),
    authorId: authorIdStr,
    authorName: d.student_name ? String(d.student_name) : 'Öğrenci',
    authorFaculty: d.faculty ? String(d.faculty) : undefined,
    authorDepartment: d.department ? String(d.department) : undefined,
    status: d.status as 'pending' | 'answered' | 'rejected',
    createdAt: String(d.date || d.created_at || new Date().toISOString()),
    categoryId: d.category_id ? String(d.category_id) : (d.category ? String(d.category) : undefined),
    answer: d.answer_text ? String(d.answer_text) : undefined,
    favoriteCount: Number(d.favorite_count) || 0,
  };
};

// --- AUTHENTICATION ---
export const login = async (credential: LoginCredentials): Promise<AuthResponse> => {
  try {
    const formData = new URLSearchParams();
    formData.append('username', credential.email);
    formData.append('password', credential.password);

    const res = await apiInstance.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    localStorage.setItem('token', res.data.access_token);
    
    return {
      jwt: res.data.access_token,
      user: { 
        id: res.data.user.id, 
        fullName: res.data.user.full_name, 
        email: res.data.user.email, 
        role: res.data.user.role 
      }
    };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string | any[] } } };
    const detail = err.response?.data?.detail;
    let errorMessage = 'Giriş başarısız. Lütfen bilgilerinizi kontrol ediniz.';
    
    if (typeof detail === 'string') {
      errorMessage = detail;
    } else if (Array.isArray(detail)) {
      errorMessage = detail.map(d => d.msg).join(', ');
    }
    
    throw new Error(errorMessage, { cause: error });
  }
};

export const register = async (registerData: RegisterRequest): Promise<RegisterResponse> => {
  try {
    const payload = {
      email: registerData.email,
      password: registerData.password,
      full_name: registerData.fullName,
      faculty: registerData.faculty,
      department: registerData.department,
      role: "student"
    };
    
    await apiInstance.post('/auth/register', payload);
    return { message: "Başarılı bir şekilde kayıt oldunuz." };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: { detail?: string } } };
    if (err.response?.status === 409) {
      throw new Error(err.response.data?.detail || 'Bu eposta sistemde zaten kayıtlı.', { cause: error });
    }
    throw new Error(err.response?.data?.detail || 'Kayıt işlemi sırasında bir hata oluştu.', { cause: error });
  }
};

// --- API METHODS ---
export const api = {
  // Dashboard & Stats
  getDashboardStats: async () => {
    const res = await apiInstance.get('/admin/stats');
    return res.data;
  },
  
  // Public Data
  getCategories: async (): Promise<Category[]> => {
    const res = await apiInstance.get('/categories');
    return res.data.map(mapCategory);
  },
  getQuestions: async (): Promise<Question[]> => {
    const res = await apiInstance.get('/faq/all');
    return res.data.flatMap((c: any) => c.questions.map(mapQuestion));
  },
  getQuestionsByCategory: async (categoryId: string): Promise<Question[]> => {
    const res = await apiInstance.get('/faq/all');
    const categoryData = res.data.find((c: any) => String(c.id) === categoryId);
    if (!categoryData) return [];
    return categoryData.questions.map(mapQuestion);
  },
  searchQuestions: async (q: string) => {
    const res = await apiInstance.get('/faq/all');
    const allQuestions = res.data.flatMap((c: any) => c.questions.map(mapQuestion));
    const lowerQ = q.toLowerCase();
    const filtered = allQuestions.filter((question: Question) => 
      question.text.toLowerCase().includes(lowerQ) || 
      (question.answer && question.answer.toLowerCase().includes(lowerQ))
    );
    return { type: 'exact' as const, data: filtered };
  },

  // Admin Routes
  getPendingQuestions: async (): Promise<Question[]> => {
    const res = await apiInstance.get('/admin/pending');
    return res.data.map(mapQuestion);
  },
  getAnsweredQuestions: async (): Promise<Question[]> => {
    const res = await apiInstance.get('/admin/faq');
    return res.data.map(mapQuestion);
  },
  getAllPoolQuestions: async (): Promise<Question[]> => {
    const res = await apiInstance.get('/admin/pool');
    return res.data.map(mapQuestion);
  },
  answerQuestion: async (id: string, answerText: string, _categoryId?: string) => {
    const res = await apiInstance.patch(`/admin/questions/${id}/answer`, { answer_text: answerText });
    return mapQuestion(res.data);
  },
  rejectQuestion: async (id: string, reason?: string, _categoryId?: string) => {
    const res = await apiInstance.patch(`/admin/questions/${id}/reject`, { reason });
    return mapQuestion(res.data);
  },
  deleteQuestionAsAdmin: async (id: string) => {
    await apiInstance.delete(`/admin/questions/${id}`);
  },
  createQuestionAsAdmin: async (questionText: string, answerText: string, categoryId: string) => {
    const payload = {
      question_text: questionText,
      category_id: parseInt(categoryId, 10),
      answer_text: answerText
    };
    const res = await apiInstance.post('/admin/faq', payload);
    return mapQuestion(res.data);
  },
  editAnsweredQuestion: async (id: string, questionText: string, answerText: string) => {
    // If backend doesn't require categoryId for edit, we just send what we have or fetch it first.
    // Assuming backend takes optional fields in PUT/PATCH for edit
    const payload = {
      question_text: questionText,
      answer_text: answerText
    };
    const res = await apiInstance.put(`/admin/questions/${id}`, payload);
    return mapQuestion(res.data);
  },
  
  // Category Admin Methods
  getCategoryCounts: async (): Promise<Record<string, number>> => {
    const res = await apiInstance.get('/categories/counts');
    const counts: Record<string, number> = {};
    res.data.forEach((item: any) => {
      counts[String(item.category_id)] = item.count;
    });
    return counts;
  },

  addCategory: async (name: string): Promise<Category> => {
    const res = await apiInstance.post('/categories', { name });
    return mapCategory(res.data);
  },
  updateCategory: async (id: string, name: string) => {
    const res = await apiInstance.put(`/categories/${id}`, { name });
    return mapCategory(res.data);
  },
  deleteCategory: async (id: string) => {
    await apiInstance.delete(`/categories/${id}`);
  },

  // Student Methods
  getStudentQuestions: async (): Promise<Question[]> => {
    // User ID is inferred from JWT
    const res = await apiInstance.get('/my-questions');
    return res.data.map(mapQuestion);
  },
  askQuestion: async (text: string, categoryId?: string) => {
    const payload = {
      question_text: text,
      ...(categoryId ? { category_id: parseInt(categoryId, 10) } : {})
    };
    const res = await apiInstance.post('/questions', payload);
    return { success: true, message: 'Sorunuz başarıyla gönderildi.', data: mapQuestion(res.data) };
  },
  deleteMyQuestion: async (id: string) => {
    await apiInstance.delete(`/questions/${id}`);
  },
  getStudentInterests: async (): Promise<Question[]> => {
    const res = await apiInstance.get('/saved-items');
    // Saved items return a slightly different schema or question objects? 
    // Usually it returns SavedItemOut with question details nested or joined.
    // Let's assume backend returns a list of questions directly if mapped, but if it returns SavedItemOut, we need to map differently.
    // We will adjust this if there's an issue.
    // Let's check SavedItemOut
    return res.data.map((item: unknown) => {
      const d = item as { question?: unknown };
      return mapQuestion(d.question || item);
    });
  },
  removeInterest: async (id: string) => {
    await apiInstance.delete(`/saved-items/${id}`);
  },
  
  // Auth & Profile
  getUserProfile: async () => {
    const res = await apiInstance.get('/auth/me');
    return res.data;
  },
  updateProfile: async () => {}, // Not implemented in backend yet
  changePassword: async (currentPassword: string, newPassword: string) => {
    await apiInstance.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    });
  },

  // Misc Fake Methods
  getKeywordData: async () => [],
  getTrafficData: async () => [],
};
