import * as React from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { Calendar } from '@/shared/ui/shadcn/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/shadcn/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/shadcn/components/ui/select';

export interface InputFieldDateTimeProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  disabled?: boolean;
  placeholder?: string;
  hasError?: boolean;
  id?: string;
  className?: string;
}


// Generate time options in 15-minute intervals
// We duplicate this helper or export it. For isolation, duplication is fine or we can extract to common utils later.
// The user request didn't specify a utils file for this.
const generateTimeOptions = () => {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      options.push(`${h}:${m}`);
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

export function InputFieldDateTime({
  value,
  onChange,
  disabled,
  placeholder = "Select date and time",
  hasError,
  id,
  className,
}: InputFieldDateTimeProps) {

  const [open, setOpen] = React.useState(false);

  const selectedTime = React.useMemo(() => {
    if (!value) return '09:00';
    return format(value, 'HH:mm');
  }, [value]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onChange(null);
      return;
    }
    
    // Preserve the current time when selecting a new date
    // If value is null, default to 09:00 (or current time?)
    const currentTime = value 
      ? { hours: value.getHours(), minutes: value.getMinutes() }
      : { hours: 9, minutes: 0 };
    
    const newDate = new Date(date);
    newDate.setHours(currentTime.hours, currentTime.minutes, 0, 0);
    
    onChange(newDate);
  };

  const handleTimeChange = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    
    const newDate = value ? new Date(value) : new Date();
    newDate.setHours(hours, minutes, 0, 0);
    
    onChange(newDate);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal px-2.5',
            !value && 'text-muted-foreground',
            hasError && 'border-destructive',
            open && 'ring-2 ring-ring ring-offset-2',
            className
          )}
        >
          <CalendarIcon className="mr-1.5 h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {value ? format(value, 'MMM d, yyyy h:mm a') : placeholder}
          </span>
        </Button>

      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value || undefined}
          onSelect={handleDateSelect}
          initialFocus
        />
        <div className="border-t p-3">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" />
            <Select value={selectedTime} onValueChange={handleTimeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {TIME_OPTIONS.map((time) => {
                  const [h, m] = time.split(':').map(Number);
                  const period = h >= 12 ? 'PM' : 'AM';
                  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
                  const displayTime = `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
                  
                  return (
                    <SelectItem key={time} value={time}>
                      {displayTime}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
