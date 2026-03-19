import { useController, type Control, type FieldValues, type FieldPath } from 'react-hook-form'
import { FieldMultiSelect, type FieldMultiSelectProps } from '../../field/select/FieldMultiSelect'

type OmittedProps = 'value' | 'onChange' | 'name' | 'error' | 'id'
interface FormFieldMultiSelectProps<TFieldValues extends FieldValues = FieldValues, T = string> 
  extends Omit<FieldMultiSelectProps<T>, OmittedProps> {
  /** RHF */
  name: FieldPath<TFieldValues>
  control: Control<TFieldValues>
}

export function FormFieldMultiSelect<TFieldValues extends FieldValues, T = string>({
  name,
  control,
  ...props
}: FormFieldMultiSelectProps<TFieldValues, T>) {
  const {
    field,
    fieldState,
  } = useController({
    name,
    control,
  })

  return (
    <FieldMultiSelect
      {...props}
      id={field.name}
      name={field.name}
      value={field.value}
      onChange={field.onChange}
      error={fieldState.error?.message}
    />
  )
}
