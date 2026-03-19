import React from 'react';
import { cn } from '@/shadcn/lib/utils';
import Branding from '../../../../components/Branding';
import UtilityOptions from '../../../../components/UtilityOptions';

interface UtilityBarProps {
  className?: string;
  variant?: 'light' | 'dark';
}

/**
 * UtilityBar - Top utility bar for stacked layouts
 * 
 * Contents:
 * - Brand/logo
 * - Language selector
 * - Notifications
 * - User menu
 * 
 * Does NOT:
 * - Consume navigation.ts
 * - Contain routing logic
 */
export const UtilityBar: React.FC<UtilityBarProps> = ({ className, variant = 'dark' }) => {
  const variantStyles = {
    light: 'bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100',
    dark: 'bg-gray-900 text-white border-b border-gray-800',
  };

  return (
    <div className={cn(
      'w-full px-4 lg:px-6',
      variantStyles[variant],
      className
    )}>
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between h-12">
        {/* Brand */}
        <Branding />

        {/* Right actions */}
        <UtilityOptions />
      </div>
    </div>
  );
};

export default UtilityBar;
