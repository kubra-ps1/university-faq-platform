import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TreePine, User, LogOut } from 'lucide-react';

interface NavbarProps {
  userRole: 'student' | 'admin';
  userName: string;
}

export const Navbar: React.FC<NavbarProps> = ({ userRole, userName }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // In a real app, clear auth tokens here
    navigate('/');
  };

  const goToProfile = () => {
    if (userRole === 'student') navigate('/student/profile');
    // Admin profile can be added if needed
  };

  return (
    <nav className="bg-dpu-navy border-b border-white/5 sticky top-0 z-40 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate(userRole === 'student' ? '/student/dashboard' : '/admin/dashboard')}>
            <div className="w-10 h-10 bg-dpu-green rounded-xl flex items-center justify-center text-dpu-navy shadow-[0_0_15px_rgba(0,237,100,0.3)] group-hover:scale-110 transition-transform">
              <TreePine size={24} />
            </div>
            <div>
              <h1 className="font-black text-xl text-white tracking-tighter leading-tight group-hover:text-dpu-green transition-colors">DPÜ <span className="text-dpu-green">SSS</span></h1>
              {userRole === 'admin' && <p className="text-[10px] text-dpu-textMuted font-black uppercase tracking-widest">YÖNETİCİ</p>}
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div 
              className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-all border border-transparent hover:border-white/5"
              onClick={goToProfile}
            >
              <div className="w-9 h-9 bg-dpu-surface border border-white/10 rounded-full flex items-center justify-center text-dpu-green shadow-inner">
                <User size={20} />
              </div>
              <span className="font-bold text-sm text-white hidden sm:block">{userName}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-dpu-textMuted hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
              title="Çıkış Yap"
            >
              <LogOut size={22} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
