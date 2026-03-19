// FormField.tsx
import * as React from 'react'
import { useController, type FieldValues, type Control, type FieldPath } from 'react-hook-form'
import { FieldLayout } from '../core/FieldLayout'

type FormFieldInputProps<T> = {
  id: string
  value: T
  onChange: (value: T) => void
  onBlur?: () => void
  disabled?: boolean
}

interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TValue = any
> {
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

  /** Input adapter */
  component: React.ComponentType<FormFieldInputProps<TValue> & any>

  /** Props forwarded to the input adapter */
  componentProps?: Record<string, any>

  /** Children passed to input adapter (SelectItem, etc.) */
  children?: React.ReactNode

  /** Class name passed to FieldLayout */
  className?: string
}

export function FormField<
  TFieldValues extends FieldValues,
  TValue
>({
  name,
  control,
  label,
  description,
  required,
  disabled,
  isLoading,
  component: Component,
  componentProps,
  children,
  className,
}: FormFieldProps<TFieldValues, TValue>) {
  const {
    field,
    fieldState,
  } = useController({
    name,
    control,
  })

  const status =
    fieldState.error ? 'error' : undefined

  return (
    <FieldLayout
      label={label}
      description={description}
      required={required}
      isLoading={isLoading}
      status={status}
      statusMessage={fieldState.error?.message}
      className={className}
    >
      <Component
        {...componentProps}
        id={field.name}
        value={field.value}
        onChange={field.onChange}
        onBlur={field.onBlur}
        disabled={disabled}
      >
        {children}
      </Component>
    </FieldLayout>
  )
}
