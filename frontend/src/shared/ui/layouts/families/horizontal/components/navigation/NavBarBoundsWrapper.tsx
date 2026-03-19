import React from 'react';
import { cn } from '@/shadcn/lib/utils';
import { NavBarBoundsContext } from './useNavBarBounds';

interface NavBarBoundsWrapperProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * NavBarBoundsWrapper - Provides bounds context for mega menu positioning
 * 
 * Wraps navigation content and exposes the container element via context
 * so that mega menus can position themselves relative to this container
 * instead of their trigger buttons.
 */
export const NavBarBoundsWrapper: React.FC<NavBarBoundsWrapperProps> = ({ children, className }) => {
  const [containerEl, setContainerEl] = React.useState<HTMLDivElement | null>(null);

  return (
    <div ref={setContainerEl} className={cn('max-w-screen-2xl mx-auto', className)}>
      <NavBarBoundsContext.Provider value={containerEl}>
        {children}
      </NavBarBoundsContext.Provider>
    </div>
  );
};
