import React from 'react';
import { cn } from '@/shadcn/lib/utils';
import { SidebarToggle } from './SidebarToggle';
import Branding from '../../../../components/Branding';

interface SidebarHeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ collapsed, onToggle }) => {
  return (
    <div className={cn(
      "flex items-center justify-between gap-2",
    )}>
      <Branding />

      <SidebarToggle collapsed={collapsed} onToggle={onToggle} />
    </div>
  );
};
