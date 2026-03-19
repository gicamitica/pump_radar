import type { ReactNode } from 'react';
import { cn } from '@/shadcn/lib/utils';

export type MetricProgressValuePosition = 'top-right' | 'top-center' | 'inline-right' | 'none';

export interface MetricProgressBarProps {
  /** Current value, typically a percentage */
  value: number;
  /** Optional max value, used to compute percentage. Defaults to 100. */
  max?: number;
  /** Optional label rendered on the left when using inline-right layout. */
  label?: ReactNode;
  /** Whether to show the numeric value label. Defaults to true. */
  showValue?: boolean;
  /** Layout / position of the numeric value relative to the bar. */
  valuePosition?: MetricProgressValuePosition;
  /** Optional custom formatter for the numeric label. Receives computed percentage. */
  formatValue?: (percent: number) => ReactNode;
  /** Visual size of the bar. */
  size?: 'sm' | 'md';
  /** Tailwind classes applied to the track (background) element. */
  trackClassName?: string;
  /** Tailwind classes applied to the filled portion of the bar. */
  indicatorClassName?: string;
  /** Wrapper classes for the whole component. Controls width, alignment, etc. */
  className?: string;
  /** Additional classes for the label text. */
  labelClassName?: string;
  /** Additional classes for the value text. */
  valueClassName?: string;
}

export function MetricProgressBar({
  value,
  max = 100,
  label,
  showValue = true,
  valuePosition = 'top-right',
  formatValue,
  size = 'sm',
  trackClassName,
  indicatorClassName,
  className,
  labelClassName,
  valueClassName,
}: MetricProgressBarProps) {
  const safeMax = max <= 0 ? 100 : max;
  const percent = Math.max(0, Math.min(100, (value / safeMax) * 100));

  const displayValue: ReactNode = formatValue
    ? formatValue(percent)
    : `${Math.round(percent)}%`;

  const valueNode = showValue ? (
    <span
      className={cn('text-xs font-semibold text-foreground', valueClassName)}
    >
      {displayValue}
    </span>
  ) : null;

  let header: ReactNode = null;

  if (valuePosition === 'inline-right' && (label || valueNode)) {
    header = (
      <div className="mb-1 flex items-center justify-between gap-2">
        {label && (
          <div
            className={cn('text-sm text-foreground', labelClassName)}
          >
            {label}
          </div>
        )}
        {valueNode}
      </div>
    );
  } else if (valuePosition === 'top-center' && valueNode) {
    header = <div className="mb-1 flex justify-center">{valueNode}</div>;
  } else if (valuePosition === 'top-right' && valueNode) {
    header = <div className="mb-1 flex justify-end">{valueNode}</div>;
  }

  return (
    <div className={cn('w-full', className)}>
      {header}
      <div
        className={cn(
          'relative overflow-hidden rounded-full bg-muted',
          size === 'sm' ? 'h-1.5' : 'h-2',
          trackClassName,
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all',
            indicatorClassName ?? 'bg-primary',
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
