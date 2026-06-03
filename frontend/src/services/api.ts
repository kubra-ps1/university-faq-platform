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


export const api = {
  
  getDashboardStats: async () => {
    const res = await apiInstance.get('/admin/stats');
    return res.data;
  },
  
 
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
    const res = await apiInstance.get(`/faq/search?q=${encodeURIComponent(q)}`);
    const mappedData = res.data.data.map(mapQuestion);
    return { type: res.data.type, data: mappedData };
  },

  
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
  answerQuestion: async (id: string, answerText: string, categoryId?: string, normalizedText?: string) => {
    const payload: any = { answer_text: answerText };
    if (categoryId) payload.category_id = parseInt(categoryId, 10);
    if (normalizedText) payload.normalized_text = normalizedText;
    const res = await apiInstance.patch(`/admin/questions/${id}/answer`, payload);
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
  
    const payload = {
      question_text: questionText,
      answer_text: answerText
    };
    const res = await apiInstance.put(`/admin/questions/${id}`, payload);
    return mapQuestion(res.data);
  },
  prepareQuestionForAdmin: async (id: string) => {
    const res = await apiInstance.get(`/admin/ai/prepare/${id}`);
    return res.data;
  },
  
  
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

 
  getStudentQuestions: async (): Promise<Question[]> => {
    const res = await apiInstance.get('/my-questions');
    return res.data.map(mapQuestion);
  },
  askQuestion: async (text: string, categoryId?: string) => {
    try {
      const payload = {
        question_text: text,
        ...(categoryId ? { category_id: parseInt(categoryId, 10) } : {})
      };
      const res = await apiInstance.post('/questions', payload);
      return { success: true, message: 'Sorunuz başarıyla gönderildi ve havuza eklendi! 🎉', data: mapQuestion(res.data) };
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { detail?: string } } };
      if (err.response?.status === 400) {
        return { 
          success: false, 
          message: err.response.data?.detail || 'Sorunuz güvenlik politikasına uymadığı için gönderilemedi.',
          rejected: true
        };
      }
      return { success: false, message: 'Bir hata oluştu. Lütfen tekrar deneyin.' };
    }
  },
  deleteMyQuestion: async (id: string) => {
    await apiInstance.delete(`/questions/${id}`);
  },
  getStudentInterests: async (): Promise<Question[]> => {
    const res = await apiInstance.get('/saved-items');
  
    return res.data.map((item: unknown) => {
      const d = item as { question?: unknown };
      return mapQuestion(d.question || item);
    });
  },
  saveInterest: async (id: string) => {
    await apiInstance.post(`/saved-items/${id}`);
  },
  removeInterest: async (id: string) => {
    await apiInstance.delete(`/saved-items/${id}`);
  },
  
  
  getUserProfile: async () => {
    const res = await apiInstance.get('/auth/me');
    return res.data;
  },
  updateProfile: async () => {}, 
  changePassword: async (currentPassword: string, newPassword: string) => {
    await apiInstance.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    });
  },

  
  getKeywordData: async () => [],
  getTrafficData: async () => [],
};
