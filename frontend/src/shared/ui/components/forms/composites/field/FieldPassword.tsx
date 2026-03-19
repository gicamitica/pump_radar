import React, { useId } from 'react';
import { InputFieldPassword } from '@/components/forms/inputs/InputFieldPassword';
import type { FieldStatus } from '../../core/FieldControl';
import { cn } from '@/shadcn/lib/utils';
import { FieldLayout } from '../../core/FieldLayout';

interface FieldPasswordProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  status?: FieldStatus;
  statusMessage?: string;
  isLoading?: boolean;
  showStrengthMeter?: boolean;
  required?: boolean;
}

const FieldPassword = React.forwardRef<HTMLInputElement, FieldPasswordProps>(
  ({ 
    id, 
    label = 'Password',
    description,
    className, 
    status = 'default', 
    statusMessage, 
    isLoading,
    required,
    showStrengthMeter, 
    value,
    onChange, 
    ...rest 
  }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;

    return (
      <FieldLayout
        id={inputId}
        label={label}
        description={description}
        required={required}
        isLoading={isLoading}
        status={status}
        statusMessage={statusMessage}
        className={cn("gap-1.5", className)}
      >
        <InputFieldPassword
          ref={ref}
          id={inputId}
          showStrengthMeter={showStrengthMeter}
          hasError={status !== 'default'}
          value={value as string}
          onChange={onChange}
          {...rest}
        />
      </FieldLayout>
    );
  }
);

FieldPassword.displayName = 'FieldPassword';

export default FieldPassword;
