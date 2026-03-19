/**
 * Sortable Handle Component
 * 
 * Unified drag handle component that works with SortableItemBase.
 * Replaces both DragHandle and the plugin-specific SortableHandle.
 * 
 * Features:
 * - Automatically consumes sortable context
 * - Accessible button element
 * - Keyboard navigation support
 * - Customizable styling
 */

import { forwardRef, type HTMLAttributes } from 'react';
import { useSortableItem } from './SortableItemBase';
import { cn } from '@/shadcn/lib/utils';

export interface SortableHandleProps extends HTMLAttributes<HTMLButtonElement> {
  /** Whether the handle is disabled */
  disabled?: boolean;
}

/**
 * Drag handle component for use within SortableItemBase.
 * Automatically connects to the sortable context.
 * 
 * @example
 * ```tsx
 * <SortableItemBase id={item.id} useDragHandle>
 *   <div className="flex gap-2">
 *     <SortableHandle>
 *       <GripVertical className="h-4 w-4" />
 *     </SortableHandle>
 *     <div>Content</div>
 *   </div>
 * </SortableItemBase>
 * ```
 */
export const SortableHandle = forwardRef<HTMLButtonElement, SortableHandleProps>(
  ({ disabled, className, children, ...props }, ref) => {
    const { listeners, setActivatorNodeRef } = useSortableItem();

    return (
      <button
        ref={(node) => {
          setActivatorNodeRef(node);
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        type="button"
        className={cn(
          'cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          'transition-colors',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
        disabled={disabled}
        {...listeners}
        {...props}
      >
        {children}
      </button>
    );
  }
);

SortableHandle.displayName = 'SortableHandle';
