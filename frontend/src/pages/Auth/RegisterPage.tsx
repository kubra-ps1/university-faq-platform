import React, { useState } from 'react';
import {register} from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { TreePine, Sparkles } from 'lucide-react';
import { Input } from '../../components/ui/Input';

const FACULTY_DATA: Record<string, string[]> = {
  "Mühendislik Fakültesi": [
    "Bilgisayar Mühendisliği",
    "Elektrik-Elektronik Mühendisliği",
    "Makine Mühendisliği",
    "İnşaat Mühendisliği",
    "Endüstri Mühendisliği"
  ],
  "Fen Edebiyat Fakültesi": [
    "Matematik",
    "Fizik",
    "Kimya",
    "Biyoloji",
    "Tarih",
    "Türk Dili ve Edebiyatı"
  ],
  "İktisadi ve İdari Bilimler Fakültesi": [
    "İşletme",
    "İktisat",
    "Kamu Yönetimi",
    "Siyaset Bilimi ve Uluslararası İlişkiler"
  ],
  "Eğitim Fakültesi": [
    "Sınıf Öğretmenliği",
    "Okul Öncesi Öğretmenliği",
    "Rehberlik ve Psikolojik Danışmanlık"
  ],
  "Spor Bilimleri Fakültesi": [
    "Antrenörlük Eğitimi",
    "Beden Eğitimi ve Spor Öğretmenliği",
    "Spor Yöneticiliği"
  ],
  "Güzel Sanatlar Fakültesi": [
    "Görsel İletişim Tasarımı",
    "Resim",
    "Seramik ve Cam"
  ]
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    faculty: '',
    department: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success,setSuccess]=useState<string |null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'faculty') {
      setFormData({ 
        ...formData, 
        faculty: value, 
        department: ''
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    if(formData.email.trim() == '' || formData.fullName.trim() == ''|| formData.faculty.trim() == '' || formData.department.trim() == '' || formData.password.trim() == '' || formData.confirmPassword.trim() == '' ){
      setError('Lütfen boşlukları doldurunuz');
      setIsLoading(false);
      return;
    }
    if(formData.password !==formData.confirmPassword){
      setError('Şifreler birbiriyle eşleşmiyor lütfen kontrol ediniz');
      setIsLoading(false);
      return;

    }
    try{
      const response=await register(formData);
      setSuccess(response.message);
      setTimeout(() => {
        navigate('/auth/login');
      },2000);


    }
  catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Beklenmeyen bir hata oluştu.");
      }
    }
    finally{
      setIsLoading(false)
    }
    
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dpu-bg p-4 py-12 relative overflow-hidden">
      {/* Aesthetic Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 opacity-[0.05] transform -rotate-12 scale-[4] blur-[3px]">
        <TreePine size={400} strokeWidth={0.5} className="text-dpu-green" />
      </div>

      <div className="w-full max-w-lg animate-fade-in relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dpu-green/10 border border-dpu-green/20 text-dpu-green text-sm font-bold mb-4">
            <Sparkles size={14} />
            <span>Geleceğini Tasarla</span>
          </div>
          <div className="w-20 h-20 bg-dpu-green rounded-[2rem] flex items-center justify-center text-dpu-navy shadow-[0_0_30px_rgba(0,237,100,0.3)] mx-auto mb-6 transform hover:rotate-6 transition-transform">
            <TreePine size={40} />
          </div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">Öğrenci Kaydı</h1>
          <p className="text-dpu-textMuted font-medium">Platforma katılmak için bilgilerinizi girin</p>
        </div>

        <div className="glass-card p-10 border-white/5 shadow-2xl">
          <form onSubmit={handleRegister} className="space-y-6">
            {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>}
            {success && <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">{success}</div>}
            <Input 
              label="Ad Soyad" 
              name="fullName"
              placeholder="Örn: Ali Yılmaz"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="bg-dpu-navy/50 border-white/10 text-white placeholder:text-dpu-textMuted/30"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-dpu-textMuted uppercase tracking-wider">Fakülte</label>
                <select
                  name="faculty"
                  value={formData.faculty}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-dpu-navy/50 border border-white/10 text-white focus:border-dpu-green/50 outline-none transition-all appearance-none cursor-pointer"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2300ED64' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' /%3E%3C/svg%3E")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2rem' }}
                >
                  <option value="" disabled className="bg-dpu-navy text-gray-500">Seçiniz...</option>
                  {Object.keys(FACULTY_DATA).map(f => (
                    <option key={f} value={f} className="bg-dpu-navy text-white">{f}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-dpu-textMuted uppercase tracking-wider">Bölüm</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  disabled={!formData.faculty}
                  className="w-full px-4 py-3 rounded-xl bg-dpu-navy/50 border border-white/10 text-white focus:border-dpu-green/50 outline-none transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2300ED64' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' /%3E%3C/svg%3E")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2rem' }}
                >
                  <option value="" disabled className="bg-dpu-navy text-gray-500">Seçiniz...</option>
                  {formData.faculty && FACULTY_DATA[formData.faculty].map(d => (
                    <option key={d} value={d} className="bg-dpu-navy text-white">{d}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <Input 
              label="Öğrenci E-posta Adresi" 
              type="email" 
              name="email"
              placeholder="ornek@ogrenci.dpu.edu.tr"
              value={formData.email}
              onChange={handleChange}
              required
              className="bg-dpu-navy/50 border-white/10 text-white placeholder:text-dpu-textMuted/30"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Şifre" 
                type="password" 
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                className="bg-dpu-navy/50 border-white/10 text-white placeholder:text-dpu-textMuted/30"
              />
              <Input 
                label="Şifre Tekrar" 
                type="password" 
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="bg-dpu-navy/50 border-white/10 text-white placeholder:text-dpu-textMuted/30"
              />
            </div>
            
            <div className="pt-4">
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-4 bg-dpu-green text-dpu-navy font-black rounded-xl hover:shadow-[0_0_30px_rgba(0,237,100,0.4)] transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoading ? 'HESAP OLUŞTURULUYOR...' : 'KAYIT OL'}
              </button>
            </div>
          </form>

          <div className="mt-10 text-center text-sm font-medium">
            <span className="text-dpu-textMuted">Zaten hesabınız var mı?</span>{' '}
            <Link to="/auth/login" className="text-dpu-green font-bold hover:underline ml-1">
              Giriş Yapın
            </Link>
          </div>
          <div className="mt-4 text-center">
            <Link to="/" className="text-sm font-bold text-dpu-textMuted hover:text-dpu-green transition-colors">
              &larr; Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
