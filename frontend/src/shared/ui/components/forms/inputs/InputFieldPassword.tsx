import React, { useId } from 'react';
import InputFieldText from '@/components/forms/inputs/InputFieldText';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';

export interface InputFieldPasswordProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showStrengthMeter?: boolean;
  hasError?: boolean;
}

const checkStrength = (pass: string) => {
  if (!pass) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pass.length >= 8) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[a-z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  
  if (score <= 2) return { score, label: 'Weak', color: 'bg-destructive' };
  if (score <= 3) return { score, label: 'Fair', color: 'bg-warning' };
  if (score <= 4) return { score, label: 'Good', color: 'bg-info' };
  return { score, label: 'Strong', color: 'bg-success' };
};

export const InputFieldPassword = React.forwardRef<HTMLInputElement, InputFieldPasswordProps>(
  ({ 
    id, 
    className, 
    hasError,
    showStrengthMeter, 
    onChange, 
    value,
    ...rest 
  }, ref) => {
    const [visible, setVisible] = React.useState(false);
    const autoId = useId();
    const inputId = id ?? autoId;
    
    // Internal state for strength meter in uncontrolled mode
    const [internalValue, setInternalValue] = React.useState((value as string) || '');

    // Sync internal state with prop value if controlled
    React.useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value);
      }
    }, [value]);

    // Handle change to update strength meter while preserving external onChange
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value);
      onChange?.(e);
    };

    const strength = showStrengthMeter ? checkStrength(internalValue) : null;

    return (
      <div className="w-full">
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" aria-hidden />
          <InputFieldText
            ref={ref}
            id={inputId}
            type={visible ? 'text' : 'password'}
            className={cn("pl-9", !hasError ? 'pr-9' : 'pr-14', className)}
            onChange={handleChange}
            value={value}
            {...rest}
          />
          <button
            type="button"
            aria-label={visible ? 'Hide password' : 'Show password'}
            onClick={() => setVisible(v => !v)}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-slate-700 transition-all",
              !hasError ? 'right-3' : 'right-7',
            )}
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        
        {showStrengthMeter && internalValue && strength && (
          <div className="space-y-1 mt-2">
            <div className="flex gap-1 h-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div 
                  key={i}
                  className={cn(
                    'flex-1 rounded-full transition-colors',
                    i <= strength.score ? strength.color : 'bg-muted'
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-right w-full">
              {strength.label}
            </p>
          </div>
        )}
      </div>
    );
  }
);

InputFieldPassword.displayName = 'InputFieldPassword';
