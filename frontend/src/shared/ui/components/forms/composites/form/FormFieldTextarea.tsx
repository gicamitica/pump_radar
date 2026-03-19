import { useController, type Control, type FieldValues, type FieldPath } from 'react-hook-form'
import FieldTextarea from '../field/FieldTextarea'

interface FormFieldTextareaProps<TFieldValues extends FieldValues = FieldValues> {
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

  /** Textarea specific */
  placeholder?: string
  rows?: number
  className?: string
}

export function FormFieldTextarea<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  description,
  required,
  disabled,
  isLoading,
  placeholder,
  rows,
  className,
}: FormFieldTextareaProps<TFieldValues>) {
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
    <FieldTextarea
      id={field.name}
      value={field.value ?? ''}
      onChange={field.onChange}
      onBlur={field.onBlur}
      disabled={disabled}
      label={label}
      description={description}
      isRequired={required} // Note: FieldTextarea uses isRequired prop name
      isLoading={isLoading}
      status={status}
      statusMessage={statusMessage}
      placeholder={placeholder}
      rows={rows}
      className={className}
    />
  )
}
