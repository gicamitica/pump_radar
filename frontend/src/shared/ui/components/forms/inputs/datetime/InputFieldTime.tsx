import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/shadcn/components/ui/select';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';

export interface InputFieldTimeProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  minuteStep?: number;
  disabled?: boolean;
  placeholder?: string;
  hasError?: boolean;
}

const generateTimeOptions = (step: number = 15) => {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += step) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      options.push(`${h}:${m}`);
    }
  }
  return options;
};

export function InputFieldTime({
  value,
  onChange,
  minuteStep = 15,
  disabled,
  placeholder = "Select time",
}: InputFieldTimeProps) {
  // Memoize options to avoid regenerating on every render
  const timeOptions = React.useMemo(() => generateTimeOptions(minuteStep), [minuteStep]);

  const selectedTime = React.useMemo(() => {
    if (!value) return '';
    return format(value, 'HH:mm');
  }, [value]);

  const handleTimeChange = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    
    // If we have a value, update it. If not, creating a new date at today with this time is tricky 
    // because this component is "Time Only" but operates on "Date" object.
    // Usually TimeOnly implies we care about the time part. 
    // We'll default to today's date if null, or preserve date if exists.
    const newDate = value ? new Date(value) : new Date();
    newDate.setHours(hours, minutes, 0, 0);
    
    onChange(newDate);
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <Select value={selectedTime} onValueChange={handleTimeChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-[200px]">
          {timeOptions.map((time) => {
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
  );
}
