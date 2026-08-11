import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent disabled:opacity-50 disabled:pointer-events-none rounded-xl active:scale-[0.98] cursor-pointer';

  const variants = {
    primary: 'bg-[#2D5BFF] text-white hover:bg-[#1F46E0] shadow-glow hover:shadow-glow-lg border border-transparent',
    secondary: 'bg-[var(--surface-soft)] text-[var(--ink)] hover:bg-[var(--contrast)] border border-[var(--contrast)]',
    outline: 'border border-[var(--contrast)] bg-transparent text-[var(--ink)] hover:bg-[var(--surface-soft)]',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm border border-transparent',
    ghost: 'bg-transparent text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--surface-soft)]'
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5 font-semibold'
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
