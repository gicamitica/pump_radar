import { useController, type Control, type FieldValues, type FieldPath } from 'react-hook-form'
import { FieldTime } from '../field/FieldTime'

interface FormFieldTimeProps<TFieldValues extends FieldValues = FieldValues> {
  name: FieldPath<TFieldValues>
  control: Control<TFieldValues>
  label?: string
  description?: string
  required?: boolean
  disabled?: boolean
  isLoading?: boolean
  placeholder?: string
  minuteStep?: number
}

export function FormFieldTime<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  description,
  required,
  disabled,
  isLoading,
  placeholder,
  minuteStep,
}: FormFieldTimeProps<TFieldValues>) {
  const {
    field,
    fieldState,
  } = useController({
    name,
    control,
  })

  return (
    <FieldTime
      id={field.name}
      label={label}
      description={description}
      required={required}
      isLoading={isLoading}
      status={fieldState.error ? 'error' : undefined}
      statusMessage={fieldState.error?.message}
      disabled={disabled}
      value={field.value}
      onChange={field.onChange}
      placeholder={placeholder}
      minuteStep={minuteStep}
    />
  )
}
