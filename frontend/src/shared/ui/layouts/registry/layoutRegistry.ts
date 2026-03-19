import type { LayoutMode } from "../behaviors/types";

export interface LayoutMetadata {
  id: LayoutMode;
  titleKey: string;
  descriptionKey: string;
  mode: LayoutMode,
  family: 'vertical' | 'horizontal';
  variant: string;
}

/**
 * Layout Registry - Metadata for all available layouts
 * 
 * Used by Settings panel to display layout preview matrix
 */
export const layoutRegistry: LayoutMetadata[] = [
  // Vertical layouts
  {
    id: 'vertical-boxed',
    mode: 'vertical-boxed',
    titleKey: 'vertical.boxed.title',
    descriptionKey: 'vertical.boxed.description',
    family: 'vertical',
    variant: 'boxed',
  },
  {
    id: 'vertical-edge',
    mode: 'vertical-edge',
    titleKey: 'vertical.edge.title',
    descriptionKey: 'vertical.edge.description',
    family: 'vertical',
    variant: 'edge',
  },
  {
    id: 'vertical-two-columns',
    mode: 'vertical-two-columns',
    titleKey: 'vertical.doubleSidebar.title',
    descriptionKey: 'vertical.doubleSidebar.description',
    family: 'vertical',
    variant: 'double-sidebar',
  },
  
  // Horizontal layouts
  {
    id: 'horizontal-solid',
    mode: 'horizontal-solid',
    titleKey: 'horizontal.solid.title',
    descriptionKey: 'horizontal.solid.description',
    family: 'horizontal',
    variant: 'solid',
  },
  {
    id: 'horizontal-stacked',
    mode: 'horizontal-stacked',
    titleKey: 'horizontal.stacked.title',
    descriptionKey: 'horizontal.stacked.description',
    family: 'horizontal',
    variant: 'stacked',
  },
  {
    id: 'horizontal-hero',
    mode: 'horizontal-hero',
    titleKey: 'horizontal.hero.title',
    descriptionKey: 'horizontal.hero.description',
    family: 'horizontal',
    variant: 'hero',
  },
  {
    id: 'horizontal-dark',
    mode: 'horizontal-dark',
    titleKey: 'horizontal.dark.title',
    descriptionKey: 'horizontal.dark.description',
    family: 'horizontal',
    variant: 'dark',
  },
  {
    id: 'horizontal-gradient',
    mode: 'horizontal-gradient',
    titleKey: 'horizontal.gradient.title',
    descriptionKey: 'horizontal.gradient.description',
    family: 'horizontal',
    variant: 'gradient',
  }
];

/**
 * Get layout metadata by ID
 */
export function getLayoutMetadata(id: LayoutMode): LayoutMetadata | undefined {
  return layoutRegistry.find(layout => layout.id === id);
}

/**
 * Get all layouts for a specific family
 */
export function getLayoutsByFamily(family: 'vertical' | 'horizontal'): LayoutMetadata[] {
  return layoutRegistry.filter(layout => layout.family === family);
}

/**
 * Group layouts by family
 */
export function groupLayoutsByFamily(): Record<'vertical' | 'horizontal', LayoutMetadata[]> {
  return {
    vertical: getLayoutsByFamily('vertical'),
    horizontal: getLayoutsByFamily('horizontal'),
  };
}
