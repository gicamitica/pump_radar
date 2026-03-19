import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/shared/ui/shadcn/components/ui/alert-dialog';
import { buttonVariants } from '@/shadcn/components/ui/button';
import { cn } from '@/shadcn/lib/utils';
import type { ConfirmOptions } from '@/shared/hooks/useConfirmation';

/**
 * Props for ConfirmDialog component
 */
export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Confirmation options (title, description, labels, variant) */
  options: ConfirmOptions | null;
  /** Handler when user confirms */
  onConfirm: () => void;
  /** Handler when user cancels */
  onCancel: () => void;
}

/**
 * Reusable confirmation dialog built on Radix AlertDialog.
 * Receives state and config from useConfirmation hook.
 *
 * @example
 * ```tsx
 * const { state, confirm, handleConfirm, handleCancel } = useConfirmation();
 *
 * <ConfirmDialog
 *   open={state.isOpen}
 *   options={state.options}
 *   onConfirm={handleConfirm}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export function ConfirmDialog({
  open,
  options,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): React.ReactElement | null {
  if (!options) {
    return null;
  }

  const {
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'default',
  } = options;

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(
              variant === 'destructive' && buttonVariants({ variant: 'destructive' })
            )}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ConfirmDialog;
