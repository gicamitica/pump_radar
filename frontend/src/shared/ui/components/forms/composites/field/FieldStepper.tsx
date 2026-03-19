import React, { useId } from 'react';
import InputFieldStepper from '../../inputs/InputFieldStepper';
import type { FieldStatus } from '../../core/FieldControl';
import { FieldLayout } from '../../core/FieldLayout';

interface FieldStepperProps {
  /** Current value */
  value: number;
  /** Change handler */
  onChange: (value: number) => void;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  /** Label */
  label?: string;
  /** Optional description */
  description?: string;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Step size */
  step?: number;
  /** Quick preset values */
  presets?: number[];
  /** State */
  id?: string;
  status?: FieldStatus;
  statusMessage?: string;
  isLoading?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const FieldStepper: React.FC<FieldStepperProps> = ({
  value,
  onChange,
  onBlur,
  id,
  label,
  description,
  className,
  status = 'default',
  statusMessage,
  isLoading,
  required,
  disabled,
  min,
  max,
  step,
  presets,
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
      <InputFieldStepper 
        id={inputId}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        min={min}
        max={max}
        step={step}
        presets={presets}
        disabled={disabled}
      />
    </FieldLayout>
  );
};

export default FieldStepper;
