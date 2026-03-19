import React from 'react';
import LayoutMinimal from '../../layouts/LayoutMinimal';
import MfaSetupForm from '../../components/forms/MfaSetupForm';
import FormHeader from '../../../../../shared/ui/components/forms/layout/FormHeader';
import { nextLink } from '../../components/navLinks';
import { Link } from 'react-router-dom';

const MfaSetupMinimal: React.FC = () => {
  const link = nextLink('mfaSetup','minimal');
  return (
    <LayoutMinimal
      header={<FormHeader title="Set up 2-Step Verification" subtitle="Scan the QR with your authenticator app and save recovery codes." />}
      footer={<span><Link className="text-blue-600" to={link.to}>Skip and verify later</Link></span>}
    >
      <MfaSetupForm />
    </LayoutMinimal>
  );
};

export default MfaSetupMinimal;
