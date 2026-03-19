import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/shared/ui/shadcn/components/ui/card';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';
import {
  Settings,
  UserPlus,
  UsersRound,
  Mail,
  Shield,
  LayoutGrid,
  Check,
  Compass,
  ArrowRight,
  SkipForward,
} from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';
import { useExpandable } from '@/shared/hooks/useExpandable';
import { ExpandablePanel } from '@/shared/ui/components/ExpandablePanel';
import type { SetupStep, SetupStepId, TourSetId } from '../../../domain/models';

interface SetupWizardProps {
  steps: SetupStep[];
  currentStepId: SetupStepId | null;
  tourCompletions: Record<string, boolean>;
  onSelectStep: (stepId: SetupStepId) => void;
  onCompleteStep: (stepId: SetupStepId) => void;
  onSkipStep: (stepId: SetupStepId) => void;
  onStartTour: (tourId: TourSetId) => void;
  isUpdating?: boolean;
}

type ConfigureAction = 'invite-users' | 'create-teams' | null;

const stepConfig: Record<SetupStepId, { icon: typeof Settings; path: string; tourId?: TourSetId; color: string; dialogAction?: ConfigureAction }> = {
  'workspace-basics': { icon: Settings, path: '/', color: 'text-slate-600 dark:text-slate-400' },
  'invite-users': { icon: UserPlus, path: '/', tourId: 'invite-users', color: 'text-blue-600 dark:text-blue-400', dialogAction: 'invite-users' },
  'create-teams': { icon: UsersRound, path: '/', tourId: 'create-teams', color: 'text-purple-600 dark:text-purple-400', dialogAction: 'create-teams' },
  'configure-email': { icon: Mail, path: '/', tourId: 'configure-email', color: 'text-amber-600 dark:text-amber-400' },
  'review-security': { icon: Shield, path: '/', color: 'text-rose-600 dark:text-rose-400' },
  'explore-apps': { icon: LayoutGrid, path: '/', tourId: 'explore-apps', color: 'text-emerald-600 dark:text-emerald-400' },
};

const statusConfig = {
  pending: { label: 'Pending', variant: 'outline' as const, className: 'border-muted-foreground/30 text-muted-foreground bg-transparent' },
  in_progress: { label: 'In Progress', variant: 'default' as const, className: 'bg-primary/15 text-primary border-primary/30 hover:bg-primary/20' },
  completed: { label: 'Completed', variant: 'secondary' as const, className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
  skipped: { label: 'Skipped', variant: 'outline' as const, className: 'border-muted-foreground/20 text-muted-foreground/70 bg-transparent' },
};

export function SetupWizard({
  steps,
  currentStepId,
  tourCompletions,
  onSelectStep,
  onCompleteStep,
  onSkipStep,
  onStartTour,
  isUpdating,
}: SetupWizardProps) {
  const { t } = useTranslation('guidedSetup');
  
  // Use the expandable hook for accordion behavior
  const { isExpanded, toggle } = useExpandable<SetupStepId>({
    defaultExpanded: currentStepId ?? undefined,
    allowMultiple: false,
    onChange: (expandedIds) => {
      if (expandedIds.length > 0) {
        onSelectStep(expandedIds[0]);
      }
    },
  });

  // Sync with external currentStepId changes
  useEffect(() => {
    if (currentStepId && !isExpanded(currentStepId)) {
      toggle(currentStepId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepId]);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <h2 className="text-lg font-semibold">{t('wizard.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('wizard.description')}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {steps.map((step, index) => {
            const config = stepConfig[step.id];
            const Icon = config.icon;
            const status = statusConfig[step.status];
            const stepIsExpanded = isExpanded(step.id);
            const isCompleted = step.status === 'completed';
            const isSkipped = step.status === 'skipped';
            const isInProgress = step.status === 'in_progress';
            const hasTour = config.tourId && !tourCompletions[config.tourId];

            const headerContent = (
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div
                    className={cn(
                      'h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300',
                      isCompleted
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : isSkipped
                          ? 'bg-muted text-muted-foreground'
                          : isInProgress
                            ? 'bg-primary/15 text-primary ring-2 ring-primary/20'
                            : 'bg-muted/80 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5 animate-in zoom-in duration-300" />
                    ) : (
                      <Icon className={cn('h-5 w-5 transition-transform duration-300', !isSkipped && 'group-hover:scale-110')} />
                    )}
                  </div>
                  {isInProgress && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'font-medium transition-colors',
                        isCompleted && 'line-through text-muted-foreground',
                        isSkipped && 'text-muted-foreground'
                      )}
                    >
                      {t(`wizard.steps.${step.id}.title`)}
                    </span>
                    <Badge 
                      variant={status.variant} 
                      className={cn('text-xs px-1.5 py-0 border', status.className)}
                    >
                      {t(`wizard.status.${step.status}`)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {t(`wizard.steps.${step.id}.shortDescription`)}
                  </p>
                </div>
              </div>
            );

            return (
              <ExpandablePanel
                key={step.id}
                id={step.id}
                isExpanded={stepIsExpanded}
                onToggle={() => toggle(step.id)}
                header={headerContent}
                disabled={isUpdating}
                className={cn(
                  'group',
                  stepIsExpanded 
                    ? 'border-primary/50 bg-gradient-to-br from-primary/5 to-transparent shadow-sm' 
                    : 'hover:bg-muted/30 hover:border-muted-foreground/20',
                  isCompleted && 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent',
                  isSkipped && 'opacity-50 hover:opacity-70'
                )}
                headerClassName="p-4"
                contentClassName="pt-4"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground pl-[60px]">
                    {t(`wizard.steps.${step.id}.description`)}
                  </p>

                  {!isCompleted && !isSkipped && (
                    <div className="flex items-center gap-2 pl-[60px] flex-wrap">
                      <Button
                        size="sm"
                        className="gap-2 shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30 transition-all"
                        onClick={() => {}}
                        disabled={isUpdating}
                      >
                        {t('wizard.configure')}
                        <ArrowRight className="h-4 w-4" />
                      </Button>

                      {hasTour && config.tourId && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 hover:bg-primary/5 hover:border-primary/30"
                          onClick={() => onStartTour(config.tourId!)}
                          disabled={isUpdating}
                        >
                          <Compass className="h-4 w-4" />
                          {t('wizard.guideMe')}
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-muted-foreground hover:text-foreground"
                        onClick={() => onSkipStep(step.id)}
                        disabled={isUpdating}
                      >
                        <SkipForward className="h-4 w-4" />
                        {t('wizard.skip')}
                      </Button>
                    </div>
                  )}

                  {!isCompleted && !isSkipped && (
                    <div className="pl-[60px]">
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
                        onClick={() => onCompleteStep(step.id)}
                        disabled={isUpdating}
                      >
                        {t('wizard.markComplete')}
                      </Button>
                    </div>
                  )}
                </div>
              </ExpandablePanel>
            );
          })}
        </CardContent>
      </Card>
    </>
  );
}
