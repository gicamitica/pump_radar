import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload } from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';

interface FileUploadDropOverlayProps {
  /** Whether the drag state is active */
  isDragActive: boolean;
  /** Title to display */
  title?: string;
  /** Description to display */
  description?: string;
  /** Whether to use a compact layout (e.g. for small widgets) */
  compact?: boolean;
  /** Additional class names for the container */
  className?: string;
}

/**
 * FileUploadDropOverlay - A shared premium overlay for file drag-and-drop.
 * Provides visual feedback with backdrop blur, borders, and animations.
 */
export const FileUploadDropOverlay: React.FC<FileUploadDropOverlayProps> = ({
  isDragActive,
  title = 'Drop to send files',
  description = 'Release to attach your documents or images',
  compact = false,
  className,
}) => {
  return (
    <AnimatePresence>
      {isDragActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "absolute inset-0 z-50 flex items-center justify-center bg-primary/10 backdrop-blur-[2px] border-2 border-dashed border-primary",
            compact ? "m-2 rounded-xl" : "m-4 rounded-2xl",
            "pointer-events-none",
            className
          )}
        >
          <div className={cn(
            "flex flex-col items-center bg-background/90 shadow-2xl border border-primary/20",
            compact ? "p-4 rounded-2xl gap-2" : "p-8 rounded-3xl gap-4"
          )}>
            <div className={cn(
              "rounded-full bg-primary/10 flex items-center justify-center",
              compact ? "size-10" : "size-16"
            )}>
              <Upload className={cn(
                "text-primary animate-bounce",
                compact ? "size-5" : "size-8"
              )} />
            </div>
            <div className="text-center">
              <h3 className={cn(
                "font-bold text-primary",
                compact ? "text-xs" : "text-xl"
              )}>
                {compact ? (title === 'Drop to send files' ? 'Drop to attach' : title) : title}
              </h3>
              {!compact && description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
