import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/shadcn/lib/utils';

export interface ActionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  /**
   * If true, the component will merge its props onto its immediate child.
   */
  asChild?: boolean;
}

/**
 * ActionCard
 * 
 * A premium container component for interactive list items, radio groups, and more.
 * Handles Hover, Active, and Disabled states with a unified look.
 * 
 * Supports the asChild pattern to merge styles and interaction states with child elements.
 */
export const ActionCard = React.forwardRef<HTMLDivElement, ActionCardProps>(
  ({ children, className, active, disabled, asChild, ...props }, ref) => {
    const Component = asChild ? Slot : 'div';

    return (
      <Component
        ref={ref}
        className={cn(
          // Base Styles
          "group relative flex rounded-2xl border border-border/60 dark:border-border/30 bg-card/40 transition-all duration-300",
          "overflow-hidden isolate p-4",

          // Interaction Styles (if not disabled)
          !disabled && [
            "cursor-pointer hover:bg-card/80 hover:border-primary/20 hover:shadow-lg",
            "active:scale-[0.98] active:shadow-md",
          ],

          // Active State
          active && [
            "border-primary/40 bg-primary/5 shadow-primary/10",
            "after:absolute after:inset-0 after:bg-primary/5 after:-z-10",
          ],

          // Disabled State
          disabled && "opacity-50 cursor-not-allowed grayscale-[0.5]",

          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

ActionCard.displayName = 'ActionCard';
