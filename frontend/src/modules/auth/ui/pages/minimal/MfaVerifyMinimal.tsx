import React from 'react';
import LayoutMinimal from '../../layouts/LayoutMinimal';
import MfaVerifyForm from '../../components/forms/MfaVerifyForm';
import FormHeader from '../../../../../shared/ui/components/forms/layout/FormHeader';
import { nextLink } from '../../components/navLinks';
import { Link } from 'react-router-dom';

const MfaVerifyMinimal: React.FC = () => {
  const link = nextLink('mfaVerify','minimal');
  return (
    <LayoutMinimal
      header={<FormHeader title="Enter verification code" />}
      footer={<span><Link className="text-blue-600" to={link.to}>Back to login</Link></span>}
    >
      <MfaVerifyForm />
    </LayoutMinimal>
  );
};

export default MfaVerifyMinimal;
