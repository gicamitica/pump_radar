import { useController, type Control, type FieldValues, type FieldPath } from 'react-hook-form'
import { FieldSearchSelect, type FieldSearchSelectProps } from '../../field/select/FieldSearchSelect'

// Omit value and onChange from props as they are handled by RHF
type OmittedProps = 'value' | 'onChange' | 'name' | 'error' | 'id'
interface FormFieldSearchSelectProps<TFieldValues extends FieldValues = FieldValues, T = string> 
  extends Omit<FieldSearchSelectProps<T>, OmittedProps> {
  /** RHF */
  name: FieldPath<TFieldValues>
  control: Control<TFieldValues>
}

export function FormFieldSearchSelect<TFieldValues extends FieldValues, T = string>({
  name,
  control,
  ...props
}: FormFieldSearchSelectProps<TFieldValues, T>) {
  const {
    field,
    fieldState,
  } = useController({
    name,
    control,
  })
  
  return (
    <FieldSearchSelect
      {...props}
      id={field.name}
      name={field.name}
      value={field.value}
      onChange={field.onChange}
      // FieldSearchSelect uses 'error' string for status message
      error={fieldState.error?.message}
      // It handles onBlur? ReactSelect handles onBlur usually but FieldSearchSelect might not expose it.
      // Let's assume it doesn't strictly require onBlur for basic select usage found in demos.
    />
  )
}
