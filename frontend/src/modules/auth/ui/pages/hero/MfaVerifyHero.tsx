import React from 'react';
import LayoutHero from '../../layouts/LayoutHero';
import MfaVerifyForm from '../../components/forms/MfaVerifyForm';
import FormHeader from '../../../../../shared/ui/components/forms/layout/FormHeader';
import { nextLink } from '../../components/navLinks';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Hero from '../../layouts/Hero';

const MfaVerifyHero: React.FC = () => {
  const link = nextLink('mfaVerify','hero');
  const { t } = useTranslation('auth');
  return (
    <LayoutHero
      header={<FormHeader title={t('mfa.verify.title','Enter verification code')} />}
      hero={<Hero />}
      footer={<span><Link className="text-blue-600" to={link.to}>{t('backLogin','Back to login')}</Link></span>}
    >
      <MfaVerifyForm />
    </LayoutHero>
  );
};

export default MfaVerifyHero;
