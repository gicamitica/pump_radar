import { useController, type Control, type FieldValues, type FieldPath } from 'react-hook-form'
import { FieldDate } from '../field/FieldDate'

interface FormFieldDateProps<TFieldValues extends FieldValues = FieldValues> {
  name: FieldPath<TFieldValues>
  control: Control<TFieldValues>
  label?: string
  description?: string
  required?: boolean
  disabled?: boolean
  isLoading?: boolean
  placeholder?: string
}

export function FormFieldDate<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  description,
  required,
  disabled,
  isLoading,
  placeholder,
}: FormFieldDateProps<TFieldValues>) {
  const {
    field,
    fieldState,
  } = useController({
    name,
    control,
  })

  return (
    <FieldDate
      id={field.name}
      label={label}
      description={description}
      required={required}
      isLoading={isLoading}
      status={fieldState.error ? 'error' : undefined}
      statusMessage={fieldState.error?.message}
      disabled={disabled}
      // Assuming RHF value is Date object
      value={field.value}
      onChange={field.onChange}
      placeholder={placeholder}
    />
  )
}
