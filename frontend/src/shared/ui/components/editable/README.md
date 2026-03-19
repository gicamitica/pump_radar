# Editable Components Architecture

## Overview

The editable components system follows a **composition-based architecture** with shared primitives to eliminate code duplication and ensure consistency across all editable UI elements.

## Component Hierarchy

```
useInlineEdit (hook)
    ↓
InlineEditable (headless wrapper)
    ↓
EditableTrigger + EditableActions (shared UI primitives)
    ↓
InlineEditableField / EditableTableCell / EditableDropdown (composed implementations)
```

## Core Primitives

### 1. `useInlineEdit` (Hook)
- **Location**: `src/shared/hooks/useInlineEdit.ts`
- **Purpose**: State management for inline editing
- **Features**: Edit mode toggle, keyboard shortcuts, async save handling

### 2. `InlineEditable` (Headless Component)
- **Location**: `src/shared/ui/components/editable/InlineEditable.tsx`
- **Purpose**: Wrapper that connects the hook to UI via render props
- **Pattern**: Headless UI - no styling, pure logic

### 3. `EditableTrigger` (Shared UI Primitive)
- **Location**: `src/shared/ui/components/editable/EditableTrigger.tsx`
- **Purpose**: Reusable trigger button for all editable elements
- **Features**:
  - Ghost button styled to look like inline content
  - Hover edit icon for discoverability
  - Keyboard accessible (Enter/Space)
  - Focus ring for accessibility

### 4. `EditableActions` (Shared UI Primitive)
- **Location**: `src/shared/ui/components/editable/EditableActions.tsx`
- **Purpose**: Reusable save/cancel buttons
- **Features**:
  - Consistent Check/X icons
  - Loading state support
  - Size variants (default, sm, icon)
  - Disabled state handling

## Composed Components

### `InlineEditableField`
- **Use Case**: Forms, cards, detail views
- **Features**: Labels, badges, blur-to-save, custom inputs
- **Styling**: Spacious, form-oriented

### `EditableTableCell`
- **Use Case**: Table cells
- **Features**: Compact layout, type coercion (text/number), validation
- **Styling**: Dense, table-optimized

## Benefits

1. **Single Source of Truth**: Hover behavior, icons, and keyboard handling in one place
2. **Consistency**: All editable components look and behave identically
3. **Maintainability**: Fix a bug once, applies everywhere
4. **Extensibility**: New components (e.g., `EditableDropdown`) just compose the primitives

## Creating New Editable Components

To create a new editable component (e.g., `EditableDropdown`):

```tsx
import { InlineEditable } from '../editable/InlineEditable';
import { EditableTrigger } from '../editable/EditableTrigger';
import { EditableActions } from '../editable/EditableActions';

export const EditableDropdown = ({ value, options, onSave }) => {
  return (
    <InlineEditable
      value={value}
      onSave={onSave}
      renderDisplay={({ onStartEdit }) => (
        <EditableTrigger onClick={onStartEdit}>
          {value}
        </EditableTrigger>
      )}
      renderEditor={({ value, onChange, onSave, onCancel, isSaving }) => (
        <div className="flex items-center gap-2">
          <Select value={value} onValueChange={onChange}>
            {/* options */}
          </Select>
          <EditableActions 
            onSave={onSave} 
            onCancel={onCancel}
            isSaving={isSaving}
          />
        </div>
      )}
    />
  );
};
```

## Migration Notes

- **Before**: Each component duplicated trigger and action button logic
- **After**: All components share `EditableTrigger` and `EditableActions`
- **Breaking Changes**: None - API remains the same for consuming code
