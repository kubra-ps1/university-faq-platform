import React from 'react';
import { Navbar } from './Navbar';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Clock, Archive, FolderTree, BookOpenCheck } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  
  const tabs = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Aktif SSS', path: '/admin/faq-management', icon: <BookOpenCheck size={18} /> },
    { name: 'Bekleyen Sorular', path: '/admin/pending-questions', icon: <Clock size={18} /> },
    { name: 'Soru Havuzu', path: '/admin/question-pool', icon: <Archive size={18} /> },
    { name: 'Kategoriler', path: '/admin/categories', icon: <FolderTree size={18} /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-dpu-bg text-dpu-text">
      <Navbar userRole="admin" userName="Yönetici" />
      
      {/* Admin Tabs */}
      <div className="bg-dpu-navy border-b border-white/5 sticky top-16 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-10 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const isActive = location.pathname === tab.path;
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`flex items-center gap-2 py-5 px-1 border-b-2 text-sm font-black uppercase tracking-widest transition-all ${
                    isActive 
                      ? 'border-dpu-green text-dpu-green drop-shadow-[0_0_8px_rgba(0,237,100,0.5)]' 
                      : 'border-transparent text-dpu-textMuted hover:text-white hover:border-white/20'
                  }`}
                >
                  {tab.icon}
                  {tab.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
        {children}
      </main>
    </div>
  );
};
