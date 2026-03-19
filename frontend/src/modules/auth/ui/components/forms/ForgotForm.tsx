import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import FieldEmail from '../../../../../shared/ui/components/forms/composites/field/FieldEmail';
import ActionButton from '@/components/forms/buttons/ActionButton';

const schema = z.object({ email: z.string().email() });

type Values = z.infer<typeof schema>;

const ForgotForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (_: Values) => { await new Promise(r => setTimeout(r, 500)); onSuccess?.(); };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <FieldEmail {...register('email')} />
        {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
      </div>
      <ActionButton type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Sending…' : 'Send reset link'}
      </ActionButton>
    </form>
  );
};

export default ForgotForm;
