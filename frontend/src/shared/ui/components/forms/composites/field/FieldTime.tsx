
import { InputFieldTime } from '../../inputs/datetime/InputFieldTime';
import { FieldLayout } from '../../core/FieldLayout';
import type { FieldStatus } from '../../core/FieldControl';

interface FieldTimeProps {
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
  minuteStep?: number;
  
  id?: string;
  className?: string;
}

export function FieldTime({
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
  minuteStep,
  id,
  className,
}: FieldTimeProps) {
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
      <InputFieldTime
        value={value || null}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        minuteStep={minuteStep}
        hasError={status === 'error'}
      />
    </FieldLayout>
  );
}

export default FieldTime;
