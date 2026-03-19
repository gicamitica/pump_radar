import React from 'react';
import LayoutMinimal from '../../layouts/LayoutMinimal';
import RegisterForm from '../../components/forms/RegisterForm';
import FormHeader from '../../../../../shared/ui/components/forms/layout/FormHeader';
import FormDivider from '../../../../../shared/ui/components/forms/layout/FormDivider';
import { nextLink } from '../../components/navLinks';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui/shadcn/components/ui/button';

// Google Icon SVG
const GoogleIcon = () => (
  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const RegisterMinimal: React.FC = () => {
  const nav = useNavigate();
  const link = nextLink('register','minimal');
  
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const handleGoogleSignup = () => {
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };
  
  const handleRegisterSuccess = () => {
    // After registration, redirect to verify email page instead of dashboard
    nav('/auth/verify-email');
  };

  return (
    <LayoutMinimal
      header={<FormHeader title="Create your account" subtitle="Start your free 24-hour trial" />}
      footer={<span>Already have an account? <Link className="text-blue-600" to={link.to}>Sign in</Link></span>}
    >
      <Button 
        variant="outline" 
        className="w-full h-12 text-base font-medium mb-4" 
        onClick={handleGoogleSignup}
        data-testid="google-signup-btn"
      >
        <GoogleIcon />
        Sign up with Google
      </Button>
      
      <FormDivider />
      
      <RegisterForm onSuccess={handleRegisterSuccess} />
      
      <p className="text-xs text-muted-foreground text-center mt-4">
        By signing up, you agree to our Terms of Service and Privacy Policy.
      </p>
    </LayoutMinimal>
  );
};

export default RegisterMinimal;
