import React from 'react';
import LayoutMinimal from '../../layouts/LayoutMinimal';
import RegisterForm from '../../components/forms/RegisterForm';
import FormHeader from '../../../../../shared/ui/components/forms/layout/FormHeader';
import { nextLink } from '../../components/navLinks';
import { Link, useNavigate } from 'react-router-dom';

// PumpRadar Logo Component
const PumpRadarLogo = () => (
  <div className="flex items-center justify-center gap-3 mb-6">
    <img src="/logo-pumpradar.png" alt="PumpRadar" className="w-12 h-12 rounded-xl" />
    <span className="text-2xl font-bold">PumpRadar</span>
  </div>
);

const RegisterMinimal: React.FC = () => {
  const nav = useNavigate();
  const link = nextLink('register','minimal');
  
  const handleRegisterSuccess = (email: string) => {
    const params = new URLSearchParams({ email });
    nav(`/auth/verify-email?${params.toString()}`);
  };

  return (
    <LayoutMinimal
      header={
        <>
          <PumpRadarLogo />
          <FormHeader title="Create your account" subtitle="Start your free 7-day trial" />
        </>
      }
      footer={<span>Already have an account? <Link className="text-blue-600" to={link.to}>Sign in</Link></span>}
    >
      <div className="mb-6 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        Google sign-up is temporarily unavailable. Create your account with email and continue to card setup after verification.
      </div>
      <RegisterForm onSuccess={handleRegisterSuccess} />
      
      <p className="text-xs text-muted-foreground text-center mt-4">
        By signing up, you agree to our Terms of Service and Privacy Policy.
      </p>
    </LayoutMinimal>
  );
};

export default RegisterMinimal;
