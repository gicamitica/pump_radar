import React, { useId } from 'react';
import InputFieldText from '@/components/forms/inputs/InputFieldText';
import { cn } from '@/shadcn/lib/utils';
import type { FieldStatus } from '../../core/FieldControl';
import { FieldLayout } from '../../core/FieldLayout';

interface FieldTextProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  icon?: React.ReactNode;
  status?: FieldStatus;
  statusMessage?: string;
  isLoading?: boolean;
  required?: boolean;
}

const FieldText: React.FC<FieldTextProps> = ({
  id,
  label,
  description,
  icon,
  className,
  status = 'default',
  statusMessage,
  isLoading,
  required,
  ...rest
}) => {
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
      className={className}
    >
      {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
      <InputFieldText id={inputId} {...rest} className={cn(icon && "pl-9")} />
    </FieldLayout>
  );
};

export default FieldText;
