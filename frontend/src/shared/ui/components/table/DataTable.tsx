/**
 * DataTable - Enterprise-grade table with TanStack Table
 * 
 * Features:
 * - Client-side & server-side mode (auto-detect)
 * - Sorting, filtering, pagination
 * - Column visibility, resizing, pinning
 * - Row selection
 * - Density control (compact, normal, spacious)
 * - State persistence (localStorage)
 * - CSV export
 * - Mobile responsive (card view)
 */

import React, { useMemo, useRef, useState, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type PaginationState,
  type RowSelectionState,
  type ColumnSizingState,
  type Table as TanstackTable,
  type Row,
} from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown, GripVertical, Rows2, Rows3, Rows4, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shadcn/lib/utils';
import { Checkbox } from '@/shadcn/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shadcn/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shadcn/components/ui/table';
import { Label } from '@/shadcn/components/ui/label';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';
import InputFieldText from '../forms/inputs/InputFieldText';
import AnimatedDropdown from '../animated-dropdown/AnimatedDropdown';
import AnimatedDropdownTrigger from '../animated-dropdown/AnimatedDropdownTrigger';
import AnimatedDropdownContent from '../animated-dropdown/AnimatedDropdownContent';
import ActionButton from '../forms/buttons/ActionButton';
import { TablePagination } from './TablePagination';
import { usePersistentState } from '@/shared/hooks';


// ============================================================================
// TYPES
// ============================================================================

export type TableMode = 'client' | 'server';
export type TableDensity = 'compact' | 'normal' | 'spacious';

export interface DataTableColumn<T> {
  /** Unique column identifier */
  id: string;
  /** Column header content */
  header: React.ReactNode;
  /** Cell render function */
  cell: (row: T) => React.ReactNode;
  mobileRender?: (row: T) => React.ReactNode;
  exportValue?: (row: T) => unknown;
  exportDefaultValue?: unknown;
  /** Accessor key for sorting/filtering (defaults to id) */
  accessorKey?: string;
  /** Enable sorting for this column */
  sortable?: boolean;
  /** Server-side sort field (defaults to id) */
  sortId?: string;
  /** Column filter configuration */
  filter?: {
    type: 'text' | 'select';
    placeholder?: string;
    options?: Array<{ label: string; value: string }>;
  };
  /** Initial visibility (default: true) */
  visible?: boolean;
  /** Initial width in pixels */
  width?: number;
  /** Minimum width in pixels */
  minWidth?: number;
  /** Maximum width in pixels */
  maxWidth?: number;
  /** Additional CSS classes */
  className?: string;
}

export interface DataTableProps<T> {
  /** Column definitions */
  columns: DataTableColumn<T>[];
  /** Data array */
  data: T[];

  labels?: {
    loading?: string;
    noResults?: string;
    errorMessage?: string;
    actions?: string;
    clearFilters?: string;
    exportCsv?: string;
    columns?: string;
    search?: string;
    selectFilter?: string;
  };
  
  // Mode configuration
  /** Table mode: 'client' (auto-process data) or 'server' (callbacks only) */
  mode?: TableMode;
  
  // Loading & error states
  /** Show loading state */
  isLoading?: boolean;
  /** Show error state */
  isError?: boolean;
  /** Custom loading content */
  loadingContent?: React.ReactNode;
  /** Custom error content */
  errorContent?: React.ReactNode;
  /** Custom empty state content */
  emptyContent?: React.ReactNode;
  
  // Server-side callbacks
  /** Called when sorting changes (server mode) */
  onSortingChange?: (sorting: SortingState) => void;
  /** Called when column filters change (server mode) */
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  /** Called when pagination changes (server mode) */
  onPaginationChange?: (pagination: PaginationState) => void;
  /** Called when row selection changes */
  onRowSelectionChange?: (rows: T[]) => void;
  /** Called when global filter changes (server mode) */
  onGlobalFilterChange?: (search: string) => void;
  
  // Server-side metadata
  /** Total row count (for server-side pagination) */
  totalCount?: number;
  
  // Feature toggles
  /** Enable row selection checkboxes */
  enableRowSelection?: boolean;
  /** Enable global search */
  enableGlobalSearch?: boolean;
  /** Enable column visibility toggle */
  enableColumnVisibility?: boolean;
  /** Enable column resizing */
  enableColumnResizing?: boolean;
  /** Enable density selector */
  enableDensitySelector?: boolean;
  /** Enable CSV export */
  enableCsvExport?: boolean;

  /** Enable virtual scrolling for desktop table rows */
  enableVirtualScroll?: boolean;
  /** Virtual scroll container max height (px) */
  virtualScrollHeight?: number;
  /** Virtual scroll overscan (number of rows) */
  virtualScrollOverscan?: number;
  
  // Pagination
  /** Page size options */
  pageSizeOptions?: number[];
  /** Default page size */
  defaultPageSize?: number;
  
  // Density
  /** Row density */
  density?: TableDensity;
  
  // Persistence
  /** Storage key for persisting state to localStorage */
  storageKey?: string;
  
  // Initial state
  /** Initial table state */
  initialState?: {
    sorting?: SortingState;
    columnFilters?: ColumnFiltersState;
    pagination?: { pageIndex: number; pageSize: number };
    columnVisibility?: VisibilityState;
  };
  
  // External control
  /** Externally controlled selected rows (for clearing selection) */
  selectedRows?: T[];
  
  // Row actions
  /** Render row actions */
  rowActions?: (row: T) => React.ReactNode;
  /** Pin actions column */
  pinActions?: 'right' | 'none';
  
  // Row identification
  /** Get unique row ID */
  getRowId?: (row: T, index: number) => string;
  
  /** Called when a row is clicked */
  onRowClick?: (row: T) => void;
  
  // Styling
  /** Additional CSS classes */
  className?: string;
  
  // Custom export
  /** Custom CSV export handler */
  onExportCsv?: () => void | Promise<void>;
}

// ============================================================================
// UTILITIES
// ============================================================================

function debounce<TArgs extends unknown[]>(fn: (...args: TArgs) => void, wait = 300) {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...args: TArgs) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function toCsv(rows: Array<Record<string, unknown>>, order: string[]) {
  const esc = (v: unknown) => {
    if (v == null) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = order.map(esc).join(',');
  const body = rows.map((r) => order.map((k) => esc(r[k])).join(',')).join('\n');
  return head + '\n' + body;
}

const DATA_TABLE_CONFIG = {
  FILTER_DEBOUNCE_MS: 300,
  PERSIST_WRITE_DEBOUNCE_MS: 200,
  DEFAULT_MIN_COLUMN_WIDTH: 80,
  SELECTION_COLUMN_WIDTH: 42,
  CSV_FILENAME: 'export.csv',
  MOBILE_CARD_VISIBLE_COLUMNS: 3,
  VIRTUAL_SCROLL_DEFAULT_HEIGHT: 560,
  VIRTUAL_SCROLL_DEFAULT_OVERSCAN: 8,
  DENSITY_ROW_HEIGHT_PX: {
    compact: 36,
    normal: 44,
    spacious: 56,
  } as const,
} as const;

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function LoadingRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="p-6 text-center text-muted-foreground">
        <div className="inline-flex items-center gap-2">
          <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-foreground/60" />
          <span>{label}</span>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DataTable<T>({
  columns,
  data,
  labels,
  mode: propMode,
  isLoading = false,
  isError = false,
  loadingContent,
  errorContent,
  emptyContent,
  onSortingChange,
  onColumnFiltersChange,
  onPaginationChange,
  onRowSelectionChange,
  onGlobalFilterChange: onGlobalFilterChangeProp,
  totalCount,
  enableRowSelection = false,
  enableGlobalSearch = true,
  enableColumnVisibility = true,
  enableColumnResizing = true,
  enableDensitySelector = true,
  enableCsvExport = true,
  enableVirtualScroll = false,
  virtualScrollHeight = DATA_TABLE_CONFIG.VIRTUAL_SCROLL_DEFAULT_HEIGHT,
  virtualScrollOverscan = DATA_TABLE_CONFIG.VIRTUAL_SCROLL_DEFAULT_OVERSCAN,
  pageSizeOptions = [10, 20, 50],
  defaultPageSize = 10,
  density: propDensity = 'normal',
  storageKey,
  initialState,
  rowActions,
  pinActions = 'none',
  getRowId,
  onRowClick,
  className,
  onExportCsv,
  selectedRows,
}: DataTableProps<T>) {
  
  const {
    loading: loadingLabel = 'Loading...',
    noResults: noResultsLabel = 'No results found',
    errorMessage: errorLabel = 'Failed to load data',
    actions: actionsLabel = 'Actions',
    clearFilters: clearFiltersLabel = 'Clear Filters',
    exportCsv: exportCsvLabel = 'Export CSV',
    columns: columnsLabel = 'Columns',
    search: searchLabel = 'Search…',
    selectFilter: selectFilterLabel = 'Select…',
  } = labels ?? {};

  // ─────────────────────────────────────────────────────────────────────────
  // AUTO-DETECT MODE
  // ─────────────────────────────────────────────────────────────────────────
  
  const mode: TableMode = propMode ?? (
    onSortingChange || onColumnFiltersChange || onPaginationChange || onGlobalFilterChangeProp
      ? 'server'
      : 'client'
  );
  
  // ─────────────────────────────────────────────────────────────────────────
  // STATE MANAGEMENT (with persistence)
  // ─────────────────────────────────────────────────────────────────────────
  
  const [sorting, setSorting] = usePersistentState<SortingState>(
    storageKey ? `${storageKey}.sorting` : undefined,
    initialState?.sorting ?? []
  );
  
  const [columnFilters, setColumnFilters] = usePersistentState<ColumnFiltersState>(
    storageKey ? `${storageKey}.filters` : undefined,
    initialState?.columnFilters ?? []
  );
  
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: initialState?.pagination?.pageIndex ?? 0,
    pageSize: initialState?.pagination?.pageSize ?? defaultPageSize,
  });
  
  const [columnVisibility, setColumnVisibility] = usePersistentState<VisibilityState>(
    storageKey ? `${storageKey}.visibility` : undefined,
    initialState?.columnVisibility ?? 
      Object.fromEntries(columns.map(c => [c.id, c.visible ?? true]))
  );
  
  const [columnSizing, setColumnSizing] = usePersistentState<ColumnSizingState>(
    storageKey ? `${storageKey}.sizing` : undefined,
    Object.fromEntries(columns.filter(c => c.width).map(c => [c.id, c.width!]))
  );
  
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const [isExportingCsv, setIsExportingCsv] = useState(false);
  
  const [globalFilter, setGlobalFilter] = usePersistentState<string>(
    storageKey ? `${storageKey}.globalFilter` : undefined,
    ''
  );
  
  const [density, setDensity] = usePersistentState<TableDensity>(
    storageKey ? `${storageKey}.density` : undefined,
    propDensity
  );

  const tableRef = useRef<TanstackTable<T> | null>(null);
  const debouncedServerGlobalFilterChangeRef = useRef<((value: string) => void) | null>(null);
  const debouncedServerColumnFiltersChangeRef = useRef<((value: ColumnFiltersState) => void) | null>(null);
  const prevColumnVisibilityRef = useRef<VisibilityState | null>(null);
  
  // Sync external selectedRows with internal rowSelection
  React.useEffect(() => {
    if (selectedRows !== undefined && selectedRows.length === 0 && Object.keys(rowSelection).length > 0) {
      // Only clear if there's something to clear
      setRowSelection({});
    }
  }, [selectedRows, rowSelection]);
  
  // ─────────────────────────────────────────────────────────────────────────
  // CONVERT COLUMNS TO TANSTACK FORMAT
  // ─────────────────────────────────────────────────────────────────────────
  
  const tanstackColumns = useMemo<ColumnDef<T>[]>(() => {
    const cols: ColumnDef<T>[] = [];
    
    // Selection column
    if (enableRowSelection) {
      cols.push({
        id: '_select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        size: DATA_TABLE_CONFIG.SELECTION_COLUMN_WIDTH,
        enableSorting: false,
        enableHiding: false,
      });
    }
    
    // Data columns
    columns.forEach((col) => {
      cols.push({
        id: col.id,
        accessorKey: col.accessorKey || col.id,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <div className="flex items-center">
              <button
                className={cn(
                  'inline-flex items-center gap-1',
                  col.sortable && 'cursor-pointer'
                )}
                onClick={() => col.sortable && column.toggleSorting()}
              >
                {col.header}
                {col.sortable && (
                  isSorted === 'asc' ? (
                    <ArrowUp className="size-3.5 text-muted-foreground" />
                  ) : isSorted === 'desc' ? (
                    <ArrowDown className="size-3.5 text-muted-foreground" />
                  ) : (
                    <ArrowUpDown className="size-3.5 text-muted-foreground opacity-70" />
                  )
                )}
              </button>
              {enableColumnResizing && (
                <span
                  className="ml-auto cursor-col-resize select-none px-1 hover:bg-accent"
                  onMouseDown={(e) => {
                    const startX = e.clientX;
                    const th = e.currentTarget.parentElement as HTMLElement;
                    const startW = columnSizing[col.id] ?? col.width ?? th.getBoundingClientRect().width;
                    const onMove = (ev: MouseEvent) => {
                      const next = Math.max(col.minWidth ?? DATA_TABLE_CONFIG.DEFAULT_MIN_COLUMN_WIDTH, startW + (ev.clientX - startX));
                      setColumnSizing((prev) => ({ ...prev, [col.id]: next }));
                    };
                    const onUp = () => {
                      window.removeEventListener('mousemove', onMove);
                      window.removeEventListener('mouseup', onUp);
                    };
                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                  }}
                  aria-label="Resize column"
                >
                  <GripVertical className="size-3 text-muted-foreground/50" />
                </span>
              )}
            </div>
          );
        },
        cell: ({ row }) => col.cell(row.original),
        size: col.width,
        minSize: col.minWidth ?? DATA_TABLE_CONFIG.DEFAULT_MIN_COLUMN_WIDTH,
        maxSize: col.maxWidth,
        enableSorting: col.sortable ?? false,
        // Use exact match for select filters, default fuzzy for text
        filterFn: col.filter?.type === 'select' ? 'equals' : 'includesString',
        meta: { filter: col.filter },
      });
    });
    
    return cols;
  }, [columns, enableRowSelection, enableColumnResizing, columnSizing, setColumnSizing]);
  
  // ─────────────────────────────────────────────────────────────────────────
  // CREATE TABLE INSTANCE
  // ─────────────────────────────────────────────────────────────────────────
  
  const table = useReactTable({
    data,
    columns: tanstackColumns,
    
    // State
    state: {
      sorting,
      columnFilters,
      pagination,
      columnVisibility,
      columnSizing,
      rowSelection,
      globalFilter,
    },
    
    // State handlers
    onSortingChange: (updater) => {
      const newState = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(newState);
      onSortingChange?.(newState);
    },
    onColumnFiltersChange: (updater) => {
      const newState = typeof updater === 'function' ? updater(columnFilters) : updater;
      setColumnFilters(newState);
      if (mode === 'server') {
        debouncedServerColumnFiltersChangeRef.current?.(newState);
      } else {
        onColumnFiltersChange?.(newState);
      }
      // Reset pagination when filters change (client mode only)
      if (mode === 'client') {
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      }
      // Clear row selection when filters change
      setRowSelection({});
      onRowSelectionChange?.([]);
    },
    onPaginationChange: (updater) => {
      const newState = typeof updater === 'function' ? updater(pagination) : updater;
      setPagination(newState);
      onPaginationChange?.(newState);
    },
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    onRowSelectionChange: (updater) => {
      const newState = typeof updater === 'function' ? updater(rowSelection) : updater;
      setRowSelection(newState);
      if (onRowSelectionChange) {
        const sourceRows = mode === 'client'
          ? table.getPrePaginationRowModel().rows
          : table.getRowModel().rows;
        const nextSelected = sourceRows
          .filter((r: Row<T>) => !!newState[r.id])
          .map((r: Row<T>) => r.original);
        onRowSelectionChange(nextSelected);
      }
    },
    onGlobalFilterChange: (value) => {
      setGlobalFilter(value);
      // Notify parent for server mode
      if (mode === 'server') {
        debouncedServerGlobalFilterChangeRef.current?.(value);
      }
      // Reset pagination when global filter changes (client mode only)
      if (mode === 'client') {
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      }
      // Clear row selection when global filter changes ?
      // setRowSelection({});
      // onRowSelectionChange?.([]);
    },
    
    // Row models (client mode only)
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: mode === 'client' ? getSortedRowModel() : undefined,
    getFilteredRowModel: mode === 'client' ? getFilteredRowModel() : undefined,
    getPaginationRowModel: mode === 'client' ? getPaginationRowModel() : undefined,
    
    // Configuration
    manualSorting: mode === 'server',
    manualFiltering: mode === 'server',
    manualPagination: mode === 'server',
    
    // Server-side metadata
    pageCount: mode === 'server' 
      ? (totalCount ? Math.ceil(totalCount / pagination.pageSize) : undefined)
      : undefined, // Let TanStack calculate for client mode
    rowCount: totalCount,
    
    // Row ID
    getRowId: getRowId ? (row, index) => getRowId(row, index) : undefined,
    
    // Enable features
    enableRowSelection,
    enableColumnResizing,
    columnResizeMode: 'onChange',
  });

  React.useEffect(() => {
    tableRef.current = table;
  }, [table]);

  React.useEffect(() => {
    if (mode !== 'server' || !onGlobalFilterChangeProp) return;
    debouncedServerGlobalFilterChangeRef.current = debounce(
      (value: string) => onGlobalFilterChangeProp(value),
      DATA_TABLE_CONFIG.FILTER_DEBOUNCE_MS
    );
  }, [mode, onGlobalFilterChangeProp]);

  React.useEffect(() => {
    if (mode !== 'server' || !onColumnFiltersChange) return;
    debouncedServerColumnFiltersChangeRef.current = debounce(
      (value: ColumnFiltersState) => onColumnFiltersChange(value),
      DATA_TABLE_CONFIG.FILTER_DEBOUNCE_MS
    );
  }, [mode, onColumnFiltersChange]);

  React.useEffect(() => {
    const prev = prevColumnVisibilityRef.current;
    prevColumnVisibilityRef.current = columnVisibility;
    if (!prev) return;

    const hiddenIds = columns
      .map((c) => c.id)
      .filter((id) => (prev[id] ?? true) && !(columnVisibility[id] ?? true));

    if (hiddenIds.length === 0) return;

    table.setColumnFilters((current) => current.filter((f) => !hiddenIds.includes(f.id)));
  }, [columnVisibility, columns, table]);
  
  // ─────────────────────────────────────────────────────────────────────────
  // DENSITY STYLES
  // ─────────────────────────────────────────────────────────────────────────
  
  const densityPadding = {
    compact: 'py-2',
    normal: 'py-3',
    spacious: 'py-4',
  }[density];
  
  const densityHeight = {
    compact: 'h-9',
    normal: 'h-11',
    spacious: 'h-14',
  }[density];
  
  const densityIcons = {
    compact: <Rows4 className="size-4 text-muted-foreground/50" />,
    normal: <Rows3 className="size-4 text-muted-foreground/50" />,
    spacious: <Rows2 className="size-4 text-muted-foreground/50" />,
  };
  
  // ─────────────────────────────────────────────────────────────────────────
  // FILTER ROW CHECK
  // ─────────────────────────────────────────────────────────────────────────
  
  const hasFilterRow = columns.some((c) => c.filter && (columnVisibility[c.id] ?? true));

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; text: string; onRemove: () => void }> = [];

    const searchChipLabel = searchLabel.replace(/[.…]+$/, '').trim() || searchLabel;

    if (globalFilter) {
      chips.push({
        key: '__global',
        text: `${searchChipLabel}: ${globalFilter}`,
        onRemove: () => table.setGlobalFilter(''),
      });
    }

    for (let i = 0; i < columnFilters.length; i += 1) {
      const f = columnFilters[i];
      const col = columns.find((c) => c.id === f.id);
      if (!col) continue;

      const headerText = typeof col.header === 'string' ? col.header : col.id;

      let valueText = String(f.value ?? '');
      if (col.filter?.type === 'select' && col.filter.options && typeof f.value === 'string') {
        const match = col.filter.options.find((opt) => opt.value === f.value);
        if (match) valueText = match.label;
      }

      chips.push({
        key: f.id,
        text: `${headerText}: ${valueText}`,
        onRemove: () => table.getColumn(f.id)?.setFilterValue(undefined),
      });
    }

    return chips;
  }, [columnFilters, columns, globalFilter, searchLabel, table]);
  
  // ─────────────────────────────────────────────────────────────────────────
  // CSV EXPORT
  // ─────────────────────────────────────────────────────────────────────────
  
  const handleExportCsv = useCallback(async () => {
    if (isExportingCsv) return;

    setIsExportingCsv(true);
    const toastId = toast.loading(exportCsvLabel);
    try {
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0));

      if (onExportCsv) {
        await onExportCsv();
        toast.success(exportCsvLabel, { id: toastId });
        return;
      }

      const visibleCols = columns.filter((c) => (columnVisibility[c.id] ?? true));
      const headerOrder = visibleCols.map((c) => (
        typeof c.header === 'string' ? c.header : c.id
      ));

      const exportRows = (mode === 'client'
        ? table.getPrePaginationRowModel().rows
        : table.getRowModel().rows
      ).map((r: Row<T>) => r.original);

      const rows = exportRows.map((row) => {
        const record: Record<string, unknown> = {};
        for (let i = 0; i < visibleCols.length; i += 1) {
          const col = visibleCols[i];
          const key = col.accessorKey ?? col.id;

          const exportValue = col.exportValue?.(row);
          const rawValue = (row as Record<string, unknown>)[key];
          const cellRendered = exportValue == null && rawValue == null ? col.cell(row) : undefined;

          const finalValue =
            exportValue ??
            rawValue ??
            (typeof cellRendered === 'string' || typeof cellRendered === 'number' ? cellRendered : undefined) ??
            col.exportDefaultValue ??
            '';

          record[headerOrder[i]] = finalValue;
        }
        return record;
      });

      const csv = toCsv(rows, headerOrder);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = DATA_TABLE_CONFIG.CSV_FILENAME;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(exportCsvLabel, { id: toastId });
    } catch {
      toast.error(errorLabel, { id: toastId });
    } finally {
      setIsExportingCsv(false);
    }
  }, [columnVisibility, columns, errorLabel, exportCsvLabel, isExportingCsv, mode, onExportCsv, table]);

  const desktopScrollRef = useRef<HTMLDivElement>(null);
  const shouldVirtualize = enableVirtualScroll && !isLoading && !isError;
  const visibleRows = table.getRowModel().rows;
  const rowVirtualizer = useVirtualizer({
    count: shouldVirtualize ? visibleRows.length : 0,
    getScrollElement: () => desktopScrollRef.current,
    estimateSize: () => DATA_TABLE_CONFIG.DENSITY_ROW_HEIGHT_PX[density],
    overscan: virtualScrollOverscan,
  });

  const virtualItems = shouldVirtualize ? rowVirtualizer.getVirtualItems() : [];
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? rowVirtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end
      : 0;

  const rowsToRender = shouldVirtualize
    ? virtualItems.map((v) => ({ index: v.index, size: v.size }))
    : visibleRows.map((_, index) => ({ index, size: undefined as number | undefined }));
  
  // ─────────────────────────────────────────────────────────────────────────
  // COLUMN COUNT
  // ─────────────────────────────────────────────────────────────────────────
  
  const totalColumnCount = tanstackColumns.length + (rowActions ? 1 : 0);
  
  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  
  return (
    <div className={cn('w-full', className)}>
      {/* ═══════════════════════════════════════════════════════════════════
          TOOLBAR
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="toolbar mb-3 flex flex-wrap items-center justify-between gap-2">
        {/* Left side: Global search */}
        <div className="flex items-center gap-2">
          {enableGlobalSearch && (
            <InputFieldText
              type="search"
              placeholder={searchLabel}
              value={globalFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value;
                table.setGlobalFilter(value);
              }}
            />
          )}
          
          {/* Clear filters button - show when filters are active */}
          {(columnFilters.length > 0 || globalFilter) && (
            <ActionButton
              variant="ghost"
              size="sm"
              onClick={() => {
                table.setColumnFilters([]);
                table.setGlobalFilter('');
                toast.success(clearFiltersLabel);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              {clearFiltersLabel}
            </ActionButton>
          )}
        </div>
        
        {/* Right side: Table controls */}
        <div className="flex items-center gap-2">
          {/* Density selector */}
          {enableDensitySelector && (
            <AnimatedDropdown placement="bottom-end" openOn="hover">
              <AnimatedDropdownTrigger asChild>
                <ActionButton variant="outline" className="gap-2">
                  {densityIcons[density]}
                  <span className="hidden sm:inline">{density.charAt(0).toUpperCase() + density.slice(1)}</span>
                </ActionButton>
              </AnimatedDropdownTrigger>
              <AnimatedDropdownContent className="z-[60] min-w-[160px]">
                {(['compact', 'normal', 'spacious'] as TableDensity[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDensity(d)}
                    className={cn(
                      'flex w-full items-center gap-2 py-2 px-3 hover:bg-accent rounded cursor-pointer text-sm',
                      density === d && 'bg-accent font-medium'
                    )}
                  >
                    {densityIcons[d]}
                    <span>{d.charAt(0).toUpperCase() + d.slice(1)}</span>
                  </button>
                ))}
              </AnimatedDropdownContent>
            </AnimatedDropdown>
          )}
          
          {/* Column visibility menu */}
          {enableColumnVisibility && (
            <AnimatedDropdown placement="bottom-end" openOn="hover">
              <AnimatedDropdownTrigger asChild>
                <ActionButton variant="outline">{columnsLabel}</ActionButton>
              </AnimatedDropdownTrigger>
              <AnimatedDropdownContent className="z-[60] min-w-[220px]">
                {columns.map((c) => (
                  <Label
                    key={c.id}
                    className="flex items-center gap-2 py-1.5 px-2 hover:bg-accent rounded cursor-pointer"
                  >
                    <Checkbox
                      className="rounded border-input"
                      checked={columnVisibility[c.id] ?? true}
                      onCheckedChange={(checked) =>
                        setColumnVisibility((prev) => ({
                          ...prev,
                          [c.id]: checked === 'indeterminate' ? true : !!checked,
                        }))
                      }
                    />
                    <span className="text-sm">
                      {typeof c.header === 'string' ? c.header : c.id}
                    </span>
                  </Label>
                ))}
              </AnimatedDropdownContent>
            </AnimatedDropdown>
          )}
          
          {/* CSV export */}
          {enableCsvExport && (
            <ActionButton variant="outline" onClick={handleExportCsv} disabled={isExportingCsv}>
              {isExportingCsv && <Loader2 className="mr-2 size-4 animate-spin" />}
              {exportCsvLabel}
            </ActionButton>
          )}
        </div>
      </div>

      {activeFilterChips.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {activeFilterChips.map((chip) => (
            <Badge
              key={chip.key}
              variant="secondary"
              className="gap-1 pl-2.5 pr-1.5 py-1"
            >
              <span className="text-xs font-medium">{chip.text}</span>
              <ActionButton
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0"
                onClick={chip.onRemove}
              >
                <X className="h-3 w-3" />
              </ActionButton>
            </Badge>
          ))}
        </div>
      )}
      
      {/* ═══════════════════════════════════════════════════════════════════
          MOBILE CARDS
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="md:hidden space-y-2">
        {isLoading ? (
          loadingContent ?? (
            <div className="p-6 text-center text-muted-foreground">{loadingLabel}</div>
          )
        ) : isError ? (
          errorContent ?? (
            <div className="p-6 text-center text-destructive">{errorLabel}</div>
          )
        ) : table.getRowModel().rows.length === 0 ? (
          emptyContent ?? (
            <div className="p-6 text-center text-muted-foreground">{noResultsLabel}</div>
          )
        ) : (
          table.getRowModel().rows.map((row) => (
            <div key={row.id} className="rounded-lg border bg-card p-3">
              <div className="space-y-1 text-sm">
                {columns.slice(0, DATA_TABLE_CONFIG.MOBILE_CARD_VISIBLE_COLUMNS).map((col) => (
                  <div key={col.id}>
                    <span className="text-muted-foreground mr-1">{col.header}:</span>
                    {(col.mobileRender ?? col.cell)(row.original)}
                  </div>
                ))}
              </div>
              {rowActions && (
                <div className="mt-2 flex justify-end">{rowActions(row.original)}</div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════
          DESKTOP TABLE
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="hidden md:block">
        <div className="relative w-full max-w-full overflow-x-auto">
          <div
            ref={desktopScrollRef}
            style={shouldVirtualize ? { maxHeight: virtualScrollHeight, overflowY: 'auto' } : undefined}
          >
          <Table role="table">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} role="row">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      style={{
                        width: columnSizing[header.column.id] ?? header.getSize(),
                      }}
                      className={cn(
                        'text-left text-sm font-medium p-3 select-none whitespace-nowrap',
                        shouldVirtualize && 'sticky top-0 z-10 bg-background'
                      )}
                      scope="col"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                  {rowActions && (
                    <TableHead
                      style={{
                        width: '100px',
                      }}
                      className={cn(
                        'text-right text-sm font-medium p-3 select-none whitespace-nowrap',
                        pinActions !== 'none' && 'sticky right-0 bg-background/50 backdrop-blur',
                        shouldVirtualize && 'sticky top-0 z-10'
                      )}
                    >
                      {actionsLabel}
                    </TableHead>
                  )}
                </TableRow>
              ))}
              
              {/* Filter row */}
              {hasFilterRow && (
                <TableRow>
                  {enableRowSelection && <TableCell />}
                  {columns.map((col) => {
                    const isVisible = columnVisibility[col.id] ?? true;
                    if (!isVisible) return null;
                    
                    return (
                      <TableCell key={col.id} className="p-2">
                        {col.filter?.type === 'text' && (
                          <input
                            className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                            placeholder={col.filter.placeholder || 'Search...'}
                            value={(columnFilters.find(f => f.id === col.id)?.value as string) || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const value = e.target.value;
                              table.getColumn(col.id)?.setFilterValue(value || undefined);
                            }}
                          />
                        )}
                        {col.filter?.type === 'select' && (
                          <Select
                            key={`${col.id}-${columnFilters.find(f => f.id === col.id)?.value || 'empty'}`}
                            value={(columnFilters.find(f => f.id === col.id)?.value as string) || ''}
                            onValueChange={(v) =>
                              table.getColumn(col.id)?.setFilterValue(v || undefined)
                            }
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder={selectFilterLabel} />
                            </SelectTrigger>
                            <SelectContent>
                              {col.filter.options?.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                    );
                  })}
                  {rowActions && <TableCell />}
                </TableRow>
              )}
            </TableHeader>
            
            <TableBody>
              {isLoading ? (
                <LoadingRow colSpan={totalColumnCount} label={loadingLabel} />
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={totalColumnCount}>
                    {errorContent ?? (
                      <div className="p-4 text-destructive text-center">
                        {errorLabel}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={totalColumnCount}>
                    <div className="p-8 text-center text-muted-foreground">
                      {emptyContent ?? noResultsLabel}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {shouldVirtualize && paddingTop > 0 && (
                    <TableRow>
                      <TableCell colSpan={totalColumnCount} style={{ height: paddingTop }} />
                    </TableRow>
                  )}

                  {rowsToRender.map(({ index, size }) => {
                    const row = visibleRows[index];
                    if (!row) return null;
                    return (
                      <TableRow
                        key={row.id}
                        className={cn(densityHeight, onRowClick && "cursor-pointer hover:bg-muted/50")}
                        style={shouldVirtualize && size ? { height: size } : undefined}
                        onClick={() => onRowClick?.(row.original)}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            style={{
                              width: columnSizing[cell.column.id] ?? cell.column.getSize(),
                            }}
                            className={cn('p-3 align-middle', densityPadding)}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                        {rowActions && (
                          <TableCell
                            className={cn(
                              'p-3 text-right',
                              densityPadding,
                              pinActions !== 'none' && 'sticky right-0 bg-background/50 backdrop-blur'
                            )}
                          >
                            {rowActions(row.original)}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}

                  {shouldVirtualize && paddingBottom > 0 && (
                    <TableRow>
                      <TableCell colSpan={totalColumnCount} style={{ height: paddingBottom }} />
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
          </div>
        </div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════
          PAGINATION
          ═══════════════════════════════════════════════════════════════════ */}
      <TablePagination
        pageIndex={table.getState().pagination.pageIndex}
        pageSize={table.getState().pagination.pageSize}
        totalCount={mode === 'client' ? data.length : totalCount}
        pageSizeOptions={pageSizeOptions}
        onPageChange={(pageIndex) => table.setPageIndex(pageIndex)}
        onPageSizeChange={(pageSize) => table.setPageSize(pageSize)}
        canPreviousPage={table.getCanPreviousPage()}
        canNextPage={table.getCanNextPage()}
        className="mt-4"
      />
    </div>
  );
}

export default DataTable;
