import { useTranslation } from 'react-i18next';
import { CardContent } from '@/shared/ui/shadcn/components/ui/card';
import { Clock, CheckCircle2, Sparkles, Target } from 'lucide-react';
import { SteppedProgressBar } from '@/shared/ui/components/SteppedProgressBar';
import type { SetupProgress } from '../../../domain/models';
import SpotlightCard from '../SpotlightCard';

interface SetupProgressHeaderProps {
  progress: SetupProgress;
}

export function SetupProgressHeader({ progress }: SetupProgressHeaderProps) {
  const { t } = useTranslation('guidedSetup');

  const percentage = progress.totalSteps > 0
    ? Math.round((progress.completedSteps / progress.totalSteps) * 100)
    : 0;

  if (progress.isComplete) {
    return (
      <SpotlightCard>
        <CardContent className="relative pt-6 pb-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center animate-in zoom-in duration-500">
              <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  {t('progress.complete')}
                </h1>
                <Sparkles className="h-5 w-5 text-emerald-500 animate-pulse" />
              </div>
              <p className="text-muted-foreground mt-0.5">
                {t('progress.completeDescription')}
              </p>
            </div>
          </div>
        </CardContent>
      </SpotlightCard>
    );
  }

  return (
    <SpotlightCard className="relative overflow-hidden">
      <CardContent className="relative pt-6 pb-6">
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {t('progress.title')}
                </h1>
                <p className="text-muted-foreground mt-0.5">
                  {t('progress.description')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-sm text-muted-foreground shrink-0">
              <Clock className="h-4 w-4" />
              <span>
                {t('progress.estimatedTime', { minutes: progress.estimatedMinutesRemaining })}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {t('progress.stepsCompleted', {
                  completed: progress.completedSteps,
                  total: progress.totalSteps,
                })}
              </span>
              <span className="font-bold text-primary">{percentage}%</span>
            </div>
            
            <SteppedProgressBar
              value={percentage}
              steps={progress.totalSteps}
              completedSteps={progress.completedSteps}
              height="md"
              autoVariant
            />
          </div>
        </div>
      </CardContent>
    </SpotlightCard>
  );
}
