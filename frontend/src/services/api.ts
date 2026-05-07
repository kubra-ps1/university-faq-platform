import type { LoginCredentials, RegisterRequest, AuthResponse, RegisterResponse } from '../types/auth';

// const API_BASE_URL='http://localhost:8000/api'

// export const login=async(credential:LoginCredentials) : Promise<AuthResponse> =>{
//   const response=await fetch(API_BASE_URL+'/auth/login',{
//     method:'POST',
//     headers:{'Content-Type':'application/json'},
//     body:JSON.stringify(credential)
//   });

//   if(!response.ok){
//     const errorData=await response.json();
//     const errorMessage=errorData.detail || 'Giriş başarısız.Lütfen bilgilerinizi kontrol ediniz.';
//     throw new Error(errorMessage);
//   }
//   const data:AuthResponse=await response.json();
//   return data;
// }

// export const register=async(registerData:RegisterRequest) :Promise<RegisterResponse> =>{
//   const response=await fetch(API_BASE_URL+'/auth/register',{
//     method:'POST',
//     headers:{'Content-Type':'application/json'},
//     body:JSON.stringify(registerData)
//   });

//   if(!response.ok){
//     const errorData=await response.json();

//     if(response.status === 409){
//       throw new Error(errorData.detail || 'Bu eposta sistemde zaten kayıtlı')
//     }


//     if(response.status >= 500){
//       throw new Error('Sistemde geçici bir teknik bir hata yaşanmaktadır.Lütfen daha sonra tekrar deneyiniz.')
//     }

//     throw new Error(errorData.detail || 'Kayıt işlemi sırasında bir hata oluştu.')

//   }

//   const data:RegisterResponse=await response.json();
//   return data;

// }



// ... (importların duracak) ...

/* 
  GERÇEK FETCH KODLARIN BURADA YORUM SATIRINDA DURSUN 
  BACKEND BİTİNCE BUNLARI GERİ AÇACAĞIZ.
*/

// --- GEÇİCİ MOCK (SAHTE) API SERVİSLERİ ---

export const login = async (credential: LoginCredentials): Promise<AuthResponse> => {
  return new Promise((resolve, reject) => {
    // 1.5 saniye bekle (Loading butonunu test etmek için)
    setTimeout(() => {
      // Hata test etmek istersen şifreyi yanlış girince hata fırlatmasını sağlayabilirsin:
      if (credential.password === 'yanlis') {
         return reject(new Error('Şifre yanlış veya e-posta bulunamadı.'));
      }
      
      // Başarılı giriş senaryosu:
      resolve({
        jwt: "fake_jwt_token_123_abc",
        user: { id: 1, fullName: "Test Kullanıcı", email: credential.email, role: "student" }
      });
    }, 1500);
  });
};

export const register = async (registerData: RegisterRequest): Promise<RegisterResponse> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Hata senaryosu testi (Eğer e-posta test@dpu.edu.tr girilirse hata ver)
      if (registerData.email === 'test@dpu.edu.tr') {
         return reject(new Error('Bu e-posta sistemde zaten kayıtlı.'));
      }

      // Başarılı kayıt senaryosu:
      resolve({
        message: "Başarılı bir şekilde kayıt oldunuz."
      });
    }, 1500);
  });
};

import { mockQuestions, mockCategories, mockKeywordData, mockTrafficData } from './mockData';

export const api: any = {
  getDashboardStats: async () => ({ totalQuestions: 150, pendingQuestions: 12, totalStudents: 300 }),
  getKeywordData: async () => mockKeywordData,
  getTrafficData: async () => mockTrafficData,
  getQuestions: async () => mockQuestions,
  getPendingQuestions: async () => mockQuestions.filter((q: any) => q.status === 'pending'),
  getAnsweredQuestions: async () => mockQuestions.filter((q: any) => q.status === 'answered'),
  getAllPoolQuestions: async () => mockQuestions,
  getQuestionsByCategory: async (..._args: any[]) => mockQuestions,
  searchQuestions: async (..._args: any[]) => ({ type: "exact", data: mockQuestions }),
  getStudentQuestions: async (..._args: any[]) => mockQuestions,
  getStudentInterests: async (..._args: any[]) => mockQuestions,
  getCategories: async () => mockCategories,
  approveQuestion: async (..._args: any[]) => {},
  rejectQuestion: async (..._args: any[]) => {},
  deleteQuestion: async (..._args: any[]) => {},
  deleteQuestionAsAdmin: async (..._args: any[]) => {},
  deleteMyQuestion: async (..._args: any[]) => {},
  addCategory: async (..._args: any[]) => {},
  deleteCategory: async (..._args: any[]) => {},
  updateCategory: async (..._args: any[]) => {},
  askQuestion: async (..._args: any[]) => ({ success: true, message: 'ok' }),
  answerQuestion: async (..._args: any[]) => {},
  createQuestionAsAdmin: async (..._args: any[]) => {},
  editAnsweredQuestion: async (..._args: any[]) => {},
  getUserProfile: async (..._args: any[]) => null,
  updateProfile: async (..._args: any[]) => {},
};
