import type { ReactElement } from 'react';
import { cn } from '@/shadcn/lib/utils';
import SimpleBar from 'simplebar-react';
import type { WizardStepperSize, WizardStepperVariant } from './types';
import { WizardStepper } from './WizardStepper';

export type WizardHeaderProps = {
  className?: string;
  variant?: WizardStepperVariant;
  size?: WizardStepperSize;
};

export function WizardHeader({ className, variant = 'circles', size = 'md' }: WizardHeaderProps): ReactElement {
  if (variant === 'status') {
    return (
      <div className={className}>
        <WizardStepper variant={variant} size={size} />
      </div>
    );
  }

  return (
    <SimpleBar className={cn('w-full min-w-0', className)}>
      <WizardStepper variant={variant} size={size} />
    </SimpleBar>
  );
}

export default WizardHeader;
