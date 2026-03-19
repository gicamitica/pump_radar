import React, { useId } from 'react';
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton
} from '@/shared/ui/shadcn/components/ui/input-group';
import { FieldLayout } from '../../core/FieldLayout';
import type { FieldStatus } from '../../core/FieldControl';

interface FieldInputGroupProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  description?: string;
  status?: FieldStatus;
  statusMessage?: string;
  isLoading?: boolean;
  required?: boolean;

  // InputGroup components content
  addonStart?: React.ReactNode;
  addonEnd?: React.ReactNode;

  iconStart?: React.ReactNode;
  iconEnd?: React.ReactNode;

  actionStart?: React.ReactNode;
  actionEnd?: React.ReactNode;
  onActionStartClick?: () => void;
  onActionEndClick?: () => void;
}

const FieldInputGroup: React.FC<FieldInputGroupProps> = ({
  id,
  label,
  description,
  status = 'default',
  statusMessage,
  isLoading,
  required,
  className,
  addonStart,
  addonEnd,
  iconStart,
  iconEnd,
  actionStart,
  actionEnd,
  onActionStartClick,
  onActionEndClick,
  disabled,
  ...inputProps
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
      <InputGroup className={status === 'error' ? 'border-destructive ring-destructive/20 ring-1' : ''}>
        {/* Start Elements */}
        {addonStart && <InputGroupAddon>{addonStart}</InputGroupAddon>}
        {iconStart && <InputGroupAddon>{iconStart}</InputGroupAddon>}
        {actionStart && <InputGroupButton onClick={onActionStartClick} type="button">{actionStart}</InputGroupButton>}

        {/* Input */}
        <InputGroupInput
          id={inputId}
          disabled={disabled}
          {...inputProps}
        />

        {/* End Elements */}
        {actionEnd && <InputGroupButton onClick={onActionEndClick} type="button">{actionEnd}</InputGroupButton>}
        {iconEnd && <InputGroupAddon>{iconEnd}</InputGroupAddon>}
        {addonEnd && <InputGroupAddon>{addonEnd}</InputGroupAddon>}
      </InputGroup>
    </FieldLayout>
  );
};

export default FieldInputGroup;
