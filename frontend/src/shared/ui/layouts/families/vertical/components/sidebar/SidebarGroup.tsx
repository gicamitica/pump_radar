import React from 'react';
import { usePersistentState } from '@/shared/hooks/usePersistentState';
import { Plus, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shadcn/lib/utils';
import type { NavAction, SidebarIconKey } from '@/app/config/navigation';
import { iconMap } from '@/app/constants/iconMap';

interface SidebarGroupProps {
  id: string;
  title?: string;
  collapsed: boolean;
  defaultOpen?: boolean;
  headerAction?: NavAction;
  children: React.ReactNode;
}

export const SidebarGroup: React.FC<SidebarGroupProps> = ({ 
  id,
  title, 
  collapsed, 
  defaultOpen = true,
  headerAction, 
  children 
}) => {
  const [isOpen, setIsOpen] = usePersistentState(`sidebar-group-${id}`, defaultOpen);

  const toggleOpen = () => {
    if (!collapsed) {
      setIsOpen(!isOpen);
    }
  };

  const ActionIcon = headerAction?.icon && typeof headerAction.icon === 'string' 
    ? iconMap[headerAction.icon as SidebarIconKey] 
    : Plus;

  return (
    <div className="space-y-2 mb-4" data-sidebar-group>
      {title && !collapsed && (
        <div className="flex items-center justify-between group/group-header pr-2">
          <div 
            onClick={toggleOpen}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleOpen();
              }
            }}
            role="button"
            tabIndex={0}
            className={cn(
              'flex-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest px-2 py-1 transition-all duration-300 rounded-md cursor-pointer select-none outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring',
              'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover/50'
            )}
          >
            {title}
            <ChevronDown 
              className={cn(
                'size-3 transition-transform duration-300 opacity-0 group-hover/group-header:opacity-50',
                !isOpen && '-rotate-90'
              )} 
            />
          </div>
          
          {headerAction && (
             <button 
              onClick={headerAction.onClick}
              title={headerAction.label}
              className="p-1 hover:bg-sidebar-hover rounded-md transition-all text-sidebar-muted hover:text-sidebar-foreground active:scale-95"
            >
              <ActionIcon className="size-3" />
            </button>
          )}
        </div>
      )}

      <AnimatePresence initial={false}>
        {(!collapsed && isOpen || collapsed) && (
          <motion.div
            initial={collapsed ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
