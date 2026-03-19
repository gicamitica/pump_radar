import React, { useId } from 'react';
import InputFieldText from '@/components/forms/inputs/InputFieldText';
import { Mail } from 'lucide-react';
import { FieldLayout } from '../../core/FieldLayout';
import type { FieldStatus } from '../../core/FieldControl';

interface FieldEmailProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  status?: FieldStatus;
  statusMessage?: string;
  isLoading?: boolean;
  isRequired?: boolean;
}

const FieldEmail = React.forwardRef<HTMLInputElement, FieldEmailProps>((
  {
    className,
    label,
    description,
    status = 'default',
    statusMessage,
    isLoading,
    id,
    isRequired,
    ...rest
  }, 
  ref
) => {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <FieldLayout
      id={inputId}
      className={className}
      label={label}
      description={description}
      status={status}
      statusMessage={statusMessage}
      isLoading={isLoading}
      required={isRequired}
    >
      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" aria-hidden />
      <InputFieldText 
        ref={ref} 
        id={inputId} 
        type="email" 
        className="pl-9" 
        {...rest} 
      />
    </FieldLayout>
  );
});

FieldEmail.displayName = 'FieldEmail';

export default FieldEmail;
