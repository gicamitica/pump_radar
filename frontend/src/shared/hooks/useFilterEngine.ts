/**
 * Filter Engine Hook
 *
 * A headless hook for managing filter state with centralized active detection
 * and reset logic. Does NOT filter items - that remains the responsibility
 * of the consuming component.
 *
 * Design principles:
 * - Owns filter state (no external useState needed)
 * - Provides typed filter definitions with custom isActive logic
 * - Centralizes hasActive detection and reset behavior
 * - Exposes metadata for UI (chips, badges, counts)
 * - Does NOT perform filtering - logic stays in the component
 * - Does NOT generate UI - composition remains flexible
 */

import { useState, useMemo, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * Definition for a single filter field.
 * Each filter has a default value and an isActive predicate.
 */
export interface FilterDefinition<T> {
  /** The default/reset value for this filter */
  defaultValue: T;
  /** Determines if the filter is considered "active" (non-default) */
  isActive: (value: T) => boolean;
  /** Optional label for UI display (chips, badges) */
  label?: string;
  /** Optional serializer for URL/storage persistence (future-proofing) */
  serialize?: (value: T) => string;
  /** Optional deserializer for URL/storage persistence (future-proofing) */
  deserialize?: (value: string) => T;
}

/**
 * A record of filter definitions keyed by filter name.
 */
export type FilterDefinitions<T extends Record<string, unknown>> = {
  [K in keyof T]: FilterDefinition<T[K]>;
};

/**
 * Extracts the value types from filter definitions.
 */
export type FilterValues<T extends FilterDefinitions<Record<string, unknown>>> = {
  [K in keyof T]: T[K]['defaultValue'];
};

/**
 * Represents an active filter entry for UI rendering.
 */
export interface ActiveFilterEntry<K = string, V = unknown> {
  /** The filter key */
  key: K;
  /** The current value */
  value: V;
  /** Optional display label */
  label?: string;
  /** Function to reset this specific filter */
  reset: () => void;
}

/**
 * The return type of useFilterEngine.
 */
export interface UseFilterEngineResult<T extends Record<string, unknown>> {
  /** Current filter values */
  values: T;
  /** Set a specific filter value */
  set: <K extends keyof T>(key: K, value: T[K]) => void;
  /** Reset a specific filter to its default value */
  reset: (key: keyof T) => void;
  /** Reset all filters to their default values */
  resetAll: () => void;
  /** Whether any filter is currently active */
  hasActive: boolean;
  /** Count of active filters */
  activeCount: number;
  /** Array of active filter entries for UI rendering */
  activeEntries: ActiveFilterEntry<keyof T, T[keyof T]>[];
  /** Check if a specific filter is active */
  isActive: (key: keyof T) => boolean;
  /** Get the default value for a filter */
  getDefault: <K extends keyof T>(key: K) => T[K];
}

// ============================================================================
// Helper: defineFilters
// ============================================================================

/**
 * Helper function to define filters with full type inference.
 * This is the recommended way to create filter definitions.
 *
 * @example
 * const userFilters = defineFilters({
 *   search: {
 *     defaultValue: '',
 *     isActive: v => v.length > 0,
 *   },
 *   status: {
 *     defaultValue: 'all' as const,
 *     isActive: v => v !== 'all',
 *     label: 'Status',
 *   },
 *   roles: {
 *     defaultValue: [] as string[],
 *     isActive: v => v.length > 0,
 *     label: 'Roles',
 *   },
 * });
 */
export function defineFilters<T extends Record<string, unknown>>(
  definitions: FilterDefinitions<T>
): FilterDefinitions<T> {
  return definitions;
}

// ============================================================================
// Common Filter Presets
// ============================================================================

/**
 * Creates a text search filter definition.
 */
export function textFilter(label?: string): FilterDefinition<string> {
  return {
    defaultValue: '',
    isActive: (v) => v.trim().length > 0,
    label,
  };
}

/**
 * Creates a select filter with an "all" default option.
 */
export function selectFilter<T extends string>(
  allValue: T,
  label?: string
): FilterDefinition<T> {
  return {
    defaultValue: allValue,
    isActive: (v) => v !== allValue,
    label,
  };
}

/**
 * Creates a multi-select filter (array of values).
 */
export function multiSelectFilter<T>(label?: string): FilterDefinition<T[]> {
  return {
    defaultValue: [] as T[],
    isActive: (v) => v.length > 0,
    label,
  };
}

/**
 * Creates a boolean filter.
 */
export function booleanFilter(
  defaultValue: boolean = false,
  label?: string
): FilterDefinition<boolean> {
  return {
    defaultValue,
    isActive: (v) => v !== defaultValue,
    label,
  };
}

/**
 * Creates a date range filter.
 */
export function dateRangeFilter(
  label?: string
): FilterDefinition<{ from?: Date; to?: Date }> {
  return {
    defaultValue: {},
    isActive: (v) => v.from !== undefined || v.to !== undefined,
    label,
  };
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * A headless hook for managing filter state.
 *
 * This hook:
 * - Owns filter state based on provided definitions
 * - Provides centralized active filter detection
 * - Provides centralized reset logic
 * - Exposes metadata for UI rendering (chips, badges)
 * - Does NOT filter items (that's the component's job)
 *
 * @example
 * const filters = useFilterEngine(
 *   defineFilters({
 *     search: { defaultValue: '', isActive: v => v.length > 0 },
 *     status: { defaultValue: 'all', isActive: v => v !== 'all', label: 'Status' },
 *   })
 * );
 *
 * // Use filter values for your own filtering logic
 * const filteredUsers = useMemo(() => {
 *   return users.filter(user => {
 *     if (filters.values.search && !user.name.includes(filters.values.search)) {
 *       return false;
 *     }
 *     if (filters.values.status !== 'all' && user.status !== filters.values.status) {
 *       return false;
 *     }
 *     return true;
 *   });
 * }, [users, filters.values]);
 *
 * // Use hasActive for UI
 * {filters.hasActive && <ClearFiltersButton onClick={filters.resetAll} />}
 *
 * // Use activeEntries for filter chips
 * {filters.activeEntries.map(entry => (
 *   <FilterChip key={entry.key} label={entry.label} onRemove={entry.reset} />
 * ))}
 */
export function useFilterEngine<T extends Record<string, unknown>>(
  definitions: FilterDefinitions<T>
): UseFilterEngineResult<T> {
  // Extract default values from definitions
  const defaultValues = useMemo(() => {
    const defaults = {} as T;
    for (const key in definitions) {
      defaults[key] = definitions[key].defaultValue as T[typeof key];
    }
    return defaults;
  }, [definitions]);

  // Filter state
  const [values, setValues] = useState<T>(defaultValues);

  // Set a specific filter value
  const set = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Reset a specific filter to default
  const reset = useCallback(
    (key: keyof T) => {
      setValues((prev) => ({ ...prev, [key]: definitions[key].defaultValue }));
    },
    [definitions]
  );

  // Reset all filters to defaults
  const resetAll = useCallback(() => {
    setValues(defaultValues);
  }, [defaultValues]);

  // Check if a specific filter is active
  const isActive = useCallback(
    (key: keyof T): boolean => {
      const definition = definitions[key];
      return definition.isActive(values[key] as never);
    },
    [definitions, values]
  );

  // Get default value for a filter
  const getDefault = useCallback(
    <K extends keyof T>(key: K): T[K] => {
      return definitions[key].defaultValue as T[K];
    },
    [definitions]
  );

  // Compute active entries for UI
  const activeEntries = useMemo(() => {
    const entries: ActiveFilterEntry<keyof T, T[keyof T]>[] = [];

    for (const key in definitions) {
      const definition = definitions[key];
      const value = values[key];

      if (definition.isActive(value as never)) {
        entries.push({
          key,
          value: value as T[keyof T],
          label: definition.label,
          reset: () => reset(key),
        });
      }
    }

    return entries;
  }, [definitions, values, reset]);

  // Compute hasActive
  const hasActive = activeEntries.length > 0;

  // Compute activeCount
  const activeCount = activeEntries.length;

  return {
    values,
    set,
    reset,
    resetAll,
    hasActive,
    activeCount,
    activeEntries,
    isActive,
    getDefault,
  };
}

// ============================================================================
// Type Utilities
// ============================================================================

/**
 * Utility type to infer filter values from a defineFilters call.
 *
 * @example
 * const filterDefs = defineFilters({ ... });
 * type MyFilterValues = InferFilterValues<typeof filterDefs>;
 */
export type InferFilterValues<T> = T extends FilterDefinitions<infer V> ? V : never;
