import React from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@/shadcn/lib/utils';
import { useLayout } from '../../../../app';
import { HorizontalShell } from '../../shell/HorizontalShell';
import { StickyNavBar } from '../../components/bars/StickyNavBar';
import { AnimatedBackdrop } from '../../components/bars/AnimatedBackdrop';
import { Branding } from '../../../../components/Branding';
import { UtilityOptions } from '../../../../components/UtilityOptions';
import { HorizontalNav } from '../../components/navigation/HorizontalNav';
import { NavBarBoundsWrapper } from '../../components/navigation/NavBarBoundsWrapper';
import backdropImage from '@/assets/horizontal-backdrop.jpg';
import MobileSidebar from '../../components/navigation/MobileSidebar';
import TopBar from '@/shared/ui/layouts/components/topbar/TopBar';

/**
 * HorizontalHeroLayout - Navigation bar with hero backdrop and content overlap
 * 
 * Features:
 * - Dark/gradient hero backdrop
 * - Single horizontal navigation bar
 * - Content overlaps header (negative margin)
 */
export const HorizontalHeroLayout: React.FC = () => {
  const { layoutBehavior } = useLayout();
  const isFixedHeight = layoutBehavior === 'fixed-height';

  return (
    <HorizontalShell variant="horizontal-hero" behavior={layoutBehavior}>
      {/* Hero header with animated backdrop */}
      <AnimatedBackdrop variant="hero" scrollOffset={20} navbarHeight={72} backgroundImage={backdropImage} />
      
      {/* Sticky navigation bar with dynamic background on scroll */}
      <StickyNavBar className='hidden md:block' backdropVariant="hero" scrollOffset={20} backgroundImage={backdropImage}>
        <NavBarBoundsWrapper className="flex items-center justify-between h-18 text-white">
          {/* Left: Branding + Navigation */}
          <div className="flex items-center gap-6">
            <Branding />
            <HorizontalNav />
          </div>
          
          {/* Right: Utility options */}
          <UtilityOptions />
        </NavBarBoundsWrapper>
      </StickyNavBar>

      <TopBar className="md:hidden sticky top-0 z-20 px-4 py-4 bg-topbar text-topbar-foreground shadow-sm" />
      
      {/* Main content with overlap */}
      <main className={cn(
        'flex-1 w-full z-0',
        isFixedHeight ? 'min-h-0 overflow-auto h-full' : 'min-h-0'
      )}>
        <div className={cn(
          "max-w-screen-2xl mx-auto p-4 lg:py-6",
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

export default HorizontalHeroLayout;
