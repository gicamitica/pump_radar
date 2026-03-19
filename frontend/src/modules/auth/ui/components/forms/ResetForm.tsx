import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FieldPassword } from '@/components/forms/composites/field';
import ActionButton from '@/components/forms/buttons/ActionButton';

const schema = z.object({ password: z.string().min(8) });

type Values = z.infer<typeof schema>;

const ResetForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (_: Values) => { await new Promise(r => setTimeout(r, 500)); onSuccess?.(); };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <FieldPassword {...register('password')} />
        {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>}
      </div>
      <ActionButton type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Resetting…' : 'Reset password'}
      </ActionButton>
    </form>
  );
};

export default ResetForm;
