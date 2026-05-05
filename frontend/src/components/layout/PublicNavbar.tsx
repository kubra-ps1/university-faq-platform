import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TreePine, LogIn, HelpCircle } from 'lucide-react';

export const PublicNavbar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <nav className="bg-dpu-navy/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-12 h-12 bg-dpu-green rounded-2xl flex items-center justify-center text-dpu-navy shadow-[0_0_20px_rgba(0,237,100,0.4)] group-hover:scale-110 transition-transform">
              <TreePine size={28} />
            </div>
            <div>
              <h1 className="font-black text-2xl text-white tracking-tighter leading-tight">DPÜ <span className="text-dpu-green">SSS</span></h1>
              <p className="text-[10px] text-dpu-textMuted font-black uppercase tracking-widest">AKILLI DESTEK SİSTEMİ</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              className="px-6 py-2.5 text-white font-bold hover:text-dpu-green transition-colors flex items-center gap-2"
              onClick={() => navigate('/auth/login')}
            >
              <LogIn size={18} />
              Giriş Yap
            </button>
            <button 
              className="px-8 py-3 bg-white text-dpu-navy font-black rounded-xl hover:bg-dpu-green hover:shadow-[0_0_20px_rgba(0,237,100,0.5)] transition-all flex items-center gap-2 active:scale-95"
              onClick={() => navigate('/auth/login')}
            >
              <HelpCircle size={18} />
              SORU SOR
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
