import React from 'react';
import OauthButton from '@/components/forms/buttons/OauthButton';
import { useTranslation } from 'react-i18next';

const OauthButtons: React.FC = () => {
  const { t } = useTranslation('auth');

  return (
    <div className="grid grid-cols-2 gap-2">
      <OauthButton>{t('continueWithGoogle','Continue with Google')}</OauthButton>
      <OauthButton>{t('continueWithApple','Continue with Apple')}</OauthButton>
    </div>
  );
};

export default OauthButtons;
