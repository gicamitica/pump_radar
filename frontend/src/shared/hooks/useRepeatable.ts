/**
 * useRepeatable Hook - Core Engine for Repeatable UI Patterns
 * 
 * A generic, reusable hook for managing repeatable items in any UI context.
 * Powers forms, lists, tables, and any pattern requiring dynamic item management.
 * 
 * Design Principles:
 * - Behavior-first, UI-agnostic
 * - Strong TypeScript typing
 * - Predictable state transitions
 * - Minimal surface area
 * - Easy to compose with forms, tables, cards, or lists
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

export interface UseRepeatableOptions<TItem, TError = string> {
  /** Initial items to populate the list */
  initialItems: TItem[];

  /** Minimum number of items allowed (enforced on removal) */
  minItems?: number;

  /** Maximum number of items allowed (enforced on add) */
  maxItems?: number;

  /** Factory function to create new items */
  createItem: () => TItem;

  /** Optional validation for individual items */
  validateItem?: (item: TItem, index: number) => TError | null;

  /** Optional validation for the entire collection */
  validateAll?: (items: TItem[]) => (TError | null)[] | null;

  /** Callback fired when items change */
  onChange?: (items: TItem[]) => void;
}

export interface UseRepeatableReturn<TItem, TError = string> {
  /** Current list of items */
  items: TItem[];

  /** Add a new item to the end of the list */
  addItem: (override?: Partial<TItem>) => void;

  /** Remove an item at the specified index */
  removeItem: (index: number) => void;

  /** Update an item with a partial patch */
  updateItem: (index: number, patch: Partial<TItem>) => void;

  /** Replace an item entirely */
  replaceItem: (index: number, item: TItem) => void;

  /** Move an item from one position to another */
  moveItem: (from: number, to: number) => void;

  /** Clear all items (respects minItems constraint) */
  clear: () => void;

  /** Set all items at once */
  setItems: (items: TItem[]) => void;

  /** Validation errors for each item (null if no error) */
  errors: Array<TError | null>;

  /** True if any item has an error */
  hasErrors: boolean;

  /** True if items have been modified from initial state */
  isDirty: boolean;

  /** True if more items can be added */
  canAdd: boolean;

  /** True if items can be removed */
  canRemove: boolean;
}

/**
 * useRepeatable - Generic hook for managing repeatable items
 * 
 * @example
 * ```tsx
 * const teamMembers = useRepeatable({
 *   initialItems: [{ name: 'John', role: 'admin' }],
 *   minItems: 1,
 *   maxItems: 10,
 *   createItem: () => ({ name: '', role: 'member' }),
 *   validateItem: (item) => item.name ? null : 'Name is required',
 * });
 * ```
 */
export function useRepeatable<TItem, TError = string>(
  options: UseRepeatableOptions<TItem, TError>
): UseRepeatableReturn<TItem, TError> {
  const {
    initialItems,
    minItems = 0,
    maxItems = Infinity,
    createItem,
    validateItem,
    validateAll,
    onChange,
  } = options;

  // State
  const [items, setItems] = useState<TItem[]>(initialItems);
  const initialItemsRef = useRef(initialItems);

  // Track if items have been modified
  const isDirty = useMemo(() => {
    return JSON.stringify(items) !== JSON.stringify(initialItemsRef.current);
  }, [items]);

  // Constraints
  const canAdd = items.length < maxItems;
  const canRemove = items.length > minItems;

  // Validation
  const errors = useMemo(() => {
    if (validateAll) {
      const allErrors = validateAll(items);
      if (allErrors) return allErrors;
    }

    if (validateItem) {
      return items.map((item, index) => validateItem(item, index));
    }

    return items.map(() => null);
  }, [items, validateItem, validateAll]);

  const hasErrors = useMemo(() => {
    return errors.some((error) => error !== null);
  }, [errors]);

  // Keep track of the latest onChange handler
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Notify parent of changes
  useEffect(() => {
    onChangeRef.current?.(items);
  }, [items]);

  // Actions
  const addItem = useCallback((override?: Partial<TItem>) => {
    if (!canAdd) return;

    const newItem = { ...createItem(), ...override };
    setItems((prev) => [...prev, newItem]);
  }, [canAdd, createItem]);

  const removeItem = useCallback(
    (index: number) => {
      if (!canRemove) return;
      if (index < 0 || index >= items.length) return;

      setItems((prev) => prev.filter((_, i) => i !== index));
    },
    [canRemove, items.length]
  );

  const updateItem = useCallback(
    (index: number, patch: Partial<TItem>) => {
      if (index < 0 || index >= items.length) return;

      setItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
      );
    },
    [items.length]
  );

  const replaceItem = useCallback(
    (index: number, item: TItem) => {
      if (index < 0 || index >= items.length) return;

      setItems((prev) => prev.map((oldItem, i) => (i === index ? item : oldItem)));
    },
    [items.length]
  );

  const moveItem = useCallback(
    (from: number, to: number) => {
      if (from < 0 || from >= items.length) return;
      if (to < 0 || to >= items.length) return;
      if (from === to) return;

      setItems((prev) => {
        const newItems = [...prev];
        const [movedItem] = newItems.splice(from, 1);
        newItems.splice(to, 0, movedItem);
        return newItems;
      });
    },
    [items.length]
  );

  const clear = useCallback(() => {
    if (minItems === 0) {
      setItems([]);
    } else {
      // Keep minimum required items
      const itemsToKeep = Array.from({ length: minItems }, () => createItem());
      setItems(itemsToKeep);
    }
  }, [minItems, createItem]);

  const setItemsBulk = useCallback((newItems: TItem[]) => {
    setItems(newItems);
  }, []);

  return {
    items,
    addItem,
    removeItem,
    updateItem,
    replaceItem,
    moveItem,
    clear,
    setItems: setItemsBulk,
    errors,
    hasErrors,
    isDirty,
    canAdd,
    canRemove,
  };
}
