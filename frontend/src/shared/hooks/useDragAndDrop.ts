/**
 * Shared Drag & Drop Hooks
 * 
 * Generic drag and drop utilities that can be reused across different modules.
 * Built on top of @dnd-kit for consistent DnD behavior.
 */

import { useState, useCallback, useMemo } from 'react';
import type { UniqueIdentifier } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

// ============================================================================
// Types
// ============================================================================

export interface DragItem<T = unknown> {
  id: UniqueIdentifier;
  data: T;
}

export interface DragState<T = unknown> {
  activeItem: DragItem<T> | null;
  overId: UniqueIdentifier | null;
}

export interface UseDragAndDropListOptions<T> {
  items: T[];
  getItemId: (item: T) => UniqueIdentifier;
  onReorder?: (items: T[], activeId: UniqueIdentifier, overId: UniqueIdentifier) => void;
}

export interface UseDragAndDropListResult<T> {
  items: T[];
  itemIds: UniqueIdentifier[];
  activeItem: T | null;
  handleDragStart: (id: UniqueIdentifier) => void;
  handleDragEnd: (activeId: UniqueIdentifier, overId: UniqueIdentifier | null) => void;
  handleDragCancel: () => void;
  reorderItems: (activeId: UniqueIdentifier, overId: UniqueIdentifier) => T[];
}

export interface UseDragAndDropMultiListOptions<T, L> {
  lists: L[];
  getListId: (list: L) => UniqueIdentifier;
  getListItems: (list: L) => T[];
  getItemId: (item: T) => UniqueIdentifier;
  /** @deprecated Not currently used but kept for future API compatibility */
  _getItemListId?: (item: T) => UniqueIdentifier;
  onMoveWithinList?: (
    listId: UniqueIdentifier,
    activeId: UniqueIdentifier,
    overId: UniqueIdentifier,
    newIndex: number
  ) => void;
  onMoveBetweenLists?: (
    sourceListId: UniqueIdentifier,
    targetListId: UniqueIdentifier,
    itemId: UniqueIdentifier,
    newIndex: number
  ) => void;
  onReorderLists?: (activeId: UniqueIdentifier, overId: UniqueIdentifier) => void;
}

export interface UseDragAndDropMultiListResult<T, L> {
  lists: L[];
  listIds: UniqueIdentifier[];
  activeItem: T | null;
  activeList: L | null;
  activeType: 'item' | 'list' | null;
  handleDragStart: (id: UniqueIdentifier, type: 'item' | 'list') => void;
  handleDragOver: (activeId: UniqueIdentifier, overId: UniqueIdentifier | null) => void;
  handleDragEnd: (activeId: UniqueIdentifier, overId: UniqueIdentifier | null) => void;
  handleDragCancel: () => void;
  findItem: (id: UniqueIdentifier) => { item: T; list: L } | null;
  findList: (id: UniqueIdentifier) => L | null;
}

// ============================================================================
// Single List Hook
// ============================================================================

/**
 * Hook for managing drag and drop within a single list.
 * Handles reordering of items within the list.
 */
export function useDragAndDropList<T>({
  items,
  getItemId,
  onReorder,
}: UseDragAndDropListOptions<T>): UseDragAndDropListResult<T> {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  const itemIds = useMemo(() => items.map(getItemId), [items, getItemId]);

  const activeItem = useMemo(() => {
    if (!activeId) return null;
    return items.find(item => getItemId(item) === activeId) ?? null;
  }, [activeId, items, getItemId]);

  const handleDragStart = useCallback((id: UniqueIdentifier) => {
    setActiveId(id);
  }, []);

  const handleDragEnd = useCallback(
    (activeId: UniqueIdentifier, overId: UniqueIdentifier | null) => {
      setActiveId(null);

      if (!overId || activeId === overId) return;

      const oldIndex = items.findIndex(item => getItemId(item) === activeId);
      const newIndex = items.findIndex(item => getItemId(item) === overId);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(items, oldIndex, newIndex);
        onReorder?.(reordered, activeId, overId);
      }
    },
    [items, getItemId, onReorder]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const reorderItems = useCallback(
    (activeId: UniqueIdentifier, overId: UniqueIdentifier): T[] => {
      const oldIndex = items.findIndex(item => getItemId(item) === activeId);
      const newIndex = items.findIndex(item => getItemId(item) === overId);

      if (oldIndex === -1 || newIndex === -1) return items;
      return arrayMove(items, oldIndex, newIndex);
    },
    [items, getItemId]
  );

  return {
    items,
    itemIds,
    activeItem,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    reorderItems,
  };
}

// ============================================================================
// Multi-List Hook (for Kanban-style boards)
// ============================================================================

/**
 * Hook for managing drag and drop across multiple lists.
 * Supports both reordering within lists and moving items between lists.
 * Also supports reordering the lists themselves.
 */
export function useDragAndDropMultiList<T, L>({
  lists,
  getListId,
  getListItems,
  getItemId,
  onMoveWithinList,
  onMoveBetweenLists,
  onReorderLists,
}: UseDragAndDropMultiListOptions<T, L>): UseDragAndDropMultiListResult<T, L> {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeType, setActiveType] = useState<'item' | 'list' | null>(null);

  const listIds = useMemo(() => lists.map(getListId), [lists, getListId]);

  const findItem = useCallback(
    (id: UniqueIdentifier): { item: T; list: L } | null => {
      for (const list of lists) {
        const items = getListItems(list);
        const item = items.find(i => getItemId(i) === id);
        if (item) {
          return { item, list };
        }
      }
      return null;
    },
    [lists, getListItems, getItemId]
  );

  const findList = useCallback(
    (id: UniqueIdentifier): L | null => {
      return lists.find(list => getListId(list) === id) ?? null;
    },
    [lists, getListId]
  );

  const activeItem = useMemo(() => {
    if (!activeId || activeType !== 'item') return null;
    const result = findItem(activeId);
    return result?.item ?? null;
  }, [activeId, activeType, findItem]);

  const activeList = useMemo(() => {
    if (!activeId || activeType !== 'list') return null;
    return findList(activeId);
  }, [activeId, activeType, findList]);

  const handleDragStart = useCallback((id: UniqueIdentifier, type: 'item' | 'list') => {
    setActiveId(id);
    setActiveType(type);
  }, []);

  const handleDragOver = useCallback(
    (activeId: UniqueIdentifier, overId: UniqueIdentifier | null) => {
      if (!overId || activeType !== 'item') return;

      const activeResult = findItem(activeId);
      if (!activeResult) return;

      const activeListId = getListId(activeResult.list);

      // Check if over a different list
      const overList = findList(overId);
      if (overList) {
        const overListId = getListId(overList);
        if (activeListId !== overListId) {
          // Moving to a different list (drop at end)
          const overItems = getListItems(overList);
          onMoveBetweenLists?.(activeListId, overListId, activeId, overItems.length);
        }
        return;
      }

      // Check if over an item in a different list
      const overResult = findItem(overId);
      if (overResult) {
        const overListId = getListId(overResult.list);
        if (activeListId !== overListId) {
          const overItems = getListItems(overResult.list);
          const overIndex = overItems.findIndex(i => getItemId(i) === overId);
          onMoveBetweenLists?.(activeListId, overListId, activeId, overIndex);
        }
      }
    },
    [activeType, findItem, findList, getListId, getListItems, getItemId, onMoveBetweenLists]
  );

  const handleDragEnd = useCallback(
    (activeId: UniqueIdentifier, overId: UniqueIdentifier | null) => {
      setActiveId(null);
      setActiveType(null);

      if (!overId || activeId === overId) return;

      if (activeType === 'list') {
        // Reordering lists
        onReorderLists?.(activeId, overId);
        return;
      }

      if (activeType === 'item') {
        const activeResult = findItem(activeId);
        if (!activeResult) return;

        const activeListId = getListId(activeResult.list);

        // Check if dropping on a list
        const overList = findList(overId);
        if (overList) {
          const overListId = getListId(overList);
          if (activeListId !== overListId) {
            const overItems = getListItems(overList);
            onMoveBetweenLists?.(activeListId, overListId, activeId, overItems.length);
          }
          return;
        }

        // Check if dropping on an item
        const overResult = findItem(overId);
        if (overResult) {
          const overListId = getListId(overResult.list);
          const overItems = getListItems(overResult.list);
          const overIndex = overItems.findIndex(i => getItemId(i) === overId);

          if (activeListId === overListId) {
            // Same list - reorder
            onMoveWithinList?.(activeListId, activeId, overId, overIndex);
          } else {
            // Different list - move
            onMoveBetweenLists?.(activeListId, overListId, activeId, overIndex);
          }
        }
      }
    },
    [
      activeType,
      findItem,
      findList,
      getListId,
      getListItems,
      getItemId,
      onMoveWithinList,
      onMoveBetweenLists,
      onReorderLists,
    ]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setActiveType(null);
  }, []);

  return {
    lists,
    listIds,
    activeItem,
    activeList,
    activeType,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
    findItem,
    findList,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Reorder items in an array by moving an item from one index to another.
 */
export function reorderArray<T>(array: T[], fromIndex: number, toIndex: number): T[] {
  return arrayMove(array, fromIndex, toIndex);
}

/**
 * Move an item from one array to another.
 */
export function moveItemBetweenArrays<T>(
  sourceArray: T[],
  targetArray: T[],
  sourceIndex: number,
  targetIndex: number
): { source: T[]; target: T[] } {
  const newSource = [...sourceArray];
  const newTarget = [...targetArray];
  const [item] = newSource.splice(sourceIndex, 1);
  newTarget.splice(targetIndex, 0, item);
  return { source: newSource, target: newTarget };
}
