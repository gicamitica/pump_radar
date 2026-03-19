import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import ActionButton from '@/components/forms/buttons/ActionButton';

const schema = z.object({ code: z.string().min(6).max(6) });

type Values = z.infer<typeof schema>;

const MfaVerifyForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) });
  const onSubmit = async (_: Values) => { await new Promise(r => setTimeout(r, 500)); onSuccess?.(); };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">TOTP</label>
        <input className="w-full rounded-lg border px-3 h-10" placeholder="123456" {...register('code')} />
        {errors.code && <p className="text-red-600 text-xs mt-1">{errors.code.message}</p>}
      </div>
      <ActionButton type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Verifying…' : 'Continue'}</ActionButton>
    </form>
  );
};

export default MfaVerifyForm;
