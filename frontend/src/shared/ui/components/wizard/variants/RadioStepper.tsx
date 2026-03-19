import type { ReactElement } from 'react';
import { cn } from '@/shadcn/lib/utils';
import { cva } from 'class-variance-authority';
import { Check, Circle } from 'lucide-react';
import type { WizardStep, WizardStepStatus, WizardStepperSize } from '../types';

export type RadioStepperProps = {
  steps: WizardStep<any>[];
  activeStepId: string;
  getStepStatus: (id: string) => WizardStepStatus;
  canGoTo: (id: string) => boolean;
  goTo: (id: string) => void | Promise<void>;
  size?: WizardStepperSize;
  className?: string;
  labels?: Record<string, React.ReactNode>;
  mobileLabels?: Record<string, React.ReactNode>;
};

const sizeClasses = {
  sm: { icon: 'h-4 w-4', title: 'text-xs', desc: 'text-[10px]' },
  md: { icon: 'h-5 w-5', title: 'text-sm', desc: 'text-xs' },
  lg: { icon: 'h-6 w-6', title: 'text-base', desc: 'text-sm' },
};

const barVariants = cva(
  "w-full h-1.5 rounded-xl mb-3 transition-colors duration-300",
  {
    variants: {
      status: {
        active: "bg-primary",
        completed: "bg-slate-500", // Dark grey for completed
        inactive: "bg-slate-200 dark:bg-slate-800", // Light grey for inactive
        error: "bg-destructive",
      }
    },
    defaultVariants: {
      status: "inactive"
    }
  }
);

const textVariants = cva(
  "",
  {
    variants: {
      status: {
        active: "text-primary",
        completed: "text-slate-600 dark:text-slate-400", // Dark grey text
        inactive: "text-muted-foreground",
        error: "text-destructive",
      }
    },
    defaultVariants: {
      status: "inactive"
    }
  }
);

export function RadioStepper({
  steps,
  activeStepId,
  getStepStatus,
  canGoTo,
  goTo,
  size = 'md',
  className,
  labels,
  mobileLabels,
}: RadioStepperProps): ReactElement {
  const s = sizeClasses[size];

  return (
    <div className={cn('min-w-full w-max flex items-start gap-x-3', className)}>
      {steps.map((step) => {
        const status = getStepStatus(step.id);
        const clickable = canGoTo(step.id);
        const isActive = step.id === activeStepId;
        const isComplete = status === 'complete';
        const isError = status === 'error';

        const currentTitle = labels?.[step.id] ?? step.title;
        const mobileTitle = mobileLabels?.[step.id];

        // Determine visual status
        let visualStatus: 'active' | 'completed' | 'error' | 'inactive' = 'inactive';
        if (isActive) visualStatus = 'active';
        else if (isComplete) visualStatus = 'completed';
        else if (isError) visualStatus = 'error';

        return (
          <div key={step.id} className="min-w-[80px] flex-1 flex flex-col group">
            {/* Top Bar */}
            <div className={barVariants({ status: visualStatus })} />
            
            {/* Content */}
            <button
              type="button"
              disabled={!clickable}
              onClick={clickable ? () => void goTo(step.id) : undefined}
              className={cn(
                "flex items-center text-left transition-opacity pl-0.5",
                clickable ? "cursor-pointer hover:opacity-80" : "cursor-default"
              )}
            >
              <div className="shrink-0 mr-2.5">
                {isComplete ? (
                   // Filled Dark Circle with Check
                   <div className={cn("rounded-full flex items-center justify-center bg-slate-500 text-white", s.icon)}>
                      <Check className="w-3/5 h-3/5" strokeWidth={3} />
                   </div>
                ) : isActive ? (
                   // Filled Primary Circle with Dot
                   <div className={cn("rounded-full flex items-center justify-center bg-primary text-primary-foreground", s.icon)}>
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                   </div>
                ) : (
                   // Outline Circle
                   <Circle className={cn(s.icon, "text-muted-foreground opacity-50")} strokeWidth={2} />
                )}
              </div>
              <div className="hidden md:flex flex-col">
                <span className={cn("font-semibold leading-tight", s.title, textVariants({ status: visualStatus }))}>
                  {currentTitle}
                </span>
                {/* Description hidden in the image, but good to keep if available/needed. 
                    The image shows single line text. Let's hide description if empty. 
                    Actually, the image has no description text, just labels. 
                    We can keep it but maybe simpler. */}
              </div>

              {/* Mobile Text */}
              {mobileTitle && (
                <div className="md:hidden flex flex-col">
                  <span className={cn("font-semibold leading-tight", s.title, textVariants({ status: visualStatus }))}>
                    {mobileTitle}
                  </span>
                </div>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
