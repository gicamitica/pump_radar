import React, { useId } from 'react';
import { InputFieldTextarea } from '../../inputs/InputFieldTextarea';
import { FieldLayout } from '../../core/FieldLayout';
import type { FieldStatus } from '../../core/FieldControl';

interface FieldTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  description?: string;
  status?: FieldStatus;
  statusMessage?: string;
  isLoading?: boolean;
  isRequired?: boolean;
}

const FieldTextarea = React.forwardRef<HTMLTextAreaElement, FieldTextareaProps>((
  {
    className,
    label,
    description,
    status = 'default',
    statusMessage,
    isLoading,
    isRequired,
    id,
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
      <InputFieldTextarea
        ref={ref} 
        id={inputId} 
        hasError={status !== 'default'}
        {...rest} 
      />
    </FieldLayout>
  );
});

FieldTextarea.displayName = 'FieldTextarea';

export default FieldTextarea;
