import React from 'react';
import { cn } from '@/shadcn/lib/utils';
import { getSidebarAppearance, type SidebarAppearance } from '../tokens/sidebarAppearances';
import { Home, Settings, BarChart2 } from 'lucide-react';

interface SidebarAppearancePreviewProps {
  appearance: SidebarAppearance;
}

/**
 * SidebarAppearancePreview - Visual preview of sidebar appearance
 * 
 * Renders a miniature sidebar with real appearance styles applied.
 * Uses actual CSS variables from sidebarAppearances.ts to show
 * accurate colors, gradients, and contrast.
 * 
 * No routing or real navigation - purely visual preview.
 */
export const SidebarAppearancePreview: React.FC<SidebarAppearancePreviewProps> = ({
  appearance,
}) => {
  return (
    <aside
      style={getSidebarAppearance(appearance)}
      className={cn(
        'h-full w-full flex flex-col gap-1 p-2',
        'sidebar-surface bg-sidebar text-sidebar-foreground'
      )}
    >
      {/* Header area */}
      <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
        <div className="size-6 rounded bg-sidebar-active flex items-center justify-center">
          <div className="size-3 rounded-sm bg-sidebar-icon opacity-60" />
        </div>
        <div className="flex-1 h-2 rounded bg-sidebar-hover opacity-40" />
      </div>

      {/* Nav items */}
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-full bg-sidebar-active">
        <Home className="size-3 text-sidebar-icon-active shrink-0" />
        <div className="flex-1 h-1.5 rounded bg-sidebar-icon-active opacity-60" />
      </div>

      <div className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-sidebar-hover">
        <BarChart2 className="size-3 text-sidebar-icon shrink-0" />
        <div className="flex-1 h-1.5 rounded bg-sidebar-icon opacity-40" />
      </div>

      <div className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-sidebar-hover">
        <Settings className="size-3 text-sidebar-icon shrink-0" />
        <div className="flex-1 h-1.5 rounded bg-sidebar-icon opacity-40" />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer indicator */}
      <div className="flex items-center gap-2 px-2 py-1.5 border-t border-sidebar-border opacity-50">
        <div className="size-5 rounded-full bg-sidebar-hover" />
        <div className="flex-1 h-1.5 rounded bg-sidebar-muted opacity-30" />
      </div>
    </aside>
  );
};
