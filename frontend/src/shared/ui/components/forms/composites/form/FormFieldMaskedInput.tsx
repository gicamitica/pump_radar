import { useController, type Control, type FieldValues, type FieldPath } from 'react-hook-form'
import FieldMaskedInput, { type FieldMaskedInputProps } from '../field/FieldMaskedInput'

type OmittedProps = 'value' | 'onChange' | 'onAccept' | 'id' | 'status' | 'statusMessage'
interface FormFieldMaskedInputProps<TFieldValues extends FieldValues = FieldValues> 
  extends Omit<FieldMaskedInputProps, OmittedProps> {
  /** RHF */
  name: FieldPath<TFieldValues>
  control: Control<TFieldValues>
}

export function FormFieldMaskedInput<TFieldValues extends FieldValues>({
  name,
  control,
  ...props
}: FormFieldMaskedInputProps<TFieldValues>) {
  const {
    field,
    fieldState,
  } = useController({
    name,
    control,
  })

  // Helper to map RHF errors to our FieldStatus
  const status = fieldState.error ? 'error' : undefined
  const statusMessage = fieldState.error?.message

  return (
    <FieldMaskedInput
      {...props}
      id={field.name}
      // RHF sends string usually, but mask hooks might deal with weird types. 
      // FieldMaskedInput expects string.
      // useController default value might be undefined/null.
      value={field.value as string} 
      onChange={field.onChange}
      status={status}
      statusMessage={statusMessage}
      onBlur={field.onBlur}
    />
  )
}
