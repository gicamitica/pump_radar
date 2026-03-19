import React from 'react';
import ActionButton from '@/components/forms/buttons/ActionButton';

const VerifyEmailForm: React.FC<{ onResend?: () => void }> = ({ onResend }) => (
  <div className="space-y-4">
    <p className="text-slate-600 text-sm">We sent you a verification link. Please check your inbox.</p>
    <ActionButton onClick={onResend} className="w-full">Resend link</ActionButton>
  </div>
);

export default VerifyEmailForm;
