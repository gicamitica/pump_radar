import { useState, useCallback, useMemo, type ReactNode, Fragment } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/shadcn/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shadcn/components/ui/table';
import { cn } from '@/shadcn/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { TablePagination } from './TablePagination';
import { TableSkeleton } from './TableSkeleton';

export interface SimpleSortableTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  initialSort?: SortingState;
  density?: 'compact' | 'normal' | 'spacious';
  className?: string;
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Pagination Props
  // ─────────────────────────────────────────────────────────────────────────────
  
  /** Enable pagination feature */
  enablePagination?: boolean;
  
  /** Default page size (default: 10) */
  defaultPageSize?: number;
  
  /** Available page size options */
  pageSizeOptions?: number[];

  /** Loading state */
  isLoading?: boolean;

  /** Custom loading skeleton to render when isLoading is true */
  loadingSkeleton?: ReactNode;
  /** Callback when a row is clicked. Useful for navigation or triggering default actions. */
  onRowClick?: (row: TData) => void;
  /** ID of currently selected row for visual emphasis */
  selectedRowId?: string | null;
  /** Function to extract ID from row data */
  getRowId?: (row: TData) => string;
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Expandable Row Props
  // ─────────────────────────────────────────────────────────────────────────────
  
  /** Enable row expansion feature */
  expandable?: boolean;
  
  /** Render function for expanded row content. Receives the row data and a toggle function. */
  renderExpandedRow?: (row: TData, toggleExpand: () => void) => ReactNode;
  
  /** 
   * Controlled mode: externally managed expanded row IDs.
   * When provided, the component becomes controlled.
   */
  expandedRowIds?: string[];
  
  /** Callback when expansion state changes (works in both controlled and uncontrolled modes) */
  onExpandedChange?: (expandedRowIds: string[]) => void;
  
  /** Allow multiple rows to be expanded simultaneously (default: true) */
  multiExpand?: boolean;
  
  /** Initially expanded row IDs (uncontrolled mode only) */
  defaultExpandedRowIds?: string[];

  // ─────────────────────────────────────────────────────────────────────────────
  // Server-side Pagination Props
  // ─────────────────────────────────────────────────────────────────────────────
  
  /** Whether to use manual (server-side) pagination */
  manualPagination?: boolean;
  
  /** Total page count for manual pagination */
  pageCount?: number;
  
  /** Current page index (0-indexed) for manual pagination */
  pageIndex?: number;
  
  /** Total number of items for manual pagination */
  totalCount?: number;
  
  /** Callback for manual pagination changes */
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;
}

export function SimpleSortableTable<TData>({
  columns,
  data,
  initialSort = [],
  density = 'normal',
  className,
  onRowClick,
  selectedRowId,
  getRowId,
  // Expandable props
  expandable = false,
  renderExpandedRow,
  expandedRowIds: controlledExpandedIds,
  onExpandedChange,
  multiExpand = true,
  defaultExpandedRowIds = [],
  pageSizeOptions = [5, 10, 20, 50],
  enablePagination = false,
  defaultPageSize = 10,
  isLoading = false,
  loadingSkeleton,
  manualPagination = false,
  pageCount,
  pageIndex: controlledPageIndex,
  totalCount: controlledTotalCount,
  onPaginationChange: controlledOnPaginationChange,
}: SimpleSortableTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>(initialSort);
  
  // Pagination state
  const [internalPagination, setInternalPagination] = useState({
    pageIndex: 0,
    pageSize: defaultPageSize,
  });

  const pagination = useMemo(() => {
    if (manualPagination) {
      return {
        pageIndex: controlledPageIndex ?? 0,
        pageSize: defaultPageSize,
      };
    }
    return internalPagination;
  }, [manualPagination, controlledPageIndex, defaultPageSize, internalPagination]);
  
  // Internal state for uncontrolled mode
  const [internalExpandedIds, setInternalExpandedIds] = useState<Set<string>>(
    () => new Set(defaultExpandedRowIds)
  );
  
  // Determine if we're in controlled mode
  const isControlled = controlledExpandedIds !== undefined;
  
  // Get current expanded IDs (controlled or uncontrolled)
  const expandedIds = useMemo(() => {
    return isControlled ? new Set(controlledExpandedIds) : internalExpandedIds;
  }, [isControlled, controlledExpandedIds, internalExpandedIds]);
  
  // Check if a row is expanded
  const isRowExpanded = useCallback((id: string) => {
    return expandedIds.has(id);
  }, [expandedIds]);
  
  // Toggle row expansion
  const toggleRowExpansion = useCallback((id: string) => {
    const updateExpandedIds = (currentIds: Set<string>): Set<string> => {
      const newIds = new Set(currentIds);
      
      if (newIds.has(id)) {
        newIds.delete(id);
      } else {
        if (!multiExpand) {
          newIds.clear();
        }
        newIds.add(id);
      }
      
      return newIds;
    };
    
    if (isControlled) {
      // Controlled mode: call callback, don't update internal state
      const newIds = updateExpandedIds(expandedIds);
      onExpandedChange?.(Array.from(newIds));
    } else {
      // Uncontrolled mode: update internal state
      setInternalExpandedIds((prev) => {
        const newIds = updateExpandedIds(prev);
        onExpandedChange?.(Array.from(newIds));
        return newIds;
      });
    }
  }, [isControlled, expandedIds, multiExpand, onExpandedChange]);

  const table = useReactTable<TData>({
    data,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater(pagination) : updater;
      if (manualPagination) {
        controlledOnPaginationChange?.(next);
      } else {
        setInternalPagination(next);
      }
    },
    manualPagination,
    pageCount,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
  });

  const headerGroups = table.getHeaderGroups();
  const rows = table.getRowModel().rows;
  
  // Calculate total columns (including expand column if enabled)
  const totalColumns = expandable ? columns.length + 1 : columns.length;

  // Handle row click - expand or custom handler
  const handleRowClick = useCallback((row: TData, rowId: string | undefined) => {
    // If expandable and no custom click handler, toggle expansion
    if (expandable && !onRowClick && rowId) {
      toggleRowExpansion(rowId);
    } else if (onRowClick) {
      onRowClick(row);
    }
  }, [expandable, onRowClick, toggleRowExpansion]);
  
  // Handle keyboard navigation for expanded rows
  const handleKeyDown = useCallback((e: React.KeyboardEvent, rowId: string | undefined) => {
    if (expandable && rowId && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      toggleRowExpansion(rowId);
    }
  }, [expandable, toggleRowExpansion]);

  return (
    <div className={cn("relative", className)}>
      {isLoading ? (
        loadingSkeleton || (
          <TableSkeleton 
            columnCount={columns.length} 
            rowCount={defaultPageSize} 
            showExpand={expandable}
            density={density}
          />
        )
      ) : (
        <>
          <Table>
            <TableHeader>
              {headerGroups.map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {/* Expand column header */}
                  {expandable && (
                    <TableHead className="w-10 px-2">
                      <span className="sr-only">Expand</span>
                    </TableHead>
                  )}
                  
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            header.column.getCanSort()
                              ? 'flex items-center gap-2 cursor-pointer select-none'
                              : ''
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && (
                            <Button variant="ghost" size="icon" className="h-4 w-4 p-0">
                              {header.column.getIsSorted() === 'asc' ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : header.column.getIsSorted() === 'desc' ? (
                                <ArrowDown className="h-3 w-3" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {rows?.length ? (
                rows.map((row) => {
                  const rowId = row.id;
                  const isSelected = selectedRowId !== null && selectedRowId !== undefined && rowId === selectedRowId;
                  const hasSelection = selectedRowId !== null && selectedRowId !== undefined;
                  const isExpanded = rowId ? isRowExpanded(rowId) : false;
                  
                  return (
                    <Fragment key={row.id}>
                      {/* Main Data Row */}
                      <TableRow
                        data-state={row.getIsSelected() && 'selected'}
                        tabIndex={expandable ? 0 : undefined}
                        role={expandable ? 'button' : undefined}
                        aria-expanded={expandable ? isExpanded : undefined}
                        onKeyDown={(e) => handleKeyDown(e, rowId)}
                        className={cn(
                          'transition-all duration-200',
                          (onRowClick || expandable) && 'hover:bg-muted/50 cursor-pointer',
                          isSelected && 'bg-primary/10 ring-2 ring-primary/20',
                          hasSelection && !isSelected && 'opacity-50',
                          isExpanded && 'bg-muted/30',
                        )}
                        onClick={() => handleRowClick(row.original, rowId)}
                      >
                        {/* Expand/Collapse Icon Cell */}
                        {expandable && (
                          <TableCell className="w-10 px-2 py-2">
                            <div className="flex items-center justify-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (rowId) toggleRowExpansion(rowId);
                                }}
                                aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        )}
                        
                        {/* Regular Data Cells */}
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              density === 'compact' && 'py-2',
                              density === 'normal' && 'py-3',
                              density === 'spacious' && 'py-4',
                              !density && 'py-3' // default
                            )}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                      
                      {/* Expanded Row Content */}
                      <AnimatePresence initial={false}>
                        {expandable && isExpanded && renderExpandedRow && (
                          <TableRow className="bg-gradient-to-br from-muted/30 via-muted/20 to-muted/10 border-b hover:bg-muted/10">
                            <TableCell 
                              colSpan={totalColumns} 
                              className="p-0 whitespace-normal"
                            >
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                                className="overflow-hidden"
                              >
                                <div className="p-4">
                                  {renderExpandedRow(
                                    row.original, 
                                    () => rowId && toggleRowExpansion(rowId)
                                  )}
                                </div>
                              </motion.div>
                            </TableCell>
                          </TableRow>
                        )}
                      </AnimatePresence>
                    </Fragment>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={totalColumns} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
      
          {/* Pagination */}
          {enablePagination && (
            <TablePagination
              pageIndex={table.getState().pagination.pageIndex}
              pageSize={table.getState().pagination.pageSize}
              totalCount={manualPagination ? controlledTotalCount : data.length}
              pageSizeOptions={pageSizeOptions}
              onPageChange={(pageIndex) => table.setPageIndex(pageIndex)}
              onPageSizeChange={(pageSize) => table.setPageSize(pageSize)}
              canPreviousPage={table.getCanPreviousPage()}
              canNextPage={table.getCanNextPage()}
              className="mt-4"
            />
          )}
        </>
      )}
    </div>
  );
}
