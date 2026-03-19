import React from "react";
import { Card } from "@/shared/ui/shadcn/components/ui/card";
import { cn } from "@/shadcn/lib/utils";

interface SpotlightCardProps extends React.ComponentProps<typeof Card> {
  children: React.ReactNode;
}

export function SpotlightCard({ className, children, ...props }: SpotlightCardProps) {
  return <Card 
      className={cn(
        // 1. Layout & Overflow
        "relative overflow-hidden border-0",

        // 2. Base Background Colors (Light vs Dark)
        "bg-slate-100",
        "dark:bg-card",

        // 3. Halo Effect (Ring + Colored Shadow)
        // Light Theme: Soft, tenuous glow
        "ring-1 ring-slate-400/20 shadow-[0_0_20px_-8px_rgba(99,102,241,0.3)]",

        // Dark Theme: Stronger, more defined halo
        "dark:ring-slate-500/50",
        //"dark:shadow-[0_0_30px_-5px_rgba(99,102,241,0.4)]",

        // 4. Spotlight Gradient (Bottom-Up)
        // Uses a pseudo-element (before) so it doesn't interfere with content
        "before:absolute before:inset-0 before:pointer-events-none",
        
        // Light Spotlight: Very subtle purple/indigo rise
        "before:bg-[radial-gradient(circle_at_bottom,rgba(99,102,241,0.1)_0%,transparent_60%)]",
        
        // Dark Spotlight: Brighter, deeper rise
        "dark:before:bg-[radial-gradient(circle_at_bottom,rgba(99,102,241,0.25)_0%,transparent_80%)]",

        className
      )}
      {...props}
    >
        <div className="relative z-10 h-full">
            {children}
        </div>
    </Card>
};

export default SpotlightCard;
