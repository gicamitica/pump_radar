import React from 'react';
import { Input } from '@/shared/ui/shadcn/components/ui/input';
import { cn } from '@/shadcn/lib/utils';
import { InlineEditable } from '../editable/InlineEditable';
import { EditableTrigger } from '../editable/EditableTrigger';
import { EditableActions } from '../editable/EditableActions';

export interface EditableTableCellProps {
  /** The value to display and edit */
  value: string | number;
  /** Callback when the value is saved */
  onSave: (value: string | number) => void;
  /** Type of input to render */
  type?: 'text' | 'number';
  /** Optional prefix to display (e.g. currency symbol) */
  prefix?: string;
  /** Additional classes for the container */
  className?: string;
  /** Optional validation function. Return false to prevent save. */
  validate?: (value: string | number) => boolean;
}

/**
 * A table cell component that supports inline editing.
 * Built on top of the InlineEditable primitive with shared EditableTrigger and EditableActions.
 */
export const EditableTableCell: React.FC<EditableTableCellProps> = ({ 
  value, 
  onSave, 
  type = 'text', 
  prefix,
  className,
  validate
}) => {
  return (
    <InlineEditable
      value={value}
      onSave={(newValue) => {
        // Built-in basic validation
        if (type === 'text' && String(newValue).trim() === '') return;
        if (type === 'number' && (isNaN(Number(newValue)) || Number(newValue) < 0)) return;
        
        // Custom validation
        if (validate && !validate(newValue)) return;
        
        onSave(newValue);
      }}
      renderDisplay={({ onStartEdit }) => (
        <EditableTrigger
          onClick={onStartEdit}
          className={cn(className)}
        >
          {prefix && <span className="text-muted-foreground">{prefix}</span>}
          <span>{type === 'number' ? Number(value).toFixed(2) : value}</span>
        </EditableTrigger>
      )}
      renderEditor={({ value: draft, onChange, onSave: save, onCancel, inputProps, isSaving }) => (
        <div className={cn("flex items-center gap-2", className)}>
          <div className="flex-1 relative">
            <Input
              type={type}
              value={draft}
              onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
              className="h-8 w-full"
              autoFocus
              step={type === 'number' ? "0.01" : undefined}
              {...inputProps}
            />
          </div>
          <EditableActions
            onSave={save}
            onCancel={onCancel}
            isSaving={isSaving}
            size="icon"
          />
        </div>
      )}
    />
  );
};

