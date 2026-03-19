import React from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { cn } from '@/shadcn/lib/utils';

export interface EditableActionsProps {
  /** Callback when save is clicked */
  onSave: () => void;
  /** Callback when cancel is clicked */
  onCancel: () => void;
  /** Whether a save operation is in progress */
  isSaving?: boolean;
  /** Whether the actions are disabled */
  disabled?: boolean;
  /** Size variant for the buttons */
  size?: 'default' | 'sm' | 'icon';
  /** Additional className for the container */
  className?: string;
}

/**
 * Shared action buttons component for all editable elements.
 * Renders Save (Check) and Cancel (X) buttons with consistent styling.
 */
export const EditableActions: React.FC<EditableActionsProps> = ({
  onSave,
  onCancel,
  isSaving = false,
  disabled = false,
  size = 'default',
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        variant="outline"
        size={size}
        onClick={onSave}
        disabled={disabled || isSaving}
        className={size === 'icon' ? 'h-8 w-8 p-0' : ''}
      >
        <Check className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size={size}
        className={cn(
          'text-destructive hover:text-destructive',
          size === 'icon' ? 'h-8 w-8 p-0' : ''
        )}
        onClick={onCancel}
        disabled={isSaving}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default EditableActions;
