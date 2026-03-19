import React from 'react';
import { ChevronsUpDown, Building2, Plus } from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';
import AnimatedDropdown from '@/shared/ui/components/animated-dropdown/AnimatedDropdown';
import AnimatedDropdownTrigger from '@/shared/ui/components/animated-dropdown/AnimatedDropdownTrigger';
import AnimatedDropdownContent from '@/shared/ui/components/animated-dropdown/AnimatedDropdownContent';



interface Workspace {
  id: string;
  name: string;
  plan: string;
  logo: React.ReactNode;
}

const workspaces: Workspace[] = [
  {
    id: '1',
    name: 'BuildBetter',
    plan: 'Enterprise',
    logo: <Building2 className="size-4" />,
  },
  {
    id: '2',
    name: 'Dribbble',
    plan: 'Pro',
    logo: <div className="size-4 rounded-full bg-rose-500" />,
  },
];

interface WorkspaceSwitcherProps {
  collapsed?: boolean;
}

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({ collapsed }) => {
  const [activeWorkspace, setActiveWorkspace] = React.useState(workspaces[0]);

  return (
    <AnimatedDropdown placement={collapsed ? "right-start" : "bottom-start"} offset={collapsed ? 18 : 4}>
      <AnimatedDropdownTrigger asChild>
        {/* <div className="flex-1 min-w-0 mr-10"></div> */}
        <button
          className={cn(
            'flex items-center gap-3 w-full p-2 rounded-xl transition-all duration-200 outline-none',
            'hover:bg-sidebar-hover border border-transparent active:scale-[0.98]',
            collapsed 
              ? 'px-0 justify-center' 
              : 'pr-4 justify-between shadow-sm bg-sidebar-surface/50 border-sidebar-border/50'
          )}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary shrink-0 transition-all group-hover:bg-primary/20 group-hover:scale-105">
              {activeWorkspace.logo}
            </div>
            {!collapsed && (
              <div className="flex flex-col items-start truncate text-left">
                <span className="text-sm font-black truncate leading-none mb-1">
                  {activeWorkspace.name}
                </span>
                <span className="text-[10px] text-sidebar-muted uppercase tracking-widest font-black">
                  {activeWorkspace.plan}
                </span>
              </div>
            )}
          </div>
          {!collapsed && <ChevronsUpDown className="size-3.5 text-sidebar-muted shrink-0" />}
        </button>
        
      </AnimatedDropdownTrigger>
      <AnimatedDropdownContent className="w-64 p-1">

        <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
          Workspaces
        </div>
        <div className="space-y-0.5">
          {workspaces.map((workspace) => (
            <button
              key={workspace.id}
              onClick={() => setActiveWorkspace(workspace)}
              className={cn(
                "flex items-center gap-3 w-full p-2.5 rounded-xl transition-all text-left group",
                activeWorkspace.id === workspace.id ? "bg-primary/5" : "hover:bg-sidebar-hover"
              )}
            >
              <div className="flex items-center justify-center size-8 rounded-lg bg-sidebar-background border border-sidebar-border text-sidebar-foreground transition-transform group-hover:scale-105">
                {workspace.logo}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-bold truncate leading-none mb-1">{workspace.name}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{workspace.plan} Plan</span>
              </div>
              {activeWorkspace.id === workspace.id && (
                <div className="size-1.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
        <div className="h-px bg-sidebar-border/50 my-1 mx-1" />
        <button className="flex items-center gap-3 w-full p-2.5 rounded-xl transition-all text-left hover:bg-sidebar-hover text-primary group">
          <div className="flex items-center justify-center size-8 rounded-lg border-2 border-dashed border-primary/20 group-hover:border-primary/40 transition-colors">
            <Plus className="size-4" />
          </div>
          <span className="text-sm font-black">Create Workspace</span>
        </button>
      </AnimatedDropdownContent>
    </AnimatedDropdown>
  );
};

