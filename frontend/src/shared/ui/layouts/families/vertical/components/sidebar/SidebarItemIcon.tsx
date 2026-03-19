import React from 'react';
import { cn } from '@/shadcn/lib/utils';
import type { NavIconColor, SidebarIconKey } from '@/app/config/navigation';
import { iconMap } from '@/app/constants/iconMap';

interface SidebarItemIconProps {
  icon?: SidebarIconKey;
  iconColor?: NavIconColor;
  className?: string;
}

/**
 * Icon color mapping to Tailwind classes
 */
export const iconColorClasses: Record<NavIconColor, string> = {
  blue: 'text-blue-500',
  purple: 'text-purple-500',
  amber: 'text-amber-500',
  emerald: 'text-emerald-500',
  rose: 'text-rose-500',
  slate: 'text-slate-400',
  cyan: 'text-cyan-500',
  orange: 'text-orange-500',
};

export const SidebarItemIcon: React.FC<SidebarItemIconProps> = ({ 
  icon, 
  iconColor,
  className 
}) => {
  if (!icon) return null;

  const Icon = iconMap[icon];
  if (!Icon) return null;

  const iconColorClass = iconColor ? iconColorClasses[iconColor] : null;

  return (
    <span className={cn(
      "flex items-center justify-center p-1 rounded-md",
      "bg-sidebar-icon/10 transition-colors duration-200",
      "group-hover:bg-sidebar-icon/30",
      className
    )}>
      <Icon className={cn(
        'size-5 shrink-0',
        iconColorClass || 'text-sidebar-icon',
        'transition-colors duration-200'
      )} />
    </span>
  );
};
