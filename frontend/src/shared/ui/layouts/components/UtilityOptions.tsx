import React from 'react';
import { cn } from '@/shadcn/lib/utils';
import LayoutAppearanceMenu from '@/shared/ui/layouts/components/topbar/LayoutAppearanceMenu';
import AvatarMenu from '@/shared/ui/layouts/components/topbar/AvatarMenu';
import SubscriptionBadge from '@/shared/ui/layouts/components/topbar/SubscriptionBadge';

interface UtilityOptionsProps {
  className?: string;
}

export const UtilityOptions: React.FC<UtilityOptionsProps> = ({ className }) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <SubscriptionBadge />
      <LayoutAppearanceMenu />
      <AvatarMenu />
    </div>
  );
};

export default UtilityOptions;
