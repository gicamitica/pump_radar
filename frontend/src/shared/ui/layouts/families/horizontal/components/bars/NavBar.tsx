import React from 'react';
import { cn } from '@/shadcn/lib/utils';

interface NavBarProps {
  className?: string;
  variant?: 'solid' | 'dark' | 'gradient' | 'transparent';
  children: React.ReactNode;
}

/**
 * NavBar - Horizontal navigation bar
 * 
 * Responsibilities:
 * - Renders HorizontalNav component
 * - Provides consistent bar styling
 * 
 * Does NOT:
 * - Know about layout variant (receives variant as prop)
 * - Modify navigation data
 */
export const NavBar: React.FC<NavBarProps> = ({ className, variant = 'solid', children }) => {
  const variantStyles = {
    solid: 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100',
    dark: 'bg-gray-900 text-white',
    gradient: 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white',
    transparent: 'bg--transparent text-white',
  };

  return (
    <div className={cn(
      'w-full',
      variantStyles[variant],
      className
    )}>
      {children}
    </div>
  );
};

export default NavBar;
