import type { ReactElement } from 'react';
import { cn } from '@/shadcn/lib/utils';
import { cva } from 'class-variance-authority';
import type { WizardStep, WizardStepStatus, WizardStepperSize } from '../types';

export type IconUnderlineStepperProps = {
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
  sm: { iconBox: 'w-8 h-8', icon: 'h-4 w-4', title: 'text-xs', desc: 'text-[10px]' },
  md: { iconBox: 'w-10 h-10', icon: 'h-5 w-5', title: 'text-sm', desc: 'text-xs' },
  lg: { iconBox: 'w-12 h-12', icon: 'h-6 w-6', title: 'text-base', desc: 'text-sm' },
};

function getStatusLabel(status: WizardStepStatus): string {
  if (status === 'complete') return 'Completed';
  if (status === 'active') return 'In Progress';
  if (status === 'error') return 'Error';
  return 'Pending';
}

const iconContainerVariants = cva(
  "shrink-0 flex items-center justify-center rounded-full transition-all duration-300 border-2",
  {
    variants: {
      status: {
        active: "bg-primary/10 border-primary ring-4 ring-primary/15 text-primary",
        completed: "bg-slate-500 border-slate-500 text-white", // Dark grey solid for completed
        inactive: "bg-muted border-transparent text-muted-foreground",
        error: "bg-destructive/15 border-destructive text-destructive",
      }
    },
    defaultVariants: { status: "inactive" }
  }
);

const textVariants = cva(
  "",
  {
    variants: {
      status: {
        active: "text-primary",
        completed: "text-slate-600 dark:text-slate-400",
        inactive: "text-muted-foreground",
        error: "text-destructive",
      }
    },
    defaultVariants: {
      status: "inactive"
    }
  }
);

export function IconUnderlineStepper({
  steps,
  activeStepId,
  getStepStatus,
  canGoTo,
  goTo,
  size = 'md',
  className,
  labels,
  mobileLabels,
}: IconUnderlineStepperProps): ReactElement {
  const s = sizeClasses[size];
  const activeIndex = steps.findIndex((step) => step.id === activeStepId);
  
  // Progress calculation:
  // Reflects "Completed Steps" or "Start of Current Step".
  // Using activeIndex directly means:
  // Step 1 (idx 0) -> 0% filled.
  // Step 2 (idx 1) -> 1/N filled (covers first step).
  // This matches the "one step ahead" fix request.
  const progressPercent = activeIndex >= 0 ? (activeIndex / (steps.length)) * 100 : 0;

  return (
    <div className={cn('min-w-full w-max flex flex-col p-2', className)}>
      {/* Continuous Progress Bar Track */}
      <div className="relative w-full h-1.5 rounded-full bg-accent/50 mb-4 overflow-hidden">
        {/* Animated Indicator */}
        <div 
          className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-in-out rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Steps Content */}
      <div className="min-w-full w-max flex items-start gap-x-4">
        {steps.map((step) => {
          const status = getStepStatus(step.id);
          const clickable = canGoTo(step.id);
          const isActive = step.id === activeStepId;
          const isComplete = status === 'complete';
          const isError = status === 'error';

          const currentTitle = labels?.[step.id] ?? step.title;
          const mobileTitle = mobileLabels?.[step.id];

          // Determine visual status from stepper logic
          let visualStatus: 'active' | 'completed' | 'error' | 'inactive' = 'inactive';
          if (isActive) visualStatus = 'active';
          else if (isComplete) visualStatus = 'completed';
          else if (isError) visualStatus = 'error';

          return (
            <div key={step.id} className="flex flex-col group flex-1 min-w-[80px]">
              <button
                type="button"
                disabled={!clickable}
                onClick={clickable ? () => void goTo(step.id) : undefined}
                className={cn(
                  "flex items-center text-left transition-opacity gap-3 pt-1",
                  clickable ? "cursor-pointer hover:opacity-80" : "cursor-default"
                )}
              >
                <div className={cn(s.iconBox, iconContainerVariants({ status: visualStatus }))}>
                  {step.icon || <div className="w-2 h-2 bg-current rounded-full" />}
                </div>
                <div className="hidden md:flex flex-col">
                  {/* Title: Uses variants for Active/Completed/Inactive colors */}
                  <span className={cn("font-semibold leading-tight", s.title, textVariants({ status: visualStatus }))}>
                    {currentTitle}
                  </span>
                  
                  {/* Description: Always muted, regardless of status */}
                  <span className={cn("font-medium mt-0.5 text-muted-foreground", s.desc)}>
                    {step.description || getStatusLabel(status)}
                  </span>
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
    </div>
  );
}
