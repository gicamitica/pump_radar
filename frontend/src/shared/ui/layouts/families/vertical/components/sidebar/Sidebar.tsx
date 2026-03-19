import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shadcn/lib/utils';
import SimpleBar from 'simplebar-react';

import { navigationSections, type NavGroup, type NavItem } from '@/app/config/navigation';
import { SidebarGroup } from './SidebarGroup';
import { SidebarItem } from './SidebarItem';
import { SidebarCollapsible } from './SidebarCollapsible';
import { SidebarToggle } from './SidebarToggle';
import { Branding } from '../../../../components/Branding';
import AnnouncementCard from '@/shared/ui/layouts/components/AnnouncementCard';
import SidebarThemeToggler from '@/shared/ui/layouts/components/SidebarThemeToggler';

import { useLayout } from '../../../../app';
import { 
  WorkspaceSwitcher, 
  ProfileHeroWidget, 
  ProfileCompactWidget, 
  UsageProgressWidget 
} from '@/shared/ui/layouts/components/widgets';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  groups?: NavGroup[];
  onItemClick?: () => void;
  
  // Explicit Slots (Override settings)
  headerSlot?: React.ReactNode;
  footerSlot?: React.ReactNode;
  contentSlot?: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggle,
  groups = navigationSections,
  onItemClick,
  headerSlot: explicitHeaderSlot,
  footerSlot: explicitFooterSlot,
  contentSlot,
}) => {
  const { t } = useTranslation('navigation');
  const { settings } = useLayout();

  // --- Dynamic Slot Resolution ---
  const headerSlot = explicitHeaderSlot || (
    settings.headerWidget === 'workspace' ? <WorkspaceSwitcher collapsed={collapsed} /> :
    settings.headerWidget === 'user-hero' ? <ProfileHeroWidget collapsed={collapsed} /> :
    null
  );

  const footerSlot = explicitFooterSlot || (
    <div className="space-y-4">
       {!collapsed && settings.footerWidget === 'default' && <AnnouncementCard />}
       {settings.showUsage && (
          <UsageProgressWidget 
            value={1.2} 
            total={1.5} 
            unit="GB" 
            collapsed={collapsed} 
          />
       )}
       {settings.footerWidget === 'user-compact' && (
          <ProfileCompactWidget collapsed={collapsed} />
       )}
       {settings.showThemeToggler && (
          <div className="flex justify-center">
             <SidebarThemeToggler size="sm" />
          </div>
       )}
    </div>
  );

  const renderItem = (item: NavItem, _parentId?: string) => {
    // Skip widgets for now
    if (item.navRole === 'widget') {
      return null;
    }

    // Get label from i18n
    const label = t(`item.${item.id}`);

    // Build the item element
    let itemElement: React.ReactNode;

    // If has children, render collapsible
    if (item.children && item.children.length > 0) {
      // Build child labels map
      const childLabels: Record<string, string> = {};
      item.children.forEach(child => {
        childLabels[child.id] = t(`steps.${item.id}.${child.id}`);
      });

      itemElement = (
        <SidebarCollapsible
          key={item.id}
          item={item}
          label={label}
          childLabels={childLabels}
          collapsed={collapsed}
          onClick={onItemClick}
        />
      );
    } else {
      // Regular item
      itemElement = (
        <SidebarItem
          key={item.id}
          item={item}
          label={label}
          collapsed={collapsed}
          onClick={onItemClick}
        />
      );
    }

    // If item has separator after, wrap with separator
    if (item.hasSeparatorAfter) {
      return (
        <React.Fragment key={item.id}>
          {itemElement}
          <div className="my-2 border-t border-sidebar-border/50" />
        </React.Fragment>
      );
    }

    return itemElement;
  };

  // Filter out widget groups
  const navGroups = groups.filter(g => g.id !== 'widgets');

  return (
    <div className="sidebar flex flex-col h-full space-y-4">
      {/* Sidebar Trigger - Responsive positioning based on state */}
      <div className={cn(
        "absolute top-4 z-[100] transition-all duration-300",
        collapsed 
          ? "right-0 translate-x-1/2" 
          : "right-4"
      )}>
        <SidebarToggle collapsed={collapsed} onToggle={onToggle} />
      </div>

      {/* Header Section */}
      <div className="flex flex-col gap-3">
        <Branding />
      
        {headerSlot && (
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex-1 min-w-0">
              {headerSlot}
            </div>
          </div>
        )}
      </div>

      {/* Navigation / Content Slot */}
      <nav className="flex-1 min-h-0" aria-label={t('ariaMainNav')}>
        <SimpleBar className="h-full">
          <div className="space-y-6">
            {contentSlot ? (
               <div className="space-y-4">{contentSlot}</div>
            ) : (
              navGroups.map(group => (
                <SidebarGroup
                  key={group.id}
                  id={group.id}
                  title={t(`section.${group.id}`)}
                  collapsed={collapsed}
                  headerAction={group.headerAction}
                >
                  {group.items.map(item => renderItem(item, group.id))}
                </SidebarGroup>
              ))
            )}
          </div>
        </SimpleBar>
      </nav>

      {/* Footer Slot */}
      {footerSlot}
    </div>
  );
};
