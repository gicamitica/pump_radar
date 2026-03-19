import type { ReactElement } from 'react';
import { cn } from '@/shadcn/lib/utils';
import { useWizard } from './WizardContext';

export type WizardContentProps = {
  className?: string;
};

export function WizardContent({ className }: WizardContentProps): ReactElement | null {
  const { activeStep, values, setValues, errors, isBusy, next, previous, goTo, skip, finish } = useWizard();

  if (!activeStep) return null;

  return (
    <div className={cn('py-6', className)}>
      {activeStep.render({
        values,
        setValues,
        errors,
        activeStepId: activeStep.id,
        isBusy,
        next,
        previous,
        goTo,
        skip,
        finish,
      })}
    </div>
  );
}

export default WizardContent;
