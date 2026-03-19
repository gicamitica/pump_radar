import type { SidebarAppearance } from '../tokens/sidebarAppearances';

export interface SidebarAppearanceRegistryItem {
  id: SidebarAppearance;
  titleKey: string;
  descriptionKey: string;
}

/**
 * Sidebar Appearance Registry
 * 
 * Central registry of available sidebar appearances.
 * Drives selector UI and preview rendering.
 * 
 * No colors or styles are defined here - those come from sidebarAppearances.ts
 */
export const sidebarAppearanceRegistry: SidebarAppearanceRegistryItem[] = [
  {
    id: 'light',
    titleKey: 'sidebarAppearance.light.title',
    descriptionKey: 'sidebarAppearance.light.description',
  },
  {
    id: 'dark',
    titleKey: 'sidebarAppearance.dark.title',
    descriptionKey: 'sidebarAppearance.dark.description',
  },
  {
    id: 'gradient',
    titleKey: 'sidebarAppearance.gradient.title',
    descriptionKey: 'sidebarAppearance.gradient.description',
  },
];
