import { useState, useCallback, useRef } from 'react';

/**
 * Options for a confirmation dialog
 */
export interface ConfirmOptions {
  /** Dialog title */
  title: string;
  /** Dialog description/message */
  description?: string;
  /** Label for the confirm button */
  confirmLabel?: string;
  /** Label for the cancel button */
  cancelLabel?: string;
  /** Variant for styling (affects confirm button) */
  variant?: 'default' | 'destructive';
}

/**
 * State of the confirmation dialog
 */
export interface ConfirmationState {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Current dialog options */
  options: ConfirmOptions | null;
}

/**
 * Return type of useConfirmation
 */
export interface UseConfirmationReturn {
  /** Current confirmation state */
  state: ConfirmationState;
  /** Request confirmation from the user */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** Handle user confirming the action */
  handleConfirm: () => void;
  /** Handle user canceling the action */
  handleCancel: () => void;
}

/**
 * Hook to centralize confirmation logic for destructive or risky actions.
 *
 * @returns Object with confirmation state and methods
 *
 * @example
 * ```tsx
 * const { state, confirm, handleConfirm, handleCancel } = useConfirmation();
 *
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: 'Delete item?',
 *     description: 'This action cannot be undone.',
 *     confirmLabel: 'Delete',
 *     cancelLabel: 'Cancel',
 *     variant: 'destructive',
 *   });
 *
 *   if (confirmed) {
 *     await deleteItem();
 *   }
 * };
 *
 * // Render the dialog
 * <ConfirmDialog
 *   open={state.isOpen}
 *   options={state.options}
 *   onConfirm={handleConfirm}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export function useConfirmation(): UseConfirmationReturn {
  const [state, setState] = useState<ConfirmationState>({
    isOpen: false,
    options: null,
  });

  // Store resolve function for the promise
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({
        isOpen: true,
        options,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setState({ isOpen: false, options: null });
    resolveRef.current?.(true);
    resolveRef.current = null;
  }, []);

  const handleCancel = useCallback(() => {
    setState({ isOpen: false, options: null });
    resolveRef.current?.(false);
    resolveRef.current = null;
  }, []);

  return {
    state,
    confirm,
    handleConfirm,
    handleCancel,
  };
}

export default useConfirmation;
