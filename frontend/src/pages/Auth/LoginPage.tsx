import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, User, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

export default function LoginPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'student' | 'admin'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      if (activeTab === 'student') {
        navigate('/student/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dpu-bg p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-dpu-green rounded-2xl flex items-center justify-center text-white shadow-lg mx-auto mb-4">
            <BookOpen size={32} />
          </div>
          <h1 className="text-3xl font-bold text-dpu-navy mb-2">Hoş Geldiniz</h1>
          <p className="text-dpu-textMuted">DPÜ SSS Platformuna giriş yapın</p>
        </div>

        <Card className="p-8 shadow-xl border-0">
          <div className="flex bg-gray-100 rounded-lg p-1 mb-8">
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-md transition-all ${
                activeTab === 'student' ? 'bg-white text-dpu-green shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('student')}
            >
              <User size={18} />
              Öğrenci Girişi
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-md transition-all ${
                activeTab === 'admin' ? 'bg-white text-dpu-green shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('admin')}
            >
              <ShieldCheck size={18} />
              Yönetici Girişi
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <Input 
              label="E-posta Adresi" 
              type="email" 
              placeholder="ornek@dpu.edu.tr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input 
              label="Şifre" 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
            <div className="pt-2">
              <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                Giriş Yap
              </Button>
            </div>
          </form>

          {activeTab === 'student' && (
            <div className="mt-8 text-center text-sm text-gray-500">
              Hesabınız yok mu?{' '}
              <Link to="/auth/register" className="font-semibold text-dpu-green hover:text-dpu-dark transition-colors">
                Kayıt Olun
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
