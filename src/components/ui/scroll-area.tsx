import * as React from 'react';
import { cn } from '../../lib/utils';

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'vertical' | 'horizontal' | 'both';
}

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, orientation = 'vertical', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden',
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'h-full w-full rounded-[inherit]',
            orientation === 'vertical' && 'overflow-y-auto overflow-x-hidden',
            orientation === 'horizontal' && 'overflow-x-auto overflow-y-hidden',
            orientation === 'both' && 'overflow-auto',
            // Custom subtle scrollbar styling
            '[scrollbar-width:thin] [scrollbar-color:theme(colors.slate.300)_transparent]',
            '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5',
            '[&::-webkit-scrollbar-track]:bg-transparent',
            '[&::-webkit-scrollbar-thumb]:bg-slate-300/80 [&::-webkit-scrollbar-thumb]:rounded-full',
            'hover:[&::-webkit-scrollbar-thumb]:bg-slate-400'
          )}
        >
          {children}
        </div>
      </div>
    );
  }
);
ScrollArea.displayName = 'ScrollArea';

export const ScrollBar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { orientation?: 'vertical' | 'horizontal' }
>(({ className, orientation = 'vertical', ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'flex touch-none select-none transition-colors',
        orientation === 'vertical' && 'h-full w-1.5 border-l border-l-transparent p-[1px]',
        orientation === 'horizontal' && 'h-1.5 flex-col border-t border-t-transparent p-[1px]',
        className
      )}
      {...props}
    />
  );
});
ScrollBar.displayName = 'ScrollBar';
