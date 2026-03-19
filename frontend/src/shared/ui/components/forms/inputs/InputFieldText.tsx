import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/shared/ui/shadcn/components/ui/input';
import { cn } from '@/shadcn/lib/utils';

const InputFieldText = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, name, ...rest }, ref) => {
  const ctx = useFormContext();
  const registerProps = name && ctx?.register ? ctx.register(name as string) : {};
  return (
    <Input
      ref={ref}
      name={name}
      className={cn('rounded-lg', className)}
      {...registerProps}
      {...rest}
    />
  );
});
InputFieldText.displayName = 'InputFieldText';

export default InputFieldText;
