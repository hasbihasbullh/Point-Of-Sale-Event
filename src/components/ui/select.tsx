import * as React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SelectContextValue {
  value?: string;
  onValueChange: (value: string, label?: React.ReactNode) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  registerItem: (value: string, label: React.ReactNode) => void;
  getItemLabel: (value?: string) => React.ReactNode;
  selectedLabel?: React.ReactNode;
}

const SelectContext = React.createContext<SelectContextValue | undefined>(undefined);

const useSelect = () => {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error('useSelect must be used within a <Select />');
  }
  return context;
};

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({
  value: controlledValue,
  defaultValue = '',
  onValueChange,
  open: controlledOpen,
  onOpenChange,
  children,
}) => {
  const [uncontrolledValue, setUncontrolledValue] = React.useState<string>(defaultValue);
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const [selectedLabel, setSelectedLabel] = React.useState<React.ReactNode>(null);
  const [itemsMap, setItemsMap] = React.useState<Map<string, React.ReactNode>>(() => new Map());

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const isOpenControlled = controlledOpen !== undefined;
  const open = isOpenControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      if (!isOpenControlled) {
        setUncontrolledOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    },
    [isOpenControlled, onOpenChange]
  );

  const registerItem = React.useCallback((itemVal: string, label: React.ReactNode) => {
    setItemsMap((prev) => {
      if (prev.get(itemVal) === label) return prev;
      const next = new Map(prev);
      next.set(itemVal, label);
      return next;
    });
  }, []);

  const getItemLabel = React.useCallback(
    (targetVal?: string) => {
      if (targetVal === undefined) return null;
      return itemsMap.get(targetVal) || null;
    },
    [itemsMap]
  );

  const handleValueChange = React.useCallback(
    (newValue: string, label?: React.ReactNode) => {
      if (label) {
        setSelectedLabel(label);
      } else if (itemsMap.has(newValue)) {
        setSelectedLabel(itemsMap.get(newValue));
      }
      if (!isControlled) {
        setUncontrolledValue(newValue);
      }
      onValueChange?.(newValue);
      setOpen(false);
    },
    [isControlled, onValueChange, setOpen, itemsMap]
  );

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange: handleValueChange,
        open,
        setOpen,
        registerItem,
        getItemLabel,
        selectedLabel,
      }}
    >
      <div className="relative inline-block text-left">{children}</div>
    </SelectContext.Provider>
  );
};

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children?: React.ReactNode;
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen } = useSelect();

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-xs transition-all hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
          open && 'ring-1 ring-orange-500 border-orange-500',
          className
        )}
        aria-expanded={open}
        {...props}
      >
        <span className="flex items-center gap-1.5 truncate">{children}</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-slate-400 transition-transform duration-200 shrink-0',
            open && 'rotate-180 text-orange-500'
          )}
        />
      </button>
    );
  }
);
SelectTrigger.displayName = 'SelectTrigger';

interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

const SelectValue: React.FC<SelectValueProps> = ({ placeholder, className }) => {
  const { value, getItemLabel, selectedLabel } = useSelect();

  const labelFromMap = getItemLabel(value);
  const displayLabel = labelFromMap || selectedLabel;

  if (displayLabel) {
    return <span className={cn('truncate', className)}>{displayLabel}</span>;
  }

  if (value && value !== '') {
    return <span className={cn('truncate', className)}>{value}</span>;
  }

  return <span className={cn('text-slate-400 font-normal truncate', className)}>{placeholder || ''}</span>;
};
SelectValue.displayName = 'SelectValue';

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
  align?: 'left' | 'right';
}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, align = 'left', ...props }, ref) => {
    const { open, setOpen } = useSelect();
    const contentRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
      if (!open) return;

      const handleClickOutside = (e: MouseEvent) => {
        if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
          // Check if target is inside trigger button
          const trigger = contentRef.current.parentElement?.querySelector('button');
          if (trigger && trigger.contains(e.target as Node)) return;
          setOpen(false);
        }
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [open, setOpen]);

    return (
      <div
        ref={(node) => {
          contentRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn(
          'absolute z-50 mt-1.5 min-w-[140px] max-h-60 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1 text-slate-800 shadow-xl focus:outline-none transition-all duration-150',
          align === 'right' ? 'right-0' : 'left-0',
          open
            ? 'block opacity-100 scale-100 pointer-events-auto animate-in fade-in-0 zoom-in-95 duration-150'
            : 'hidden opacity-0 scale-95 pointer-events-none',
          className
        )}
        {...props}
      >
        <div className="space-y-0.5">{children}</div>
      </div>
    );
  }
);
SelectContent.displayName = 'SelectContent';

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ value: itemValue, className, children, disabled, ...props }, ref) => {
    const { value, onValueChange, registerItem } = useSelect();
    const isSelected = value === itemValue;

    // Register label into registry
    React.useEffect(() => {
      registerItem(itemValue, children);
    }, [itemValue, children, registerItem]);

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled) return;
      onValueChange(itemValue, children);
    };

    return (
      <div
        ref={ref}
        onClick={handleClick}
        className={cn(
          'relative flex w-full cursor-pointer select-none items-center justify-between rounded-xl px-2.5 py-1.5 text-xs outline-none transition-colors hover:bg-orange-50 hover:text-orange-950 font-medium',
          isSelected && 'bg-orange-50/80 text-orange-900 font-bold',
          disabled && 'pointer-events-none opacity-50',
          className
        )}
        {...props}
      >
        <span className="flex items-center gap-1.5 truncate">{children}</span>
        {isSelected && (
          <Check className="h-3.5 w-3.5 text-orange-600 shrink-0 ml-2" />
        )}
      </div>
    );
  }
);
SelectItem.displayName = 'SelectItem';

const SelectGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-1', className)} {...props} />
  )
);
SelectGroup.displayName = 'SelectGroup';

const SelectLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400', className)}
      {...props}
    />
  )
);
SelectLabel.displayName = 'SelectLabel';

const SelectSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('-mx-1 my-1 h-px bg-slate-100', className)} {...props} />
  )
);
SelectSeparator.displayName = 'SelectSeparator';

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
};
