import React from 'react';
import LayoutMinimal from '../../layouts/LayoutMinimal';
import ResetForm from '../../components/forms/ResetForm';
import FormHeader from '../../../../../shared/ui/components/forms/layout/FormHeader';
import { nextLink } from '../../components/navLinks';
import { Link } from 'react-router-dom';

const ResetMinimal: React.FC = () => {
  const link = nextLink('reset','minimal');
  return (
    <LayoutMinimal
      header={<FormHeader title="Reset your password" />}
      footer={<span><Link className="text-blue-600" to={link.to}>Back to login</Link></span>}
    >
      <ResetForm />
    </LayoutMinimal>
  );
};

export default ResetMinimal;
