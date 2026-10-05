import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DateRange {
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
}

interface CalendarProps {
  mode?: 'single' | 'range';
  selected?: string; // YYYY-MM-DD
  selectedRange?: DateRange;
  onSelectDate?: (dateStr: string) => void;
  onSelectRange?: (range: DateRange) => void;
  className?: string;
  minDate?: string;
  maxDate?: string;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function formatYYYYMMDD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const Calendar: React.FC<CalendarProps> = ({
  mode = 'single',
  selected,
  selectedRange,
  onSelectDate,
  onSelectRange,
  className,
  minDate,
  maxDate,
}) => {
  // Determine initial display month/year
  const initialDate = React.useMemo(() => {
    if (mode === 'single' && selected && selected !== 'ALL') {
      const parts = selected.split('-');
      if (parts.length === 3) return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    if (mode === 'range' && selectedRange?.from && selectedRange.from !== 'ALL') {
      const parts = selectedRange.from.split('-');
      if (parts.length === 3) return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    return new Date();
  }, [mode, selected, selectedRange]);

  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  );

  const [hoverDate, setHoverDate] = React.useState<string | null>(null);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const todayStr = React.useMemo(() => formatYYYYMMDD(new Date()), []);

  // Compute days in grid
  const daysGrid = React.useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isDisabled: boolean;
    }> = [];

    // Prev month padding
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      const str = formatYYYYMMDD(prevDate);
      days.push({
        dateStr: str,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: str === todayStr,
        isDisabled: (minDate ? str < minDate : false) || (maxDate ? str > maxDate : false),
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(year, month, d);
      const str = formatYYYYMMDD(curDate);
      days.push({
        dateStr: str,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: str === todayStr,
        isDisabled: (minDate ? str < minDate : false) || (maxDate ? str > maxDate : false),
      });
    }

    // Next month padding to fill complete weeks (42 total slots = 6 rows)
    const remainingSlots = 42 - days.length;
    for (let d = 1; d <= remainingSlots; d++) {
      const nextDate = new Date(year, month + 1, d);
      const str = formatYYYYMMDD(nextDate);
      days.push({
        dateStr: str,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: str === todayStr,
        isDisabled: (minDate ? str < minDate : false) || (maxDate ? str > maxDate : false),
      });
    }

    return days;
  }, [currentMonth, todayStr, minDate, maxDate]);

  const handleDayClick = (dateStr: string, isDisabled: boolean) => {
    if (isDisabled) return;

    if (mode === 'single') {
      onSelectDate?.(dateStr);
    } else if (mode === 'range') {
      if (!selectedRange || (!selectedRange.from && !selectedRange.to)) {
        onSelectRange?.({ from: dateStr, to: dateStr });
      } else if (selectedRange.from && !selectedRange.to) {
        if (dateStr < selectedRange.from) {
          onSelectRange?.({ from: dateStr, to: selectedRange.from });
        } else {
          onSelectRange?.({ from: selectedRange.from, to: dateStr });
        }
      } else {
        // Start fresh range
        onSelectRange?.({ from: dateStr, to: undefined });
      }
    }
  };

  return (
    <div className={cn('p-3 select-none w-[280px]', className)}>
      {/* Month & Year Navigation Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          type="button"
          onClick={prevMonth}
          className="h-7 w-7 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
          title="Bulan sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="text-xs font-bold text-slate-800">
          {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>

        <button
          type="button"
          onClick={nextMonth}
          className="h-7 w-7 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
          title="Bulan berikutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day of week labels */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {DAY_NAMES.map((name, i) => (
          <div
            key={name}
            className={cn(
              'text-[10.5px] font-bold py-1 text-slate-400',
              i === 0 && 'text-rose-500' // Sunday
            )}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {daysGrid.map((day, idx) => {
          const isSelectedSingle = mode === 'single' && selected === day.dateStr;

          const isRangeStart =
            mode === 'range' &&
            selectedRange?.from === day.dateStr &&
            Boolean(selectedRange.from);

          const isRangeEnd =
            mode === 'range' &&
            selectedRange?.to === day.dateStr &&
            Boolean(selectedRange.to);

          const isRangeSingleDay = isRangeStart && isRangeEnd;

          // In-range calculation
          const effectiveTo = selectedRange?.to || (selectedRange?.from && hoverDate ? hoverDate : undefined);
          const rangeMin = selectedRange?.from && effectiveTo ? (selectedRange.from <= effectiveTo ? selectedRange.from : effectiveTo) : null;
          const rangeMax = selectedRange?.from && effectiveTo ? (selectedRange.from <= effectiveTo ? effectiveTo : selectedRange.from) : null;

          const isInRange =
            mode === 'range' &&
            rangeMin &&
            rangeMax &&
            day.dateStr >= rangeMin &&
            day.dateStr <= rangeMax;

          const isSelected = isSelectedSingle || isRangeStart || isRangeEnd;

          return (
            <div
              key={`${day.dateStr}-${idx}`}
              className={cn(
                'relative flex items-center justify-center p-0',
                isInRange && !isRangeSingleDay && 'bg-orange-100/60',
                isRangeStart && !isRangeSingleDay && 'rounded-l-xl',
                isRangeEnd && !isRangeSingleDay && 'rounded-r-xl'
              )}
            >
              <button
                type="button"
                disabled={day.isDisabled}
                onClick={() => handleDayClick(day.dateStr, day.isDisabled)}
                onMouseEnter={() => setHoverDate(day.dateStr)}
                onMouseLeave={() => setHoverDate(null)}
                className={cn(
                  'h-8 w-8 text-xs font-semibold rounded-xl flex items-center justify-center transition-all cursor-pointer',
                  // Text colors based on month & disabled state
                  !day.isCurrentMonth && 'text-slate-300',
                  day.isCurrentMonth && 'text-slate-700 hover:bg-slate-100',
                  day.isDisabled && 'opacity-30 cursor-not-allowed hover:bg-transparent',
                  // Today outline indicator
                  day.isToday && !isSelected && 'border border-orange-400 font-bold text-orange-600',
                  // Selected state
                  isSelected &&
                    'bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-xs scale-105 z-10'
                )}
              >
                {day.dayNumber}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
