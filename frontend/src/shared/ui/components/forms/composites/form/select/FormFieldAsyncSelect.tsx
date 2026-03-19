import { useController, type Control, type FieldValues, type FieldPath } from 'react-hook-form'
import { FieldAsyncSelect, type FieldAsyncSelectProps } from '../../field/select/FieldAsyncSelect'

type OmittedProps = 'value' | 'onChange' | 'name' | 'error' | 'id'
interface FormFieldAsyncSelectProps<TFieldValues extends FieldValues = FieldValues, T = string> 
  extends Omit<FieldAsyncSelectProps<T>, OmittedProps> {
  /** RHF */
  name: FieldPath<TFieldValues>
  control: Control<TFieldValues>
}

export function FormFieldAsyncSelect<TFieldValues extends FieldValues, T = string>({
  name,
  control,
  ...props
}: FormFieldAsyncSelectProps<TFieldValues, T>) {
  const {
    field,
    fieldState,
  } = useController({
    name,
    control,
  })

  return (
    <FieldAsyncSelect
      {...props}
      id={field.name}
      name={field.name}
      value={field.value}
      onChange={field.onChange}
      error={fieldState.error?.message}
    />
  )
}
