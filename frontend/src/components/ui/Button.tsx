import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseStyle = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-dpu-green text-white hover:bg-dpu-dark shadow-sm hover:shadow-md",
    secondary: "bg-dpu-light text-dpu-text hover:bg-dpu-green hover:text-white shadow-sm",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
    ghost: "bg-transparent text-dpu-text hover:bg-gray-100",
    outline: "border-2 border-dpu-green text-dpu-green hover:bg-dpu-green hover:text-white"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
      ) : null}
      {children}
    </button>
  );
};
