/**
 * Drag & Drop UI Components
 * 
 * Utility components for drag and drop functionality.
 * 
 * For sortable lists, use the unified components:
 * - @/shared/ui/components/dnd - Core primitives
 * - @/shared/ui/components/repeatable - High-level components (recommended)
 */

import { forwardRef, type ReactNode, type HTMLAttributes } from 'react';
import type { UniqueIdentifier } from '@dnd-kit/core';
import { cn } from '@/shadcn/lib/utils';

// Re-export unified components for convenience
export { 
  SortableItemBase, 
  useSortableItem 
} from '@/shared/ui/components/dnd/SortableItemBase';
export type { SortableItemBaseProps } from '@/shared/ui/components/dnd/SortableItemBase';

export { SortableHandle } from '@/shared/ui/components/dnd/SortableHandle';
export type { SortableHandleProps } from '@/shared/ui/components/dnd/SortableHandle';

// ============================================================================
// DragOverlayContent
// ============================================================================

export interface DragOverlayContentProps extends HTMLAttributes<HTMLDivElement> {
  /** Content to render in the overlay */
  children: ReactNode;
}

/**
 * A wrapper for content rendered in a DragOverlay.
 * Applies consistent styling for the dragged item preview.
 */
export const DragOverlayContent = forwardRef<HTMLDivElement, DragOverlayContentProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'shadow-lg ring-2 ring-primary rounded-lg rotate-3 cursor-grabbing',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DragOverlayContent.displayName = 'DragOverlayContent';

// ============================================================================
// DroppableZone
// ============================================================================

export interface DroppableZoneProps extends Omit<HTMLAttributes<HTMLDivElement>, 'id'> {
  /** Unique identifier for the droppable zone */
  id: UniqueIdentifier;
  /** Content to render inside the droppable zone */
  children: ReactNode;
  /** Whether the zone is currently being dragged over */
  isOver?: boolean;
  /** Additional data to attach to the drop zone */
  data?: Record<string, unknown>;
  /** Whether dropping is disabled */
  disabled?: boolean;
}

/**
 * A generic droppable zone that can accept draggable items.
 * Provides visual feedback when items are dragged over it.
 * 
 * Note: This component is currently not widely used.
 * Consider using RepeatableSortable for most sortable list use cases.
 */
export const DroppableZone = forwardRef<HTMLDivElement, DroppableZoneProps>(
  ({ id, children, isOver, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-droppable-id={id}
        className={cn(
          'transition-colors duration-200',
          isOver && 'bg-primary/5 ring-2 ring-primary/20 ring-dashed',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DroppableZone.displayName = 'DroppableZone';

// ============================================================================
// EmptyDropZone
// ============================================================================

export interface EmptyDropZoneProps extends HTMLAttributes<HTMLDivElement> {
  /** Message to display in the empty zone */
  message?: string;
  /** Whether the zone is being dragged over */
  isOver?: boolean;
}

/**
 * A placeholder component for empty droppable zones.
 * Shows a visual indicator that items can be dropped here.
 */
export const EmptyDropZone = forwardRef<HTMLDivElement, EmptyDropZoneProps>(
  ({ message = 'Drop items here', isOver, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-center p-4 min-h-[100px]',
          'border-2 border-dashed rounded-lg',
          'text-sm text-muted-foreground',
          'transition-colors duration-200',
          isOver
            ? 'border-primary bg-primary/5 text-primary'
            : 'border-muted-foreground/25',
          className
        )}
        {...props}
      >
        {message}
      </div>
    );
  }
);

EmptyDropZone.displayName = 'EmptyDropZone';
