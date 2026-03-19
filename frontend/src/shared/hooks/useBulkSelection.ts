import { useState, useCallback, useMemo } from 'react';

export type SelectableId = string | number;

export interface UseBulkSelectionOptions<T extends SelectableId = SelectableId> {
  initialSelected?: T[];
}

export interface UseBulkSelectionReturn<T extends SelectableId = SelectableId> {
  selectedIds: Set<T>;
  selectedCount: number;
  isSelected: (id: T) => boolean;
  select: (id: T) => void;
  deselect: (id: T) => void;
  toggle: (id: T) => void;
  selectAll: (ids: T[]) => void;
  clear: () => void;
  isAllSelected: (ids: T[]) => boolean;
  isSomeSelected: (ids: T[]) => boolean;
}

/**
 * A reusable hook for managing bulk selection state.
 * Works with tables, lists, grids, or any collection of selectable items.
 *
 * @param options - Configuration options
 * @returns Selection state and control functions
 *
 * @example
 * ```tsx
 * const { selectedIds, toggle, selectAll, clear, isSelected } = useBulkSelection<number>();
 *
 * // Toggle selection
 * <Checkbox checked={isSelected(item.id)} onChange={() => toggle(item.id)} />
 *
 * // Select all
 * <Checkbox
 *   checked={isAllSelected(items.map(i => i.id))}
 *   onChange={() => isAllSelected(items.map(i => i.id)) ? clear() : selectAll(items.map(i => i.id))}
 * />
 * ```
 */
export function useBulkSelection<T extends SelectableId = SelectableId>(
  options: UseBulkSelectionOptions<T> = {}
): UseBulkSelectionReturn<T> {
  const { initialSelected = [] } = options;

  const [selectedIds, setSelectedIds] = useState<Set<T>>(
    () => new Set(initialSelected)
  );

  const selectedCount = useMemo(() => selectedIds.size, [selectedIds]);

  const isSelected = useCallback(
    (id: T): boolean => selectedIds.has(id),
    [selectedIds]
  );

  const select = useCallback((id: T): void => {
    setSelectedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const deselect = useCallback((id: T): void => {
    setSelectedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const toggle = useCallback((id: T): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: T[]): void => {
    setSelectedIds(new Set(ids));
  }, []);

  const clear = useCallback((): void => {
    setSelectedIds(new Set());
  }, []);

  const isAllSelected = useCallback(
    (ids: T[]): boolean => {
      if (ids.length === 0) return false;
      return ids.every((id) => selectedIds.has(id));
    },
    [selectedIds]
  );

  const isSomeSelected = useCallback(
    (ids: T[]): boolean => {
      if (ids.length === 0) return false;
      const selectedInList = ids.filter((id) => selectedIds.has(id)).length;
      return selectedInList > 0 && selectedInList < ids.length;
    },
    [selectedIds]
  );

  return {
    selectedIds,
    selectedCount,
    isSelected,
    select,
    deselect,
    toggle,
    selectAll,
    clear,
    isAllSelected,
    isSomeSelected,
  };
}
