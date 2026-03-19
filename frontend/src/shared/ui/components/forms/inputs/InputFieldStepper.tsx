import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { Input } from '@/shared/ui/shadcn/components/ui/input';
import { cn } from '@/shadcn/lib/utils';

export interface InputFieldStepperProps {
  /** Current value */
  value: number;
  /** Change handler */
  onChange: (value: number) => void;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Step size for increment/decrement buttons */
  step?: number;
  /** Quick preset values to display as shortcuts */
  presets?: number[];
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Custom className for the container */
  className?: string;
  /** Name attribute for form integration */
  name?: string;
  /** ID for accessibility */
  id?: string;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
}

export const InputFieldStepper = React.forwardRef<HTMLInputElement, InputFieldStepperProps>(
  (
    {
      value,
      onChange,
      min,
      max,
      step = 1,
      presets = [-10, -5, 5, 10, 50],
      disabled = false,
      className,
      name,
      id,
      onBlur,
    },
    ref
  ) => {
    const handleIncrement = () => {
      const newValue = value + step;
      if (max !== undefined && newValue > max) return;
      onChange(newValue);
    };

    const handleDecrement = () => {
      const newValue = value - step;
      if (min !== undefined && newValue < min) return;
      onChange(newValue);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseInt(e.target.value);
      if (isNaN(parsed)) {
        onChange(0);
        return;
      }
      
      let newValue = parsed;
      if (min !== undefined && newValue < min) newValue = min;
      if (max !== undefined && newValue > max) newValue = max;
      
      onChange(newValue);
    };

    const handlePresetClick = (presetValue: number) => {
      const newValue = value + presetValue;
      if (min !== undefined && newValue < min) return;
      if (max !== undefined && newValue > max) return;
      onChange(newValue);
    };

    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={disabled || (min !== undefined && value <= min)}
            className="rounded-xl h-12 w-12 border-border/50 bg-background/50 hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0 disabled:opacity-50"
            onClick={handleDecrement}
          >
            <Minus className="w-5 h-5" />
          </Button>
          
          <Input
            ref={ref}
            id={id}
            type="number"
            name={name}
            disabled={disabled}
            onBlur={onBlur}
            className="h-12 text-center text-xl font-black rounded-xl border-border/50 bg-background/50 focus-visible:ring-primary/20"
            value={value}
            onChange={handleInputChange}
            min={min}
            max={max}
          />
          
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={disabled || (max !== undefined && value >= max)}
            className="rounded-xl h-12 w-12 border-border/50 bg-background/50 hover:bg-success/10 hover:text-success transition-colors shrink-0 disabled:opacity-50"
            onClick={handleIncrement}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
        
        {presets && presets.length > 0 && (
          <div className="flex gap-2">
            {presets.map((val) => (
              <Button
                key={val}
                type="button"
                variant="ghost"
                size="sm"
                disabled={
                  disabled ||
                  (min !== undefined && value + val < min) ||
                  (max !== undefined && value + val > max)
                }
                className={cn(
                  'flex-1 h-7 text-[10px] font-black rounded-lg border border-border/50 disabled:opacity-30',
                  val < 0
                    ? 'hover:bg-destructive/5 hover:text-destructive'
                    : 'hover:bg-success/5 hover:text-success'
                )}
                onClick={() => handlePresetClick(val)}
              >
                {val > 0 ? `+${val}` : val}
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

InputFieldStepper.displayName = 'InputFieldStepper';

export default InputFieldStepper;
