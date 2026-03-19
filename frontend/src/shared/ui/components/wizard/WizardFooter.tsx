import type { ReactElement } from 'react';
import { cn } from '@/shadcn/lib/utils';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useWizard } from './WizardContext';

export type WizardFooterProps = {
  className?: string;
  cancelLabel?: string;
  previousLabel?: string;
  nextLabel?: string;
  finishLabel?: string;
  skipLabel?: string;
  showCancel?: boolean;
};

export function WizardFooter({
  className,
  cancelLabel = 'Cancel',
  previousLabel = 'Previous',
  nextLabel = 'Next',
  finishLabel = 'Finish',
  skipLabel = 'Skip',
  showCancel = false,
}: WizardFooterProps): ReactElement {
  const { isFirstStep, isLastStep, previous, next, skip, finish, cancel, isBusy, activeStep } = useWizard();

  const canSkip = Boolean(activeStep?.optional);

  return (
    <div className={cn('flex items-center justify-between pt-6 border-t', className)}>
      <div className="flex items-center gap-2">
        {showCancel && (
          <Button type="button" variant="ghost" onClick={cancel} disabled={isBusy}>
            {cancelLabel}
          </Button>
        )}
      </div>
      <div className="flex items-center gap-3">
        {!isFirstStep && (
          <Button type="button" variant="outline" onClick={previous} disabled={isBusy}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            {previousLabel}
          </Button>
        )}
        {canSkip && !isLastStep && (
          <Button type="button" variant="ghost" onClick={() => void skip()} disabled={isBusy}>
            {skipLabel}
          </Button>
        )}
        {isLastStep ? (
          <Button type="button" onClick={() => void finish()} disabled={isBusy}>
            {isBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {finishLabel}
          </Button>
        ) : (
          <Button type="button" onClick={() => void next()} disabled={isBusy}>
            {isBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {nextLabel}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default WizardFooter;
