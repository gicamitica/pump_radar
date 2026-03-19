import * as React from 'react'
import { useController, type Control, type FieldValues, type FieldPath } from 'react-hook-form'
import FieldText from '../field/FieldText'

interface FormFieldTextProps<TFieldValues extends FieldValues = FieldValues> {
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

  /** Text specific */
  placeholder?: string
  type?: string
  icon?: React.ReactNode
  className?: string
  autoFocus?: boolean
}

export function FormFieldText<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  description,
  required,
  disabled,
  isLoading,
  placeholder,
  type,
  icon,
  className,
  autoFocus,
}: FormFieldTextProps<TFieldValues>) {
  const {
    field,
    fieldState,
  } = useController({
    name,
    control,
  })

  // Helper to map RHF errors to our FieldStatus
  const status = fieldState.error ? 'error' : undefined
  const statusMessage = fieldState.error?.message

  return (
    <FieldText
      id={field.name}
      value={field.value ?? ''} // Ensure controlled input doesn't get undefined
      onChange={field.onChange}
      onBlur={field.onBlur}
      disabled={disabled}
      label={label}
      description={description}
      required={required}
      isLoading={isLoading}
      status={status}
      statusMessage={statusMessage}
      placeholder={placeholder}
      type={type}
      icon={icon}
      className={className}
      autoFocus={autoFocus}
    />
  )
}
