import React, { useId } from 'react';
import ReactSelect, { type OnChangeValue } from 'react-select';
import type { SelectOption } from './types';
import { getSelectClassNames } from './styles';
import { FieldLayout } from '../../../core/FieldLayout';

export interface FieldMultiSelectProps<T = string> {
  value?: T[];
  onChange?: (value: T[]) => void;

  options: SelectOption<T>[];
  placeholder?: string;

  label?: string;
  helperText?: string;
  error?: string;

  disabled?: boolean;
  isLoading?: boolean;
  required?: boolean;
  
  name?: string;
  id?: string;
}

export function FieldMultiSelect<T = string>({
  value = [],
  onChange,
  options,
  placeholder = "Select...",
  label,
  helperText,
  error,
  disabled,
  isLoading,
  required,
  name,
  id,
}: FieldMultiSelectProps<T>) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  // Map primitive values to option objects
  // Defensive: Ensure value is an array before filtering
  const selectedOptions = React.useMemo(() => {
    if (!Array.isArray(value)) return [];
    return options.filter(o => value.includes(o.value));
  }, [options, value]);

  const handleChange = (newValue: OnChangeValue<SelectOption<T>, true>) => {
    // MultiValue is an array of options
    const options = newValue as SelectOption<T>[];
    onChange?.(options.map(o => o.value));
  };

  return (
    <FieldLayout
      id={selectId}
      label={label}
      description={helperText}
      status={error ? 'error' : 'default'}
      statusMessage={error}
      required={required}
      isLoading={isLoading}
    >
      <ReactSelect<SelectOption<T>, true>
        inputId={selectId}
        name={name}
        isMulti
        value={selectedOptions}
        onChange={handleChange}
        options={options}
        placeholder={placeholder}
        isDisabled={disabled}
        isLoading={isLoading}
        unstyled
        classNames={getSelectClassNames(error) as any}
      />
    </FieldLayout>
  );
}
