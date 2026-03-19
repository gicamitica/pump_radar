import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/shared/ui/shadcn/components/ui/input';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { cn } from '@/shadcn/lib/utils';

export interface TableToolbarProps {
  /** Global search configuration */
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  /** Render filters (usually a set of Select components or a Popover) */
  filters?: React.ReactNode;
  /** Render views (Saved Views component) */
  views?: React.ReactNode;
  /** Render bulk actions (only visible when rows are selected) */
  bulkActions?: React.ReactNode;
  /** Render extra actions (Export, Refresh, Column Visibility, etc.) */
  extraActions?: React.ReactNode;
  /** Optional summary of active filters */
  activeFiltersCount?: number;
  /** Callback to reset all filters */
  onResetFilters?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * TableToolbar - A generic and composable toolbar for data tables.
 * Organizes search, filters, views, bulk actions, and extra actions.
 */
export function TableToolbar({
  search,
  filters,
  views,
  bulkActions,
  extraActions,
  activeFiltersCount,
  onResetFilters,
  className,
}: TableToolbarProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Top Row: Search, Views, and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {views && <div className="flex-shrink-0">{views}</div>}
          
          {search && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={search.placeholder ?? "Search..."}
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {extraActions}
        </div>
      </div>

      {/* Second Row: Filters and Filter Summary */}
      {(filters || (activeFiltersCount !== undefined && activeFiltersCount > 0)) && (
        <div className="flex flex-wrap items-center gap-2">
          {filters}
          
          {activeFiltersCount !== undefined && activeFiltersCount > 0 && onResetFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="text-muted-foreground h-8 px-2 hover:bg-transparent"
            >
              Clear all ({activeFiltersCount})
              <X className="ml-1 h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      {/* Bulk Actions Overlay/Row */}
      {bulkActions && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          {bulkActions}
        </div>
      )}
    </div>
  );
}

export default TableToolbar;
