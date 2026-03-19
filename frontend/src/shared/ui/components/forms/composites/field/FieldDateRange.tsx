
import { InputFieldDateRange } from '../../inputs/datetime/InputFieldDateRange';
import { FieldLayout } from '../../core/FieldLayout';
import type { FieldStatus } from '../../core/FieldControl';

interface FieldDateRangeProps {
  label?: string;
  description?: string;
  status?: FieldStatus;
  statusMessage?: string;
  isLoading?: boolean;
  required?: boolean;
  disabled?: boolean;
  
  value?: { from: Date | null; to: Date | null } | null;
  onChange?: (range: { from: Date | null; to: Date | null } | null) => void;
  placeholder?: string;
  
  id?: string;
  className?: string;
}

export function FieldDateRange({
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
}: FieldDateRangeProps) {
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
      <InputFieldDateRange
        id={id}
        value={value || null}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        hasError={status === 'error'}
      />
    </FieldLayout>
  );
}

export default FieldDateRange;
