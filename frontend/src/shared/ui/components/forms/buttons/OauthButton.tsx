import React from 'react';
import ActionButton from '@/components/forms/buttons/ActionButton';

type OauthButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const OauthButton: React.FC<OauthButtonProps> = ({ ...rest }) => (
  <ActionButton variant="secondary" {...rest} />
);

export default OauthButton;
