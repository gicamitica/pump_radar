import React from 'react';
import { cn } from '@/shadcn/lib/utils';
import { applyLayoutBehavior } from '../../../behaviors';
import type { LayoutBehavior, LayoutMode } from '../../../behaviors';

interface HorizontalShellProps {
  behavior: LayoutBehavior;
  variant: LayoutMode;
  children: React.ReactNode;
}

/**
 * HorizontalShell - Base shell for horizontal layout family
 * 
 * Responsibilities:
 * - Defines the flex column container
 * - Applies layout behavior (default vs fixed-height)
 * - Coordinates z-index stacking
 * 
 * Does NOT:
 * - Style navigation bars (variants do this)
 * - Render navigation (nav components do this)
 */
export const HorizontalShell: React.FC<HorizontalShellProps> = ({ behavior, variant, children }) => {
  return (
    <div data-layout={variant} className={cn(
      'flex flex-col w-full',
      applyLayoutBehavior(behavior)
    )}>
      {children}
    </div>
  );
};
