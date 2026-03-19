import type { LayoutBehavior } from './types';

/**
 * Returns Tailwind classes based on layout behavior
 * 
 * @param behavior - 'default' for normal scrolling, 'fixed-height' for independent scroll
 */
export function applyLayoutBehavior(behavior: LayoutBehavior): string {
  return behavior === 'fixed-height'
    ? 'h-dvh overflow-hidden'
    : 'min-h-dvh';
}
