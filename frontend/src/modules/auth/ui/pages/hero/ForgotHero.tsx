import React from 'react';
import LayoutHero from '../../layouts/LayoutHero';
import ForgotForm from '../../components/forms/ForgotForm';
import FormHeader from '../../../../../shared/ui/components/forms/layout/FormHeader';
import { nextLink } from '../../components/navLinks';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Hero from '../../layouts/Hero';

const ForgotHero: React.FC = () => {
  const link = nextLink('forgot','hero');
  const { t } = useTranslation('auth');
  return (
    <LayoutHero
      header={<FormHeader title={t('forgot.title','Forgot your password?')} subtitle={t('forgot.subtitle','Enter your email to receive a reset link.')} />}
      hero={<Hero />}
      footer={<span><Link className="text-blue-600" to={link.to}>{t('backLogin','Back to login')}</Link></span>}
    >
      <ForgotForm />
    </LayoutHero>
  );
};

export default ForgotHero;
