import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { LayoutBehavior, LayoutMode } from '../behaviors';
import { moduleRegistry } from '@/core/di/container';
import { 
  LayoutContext, 
  type SidebarAppearance, 
  type LayoutContextValue,
  type AppLayoutSettings 
} from './LayoutContext';
import { usePersistentState } from '@/shared/hooks';
import { useService } from '@/app/providers/useService';
import { CORE_SYMBOLS } from '@/core/di/symbols';
import type { IConfig } from '@/shared/infrastructure/config/Config';

// Re-export types for backwards compatibility
export type { SidebarAppearance, LayoutContextValue } from './LayoutContext';
export { LayoutContext } from './LayoutContext';

const SETTINGS_KEY = 'katalyst-layout-settings-v1';

interface LayoutProviderProps {
  children: React.ReactNode;
}

export const LayoutProvider: React.FC<LayoutProviderProps> = ({ children }) => {
  const location = useLocation();
  const config = useService<IConfig>(CORE_SYMBOLS.IConfig);

  const DEFAULT_SETTINGS: AppLayoutSettings = useMemo(() => ({
    layoutMode: 'vertical-edge',
    sidebarAppearance: 'light',
    collapsed: false,
    sidebarWidth: config.sidebar.defaultWidth,
    enableSidebarResize: config.sidebar.enableResize,
    headerWidget: 'none',
    footerWidget: 'default',
    showUsage: false,
    showThemeToggler: true,
    rightPanel: 'dual',
    activeRightPanelTab: null,
  }), [config]);


  // Unified Settings (Unique Source of Truth)
  const [settings, setSettings] = usePersistentState<AppLayoutSettings>(
    SETTINGS_KEY,
    DEFAULT_SETTINGS
  );

  // Update Settings Helper
  const updateSettings = useCallback((updates: Partial<AppLayoutSettings>) => {
    setSettings((prev: AppLayoutSettings) => ({ ...prev, ...updates }));
  }, [setSettings]);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, [setSettings, DEFAULT_SETTINGS]);

  // Proxied Setters for Backward Compatibility and Cleaner API
  const setLayoutMode = useCallback((mode: LayoutMode) => updateSettings({ layoutMode: mode }), [updateSettings]);
  const setSidebarAppearance = useCallback((app: SidebarAppearance) => updateSettings({ sidebarAppearance: app }), [updateSettings]);
  const setCollapsed = useCallback((collapsed: boolean) => updateSettings({ collapsed }), [updateSettings]);
  const toggleCollapsed = useCallback(() => setSettings((prev: AppLayoutSettings) => ({ ...prev, collapsed: !prev.collapsed })), [setSettings]);
  const setSidebarWidth = useCallback((width: number) => updateSettings({ sidebarWidth: width }), [updateSettings]);
  const setEnableSidebarResize = useCallback((enable: boolean) => updateSettings({ enableSidebarResize: enable }), [updateSettings]);

  // Volatile / UI State (Not persisted or managed separately)
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string | null>('home');
  const [sidebarProps, setSidebarProps] = useState<any>({});
  const [rightSlot, setRightSlot] = useState<React.ReactNode>(null);
  const setActiveRightPanelTab = useCallback((tab: string | null) => updateSettings({ activeRightPanelTab: tab }), [updateSettings]);


  // Layout behavior from route registry
  const layoutBehavior: LayoutBehavior = useMemo(() => {
    return moduleRegistry.getRouteBehavior(location.pathname);
  }, [location.pathname]);

  // Sync mobile sidebar
  const prevPathname = React.useRef(location.pathname);
  useEffect(() => {
    if (prevPathname.current !== location.pathname) {
      prevPathname.current = location.pathname;
      if (mobileOpen) {
        setMobileOpen(false);
      }
    }
  }, [location.pathname, mobileOpen]);

  // Construct Context Value
  const value = useMemo<LayoutContextValue>(() => ({
    settings,
    updateSettings,
    resetSettings,

    // Individual properties (derived from settings)
    layoutMode: settings.layoutMode,
    layoutBehavior,
    sidebarAppearance: settings.sidebarAppearance,
    collapsed: settings.collapsed,
    sidebarWidth: settings.sidebarWidth,
    enableSidebarResize: settings.enableSidebarResize,
    
    // Setters
    setLayoutMode,
    setSidebarAppearance,
    setCollapsed,
    toggleCollapsed,
    setSidebarWidth,
    setEnableSidebarResize,

    // Nav State
    mobileOpen,
    setMobileOpen,
    activeGroupId,
    setActiveGroupId,

    // Slots
    sidebarProps,
    setSidebarProps,
    rightSlot,
    setRightSlot,

    // Accessories
    activeRightPanelTab: settings.activeRightPanelTab,
    setActiveRightPanelTab,
  }), [
    settings,
    updateSettings,
    resetSettings,
    layoutBehavior,
    setLayoutMode,
    setSidebarAppearance,
    setCollapsed,
    toggleCollapsed,
    setSidebarWidth,
    setEnableSidebarResize,
    mobileOpen,
    activeGroupId,
    sidebarProps,
    rightSlot,
    setActiveRightPanelTab,
  ]);


  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
};
