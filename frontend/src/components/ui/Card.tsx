import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      className={`glass-card rounded-2xl overflow-hidden text-dpu-text ${onClick ? 'cursor-pointer hover:border-dpu-green/30 transition-all' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
