import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * State of an async action
 */
export interface AsyncActionState<TData = unknown, TError = Error> {
  /** Whether the action is currently running */
  isLoading: boolean;
  /** The error from the last failed execution, if any */
  error: TError | null;
  /** The data from the last successful execution, if any */
  data: TData | null;
  /** Whether the action has been executed at least once */
  hasRun: boolean;
}

/**
 * Options for useAsyncAction
 */
export interface UseAsyncActionOptions<TData = unknown> {
  /** Callback when the action succeeds */
  onSuccess?: (data: TData) => void;
  /** Callback when the action fails */
  onError?: (error: Error) => void;
  /** Callback when the action settles (success or failure) */
  onSettled?: () => void;
  /** Initial data value */
  initialData?: TData | null;
}

/**
 * Return type of useAsyncAction
 */
export interface UseAsyncActionReturn<TArgs extends unknown[], TData = unknown, TError = Error> {
  /** Execute the async action */
  run: (...args: TArgs) => Promise<TData | undefined>;
  /** Whether the action is currently running */
  isLoading: boolean;
  /** The error from the last failed execution */
  error: TError | null;
  /** The data from the last successful execution */
  data: TData | null;
  /** Whether the action has been executed at least once */
  hasRun: boolean;
  /** Reset the state to initial values */
  reset: () => void;
  /** Retry the last action with the same arguments */
  retry: () => Promise<TData | undefined>;
}

/**
 * Hook to encapsulate async operation state and lifecycle.
 *
 * @param asyncFn - The async function to wrap
 * @param options - Optional configuration
 * @returns Object with run function and state
 *
 * @example
 * ```tsx
 * const { run, isLoading, error, reset } = useAsyncAction(async (id: string) => {
 *   const response = await api.deleteItem(id);
 *   return response.data;
 * });
 *
 * // Execute the action
 * await run('item-123');
 *
 * // Check state
 * if (isLoading) return <Spinner />;
 * if (error) return <Error message={error.message} />;
 * ```
 */
export function useAsyncAction<TArgs extends unknown[], TData = unknown, TError = Error>(
  asyncFn: (...args: TArgs) => Promise<TData>,
  options: UseAsyncActionOptions<TData> = {}
): UseAsyncActionReturn<TArgs, TData, TError> {
  const { onSuccess, onError, onSettled, initialData = null } = options;

  const [state, setState] = useState<AsyncActionState<TData, TError>>({
    isLoading: false,
    error: null,
    data: initialData,
    hasRun: false,
  });

  // Store the last arguments for retry functionality
  const lastArgsRef = useRef<TArgs | null>(null);

  // Store callbacks in refs to avoid stale closures
  const callbacksRef = useRef({ onSuccess, onError, onSettled });
  // Update ref in useEffect to satisfy lint rules
  useEffect(() => {
    callbacksRef.current = { onSuccess, onError, onSettled };
  });

  const run = useCallback(
    async (...args: TArgs): Promise<TData | undefined> => {
      lastArgsRef.current = args;

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        hasRun: true,
      }));

      try {
        const result = await asyncFn(...args);

        setState((prev) => ({
          ...prev,
          isLoading: false,
          data: result,
          error: null,
        }));

        callbacksRef.current.onSuccess?.(result);
        callbacksRef.current.onSettled?.();

        return result;
      } catch (err) {
        const error = err as TError;

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error,
        }));

        callbacksRef.current.onError?.(err as Error);
        callbacksRef.current.onSettled?.();

        return undefined;
      }
    },
    [asyncFn]
  );

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      data: initialData,
      hasRun: false,
    });
    lastArgsRef.current = null;
  }, [initialData]);

  const retry = useCallback(async (): Promise<TData | undefined> => {
    if (lastArgsRef.current === null) {
      return undefined;
    }
    return run(...lastArgsRef.current);
  }, [run]);

  return {
    run,
    isLoading: state.isLoading,
    error: state.error,
    data: state.data,
    hasRun: state.hasRun,
    reset,
    retry,
  };
}

export default useAsyncAction;
