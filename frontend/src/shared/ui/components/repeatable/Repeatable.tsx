/**
 * Repeatable Container Component
 * 
 * A reusable rendering and orchestration layer for repeatable items.
 * Provides structure without imposing layout or styling.
 * 
 * Consumers define their own UI via render props.
 */

import React, { type ReactNode, type ElementType } from 'react';

export interface RepeatableItemHelpers<TItem> {
  /** Update the item with a partial patch */
  update: (patch: Partial<TItem>) => void;

  /** Remove this item */
  remove: () => void;

  /** Move this item up one position */
  moveUp: () => void;

  /** Move this item down one position */
  moveDown: () => void;
}

export interface RepeatableProps<TItem> {
  /** Array of items to render */
  items: TItem[];

  /** Callback to add a new item */
  onAdd?: () => void;

  /** Callback to remove an item at index */
  onRemove?: (index: number) => void;

  /** Callback to update an item at index */
  onUpdate?: (index: number, patch: Partial<TItem>) => void;

  /** Callback to move an item from one index to another */
  onMove?: (from: number, to: number) => void;

  /** Whether more items can be added */
  canAdd?: boolean;

  /** Whether items can be removed */
  canRemove?: boolean;

  /** Content to show when items array is empty */
  emptyState?: ReactNode;

  /** Optional header content */
  header?: ReactNode;

  /** Optional footer content */
  footer?: ReactNode;

  /** Render function for each item */
  children: (item: TItem, index: number, helpers: RepeatableItemHelpers<TItem>) => ReactNode;

  /** Optional wrapper className */
  className?: string;

  /** Optional container element type */
  as?: ElementType;
}

/**
 * Repeatable - Generic container for repeatable items
 * 
 * @example
 * ```tsx
 * <Repeatable
 *   items={members}
 *   onAdd={addMember}
 *   onRemove={removeMember}
 *   onUpdate={updateMember}
 *   canAdd={canAdd}
 *   canRemove={canRemove}
 * >
 *   {(member, index, { update, remove }) => (
 *     <div>
 *       <input
 *         value={member.name}
 *         onChange={(e) => update({ name: e.target.value })}
 *       />
 *       <button onClick={remove}>Remove</button>
 *     </div>
 *   )}
 * </Repeatable>
 * ```
 */
export function Repeatable<TItem>({
  items,
  onRemove,
  onUpdate,
  onMove,
  canRemove = true,
  emptyState,
  header,
  footer,
  children,
  className,
  as: Component = 'div',
}: RepeatableProps<TItem>) {
  // Show empty state if no items
  if (items.length === 0 && emptyState) {
    return (
      <Component className={className}>
        {header}
        {emptyState}
        {footer}
      </Component>
    );
  }

  return (
    <Component className={className}>
      {header}
      
      {items.map((item, index) => {
        const helpers: RepeatableItemHelpers<TItem> = {
          update: (patch: Partial<TItem>) => {
            if (onUpdate) {
              onUpdate(index, patch);
            }
          },
          remove: () => {
            if (canRemove && onRemove) {
              onRemove(index);
            }
          },
          moveUp: () => {
            if (index > 0 && onMove) {
              onMove(index, index - 1);
            }
          },
          moveDown: () => {
            if (index < items.length - 1 && onMove) {
              onMove(index, index + 1);
            }
          },
        };

        return (
          <React.Fragment key={index}>
            {children(item, index, helpers)}
          </React.Fragment>
        );
      })}

      {footer}
    </Component>
  );
}
