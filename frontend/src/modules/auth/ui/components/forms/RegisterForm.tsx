import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useService } from '@/app/providers/useDI';
import { AUTH_SYMBOLS } from '@/modules/auth/di/symbols';
import { CORE_SYMBOLS } from '@/core/di/symbols';
import type { IAuthService } from '@/modules/auth/application/ports/IAuthService';
import type { ILogger } from '@/shared/infrastructure/logging/ILogger';
import FieldEmail from '../../../../../shared/ui/components/forms/composites/field/FieldEmail';
import { FieldPassword } from '@/components/forms/composites/field';
import ActionButton from '@/components/forms/buttons/ActionButton';

const schema = z.object({
  email: z.string().email('Email invalid'),
  name: z.string().min(2, 'Minim 2 caractere'),
  password: z.string().min(8, 'Minim 8 caractere'),
});

type Values = z.infer<typeof schema>;

const RegisterForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const auth = useService<IAuthService>(AUTH_SYMBOLS.IAuthService);
  const logger = useService<ILogger>(CORE_SYMBOLS.ILogger);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: Values) => {
    try {
      setError(null);
      logger.info('Register form submitted', { email: values.email });
      await auth.register({ email: values.email, password: values.password, name: values.name });
      logger.info('Registration successful');
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      logger.error('Registration failed', err);
      const msg = err instanceof Error ? err.message : 'Înregistrare eșuată. Încearcă din nou.';
      setError(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-testid="register-form">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      <div>
        <FieldEmail
          placeholder="adresa@email.com"
          id="email"
          {...register('email')}
          status={errors.email ? 'error' : undefined}
          statusMessage={errors.email?.message}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Nume complet</label>
        <input
          className="w-full rounded-lg border border-input bg-background px-3 h-10 text-sm"
          placeholder="Numele tău"
          data-testid="register-name-input"
          {...register('name')}
        />
        {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <FieldPassword
          autoComplete="new-password"
          placeholder="Minim 8 caractere"
          {...register('password')}
          status={errors.password ? 'error' : undefined}
          statusMessage={errors.password?.message}
        />
      </div>
      <ActionButton type="submit" disabled={isSubmitting} data-testid="register-submit-btn">
        {isSubmitting ? 'Se creează contul…' : 'Creează cont'}
      </ActionButton>
    </form>
  );
};

export default RegisterForm;
