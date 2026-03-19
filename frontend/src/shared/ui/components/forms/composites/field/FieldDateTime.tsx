
import { InputFieldDateTime } from '../../inputs/datetime/InputFieldDateTime';
import { FieldLayout } from '../../core/FieldLayout';
import type { FieldStatus } from '../../core/FieldControl';

interface FieldDateTimeProps {
  label?: string;
  description?: string;
  status?: FieldStatus;
  statusMessage?: string;
  isLoading?: boolean;
  required?: boolean;
  disabled?: boolean;
  
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  
  id?: string;
  className?: string;
}

export function FieldDateTime({
  label,
  description,
  status = 'default',
  statusMessage,
  isLoading,
  required,
  disabled,
  value,
  onChange = () => {},
  placeholder,
  id,
  className,
}: FieldDateTimeProps) {
  return (
    <FieldLayout
      id={id}
      label={label}
      description={description}
      required={required}
      isLoading={isLoading}
      status={status}
      statusMessage={statusMessage}
      className={className}
    >
      <InputFieldDateTime
        id={id}
        value={value || null}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        hasError={status === 'error'}
        className={className}
      />

    </FieldLayout>
  );
}

export default FieldDateTime;
