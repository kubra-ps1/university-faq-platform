import React from 'react';
import { Navbar } from './Navbar';

interface StudentLayoutProps {
  children: React.ReactNode;
  userName?: string;
}

export const StudentLayout: React.FC<StudentLayoutProps> = ({ children, userName = "Öğrenci" }) => {
  return (
    <div className="min-h-screen flex flex-col bg-dpu-bg text-dpu-text">
      <Navbar userRole="student" userName={userName} />
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
        {children}
      </main>
    </div>
  );
};
