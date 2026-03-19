import { useController, type Control, type Path, type FieldValues } from 'react-hook-form'
import { FieldSwitchGroup, type FieldSwitchGroupProps } from '../field/FieldSwitchGroup'

interface FormFieldSwitchGroupProps<TFieldValues extends FieldValues = FieldValues, T = string> 
  extends Omit<FieldSwitchGroupProps<T>, 'value' | 'onChange' | 'status' | 'statusMessage' | 'id'> {
  
  name: Path<TFieldValues>
  control: Control<TFieldValues>
}

/**
 * FormFieldSwitchGroup - React Hook Form orchestrator for a group of interactive switches.
 */
export function FormFieldSwitchGroup<TFieldValues extends FieldValues, T = string>({
  name,
  control,
  label,
  description,
  required,
  options,
  columns,
  disabled,
  isLoading,
}: FormFieldSwitchGroupProps<TFieldValues, T>) {
  
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
    <FieldSwitchGroup<T>
      id={field.name}
      label={label}
      description={description}
      required={required}
      
      value={field.value || []}
      onChange={field.onChange}
      
      options={options}
      columns={columns}
      
      disabled={disabled}
      isLoading={isLoading}
      
      status={status}
      statusMessage={statusMessage}
    />
  )
}
