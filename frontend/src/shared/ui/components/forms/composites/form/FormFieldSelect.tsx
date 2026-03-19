import * as React from 'react'
import type { Control, FieldValues, FieldPath } from 'react-hook-form'
import { FormField } from '../../orchestrators/FormField'
import { InputFieldSelect } from '../../inputs/InputFieldSelect'

interface FormFieldSelectProps<TFieldValues extends FieldValues = FieldValues> {
  /** RHF */
  name: FieldPath<TFieldValues>
  control: Control<TFieldValues>

  /** Field chrome */
  label?: string
  description?: string
  required?: boolean

  /** State */
  disabled?: boolean
  isLoading?: boolean

  /** Select-specific */
  placeholder?: string

  /** Select items */
  children: React.ReactNode

  /** Events */
  onChange?: (value: string) => void

  /** Custom styling */
  className?: string
}

/** FormFieldSelect 
 * Wrapper around SelectFieldInput with RHF integration.
 * Use it to create a select field that is connected to RHF. No Controller needed.
 * 
 * @example
 * ```tsx
 * <FormFieldSelect
 *   name="techStack"
 *   control={control}
 *   label="Tech Stack"
 *   placeholder="Select technology..."
 *   required
 *   disabled
 * >
 *   <SelectGroup>
 *     <SelectLabel>Frontend</SelectLabel>
 *     <SelectItem value="react">React</SelectItem>
 *     <SelectItem value="vue">Vue</SelectItem>
 *     <SelectItem value="angular">Angular</SelectItem>
 *   </SelectGroup>
 * </FormFieldSelect>
 * ```
*/
export function FormFieldSelect<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  description,
  required,
  disabled,
  isLoading,
  placeholder,
  onChange,
  children,
  className,
}: FormFieldSelectProps<TFieldValues>) {
  return (
    <FormField
      name={name}
      control={control}
      label={label}
      description={description}
      required={required}
      disabled={disabled}
      isLoading={isLoading}
      className={className}
      component={InputFieldSelect}
      componentProps={{
        placeholder,
        onChange: (value: any) => {
          // This will be called by InputFieldSelect (Select onValueChange)
          // We need to make sure the custom onChange is also called
          if (onChange) onChange(value);
        }
      }}
    >
      {children}
    </FormField>
  )
}
