import React from 'react';
import LayoutHero from '../../layouts/LayoutHero';
import LoginForm from '../../components/forms/LoginForm';
import OauthButtons from '../../components/OauthButtons';
import FormHeader from '../../../../../shared/ui/components/forms/layout/FormHeader';
import { nextLink } from '../../components/navLinks';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AUTH_PATHS_HERO } from '../../routes/paths';
import Hero from '../../layouts/Hero';

const LoginHero: React.FC = () => {
  const link = nextLink('login','hero');
  const { t } = useTranslation('auth');

  return (
    <LayoutHero
      header={<FormHeader title={t('title.login','Welcome back')} subtitle={t('subtitle.login','Please login to continue to your account.')} />}
      hero={<Hero />}
      footer={<span>Don’t have an account? <Link className="text-blue-600" to={link.to}>{t('createOne','Create one')}</Link></span>}
    >
      <LoginForm forgotUrl={AUTH_PATHS_HERO.FORGOT_PASSWORD_HERO} />
      <OauthButtons />
    </LayoutHero>
  );
};

export default LoginHero;
