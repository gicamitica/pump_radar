import { cn } from '@/shadcn/lib/utils';
import { type CSSProperties } from 'react';

/**
 * Color variant for the progress bar
 */
export type ProgressBarVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info';

/**
 * Props for the SteppedProgressBar component
 */
export interface SteppedProgressBarProps {
  /** Current progress value (0-100) */
  value: number;
  /** Total number of steps to display as indicators */
  steps?: number;
  /** Number of completed steps (used for step indicator styling) */
  completedSteps?: number;
  /** Height of the progress bar */
  height?: 'sm' | 'md' | 'lg';
  /** Color variant - can be explicitly set or auto-determined by value */
  variant?: ProgressBarVariant;
  /** Whether to auto-select variant based on value (0% = danger, 100% = success) */
  autoVariant?: boolean;
  /** Whether to show the shimmer animation */
  animated?: boolean;
  /** Additional class name for the container */
  className?: string;
}

const heightClasses = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

const stepDotSizes = {
  sm: 'h-1 w-1',
  md: 'h-1.5 w-1.5',
  lg: 'h-2 w-2',
};

const variantClasses: Record<ProgressBarVariant, { bar: string; glow: string }> = {
  primary: {
    bar: 'bg-gradient-to-r from-primary to-primary/80',
    glow: 'after:via-white/25',
  },
  success: {
    bar: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
    glow: 'after:via-white/30',
  },
  warning: {
    bar: 'bg-gradient-to-r from-amber-500 to-amber-400',
    glow: 'after:via-white/25',
  },
  danger: {
    bar: 'bg-gradient-to-r from-red-500 to-red-400',
    glow: 'after:via-white/25',
  },
  info: {
    bar: 'bg-gradient-to-r from-blue-500 to-blue-400',
    glow: 'after:via-white/25',
  },
};

/**
 * Determines the appropriate variant based on progress value
 */
function getAutoVariant(value: number): ProgressBarVariant {
  if (value >= 100) return 'success';
  if (value >= 75) return 'primary';
  if (value >= 50) return 'info';
  if (value >= 25) return 'warning';
  return 'danger';
}

/**
 * SteppedProgressBar - A reusable animated progress bar with step indicators
 * 
 * Features:
 * - Multiple color variants (primary, success, warning, danger, info)
 * - Auto-variant mode that changes color based on progress value
 * - Optional step indicators showing discrete progress points
 * - Shimmer animation for visual appeal
 * - Multiple height options
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <SteppedProgressBar value={75} />
 * 
 * // With steps and auto-variant
 * <SteppedProgressBar 
 *   value={percentage} 
 *   steps={5} 
 *   completedSteps={3} 
 *   autoVariant 
 * />
 * 
 * // Explicit variant
 * <SteppedProgressBar value={50} variant="warning" />
 * ```
 */
export function SteppedProgressBar({
  value,
  steps,
  completedSteps = 0,
  height = 'md',
  variant,
  autoVariant = false,
  animated = true,
  className,
}: SteppedProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const effectiveVariant = autoVariant ? getAutoVariant(clampedValue) : (variant ?? 'primary');
  const variantStyle = variantClasses[effectiveVariant];

  return (
    <div 
      className={cn(
        'relative bg-muted rounded-full overflow-hidden',
        heightClasses[height],
        className
      )}
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* Progress fill */}
      <div
        className={cn(
          'absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out',
          variantStyle.bar,
          animated && [
            'after:absolute after:inset-0',
            'after:bg-gradient-to-r after:from-transparent after:to-transparent',
            variantStyle.glow,
            'after:animate-shimmer'
          ]
        )}
        style={{ width: `${clampedValue}%` } as CSSProperties}
      />

      {/* Step indicators */}
      {steps && steps > 0 && (
        <div className="absolute inset-0 flex items-center justify-between px-1">
          {Array.from({ length: steps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'rounded-full transition-all duration-300',
                stepDotSizes[height],
                i < completedSteps
                  ? 'bg-white/80'
                  : 'bg-muted-foreground/20'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
