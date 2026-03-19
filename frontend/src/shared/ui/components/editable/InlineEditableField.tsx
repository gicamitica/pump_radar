import { cn } from '@/shadcn/lib/utils';
import { Input } from '@/shared/ui/shadcn/components/ui/input';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';
import { InlineEditable } from './InlineEditable';
import { EditableTrigger } from './EditableTrigger';
import { EditableActions } from './EditableActions';

export interface InlineEditableFieldProps {
  id: string;
  label?: React.ReactNode;
  value: string;
  onSave: (nextValue: string) => Promise<void> | void;
  onCancel?: () => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  displayClassName?: string;
  inputClassName?: string;
  /** Render custom display; receives startEdit */
  renderDisplay?: (startEdit: () => void) => React.ReactNode;
  /** Render custom input; receives common handlers/state */
  renderInput?: (props: {
    value: string;
    onChange: (val: string) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onBlur: () => void;
    autoFocus: boolean;
    isSaving: boolean;
  }) => React.ReactNode;
  /** Optional error message to show under the field */
  error?: string;
  /** External saving state (if controlled) */
  isSaving?: boolean;
  /** Mark field as edited and optionally show a badge */
  edited?: boolean;
  showEditedBadge?: boolean;
  editedBadgeContent?: React.ReactNode;
  /** Save when input loses focus */
  saveOnBlur?: boolean;
  /** Custom onBlur handler (runs in addition to saveOnBlur if provided) */
  onBlur?: () => void;
  /** Hide action buttons (useful for blur-only UX) */
  hideActions?: boolean;
}

export function InlineEditableField({
  id,
  label,
  value,
  onSave,
  onCancel,
  placeholder,
  type = 'text',
  disabled,
  readOnly,
  className,
  displayClassName,
  inputClassName,
  renderDisplay,
  renderInput,
  error,
  isSaving: controlledSaving,
  edited = false,
  showEditedBadge = true,
  editedBadgeContent = 'Edited',
  saveOnBlur = false,
  onBlur,
  hideActions = false,
}: InlineEditableFieldProps) {
  return (
    <InlineEditable
      value={value}
      onSave={onSave}
      onCancel={onCancel}
      className={cn('space-y-1', className)}
      renderDisplay={({ value: displayValue, onStartEdit }) =>
        renderDisplay ? (
          renderDisplay(onStartEdit)
        ) : (
          <div className="flex items-center">
            {label && <span className="text-sm mr-2 text-muted-foreground">{label}</span>}
            
            <EditableTrigger
              onClick={onStartEdit}
              disabled={disabled || readOnly}
              className={displayClassName}
            >
              <span className="text-sm">{displayValue}</span>
              {showEditedBadge && edited && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {editedBadgeContent}
                </Badge>
              )}
            </EditableTrigger>
          </div>
        )
      }
      renderEditor={({ value: draft, onChange, onSave: save, onCancel: cancel, isSaving, error: hookError, inputProps }) => {
        const saving = controlledSaving ?? isSaving;
        const displayError = error ?? hookError?.message;
        const handleBlur = () => {
          onBlur?.();
          if (saveOnBlur) {
            void save();
          }
        };

        return (
          <div className="flex gap-2 items-center">
            {label && <span className="text-sm text-muted-foreground">{label}</span>}

            <div className="flex">
              <div className="flex items-center gap-2">
                {renderInput ? (
                  renderInput({
                    value: draft,
                    onChange,
                    onKeyDown: inputProps.onKeyDown,
                    onBlur: handleBlur,
                    autoFocus: true,
                    isSaving: saving,
                  })
                ) : (
                  <Input
                    id={id}
                    value={draft}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={inputProps.onKeyDown}
                    onBlur={handleBlur}
                    className={cn(
                      inputClassName
                    )}
                    autoFocus
                    placeholder={placeholder}
                    type={type}
                    disabled={disabled || saving}
                  />
                )}

                {!hideActions && (
                  <EditableActions
                    onSave={save}
                    onCancel={cancel}
                    isSaving={saving}
                    disabled={disabled || readOnly}
                  />
                )}
              </div>
              {saving && <p className="text-xs text-muted-foreground mt-1">Saving...</p>}
              {displayError && <p className="text-xs text-destructive mt-1">{displayError}</p>}
            </div>
          </div>
        );
      }}
    />
  );
}

export default InlineEditableField;
