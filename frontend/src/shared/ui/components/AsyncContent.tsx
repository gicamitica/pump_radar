/**
 * AsyncContent Component
 * 
 * A compound component for handling async data states (loading, error, empty, success).
 * Provides consistent UI patterns across the application for data fetching scenarios.
 * 
 * @example
 * // Basic usage with array data
 * <AsyncContent
 *   isLoading={isLoading}
 *   error={error}
 *   data={items}
 *   loadingFallback={<MySkeleton />}
 *   errorConfig={{ title: t('errors.loadFailed'), icon: FolderIcon }}
 *   emptyConfig={{ title: t('empty.title'), description: t('empty.description') }}
 * >
 *   {(items) => <MyList items={items} />}
 * </AsyncContent>
 * 
 * @example
 * // With single item (non-array)
 * <AsyncContent
 *   isLoading={isLoading}
 *   error={error}
 *   data={user}
 *   isEmpty={!user}
 * >
 *   {(user) => <UserProfile user={user} />}
 * </AsyncContent>
 */

import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';
import { 
  ErrorState as ErrorStateComponent, 
  EmptyState as EmptyStateComponent,
} from './states';

// ============================================================================
// Types
// ============================================================================

export interface ErrorConfig {
  /** Error title text */
  title?: string;
  /** Error description - if not provided, uses error.message */
  description?: string;
  /** Custom icon component */
  icon?: LucideIcon;
  /** Retry callback */
  onRetry?: () => void;
  /** Retry button text */
  retryText?: string;
}

export interface EmptyConfig {
  /** Empty state title */
  title?: string;
  /** Empty state description */
  description?: string;
  /** Custom icon component */
  icon?: LucideIcon;
  /** Primary action button */
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
}

export interface AsyncContentProps<T> {
  /** Loading state flag */
  isLoading: boolean;
  /** Error object (if any) */
  error?: Error | null;
  /** The data to render */
  data: T;
  /** 
   * Custom empty check function. 
   * If not provided, checks if data is an empty array.
   * For non-array data, you must provide this.
   */
  isEmpty?: boolean | ((data: T) => boolean);
  /** Content to show while loading */
  loadingFallback: ReactNode;
  /** Error state configuration */
  errorConfig?: ErrorConfig;
  /** Empty state configuration */
  emptyConfig?: EmptyConfig;
  /** Render function for success state */
  children: (data: T) => ReactNode;
  /** Additional className for the container */
  className?: string;
}


// ============================================================================
// Main AsyncContent Component
// ============================================================================

export function AsyncContent<T>({
  isLoading,
  error,
  data,
  isEmpty,
  loadingFallback,
  errorConfig,
  emptyConfig,
  children,
  className,
}: AsyncContentProps<T>) {
  // Loading state
  if (isLoading) {
    return <div className={className}>{loadingFallback}</div>;
  }

  // Error state
  if (error) {
    return (
      <ErrorStateComponent
        error={error}
        title={errorConfig?.title}
        description={errorConfig?.description}
        icon={errorConfig?.icon}
        onRetry={errorConfig?.onRetry}
        retryText={errorConfig?.retryText}
        className={className}
      />
    );
  }

  // Determine if data is empty
  const isDataEmpty = typeof isEmpty === 'function' 
    ? isEmpty(data)
    : typeof isEmpty === 'boolean'
      ? isEmpty
      : Array.isArray(data) && data.length === 0;

  // Empty state
  if (isDataEmpty) {
    return (
      <EmptyStateComponent
        title={emptyConfig?.title}
        description={emptyConfig?.description}
        icon={emptyConfig?.icon}
        action={emptyConfig?.action}
        className={className}
      />
    );
  }

  // Success state - render children with data
  return <>{children(data)}</>;
}

export default AsyncContent;
