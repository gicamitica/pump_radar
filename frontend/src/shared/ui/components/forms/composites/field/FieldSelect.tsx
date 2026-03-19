import * as React from 'react'
import { InputFieldSelect } from '@/components/forms/inputs/InputFieldSelect'
import { FieldLayout } from '../../core/FieldLayout'

interface FieldSelectProps {
  label?: string
  description?: string

  status?: 'default' | 'success' | 'warning' | 'error'
  statusMessage?: string
  isLoading?: boolean

  required?: boolean
  disabled?: boolean

  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onValueChange?: (value: string) => void
  placeholder?: string

  children: React.ReactNode
}

export function FieldSelect({
  label,
  description,
  status,
  statusMessage,
  isLoading,
  required,
  disabled,
  value,
  defaultValue,
  onChange,
  onValueChange,
  placeholder,
  children,
}: FieldSelectProps) {
  return (
    <FieldLayout
      label={label}
      description={description}
      required={required}
      isLoading={isLoading}
      status={status}
      statusMessage={statusMessage}
    >
      <InputFieldSelect
        value={value}
        defaultValue={defaultValue}
        onChange={onChange || onValueChange}
        placeholder={placeholder}
        disabled={disabled}
      >
        {children}
      </InputFieldSelect>
    </FieldLayout>
  )
}

export default FieldSelect
