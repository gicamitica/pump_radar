import * as React from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { Calendar } from '@/shared/ui/shadcn/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/shadcn/components/ui/popover';

export interface InputFieldDateProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  disabled?: boolean;
  placeholder?: string;
  hasError?: boolean;
  id?: string;
  className?: string;
}


export function InputFieldDate({
  value,
  onChange,
  disabled,
  placeholder = "Select date",
  hasError,
  id,
  className,
}: InputFieldDateProps) {

  const [open, setOpen] = React.useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    onChange(date || null);
    setOpen(false);
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
            {value ? format(value, 'MMM d, yyyy') : placeholder}
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
      </PopoverContent>
    </Popover>
  );
}
