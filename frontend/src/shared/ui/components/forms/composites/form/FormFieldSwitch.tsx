import type { ReactNode } from 'react'
import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { FieldSwitch } from '../field/FieldSwitch'

interface FormFieldSwitchProps<TFieldValues extends FieldValues = FieldValues> {
  /** RHF */
  name: FieldPath<TFieldValues>
  control: Control<TFieldValues>

  /** Field chrome */
  label?: string
  description?: string
  required?: boolean

  /** Switch content */
  children: ReactNode

  /** State */
  disabled?: boolean
}

/**
 * FormFieldSwitch - React Hook Form orchestrator for a single boolean switch.
 */
export function FormFieldSwitch<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  description,
  required,
  children,
  disabled,
}: FormFieldSwitchProps<TFieldValues>) {
  const {
    field,
    fieldState,
  } = useController({
    name,
    control,
  })

  const status = fieldState.error ? 'error' : undefined
  const statusMessage = fieldState.error?.message

  return (
    <FieldSwitch
      id={field.name}
      label={label}
      description={description}
      required={required}
      checked={field.value}
      onCheckedChange={field.onChange}
      disabled={disabled}
      status={status}
      statusMessage={statusMessage}
    >
      {children}
    </FieldSwitch>
  )
}
