/**
 * Base Sortable Item Component
 * 
 * Shared foundation for all sortable item implementations.
 * Replaces duplicate logic in DraggableItem and RepeatableSortable's internal SortableItem.
 * 
 * Features:
 * - Context-based drag handle support
 * - Overlay support for drag previews
 * - Flexible handle positioning
 * - TypeScript generics for data typing
 */

import { forwardRef, createContext, useContext, type ReactNode, type HTMLAttributes } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { UniqueIdentifier } from '@dnd-kit/core';
import { cn } from '@/shadcn/lib/utils';

// ============================================================================
// Context
// ============================================================================

interface SortableItemContextValue {
  listeners?: ReturnType<typeof useSortable>['listeners'];
  attributes?: ReturnType<typeof useSortable>['attributes'];
  setActivatorNodeRef: (node: HTMLElement | null) => void;
  isDragging: boolean;
}

const SortableItemContext = createContext<SortableItemContextValue | null>(null);

/**
 * Hook to access sortable item context
 * Must be used within a SortableItemBase component
 */
export const useSortableItem = () => {
  const context = useContext(SortableItemContext);
  if (!context) {
    throw new Error('useSortableItem must be used within a SortableItemBase or its derivatives');
  }
  return context;
};

// ============================================================================
// SortableItemBase Component
// ============================================================================

export interface SortableItemBaseProps extends Omit<HTMLAttributes<HTMLDivElement>, 'id'> {
  /** Unique identifier for the sortable item */
  id: UniqueIdentifier;
  
  /** Content to render inside the sortable item */
  children: ReactNode;
  
  /** Additional data to attach to the drag event */
  data?: Record<string, unknown>;
  
  /** Whether dragging is disabled */
  disabled?: boolean;
  
  /** Whether this is being rendered as an overlay during drag */
  isOverlay?: boolean;
  
  /** 
   * Whether to use a drag handle instead of making the entire item draggable.
   * When true, drag listeners are NOT applied to the container.
   * Use SortableHandle component for the handle.
   */
  useDragHandle?: boolean;
}

/**
 * Base sortable item component that integrates with @dnd-kit/sortable.
 * Provides context for child components to access drag functionality.
 * 
 * @example
 * ```tsx
 * // With drag handle
 * <SortableItemBase id={item.id} useDragHandle>
 *   <SortableHandle><GripVertical /></SortableHandle>
 *   <div>Content</div>
 * </SortableItemBase>
 * 
 * // Entire item draggable
 * <SortableItemBase id={item.id}>
 *   <div>Draggable content</div>
 * </SortableItemBase>
 * ```
 */
export const SortableItemBase = forwardRef<HTMLDivElement, SortableItemBaseProps>(
  (
    {
      id,
      children,
      data,
      disabled = false,
      isOverlay = false,
      useDragHandle = false,
      className,
      ...props
    },
    ref
  ) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      setActivatorNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id,
      data,
      disabled: disabled || isOverlay,
    });

    const style = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transform: CSS.Transform.toString(transform as any),
      transition,
    };

    return (
      <SortableItemContext.Provider
        value={{ listeners, attributes, setActivatorNodeRef, isDragging }}
      >
        <div
          ref={(node) => {
            setNodeRef(node);
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          style={style}
          className={cn(
            'touch-none',
            isDragging && 'opacity-50 z-50',
            isOverlay && 'shadow-lg ring-2 ring-primary',
            className
          )}
          {...attributes}
          {...(!useDragHandle ? listeners : {})}
          {...props}
        >
          {children}
        </div>
      </SortableItemContext.Provider>
    );
  }
);

SortableItemBase.displayName = 'SortableItemBase';
