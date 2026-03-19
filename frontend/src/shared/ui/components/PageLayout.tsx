/**
 * PageLayout Component
 * 
 * A layout wrapper that combines PageHeader with AsyncContent for consistent
 * page structure across the application. Handles loading, error, and empty states
 * while always showing the page header.
 * 
 * @example
 * // Basic usage with async data
 * <PageLayout
 *   title={t('title')}
 *   subtitle={t('description')}
 *   isLoading={isLoading}
 *   error={error}
 *   data={boards}
 *   loadingFallback={<BoardListSkeleton />}
 *   errorConfig={{ title: t('errors.loadFailed'), icon: FolderKanban }}
 *   emptyConfig={{ 
 *     title: t('empty.title'), 
 *     action: { label: t('createBoard'), onClick: handleCreate, icon: Plus }
 *   }}
 * >
 *   {(boards) => <BoardList boards={boards} />}
 * </PageLayout>
 * 
 * @example
 * // With header actions
 * <PageLayout
 *   title="Users"
 *   actions={<Button onClick={handleCreate}>Add User</Button>}
 *   isLoading={isLoading}
 *   error={error}
 *   data={users}
 *   loadingFallback={<UserTableSkeleton />}
 * >
 *   {(users) => <UserTable users={users} />}
 * </PageLayout>
 * 
 * @example
 * // Non-async usage (just layout)
 * <PageLayout title="Settings" subtitle="Manage your preferences">
 *   <SettingsForm />
 * </PageLayout>
 */

import { type ReactNode } from 'react';
import PageHeader, { type PageHeaderProps } from './PageHeader';
import AsyncContent, { type ErrorConfig, type EmptyConfig } from './AsyncContent';
import { cn } from '@/shadcn/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface PageLayoutBaseProps extends PageHeaderProps {
  /** Additional className for the page container */
  className?: string;
  /** Additional className for the content area */
  contentClassName?: string;
  /** Gap between header and content */
  gap?: 'none' | 'sm' | 'md' | 'lg';
}

/** Props for async data handling */
interface PageLayoutAsyncProps<T> extends PageLayoutBaseProps {
  /** Loading state flag */
  isLoading: boolean;
  /** Error object (if any) */
  error?: Error | null;
  /** The data to render */
  data: T;
  /** 
   * Custom empty check. 
   * If not provided, checks if data is an empty array.
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
}

/** Props for non-async (static) content */
interface PageLayoutStaticProps extends PageLayoutBaseProps {
  isLoading?: never;
  error?: never;
  data?: never;
  isEmpty?: never;
  loadingFallback?: never;
  errorConfig?: never;
  emptyConfig?: never;
  /** Static content */
  children: ReactNode;
}

export type PageLayoutProps<T = unknown> = PageLayoutAsyncProps<T> | PageLayoutStaticProps;

// ============================================================================
// Gap utilities
// ============================================================================

const gapClasses = {
  none: 'gap-0',
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
} as const;

// ============================================================================
// Type guard
// ============================================================================

function isAsyncProps<T>(
  props: PageLayoutProps<T>
): props is PageLayoutAsyncProps<T> {
  return 'isLoading' in props && props.isLoading !== undefined;
}

// ============================================================================
// Main Component
// ============================================================================

export function PageLayout<T = unknown>(props: PageLayoutProps<T>) {
  const {
    // PageHeader props
    title,
    subtitle,
    upperTitle,
    backButton,
    actions,
    variant = 'immersive',
    size = '2xl',
    titleClassName,
    subtitleClassName,
    // Layout props
    className,
    contentClassName,
    gap = 'md',
    children,
  } = props;

  return (
    <div className={cn('flex flex-col', gapClasses[gap], className)}>
      {(title || subtitle || backButton || actions || upperTitle) && (
        <PageHeader
          title={title}
          subtitle={subtitle}
          upperTitle={upperTitle}
          backButton={backButton}
          actions={actions}
          variant={variant}
          size={size}
          titleClassName={titleClassName}
          subtitleClassName={subtitleClassName}
        />
      )}

      {isAsyncProps(props) ? (
        <AsyncContent
          isLoading={props.isLoading}
          error={props.error}
          data={props.data}
          isEmpty={props.isEmpty}
          loadingFallback={props.loadingFallback}
          errorConfig={props.errorConfig}
          emptyConfig={props.emptyConfig}
          className={contentClassName}
        >
          {props.children}
        </AsyncContent>
      ) : (
        <div className={contentClassName}>{children as ReactNode}</div>
      )}
    </div>
  );
}

export default PageLayout;
