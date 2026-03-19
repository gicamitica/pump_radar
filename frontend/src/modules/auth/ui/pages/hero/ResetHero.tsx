import React from 'react';
import LayoutHero from '../../layouts/LayoutHero';
import ResetForm from '../../components/forms/ResetForm';
import FormHeader from '../../../../../shared/ui/components/forms/layout/FormHeader';
import { nextLink } from '../../components/navLinks';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Hero from '../../layouts/Hero';

const ResetHero: React.FC = () => {
  const link = nextLink('reset','hero');
  const { t } = useTranslation('auth');
  return (
    <LayoutHero
      header={<FormHeader title={t('reset.title','Reset your password')} />}
      hero={<Hero />}
      footer={<span><Link className="text-blue-600" to={link.to}>{t('backLogin','Back to login')}</Link></span>}
    >
      <ResetForm />
    </LayoutHero>
  );
};

export default ResetHero;
