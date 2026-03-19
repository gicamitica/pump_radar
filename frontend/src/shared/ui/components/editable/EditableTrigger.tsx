import React from 'react';
import { Edit2 } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { cn } from '@/shadcn/lib/utils';

export interface EditableTriggerProps {
  /** Callback when trigger is clicked */
  onClick: () => void;
  /** Content to display */
  children: React.ReactNode;
  /** Whether to show the edit icon on hover */
  showEditIcon?: boolean;
  /** Additional className */
  className?: string;
  /** Whether the trigger is disabled */
  disabled?: boolean;
}

/**
 * Shared trigger component for all editable elements.
 * Renders as a ghost button styled to look like inline content.
 * Shows edit icon on hover for discoverability.
 */
export const EditableTrigger: React.FC<EditableTriggerProps> = ({
  onClick,
  children,
  showEditIcon = true,
  className,
  disabled = false,
}) => {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      tabIndex={0}
      className={cn(
        'group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary',
        className
      )}
      disabled={disabled}
    >
      {children}
      {showEditIcon && (
        <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </Button>
  );
};

export default EditableTrigger;
