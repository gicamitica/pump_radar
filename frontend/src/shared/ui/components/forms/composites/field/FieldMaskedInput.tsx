import React, { useId } from 'react';
import type { FactoryOpts, InputMask } from 'imask';
import { cn } from '@/shadcn/lib/utils';
import { FieldLayout } from '../../core/FieldLayout';
import type { FieldStatus } from '../../core/FieldControl';
import { InputFieldMasked } from '../../inputs/InputFieldMasked';

export interface FieldMaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'defaultValue'> {
  label?: string;
  description?: string;
  icon?: React.ReactNode;
  status?: FieldStatus;
  statusMessage?: string;
  isLoading?: boolean;
  isRequired?: boolean;
  /**
   * The mask configuration. Can be one of the MASK_PRESETS or a custom imask config.
   */
  mask: FactoryOpts;
  /**
   * If true, the value passed to the form will be the unmasked value.
   * Default is true (unmasked value is passed).
   */
  unmask?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

const FieldMaskedInput: React.FC<FieldMaskedInputProps> = ({
  label,
  description,
  icon,
  className,
  id,
  status = 'default',
  statusMessage,
  isLoading,
  isRequired,
  mask,
  unmask = true,
  value,
  onChange,
  ...rest
}) => {
  const autoId = useId();
  const inputId = id ?? autoId;

  // Helper to handle onAccept logic
  const handleAccept = (
    val: string, 
    maskRef: InputMask<FactoryOpts>
  ) => {
    const v = unmask && maskRef ? maskRef.unmaskedValue : val;
    onChange?.(v);
  };

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
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
        
        <InputFieldMasked
          {...rest}
          {...mask}
          id={inputId}
          value={(value ?? '') as string}
          onAccept={(val: string, maskRef: InputMask<FactoryOpts>) => handleAccept(val, maskRef)}
          className={cn(icon && "pl-9")}
        />
    </FieldLayout>
  );
};

export default FieldMaskedInput;
