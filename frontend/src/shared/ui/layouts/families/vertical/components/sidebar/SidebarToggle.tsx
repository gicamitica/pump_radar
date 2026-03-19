import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shadcn/lib/utils';

interface SidebarToggleProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const SidebarToggle: React.FC<SidebarToggleProps> = ({ collapsed, onToggle }) => {
  const { t } = useTranslation('navigation');

  return (
    <button
      onClick={onToggle}
      className={cn(
        'inline-flex items-center justify-center size-7 rounded-full cursor-pointer',
        'bg-sidebar sidebar-surface text-sidebar-foreground border border-sidebar-border',
        //'hover:bg-sidebar-hover',
        //'text-sidebar-icon hover:text-sidebar-icon-active',
        'transition-all duration-300 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
      )}

      aria-label={collapsed ? t('expand') : t('collapse')}
    >
      {collapsed ? (
        <ChevronRight className="size-4" />
      ) : (
        <ChevronLeft className="size-4" />
      )}
    </button>
  );
};
