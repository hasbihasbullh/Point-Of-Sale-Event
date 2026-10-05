import * as React from 'react';
import { cn } from '../../lib/utils';

interface PopoverContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const PopoverContext = React.createContext<PopoverContextType | undefined>(undefined);

interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const Popover: React.FC<PopoverProps> = ({
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  children,
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      if (isControlled) {
        setControlledOpen?.(newOpen);
      } else {
        setUncontrolledOpen(newOpen);
      }
    },
    [isControlled, setControlledOpen]
  );

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block text-left">{children}</div>
    </PopoverContext.Provider>
  );
};

export const PopoverTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ className, children, onClick, ...props }, ref) => {
  const context = React.useContext(PopoverContext);
  if (!context) throw new Error('PopoverTrigger must be used within Popover');

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onClick?.(e);
    context.setOpen(!context.open);
  };

  return (
    <div
      ref={ref}
      className={cn('inline-flex cursor-pointer', className)}
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  );
});
PopoverTrigger.displayName = 'PopoverTrigger';

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}

export const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, align = 'start', children, ...props }, ref) => {
    const context = React.useContext(PopoverContext);
    if (!context) throw new Error('PopoverContent must be used within Popover');

    const contentRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
      if (!context.open) return;

      const handlePointerDown = (e: MouseEvent) => {
        if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
          const isTrigger = (e.target as HTMLElement).closest('[data-popover-trigger]');
          if (!isTrigger) {
            context.setOpen(false);
          }
        }
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          context.setOpen(false);
        }
      };

      document.addEventListener('pointerdown', handlePointerDown);
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('pointerdown', handlePointerDown);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [context.open, context.setOpen]);

    if (!context.open) return null;

    const alignmentClasses = {
      start: 'left-0',
      center: 'left-1/2 -translate-x-1/2',
      end: 'right-0',
    };

    return (
      <div
        ref={(node) => {
          contentRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        className={cn(
          'absolute z-50 mt-2 rounded-2xl border border-slate-200 bg-white p-3 text-slate-950 shadow-xl outline-none animate-in fade-in zoom-in-95 duration-150',
          alignmentClasses[align],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
PopoverContent.displayName = 'PopoverContent';
