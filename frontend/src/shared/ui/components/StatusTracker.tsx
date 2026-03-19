import { cn } from '@/shadcn/lib/utils';
import { CheckCircle2, Circle } from 'lucide-react';

export interface StatusStep {
  id: string;
  label: string;
  status: 'complete' | 'current' | 'upcoming';
}

interface StatusTrackerProps {
  steps: StatusStep[];
  className?: string;
}

/**
 * StatusTracker - A horizontal stepped progress tracker with labels and icons.
 * Commonly used for orders, shipment tracking, or multi-stage processes.
 * 
 * Each step is represented by a segment in a progress bar and a label with an icon below it.
 */
export function StatusTracker({ steps, className }: StatusTrackerProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Progress Bars Row */}
      <div className="flex w-full gap-2 mb-4">
        {steps.map((step) => (
          <div
            key={`bar-${step.id}`}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all duration-500",
              step.status === 'complete' ? "bg-emerald-500" :
              step.status === 'current' ? "bg-emerald-500" : // "current" also shows as filled in the segment
              "bg-muted-foreground/20"
            )}
          />
        ))}
      </div>

      {/* Labels and Icons Row */}
      <div className="flex w-full justify-between px-1">
        {steps.map((step) => {
          const isComplete = step.status === 'complete';
          const isCurrent = step.status === 'current';
          
          return (
            <div 
              key={`label-${step.id}`} 
              className={cn(
                "flex items-center gap-2 transition-colors duration-300",
                isComplete || isCurrent ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {isComplete || isCurrent ? (
                <CheckCircle2 className={cn("h-4 w-4", isComplete || isCurrent ? "text-emerald-500" : "text-muted-foreground")} />
              ) : (
                <Circle className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StatusTracker;
