import React from 'react';
import LayoutMinimal from '../../layouts/LayoutMinimal';
import RegisterForm from '../../components/forms/RegisterForm';
import FormHeader from '../../../../../shared/ui/components/forms/layout/FormHeader';
import { nextLink } from '../../components/navLinks';
import { Link, useNavigate } from 'react-router-dom';

const RegisterMinimal: React.FC = () => {
  const nav = useNavigate();
  const link = nextLink('register','minimal');
  return (
    <LayoutMinimal
      header={<FormHeader title="Create your account" />}
      footer={<span>Already have an account? <Link className="text-blue-600" to={link.to}>Sign in</Link></span>}
    >
      <RegisterForm onSuccess={() => nav('/dashboard')} />
    </LayoutMinimal>
  );
};

export default RegisterMinimal;
