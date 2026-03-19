/**
 * Repeatable System - Exports
 * 
 * Generic, reusable system for managing repeatable UI patterns.
 */

export { useRepeatable } from '@/shared/hooks/useRepeatable';
export type {
  UseRepeatableOptions,
  UseRepeatableReturn,
} from '@/shared/hooks/useRepeatable';

export { Repeatable } from './Repeatable';
export type {
  RepeatableProps,
  RepeatableItemHelpers,
} from './Repeatable';

// Plugins
export { RepeatableSortable, SortableHandle, useSortableItem } from './plugins/RepeatableSortable';
export type { RepeatableSortableProps } from './plugins/RepeatableSortable';

export { createZodItemValidator, createZodArrayValidator } from './plugins/zod-adapters';
