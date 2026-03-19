import React from 'react';
import { cn } from '@/shadcn/lib/utils';
import { StickyBackdropBg } from './StickyBackdropBg';

interface StickyNavBarProps {
  children: React.ReactNode;
  backdropVariant?: 'hero' | 'gradient' | 'solid';
  scrollOffset?: number;
  backgroundImage?: string;
  className?: string;
}

/**
 * StickyNavBar - Sticky navbar container with backdrop background on scroll
 * 
 * Features:
 * - Sticky positioning to top
 * - Sticky backdrop background appears on scroll (z-30)
 * - Navbar content on top (z-40)
 * - Two-layer approach: animated backdrop + sticky backdrop bg
 */
export const StickyNavBar: React.FC<StickyNavBarProps> = ({
  children,
  backdropVariant = 'solid',
  scrollOffset = 20,
  backgroundImage,
  className,
}) => {
  return (
    <div className={cn(
      'w-full px-4 lg:px-6 sticky top-0 z-40',
      className
    )}>
      {/* Sticky backdrop that appears on scroll */}
      <StickyBackdropBg 
        variant={backdropVariant} 
        scrollOffset={scrollOffset}
        navbarHeight={72}
        backgroundImage={backgroundImage}
      />
      
      {/* Navbar content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default StickyNavBar;
