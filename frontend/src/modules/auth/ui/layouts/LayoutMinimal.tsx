import { Card } from '@/shared/ui/shadcn/components/ui/card';
import React from 'react';

const LayoutMinimal: React.FC<{ header: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode }>
= ({ header, children, footer }) => (
  <div className="min-h-[100vh] grid place-items-center p-4 relative overflow-hidden">
    {/* Bottom gradient background effect */}
    <div className="absolute inset-x-0 bottom-0 h-[60%] pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-t from-blue-600/8 via-blue-500/4 to-transparent dark:from-blue-500/10 dark:via-blue-400/5" />
      <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 via-transparent to-transparent dark:from-purple-400/8" />
      {/* Subtle radial glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/10 dark:bg-blue-400/15 rounded-full blur-3xl" />
    </div>

    {/* Card with glowing border and enhanced shadow */}
    <div className="relative z-10">
      {/* Glow effect behind card */}
      <div className="absolute -inset-1 bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-blue-600/20 dark:from-blue-400/25 dark:via-purple-400/15 dark:to-blue-500/25 rounded-[1.75rem] blur-xl opacity-60" />
      
      <Card className="relative w-full max-w-md rounded-3xl border border-white/50 dark:border-white/10 shadow-2xl shadow-black/10 dark:shadow-black/40 backdrop-blur-sm p-8 md:p-10 bg-white/80 dark:bg-neutral-900/90">
        {/* Subtle inner glow on border */}
        <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/50 dark:ring-white/5 pointer-events-none" />
        
        <div className="relative">
          {header}
          <div className="space-y-4">{children}</div>
          {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
        </div>
      </Card>
    </div>
  </div>
);

export default LayoutMinimal;
