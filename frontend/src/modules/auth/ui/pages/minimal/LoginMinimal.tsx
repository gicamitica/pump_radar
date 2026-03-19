import React from 'react';
import LayoutMinimal from '../../layouts/LayoutMinimal';
import OauthButtons from '../../components/OauthButtons';
import FormHeader from '../../../../../shared/ui/components/forms/layout/FormHeader';
import FormDivider from '../../../../../shared/ui/components/forms/layout/FormDivider';
import { nextLink } from '../../components/navLinks';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LoginForm from '../../components/forms/LoginForm';

const LoginMinimal: React.FC = () => {
  const link = nextLink('login','minimal');
  const { t } = useTranslation('auth');

  return (
    <LayoutMinimal
      header={<FormHeader title={t('title.login','Welcome back')} subtitle={t('subtitle.login','Please login to continue to your account.')} />}
      footer={<span>Don’t have an account? <Link className="text-blue-600 dark:text-blue-500" to={link.to}>{t('createOne','Create one')}</Link></span>}
    >
      <LoginForm /> 
      <FormDivider />

      <OauthButtons />
    </LayoutMinimal>
  );
};

export default LoginMinimal;
