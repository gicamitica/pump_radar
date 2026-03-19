import type { ReactElement } from 'react';
import { cn } from '@/shadcn/lib/utils';
import { cva } from 'class-variance-authority';
import type { WizardStep, WizardStepStatus, WizardStepperSize } from '../types';

export type ChevronStepperProps = {
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
  sm: { height: 'h-[40px]', arrowSize: 'after:h-[40px] after:w-[40px]', title: 'text-xs', desc: 'text-[10px]', padding: 'py-1.5 px-4' },
  md: { height: 'h-[50px]', arrowSize: 'after:h-[50px] after:w-[50px]', title: 'text-sm', desc: 'text-xs', padding: 'py-2 px-6' },
  lg: { height: 'h-[60px]', arrowSize: 'after:h-[60px] after:w-[60px]', title: 'text-base', desc: 'text-sm', padding: 'py-2.5 px-8' },
};

const stepVariants = cva(
  "w-full rounded-md relative transition-colors duration-200 text-left block",
  {
    variants: {
      status: {
        active: "bg-primary text-primary-foreground after:bg-primary",
        completed: "bg-slate-500 text-white after:bg-slate-500", // Completed distinct from active
        inactive: "bg-muted text-muted-foreground after:bg-muted",
        error: "bg-destructive text-destructive-foreground after:bg-destructive",
      },
      clickable: {
        true: "cursor-pointer hover:brightness-95",
        false: "cursor-default",
      },
    },
    defaultVariants: {
      status: "inactive",
      clickable: false,
    },
  }
);

export function ChevronStepper({
  steps,
  activeStepId,
  getStepStatus,
  canGoTo,
  goTo,
  size = 'md',
  className,
  labels,
  mobileLabels,
}: ChevronStepperProps): ReactElement {
  const s = sizeClasses[size];

  return (
    <div className={cn('min-w-full w-max flex md:items-center justify-center flex-col md:flex-row gap-2 md:gap-x-6 overflow-y-hidden', className)}>
      {steps.map((step, index) => {
        const status = getStepStatus(step.id);
        const clickable = canGoTo(step.id);
        const isActive = step.id === activeStepId;
        const isLast = index === steps.length - 1;

        const currentTitle = labels?.[step.id] ?? step.title;
        const mobileTitle = mobileLabels?.[step.id] ?? currentTitle;

        // Determine visual status
        let visualStatus: 'active' | 'completed' | 'error' | 'inactive' = 'inactive';
        if (isActive) visualStatus = 'active';
        else if (status === 'complete') visualStatus = 'completed';
        else if (status === 'error') visualStatus = 'error';

        return (
          <div 
            key={step.id} 
            className={cn(
              "w-full md:w-auto md:flex-1 overflow-visible md:min-w-[200px] transition-all duration-200", 
              !isLast ? "md:pr-[20px]" : ""
            )}
          >
            <button
              type="button"
              disabled={!clickable}
              onClick={clickable ? () => void goTo(step.id) : undefined}
              className={cn(
                stepVariants({ status: visualStatus, clickable }),
                s.height,
                s.padding,
                // Arrow using rotated pseudo element - Only on MD+
                !isLast && [
                  "md:after:content-[''] md:after:absolute md:after:top-0 md:after:-right-4 md:after:rotate-[45deg] md:after:rounded-sm md:after:z-10",
                  s.arrowSize
                ]
              )}
            >
              <div className="relative z-20 flex flex-col justify-center h-full max-w-[calc(100%-20px)]">
                {/* Desktop Title */}
                <h4 className={cn("hidden md:block font-semibold leading-tight truncate", s.title)}>
                  {currentTitle}
                </h4>
                {/* Mobile Title */}
                <h4 className={cn("md:hidden font-semibold leading-tight truncate", s.title)}>
                  {mobileTitle}
                </h4>

                {step.description && (
                  <p className={cn("truncate opacity-80", s.desc)}>
                    {step.description}
                  </p>
                )}
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
