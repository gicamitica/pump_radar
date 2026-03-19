import React from 'react';
import LayoutMinimal from '../../layouts/LayoutMinimal';
import ForgotForm from '../../components/forms/ForgotForm';
import FormHeader from '../../../../../shared/ui/components/forms/layout/FormHeader';
import { nextLink } from '../../components/navLinks';
import { Link } from 'react-router-dom';

const ForgotMinimal: React.FC = () => {
  const link = nextLink('forgot','minimal');
  return (
    <LayoutMinimal
      header={<FormHeader title="Forgot your password?" subtitle="Enter your email to receive a reset link." />}
      footer={<span><Link className="text-blue-600" to={link.to}>Back to login</Link></span>}
    >
      <ForgotForm />
    </LayoutMinimal>
  );
};

export default ForgotMinimal;
