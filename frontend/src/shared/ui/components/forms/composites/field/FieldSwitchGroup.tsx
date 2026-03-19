import { InputFieldSwitchGroup, type InputFieldSwitchGroupProps } from '../../inputs/InputFieldSwitchGroup'

import { FieldLayout } from '../../core/FieldLayout'

export interface FieldSwitchGroupProps<T = string> extends Omit<InputFieldSwitchGroupProps<T>, 'id'> {
  label?: string
  description?: string
  required?: boolean
  
  status?: 'default' | 'success' | 'warning' | 'error'
  statusMessage?: string
  isLoading?: boolean
  
  id?: string
}

/**
 * FieldSwitchGroup - Composite component that adds label, description and status handling 
 * to the InputFieldSwitchGroup.
 */
export function FieldSwitchGroup<T = string>({
  label,
  description,
  required,
  status = 'default',
  statusMessage,
  isLoading,
  id,
  // Input props
  value,
  onChange,
  options,
  columns,
  disabled,
}: FieldSwitchGroupProps<T>) {
  return (
    <FieldLayout
      id={id}
      label={label}
      description={description}
      required={required}
      isLoading={isLoading}
      status={status}
      statusMessage={statusMessage}
    >
      <InputFieldSwitchGroup<T>
        id={id}
        value={value}
        onChange={onChange}
        options={options}
        columns={columns}
        disabled={disabled}
      />
    </FieldLayout>
  )
}

export default FieldSwitchGroup
