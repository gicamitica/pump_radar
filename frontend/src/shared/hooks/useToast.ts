import { toast } from 'sonner';

/**
 * Hook to access Sonner toast notifications.
 *
 * @returns Toast function and dismiss method
 *
 * @example
 * ```tsx
 * const { toast } = useToast();
 * toast.success('Saved!');
 * toast.error('Failed to save');
 * ```
 */
function useToast() {
  return {
    toast,
    dismiss: toast.dismiss,
  };
}

export { useToast, toast };
