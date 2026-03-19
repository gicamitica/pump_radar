import React from 'react';
import { cn } from '@/shadcn/lib/utils';
import { Input } from '@/shared/ui/shadcn/components/ui/input';
import { Label } from '@/shared/ui/shadcn/components/ui/label';

export interface FieldHelperTextProps {
  id?: string;
  label?: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  placeholder?: string;
  warningThreshold?: number;
  dangerThreshold?: number;
  className?: string;
  inputClassName?: string;
  isRequired?: boolean;
}

export const FieldHelperText: React.FC<FieldHelperTextProps> = ({
  id,
  label,
  value,
  onChange,
  maxLength,
  placeholder,
  warningThreshold = 20,
  dangerThreshold = 10,
  className,
  inputClassName,
  isRequired,
}) => {
  const remaining = Math.max(0, maxLength - value.length);

  const helperClass = cn(
    'text-xs transition-colors duration-200',
    remaining <= dangerThreshold
      ? 'text-destructive'
      : remaining <= warningThreshold
      ? 'text-orange-500'
      : 'text-muted-foreground'
  );

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <Label htmlFor={id} className="text-sm">
          {label}
          {isRequired && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        className={cn('transition-all duration-150', inputClassName)}
      />
      <p className={helperClass}>{remaining} characters remaining</p>
    </div>
  );
};

export default FieldHelperText;
