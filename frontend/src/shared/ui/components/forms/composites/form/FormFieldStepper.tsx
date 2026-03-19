import { useController, type Control, type FieldValues, type FieldPath } from 'react-hook-form'
import FieldStepper from '../field/FieldStepper'

interface FormFieldStepperProps<TFieldValues extends FieldValues = FieldValues> {
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

  /** Stepper specific */
  min?: number
  max?: number
  step?: number
  presets?: number[]
}

export function FormFieldStepper<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  description,
  required,
  disabled,
  isLoading,
  min,
  max,
  step,
  presets,
}: FormFieldStepperProps<TFieldValues>) {
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
    <FieldStepper
      id={field.name}
      value={field.value ?? 0}
      onChange={field.onChange}
      onBlur={field.onBlur}
      disabled={disabled}
      label={label}
      description={description}
      required={required}
      isLoading={isLoading}
      status={status}
      statusMessage={statusMessage}
      min={min}
      max={max}
      step={step}
      presets={presets}
    />
  )
}

export default FormFieldStepper;
