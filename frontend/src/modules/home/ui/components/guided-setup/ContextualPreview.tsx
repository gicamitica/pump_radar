import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/components/ui/card';
import { Info } from 'lucide-react';
import type { SetupStepId } from '../../../domain/models';

interface ContextualPreviewProps {
  selectedStepId: SetupStepId | null;
}

export function ContextualPreview({ selectedStepId }: ContextualPreviewProps) {
  const { t } = useTranslation('guidedSetup');

  if (!selectedStepId) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full min-h-[200px]">
          <div className="text-center text-muted-foreground">
            <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('preview.selectStep')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
        <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          {t(`preview.steps.${selectedStepId}.title`)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t(`preview.steps.${selectedStepId}.explanation`)}
        </p>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">{t('preview.whatYouWillDo')}</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            {(t(`preview.steps.${selectedStepId}.tasks`, { returnObjects: true }) as string[]).map(
              (task, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  {task}
                </li>
              )
            )}
          </ul>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">{t('preview.tip')}:</span>{' '}
            {t(`preview.steps.${selectedStepId}.tip`)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
