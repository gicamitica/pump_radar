import React from 'react';
import { Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';
import { useLayout } from '../../../../app';
import { VerticalShell } from '../../shell/VerticalShell';
import { Sidebar, SidebarResizeHandle } from '../../components/sidebar';
import { getSidebarAppearance } from '../../../../tokens/sidebarAppearances';
import TopBar from '@/shared/ui/layouts/components/topbar/TopBar';

/**
 * VerticalBoxedLayout - Floating sidebar with margins and rounded containers
 * 
 * Features:
 * - Outer padding around layout
 * - Rounded sidebar
 * - Floating surface appearance
 * - Light appearance by default
 */
export const VerticalBoxedLayout: React.FC = () => {
  const { 
    layoutBehavior, 
    sidebarAppearance, 
    collapsed, 
    toggleCollapsed, 
    mobileOpen, 
    setMobileOpen,
    sidebarWidth,
    setSidebarWidth,
    enableSidebarResize,
    sidebarProps,
    rightSlot
  } = useLayout();
  const [isResizing, setIsResizing] = React.useState(false);
  const isFixedHeight = layoutBehavior === 'fixed-height';

  return (
    <VerticalShell behavior={layoutBehavior} rightSlot={rightSlot}>
      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          'hidden md:block sticky top-0 h-dvh px-3 py-4',
        )}
      >
        <motion.div
          style={getSidebarAppearance(sidebarAppearance)}
          className={cn(
            'h-full relative rounded-xl px-3 py-4 shadow-sm',
            'bg-sidebar sidebar-surface text-sidebar-foreground'
          )}
          animate={{ width: collapsed ? 64 : sidebarWidth }}
          transition={isResizing ? { duration: 0 } : {
            type: 'spring',
            stiffness: 400,
            damping: 30,
            mass: 0.8
          }}
        >
          <Sidebar 
            collapsed={collapsed} 
            onToggle={toggleCollapsed} 
            {...sidebarProps}
          />
          
          {enableSidebarResize && !collapsed && (
            <SidebarResizeHandle 
              onResize={setSidebarWidth} 
              onResizingChange={setIsResizing}
              offset={12} // Accommodate the px-3 (12px) padding of the aside container
            />
          )}
        </motion.div>
      </aside>

      {/* Content column */}
      <div className={cn(
        'flex-1 flex flex-col min-w-0',
        isFixedHeight ? 'h-dvh overflow-hidden' : 'min-h-dvh'
      )}>
        {/* Top bar */}
        <header className="sticky top-0 z-20 px-3 py-4">
          <div className="p-4 rounded-xl shadow-sm bg-topbar text-topbar-foreground">
            <TopBar />
          </div>
        </header>

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
              className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer flex items-start justify-end p-4"
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

            <motion.aside
              style={getSidebarAppearance(sidebarAppearance)}
              className={cn(
                'absolute left-0 top-0 h-[calc(100vh-1rem)] w-64',
                'm-3 px-3 py-4 rounded-xl',
                'border border-sidebar-border shadow-lg',
                'bg-sidebar sidebar-surface text-sidebar-foreground',
                collapsed ? 'w-16' : 'w-72'
              )}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            >
              <Sidebar
                collapsed={collapsed}
                onToggle={toggleCollapsed}
                onItemClick={() => setMobileOpen(false)}
              />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </VerticalShell>
  );
};
