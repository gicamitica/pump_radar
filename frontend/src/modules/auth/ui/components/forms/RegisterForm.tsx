import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import FieldEmail from '../../../../../shared/ui/components/forms/composites/field/FieldEmail';
import { FieldPassword } from '@/components/forms/composites/field';
import ActionButton from '@/components/forms/buttons/ActionButton';

const schema = z.object({ email: z.string().email(), password: z.string().min(8), displayName: z.string().min(2) });

type Values = z.infer<typeof schema>;

const RegisterForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (_: Values) => { await new Promise(r => setTimeout(r, 500)); onSuccess?.(); };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <FieldEmail {...register('email')} />
        {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Display name</label>
        <input className="w-full rounded-lg border px-3 h-10" {...register('displayName')} />
        {errors.displayName && <p className="text-red-600 text-xs mt-1">{errors.displayName.message}</p>}
      </div>
      <div>
        <FieldPassword {...register('password')} />
        {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>}
      </div>
      <ActionButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating…' : 'Create account'}
      </ActionButton>
    </form>
  );
};

export default RegisterForm;
