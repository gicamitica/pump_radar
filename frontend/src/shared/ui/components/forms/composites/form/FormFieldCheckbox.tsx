import * as React from 'react'
import { useController, type Control, type FieldValues, type FieldPath } from 'react-hook-form'
import FieldCheckbox from '../field/FieldCheckbox'

interface FormFieldCheckboxProps<TFieldValues extends FieldValues = FieldValues> {
  /** RHF */
  name: FieldPath<TFieldValues>
  control: Control<TFieldValues>

  /** Checkbox content */
  children: React.ReactNode

  /** Field chrome (some might not be applicable or passed to FieldCheckbox logic) */
  successIcon?: React.ReactNode
  warningIcon?: React.ReactNode
  errorIcon?: React.ReactNode
  required?: boolean

  /** State */
  disabled?: boolean
}

export function FormFieldCheckbox<TFieldValues extends FieldValues>({
  name,
  control,
  children,
  successIcon,
  warningIcon,
  errorIcon,
  required,
  disabled,
}: FormFieldCheckboxProps<TFieldValues>) {
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
    <FieldCheckbox
      checked={field.value}
      onCheckedChange={field.onChange}
      disabled={disabled}
      status={status}
      statusMessage={statusMessage}
      successIcon={successIcon}
      warningIcon={warningIcon}
      errorIcon={errorIcon}
      isRequired={required}
      name={field.name}
      // Cannot pass onBlur to Radix checkbox easily via FieldCheckbox props spread? 
      // FieldCheckbox spreads ...rest to Checkbox.
      // Checkbox from shadcn/ui spreads to CheckboxPrimitive.
      // CheckboxPrimitive supports onBlur? Yes.
      onBlur={field.onBlur}
    >
      {children}
    </FieldCheckbox>
  )
}
