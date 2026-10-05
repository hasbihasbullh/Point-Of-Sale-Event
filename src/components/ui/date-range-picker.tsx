import * as React from 'react';
import { Calendar as CalendarIcon, Check, ChevronDown, RotateCcw } from 'lucide-react';
import { Calendar, DateRange } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import { cn } from '../../lib/utils';

interface DateRangePickerProps {
  startDate: string; // YYYY-MM-DD or 'ALL'
  endDate: string;   // YYYY-MM-DD or 'ALL'
  onChange: (start: string, end: string) => void;
  className?: string;
  align?: 'start' | 'center' | 'end';
}

function formatDateIndo(dateStr: string): string {
  if (!dateStr || dateStr === 'ALL') return 'Semua';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const day = Number(parts[2]);
  const monthIdx = Number(parts[1]) - 1;
  const year = parts[0];
  return `${day} ${months[monthIdx]} ${year}`;
}

function getWibDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  className,
  align = 'start',
}) => {
  const [open, setOpen] = React.useState(false);

  const [tempRange, setTempRange] = React.useState<DateRange>({
    from: startDate === 'ALL' ? undefined : startDate,
    to: endDate === 'ALL' ? undefined : endDate,
  });

  // Sync state when props change
  React.useEffect(() => {
    setTempRange({
      from: startDate === 'ALL' ? undefined : startDate,
      to: endDate === 'ALL' ? undefined : endDate,
    });
  }, [startDate, endDate]);

  const todayStr = React.useMemo(() => getWibDate(0), []);
  const yesterdayStr = React.useMemo(() => getWibDate(-1), []);
  const sevenDaysAgoStr = React.useMemo(() => getWibDate(-6), []);
  const thirtyDaysAgoStr = React.useMemo(() => getWibDate(-29), []);

  const firstDayOfMonthStr = React.useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  }, []);

  const presets = [
    {
      label: 'Hari Ini',
      from: todayStr,
      to: todayStr,
      isActive: startDate === todayStr && endDate === todayStr,
    },
    {
      label: 'Kemarin',
      from: yesterdayStr,
      to: yesterdayStr,
      isActive: startDate === yesterdayStr && endDate === yesterdayStr,
    },
    {
      label: '7 Hari Terakhir',
      from: sevenDaysAgoStr,
      to: todayStr,
      isActive: startDate === sevenDaysAgoStr && endDate === todayStr,
    },
    {
      label: '30 Hari Terakhir',
      from: thirtyDaysAgoStr,
      to: todayStr,
      isActive: startDate === thirtyDaysAgoStr && endDate === todayStr,
    },
    {
      label: 'Bulan Ini',
      from: firstDayOfMonthStr,
      to: todayStr,
      isActive: startDate === firstDayOfMonthStr && endDate === todayStr,
    },
    {
      label: 'Semua Tanggal',
      from: 'ALL',
      to: 'ALL',
      isActive: startDate === 'ALL' || endDate === 'ALL',
    },
  ];

  const handleApplyPreset = (from: string, to: string) => {
    onChange(from, to);
    setOpen(false);
  };

  const handleApplyCustom = () => {
    const from = tempRange.from || todayStr;
    const to = tempRange.to || tempRange.from || todayStr;
    onChange(from, to);
    setOpen(false);
  };

  // Determine button trigger label
  const displayText = React.useMemo(() => {
    if (startDate === 'ALL' || endDate === 'ALL') {
      return 'Semua Periode';
    }
    if (startDate === todayStr && endDate === todayStr) {
      return `Hari Ini (${formatDateIndo(startDate)})`;
    }
    if (startDate === yesterdayStr && endDate === yesterdayStr) {
      return `Kemarin (${formatDateIndo(startDate)})`;
    }
    if (startDate === endDate) {
      return formatDateIndo(startDate);
    }
    return `${formatDateIndo(startDate)} - ${formatDateIndo(endDate)}`;
  }, [startDate, endDate, todayStr, yesterdayStr]);

  const isFiltered = startDate !== 'ALL' && endDate !== 'ALL';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-popover-trigger="true"
          className={cn(
            'flex items-center gap-2 bg-white border border-slate-200 hover:border-orange-400 text-slate-700 hover:text-slate-900 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shadow-2xs cursor-pointer',
            isFiltered && 'border-orange-300 bg-orange-50/50 text-orange-900',
            className
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5 text-orange-500 shrink-0" />
          <span className="truncate max-w-[200px]">{displayText}</span>
          <ChevronDown className="h-3 w-3 text-slate-400 shrink-0 ml-0.5" />
        </button>
      </PopoverTrigger>

      <PopoverContent align={align} className="p-0 max-w-none shadow-2xl rounded-3xl overflow-hidden border-slate-200">
        <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          {/* Preset Buttons Column */}
          <div className="p-3 w-full sm:w-44 bg-slate-50/70 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
              Pilihan Cepat
            </div>
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => handleApplyPreset(p.from, p.to)}
                className={cn(
                  'w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-between cursor-pointer',
                  p.isActive
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/60'
                )}
              >
                <span>{p.label}</span>
                {p.isActive && <Check className="h-3 w-3" />}
              </button>
            ))}
          </div>

          {/* Calendar Picker Column */}
          <div className="p-3 bg-white flex flex-col justify-between">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-1">
              Pilih Rentang Tanggal
            </div>

            <Calendar
              mode="range"
              selectedRange={tempRange}
              onSelectRange={(range) => setTempRange(range)}
            />

            {/* Custom Range Action Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 px-1">
              <div className="text-[11px] text-slate-500">
                {tempRange.from ? (
                  <span>
                    <strong className="text-slate-800">{formatDateIndo(tempRange.from)}</strong>
                    {tempRange.to && tempRange.to !== tempRange.from && (
                      <>
                        {' '}&rarr;{' '}
                        <strong className="text-slate-800">{formatDateIndo(tempRange.to)}</strong>
                      </>
                    )}
                  </span>
                ) : (
                  <span>Pilih tanggal mulai & akhir</span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  className="h-7 px-2.5 text-xs text-slate-500 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  onClick={handleApplyCustom}
                  disabled={!tempRange.from}
                  className="h-7 px-3 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-lg shadow-xs cursor-pointer"
                >
                  Terapkan
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
