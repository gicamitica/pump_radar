import React, { useId, useState, useEffect } from 'react';
import AsyncSelect from 'react-select/async';
import { type OnChangeValue } from 'react-select';
import type { SelectOption } from './types';
import { getSelectClassNames } from './styles';
import { FieldLayout } from '../../../core/FieldLayout';

export interface FieldAsyncSelectProps<T = string> {
  value?: T;
  onChange?: (value: T | undefined) => void;

  /**
   * Function to load options based on input.
   * MUST return an array of SelectOption<T>.
   * Do NOT return raw API models.
   */
  loadOptions: (inputValue: string) => Promise<SelectOption<T>[]>;

  /**
   * Optional function to resolve a value to an option object.
   * Used when editing a form with a pre-existing value that hasn't been loaded via loadOptions.
   */
  resolveValue?: (value: T) => Promise<SelectOption<T>>;

  defaultOptions?: boolean | SelectOption<T>[];
  
  placeholder?: string;
  label?: string;
  helperText?: string;
  error?: string;

  debounceMs?: number; 
  
  disabled?: boolean;
  isLoading?: boolean;
  required?: boolean;
  isClearable?: boolean;
  
  name?: string;
  id?: string;
}

export function FieldAsyncSelect<T = string>({
  value,
  onChange,
  loadOptions,
  resolveValue,
  defaultOptions = true,
  placeholder = "Search...",
  label,
  helperText,
  error,
  debounceMs = 300,
  disabled,
  isLoading,
  required,
  isClearable = true,
  name,
  id,
}: FieldAsyncSelectProps<T>) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  
  const [internalOptions, setInternalOptions] = useState<SelectOption<T>[]>([]);
  const [selectedOption, setSelectedOption] = useState<SelectOption<T> | null>(null);

  // Update selected option when value changes or options are updated
  useEffect(() => {
    if (value === undefined || value === null) {
      setSelectedOption(null);
      return;
    }

    // Try to find in internal cache
    const found = internalOptions.find(o => o.value === value);
    if (found) {
      setSelectedOption(found);
      return;
    } 
    
    // If not found, and we resolveValue is provided, try to resolve it
    if (resolveValue) {
      resolveValue(value).then(option => {
        setInternalOptions(prev => {
          if (prev.some(o => o.value === option.value)) return prev;
          return [...prev, option];
        });
        setSelectedOption(option);
      });
    }
    // Fallback? If we have a previous selectedOption that matches, keep it.
    // This handles cases where options might be re-fetched but we want to keep the current selection visible if valid.
    else if (selectedOption && selectedOption.value === value) {
       // Keep existing
    }
  }, [value, internalOptions, resolveValue, selectedOption]);

  // Debounced version
  // We use useMemo to ensure the debounced function reference is stable
  const debouncedLoadOptions = React.useCallback(
    (inputValue: string) => {
      return new Promise<SelectOption<T>[]>((resolve) => {
        setTimeout(() => {
          loadOptions(inputValue).then(results => {
            // Side effect: Update internal options cache
            // We must do this to ensure we can select the option later
            setInternalOptions(prev => {
              const newOptions = [...prev];
              results.forEach(r => {
                if (!newOptions.some(existing => existing.value === r.value)) {
                  newOptions.push(r);
                }
              });
              return newOptions;
            });
            
            resolve(results);
          });
        }, debounceMs);
      });
    },
    [loadOptions, debounceMs]
  );

  const handleChange = (option: OnChangeValue<SelectOption<T>, false>) => {
    if (option) {
      // Add to cache immediately to ensure UI consistency
      setInternalOptions(prev => {
        if (!prev.find(o => o.value === option.value)) {
          return [...prev, option];
        }
        return prev;
      });
      setSelectedOption(option);
      onChange?.(option.value);
    } else {
      setSelectedOption(null);
      onChange?.(undefined);
    }
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
      <AsyncSelect<SelectOption<T>, false>
        inputId={selectId}
        name={name}
        cacheOptions
        loadOptions={debouncedLoadOptions}
        defaultOptions={defaultOptions}
        value={selectedOption}
        onChange={handleChange}
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
