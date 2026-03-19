import React from 'react';
import { FieldLabel } from '@/shared/ui/shadcn/components/ui/field';
import { cn } from '@/shadcn/lib/utils';

interface StyledFieldLabelProps extends React.ComponentPropsWithoutRef<typeof FieldLabel> {
  /**
   * Whether the field has an error status (adjusts color)
   */
  hasError?: boolean;
  /**
   * Whether to show a required indicator (*)
   */
  isRequired?: boolean;
}

/**
 * Standardized field label with consistent styling across all field components.
 * 
 * Features:
 * - Error state handling
 * - Consistent sizing and spacing
 */
export const StyledFieldLabel = React.forwardRef<
  HTMLLabelElement,
  StyledFieldLabelProps
>(({ className, hasError, isRequired, children, ...props }, ref) => {
  if (!children) return null;
  
  return (
    <FieldLabel
      ref={ref}
      className={cn(
        'text-sm font-semibold field-label',
        hasError ? 'text-destructive' : 'text-foreground/70',
        className
      )}
      {...props}
    >
      {children}
      {isRequired && <span className="text-destructive ml-1">*</span>}
    </FieldLabel>
  );
});

StyledFieldLabel.displayName = 'StyledFieldLabel';

export default StyledFieldLabel;
