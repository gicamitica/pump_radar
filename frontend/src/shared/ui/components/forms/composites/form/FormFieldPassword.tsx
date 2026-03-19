import { useController, type Control, type FieldValues, type FieldPath } from 'react-hook-form'
import FieldPassword from '../field/FieldPassword'

interface FormFieldPasswordProps<TFieldValues extends FieldValues = FieldValues> {
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

  /** Password specific */
  placeholder?: string
  showStrengthMeter?: boolean
}

export function FormFieldPassword<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  description,
  required,
  disabled,
  isLoading,
  placeholder,
  showStrengthMeter,
}: FormFieldPasswordProps<TFieldValues>) {
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
    <FieldPassword
      id={field.name}
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
      showStrengthMeter={showStrengthMeter}
    />
  )
}
