/**
 * LoadingState Component
 * 
 * Displays a loading state with spinner and optional message.
 * Use this for inline loading indicators. For full-page loading, prefer skeletons.
 * 
 * @example
 * <LoadingState message="Loading your data..." />
 */

import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { StateContainer, type StateContainerProps } from './StateContainer';
import { cn } from '@/shadcn/lib/utils';

export interface LoadingStateProps {
  /** Loading message */
  message?: string;
  /** Additional className for the container */
  className?: string;
  /** Size variant */
  size?: StateContainerProps['size'];
  /** Spinner size */
  spinnerSize?: 'sm' | 'md' | 'lg';
}

const spinnerSizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
} as const;

export function LoadingState({ 
  message,
  className,
  size = 'md',
  spinnerSize = 'md',
}: LoadingStateProps) {
  const { t } = useTranslation('common');
  
  const displayMessage = message ?? t('loading', 'Loading...');

  return (
    <StateContainer className={className} size={size}>
      <Loader2 className={cn(
        'animate-spin text-muted-foreground mb-4',
        spinnerSizeClasses[spinnerSize]
      )} />
      <p className="text-muted-foreground text-sm">{displayMessage}</p>
    </StateContainer>
  );
}

export default LoadingState;
