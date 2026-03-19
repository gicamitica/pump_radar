import React from 'react';
import { cn } from '@/shadcn/lib/utils';
import LanguageMenu from '@/shared/ui/layouts/components/topbar/LanguageMenu';
import LayoutAppearanceMenu from '@/shared/ui/layouts/components/topbar/LayoutAppearanceMenu';
import AvatarMenu from '@/shared/ui/layouts/components/topbar/AvatarMenu';

interface UtilityOptionsProps {
  className?: string;
}

/**
 * UtilityOptions - Utility menu options (layout, language, notifications, avatar)
 * 
 * Displays the right-side utility menus
 */
export const UtilityOptions: React.FC<UtilityOptionsProps> = ({ className }) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <LayoutAppearanceMenu />
      <LanguageMenu />
      <AvatarMenu />
    </div>
  );
};

export default UtilityOptions;
