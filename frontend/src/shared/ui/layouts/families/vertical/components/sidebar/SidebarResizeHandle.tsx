import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shadcn/lib/utils';
import { useService } from '@/app/providers/useService';
import { CORE_SYMBOLS } from '@/core/di/symbols';
import type { IConfig } from '@/shared/infrastructure/config/Config';
import { usePersistentState } from '@/shared/hooks';

interface SidebarResizeHandleProps {
  onResize: (width: number) => void;
  onResizingChange?: (resizing: boolean) => void;
  /** Offset from the left of the viewport where the sidebar starts */
  offset?: number;
}

export const SidebarResizeHandle: React.FC<SidebarResizeHandleProps> = ({
  onResize,
  onResizingChange,
  offset = 0,
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [hasSeenDiscovery, setHasSeenDiscovery] = usePersistentState<boolean>(
    'katalyst-sidebar-discovery-seen',
    false
  );
  
  const config = useService<IConfig>(CORE_SYMBOLS.IConfig);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    onResizingChange?.(true);
    if (!hasSeenDiscovery) setHasSeenDiscovery(true);
  }, [onResizingChange, hasSeenDiscovery, setHasSeenDiscovery]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate width relative to the sidebar start (offset)
      const newWidth = e.clientX - offset;
      
      if (newWidth >= config.sidebar.minWidth && newWidth <= config.sidebar.maxWidth) {
        onResize(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      onResizingChange?.(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onResize, config, onResizingChange, offset]);

  return (
    <div
      onMouseDown={handleMouseDown}
      className={cn(
        'absolute right-0 top-0 bottom-0 w-2 cursor-col-resize group z-[100]',
        'hover:bg-primary/5 transition-colors duration-200',
        isResizing && 'bg-primary/10'
      )}
      title="Resize sidebar"
    >
      {/* Interaction Guideline */}
      <div
        className={cn(
          'absolute right-0 inset-y-2 w-[2px] rounded-full transition-all duration-300',
          'group-hover:bg-primary/50 group-hover:inset-y-0',
          isResizing ? 'bg-primary inset-y-0' : 'bg-transparent'
        )}
      />

      {/* Discovery Pulse - Only shown once */}
      <AnimatePresence>
        {!hasSeenDiscovery && !isResizing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
              scaleY: [0.2, 0.4, 0.2],
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 2, 
              repeat: 3, 
              ease: "easeInOut",
              onComplete: () => setHasSeenDiscovery(true)
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-72 bg-primary blur-[1px] rounded-full pointer-events-none"
          />
        )}
      </AnimatePresence>
    </div>
  );
};
