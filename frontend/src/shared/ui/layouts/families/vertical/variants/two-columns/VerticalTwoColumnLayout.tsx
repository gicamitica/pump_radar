import React, { useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';
import { useLayout } from '../../../../app';
import { VerticalShell } from '../../shell/VerticalShell';
import { Sidebar, SidebarResizeHandle } from '../../components/sidebar';
import { GroupRail } from '../../components/rail';
import { getSidebarAppearance } from '../../../../tokens/sidebarAppearances';
import { navigationSections } from '@/app/config/navigation';
import TopBar from '@/shared/ui/layouts/components/topbar/TopBar';

/**
 * VerticalTwoColumnLayout - Group rail + sidebar layout
 * 
 * Features:
 * - Column 1: Icon-only group rail
 * - Column 2: Full sidebar for selected group
 * - Group-driven navigation
 */
export const VerticalTwoColumnLayout: React.FC = () => {
  const { 
    layoutBehavior,
    sidebarAppearance,
    collapsed, 
    toggleCollapsed, 
    mobileOpen, 
    setMobileOpen,
    activeGroupId,
    setActiveGroupId,
    sidebarWidth,
    setSidebarWidth,
    enableSidebarResize,
    sidebarProps,
    rightSlot
  } = useLayout();
  const [isResizing, setIsResizing] = React.useState(false);

  const isFixedHeight = layoutBehavior === 'fixed-height';

  // Get active group's items
  const activeGroup = useMemo(() => {
    return navigationSections.find(g => g.id === activeGroupId) || navigationSections[0];
  }, [activeGroupId]);

  return (
    <VerticalShell behavior={layoutBehavior} rightSlot={rightSlot}>
      {/* Column 1: Group Rail - Desktop */}
      <aside
        style={getSidebarAppearance(sidebarAppearance)}
        className={cn(
          'hidden md:flex flex-col',
          'sticky top-0 h-dvh w-16',
          'bg-sidebar sidebar-surface text-sidebar-foreground shadow-sm',
          'border-r border-sidebar-border'
        )}
      >
        <GroupRail
          groups={navigationSections}
          activeGroupId={activeGroupId}
          onSelect={setActiveGroupId}
          collapsed={collapsed}
        />
      </aside>

      {/* Column 2: Sidebar - Desktop */}
      <motion.aside
        style={getSidebarAppearance(sidebarAppearance)}
        className={cn(
          'hidden md:flex flex-col',
          'sticky top-0 h-dvh z-30',
          'bg-sidebar sidebar-surface text-sidebar-foreground',
          'border-r border-sidebar-border'
        )}
        animate={{ width: collapsed ? 0 : sidebarWidth }}
        transition={isResizing ? { duration: 0 } : {
          type: 'spring',
          stiffness: 400,
          damping: 30,
          mass: 0.8
        }}
      >
        <div className={cn('h-full', collapsed ? 'py-4' : 'p-4')}>
          <Sidebar
            collapsed={collapsed}
            onToggle={toggleCollapsed}
            groups={[activeGroup]}
            {...sidebarProps}
          />
        </div>

        {enableSidebarResize && !collapsed && (
          <SidebarResizeHandle 
            onResize={setSidebarWidth} 
            onResizingChange={setIsResizing}
            offset={64} // Accommodate the 64px wide group rail
          />
        )}
      </motion.aside>

      {/* Content column */}
      <div className={cn(
        'flex-1 flex flex-col min-w-0',
        isFixedHeight ? 'h-dvh overflow-hidden' : 'min-h-dvh',
      )}>
        {/* Top bar */}
        <div className={cn(
          'sticky top-0 z-20 px-3 py-4 bg-topbar text-topbar-foreground',
          'border-b border-topbar-border',
          collapsed && 'md:pl-8'
        )}>
          <TopBar />
        </div>

        {/* Main content */}
        <main className={cn(
          'p-4',
          isFixedHeight ? 'flex-1 min-h-0 overflow-auto h-full' : 'flex-1'
        )}>
          <Outlet />
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-50 md:hidden"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/40 cursor-pointer backdrop-blur-sm flex items-start justify-end p-4"
              onClick={() => setMobileOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMobileOpen(false);
                }}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            </motion.div>

            <motion.div
              className="absolute left-0 top-0 h-full flex"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            >
              {/* Rail */}
              <aside
                style={getSidebarAppearance(sidebarAppearance)}
                className={cn(
                  'flex flex-col w-16',
                  'bg-sidebar sidebar-surface text-sidebar-foreground shadow-sm',
                  'border-r border-sidebar-border'
                )}
              >
                <GroupRail
                  groups={navigationSections}
                  activeGroupId={activeGroupId}
                  onSelect={setActiveGroupId}
                  collapsed={collapsed}
                />
              </aside>

              {/* Sidebar */}
              <aside
                style={getSidebarAppearance(sidebarAppearance)}
                className={cn(
                  'flex flex-col w-64',
                  'bg-sidebar text-sidebar-foreground',
                  'border-r sidebar-surface border-sidebar-border',
                  collapsed ? 'w-0 py-4 z-30' : 'p-4 w-64'
                )}
              >
                <Sidebar
                  collapsed={collapsed}
                  onToggle={toggleCollapsed}
                  groups={[activeGroup]}
                  onItemClick={() => setMobileOpen(false)}
                />
              </aside>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </VerticalShell>
  );
};
