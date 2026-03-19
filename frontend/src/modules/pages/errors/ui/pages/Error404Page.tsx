import { useTranslation } from 'react-i18next';
import { FileQuestion } from 'lucide-react';
import { ErrorLayout } from '../components';

export default function Error404Page() {
  const { t } = useTranslation('errors');

  return (
    <ErrorLayout
      code="404"
      title={t('notFound.messageTitle')}
      description={t('notFound.messageDescription')}
      icon={FileQuestion}
      variant="warning"
      showReload={false}
      showHelp
    />
  );
}
