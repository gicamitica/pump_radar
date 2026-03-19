import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/components/ui/card';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';
import type { ReadinessCheck } from '../../../domain/models';

interface ReadinessChecklistProps {
  checks: ReadinessCheck[];
}

export function ReadinessChecklist({ checks }: ReadinessChecklistProps) {
  const { t } = useTranslation('guidedSetup');

  const passedCount = checks.filter((c) => c.passed).length;
  const allPassed = passedCount === checks.length;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{t('readiness.title')}</CardTitle>
          <div
            className={cn(
              'flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full',
              allPassed 
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' 
                : 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
            )}
          >
            {allPassed ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5" />
            )}
            {t('readiness.status', { passed: passedCount, total: checks.length })}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {t('readiness.description', 'System requirements for optimal performance')}
        </p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-2 flex-1">
          {checks.map((check) => (
            <div
              key={check.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                check.passed 
                  ? 'bg-emerald-500/5 border-emerald-500/20' 
                  : 'bg-muted/30 border-transparent'
              )}
            >
              {check.passed ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span
                className={cn(
                  'text-sm',
                  check.passed ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {t(`readiness.checks.${check.key}`)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t">
          <p className="text-xs text-muted-foreground text-center">
            {allPassed 
              ? t('readiness.allPassed', '✓ All systems ready') 
              : t('readiness.pending', 'Complete setup steps to enable all features')
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
