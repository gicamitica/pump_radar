import { useContext } from 'react';
import { LayoutContext, type LayoutContextValue } from './LayoutContext';

/**
 * Hook to access layout context
 * 
 * Provides:
 * - layoutMode: Current layout variant
 * - setLayoutMode: Change layout variant
 * - layoutBehavior: Current behavior (default | fixed-height)
 * - collapsed: Sidebar collapsed state
 * - toggleCollapsed: Toggle sidebar collapsed
 * - mobileOpen: Mobile sidebar open state
 * - setMobileOpen: Set mobile sidebar state
 * - activeGroupId: Active group for two-column layout
 * - setActiveGroupId: Set active group
 */
export function useLayout(): LayoutContextValue {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}
