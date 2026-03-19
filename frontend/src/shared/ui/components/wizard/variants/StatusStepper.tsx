import type { ReactElement } from 'react';
import { cn } from '@/shadcn/lib/utils';
import { cva } from 'class-variance-authority';
import { Check, Circle } from 'lucide-react';
import type { WizardStep, WizardStepStatus, WizardStepperSize } from '../types';

export type StatusStepperProps = {
  steps: WizardStep<any>[];
  activeStepId: string;
  getStepStatus: (id: string) => WizardStepStatus;
  canGoTo: (id: string) => boolean;
  goTo: (id: string) => void | Promise<void>;
  size?: WizardStepperSize;
  className?: string;
};

const sizeClasses = {
  sm: { dot: 'w-6 h-6', icon: 'h-3 w-3', title: 'text-xs', stepLabel: 'text-[9px]', gap: 'min-h-[40px]' },
  md: { dot: 'w-7 h-7', icon: 'h-4 w-4', title: 'text-sm', stepLabel: 'text-[10px]', gap: 'min-h-[50px]' },
  lg: { dot: 'w-8 h-8', icon: 'h-5 w-5', title: 'text-base', stepLabel: 'text-[11px]', gap: 'min-h-[60px]' },
};

const dotVariants = cva(
  "shrink-0 rounded-full border-2 flex items-center justify-center bg-background z-10 transition-colors",
  {
    variants: {
      status: {
        active: "border-primary text-primary",
        completed: "border-slate-500 text-slate-500", // Dark grey for completed
        inactive: "border-muted text-muted-foreground",
        error: "border-destructive text-destructive",
      }
    },
    defaultVariants: { status: "inactive" }
  }
);

const lineVariants = cva(
  "w-0.5 grow my-1 rounded-full transition-colors",
  {
    variants: {
      status: {
        active: "bg-muted",
        primary: "bg-primary",
        completed: "bg-slate-500",
        inactive: "bg-muted",
        error: "bg-muted",
      }
    },
    defaultVariants: { status: "inactive" }
  }
);

const contentVariants = cva(
  "font-semibold leading-tight",
  {
    variants: {
      status: {
        active: "text-foreground",
        completed: "text-slate-600 dark:text-slate-400",
        inactive: "text-muted-foreground",
        error: "text-destructive",
      }
    },
    defaultVariants: { status: "inactive" }
  }
);

export function StatusStepper({
  steps,
  activeStepId,
  getStepStatus,
  canGoTo,
  goTo,
  size = 'md',
  className,
}: StatusStepperProps): ReactElement {
  const s = sizeClasses[size];

  return (
    <div className={cn('w-fit', className)}>
      <div className="flex flex-col">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const clickable = canGoTo(step.id);
          const isActive = step.id === activeStepId;
          const isComplete = status === 'complete';
          const isLast = index === steps.length - 1;

          // Determine visual status
          let visualStatus: 'active' | 'completed' | 'error' | 'inactive' = 'inactive';
          if (isActive) visualStatus = 'active';
          else if (isComplete) visualStatus = 'completed';
          else if (status === 'error') visualStatus = 'error';

          // Line status logic
          const activeIndex = steps.findIndex(s => s.id === activeStepId);
          let lineStatus: 'primary' | 'completed' | 'inactive' = 'inactive';

          if (index < activeIndex) {
              lineStatus = 'primary';
          } else {
              const nextStatus = index < steps.length - 1 ? getStepStatus(steps[index + 1].id) : undefined;
              if (nextStatus === 'complete' || nextStatus === 'active') { // connecting to a step that is done/active
                  lineStatus = 'completed';
              }
          }

          return (
            <div key={step.id} className="flex relative">
              {/* Left Column: Dot + Line */}
              <div className="flex flex-col items-center mr-4">
                {/* Dot */}
                <div className={cn(
                  dotVariants({ status: visualStatus }),
                  s.dot
                )}>
                  {isComplete ? (
                    <Check className={s.icon} />
                  ) : isActive ? (
                     <Circle className={cn(s.icon, "fill-current")} />
                  ) : (
                    <span className={cn("w-2 h-2 rounded-full bg-current opacity-50")} />
                  )}
                </div>

                {/* Line */}
                {!isLast && (
                  <div className={cn(
                    lineVariants({ status: lineStatus }),
                    s.gap
                  )} />
                )}
              </div>

              {/* Right Column: Content */}
              <div className={cn("pb-8 pt-0.5", isLast && "pb-0")}>
                <button
                   type="button"
                   disabled={!clickable}
                   onClick={clickable ? () => void goTo(step.id) : undefined}
                   className={cn(
                     "text-left transition-opacity",
                     clickable ? "cursor-pointer hover:opacity-80" : "cursor-default"
                   )}
                >
                  <p className={cn("font-semibold uppercase tracking-wider opacity-60 mb-0.5", s.stepLabel)}>
                    Step {index + 1}
                  </p>
                  <h6 className={cn(contentVariants({ status: visualStatus }), s.title)}>
                    {step.title}
                  </h6>
                  {step.description && (
                    <p className={cn("text-xs text-muted-foreground mt-0.5")}>
                       {step.description}
                    </p>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
