import React from 'react';
import { useInlineEdit } from '@/shared/hooks/useInlineEdit';

/**
 * Props for the display render function
 */
export interface InlineEditableDisplayProps<T> {
  /** The current value */
  value: T;
  /** Start editing */
  onStartEdit: () => void;
}

/**
 * Props for the editor render function
 */
export interface InlineEditableEditorProps<T> {
  /** The current draft value */
  value: T;
  /** Update the draft value */
  onChange: (value: T) => void;
  /** Save the current value */
  onSave: () => void;
  /** Cancel editing */
  onCancel: () => void;
  /** Whether save is in progress */
  isSaving: boolean;
  /** Error from save attempt */
  error: Error | null;
  /** Props to spread on input for keyboard handling */
  inputProps: {
    onKeyDown: (e: React.KeyboardEvent) => void;
  };
}

/**
 * Props for InlineEditable component
 */
export interface InlineEditableProps<T> {
  /** The current value */
  value: T;
  /** Async or sync save function */
  onSave: (value: T) => Promise<void> | void;
  /** Render function for display mode */
  renderDisplay: (props: InlineEditableDisplayProps<T>) => React.ReactNode;
  /** Render function for edit mode */
  renderEditor: (props: InlineEditableEditorProps<T>) => React.ReactNode;
  /** Callback when edit is cancelled */
  onCancel?: () => void;
  /** Callback when save succeeds */
  onSaveSuccess?: () => void;
  /** Callback when save fails */
  onSaveError?: (error: Error) => void;
  /** Whether keyboard shortcuts are enabled (default: true) */
  enableKeyboardShortcuts?: boolean;
  /** Additional class name for the wrapper */
  className?: string;
}

/**
 * A thin, reusable UI wrapper over useInlineEdit.
 * Provides a headless component pattern for inline editing.
 *
 * @example
 * ```tsx
 * <InlineEditable
 *   value={item.name}
 *   onSave={async (value) => {
 *     await api.updateItem({ id: item.id, name: value });
 *   }}
 *   renderDisplay={({ value, onStartEdit }) => (
 *     <span onClick={onStartEdit} className="cursor-pointer hover:underline">
 *       {value}
 *     </span>
 *   )}
 *   renderEditor={({ value, onChange, onSave, onCancel, isSaving, inputProps }) => (
 *     <div className="flex gap-2">
 *       <input
 *         value={value}
 *         onChange={(e) => onChange(e.target.value)}
 *         {...inputProps}
 *         autoFocus
 *       />
 *       <button onClick={onSave} disabled={isSaving}>
 *         {isSaving ? 'Saving...' : 'Save'}
 *       </button>
 *       <button onClick={onCancel} disabled={isSaving}>
 *         Cancel
 *       </button>
 *     </div>
 *   )}
 * />
 * ```
 */
export function InlineEditable<T>({
  value,
  onSave,
  renderDisplay,
  renderEditor,
  onCancel,
  onSaveSuccess,
  onSaveError,
  enableKeyboardShortcuts = true,
  className,
}: InlineEditableProps<T>): React.ReactElement {
  const edit = useInlineEdit<T>({
    initialValue: value,
    onSave,
    onCancel,
    onSaveSuccess,
    onSaveError,
    enableKeyboardShortcuts,
  });

  // Sync external value changes when not editing
  const { isEditing, setOriginalValue } = edit;
  React.useEffect(() => {
    if (!isEditing) {
      setOriginalValue(value);
    }
  }, [value, isEditing, setOriginalValue]);

  const content = isEditing
    ? renderEditor({
        value: edit.draft,
        onChange: edit.setDraft,
        onSave: edit.saveEdit,
        onCancel: edit.cancelEdit,
        isSaving: edit.isSaving,
        error: edit.saveError,
        inputProps: edit.inputProps,
      })
    : renderDisplay({
        value: edit.originalValue,
        onStartEdit: edit.startEdit,
      });

  if (className) {
    return <div className={className}>{content}</div>;
  }

  return <>{content}</>;
}

export default InlineEditable;
