import React from 'react';
import { cn } from '@/shadcn/lib/utils';
import { Progress } from '@/shared/ui/shadcn/components/ui/progress';
import AnimatedDropdown from '@/shared/ui/components/animated-dropdown/AnimatedDropdown';
import AnimatedDropdownTrigger from '@/shared/ui/components/animated-dropdown/AnimatedDropdownTrigger';
import AnimatedDropdownContent from '@/shared/ui/components/animated-dropdown/AnimatedDropdownContent';
import { HardDrive } from 'lucide-react';


interface UsageProgressWidgetProps {
  label?: string;
  value: number;
  total: number;
  unit: string;
  collapsed?: boolean;
}

export const UsageProgressWidget: React.FC<UsageProgressWidgetProps> = ({
  label = 'Storage Space',
  value,
  total,
  unit,
  collapsed
}) => {
  const percentage = Math.round((value / total) * 100);
  const isHigh = percentage > 80;

  if (collapsed) {
    return (
      <div className="flex justify-center py-2 px-0">
        <AnimatedDropdown placement="right-end" offset={18} openOn="hover">
          <AnimatedDropdownTrigger asChild>
            <button className="group relative size-10 flex items-center justify-center outline-none transition-transform active:scale-95">
              <svg className="size-full -rotate-90 overflow-visible">
                <circle
                  cx="20"
                  cy="20"
                  r="15"
                  className="stroke-sidebar-border fill-none"
                  strokeWidth="3.5"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="15"
                  className={cn(
                    "fill-none transition-all duration-700 ease-in-out",
                    isHigh ? "stroke-rose-500" : "stroke-primary"
                  )}
                  strokeWidth="3.5"
                  strokeDasharray={100}
                  strokeDashoffset={100 - percentage}
                  strokeLinecap="round"
                />
              </svg>

              <span className={cn(
                "absolute text-[9px] font-black transition-colors",
                isHigh ? "text-rose-500" : "text-primary/70 group-hover:text-primary"
              )}>
                {percentage}%
              </span>
            </button>
          </AnimatedDropdownTrigger>
          <AnimatedDropdownContent className="p-3 min-w-[200px] overflow-hidden">
             <div className="flex items-center gap-3 mb-3 pb-2 border-b border-sidebar-border/50">
                <div className={cn(
                  "p-1.5 rounded-lg",
                  isHigh ? "bg-rose-500/10 text-rose-500" : "bg-primary/10 text-primary"
                )}>
                  <HardDrive className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-xs font-black truncate leading-none mb-1">{label}</p>
                   <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{percentage}% Capacity</p>
                </div>
             </div>
             
             <div className="space-y-3">
                <div className="space-y-1.5">
                   <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-muted-foreground">Used</span>
                      <span>{value}{unit}</span>
                   </div>
                   <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-muted-foreground">Total quota</span>
                      <span>{total}{unit}</span>
                   </div>
                </div>
                
                <Progress value={percentage} className="h-1" />
                
                <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                  {isHigh 
                    ? "Warning: You are almost out of storage." 
                    : "You have plenty of storage left."}
                </p>
             </div>
          </AnimatedDropdownContent>
        </AnimatedDropdown>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 rounded-2xl bg-sidebar-surface/30 border border-sidebar-border/20">
      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-sidebar-muted">
        <span>{label}</span>
        <span className={cn(isHigh && "text-rose-500")}>{percentage}%</span>
      </div>
      
      <Progress 
        value={percentage} 
        className="h-1.5"
      />
      
      <div className="text-[11px] text-sidebar-muted/80">
        You are running out of space. <span className="font-bold text-sidebar-foreground">{value}{unit} / {total}{unit}</span>
      </div>
    </div>
  );
};
