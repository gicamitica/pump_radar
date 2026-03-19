import React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Checkbox } from '@/shadcn/components/ui/checkbox';
import { Label } from '@/shadcn/components/ui/label';
import { cn } from '@/shadcn/lib/utils';
import FieldControl from '../../core/FieldControl';
import type { FieldStatus } from '../../core/FieldControl';

interface FieldCheckboxProps extends React.ComponentProps<typeof CheckboxPrimitive.Root> {
  children: React.ReactNode;
  className?: string;
  status?: FieldStatus;
  statusMessage?: string;
  successIcon?: React.ReactNode;
  warningIcon?: React.ReactNode;
  errorIcon?: React.ReactNode;
  isRequired?: boolean;
}

const FieldCheckbox: React.FC<FieldCheckboxProps> = ({
  children,
  className,
  status = 'default',
  statusMessage,
  successIcon,
  warningIcon,
  errorIcon,
  isRequired,
  ...rest
}) => (
  <div className={cn('space-y-1', className)}>
    <FieldControl
      status={status}
      statusMessage={statusMessage}
      successIcon={successIcon}
      warningIcon={warningIcon}
      errorIcon={errorIcon}
      applyInputStyles={false}
      showStatusIcon={false}
      className="!space-y-0"
    >
      <Label className="inline-flex items-center gap-2 text-sm select-none">
        <Checkbox {...rest} />
        <span>
          {children}
          {isRequired && <span className="text-destructive ml-1">*</span>}
        </span>
      </Label>
    </FieldControl>
  </div>
);

export default FieldCheckbox;
