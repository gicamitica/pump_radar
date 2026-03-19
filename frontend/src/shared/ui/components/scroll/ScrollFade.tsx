import { motion } from 'framer-motion';
import { cn } from '@/shadcn/lib/utils';

export interface ScrollFadeProps {
  /** Position of the fade effect */
  position: 'top' | 'bottom';
  /** Height of the fade gradient (default: 'md') */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show the fade (controls opacity) */
  visible?: boolean;
  /** Custom className for additional styling */
  className?: string;
  /** Z-index for layering (default: 10) */
  zIndex?: number;
  /** Custom gradient configuration */
  gradient?: {
    /** Starting color (e.g., 'rgb(255 255 255)', 'hsl(var(--card))') */
    from: string;
    /** Middle color (optional, defaults to from with 80% opacity) */
    via?: string;
    /** Ending color (always transparent) */
  };
}

const sizeClasses = {
  sm: 'h-8',
  md: 'h-12',
  lg: 'h-16',
};

const marginClasses = {
  sm: { top: '-mb-8', bottom: '-mt-8' },
  md: { top: '-mb-12', bottom: '-mt-12' },
  lg: { top: '-mb-16', bottom: '-mt-16' },
};

/**
 * ScrollFade Component
 * 
 * Renders a gradient fade overlay with a subtle blur effect to indicate scrollable content.
 * Uses framer-motion for smooth entrance/exit animations.
 * 
 * Uses 'sticky' positioning to work with both native overflow containers and 
 * custom scroll components (SimpleBar, ScrollArea).
 * 
 * Supports custom gradient colors via the `gradient` prop for better integration
 * with different background colors (e.g., cards, popovers, megamenus).
 */
export function ScrollFade({
  position,
  size = 'md',
  visible = true,
  className,
  zIndex = 10,
  gradient,
}: ScrollFadeProps) {
  const isTop = position === 'top';
  const margins = marginClasses[size];

  // Build custom gradient or use default
  const customGradient = gradient
    ? {
        backgroundImage: isTop
          ? `linear-gradient(to bottom, ${gradient.from}, ${gradient.via || gradient.from + '80'}, transparent)`
          : `linear-gradient(to top, ${gradient.from}, ${gradient.via || gradient.from + '80'}, transparent)`,
      }
    : undefined;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        // Layout & Positioning
        'sticky left-0 right-0 w-full pointer-events-none z-10',
        sizeClasses[size],
        
        // Vertical Position & Negative Margins (to overlay content)
        isTop 
          ? `top-0 ${margins.top}` 
          : `bottom-0 ${margins.bottom}`,
        
        // Default Gradient (only if no custom gradient provided)
        !gradient && (isTop
          ? 'bg-gradient-to-b from-background via-background/80 to-transparent'
          : 'bg-gradient-to-t from-background via-background/80 to-transparent'),
        
        className
      )}
      style={{ 
        zIndex,
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
        // Mask the blur so it fades out with the gradient
        maskImage: isTop 
          ? 'linear-gradient(to bottom, black 20%, transparent 100%)'
          : 'linear-gradient(to top, black 20%, transparent 100%)',
        WebkitMaskImage: isTop 
          ? 'linear-gradient(to bottom, black 20%, transparent 100%)'
          : 'linear-gradient(to top, black 20%, transparent 100%)',
        // Apply custom gradient if provided
        ...customGradient,
      }}
      aria-hidden="true"
    />
  );
}
