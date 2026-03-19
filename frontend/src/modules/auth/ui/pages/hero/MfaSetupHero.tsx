import React from 'react';
import LayoutHero from '../../layouts/LayoutHero';
import MfaSetupForm from '../../components/forms/MfaSetupForm';
import FormHeader from '../../../../../shared/ui/components/forms/layout/FormHeader';
import { nextLink } from '../../components/navLinks';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Hero from '../../layouts/Hero';

const MfaSetupHero: React.FC = () => {
  const link = nextLink('mfaSetup','hero');
  const { t } = useTranslation('auth');
  return (
    <LayoutHero
      header={<FormHeader title={t('mfa.setup.title','Set up 2-Step Verification')} subtitle={t('mfa.setup.subtitle','Scan the QR with your authenticator app and save recovery codes.')} />}
      hero={<Hero />}
      footer={<span><Link className="text-blue-600" to={link.to}>{t('mfa.skip','Skip and verify later')}</Link></span>}
    >
      <MfaSetupForm />
    </LayoutHero>
  );
};

export default MfaSetupHero;
