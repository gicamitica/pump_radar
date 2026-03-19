import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shadcn/lib/utils';
import { type NavItem } from '@/app/config/navigation';
import { iconMap } from '@/app/constants/iconMap';

interface InlineItemsRendererProps {
  items: NavItem[];
}

/**
 * InlineItemsRenderer - Renders simple items directly in the nav bar
 * 
 * Used for groups that contain only simple items without children
 */
export const InlineItemsRenderer: React.FC<InlineItemsRendererProps> = ({ items }) => {
  const { t } = useTranslation('navigation');

  return (
    <>
      {items.map(item => {
        const Icon = item.icon ? iconMap[item.icon] : null;
        const label = t(`item.${item.id}`, { defaultValue: item.id });

        if (!item.to) return null;

        return (
          <NavLink
            key={item.id}
            to={item.to}
            target={item.target}
            className={({ isActive }) => cn(
              'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
              'text-sidebar-foreground hover:bg-sidebar-hover',
              isActive 
                ? 'bg-sidebar-active text-sidebar-icon-active' 
                : 'hover:bg-sidebar-hover',
            )}
          >
            {Icon && <Icon className="size-4" />}
            <span>{label}</span>
          </NavLink>
        );
      })}
    </>
  );
};
