import React, { useId } from 'react';
import ReactSelect, { type OnChangeValue } from 'react-select';
import type { SelectOption } from './types';
import { getSelectClassNames } from './styles';
import { FieldLayout } from '../../../core/FieldLayout';

export interface FieldSearchSelectProps<T = string> {
  value?: T;
  onChange?: (value: T | undefined) => void;

  options: SelectOption<T>[];
  placeholder?: string;

  label?: string;
  helperText?: string;
  error?: string;

  disabled?: boolean;
  isLoading?: boolean;
  required?: boolean;
  isClearable?: boolean;
  
  name?: string;
  id?: string;
}

export function FieldSearchSelect<T = string>({
  value,
  onChange,
  options,
  placeholder = "Select...",
  label,
  helperText,
  error,
  disabled,
  isLoading,
  required,
  isClearable = true,
  name,
  id,
}: FieldSearchSelectProps<T>) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  // Map primitive value to option object
  const selectedOption = React.useMemo(() => {
    return options.find(o => o.value === value) ?? null;
  }, [options, value]);

  const handleChange = (option: OnChangeValue<SelectOption<T>, false>) => {
    onChange?.(option ? option.value : undefined);
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
      <ReactSelect<SelectOption<T>, false>
        inputId={selectId}
        name={name}
        value={selectedOption}
        onChange={handleChange}
        options={options}
        placeholder={placeholder}
        isDisabled={disabled}
        isLoading={isLoading}
        isClearable={isClearable}
        unstyled
        classNames={getSelectClassNames(error) as any}
      />
    </FieldLayout>
  );
}
