import { useState, useCallback, useMemo } from 'react';

/**
 * Options for the useExpandable hook
 */
export interface UseExpandableOptions<T extends string = string> {
  /** Initial expanded item ID (for single mode) or IDs (for multi mode) */
  defaultExpanded?: T | T[];
  /** Whether multiple items can be expanded at once */
  allowMultiple?: boolean;
  /** Callback when expansion state changes */
  onChange?: (expandedIds: T[]) => void;
}

/**
 * Return type for the useExpandable hook
 */
export interface UseExpandableReturn<T extends string = string> {
  /** Currently expanded item IDs */
  expandedIds: T[];
  /** Check if a specific item is expanded */
  isExpanded: (id: T) => boolean;
  /** Toggle the expanded state of an item */
  toggle: (id: T) => void;
  /** Expand a specific item */
  expand: (id: T) => void;
  /** Collapse a specific item */
  collapse: (id: T) => void;
  /** Expand all items (requires itemIds to be passed) */
  expandAll: (itemIds: T[]) => void;
  /** Collapse all items */
  collapseAll: () => void;
}

/**
 * useExpandable - A hook for managing expandable/collapsible panel state
 * 
 * This hook provides a flexible way to manage accordion-like UI patterns with
 * support for both single and multiple expanded items.
 * 
 * **Why not use shadcn/ui Accordion?**
 * While shadcn/ui provides an Accordion component, it has limited animation
 * customization and doesn't provide the fine-grained control needed for
 * professional micro-interactions. This hook allows:
 * - Custom CSS animations (grid-rows, max-height, etc.)
 * - Integration with any UI component
 * - Programmatic control (expand/collapse from external triggers)
 * - Callback support for analytics or side effects
 * 
 * @example
 * ```tsx
 * // Single expanded item (accordion behavior)
 * const { isExpanded, toggle } = useExpandable({ defaultExpanded: 'step-1' });
 * 
 * // Multiple expanded items
 * const { isExpanded, toggle, expandAll, collapseAll } = useExpandable({
 *   defaultExpanded: ['step-1', 'step-2'],
 *   allowMultiple: true,
 * });
 * 
 * // With change callback
 * const { toggle } = useExpandable({
 *   onChange: (ids) => console.log('Expanded:', ids),
 * });
 * ```
 */
export function useExpandable<T extends string = string>(
  options: UseExpandableOptions<T> = {}
): UseExpandableReturn<T> {
  const { defaultExpanded, allowMultiple = false, onChange } = options;

  // Initialize state based on defaultExpanded
  const initialState = useMemo(() => {
    if (!defaultExpanded) return [];
    return Array.isArray(defaultExpanded) ? defaultExpanded : [defaultExpanded];
  }, [defaultExpanded]);

  const [expandedIds, setExpandedIds] = useState<T[]>(initialState);

  const isExpanded = useCallback(
    (id: T) => expandedIds.includes(id),
    [expandedIds]
  );

  const updateState = useCallback(
    (newIds: T[]) => {
      setExpandedIds(newIds);
      onChange?.(newIds);
    },
    [onChange]
  );

  const toggle = useCallback(
    (id: T) => {
      if (expandedIds.includes(id)) {
        // Collapse
        updateState(expandedIds.filter((i) => i !== id));
      } else {
        // Expand
        if (allowMultiple) {
          updateState([...expandedIds, id]);
        } else {
          updateState([id]);
        }
      }
    },
    [expandedIds, allowMultiple, updateState]
  );

  const expand = useCallback(
    (id: T) => {
      if (expandedIds.includes(id)) return;
      if (allowMultiple) {
        updateState([...expandedIds, id]);
      } else {
        updateState([id]);
      }
    },
    [expandedIds, allowMultiple, updateState]
  );

  const collapse = useCallback(
    (id: T) => {
      if (!expandedIds.includes(id)) return;
      updateState(expandedIds.filter((i) => i !== id));
    },
    [expandedIds, updateState]
  );

  const expandAll = useCallback(
    (itemIds: T[]) => {
      if (allowMultiple) {
        updateState(itemIds);
      }
    },
    [allowMultiple, updateState]
  );

  const collapseAll = useCallback(() => {
    updateState([]);
  }, [updateState]);

  return {
    expandedIds,
    isExpanded,
    toggle,
    expand,
    collapse,
    expandAll,
    collapseAll,
  };
}
