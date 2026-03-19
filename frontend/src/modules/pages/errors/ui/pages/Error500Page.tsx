import { useTranslation } from 'react-i18next';
import { ServerCrash } from 'lucide-react';
import { ErrorLayout } from '../components';

export default function Error500Page() {
  const { t } = useTranslation('errors');

  return (
    <ErrorLayout
      code="500"
      title={t('serverError.messageTitle')}
      description={t('serverError.messageDescription')}
      icon={ServerCrash}
      variant="error"
      showGoBack={false}
      showHelp
    />
  );
}
