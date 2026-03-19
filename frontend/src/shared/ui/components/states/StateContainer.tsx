/**
 * StateContainer Component
 * 
 * Base container for state components (error, empty, loading, success, etc.)
 * Provides consistent centering and spacing.
 */

import { type ReactNode } from 'react';
import { cn } from '@/shadcn/lib/utils';

export interface StateContainerProps {
  children: ReactNode;
  className?: string;
  /** Size variant for the container */
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'py-8 px-4',
  md: 'py-16 px-4',
  lg: 'py-24 px-6',
} as const;

export function StateContainer({ 
  children, 
  className,
  size = 'md',
}: StateContainerProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center',
      sizeClasses[size],
      className
    )}>
      {children}
    </div>
  );
}

export default StateContainer;
