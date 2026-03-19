/**
 * StateIcon Component
 * 
 * Icon container for state components with variant-based styling.
 */

import { type LucideIcon } from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';

export type StateVariant = 'error' | 'warning' | 'success' | 'info' | 'empty';

export interface StateIconProps {
  icon: LucideIcon;
  variant?: StateVariant;
  /** Size of the icon container */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantClasses: Record<StateVariant, { container: string; icon: string }> = {
  error: {
    container: 'bg-destructive/10',
    icon: 'text-destructive',
  },
  warning: {
    container: 'bg-amber-500/10',
    icon: 'text-amber-600 dark:text-amber-500',
  },
  success: {
    container: 'bg-green-500/10',
    icon: 'text-green-600 dark:text-green-500',
  },
  info: {
    container: 'bg-blue-500/10',
    icon: 'text-blue-600 dark:text-blue-500',
  },
  empty: {
    container: 'bg-muted',
    icon: 'text-muted-foreground',
  },
};

const sizeClasses = {
  sm: { container: 'h-12 w-12', icon: 'h-6 w-6' },
  md: { container: 'h-16 w-16', icon: 'h-8 w-8' },
  lg: { container: 'h-20 w-20', icon: 'h-10 w-10' },
} as const;

export function StateIcon({ 
  icon: Icon, 
  variant = 'empty',
  size = 'md',
  className,
}: StateIconProps) {
  const variantStyles = variantClasses[variant];
  const sizeStyles = sizeClasses[size];

  return (
    <div className={cn(
      'rounded-full flex items-center justify-center mb-4',
      sizeStyles.container,
      variantStyles.container,
      className
    )}>
      <Icon className={cn(
        sizeStyles.icon,
        variantStyles.icon
      )} />
    </div>
  );
}

export default StateIcon;
