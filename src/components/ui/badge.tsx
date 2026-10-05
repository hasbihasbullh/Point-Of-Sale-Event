import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-orange-500 text-white shadow-xs',
        secondary:
          'border-transparent bg-slate-100 text-slate-800',
        destructive:
          'border-transparent bg-rose-100 text-rose-700 border-rose-200',
        outline:
          'border-slate-200 text-slate-700',
        success:
          'border-emerald-200 bg-emerald-50 text-emerald-700',
        warning:
          'border-amber-200 bg-amber-50 text-amber-700',
        info:
          'border-sky-200 bg-sky-50 text-sky-700',
        purple:
          'border-purple-200 bg-purple-50 text-purple-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'purple';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </div>
  );
}

export { badgeVariants };
