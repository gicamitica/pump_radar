import React from 'react';
import LayoutMinimal from '../../layouts/LayoutMinimal';
import RegisterForm from '../../components/forms/RegisterForm';
import FormHeader from '../../../../../shared/ui/components/forms/layout/FormHeader';
import { nextLink } from '../../components/navLinks';
import { Link, useNavigate } from 'react-router-dom';

const RegisterMinimal: React.FC = () => {
  const nav = useNavigate();
  const link = nextLink('register','minimal');
  
  const handleRegisterSuccess = () => {
    // After registration, redirect to verify email page
    nav('/auth/verify-email');
  };

  return (
    <LayoutMinimal
      header={<FormHeader title="Create your account" subtitle="Start your free 24-hour trial" />}
      footer={<span>Already have an account? <Link className="text-blue-600" to={link.to}>Sign in</Link></span>}
    >
      <RegisterForm onSuccess={handleRegisterSuccess} />
      
      <p className="text-xs text-muted-foreground text-center mt-4">
        By signing up, you agree to our Terms of Service and Privacy Policy.
      </p>
    </LayoutMinimal>
  );
};

export default RegisterMinimal;
