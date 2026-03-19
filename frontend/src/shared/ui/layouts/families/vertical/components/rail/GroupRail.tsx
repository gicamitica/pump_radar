import React from 'react';
import { useTranslation } from 'react-i18next';
import SimpleBar from 'simplebar-react';
import { cn } from '@/shadcn/lib/utils';
import type { NavGroup } from '@/app/config/navigation';
import { GroupRailItem } from './GroupRailItem';
import SidebarThemeToggler from '@/shared/ui/layouts/components/SidebarThemeToggler';

interface GroupRailProps {
  groups: NavGroup[];
  activeGroupId: string | null;
  onSelect: (groupId: string) => void;
  collapsed: boolean;
}

/**
 * GroupRail - Icon-only navigation for group selection
 * 
 * Used in two-column layout to select which group's items to display
 */
export const GroupRail: React.FC<GroupRailProps> = ({
  groups,
  activeGroupId,
  onSelect,
  collapsed
}) => {
  const { t } = useTranslation('navigation');

  // Filter out widgets group
  const navGroups = groups.filter(g => g.id !== 'widgets');

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-center h-16">
        <img src="/logo-pumpradar.png" alt="PumpRadar" className="size-9 rounded-lg object-contain" />
      </div>

      {/* Group icons */}
      <nav className={cn('flex flex-col items-center flex-1')}>
        <SimpleBar className="h-full">
          <div className="space-y-2">
          {navGroups.map(group => (
            <GroupRailItem
              key={group.id}
              groupId={group.id}
              label={t(`section.${group.id}`)}
              active={activeGroupId === group.id}
              onClick={() => onSelect(group.id)}
            />
          ))}
          </div>
        </SimpleBar>
      </nav>

      {/* Footer */}
      <div className="p-3 mx-auto">
        {collapsed && <SidebarThemeToggler size="sm" />}
      </div>
    </div>
  );
};
