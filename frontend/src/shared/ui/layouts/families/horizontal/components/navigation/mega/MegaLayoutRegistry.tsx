import React from 'react';
import { type NavItem, type NavGroup } from '@/app/config/navigation';

/**
 * Props passed to all megamenu layout components
 */
export interface MegaLayoutProps {
  group: NavGroup;
  items: NavItem[];
}

/**
 * Available megamenu layout component types
 */
export type MegaLayoutType = 
  | 'showcase'      // Custom Showcase megamenu with all zones
  | 'tabbed'        // Vertical tabs with content panel
  | 'columns'       // Multi-column simple layout
  | 'default';      // Basic grid layout

/**
 * Registry mapping layout types to their components
 * Components are lazy-loaded to keep bundle size optimal
 */
export const megaLayoutRegistry: Record<MegaLayoutType, React.LazyExoticComponent<React.FC<MegaLayoutProps>>> = {
  showcase: React.lazy(() => import('./layouts/ShowcaseMegaLayout').then(m => ({ default: m.ShowcaseMegaLayout }))),
  tabbed: React.lazy(() => import('./layouts/TabbedMegaLayout').then(m => ({ default: m.TabbedMegaLayout }))),
  columns: React.lazy(() => import('./layouts/ColumnsMegaLayout').then(m => ({ default: m.ColumnsMegaLayout }))),
  default: React.lazy(() => import('./layouts/DefaultMegaLayout').then(m => ({ default: m.DefaultMegaLayout }))),
};

/**
 * Get the layout component for a given type
 */
export const getMegaLayoutComponent = (type: MegaLayoutType): React.LazyExoticComponent<React.FC<MegaLayoutProps>> => {
  return megaLayoutRegistry[type] ?? megaLayoutRegistry.default;
};
