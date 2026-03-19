import React from 'react';
import { usePersistentState } from '@/shared/hooks/usePersistentState';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/ui/shadcn/components/ui/collapsible';
import AnimatedDropdown from '@/shared/ui/components/animated-dropdown/AnimatedDropdown';
import AnimatedDropdownTrigger from '@/shared/ui/components/animated-dropdown/AnimatedDropdownTrigger';
import AnimatedDropdownContent from '@/shared/ui/components/animated-dropdown/AnimatedDropdownContent';
import type { NavItem } from '@/app/config/navigation';
import { SidebarItem } from './SidebarItem';
import { SidebarItemIcon } from './SidebarItemIcon';
import { BadgeDisplay } from './BadgeDisplay';

interface SidebarCollapsibleProps {
  item: NavItem;
  label: string;
  childLabels: Record<string, string>;
  collapsed: boolean;
  onClick?: () => void;
}

export const SidebarCollapsible: React.FC<SidebarCollapsibleProps> = ({
  item,
  label,
  childLabels,
  collapsed,
  onClick,
}) => {
  const location = useLocation();

  // Check if any child is active
  const isChildActive = item.children?.some(child => 
    child.to && location.pathname.startsWith(child.to)
  );

  const [open, setOpen] = usePersistentState(
    `sidebar-collapsible-${item.id}`, 
    item.defaultOpen || isChildActive || false
  );

  // Collapsed mode: show dropdown with children
  if (collapsed) {
    return (
      <AnimatedDropdown placement="right-start" offset={10} openOn="hover">
        <AnimatedDropdownTrigger asChild>
          <button
            className={cn(
              'group relative flex items-center justify-center px-2 py-2 rounded-lg',
              'transition-all duration-200',
              'text-sidebar-fg',
              isChildActive
                ? 'bg-sidebar-active text-sidebar-icon-active'
                : 'hover:bg-sidebar-hover'
            )}
          >
            <SidebarItemIcon icon={item.icon} iconColor={item.iconColor} />
            <span className="absolute top-1 right-1 flex h-3 w-3 items-center justify-center rounded-full bg-sidebar-accent opacity-70 group-hover:opacity-100 transition-opacity">
              <ChevronDown className="h-3 w-3 -rotate-90 text-primary fill-primary" />
            </span>
          </button>
        </AnimatedDropdownTrigger>
        <AnimatedDropdownContent className="p-1 min-w-[180px]">
          <div className="px-3 py-2 text-sm font-medium border-b mb-1 flex items-center gap-2 text-muted-foreground">
            <SidebarItemIcon icon={item.icon} iconColor={item.iconColor} className="size-4 p-0.5 bg-transparent" />
            <span className="flex-1 truncate">{label}</span>
            {item.badge && <BadgeDisplay badge={item.badge} />}
          </div>
          <div className="space-y-0.5">
            {item.children?.map(child => (
              <NavLink
                key={child.id}
                to={child.to ?? '#'}
                target={child.target}
                onClick={onClick}
                className={({ isActive }) => cn(
                  'group flex items-center gap-3 px-3 py-2 text-sm transition-colors rounded-md',
                  isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                )}
              >
                <SidebarItemIcon 
                  icon={child.icon} 
                  iconColor={child.iconColor}
                />
                <span>{childLabels[child.id] || child.id}</span>
              </NavLink>
            ))}
          </div>
        </AnimatedDropdownContent>
      </AnimatedDropdown>
    );
  }

  // Expanded mode: show collapsible
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            'group flex items-center gap-3 w-full px-3 py-2 rounded-full',
            'transition-all duration-200',
            'text-sidebar-fg',
            isChildActive
              ? 'bg-sidebar-active text-sidebar-icon-active'
              : 'hover:bg-sidebar-hover'
          )}
        >
          <SidebarItemIcon icon={item.icon} iconColor={item.iconColor} />
          <span className="flex-1 text-left text-sm truncate">{label}</span>
          {item.badge && <BadgeDisplay badge={item.badge} />}
          <ChevronDown className={cn(
            'size-4 shrink-0 transition-transform duration-200',
            open && 'rotate-180'
          )} />
        </button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
        <div className="pl-4 mt-1 space-y-1">
          {item.children?.map(child => {
            return (
              <SidebarItem
                key={child.id}
                item={child}
                label={childLabels[child.id] || child.id}
                collapsed={collapsed}
                onClick={onClick}
              />
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
