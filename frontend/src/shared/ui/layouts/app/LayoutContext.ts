import { createContext } from 'react';
import type { LayoutBehavior, LayoutMode } from '../behaviors';

export type SidebarAppearance = 'light' | 'dark' | 'gradient';

/**
 * AppLayoutSettings - Single source of truth for all layout configurations
 */
export interface AppLayoutSettings {
  // Core structural mode
  layoutMode: LayoutMode;
  
  // Sidebar properties
  sidebarAppearance: SidebarAppearance;
  collapsed: boolean;
  sidebarWidth: number;
  enableSidebarResize: boolean;
  
  // Composition (Widgets/Slots)
  headerWidget: 'workspace' | 'user-hero' | 'none';

  footerWidget: 'default' | 'user-compact' | 'none';
  showUsage: boolean;
  showThemeToggler: boolean;
  
  // Right Panels
  rightPanel: 'none' | 'rail' | 'dual';
  activeRightPanelTab: string | null;
}


export interface LayoutContextValue {
  // Unified Settings
  settings: AppLayoutSettings;
  updateSettings: (updates: Partial<AppLayoutSettings>) => void;
  resetSettings: () => void;

  // Individual derived properties for convenience (backward compatibility)
  layoutMode: LayoutMode;
  layoutBehavior: LayoutBehavior;
  sidebarAppearance: SidebarAppearance;
  collapsed: boolean;
  sidebarWidth: number;
  enableSidebarResize: boolean;
  
  // Setters (will proxy to updateSettings)
  setLayoutMode: (mode: LayoutMode) => void;
  setSidebarAppearance: (appearance: SidebarAppearance) => void;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  setSidebarWidth: (width: number) => void;
  setEnableSidebarResize: (enable: boolean) => void;

  // Navigation State
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  activeGroupId: string | null;
  setActiveGroupId: (id: string | null) => void;

  // Custom Slots (Used by Layout Builder for live sync)
  sidebarProps?: any; 
  setSidebarProps: (props: any) => void;
  rightSlot?: React.ReactNode;
  setRightSlot: (slot: React.ReactNode) => void;

  // Shell Accessories State
  activeRightPanelTab: string | null;
  setActiveRightPanelTab: (tab: string | null) => void;
}

/**
 * LayoutContext - Separated from LayoutProvider
 * 
 * When createContext() is in the same file as the provider component,
 * React Fast Refresh can cause context identity mismatches during HMR.
 * By isolating the context in its own file, the context object identity
 * remains stable across hot reloads.
 */
export const LayoutContext = createContext<LayoutContextValue | null>(null);
