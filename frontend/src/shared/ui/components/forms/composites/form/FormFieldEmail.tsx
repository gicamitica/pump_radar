import * as React from 'react'
import { useController, type Control, type FieldValues, type FieldPath } from 'react-hook-form'
import FieldText from '../field/FieldText'
import { Mail } from 'lucide-react'

interface FormFieldEmailProps<TFieldValues extends FieldValues = FieldValues> {
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

  /** Email specific */
  placeholder?: string
  icon?: React.ReactNode
}

export function FormFieldEmail<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  description,
  required,
  disabled,
  isLoading,
  placeholder,
  icon = <Mail className="h-4 w-4" />,
}: FormFieldEmailProps<TFieldValues>) {
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
      type="email"
      value={field.value ?? ''}
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
      icon={icon}
    />
  )
}
