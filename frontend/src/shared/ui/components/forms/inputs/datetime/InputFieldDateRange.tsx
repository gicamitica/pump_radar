import * as React from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/shadcn/lib/utils';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { Calendar } from '@/shared/ui/shadcn/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/shadcn/components/ui/popover';

export interface InputFieldDateRangeProps {
  value: { from: Date | null; to: Date | null } | null;
  onChange: (range: { from: Date | null; to: Date | null } | null) => void;
  disabled?: boolean;
  placeholder?: string;
  hasError?: boolean;
  id?: string;
}

export function InputFieldDateRange({
  value,
  onChange,
  disabled,
  placeholder = "Select date range",
  hasError,
  id,
}: InputFieldDateRangeProps) {
  const [open, setOpen] = React.useState(false);

  // Convert internal null-safe object to DateRange for react-day-picker
  const selectedRange: DateRange | undefined = React.useMemo(() => {
    if (!value) return undefined;
    return {
      from: value.from || undefined,
      to: value.to || undefined,
    };
  }, [value]);

  const handleSelect = (range: DateRange | undefined) => {
    if (!range) {
      onChange(null);
      return;
    }
    onChange({
      from: range.from || null,
      to: range.to || null,
    });
    // Don't close immediately on range selection as user might be selecting 'to' date
    if (range.from && range.to) {
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            hasError && 'border-destructive',
            open && 'ring-2 ring-ring ring-offset-2'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value?.from ? (
            value.to ? (
              <>
                {format(value.from, 'LLL dd, y')} - {format(value.to, 'LLL dd, y')}
              </>
            ) : (
              format(value.from, 'LLL dd, y')
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={selectedRange?.from}
          selected={selectedRange}
          onSelect={handleSelect}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}
