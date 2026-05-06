import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-dpu-text mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-dpu-green focus:border-transparent outline-none transition-all duration-200 ${
            error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
          } ${className?.includes('bg-') ? '' : 'bg-white'} ${className?.includes('text-') ? '' : 'text-gray-900'} ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-500 animate-fade-in">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
