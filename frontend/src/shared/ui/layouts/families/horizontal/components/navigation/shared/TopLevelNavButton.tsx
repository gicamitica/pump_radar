import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useLocation, matchPath } from 'react-router-dom';
import { cn } from '@/shadcn/lib/utils';
import { type NavItem } from '@/app/config/navigation';

interface TopLevelNavButtonProps {
  label: React.ReactNode;
  items?: NavItem[];
  className?: string;
}

export const TopLevelNavButton: React.FC<TopLevelNavButtonProps> = ({
  label,
  items = [],
  className,
}) => {
  const { pathname } = useLocation();
  
  // Check if any item in this group matches the current route
  const isActive = items.some(item => {
    if (!item.to) return false;
    return !!matchPath({ path: `${item.to}/*` }, pathname) || pathname === item.to;
  });

  return (
    <button
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
        isActive && 'bg-sidebar-active text-sidebar-icon-active',
        className
      )}
      aria-haspopup="true"
      aria-current={isActive ? 'page' : undefined}
    >
      <span>{label}</span>
      <ChevronDown className={cn('size-3 transition-transform')} />
    </button>
  );
};
