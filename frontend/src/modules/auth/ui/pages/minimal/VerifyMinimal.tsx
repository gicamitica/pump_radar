import React from 'react';
import LayoutMinimal from '../../layouts/LayoutMinimal';
import VerifyEmailForm from '../../components/forms/VerifyEmailForm';
import FormHeader from '../../../../../shared/ui/components/forms/layout/FormHeader';
import { nextLink } from '../../components/navLinks';
import { Link } from 'react-router-dom';

const VerifyMinimal: React.FC = () => {
  const link = nextLink('verify','minimal');
  return (
    <LayoutMinimal
      header={<FormHeader title="Verify your email" />}
      footer={<span><Link className="text-blue-600" to={link.to}>Back to login</Link></span>}
    >
      <VerifyEmailForm />
    </LayoutMinimal>
  );
};

export default VerifyMinimal;
