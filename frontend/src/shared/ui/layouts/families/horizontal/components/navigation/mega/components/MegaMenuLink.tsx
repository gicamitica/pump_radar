import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shadcn/lib/utils';
import { iconMap } from '@/app/constants/iconMap';
import type { NavItem } from '@/app/config/navigation';
import { ChevronRight } from 'lucide-react';

interface MegaMenuLinkProps {
  item: NavItem;
  parentId?: string;
  onClick?: () => void;
  className?: string;
}

export const MegaMenuLink: React.FC<MegaMenuLinkProps> = ({ 
  item, 
  parentId, 
  onClick,
  className 
}) => {
  const { t } = useTranslation('navigation');
  const location = useLocation();
  const Icon = item.icon ? iconMap[item.icon] : null;
  
  const label = t(parentId ? `steps.${parentId}.${item.id}` : `item.${item.id}`, { 
    defaultValue: item.id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) 
  });

  const isActive = item.to ? location.pathname === item.to : false;

  return (
    <NavLink
      to={item.to ?? '#'}
      onClick={onClick}
      className={({ isActive: linkActive }) => cn(
        "group flex items-center gap-3 w-full p-2.5 rounded-lg transition-all duration-200",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        (isActive || linkActive) 
          ? "bg-primary/10 text-primary font-medium" 
          : "text-muted-foreground",
        className
      )}
    >
      {Icon && (
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-md transition-colors",
          (isActive) 
            ? "bg-primary/20 text-primary" 
            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
        )}>
          <Icon className="w-4 h-4" />
        </div>
      )}
      
      <div className="flex-1 flex items-center justify-between min-w-0">
        <span className="truncate">{label}</span>
        
        {/* Micro-interaction arrow */}
        <ChevronRight className={cn(
          "w-3.5 h-3.5 opacity-0 -translate-x-2 transition-all duration-200",
          "group-hover:opacity-100 group-hover:translate-x-0",
          isActive && "opacity-100 translate-x-0 text-primary/50"
        )} />
      </div>
    </NavLink>
  );
};
