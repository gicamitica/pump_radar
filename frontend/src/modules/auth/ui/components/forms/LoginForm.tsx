import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import FieldEmail from '../../../../../shared/ui/components/forms/composites/field/FieldEmail';
import { FieldPassword } from '@/components/forms/composites/field';
import FieldCheckbox from '../../../../../shared/ui/components/forms/composites/field/FieldCheckbox';
import ActionButton from '@/components/forms/buttons/ActionButton';
import { useService } from '@/app/providers/useDI';
import { useTranslation } from 'react-i18next';
import { AUTH_SYMBOLS } from '@/modules/auth/di/symbols';
import { CORE_SYMBOLS } from '@/core/di/symbols';
import type { IAuthService } from '@/modules/auth/application/ports/IAuthService';
import type { ILogger } from '@/shared/utils/Logger';

const schema = z.object({ 
  email: z.email('Please enter a valid email'), 
  password: z.string().min(1, 'Password is required'), 
  remember: z.boolean().optional() 
});

type Values = z.infer<typeof schema>;

interface Props {
  onSuccess?: () => void;
  forgotUrl?: string;
}

const LoginForm: React.FC<Props> = ({ onSuccess, forgotUrl }) => {
  const auth = useService<IAuthService>(AUTH_SYMBOLS.IAuthService);
  const logger = useService<ILogger>(CORE_SYMBOLS.ILogger);
  const [error, setError] = useState<string | null>(null);
  
  const { t } = useTranslation('auth');
  
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<Values>({ 
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  });

  const onSubmit = async (values: Values) => {
    try {
      setError(null);
      logger.info('Login form submitted', { email: values.email });
      
      await auth.login(values);
      
      logger.info('Login successful, redirecting...');
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      logger.error('Login failed', err);
      const message = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <div>
        <FieldEmail 
          placeholder={t('emailDescription')} 
          id='email'
          {...register('email')}
          status={errors.email ? 'error' : undefined}
          statusMessage={errors.email ? errors.email.message : undefined}
        />
      </div>
      
      <div>
        <FieldPassword 
          autoComplete='password'
          placeholder={t('passwordDescription')}
          {...register('password')} 
          status={errors.password ? 'error' : undefined}
          statusMessage={errors.password ? errors.password.message : undefined}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <Controller
          name="remember"
          control={control}
          render={({ field }) => (
            <FieldCheckbox
              checked={!!field.value}
              onCheckedChange={(v) => field.onChange(v === true)}
            >
              {t('remember')}
            </FieldCheckbox>
          )}
        />

        {forgotUrl && (
          <Link className="text-xs text-blue-600 dark:text-blue-500" to={forgotUrl}>
            {t('forgot')}
          </Link>
        )}
      </div>
      
      <ActionButton type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t('signingIn') : t('signIn')}
      </ActionButton>
    </form>
  );
};

export default LoginForm;
