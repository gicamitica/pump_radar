import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clipboard, MousePointer2, X } from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';
import { useOnboarding } from '@/shared/hooks';

interface FloatingFeaturePillProps {
  /** The unique feature ID for onboarding tracking */
  featureId: string;
  /** Additional class names */
  className?: string;
  /** Whether to use a more compact layout for narrow containers */
  compact?: boolean;
}

/**
 * FloatingFeaturePills - Subtle animated badges that guide users to 
 * discover modern features like pasting and drag-and-drop.
 * Shared across different modules for consistent onboarding experiences.
 */
export const FloatingFeaturePills: React.FC<FloatingFeaturePillProps> = ({ 
  featureId,
  className,
  compact = false
}) => {
  const { isVisible, markAsSeen } = useOnboarding(featureId);
  const [delayedVisible, setDelayedVisible] = useState(false);
  
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setDelayedVisible(true), 1500);
      return () => clearTimeout(timer);
    } else {
      setDelayedVisible(false);
    }
  }, [isVisible]);

  const dismiss = () => {
    setDelayedVisible(false);
    markAsSeen();
  };

  return (
    <AnimatePresence>
      {delayedVisible && (
        <div className={cn(
          "absolute bottom-full left-0 right-0 z-20 flex flex-col items-center gap-0.5 mb-3 pointer-events-none px-4", 
          className
        )}>
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className={cn(
              "flex flex-col sm:flex-row items-center bg-gradient-to-tr from-zinc-900/80 to-zinc-800/80 dark:from-zinc-100/80 dark:to-white/80 text-zinc-50 dark:text-zinc-900 rounded-2xl shadow-2xl backdrop-blur-xl border border-white/10 dark:border-black/5 pointer-events-auto overflow-hidden",
              compact ? "w-full max-w-[260px] p-1.5" : "w-max max-w-[90vw] px-1 py-1"
            )}
          >
            <div className={cn(
              "flex items-center gap-3 w-full",
              compact ? "px-2 py-1 justify-start border-b border-white/5 dark:border-black/5 last:border-0" : "px-3 py-1.5"
            )}>
              <div className="size-6 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <Clipboard className="size-3.5 text-primary" />
              </div>
              <span className="text-[10px] font-bold tracking-tight whitespace-nowrap">
                {compact ? "Paste images" : "New: Paste images (Ctrl+V)"}
              </span>
            </div>
            
            {!compact && <div className="w-px h-4 bg-white/10 dark:bg-black/5 my-auto" />}
            
            <div className={cn(
              "flex items-center gap-3 w-full",
              compact ? "px-2 py-1 justify-start" : "px-3 py-1.5"
            )}>
              <div className="size-6 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <MousePointer2 className="size-3.5 text-primary" />
              </div>
              <span className="text-[10px] font-bold tracking-tight whitespace-nowrap">
                {compact ? "Drop files" : "Drag & Drop files"}
              </span>
            </div>

            <button 
              onClick={dismiss}
              className={cn(
                "hover:bg-white/10 dark:hover:bg-black/5 rounded-full transition-colors group/btn shrink-0",
                compact ? "absolute top-2 right-2 p-1" : "ml-1 p-1"
              )}
              aria-label="Dismiss"
            >
              <X className="size-3 text-zinc-500 group-hover/btn:text-red-400 transition-colors" />
            </button>
          </motion.div>
          
          <div 
            className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-zinc-800/80 dark:border-t-zinc-100/80"
          />
        </div>
      )}
    </AnimatePresence>
  );
};
