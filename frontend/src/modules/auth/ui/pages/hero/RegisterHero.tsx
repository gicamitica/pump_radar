import React from 'react';
import LayoutHero from '../../layouts/LayoutHero';
import RegisterForm from '../../components/forms/RegisterForm';
import FormHeader from '../../../../../shared/ui/components/forms/layout/FormHeader';
import { nextLink } from '../../components/navLinks';
import { Link, useNavigate } from 'react-router-dom';
import Hero from '../../layouts/Hero';

const RegisterHero: React.FC = () => {
  const nav = useNavigate();
  const link = nextLink('register','hero');
  return (
    <LayoutHero
      header={<FormHeader title="Create your account" />}
      hero={<Hero />}
      footer={<span>Already have an account? <Link className="text-blue-600" to={link.to}>Sign in</Link></span>}
    >
      <RegisterForm onSuccess={() => nav('/')} />
    </LayoutHero>
  );
};

export default RegisterHero;
