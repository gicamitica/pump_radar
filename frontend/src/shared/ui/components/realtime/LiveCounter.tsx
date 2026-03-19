/**
 * LiveCounter Component
 * 
 * A reusable animated counter component for displaying realtime numeric values.
 * Uses react-countup for smooth speedometer-like animations.
 */

import CountUp from 'react-countup';
import { cn } from '@/shadcn/lib/utils';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface LiveCounterProps {
  /** Current value to display */
  value: number | null;
  /** Previous value for animation start point */
  previousValue?: number | null;
  /** Trend direction */
  trend?: 'up' | 'down' | 'stable';
  /** Animation duration in seconds */
  duration?: number;
  /** Number of decimal places */
  decimals?: number;
  /** Prefix to display before the number */
  prefix?: string;
  /** Suffix to display after the number */
  suffix?: string;
  /** Separator for thousands */
  separator?: string;
  /** Custom class name for the counter */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Show trend indicator */
  showTrend?: boolean;
  /** Custom trend colors */
  trendColors?: {
    up?: string;
    down?: string;
    stable?: string;
  };
}

const sizeClasses = {
  sm: 'text-2xl',
  md: 'text-3xl',
  lg: 'text-4xl',
  xl: 'text-5xl',
};

const defaultTrendColors = {
  up: 'text-green-500',
  down: 'text-red-500',
  stable: 'text-muted-foreground',
};

export function LiveCounter({
  value,
  previousValue,
  trend = 'stable',
  duration = 1,
  decimals = 0,
  prefix = '',
  suffix = '',
  separator = ',',
  className,
  size = 'lg',
  showTrend = true,
  trendColors = defaultTrendColors,
}: LiveCounterProps) {
  const displayValue = value ?? 0;
  const startValue = previousValue ?? displayValue;
  
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trendColors[trend] ?? defaultTrendColors[trend];

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <motion.div
        key={displayValue}
        initial={{ scale: 0.95, opacity: 0.8 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'font-bold tabular-nums',
          sizeClasses[size]
        )}
      >
        <CountUp
          start={startValue}
          end={displayValue}
          duration={duration}
          decimals={decimals}
          prefix={prefix}
          suffix={suffix}
          separator={separator}
          preserveValue
          useEasing
        />
      </motion.div>
      
      {showTrend && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn('flex items-center gap-1', trendColor)}
        >
          <TrendIcon className="h-4 w-4" />
          <span className="text-sm font-medium capitalize">{trend}</span>
        </motion.div>
      )}
    </div>
  );
}
