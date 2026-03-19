import type { ReactElement } from 'react';
import { cn } from '@/shadcn/lib/utils';
import { cva } from 'class-variance-authority';
import { Check } from 'lucide-react';
import type { WizardStep, WizardStepStatus, WizardStepperSize } from '../types';

export type CirclesStepperProps = {
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
  sm: { circle: 'w-8 h-8 text-xs', icon: 'h-4 w-4', title: 'text-xs', desc: 'text-[10px]' },
  md: { circle: 'w-10 h-10 text-sm', icon: 'h-5 w-5', title: 'text-sm', desc: 'text-xs' },
  lg: { circle: 'w-12 h-12 text-base', icon: 'h-6 w-6', title: 'text-base', desc: 'text-sm' },
};

function getStatusLabel(status: WizardStepStatus): string {
  if (status === 'complete') return 'Completed';
  if (status === 'active') return 'In Progress';
  if (status === 'error') return 'Error';
  return 'Pending';
}

const circleVariants = cva(
  "shrink-0 rounded-full flex items-center justify-center font-semibold transition-all duration-200 z-10 border-2",
  {
    variants: {
      status: {
        active: "bg-background text-primary border-primary ring-4 ring-primary/20 ring-offset-1 ring-offset-background",
        completed: "bg-slate-500 text-white border-slate-500", // Dark grey
        inactive: "bg-background text-muted-foreground border-muted-foreground/20",
        error: "bg-destructive text-destructive-foreground border-destructive",
      }
    },
    defaultVariants: {
      status: "inactive"
    }
  }
);

const lineVariants = cva(
  "w-full h-[3px] mx-2 rounded-lg transition-colors duration-200",
  {
    variants: {
      status: {
        active: "bg-muted",
        primary: "bg-primary", // New variant for lines leading to active step
        completed: "bg-slate-500",
        inactive: "bg-muted",
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

export function CirclesStepper({
  steps,
  activeStepId,
  getStepStatus,
  canGoTo,
  goTo,
  size = 'md',
  className,
  labels,
  mobileLabels,
}: CirclesStepperProps): ReactElement {
  const s = sizeClasses[size];

  return (
    <div className={cn('min-w-full w-max flex items-start p-2', className)}>
      {steps.map((step, index) => {
        const status = getStepStatus(step.id);
        const clickable = canGoTo(step.id);
        const isActive = step.id === activeStepId;
        const isLast = index === steps.length - 1;
        const isComplete = status === 'complete';
        const isError = status === 'error';

        const currentTitle = labels?.[step.id] ?? step.title;
        const mobileTitle = mobileLabels?.[step.id];

        // Determine visual status
        let visualStatus: 'active' | 'completed' | 'error' | 'inactive' = 'inactive';
        if (isActive) visualStatus = 'active';
        else if (isComplete) visualStatus = 'completed';
        else if (isError) visualStatus = 'error';

        // Line status logic
        const activeIndex = steps.findIndex(s => s.id === activeStepId);
        let lineStatus: 'primary' | 'completed' | 'inactive' = 'inactive';

        if (index < activeIndex) {
            lineStatus = 'primary';
        } else {
            const nextStatus = index < steps.length - 1 ? getStepStatus(steps[index + 1].id) : undefined;
            if (nextStatus === 'complete' || nextStatus === 'active') {
                lineStatus = 'completed';
            }
        }

        return (
          <div key={step.id} className={cn("flex flex-col min-w-[60px]", isLast ? "flex-none" : "flex-1")}>
            {/* Top Row: Circle + Line */}
            <div className="flex items-center w-full">
              <button
                type="button"
                disabled={!clickable}
                onClick={clickable ? () => void goTo(step.id) : undefined}
                className={cn(
                  circleVariants({ status: visualStatus }),
                  s.circle,
                  clickable ? "cursor-pointer hover:opacity-90" : "cursor-default"
                )}
              >
                {isComplete ? <Check className={s.icon} /> : (index + 1)}
              </button>
              
              {!isLast && (
                <div className={lineVariants({ status: lineStatus })} />
              )}
            </div>

            {/* Bottom Row: Text (Desktop) */}
            <div className="mt-2 pl-1 hidden md:block">
              <h6 className={cn("font-semibold leading-tight", s.title, textVariants({ status: visualStatus }))}>
                {currentTitle}
              </h6>
              {(step.description || status) && (
                <p className={cn("text-muted-foreground mt-0.5", s.desc)}>
                   {step.description || getStatusLabel(status)}
                </p>
              )}
            </div>

            {/* Bottom Row: Text (Mobile) */}
            {mobileTitle && (
              <div className="mt-2 pl-1 md:hidden">
                <h6 className={cn("font-semibold leading-tight", s.title, textVariants({ status: visualStatus }))}>
                  {mobileTitle}
                </h6>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
