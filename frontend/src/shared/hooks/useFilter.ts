/**
 * Shared Filter & Search Utilities
 * 
 * Generic filtering and search hooks that can be reused across modules.
 * Provides client-side filtering capabilities with various filter types.
 */

import { useState, useMemo, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

export type FilterOperator = 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'notIn';

export interface FilterCriteria<T> {
  /** The field to filter on */
  field: keyof T;
  /** The operator to use for comparison */
  operator: FilterOperator;
  /** The value(s) to compare against */
  value: unknown;
  /** Whether the comparison should be case-sensitive (default: false) */
  caseSensitive?: boolean;
}

export interface UseFilterOptions<T> {
  /** The items to filter */
  items: T[];
  /** Initial filter criteria */
  initialFilters?: FilterCriteria<T>[];
  /** Initial search term */
  initialSearch?: string;
  /** Fields to search in when using text search */
  searchFields?: (keyof T)[];
  /** Custom filter function for complex filtering logic */
  customFilter?: (item: T, filters: FilterCriteria<T>[], search: string) => boolean;
}

export interface UseFilterResult<T> {
  /** The filtered items */
  filteredItems: T[];
  /** Current filter criteria */
  filters: FilterCriteria<T>[];
  /** Current search term */
  search: string;
  /** Whether any filters are active */
  hasActiveFilters: boolean;
  /** Set the search term */
  setSearch: (search: string) => void;
  /** Add a filter criterion */
  addFilter: (filter: FilterCriteria<T>) => void;
  /** Remove a filter criterion by field */
  removeFilter: (field: keyof T) => void;
  /** Update a filter criterion */
  updateFilter: (field: keyof T, value: unknown) => void;
  /** Clear all filters */
  clearFilters: () => void;
  /** Clear search */
  clearSearch: () => void;
  /** Clear all filters and search */
  clearAll: () => void;
  /** Set multiple filters at once */
  setFilters: (filters: FilterCriteria<T>[]) => void;
}

// ============================================================================
// Filter Matching Logic
// ============================================================================

function matchesFilter<T>(item: T, filter: FilterCriteria<T>): boolean {
  const fieldValue = item[filter.field];
  const filterValue = filter.value;
  const caseSensitive = filter.caseSensitive ?? false;

  // Handle null/undefined field values
  if (fieldValue === null || fieldValue === undefined) {
    return filter.operator === 'notIn' || filterValue === null || filterValue === undefined;
  }

  // Convert to string for text comparisons
  const fieldStr = caseSensitive
    ? String(fieldValue)
    : String(fieldValue).toLowerCase();
  const valueStr = caseSensitive
    ? String(filterValue)
    : String(filterValue).toLowerCase();

  switch (filter.operator) {
    case 'equals':
      return fieldStr === valueStr;

    case 'contains':
      return fieldStr.includes(valueStr);

    case 'startsWith':
      return fieldStr.startsWith(valueStr);

    case 'endsWith':
      return fieldStr.endsWith(valueStr);

    case 'in':
      if (Array.isArray(filterValue)) {
        const normalizedValues = caseSensitive
          ? filterValue.map(String)
          : filterValue.map(v => String(v).toLowerCase());
        return normalizedValues.includes(fieldStr);
      }
      return false;

    case 'notIn':
      if (Array.isArray(filterValue)) {
        const normalizedValues = caseSensitive
          ? filterValue.map(String)
          : filterValue.map(v => String(v).toLowerCase());
        return !normalizedValues.includes(fieldStr);
      }
      return true;

    default:
      return true;
  }
}

function matchesSearch<T>(item: T, search: string, searchFields: (keyof T)[]): boolean {
  if (!search.trim()) return true;

  const searchLower = search.toLowerCase();

  return searchFields.some(field => {
    const value = item[field];
    if (value === null || value === undefined) return false;
    return String(value).toLowerCase().includes(searchLower);
  });
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * A generic hook for filtering and searching arrays of items.
 * Supports multiple filter criteria and text search across specified fields.
 */
export function useFilter<T>({
  items,
  initialFilters = [],
  initialSearch = '',
  searchFields = [],
  customFilter,
}: UseFilterOptions<T>): UseFilterResult<T> {
  const [filters, setFilters] = useState<FilterCriteria<T>[]>(initialFilters);
  const [search, setSearch] = useState(initialSearch);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Use custom filter if provided
      if (customFilter) {
        return customFilter(item, filters, search);
      }

      // Check all filter criteria
      const matchesAllFilters = filters.every(filter => matchesFilter(item, filter));
      if (!matchesAllFilters) return false;

      // Check search
      if (searchFields.length > 0 && search) {
        return matchesSearch(item, search, searchFields);
      }

      return true;
    });
  }, [items, filters, search, searchFields, customFilter]);

  const hasActiveFilters = useMemo(() => {
    return filters.length > 0 || search.trim().length > 0;
  }, [filters, search]);

  const addFilter = useCallback((filter: FilterCriteria<T>) => {
    setFilters(prev => {
      // Replace existing filter for the same field
      const existing = prev.findIndex(f => f.field === filter.field);
      if (existing !== -1) {
        const updated = [...prev];
        updated[existing] = filter;
        return updated;
      }
      return [...prev, filter];
    });
  }, []);

  const removeFilter = useCallback((field: keyof T) => {
    setFilters(prev => prev.filter(f => f.field !== field));
  }, []);

  const updateFilter = useCallback((field: keyof T, value: unknown) => {
    setFilters(prev =>
      prev.map(f => (f.field === field ? { ...f, value } : f))
    );
  }, []);

  const clearFilters = useCallback(() => {
    setFilters([]);
  }, []);

  const clearSearch = useCallback(() => {
    setSearch('');
  }, []);

  const clearAll = useCallback(() => {
    setFilters([]);
    setSearch('');
  }, []);

  return {
    filteredItems,
    filters,
    search,
    hasActiveFilters,
    setSearch,
    addFilter,
    removeFilter,
    updateFilter,
    clearFilters,
    clearSearch,
    clearAll,
    setFilters,
  };
}

// ============================================================================
// Specialized Hooks
// ============================================================================

export interface UseTextSearchOptions<T> {
  items: T[];
  searchFields: (keyof T)[];
  initialSearch?: string;
}

/**
 * A simplified hook for text-only search across multiple fields.
 */
export function useTextSearch<T>({
  items,
  searchFields,
  initialSearch = '',
}: UseTextSearchOptions<T>) {
  const [search, setSearch] = useState(initialSearch);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    return items.filter(item => matchesSearch(item, search, searchFields));
  }, [items, search, searchFields]);

  const clearSearch = useCallback(() => {
    setSearch('');
  }, []);

  return {
    filteredItems,
    search,
    setSearch,
    clearSearch,
    hasSearch: search.trim().length > 0,
  };
}

export interface UseMultiSelectFilterOptions<T, V = string> {
  items: T[];
  field: keyof T;
  getFieldValue?: (item: T) => V | V[];
  initialSelected?: V[];
}

/**
 * A hook for filtering by multiple selected values (e.g., tags, labels).
 */
export function useMultiSelectFilter<T, V = string>({
  items,
  field,
  getFieldValue,
  initialSelected = [],
}: UseMultiSelectFilterOptions<T, V>) {
  const [selected, setSelected] = useState<V[]>(initialSelected);

  const filteredItems = useMemo(() => {
    if (selected.length === 0) return items;

    return items.filter(item => {
      const value = getFieldValue ? getFieldValue(item) : item[field];
      
      if (Array.isArray(value)) {
        // If field value is an array, check if any selected value is in it
        return selected.some(s => value.includes(s as never));
      }
      
      // If field value is a single value, check if it's in selected
      return selected.includes(value as V);
    });
  }, [items, selected, field, getFieldValue]);

  const toggleValue = useCallback((value: V) => {
    setSelected(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  }, []);

  const selectValue = useCallback((value: V) => {
    setSelected(prev => (prev.includes(value) ? prev : [...prev, value]));
  }, []);

  const deselectValue = useCallback((value: V) => {
    setSelected(prev => prev.filter(v => v !== value));
  }, []);

  const clearSelection = useCallback(() => {
    setSelected([]);
  }, []);

  const selectAll = useCallback((values: V[]) => {
    setSelected(values);
  }, []);

  return {
    filteredItems,
    selected,
    setSelected,
    toggleValue,
    selectValue,
    deselectValue,
    clearSelection,
    selectAll,
    hasSelection: selected.length > 0,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a filter criteria object with type safety.
 */
export function createFilter<T>(
  field: keyof T,
  operator: FilterOperator,
  value: unknown,
  caseSensitive = false
): FilterCriteria<T> {
  return { field, operator, value, caseSensitive };
}

/**
 * Combine multiple filter results using AND logic.
 */
export function combineFilters<T>(
  items: T[],
  ...filterFns: ((item: T) => boolean)[]
): T[] {
  return items.filter(item => filterFns.every(fn => fn(item)));
}
