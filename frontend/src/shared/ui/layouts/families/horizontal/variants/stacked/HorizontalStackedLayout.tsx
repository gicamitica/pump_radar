import React from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@/shadcn/lib/utils';
import { useLayout } from '../../../../app';
import { HorizontalShell } from '../../shell/HorizontalShell';
import { NavBar } from '../../components/bars/NavBar';
import { UtilityBar } from '../../components/bars/UtilityBar';
import { HorizontalNav } from '../../components/navigation/HorizontalNav';
import { NavBarBoundsWrapper } from '../../components/navigation/NavBarBoundsWrapper';
import TopBar from '@/shared/ui/layouts/components/topbar/TopBar';
import MobileSidebar from '../../components/navigation/MobileSidebar';

/**
 * HorizontalStackedLayout - Two horizontal bars (utility + navigation)
 * 
 * Features:
 * - UtilityBar: Brand, language, notifications, user menu
 * - NavBar: Main navigation from navigation.ts
 * - No overlap
 */
export const HorizontalStackedLayout: React.FC = () => {
  const { layoutBehavior } = useLayout();
  const isFixedHeight = layoutBehavior === 'fixed-height';

  return (
    <HorizontalShell variant='horizontal-stacked' behavior={layoutBehavior}>
      {/* Top utility bar with brand and actions */}
      <div className='hidden md:flex flex-col sticky top-0 z-30 shadow-sm'>
        <UtilityBar variant="dark" />
        
        {/* Navigation bar */}
        <NavBar variant="solid">
          <NavBarBoundsWrapper className="flex items-center h-14">
            <HorizontalNav />
          </NavBarBoundsWrapper>
        </NavBar>
      </div>

      <TopBar className="md:hidden sticky top-0 z-20 px-4 py-4 bg-topbar text-topbar-foreground shadow-sm" />

      {/* Main content */}
      <main className={cn(
        'flex-1 w-full bg-gray-50 dark:bg-gray-950',
        isFixedHeight ? 'min-h-0 overflow-auto h-full' : 'min-h-0'
      )}>
        <div className={cn(
          "max-w-screen-2xl mx-auto p-4 lg:p-6",
          isFixedHeight && 'h-full'
        )}>
          <Outlet />
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      <MobileSidebar />
    </HorizontalShell>
  );
};

export default HorizontalStackedLayout;
