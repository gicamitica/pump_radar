import React from 'react';
import LayoutMinimal from '../../layouts/LayoutMinimal';
import FormHeader from '../../../../../shared/ui/components/forms/layout/FormHeader';
import { nextLink } from '../../components/navLinks';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LoginForm from '../../components/forms/LoginForm';

// PumpRadar Logo Component
const PumpRadarLogo = () => (
  <div className="flex items-center justify-center gap-3 mb-6">
    <img src="/logo-pumpradar.png" alt="PumpRadar" className="w-12 h-12 rounded-xl" />
    <span className="text-2xl font-bold">PumpRadar</span>
  </div>
);

const LoginMinimal: React.FC = () => {
  const link = nextLink('login','minimal');
  const { t } = useTranslation('auth');

  return (
    <LayoutMinimal
      header={
        <>
          <PumpRadarLogo />
          <FormHeader title={t('title.login','Welcome back')} subtitle={t('subtitle.login','Please login to continue to your account.')} />
        </>
      }
      footer={<span>Don't have an account? <Link className="text-blue-600 dark:text-blue-500" to={link.to}>{t('createOne','Create one')}</Link></span>}
    >
      <div className="mb-6 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        Google sign-in is temporarily unavailable. Continue with your email and password.
      </div>
      <LoginForm /> 
    </LayoutMinimal>
  );
};

export default LoginMinimal;
