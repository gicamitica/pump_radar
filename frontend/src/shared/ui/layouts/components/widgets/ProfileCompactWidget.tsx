import React from 'react';
import { Mail, Lock, LogOut, ChevronUp } from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/shadcn/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { mockUser } from './ProfileAccountData';

import AnimatedDropdown from '@/shared/ui/components/animated-dropdown/AnimatedDropdown';
import AnimatedDropdownTrigger from '@/shared/ui/components/animated-dropdown/AnimatedDropdownTrigger';
import AnimatedDropdownContent from '@/shared/ui/components/animated-dropdown/AnimatedDropdownContent';


/**
 * ProfileCompactWidget
 * A small, action-rich profile widget for the bottom of the sidebar.
 */
export const ProfileCompactWidget: React.FC<{ collapsed?: boolean }> = ({ collapsed }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Actions data for reuse
  const actions = [
    { id: 'messages', label: 'Messages', icon: Mail, color: 'text-primary' },
    { id: 'security', label: 'Security', icon: Lock, color: 'text-sidebar-muted' },
    { id: 'logout', label: 'Sign out', icon: LogOut, color: 'text-rose-500' },
  ];

  if (collapsed) {
    return (
      <div className="flex justify-center p-2">
        <AnimatedDropdown placement="right-end" offset={18} openOn="hover">
          <AnimatedDropdownTrigger asChild>
            <button className="group relative flex items-center justify-center rounded-full transition-transform active:scale-95">
              <Avatar className="size-10 border border-sidebar-border shadow-sm ring-2 ring-sidebar-background transition-all group-hover:ring-primary/20">
                <AvatarImage src={mockUser.avatar} alt={mockUser.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">{mockUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-sidebar-background bg-emerald-500 z-10" />
            </button>
          </AnimatedDropdownTrigger>
          <AnimatedDropdownContent className="p-1 min-w-[200px] overflow-hidden">
             <div className="px-3 py-3 border-b border-sidebar-border/50 mb-1">
                <p className="text-sm font-black truncate leading-none mb-1">{mockUser.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{mockUser.email}</p>
             </div>
             <div className="space-y-0.5">
                {actions.map((action) => (
                  <button
                    key={action.id}
                    className="flex items-center gap-3 w-full px-3 py-2 text-xs rounded-xl transition-colors hover:bg-sidebar-hover text-sidebar-foreground group"
                  >
                    <action.icon className={cn("size-3.5 transition-transform group-hover:scale-110", action.color)} />
                    <span>{action.label}</span>
                  </button>
                ))}
             </div>
          </AnimatedDropdownContent>
        </AnimatedDropdown>
      </div>
    );
  }

  return (
    <div className={cn(
      "mx-3 mb-2 rounded-2xl transition-all duration-300 overflow-hidden",
      "bg-sidebar-surface/30 border border-sidebar-border/30",
      isExpanded && "bg-sidebar-surface/50 border-sidebar-border/50 shadow-lg"
    )}>
      {/* Trigger: Profile Info */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-sidebar-hover/40 transition-colors text-left outline-none group"
      >
        <div className="relative shrink-0">
          <Avatar className="size-10 border border-sidebar-border ring-2 ring-transparent transition-all group-hover:ring-primary/10">
            <AvatarImage src={mockUser.avatar} alt={mockUser.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-black">{mockUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-sidebar-background bg-emerald-500 shadow-sm" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black truncate mb-0.5">{mockUser.name}</p>
          <p className="text-[10px] text-sidebar-muted truncate font-medium">{mockUser.email}</p>
        </div>

        <ChevronUp className={cn(
          "size-3.5 text-sidebar-muted transition-transform duration-300",
          isExpanded ? "rotate-0" : "rotate-180"
        )} />
      </button>

      {/* Expanded Actions */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 space-y-1">
               <div className="h-px bg-sidebar-border/30 mx-2 mb-2" />
               <div className="grid grid-cols-3 gap-1">
                  {actions.map((action) => (
                    <button 
                      key={action.id}
                      className="flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-sidebar-hover group transition-all"
                      title={action.label}
                    >
                      <action.icon className={cn("size-4 mb-1 transition-transform group-hover:scale-110", action.color)} />
                      <span className="text-xs opacity-70">{action.id}</span>
                    </button>
                  ))}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

