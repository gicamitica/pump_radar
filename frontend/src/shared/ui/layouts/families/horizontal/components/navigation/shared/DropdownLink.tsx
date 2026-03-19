import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shadcn/lib/utils';
import { type NavItem } from '@/app/config/navigation';
import { iconMap } from '@/app/constants/iconMap';

interface DropdownLinkProps {
  item: NavItem;
  parentId?: string;
  compact?: boolean;
  onClick?: () => void;
}

/**
 * DropdownLink - Simple nav link for dropdowns
 * 
 * Renders a single navigation link with icon and label
 */
export const DropdownLink: React.FC<DropdownLinkProps> = ({ item, parentId, compact = false, onClick }) => {
  const { t } = useTranslation('navigation');
  const Icon = item.icon ? iconMap[item.icon] : null;
  // If parentId exists, use nested translation (steps.parentId.itemId), otherwise use flat (item.itemId)
  const label = parentId 
    ? t(`steps.${parentId}.${item.id}`, { defaultValue: item.id })
    : t(`item.${item.id}`, { defaultValue: item.id });

  if (!item.to) return null;

  return (
    <NavLink
      to={item.to}
      target={item.target}
      onClick={onClick}
      className={({ isActive }) => cn(
        'flex items-center gap-2 text-sm transition-colors rounded-md',
        'text-sidebar-foreground hover:bg-sidebar-hover',
        compact ? 'px-2 py-1.5' : 'px-4 py-2',
        isActive
          ? 'bg-sidebar-active text-sidebar-icon-active'
          : 'hover:bg-sidebar-hover',
      )}
    >
      {Icon && <Icon className="size-4" />}
      <span>{label}</span>
    </NavLink>
  );
};
