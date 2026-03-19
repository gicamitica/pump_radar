
import { InputFieldRadioGroup, type InputFieldRadioGroupProps } from '../../inputs/InputFieldRadioGroup'
import { FieldLayout } from '../../core/FieldLayout'

export interface FieldRadioGroupProps<T = string> extends 
  Omit<InputFieldRadioGroupProps<T>, 'hasError' | 'id'> {
  // Field chrome
  label?: string
  description?: string
  required?: boolean
  
  // State
  status?: 'default' | 'success' | 'warning' | 'error'
  statusMessage?: string
  isLoading?: boolean
  
  id?: string
}

export function FieldRadioGroup<T = string>({
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
  variant,
  alignment,
  contentAlign,
  mediaPosition,
  disabled,
  renderOption,
  columns,
}: FieldRadioGroupProps<T>) {


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
      <InputFieldRadioGroup
        id={id}
        value={value}
        onChange={onChange}
        options={options}
        variant={variant}
        alignment={alignment}
        contentAlign={contentAlign}
        mediaPosition={mediaPosition}
        disabled={disabled}
        renderOption={renderOption}
        columns={columns}
        hasError={status === 'error'}

      />
    </FieldLayout>
  )
}

export default FieldRadioGroup
