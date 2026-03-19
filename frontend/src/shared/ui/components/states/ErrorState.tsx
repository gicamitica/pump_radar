/**
 * ErrorState Component
 * 
 * Displays an error state with icon, title, description, and optional retry action.
 * Used for failed API calls, validation errors, or any error scenarios.
 * 
 * @example
 * <ErrorState
 *   error={new Error('Failed to load')}
 *   title="Unable to load data"
 *   onRetry={() => refetch()}
 * />
 */

import { useTranslation } from 'react-i18next';
import { AlertCircle, RefreshCw, type LucideIcon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { StateContainer, type StateContainerProps } from './StateContainer';
import { StateIcon, type StateVariant } from './StateIcon';

export interface ErrorStateProps {
  /** The error object */
  error?: Error | null;
  /** Error title - defaults to translated common error title */
  title?: string;
  /** Error description - defaults to error.message or translated description */
  description?: string;
  /** Custom icon component */
  icon?: LucideIcon;
  /** Retry callback - shows retry button when provided */
  onRetry?: () => void;
  /** Retry button text */
  retryText?: string;
  /** Additional className for the container */
  className?: string;
  /** Size variant */
  size?: StateContainerProps['size'];
  /** Icon variant - defaults to 'error' */
  variant?: StateVariant;
}

export function ErrorState({ 
  error,
  title,
  description,
  icon = AlertCircle,
  onRetry,
  retryText,
  className,
  size,
  variant = 'error',
}: ErrorStateProps) {
  const { t } = useTranslation('common');
  
  const displayTitle = title ?? t('async.errorTitle', 'Something went wrong');
  const displayDescription = description ?? error?.message ?? t('async.errorDescription', 'An unexpected error occurred');
  const displayRetryText = retryText ?? t('async.retry', 'Try Again');

  return (
    <StateContainer className={className} size={size}>
      <StateIcon icon={icon} variant={variant} />
      <h3 className="text-lg font-semibold mb-2">{displayTitle}</h3>
      <p className="text-muted-foreground text-sm max-w-sm">{displayDescription}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="mt-6 gap-2">
          <RefreshCw className="h-4 w-4" />
          {displayRetryText}
        </Button>
      )}
    </StateContainer>
  );
}

export default ErrorState;
