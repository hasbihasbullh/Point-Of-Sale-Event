import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-orange-500 text-white shadow-xs hover:bg-orange-600 focus-visible:ring-orange-500',
        primary:
          'bg-slate-900 text-white shadow-xs hover:bg-slate-800 focus-visible:ring-slate-950',
        destructive:
          'bg-rose-500 text-white shadow-xs hover:bg-rose-600 focus-visible:ring-rose-500',
        outline:
          'border border-slate-200 bg-white text-slate-800 shadow-xs hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400',
        secondary:
          'bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-400',
        ghost:
          'hover:bg-slate-100 hover:text-slate-900 text-slate-700',
        link:
          'text-orange-600 underline-offset-4 hover:underline',
        success:
          'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 focus-visible:ring-emerald-500',
      },
      size: {
        default: 'h-10 px-4 py-2 text-sm',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-11 rounded-xl px-6 text-base font-semibold',
        icon: 'h-9 w-9 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
