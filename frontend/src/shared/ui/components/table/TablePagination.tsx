import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shadcn/components/ui/select';
import { Button } from '@/shadcn/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';

export interface TablePaginationProps {
  /** Current page index (0-based) */
  pageIndex: number;
  /** Current page size */
  pageSize: number;
  /** Total number of items (optional for cursor-based pagination) */
  totalCount?: number;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Callback when page changes */
  onPageChange?: (pageIndex: number) => void;
  /** Callback when page size changes */
  onPageSizeChange?: (pageSize: number) => void;
  /** Disable previous button */
  canPreviousPage?: boolean;
  /** Disable next button */
  canNextPage?: boolean;
  /** Custom labels */
  labels?: {
    rowsPerPage?: string;
    page?: string;
    of?: string;
  };
  /** Additional CSS classes */
  className?: string;
}

/**
 * Reusable table pagination component
 * Works with both client-side and server-side pagination
 */
export function TablePagination({
  pageIndex,
  pageSize,
  totalCount,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
  canPreviousPage = pageIndex > 0,
  canNextPage = true,
  labels = {},
  className,
}: TablePaginationProps) {
  const {
    rowsPerPage = 'Rows per page',
    page = 'Page',
    of = 'of',
  } = labels;

  // Calculate total pages if totalCount is provided
  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : undefined;
  const currentPage = pageIndex + 1;

  // Determine if next is disabled
  const isNextDisabled = totalPages ? currentPage >= totalPages : !canNextPage;

  return (
    <div className={cn('flex items-center justify-between gap-4 text-sm', className)}>
      {/* Page size selector */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground whitespace-nowrap">{rowsPerPage}</span>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange?.(parseInt(value, 10))}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Page info and navigation */}
      <div className="flex items-center gap-2">
        {/* Page info */}
        {totalPages !== undefined && (
          <span className="text-muted-foreground whitespace-nowrap">
            {page} {currentPage} {of} {totalPages}
          </span>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange?.(pageIndex - 1)}
            disabled={!canPreviousPage}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange?.(pageIndex + 1)}
            disabled={isNextDisabled}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
