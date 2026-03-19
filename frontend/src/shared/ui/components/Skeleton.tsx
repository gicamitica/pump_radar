import { Card, CardContent, CardHeader } from '@/shadcn/components/ui/card';
import { cn } from '@/shadcn/lib/utils';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Skeleton - Animated placeholder for loading states
 * 
 * Use this component to show a loading placeholder while content is being fetched.
 * Supports various shapes through className customization.
 */
export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
      style={style}
    />
  );
}

// ============================================================================
// Pre-built skeleton variants for common use cases
// ============================================================================

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

/**
 * SkeletonText - Multiple lines of text skeleton
 */
export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full' // Last line shorter
          )}
        />
      ))}
    </div>
  );
}

interface SkeletonCardProps {
  className?: string;
  showHeader?: boolean;
  showFooter?: boolean;
}

/**
 * SkeletonCard - Card-shaped skeleton with optional header/footer
 */
export function SkeletonCard({ className, showHeader = true, showFooter = false }: SkeletonCardProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-6 space-y-4', className)}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      )}
      <Skeleton className="h-24 w-full" />
      <SkeletonText lines={2} />
      {showFooter && (
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      )}
    </div>
  );
}

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

/**
 * SkeletonTable - Table-shaped skeleton
 */
export function SkeletonTable({ rows = 5, columns = 4, className }: SkeletonTableProps) {
  return (
    <div className={cn('rounded-lg border', className)}>
      {/* Header */}
      <div className="flex gap-4 p-4 border-b bg-muted/50">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4 border-b last:border-b-0">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * SkeletonAvatar - Circular avatar skeleton
 */
export function SkeletonAvatar({ size = 'md', className }: SkeletonAvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  return (
    <Skeleton className={cn('rounded-full', sizeClasses[size], className)} />
  );
}

interface SkeletonListProps {
  items?: number;
  showAvatar?: boolean;
  className?: string;
}

/**
 * SkeletonList - List of items with optional avatars
 */
export function SkeletonList({ items = 5, showAvatar = true, className }: SkeletonListProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          {showAvatar && <SkeletonAvatar size="sm" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * SkeletonDashboard - Full dashboard page skeleton
 */
export function SkeletonDashboard() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} showHeader={false} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonCard className="h-80" />
        <SkeletonCard className="h-80" />
      </div>

      {/* Table */}
      <SkeletonTable rows={5} columns={5} />
    </div>
  );
}

// ============================================================================
// Dashboard-specific skeletons
// ============================================================================

interface SkeletonKpiCardProps {
  showSparkline?: boolean;
  className?: string;
}

/**
 * SkeletonKpiCard - KPI card skeleton matching KpiCard layout
 */
export function SkeletonKpiCard({ showSparkline = true, className }: SkeletonKpiCardProps) {
  return (
    <Card className={cn('rounded-lg border bg-card overflow-hidden', className)}>
      {/* Header */}
      <CardHeader className="p-4 pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      {/* Content */}
      <CardContent className="px-4 pb-4 space-y-2">
        <div className="flex items-baseline justify-between">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
        {showSparkline && <Skeleton className="h-[50px] w-full" />}
      </CardContent>
    </Card>
  );
}

interface SkeletonChartCardProps {
  height?: number;
  className?: string;
}

/**
 * SkeletonChartCard - Chart card skeleton with header and chart area
 */
export function SkeletonChartCard({ height = 320, className }: SkeletonChartCardProps) {
  return (
    <div className={cn('rounded-lg border bg-card', className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
      {/* Chart area */}
      <div className="p-4">
        <Skeleton className="w-full" style={{ height }} />
      </div>
    </div>
  );
}

/**
 * SkeletonHeatmap - Heatmap chart skeleton
 */
export function SkeletonHeatmap({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border bg-card', className)}>
      <div className="p-4 border-b">
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="p-4 space-y-2">
        {/* Grid rows */}
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex gap-1">
            <Skeleton className="h-4 w-10" />
            <div className="flex-1 flex gap-[2px]">
              {Array.from({ length: 24 }).map((_, j) => (
                <Skeleton key={j} className="flex-1 h-6" />
              ))}
            </div>
          </div>
        ))}
        {/* Legend */}
        <div className="flex justify-center gap-2 pt-2">
          <Skeleton className="h-4 w-8" />
          <div className="flex gap-[2px]">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-4" />
            ))}
          </div>
          <Skeleton className="h-4 w-8" />
        </div>
      </div>
    </div>
  );
}

/**
 * SkeletonFunnel - Funnel chart skeleton
 */
export function SkeletonFunnel({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border bg-card', className)}>
      <div className="p-4 border-b">
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="p-4 flex flex-col items-center gap-2">
        {[100, 85, 65, 45, 30].map((width, i) => (
          <Skeleton 
            key={i} 
            className="h-12 rounded-sm" 
            style={{ width: `${width}%` }} 
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Settings-specific skeletons
// ============================================================================

/**
 * SkeletonSettingsSection - Settings section skeleton with header and form fields
 */
export function SkeletonSettingsSection({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border bg-card p-8 space-y-6', className)}>
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-px w-full" /> {/* Separator */}
      {/* Form fields */}
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );
}

/**
 * SkeletonProfileSection - Profile settings skeleton with avatar
 */
export function SkeletonProfileSection({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border bg-card p-8 space-y-6', className)}>
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-px w-full" />
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <Skeleton className="h-px w-full" />
      {/* Form fields - 2 columns */}
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      {/* Bio field */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-24 w-full" />
      </div>
      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );
}

/**
 * SkeletonInfoCard - InfoCard skeleton for settings toggles
 */
export function SkeletonInfoCard({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 p-4 rounded-lg border bg-card', className)}>
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-6 w-11 rounded-full" />
    </div>
  );
}

/**
 * SkeletonNotificationsSection - Notifications settings skeleton
 */
export function SkeletonNotificationsSection({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border bg-card p-8 space-y-6', className)}>
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-px w-full" />
      {/* Info cards */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonInfoCard key={i} />
        ))}
      </div>
      <Skeleton className="h-px w-full" />
      {/* Quiet hours */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-24" />
        <div className="flex gap-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * SkeletonBillingSection - Billing settings skeleton
 */
export function SkeletonBillingSection({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border bg-card p-8 space-y-6', className)}>
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-px w-full" />
      {/* Plan card */}
      <div className="p-6 rounded-lg border space-y-4">
        <div className="flex justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-px w-full" />
      {/* Payment method */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-32" />
        <div className="flex items-center gap-4 p-4 rounded-lg border">
          <Skeleton className="h-8 w-12 rounded" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
    </div>
  );
}

export default Skeleton;
