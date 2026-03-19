/**
 * Layout Behavior Types
 * 
 * Determines scrolling strategy for layouts
 */

export type LayoutBehavior = 'default' | 'fixed-height';

export type LayoutMode = 
  | 'vertical-boxed' 
  | 'vertical-edge' 
  | 'vertical-two-columns'
  | 'horizontal-solid'
  | 'horizontal-dark'
  | 'horizontal-gradient'
  | 'horizontal-hero'
  | 'horizontal-stacked';
