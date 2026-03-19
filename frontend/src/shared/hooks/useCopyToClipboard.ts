import { useCallback, useState } from 'react';
import { toast } from 'sonner';

/**
 * Options for useCopyToClipboard hook
 */
export interface UseCopyToClipboardOptions {
  successMessage?: string;
  errorMessage?: string;
  resetDelay?: number;
}

/**
 * Return type of useCopyToClipboard hook
 */
export interface UseCopyToClipboardReturn {
  /** Copy text to clipboard */
  copy: (text: string) => Promise<boolean>;
  /** Whether text was recently copied */
  copied: boolean;
  /** Error from last copy attempt */
  error: Error | null;
}

/**
 * Hook to copy text to clipboard with toast feedback.
 *
 * @param options - Configuration options
 * @returns Copy function and state
 *
 * @example
 * ```tsx
 * const { copy, copied } = useCopyToClipboard();
 * <Button onClick={() => copy('Hello')}>{copied ? 'Copied!' : 'Copy'}</Button>
 * ```
 */
export function useCopyToClipboard(
  options: UseCopyToClipboardOptions = {}
): UseCopyToClipboardReturn {
  const {
    successMessage = 'Code copied!',
    errorMessage = 'Unable to copy',
    resetDelay = 2000,
  } = options;

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      if (!navigator?.clipboard) {
        const err = new Error('Clipboard API not available');
        setError(err);
        toast.error(errorMessage, {
          description: 'Clipboard API not supported in this browser.',
        });
        return false;
      }

      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setError(null);
        toast.success(successMessage);

        setTimeout(() => {
          setCopied(false);
        }, resetDelay);

        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to copy');
        setError(error);
        setCopied(false);
        toast.error(errorMessage, {
          description: error.message,
        });
        return false;
      }
    },
    [successMessage, errorMessage, resetDelay]
  );

  return { copy, copied, error };
}
