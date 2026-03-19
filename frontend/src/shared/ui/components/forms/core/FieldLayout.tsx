// import { useId } from 'react' // Not used
import { FieldControl } from '@/components/forms/core/FieldControl'
import { FieldDescription, Field } from '@/shadcn/components/ui/field'
import { cn } from '@/shadcn/lib/utils'
import StyledFieldLabel from './StyledFieldLabel'

export type FieldStatus =
  | 'default'
  | 'success'
  | 'warning'
  | 'error'

interface FieldProps {
  label?: string
  description?: string

  status?: FieldStatus
  statusMessage?: string
  isLoading?: boolean

  required?: boolean

  className?: string
  children: React.ReactNode

  id?: string
}

export function FieldLayout({
  label,
  description,
  status = 'default',
  statusMessage,
  isLoading,
  required,
  id,
  className,
  children,
}: FieldProps) {
  
  return (
    <Field className={cn("field-layout", className)}>
      <StyledFieldLabel htmlFor={id} hasError={status === 'error'} isRequired={required}>
        {label}
      </StyledFieldLabel>

      <FieldControl
        status={status}
        statusMessage={statusMessage}
        isLoading={isLoading}
      >
        {children}
      </FieldControl>

      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  )
}
