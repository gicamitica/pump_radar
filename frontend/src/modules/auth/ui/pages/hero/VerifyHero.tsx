import React from 'react';
import LayoutHero from '../../layouts/LayoutHero';
import VerifyEmailForm from '../../components/forms/VerifyEmailForm';
import FormHeader from '../../../../../shared/ui/components/forms/layout/FormHeader';
import { nextLink } from '../../components/navLinks';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Hero from '../../layouts/Hero';

const VerifyHero: React.FC = () => {
  const link = nextLink('verify','hero');
  const { t } = useTranslation('auth');
  return (
    <LayoutHero
      header={<FormHeader title={t('verifyEmail.title','Verify your email')} />}
      hero={<Hero />}
      footer={<span><Link className="text-blue-600" to={link.to}>{t('backLogin','Back to login')}</Link></span>}
    >
      <VerifyEmailForm />
    </LayoutHero>
  );
};

export default VerifyHero;
