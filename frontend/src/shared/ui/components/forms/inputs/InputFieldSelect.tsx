import * as React from 'react'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from '@/shared/ui/shadcn/components/ui/select'

interface InputFieldSelectProps {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  children: React.ReactNode
}

export function InputFieldSelect({
  value,
  defaultValue,
  onChange,
  placeholder,
  disabled,
  children,
}: InputFieldSelectProps) {
  return (
    <Select
      value={value}
      defaultValue={defaultValue}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger className='w-full'>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>

      <SelectContent>
        {children}
      </SelectContent>
    </Select>
  )
}
