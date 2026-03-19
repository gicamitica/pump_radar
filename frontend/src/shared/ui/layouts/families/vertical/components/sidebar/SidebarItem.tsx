import React from 'react';
import { useLocation, matchPath, Link } from "react-router";
import { MoreVertical } from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/shadcn/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/shadcn/components/ui/dropdown-menu';
import type { NavItem } from '@/app/config/navigation';
import { SidebarItemIcon } from './SidebarItemIcon';
import { BadgeDisplay } from './BadgeDisplay';

interface SidebarItemProps {
  item: NavItem;
  label: string;
  collapsed: boolean;
  onClick?: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({ item, label, collapsed, onClick }) => {
  const { pathname } = useLocation();
  const isActive = !!matchPath({ path: item.to + (item.exact ? '' : '/*'), end: item.exact }, pathname);

  const content = (
    <div className="group relative flex items-center">
      <Link
        to={item.to ?? '#'}
        target={item.target}
        onClick={onClick}
        className={cn(
          'flex-1 flex items-center px-3 py-2 rounded-full',
          'transition-all duration-200',
          'text-sidebar-foreground',
          isActive
            ? 'bg-sidebar-active text-sidebar-icon-active'
            : 'hover:bg-sidebar-hover',
          collapsed ? 'justify-center px-2' : 'gap-3'
        )}
      >
        <SidebarItemIcon icon={item.icon} iconColor={item.iconColor} />

        <span className={cn(
          'flex-1 truncate text-sm transition-all duration-300',
          collapsed ? 'opacity-0 w-0' : 'opacity-100'
        )}>
          {label}
        </span>

        {item.badge && !collapsed && (
          <div className={cn(item.actions && "mr-6")}>
            <BadgeDisplay badge={item.badge} />
          </div>
        )}
      </Link>

      {item.actions && !collapsed && (
        <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 hover:bg-sidebar-background rounded-md text-sidebar-muted active:scale-95">
                <MoreVertical className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="right" sideOffset={10}>
              {item.actions.map(action => (
                <DropdownMenuItem key={action.id} onClick={action.onClick} className="gap-2">
                  <SidebarItemIcon icon={action.icon} className="size-4 p-0 bg-transparent text-muted-foreground" />
                  <span>{action.label || action.id}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={10} className="flex flex-col gap-1">
          <span className="font-semibold">{label}</span>
          {item.badge?.type === 'count' && (
            <span className="text-[10px] text-muted-foreground">({item.badge.value} items)</span>
          )}
          {item.actions && (
            <div className="mt-1 pt-1 border-t border-sidebar-border text-[10px] text-sidebar-muted">
              Has actions
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
};
