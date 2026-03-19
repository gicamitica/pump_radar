import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItemBase } from '@/shared/ui/components/dnd/SortableItemBase';
import { cn } from '@/shadcn/lib/utils';

export interface RepeatableSortableProps<TItem> {
  items: TItem[];

  /** Core reorder handler */
  onMove: (fromIndex: number, toIndex: number) => void;

  /** Required for stable drag identity */
  getItemId: (item: TItem) => string;

  /** Sorting strategy */
  strategy?: 'vertical' | 'horizontal' | 'grid';

  /** Disable drag behavior conditionally */
  disabled?: boolean;

  /** Render prop */
  children: (item: TItem, index: number) => React.ReactNode;
  
  /** Optional wrapper class name */
  className?: string;

  /** Optional item class name or function */
  itemClassName?: string | ((item: TItem, index: number) => string);

  /** Optional item data function */
  itemData?: (item: TItem, index: number) => Record<string, unknown>;

  /** Whether to omit DndContext (if provided by parent) */
  omitContext?: boolean;
}

/**
 * RepeatableSortable - Drag & Drop Plugin for Repeatable Lists
 * 
 * Adds drag and drop reordering capabilities to a list of items.
 * Integrates with the useRepeatable hook's onMove handler.
 * 
 * Features:
 * - Built-in DndContext and SortableContext setup
 * - Multiple sorting strategies (vertical, horizontal, grid)
 * - Automatic sensor configuration
 * - Works seamlessly with useRepeatable hook
 * 
 * @example
 * ```tsx
 * const items = useRepeatable({ ... });
 * 
 * <RepeatableSortable
 *   items={items.items}
 *   onMove={items.moveItem}
 *   getItemId={(item) => item.id}
 *   strategy="vertical"
 * >
 *   {(item, index) => (
 *     <div>
 *       <SortableHandle><GripVertical /></SortableHandle>
 *       {item.name}
 *     </div>
 *   )}
 * </RepeatableSortable>
 * ```
 */
export function RepeatableSortable<TItem>({
  items,
  onMove,
  getItemId,
  strategy = 'vertical',
  disabled = false,
  children,
  className,
  itemClassName,
  itemData,
  omitContext = false,
}: RepeatableSortableProps<TItem>) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getStrategy = () => {
    switch (strategy) {
      case 'horizontal':
        return horizontalListSortingStrategy;
      case 'grid':
        return rectSortingStrategy;
      case 'vertical':
      default:
        return verticalListSortingStrategy;
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((item) => getItemId(item) === active.id);
      const newIndex = items.findIndex((item) => getItemId(item) === over?.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        onMove(oldIndex, newIndex);
      }
    }
  };

  if (disabled) {
    return (
      <div className={className}>
        {items.map((item, index) => children(item, index))}
      </div>
    );
  }

  const content = (
    <SortableContext
      items={items.map(getItemId)}
      strategy={getStrategy()}
    >
      <div className={className}>
        {items.map((item, index) => (
          <SortableItemBase
            key={getItemId(item)}
            id={getItemId(item)}
            useDragHandle
            className={cn(
              typeof itemClassName === 'function' ? itemClassName(item, index) : itemClassName
            )}
            data={itemData?.(item, index)}
          >
            {children(item, index)}
          </SortableItemBase>
        ))}
      </div>
    </SortableContext>
  );

  if (omitContext) {
    return content;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      {content}
    </DndContext>
  );
}

// Re-export unified components for convenience
export { SortableHandle } from '@/shared/ui/components/dnd/SortableHandle';
export { useSortableItem } from '@/shared/ui/components/dnd/SortableItemBase';
