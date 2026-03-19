import { useState, useCallback, useRef } from 'react';
import { useKeyboardShortcut } from './useKeyboardShortcut';
import { useAsyncAction } from './useAsyncAction';

/**
 * Options for useInlineEdit
 */
export interface UseInlineEditOptions<T> {
  /** Initial value */
  initialValue: T;
  /** Async save function */
  onSave?: (value: T) => Promise<void> | void;
  /** Callback when edit is cancelled */
  onCancel?: () => void;
  /** Callback when save succeeds */
  onSaveSuccess?: () => void;
  /** Callback when save fails */
  onSaveError?: (error: Error) => void;
  /** Whether keyboard shortcuts are enabled (default: true) */
  enableKeyboardShortcuts?: boolean;
}

/**
 * Return type of useInlineEdit
 */
export interface UseInlineEditReturn<T> {
  /** Whether currently in edit mode */
  isEditing: boolean;
  /** The current draft value being edited */
  draft: T;
  /** The original value (before editing) */
  originalValue: T;
  /** Whether a save operation is in progress */
  isSaving: boolean;
  /** Error from the last save attempt */
  saveError: Error | null;
  /** Start editing */
  startEdit: () => void;
  /** Cancel editing and revert to original value */
  cancelEdit: () => void;
  /** Save the current draft value */
  saveEdit: () => Promise<void>;
  /** Update the draft value */
  setDraft: (value: T | ((prev: T) => T)) => void;
  /** Update the original value (for external updates) */
  setOriginalValue: (value: T) => void;
  /** Props to spread on an input element for keyboard handling */
  inputProps: {
    onKeyDown: (e: React.KeyboardEvent) => void;
  };
}

/**
 * Hook to encapsulate inline editing behavior.
 *
 * @param options - Configuration options
 * @returns Object with editing state and controls
 *
 * @example
 * ```tsx
 * const edit = useInlineEdit({
 *   initialValue: 'Hello',
 *   onSave: async (value) => {
 *     await api.updateItem({ name: value });
 *   },
 * });
 *
 * if (edit.isEditing) {
 *   return (
 *     <input
 *       value={edit.draft}
 *       onChange={(e) => edit.setDraft(e.target.value)}
 *       {...edit.inputProps}
 *     />
 *   );
 * }
 *
 * return (
 *   <span onClick={edit.startEdit}>{edit.originalValue}</span>
 * );
 * ```
 */
export function useInlineEdit<T>(
  options: UseInlineEditOptions<T>
): UseInlineEditReturn<T> {
  const {
    initialValue,
    onSave,
    onCancel,
    onSaveSuccess,
    onSaveError,
    enableKeyboardShortcuts = true,
  } = options;

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraftState] = useState<T>(initialValue);
  const [originalValue, setOriginalValue] = useState<T>(initialValue);

  // Track if we're currently focused on an input for keyboard shortcuts
  const inputFocusedRef = useRef(false);

  // Async save action
  const saveAction = useAsyncAction(
    async (value: T) => {
      if (onSave) {
        await onSave(value);
      }
    },
    {
      onSuccess: () => {
        setOriginalValue(draft);
        setIsEditing(false);
        onSaveSuccess?.();
      },
      onError: (error) => {
        onSaveError?.(error);
      },
    }
  );

  const startEdit = useCallback(() => {
    setDraftState(originalValue);
    setIsEditing(true);
    saveAction.reset();
  }, [originalValue, saveAction]);

  const cancelEdit = useCallback(() => {
    setDraftState(originalValue);
    setIsEditing(false);
    saveAction.reset();
    onCancel?.();
  }, [originalValue, saveAction, onCancel]);

  const saveEdit = useCallback(async () => {
    await saveAction.run(draft);
  }, [saveAction, draft]);

  const setDraft = useCallback((value: T | ((prev: T) => T)) => {
    setDraftState(value);
  }, []);

  // Keyboard shortcut: Enter to save (only when editing and input focused)
  useKeyboardShortcut(
    { key: 'Enter' },
    () => {
      if (isEditing && inputFocusedRef.current) {
        saveEdit();
      }
    },
    { enabled: enableKeyboardShortcuts && isEditing }
  );

  // Keyboard shortcut: Escape to cancel (only when editing and input focused)
  useKeyboardShortcut(
    { key: 'Escape' },
    () => {
      if (isEditing && inputFocusedRef.current) {
        cancelEdit();
      }
    },
    { enabled: enableKeyboardShortcuts && isEditing }
  );
      
  // Input props for keyboard handling (alternative to global shortcuts)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        saveEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      }
    },
    [saveEdit, cancelEdit]
  );

  const inputProps = {
    onKeyDown: handleKeyDown,
    onFocus: () => {
      inputFocusedRef.current = true;
    },
    onBlur: () => {
      inputFocusedRef.current = false;
    },
  };

  return {
    isEditing,
    draft,
    originalValue,
    isSaving: saveAction.isLoading,
    saveError: saveAction.error,
    startEdit,
    cancelEdit,
    saveEdit,
    setDraft,
    setOriginalValue,
    inputProps,
  };
}

export default useInlineEdit;
