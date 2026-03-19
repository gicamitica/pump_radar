import { useController, type Control, type Path, type FieldValues } from 'react-hook-form'
import { FieldRadioGroup, type FieldRadioGroupProps } from '../field/FieldRadioGroup'


// Extract T from FieldRadioGroupProps or define new generic?
// Since FieldRadioGroup is generic <T>, FormFieldRadioGroup should be too.

interface FormFieldRadioGroupProps<TFieldValues extends FieldValues = FieldValues, T = string> 
  extends Omit<FieldRadioGroupProps<T>, 'name' | 'value' | 'onChange' | 'status' | 'statusMessage' | 'id'> {
  
  name: Path<TFieldValues>
  control: Control<TFieldValues>
}

export function FormFieldRadioGroup<TFieldValues extends FieldValues, T = string>({
  name,
  control,
  label,
  description,
  required,
  options,
  variant,
  alignment,
  contentAlign,
  mediaPosition,
  disabled,
  isLoading,
  renderOption,
}: FormFieldRadioGroupProps<TFieldValues, T>) {
  
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
    <FieldRadioGroup<T>
      id={field.name}
      label={label}
      description={description}
      required={required}
      
      value={field.value}
      onChange={field.onChange}
      
      options={options}
      variant={variant}
      alignment={alignment}
      contentAlign={contentAlign}
      mediaPosition={mediaPosition}
      
      disabled={disabled}
      isLoading={isLoading}
      renderOption={renderOption} // Allow custom render even in RHF
      
      status={status}
      statusMessage={statusMessage}
    />
  )
}
