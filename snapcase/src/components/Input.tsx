import React from 'react';
import { cn } from '../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-main mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-surface text-text-main placeholder:text-text-muted transition-premium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
            {
              'border-red-500 focus:ring-red-500/20 focus:border-red-500': error,
            },
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
