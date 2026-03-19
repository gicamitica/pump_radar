/**
 * Editable Components - Shared primitives for inline editing
 * 
 * Architecture:
 * - useInlineEdit: Core hook for state management
 * - InlineEditable: Headless wrapper component
 * - EditableTrigger: Reusable trigger button
 * - EditableActions: Reusable save/cancel buttons
 * - InlineEditableField: Form-oriented implementation
 * - EditableTableCell: Table-oriented implementation (in ../table/)
 */

export { InlineEditable } from './InlineEditable';
export type { InlineEditableProps, InlineEditableDisplayProps, InlineEditableEditorProps } from './InlineEditable';

export { EditableTrigger } from './EditableTrigger';
export type { EditableTriggerProps } from './EditableTrigger';

export { EditableActions } from './EditableActions';
export type { EditableActionsProps } from './EditableActions';

export { InlineEditableField } from './InlineEditableField';
export type { InlineEditableFieldProps } from './InlineEditableField';
