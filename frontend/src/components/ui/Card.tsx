import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  glass = false,
  glow = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[var(--contrast)] bg-[var(--surface)] text-[var(--ink)] transition-all duration-200 shadow-sm',
        glass && 'glass-panel',
        glow && 'glow-shadow hover:glow-shadow-lg',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={cn('p-6 pb-3 border-b border-[var(--contrast)]', className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className,
  ...props
}) => (
  <h3 className={cn('text-lg font-semibold tracking-tight text-[var(--ink)] font-heading', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className,
  ...props
}) => (
  <p className={cn('text-sm text-[var(--ink-soft)] mt-1', className)} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={cn('p-6', className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={cn('p-6 pt-3 border-t border-[var(--contrast)] bg-[var(--surface-soft)] rounded-b-2xl', className)} {...props}>
    {children}
  </div>
);
