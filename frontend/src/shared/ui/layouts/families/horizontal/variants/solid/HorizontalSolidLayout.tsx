import React from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@/shadcn/lib/utils';
import { useLayout } from '../../../../app';
import { HorizontalShell } from '../../shell/HorizontalShell';
import { NavBar } from '../../components/bars/NavBar';
import { Branding } from '../../../../components/Branding';
import { UtilityOptions } from '../../../../components/UtilityOptions';
import { HorizontalNav } from '../../components/navigation/HorizontalNav';
import { NavBarBoundsWrapper } from '../../components/navigation/NavBarBoundsWrapper';
import TopBar from '@/shared/ui/layouts/components/topbar/TopBar';
import MobileSidebar from '../../components/navigation/MobileSidebar';

/**
 * HorizontalSolidLayout - Single navigation bar with solid background
 * 
 * Features:
 * - Solid background (theme aware)
 * - Single horizontal navigation bar
 * - Branding + Nav on left, Utility on right
 * - No overlap
 */
export const HorizontalSolidLayout: React.FC = () => {
  const { layoutBehavior } = useLayout();
  const isFixedHeight = layoutBehavior === 'fixed-height';

  return (
    <HorizontalShell variant='horizontal-solid' behavior={layoutBehavior}>
      {/* Single navigation bar with branding, nav, and utility */}
      <NavBar className='hidden md:block sticky top-0 z-30 shadow-sm' variant="solid">
        <NavBarBoundsWrapper className="flex items-center justify-between h-14">
          {/* Left: Branding + Navigation */}
          <div className="flex items-center gap-6">
            <Branding />
            <HorizontalNav />
          </div>
          
          {/* Right: Utility options */}
          <UtilityOptions />
        </NavBarBoundsWrapper>
      </NavBar>

      <TopBar className="md:hidden sticky top-0 z-20 px-4 py-4 bg-topbar text-topbar-foreground shadow-sm" />

      {/* Main content */}
      <main className={cn(
        'flex-1 w-full',
        isFixedHeight ? 'min-h-0 overflow-auto h-full' : 'min-h-0'
      )}>
        <div className={cn(
          "max-w-screen-2xl mx-auto p-4 lg:py-6",
          isFixedHeight && 'h-full'
        )}>
          <Outlet />
        </div>
      </main>

      <MobileSidebar />
    </HorizontalShell>
  );
};

export default HorizontalSolidLayout;
