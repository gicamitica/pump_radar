import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/shared/ui/shadcn/components/ui/card';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { PartyPopper, LayoutDashboard, Activity, RotateCcw } from 'lucide-react';

interface CompletionStateProps {
  onReset?: () => void;
}

export function CompletionState({ onReset }: CompletionStateProps) {
  const { t } = useTranslation('guidedSetup');
  const navigate = useNavigate();

  return (
    <Card className="bg-gradient-to-br from-success/10 via-background to-background border-success/20">
      <CardContent className="pt-8 pb-8">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center">
              <PartyPopper className="h-8 w-8 text-success" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{t('completion.title')}</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              {t('completion.description')}
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">{t('completion.switchLayout')}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                className="gap-2 w-full sm:w-auto"
                onClick={() => navigate('/')}
              >
                <LayoutDashboard className="h-4 w-4" />
                {t('completion.adminControlCenter')}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 w-full sm:w-auto"
                onClick={() => navigate('/home/activity')}
              >
                <Activity className="h-4 w-4" />
                {t('completion.actionActivityHub')}
              </Button>
            </div>
          </div>

          {onReset && (
            <div className="pt-4">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground"
                onClick={onReset}
              >
                <RotateCcw className="h-4 w-4" />
                {t('completion.resetSetup')}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
