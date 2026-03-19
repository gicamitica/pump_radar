import React from 'react';
import { cn } from '@/shadcn/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/shadcn/components/ui/tooltip';

import { iconMap, groupIconMap } from '@/app/constants/iconMap';

interface GroupRailItemProps {
  groupId: string;
  label: string;
  active: boolean;
  onClick: () => void;
}

export const GroupRailItem: React.FC<GroupRailItemProps> = ({
  groupId,
  label,
  active,
  onClick,
}) => {
  const iconKey = groupIconMap[groupId] || 'layout-grid';
  const Icon = iconMap[iconKey];

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            'flex items-center justify-center',
            'size-10 rounded-lg',
            'transition-all duration-200',
            active
              ? 'bg-primary text-primary-foreground'
              : 'text-sidebar-icon hover:bg-sidebar-hover hover:text-sidebar-icon-active'
          )}
        >
          <Icon className="size-5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={10}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
};
